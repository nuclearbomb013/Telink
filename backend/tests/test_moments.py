"""
Tests for Moments API endpoints.

Covers:
- List visibility (public vs authenticated)
- Create moment (requires auth)
- Delete permission (only author)
- Like toggle (idempotent)
- Comment CRUD + count consistency
- 404 handling

Uses the real test database via the FastAPI TestClient pattern.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from app.main import create_app
from app.models.user import User, UserRole
from app.models.moment import Moment, MomentLike, MomentComment
from app.core.security import TokenManager, PasswordManager
from app.db.session import async_session_maker


async def _create_test_user() -> User:
    """Create a test user with a valid password hash."""
    import uuid
    async with async_session_maker() as s:
        user = User(
            username=f"tm_{uuid.uuid4().hex[:6]}",
            email=f"tm_{uuid.uuid4().hex[:6]}@t.com",
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


async def _cleanup_user(user_id: int):
    async with async_session_maker() as s:
        # Delete moments and related data
        result = await s.execute(select(Moment).where(Moment.author_id == user_id))
        for m in result.scalars():
            # Delete likes
            like_result = await s.execute(select(MomentLike).where(MomentLike.moment_id == m.id))
            for like in like_result.scalars():
                await s.delete(like)
            # Delete comments
            comment_result = await s.execute(select(MomentComment).where(MomentComment.moment_id == m.id))
            for c in comment_result.scalars():
                await s.delete(c)
            await s.delete(m)
        user = await s.get(User, user_id)
        if user:
            await s.delete(user)
        await s.commit()


class TestMomentsAPI:
    """Moments API integration tests."""

    @pytest.mark.asyncio
    async def test_list_empty(self):
        """Anonymous users get empty public list."""
        app = create_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.get("/api/v1/moments")
            assert r.status_code == 200
            assert r.json()["data"]["moments"] == []

    @pytest.mark.asyncio
    async def test_create_requires_auth(self):
        """Creating a moment without auth returns 401."""
        app = create_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post("/api/v1/moments", json={"content": "x"})
            assert r.status_code == 401

    @pytest.mark.asyncio
    async def test_create_and_read(self):
        """Create a moment and verify it appears in the list."""
        user = await _create_test_user()
        try:
            app = create_app()
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post(
                    "/api/v1/moments",
                    json={"content": "Hello pytest"},
                    headers=_token(user),
                )
                assert r.status_code == 200
                data = r.json()
                assert data["data"]["content"] == "Hello pytest"
                assert data["data"]["author_name"] == user.username

                # Verify it appears in list
                r = await client.get("/api/v1/moments")
                contents = [m["content"] for m in r.json()["data"]["moments"]]
                assert "Hello pytest" in contents
        finally:
            await _cleanup_user(user.id)

    @pytest.mark.asyncio
    async def test_visibility(self):
        """Public visible to all, private only to author."""
        u1 = await _create_test_user()
        u2 = await _create_test_user()
        try:
            app = create_app()
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                # u1 creates public and private
                await client.post("/api/v1/moments", json={"content": "pub"}, headers=_token(u1))
                await client.post("/api/v1/moments", json={"content": "priv", "visibility": "private"}, headers=_token(u1))

                # Anonymous sees only public
                r = await client.get("/api/v1/moments")
                contents = [m["content"] for m in r.json()["data"]["moments"]]
                assert "pub" in contents
                assert "priv" not in contents

                # u2 sees only public
                r = await client.get("/api/v1/moments", headers=_token(u2))
                contents = [m["content"] for m in r.json()["data"]["moments"]]
                assert "priv" not in contents

                # u1 sees both
                r = await client.get("/api/v1/moments", headers=_token(u1))
                contents = [m["content"] for m in r.json()["data"]["moments"]]
                assert "pub" in contents
                assert "priv" in contents
        finally:
            await _cleanup_user(u1.id)
            await _cleanup_user(u2.id)

    @pytest.mark.asyncio
    async def test_delete_permission(self):
        """Only author can delete."""
        u1 = await _create_test_user()
        u2 = await _create_test_user()
        try:
            app = create_app()
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post("/api/v1/moments", json={"content": "to_del"}, headers=_token(u1))
                mid = r.json()["data"]["id"]

                # u2 cannot delete u1's moment
                r = await client.delete(f"/api/v1/moments/{mid}", headers=_token(u2))
                assert r.json()["error"]["code"] == "FORBIDDEN"

                # u1 can delete
                r = await client.delete(f"/api/v1/moments/{mid}", headers=_token(u1))
                assert r.json()["success"] is True
        finally:
            await _cleanup_user(u1.id)
            await _cleanup_user(u2.id)

    @pytest.mark.asyncio
    async def test_like_idempotent(self):
        """Like -> unlike -> like toggle works correctly."""
        user = await _create_test_user()
        try:
            app = create_app()
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post("/api/v1/moments", json={"content": "like_test"}, headers=_token(user))
                mid = r.json()["data"]["id"]

                # Like
                r = await client.post(f"/api/v1/moments/{mid}/like", headers=_token(user))
                assert r.json()["data"]["liked"] is True
                assert r.json()["data"]["likes"] == 1

                # Unlike
                r = await client.post(f"/api/v1/moments/{mid}/like", headers=_token(user))
                assert r.json()["data"]["liked"] is False
                assert r.json()["data"]["likes"] == 0

                # Like again
                r = await client.post(f"/api/v1/moments/{mid}/like", headers=_token(user))
                assert r.json()["data"]["liked"] is True
                assert r.json()["data"]["likes"] == 1
        finally:
            await _cleanup_user(user.id)

    @pytest.mark.asyncio
    async def test_comment_crud_and_count(self):
        """Comment create, list, delete, and comment_count consistency."""
        u1 = await _create_test_user()
        u2 = await _create_test_user()
        try:
            app = create_app()
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post("/api/v1/moments", json={"content": "c_test"}, headers=_token(u1))
                mid = r.json()["data"]["id"]
                assert r.json()["data"]["comment_count"] == 0

                # u2 comments
                r = await client.post(
                    f"/api/v1/moments/{mid}/comments",
                    json={"content": "Nice!"},
                    headers=_token(u2),
                )
                assert r.json()["data"]["content"] == "Nice!"
                cid = r.json()["data"]["id"]

                # List comments
                r = await client.get(f"/api/v1/moments/{mid}/comments")
                assert len(r.json()["data"]) == 1

                # Comment count updated
                r = await client.get("/api/v1/moments", headers=_token(u1))
                target = [m for m in r.json()["data"]["moments"] if m["id"] == mid][0]
                assert target["comment_count"] == 1

                # u1 cannot delete u2's comment
                r = await client.delete(f"/api/v1/moments/{mid}/comments/{cid}", headers=_token(u1))
                assert r.json()["error"]["code"] == "FORBIDDEN"

                # u2 deletes
                r = await client.delete(f"/api/v1/moments/{mid}/comments/{cid}", headers=_token(u2))
                assert r.json()["success"] is True

                # Count decreased
                r = await client.get("/api/v1/moments", headers=_token(u1))
                target = [m for m in r.json()["data"]["moments"] if m["id"] == mid][0]
                assert target["comment_count"] == 0
        finally:
            await _cleanup_user(u1.id)
            await _cleanup_user(u2.id)

    @pytest.mark.asyncio
    async def test_not_found(self):
        """Non-existent moment returns proper error."""
        app = create_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.get("/api/v1/moments/999999/comments")
            assert r.json()["error"]["code"] == "NOT_FOUND"
