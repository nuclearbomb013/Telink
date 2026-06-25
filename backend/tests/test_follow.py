"""
Tests for Follow API endpoints.

Covers:
- Follow / unfollow
- Self-follow rejection
- Duplicate follow idempotent
- Unfollow not-following idempotent (removed=false)
- Status query
- Following / followers / friends lists
- Stats
"""

import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import select, delete

from app.models.user import User, UserRole
from app.models.follow import Follow
from app.models.moment import Moment
from app.core.security import TokenManager, PasswordManager


async def _create_user(session_maker: async_sessionmaker[AsyncSession]) -> User:
    """Create a test user with a valid password hash."""
    async with session_maker() as s:
        user = User(
            username=f"fw_{uuid.uuid4().hex[:6]}",
            email=f"fw_{uuid.uuid4().hex[:6]}@t.com",
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


async def _cleanup_users(session_maker, *users):
    """Delete test users and their follow relationships."""
    async with session_maker() as s:
        for user in users:
            await s.execute(delete(Follow).where(
                (Follow.follower_id == user.id) | (Follow.following_id == user.id)
            ))
            u = await s.get(User, user.id)
            if u:
                await s.delete(u)
        await s.commit()


class TestFollowAPI:
    """Follow API integration tests."""

    @pytest.mark.asyncio
    async def test_follow_success(self, test_app, test_session_maker):
        """Follow another user successfully."""
        u1 = await _create_user(test_session_maker)
        u2 = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post(f"/api/v1/follow/{u2.id}", headers=_token(u1))
                assert r.status_code == 200
                assert r.json()["success"] is True
                assert r.json()["data"]["message"] == "Following"
        finally:
            await _cleanup_users(test_session_maker, u1, u2)

    @pytest.mark.asyncio
    async def test_follow_self_fails(self, test_app, test_session_maker):
        """Cannot follow yourself."""
        u1 = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post(f"/api/v1/follow/{u1.id}", headers=_token(u1))
                assert r.json()["success"] is False
                assert r.json()["error"]["code"] == "SELF_FOLLOW"
        finally:
            await _cleanup_users(test_session_maker, u1)

    @pytest.mark.asyncio
    async def test_follow_duplicate_idempotent(self, test_app, test_session_maker):
        """Following the same user twice is idempotent (returns success)."""
        u1 = await _create_user(test_session_maker)
        u2 = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r1 = await client.post(f"/api/v1/follow/{u2.id}", headers=_token(u1))
                assert r1.json()["success"] is True
                r2 = await client.post(f"/api/v1/follow/{u2.id}", headers=_token(u1))
                assert r2.json()["success"] is True  # Idempotent success
        finally:
            await _cleanup_users(test_session_maker, u1, u2)

    @pytest.mark.asyncio
    async def test_deleted_or_inactive_users_cannot_be_followed(self, test_app, test_session_maker):
        follower = await _create_user(test_session_maker)
        inactive = await _create_user(test_session_maker)
        deleted = await _create_user(test_session_maker)
        async with test_session_maker() as s:
            inactive_db = await s.get(User, inactive.id)
            inactive_db.is_active = False
            deleted_db = await s.get(User, deleted.id)
            await s.delete(deleted_db)
            await s.commit()
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post(f"/api/v1/follow/{inactive.id}", headers=_token(follower))
                assert r.json()["success"] is False
                assert r.json()["error"]["code"] == "FORBIDDEN"

                r = await client.post(f"/api/v1/follow/{deleted.id}", headers=_token(follower))
                assert r.json()["success"] is False
                assert r.json()["error"]["code"] == "NOT_FOUND"
        finally:
            await _cleanup_users(test_session_maker, follower, inactive, deleted)

    @pytest.mark.asyncio
    async def test_unfollow_success(self, test_app, test_session_maker):
        """Unfollow a user."""
        u1 = await _create_user(test_session_maker)
        u2 = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                await client.post(f"/api/v1/follow/{u2.id}", headers=_token(u1))
                r = await client.delete(f"/api/v1/follow/{u2.id}", headers=_token(u1))
                assert r.json()["success"] is True
                assert r.json()["data"]["removed"] is True
        finally:
            await _cleanup_users(test_session_maker, u1, u2)

    @pytest.mark.asyncio
    async def test_unfollow_not_following_idempotent(self, test_app, test_session_maker):
        """Unfollowing a non-followed user returns success with removed=false."""
        u1 = await _create_user(test_session_maker)
        u2 = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.delete(f"/api/v1/follow/{u2.id}", headers=_token(u1))
                assert r.json()["success"] is True
                assert r.json()["data"]["removed"] is False
        finally:
            await _cleanup_users(test_session_maker, u1, u2)

    @pytest.mark.asyncio
    async def test_follow_status(self, test_app, test_session_maker):
        """Get follow status: is_following, is_mutual, follower/following counts."""
        u1 = await _create_user(test_session_maker)
        u2 = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                # Before follow
                r = await client.get(
                    f"/api/v1/follow/{u2.id}/status",
                    headers=_token(u1),
                )
                assert r.json()["data"]["is_following"] is False
                assert r.json()["data"]["is_mutual"] is False

                # Follow
                await client.post(f"/api/v1/follow/{u2.id}", headers=_token(u1))
                r = await client.get(
                    f"/api/v1/follow/{u2.id}/status",
                    headers=_token(u1),
                )
                assert r.json()["data"]["is_following"] is True
                assert r.json()["data"]["follower_count"] == 1
                assert r.json()["data"]["is_mutual"] is False  # u2 hasn't followed back

                # u2 follows back -> mutual
                await client.post(f"/api/v1/follow/{u1.id}", headers=_token(u2))
                r = await client.get(
                    f"/api/v1/follow/{u2.id}/status",
                    headers=_token(u1),
                )
                assert r.json()["data"]["is_mutual"] is True
        finally:
            await _cleanup_users(test_session_maker, u1, u2)

    @pytest.mark.asyncio
    async def test_following_list(self, test_app, test_session_maker):
        """Get paginated list of users that a user follows."""
        u1 = await _create_user(test_session_maker)
        u2 = await _create_user(test_session_maker)
        u3 = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                await client.post(f"/api/v1/follow/{u2.id}", headers=_token(u1))
                await client.post(f"/api/v1/follow/{u3.id}", headers=_token(u1))

                r = await client.get(f"/api/v1/follow/{u1.id}/following")
                assert r.json()["success"] is True
                data = r.json()["data"]
                assert data["total"] == 2
                assert len(data["users"]) == 2
                user_ids = [u["id"] for u in data["users"]]
                assert u2.id in user_ids
                assert u3.id in user_ids
        finally:
            await _cleanup_users(test_session_maker, u1, u2, u3)

    @pytest.mark.asyncio
    async def test_followers_list(self, test_app, test_session_maker):
        """Get paginated list of followers."""
        u1 = await _create_user(test_session_maker)
        u2 = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                await client.post(f"/api/v1/follow/{u2.id}", headers=_token(u1))

                r = await client.get(f"/api/v1/follow/{u2.id}/followers")
                assert r.json()["success"] is True
                data = r.json()["data"]
                assert data["total"] == 1
                assert data["users"][0]["id"] == u1.id
        finally:
            await _cleanup_users(test_session_maker, u1, u2)

    @pytest.mark.asyncio
    async def test_friends_list(self, test_app, test_session_maker):
        """Mutual follows appear in friends list."""
        u1 = await _create_user(test_session_maker)
        u2 = await _create_user(test_session_maker)
        u3 = await _create_user(test_session_maker)  # non-mutual
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                # u1 follows u2, u2 follows u1 -> mutual
                await client.post(f"/api/v1/follow/{u2.id}", headers=_token(u1))
                await client.post(f"/api/v1/follow/{u1.id}", headers=_token(u2))
                # u1 follows u3, but u3 does not follow back
                await client.post(f"/api/v1/follow/{u3.id}", headers=_token(u1))

                r = await client.get(f"/api/v1/follow/{u1.id}/friends")
                assert r.json()["success"] is True
                data = r.json()["data"]
                assert data["total"] == 1  # Only u2 is mutual
                assert data["users"][0]["id"] == u2.id
        finally:
            await _cleanup_users(test_session_maker, u1, u2, u3)

    @pytest.mark.asyncio
    async def test_stats(self, test_app, test_session_maker):
        """Follow stats reflect follower/following/friend counts."""
        u1 = await _create_user(test_session_maker)
        u2 = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                await client.post(f"/api/v1/follow/{u2.id}", headers=_token(u1))
                r = await client.get(f"/api/v1/follow/{u1.id}/stats")
                assert r.json()["success"] is True
                data = r.json()["data"]
                assert data["following_count"] == 1
                assert data["follower_count"] == 0
                assert data["friend_count"] == 0

                await client.post(f"/api/v1/follow/{u1.id}", headers=_token(u2))
                r = await client.get(f"/api/v1/follow/{u1.id}/stats")
                data = r.json()["data"]
                assert data["follower_count"] == 1
                assert data["friend_count"] == 1
        finally:
            await _cleanup_users(test_session_maker, u1, u2)

    @pytest.mark.asyncio
    async def test_requires_auth(self, test_app):
        """Follow/unfollow require authentication."""
        transport = ASGITransport(app=test_app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post("/api/v1/follow/1")
            assert r.status_code == 401
            r = await client.delete("/api/v1/follow/1")
            assert r.status_code == 401


class TestFollowMomentCount:
    """Verify FollowUserInfo.moment_count reflects actual moments, not post_count."""

    @pytest.mark.asyncio
    async def test_moment_count_is_actual_moments(self, test_app, test_session_maker):
        """moment_count in following list should come from moments table."""
        u1 = await _create_user(test_session_maker)
        u2 = await _create_user(test_session_maker)

        async with test_session_maker() as s:
            # Create 3 moments for u2
            for i in range(3):
                m = Moment(author_id=u2.id, author_name=u2.username, content=f"moment {i}")
                s.add(m)
            await s.commit()

        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                # u1 follows u2
                await client.post(f"/api/v1/follow/{u2.id}", headers=_token(u1))

                # Get u1's following list
                r = await client.get(f"/api/v1/follow/{u1.id}/following", headers=_token(u1))
                assert r.status_code == 200
                data = r.json()
                assert data["success"] is True
                followed_users = data["data"]["users"]
                u2_info = next(u for u in followed_users if u["id"] == u2.id)
                assert u2_info["moment_count"] == 3
        finally:
            await _cleanup_users(test_session_maker, u1, u2)
