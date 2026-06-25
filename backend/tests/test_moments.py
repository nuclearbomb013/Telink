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
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import select

from app.models.user import User, UserRole
from app.models.moment import Moment, MomentLike, MomentComment
from app.core.security import TokenManager, PasswordManager


async def _create_test_user(session_maker: async_sessionmaker[AsyncSession]) -> User:
    """Create a test user with a valid password hash."""
    import uuid
    async with session_maker() as s:
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


async def _cleanup_user(session_maker: async_sessionmaker[AsyncSession], user_id: int):
    async with session_maker() as s:
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
    async def test_list_empty(self, test_app):
        """Anonymous users get empty public list."""
        transport = ASGITransport(app=test_app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.get("/api/v1/moments")
            assert r.status_code == 200
            assert r.json()["data"]["moments"] == []

    @pytest.mark.asyncio
    async def test_create_requires_auth(self, test_app):
        """Creating a moment without auth returns 401."""
        transport = ASGITransport(app=test_app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post("/api/v1/moments", json={"content": "x"})
            assert r.status_code == 401

    @pytest.mark.asyncio
    async def test_create_and_read(self, test_app, test_session_maker):
        """Create a moment and verify it appears in the list."""
        user = await _create_test_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
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
            await _cleanup_user(test_session_maker, user.id)

    @pytest.mark.asyncio
    async def test_visibility(self, test_app, test_session_maker):
        """Public visible to all, private only to author."""
        u1 = await _create_test_user(test_session_maker)
        u2 = await _create_test_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
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
            await _cleanup_user(test_session_maker, u1.id)
            await _cleanup_user(test_session_maker, u2.id)

    @pytest.mark.asyncio
    async def test_delete_permission(self, test_app, test_session_maker):
        """Only author can delete."""
        u1 = await _create_test_user(test_session_maker)
        u2 = await _create_test_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
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
            await _cleanup_user(test_session_maker, u1.id)
            await _cleanup_user(test_session_maker, u2.id)

    @pytest.mark.asyncio
    async def test_like_idempotent(self, test_app, test_session_maker):
        """Like (POST) is idempotent, unlike (DELETE) is idempotent."""
        user = await _create_test_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post("/api/v1/moments", json={"content": "like_test"}, headers=_token(user))
                mid = r.json()["data"]["id"]

                # Like
                r = await client.post(f"/api/v1/moments/{mid}/like", headers=_token(user))
                assert r.json()["data"]["liked"] is True
                assert r.json()["data"]["likes"] == 1

                # Like again (idempotent)
                r = await client.post(f"/api/v1/moments/{mid}/like", headers=_token(user))
                assert r.json()["data"]["liked"] is True
                assert r.json()["data"]["likes"] == 1

                # Unlike
                r = await client.delete(f"/api/v1/moments/{mid}/like", headers=_token(user))
                assert r.json()["data"]["liked"] is False
                assert r.json()["data"]["likes"] == 0

                # Unlike again (idempotent)
                r = await client.delete(f"/api/v1/moments/{mid}/like", headers=_token(user))
                assert r.json()["data"]["liked"] is False
                assert r.json()["data"]["likes"] == 0

                # Like again
                r = await client.post(f"/api/v1/moments/{mid}/like", headers=_token(user))
                assert r.json()["data"]["liked"] is True
                assert r.json()["data"]["likes"] == 1
        finally:
            await _cleanup_user(test_session_maker, user.id)

    @pytest.mark.asyncio
    async def test_comment_crud_and_count(self, test_app, test_session_maker):
        """Comment create, list, delete, and comment_count consistency."""
        u1 = await _create_test_user(test_session_maker)
        u2 = await _create_test_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
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
                assert len(r.json()["data"]["comments"]) == 1
                assert r.json()["data"]["total"] == 1

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
            await _cleanup_user(test_session_maker, u1.id)
            await _cleanup_user(test_session_maker, u2.id)

    @pytest.mark.asyncio
    async def test_not_found(self, test_app):
        """Non-existent moment returns proper error."""
        transport = ASGITransport(app=test_app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.get("/api/v1/moments/999999/comments")
            assert r.json()["error"]["code"] == "NOT_FOUND"


class TestMomentsFollowingOnly:
    """Tests for following_only filter and visibility interactions."""

    @pytest.mark.asyncio
    async def test_following_only_unauthorized(self, test_app):
        """following_only=true without auth returns UNAUTHORIZED."""
        transport = ASGITransport(app=test_app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.get("/api/v1/moments?following_only=true")
            assert r.json()["success"] is False
            assert r.json()["error"]["code"] == "UNAUTHORIZED"

    @pytest.mark.asyncio
    async def test_followers_visible_to_follower(self, test_app, test_session_maker):
        """A follower can see followers-visibility moments, non-follower cannot."""
        uA = await _create_test_user(test_session_maker)
        uB = await _create_test_user(test_session_maker)  # uB follows uA
        uC = await _create_test_user(test_session_maker)  # uC does not follow uA
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                # uA creates a public and followers moment
                await client.post(
                    "/api/v1/moments",
                    json={"content": "pub from A", "visibility": "public"},
                    headers=_token(uA),
                )
                await client.post(
                    "/api/v1/moments",
                    json={"content": "followers from A", "visibility": "followers"},
                    headers=_token(uA),
                )

                # uB follows uA
                await client.post(f"/api/v1/follow/{uA.id}", headers=_token(uB))

                # uB sees both moments
                r = await client.get("/api/v1/moments", headers=_token(uB))
                contents = [m["content"] for m in r.json()["data"]["moments"]]
                assert "pub from A" in contents
                assert "followers from A" in contents

                # uC (non-follower) sees only public
                r = await client.get("/api/v1/moments", headers=_token(uC))
                contents = [m["content"] for m in r.json()["data"]["moments"]]
                assert "pub from A" in contents
                assert "followers from A" not in contents

                # uB following_only also sees both (own + followed)
                r = await client.get(
                    "/api/v1/moments?following_only=true", headers=_token(uB)
                )
                contents = [m["content"] for m in r.json()["data"]["moments"]]
                assert "pub from A" in contents
                assert "followers from A" in contents
        finally:
            await _cleanup_user(test_session_maker, uA.id)
            await _cleanup_user(test_session_maker, uB.id)
            await _cleanup_user(test_session_maker, uC.id)


class TestMomentDetailVisibilityAndActions:
    """Detail, like, and comment endpoints must enforce the same visibility rules."""

    @pytest.mark.asyncio
    async def test_detail_respects_public_followers_and_private_visibility(self, test_app, test_session_maker):
        author = await _create_test_user(test_session_maker)
        follower = await _create_test_user(test_session_maker)
        stranger = await _create_test_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                public = await client.post(
                    "/api/v1/moments",
                    json={"content": "public detail", "visibility": "public"},
                    headers=_token(author),
                )
                followers = await client.post(
                    "/api/v1/moments",
                    json={"content": "followers detail", "visibility": "followers"},
                    headers=_token(author),
                )
                private = await client.post(
                    "/api/v1/moments",
                    json={"content": "private detail", "visibility": "private"},
                    headers=_token(author),
                )
                public_id = public.json()["data"]["id"]
                followers_id = followers.json()["data"]["id"]
                private_id = private.json()["data"]["id"]

                await client.post(f"/api/v1/follow/{author.id}", headers=_token(follower))

                assert (await client.get(f"/api/v1/moments/{public_id}")).json()["success"] is True
                assert (await client.get(f"/api/v1/moments/{followers_id}", headers=_token(follower))).json()["success"] is True
                assert (await client.get(f"/api/v1/moments/{followers_id}", headers=_token(stranger))).json()["error"]["code"] == "NOT_FOUND"
                assert (await client.get(f"/api/v1/moments/{private_id}", headers=_token(author))).json()["success"] is True
                assert (await client.get(f"/api/v1/moments/{private_id}", headers=_token(follower))).json()["error"]["code"] == "NOT_FOUND"
        finally:
            await _cleanup_user(test_session_maker, author.id)
            await _cleanup_user(test_session_maker, follower.id)
            await _cleanup_user(test_session_maker, stranger.id)

    @pytest.mark.asyncio
    async def test_invisible_moment_cannot_be_liked_or_commented_on(self, test_app, test_session_maker):
        author = await _create_test_user(test_session_maker)
        stranger = await _create_test_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post(
                    "/api/v1/moments",
                    json={"content": "hidden", "visibility": "private"},
                    headers=_token(author),
                )
                mid = r.json()["data"]["id"]

                r = await client.post(f"/api/v1/moments/{mid}/like", headers=_token(stranger))
                assert r.json()["success"] is False
                assert r.json()["error"]["code"] == "NOT_FOUND"

                r = await client.post(
                    f"/api/v1/moments/{mid}/comments",
                    json={"content": "nope"},
                    headers=_token(stranger),
                )
                assert r.json()["success"] is False
                assert r.json()["error"]["code"] == "NOT_FOUND"

                r = await client.get(f"/api/v1/moments/{mid}", headers=_token(author))
                assert r.json()["data"]["likes"] == 0
                assert r.json()["data"]["comment_count"] == 0
        finally:
            await _cleanup_user(test_session_maker, author.id)
            await _cleanup_user(test_session_maker, stranger.id)

    @pytest.mark.asyncio
    async def test_reply_to_id_must_belong_to_same_moment(self, test_app, test_session_maker):
        author = await _create_test_user(test_session_maker)
        commenter = await _create_test_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post("/api/v1/moments", json={"content": "m1"}, headers=_token(author))
                m1 = r.json()["data"]["id"]
                r = await client.post("/api/v1/moments", json={"content": "m2"}, headers=_token(author))
                m2 = r.json()["data"]["id"]

                r = await client.post(
                    f"/api/v1/moments/{m1}/comments",
                    json={"content": "on m1"},
                    headers=_token(commenter),
                )
                comment_id = r.json()["data"]["id"]

                r = await client.post(
                    f"/api/v1/moments/{m2}/comments",
                    json={"content": "cross reply", "reply_to_id": comment_id},
                    headers=_token(commenter),
                )
                assert r.json()["success"] is False
                assert r.json()["error"]["code"] == "NOT_FOUND"

                r = await client.get(f"/api/v1/moments/{m2}", headers=_token(author))
                assert r.json()["data"]["comment_count"] == 0
        finally:
            await _cleanup_user(test_session_maker, author.id)
            await _cleanup_user(test_session_maker, commenter.id)

    @pytest.mark.asyncio
    async def test_private_not_visible_to_follower(self, test_app, test_session_maker):
        """Followers cannot see private moments via following_only or normal feed."""
        uA = await _create_test_user(test_session_maker)
        uB = await _create_test_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                await client.post(
                    "/api/v1/moments",
                    json={"content": "private from A", "visibility": "private"},
                    headers=_token(uA),
                )

                # uB follows uA
                await client.post(f"/api/v1/follow/{uA.id}", headers=_token(uB))

                # uB should NOT see uA's private moment in normal feed
                r = await client.get("/api/v1/moments", headers=_token(uB))
                contents = [m["content"] for m in r.json()["data"]["moments"]]
                assert "private from A" not in contents

                # uB should NOT see it in following_only either
                r = await client.get(
                    "/api/v1/moments?following_only=true", headers=_token(uB)
                )
                contents = [m["content"] for m in r.json()["data"]["moments"]]
                assert "private from A" not in contents

                # uA sees their own private moment
                r = await client.get("/api/v1/moments", headers=_token(uA))
                contents = [m["content"] for m in r.json()["data"]["moments"]]
                assert "private from A" in contents
        finally:
            await _cleanup_user(test_session_maker, uA.id)
            await _cleanup_user(test_session_maker, uB.id)

    @pytest.mark.asyncio
    async def test_unfollow_hides_followers_visibility(self, test_app, test_session_maker):
        """After unfollowing, followers-visibility moments are hidden."""
        uA = await _create_test_user(test_session_maker)
        uB = await _create_test_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                await client.post(
                    "/api/v1/moments",
                    json={"content": "followers from A", "visibility": "followers"},
                    headers=_token(uA),
                )

                # uB follows uA, sees it
                await client.post(f"/api/v1/follow/{uA.id}", headers=_token(uB))
                r = await client.get(
                    "/api/v1/moments?following_only=true", headers=_token(uB)
                )
                assert "followers from A" in [m["content"] for m in r.json()["data"]["moments"]]

                # uB unfollows uA
                await client.delete(f"/api/v1/follow/{uA.id}", headers=_token(uB))
                r = await client.get(
                    "/api/v1/moments?following_only=true", headers=_token(uB)
                )
                contents = [m["content"] for m in r.json()["data"]["moments"]]
                assert "followers from A" not in contents
        finally:
            await _cleanup_user(test_session_maker, uA.id)
            await _cleanup_user(test_session_maker, uB.id)

    @pytest.mark.asyncio
    async def test_following_only_excludes_non_followed(self, test_app, test_session_maker):
        """following_only only shows followed users + self."""
        uA = await _create_test_user(test_session_maker)
        uB = await _create_test_user(test_session_maker)  # followed by uA
        uC = await _create_test_user(test_session_maker)  # not followed
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                await client.post(
                    "/api/v1/moments",
                    json={"content": "from A", "visibility": "public"},
                    headers=_token(uA),
                )
                await client.post(
                    "/api/v1/moments",
                    json={"content": "from B", "visibility": "public"},
                    headers=_token(uB),
                )
                await client.post(
                    "/api/v1/moments",
                    json={"content": "from C", "visibility": "public"},
                    headers=_token(uC),
                )

                # uA follows B
                await client.post(f"/api/v1/follow/{uB.id}", headers=_token(uA))

                r = await client.get(
                    "/api/v1/moments?following_only=true", headers=_token(uA)
                )
                contents = [m["content"] for m in r.json()["data"]["moments"]]
                assert "from A" in contents  # self
                assert "from B" in contents  # followed
                assert "from C" not in contents  # not followed
        finally:
            await _cleanup_user(test_session_maker, uA.id)
            await _cleanup_user(test_session_maker, uB.id)
            await _cleanup_user(test_session_maker, uC.id)


class TestMomentsCounters:
    """Tests for like/comment counter correctness."""

    @pytest.mark.asyncio
    async def test_unlike_does_not_go_below_zero(self, test_app, test_session_maker):
        """Unlike (DELETE) on zero-liked moment doesn't go below 0."""
        user = await _create_test_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post(
                    "/api/v1/moments",
                    json={"content": "zero_likes_test"},
                    headers=_token(user),
                )
                mid = r.json()["data"]["id"]
                assert r.json()["data"]["likes"] == 0

                # Unlike on zero: no-op, still 0
                r = await client.delete(f"/api/v1/moments/{mid}/like", headers=_token(user))
                assert r.json()["data"]["likes"] == 0

                # Like -> 1
                r = await client.post(f"/api/v1/moments/{mid}/like", headers=_token(user))
                assert r.json()["data"]["liked"] is True
                assert r.json()["data"]["likes"] == 1

                # Unlike -> 0
                r = await client.delete(f"/api/v1/moments/{mid}/like", headers=_token(user))
                assert r.json()["data"]["liked"] is False
                assert r.json()["data"]["likes"] == 0

                # Unlike again: no-op, still 0
                r = await client.delete(f"/api/v1/moments/{mid}/like", headers=_token(user))
                assert r.json()["data"]["likes"] == 0

                # Confirm we never went below 0
                assert r.json()["data"]["likes"] >= 0
        finally:
            await _cleanup_user(test_session_maker, user.id)

    @pytest.mark.asyncio
    async def test_comment_count_never_negative(self, test_app, test_session_maker):
        """Deleting a comment on a zero-comment moment shouldn't go below 0."""
        u1 = await _create_test_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post(
                    "/api/v1/moments",
                    json={"content": "zero_comment_test"},
                    headers=_token(u1),
                )
                mid = r.json()["data"]["id"]
                assert r.json()["data"]["comment_count"] == 0

                # Add then delete a comment
                r = await client.post(
                    f"/api/v1/moments/{mid}/comments",
                    json={"content": "temp"},
                    headers=_token(u1),
                )
                cid = r.json()["data"]["id"]
                await client.delete(
                    f"/api/v1/moments/{mid}/comments/{cid}",
                    headers=_token(u1),
                )

                # Verify count is back to 0
                r = await client.get("/api/v1/moments", headers=_token(u1))
                target = [m for m in r.json()["data"]["moments"] if m["id"] == mid][0]
                assert target["comment_count"] == 0

                # Delete again (should not go negative)
                await client.delete(
                    f"/api/v1/moments/{mid}/comments/{cid}",
                    headers=_token(u1),
                )
                r = await client.get("/api/v1/moments", headers=_token(u1))
                target = [m for m in r.json()["data"]["moments"] if m["id"] == mid][0]
                assert target["comment_count"] == 0
        finally:
            await _cleanup_user(test_session_maker, u1.id)
