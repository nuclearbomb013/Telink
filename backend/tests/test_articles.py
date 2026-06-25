"""
Minimal tests for Articles API endpoints.

Covers:
- Create article (requires auth)
- List published articles
- Get article by slug
- Update article
- Publish draft
- Delete article
- Tags correctly returned after create
"""

import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import select, delete

from app.models.user import User, UserRole
from app.models.article import Article, ArticleTag
from app.core.security import TokenManager, PasswordManager


async def _create_user(session_maker: async_sessionmaker[AsyncSession]) -> User:
    async with session_maker() as s:
        user = User(
            username=f"art_{uuid.uuid4().hex[:6]}",
            email=f"art_{uuid.uuid4().hex[:6]}@t.com",
            password_hash=PasswordManager.hash_password("test1234"),
            role=UserRole.USER,
            is_active=True,
        )
        s.add(user)
        await s.commit()
        await s.refresh(user)
        return user


def _token(user: User) -> dict:
    token = TokenManager.create_access_token(str(user.id))
    return {"Authorization": f"Bearer {token}"}


async def _cleanup(session_maker, *users):
    async with session_maker() as s:
        for user in users:
            await s.execute(delete(ArticleTag).where(
                ArticleTag.article_id.in_(
                    select(Article.id).where(Article.author_id == user.id)
                )
            ))
            await s.execute(delete(Article).where(Article.author_id == user.id))
            u = await s.get(User, user.id)
            if u:
                await s.delete(u)
        await s.commit()


class TestArticlesAPI:

    @pytest.mark.asyncio
    async def test_create_requires_auth(self, test_app):
        transport = ASGITransport(app=test_app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post("/api/v1/articles", json={
                "title": "Test", "content": "Test content", "category": "frontend"
            })
            assert r.status_code == 401

    @pytest.mark.asyncio
    async def test_create_and_list(self, test_app, test_session_maker):
        user = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post("/api/v1/articles", json={
                    "title": "Hello World",
                    "content": "Some content here",
                    "category": "frontend",
                    "tags": ["python", "fastapi"],
                }, headers=_token(user))
                assert r.status_code == 200
                data = r.json()
                assert data["data"]["title"] == "Hello World"
                assert sorted(data["data"]["tags"]) == ["fastapi", "python"]
                assert data["data"]["slug"]
                assert data["data"]["status"] == "pending"  # default status

                # Get by slug (won't find unpublished)
                r = await client.get(f"/api/v1/articles/slug/{data['data']['slug']}")
                assert r.json()["success"] is False

                # Publish
                aid = data["data"]["id"]
                r = await client.post(f"/api/v1/articles/{aid}/publish", headers=_token(user))
                assert r.json()["success"] is True
                assert r.json()["data"]["status"] == "published"

                # Now visible in list
                r = await client.get("/api/v1/articles")
                assert r.json()["success"] is True
                titles = [a["title"] for a in r.json()["data"]["articles"]]
                assert "Hello World" in titles
        finally:
            await _cleanup(test_session_maker, user)

    @pytest.mark.asyncio
    async def test_update_article(self, test_app, test_session_maker):
        user = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post("/api/v1/articles", json={
                    "title": "Original", "content": "x", "category": "backend",
                }, headers=_token(user))
                aid = r.json()["data"]["id"]

                r = await client.put(f"/api/v1/articles/{aid}", json={
                    "title": "Updated Title", "tags": ["newtag"],
                }, headers=_token(user))
                assert r.json()["success"] is True
                assert r.json()["data"]["title"] == "Updated Title"
                assert "newtag" in r.json()["data"]["tags"]
        finally:
            await _cleanup(test_session_maker, user)

    @pytest.mark.asyncio
    async def test_delete_article(self, test_app, test_session_maker):
        user = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post("/api/v1/articles", json={
                    "title": "ToDelete", "content": "x", "category": "backend",
                }, headers=_token(user))
                aid = r.json()["data"]["id"]

                r = await client.delete(f"/api/v1/articles/{aid}", headers=_token(user))
                assert r.json()["success"] is True
        finally:
            await _cleanup(test_session_maker, user)

    @pytest.mark.asyncio
    async def test_non_author_cannot_update_or_delete_article(self, test_app, test_session_maker):
        author = await _create_user(test_session_maker)
        other = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post("/api/v1/articles", json={
                    "title": "Protected", "content": "original", "category": "backend",
                }, headers=_token(author))
                aid = r.json()["data"]["id"]

                r = await client.put(
                    f"/api/v1/articles/{aid}",
                    json={"title": "stolen"},
                    headers=_token(other),
                )
                assert r.json()["success"] is False
                assert r.json()["error"]["code"] == "FORBIDDEN"

                r = await client.delete(f"/api/v1/articles/{aid}", headers=_token(other))
                assert r.json()["success"] is False
                assert r.json()["error"]["code"] == "FORBIDDEN"

                r = await client.get(f"/api/v1/articles/{aid}", headers=_token(author))
                assert r.json()["success"] is True
                assert r.json()["data"]["title"] == "Protected"
        finally:
            await _cleanup(test_session_maker, author, other)


class TestArticleDetailResponse:
    """Verify article detail (slug/ID) returns correct tags and consistent view behavior."""

    @pytest.mark.asyncio
    async def test_slug_detail_returns_tags(self, test_app, test_session_maker):
        """Published article by slug must include its tags."""
        user = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post("/api/v1/articles", json={
                    "title": "Tagged Article", "content": "Content here",
                    "category": "frontend", "tags": ["vue", "typescript"],
                }, headers=_token(user))
                aid = r.json()["data"]["id"]
                slug = r.json()["data"]["slug"]

                await client.post(f"/api/v1/articles/{aid}/publish", headers=_token(user))

                r = await client.get(f"/api/v1/articles/slug/{slug}")
                assert r.status_code == 200
                data = r.json()
                assert data["success"] is True
                assert "tags" in data["data"]
                assert sorted(data["data"]["tags"]) == ["typescript", "vue"]
        finally:
            await _cleanup(test_session_maker, user)

    @pytest.mark.asyncio
    async def test_id_detail_returns_tags(self, test_app, test_session_maker):
        """Published article by ID must include its tags."""
        user = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post("/api/v1/articles", json={
                    "title": "ID Article", "content": "Content here",
                    "category": "backend", "tags": ["python", "fastapi"],
                }, headers=_token(user))
                aid = r.json()["data"]["id"]

                await client.post(f"/api/v1/articles/{aid}/publish", headers=_token(user))

                r = await client.get(f"/api/v1/articles/{aid}")
                assert r.status_code == 200
                data = r.json()
                assert data["success"] is True
                assert "tags" in data["data"]
                assert sorted(data["data"]["tags"]) == ["fastapi", "python"]
        finally:
            await _cleanup(test_session_maker, user)

    @pytest.mark.asyncio
    async def test_slug_view_increment(self, test_app, test_session_maker):
        """Slug endpoint increments views on each public read."""
        user = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post("/api/v1/articles", json={
                    "title": "ViewCount", "content": "Content",
                    "category": "frontend",
                }, headers=_token(user))
                aid = r.json()["data"]["id"]
                slug = r.json()["data"]["slug"]
                await client.post(f"/api/v1/articles/{aid}/publish", headers=_token(user))

                r = await client.get(f"/api/v1/articles/slug/{slug}")
                assert r.json()["data"]["views"] >= 1
                views_after_first = r.json()["data"]["views"]

                r = await client.get(f"/api/v1/articles/slug/{slug}")
                assert r.json()["data"]["views"] == views_after_first + 1
        finally:
            await _cleanup(test_session_maker, user)

    @pytest.mark.asyncio
    async def test_id_view_increment(self, test_app, test_session_maker):
        """ID endpoint also increments views on public read (consistency)."""
        user = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post("/api/v1/articles", json={
                    "title": "IDViewCount", "content": "Content",
                    "category": "backend",
                }, headers=_token(user))
                aid = r.json()["data"]["id"]
                await client.post(f"/api/v1/articles/{aid}/publish", headers=_token(user))

                r = await client.get(f"/api/v1/articles/{aid}")
                assert r.json()["data"]["views"] >= 1
                views_after_first = r.json()["data"]["views"]

                r = await client.get(f"/api/v1/articles/{aid}")
                assert r.json()["data"]["views"] == views_after_first + 1
        finally:
            await _cleanup(test_session_maker, user)
