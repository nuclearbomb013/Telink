"""
Tests for Messages API endpoints.
"""

import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import select, delete

from app.models.user import User, UserRole
from app.models.message import Message
from app.core.security import TokenManager, PasswordManager


async def _create_user(session_maker: async_sessionmaker[AsyncSession]) -> User:
    async with session_maker() as s:
        user = User(
            username=f"msg_{uuid.uuid4().hex[:6]}",
            email=f"msg_{uuid.uuid4().hex[:6]}@t.com",
            password_hash=PasswordManager.hash_password("test1234"),
            role=UserRole.USER,
            is_active=True,
        )
        s.add(user)
        await s.commit()
        await s.refresh(user)
        return user


async def _follow(session_maker: async_sessionmaker[AsyncSession], follower_id: int, following_id: int):
    """Make follower follow following."""
    from app.models.follow import Follow
    async with session_maker() as s:
        f = Follow(follower_id=follower_id, following_id=following_id)
        s.add(f)
        await s.commit()


async def _mutual_follow(session_maker: async_sessionmaker[AsyncSession], user_a: int, user_b: int):
    await _follow(session_maker, user_a, user_b)
    await _follow(session_maker, user_b, user_a)


def _token(user: User) -> dict:
    token = TokenManager.create_access_token(str(user.id))
    return {"Authorization": f"Bearer {token}"}


async def _cleanup(session_maker, *users):
    async with session_maker() as s:
        for user in users:
            await s.execute(delete(Message).where(
                (Message.sender_id == user.id) | (Message.receiver_id == user.id)
            ))
            u = await s.get(User, user.id)
            if u:
                await s.delete(u)
        await s.commit()


class TestMessagesAPI:

    @pytest.mark.asyncio
    async def test_send_requires_auth(self, test_app):
        transport = ASGITransport(app=test_app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.post("/api/v1/messages", json={
                "receiver_id": 1, "content": "hi"
            })
            assert r.status_code == 401

    @pytest.mark.asyncio
    async def test_send_and_read(self, test_app, test_session_maker):
        u1 = await _create_user(test_session_maker)
        u2 = await _create_user(test_session_maker)
        await _mutual_follow(test_session_maker, u1.id, u2.id)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                # u1 sends to u2
                r = await client.post("/api/v1/messages", json={
                    "receiver_id": u2.id, "content": "Hello!"
                }, headers=_token(u1))
                assert r.status_code == 200
                data = r.json()["data"]
                assert data["sender_id"] == u1.id
                assert data["receiver_id"] == u2.id
                assert data["content"] == "Hello!"
                assert data["is_read"] is False

                # u2 sees unread count
                r = await client.get("/api/v1/messages/unread-count", headers=_token(u2))
                assert r.json()["data"]["total_unread"] == 1

                # u2 reads conversation -> marks as read
                r = await client.get(
                    f"/api/v1/messages/conversations/{u1.id}", headers=_token(u2)
                )
                assert r.json()["data"]["messages"][0]["is_read"] is True

                # u2 unread count is now 0
                r = await client.get("/api/v1/messages/unread-count", headers=_token(u2))
                assert r.json()["data"]["total_unread"] == 0

                # u2 sees conversation
                r = await client.get("/api/v1/messages/conversations", headers=_token(u2))
                convs = r.json()["data"]["conversations"]
                assert len(convs) == 1
                assert convs[0]["user_id"] == u1.id
        finally:
            await _cleanup(test_session_maker, u1, u2)

    @pytest.mark.asyncio
    async def test_cannot_send_self(self, test_app, test_session_maker):
        u1 = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post("/api/v1/messages", json={
                    "receiver_id": u1.id, "content": "self"
                }, headers=_token(u1))
                assert r.json()["success"] is False
        finally:
            await _cleanup(test_session_maker, u1)

    @pytest.mark.asyncio
    async def test_cannot_read_others_conversation(self, test_app, test_session_maker):
        u1 = await _create_user(test_session_maker)
        u2 = await _create_user(test_session_maker)
        u3 = await _create_user(test_session_maker)
        await _mutual_follow(test_session_maker, u1.id, u2.id)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                await client.post("/api/v1/messages", json={
                    "receiver_id": u2.id, "content": "private"
                }, headers=_token(u1))
                # u3 tries to read u1-u2 conversation
                r = await client.get(
                    f"/api/v1/messages/conversations/{u1.id}", headers=_token(u3)
                )
                assert r.json()["data"]["messages"] == []
                assert r.json()["data"]["total"] == 0
        finally:
            await _cleanup(test_session_maker, u1, u2, u3)

    @pytest.mark.asyncio
    async def test_delete_message(self, test_app, test_session_maker):
        u1 = await _create_user(test_session_maker)
        u2 = await _create_user(test_session_maker)
        await _mutual_follow(test_session_maker, u1.id, u2.id)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post("/api/v1/messages", json={
                    "receiver_id": u2.id, "content": "temp"
                }, headers=_token(u1))
                mid = r.json()["data"]["id"]
                # u1 hides own message view
                r = await client.delete(f"/api/v1/messages/{mid}", headers=_token(u1))
                assert r.json()["success"] is True

                # u1 no longer sees it
                r = await client.get(
                    f"/api/v1/messages/conversations/{u2.id}", headers=_token(u1)
                )
                assert r.json()["data"]["total"] == 0

                # u2 still sees it until they hide their own view
                r = await client.get(
                    f"/api/v1/messages/conversations/{u1.id}", headers=_token(u2)
                )
                assert r.json()["data"]["total"] == 1

                r = await client.delete(f"/api/v1/messages/{mid}", headers=_token(u2))
                assert r.json()["success"] is True

                r = await client.get(
                    f"/api/v1/messages/conversations/{u1.id}", headers=_token(u2)
                )
                assert r.json()["data"]["total"] == 0
        finally:
            await _cleanup(test_session_maker, u1, u2)

    @pytest.mark.asyncio
    async def test_mark_conversation_read(self, test_app, test_session_maker):
        u1 = await _create_user(test_session_maker)
        u2 = await _create_user(test_session_maker)
        await _mutual_follow(test_session_maker, u1.id, u2.id)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                await client.post("/api/v1/messages", json={
                    "receiver_id": u2.id, "content": "m1"
                }, headers=_token(u1))
                await client.post("/api/v1/messages", json={
                    "receiver_id": u2.id, "content": "m2"
                }, headers=_token(u1))
                # Bulk mark read
                r = await client.put(
                    f"/api/v1/messages/conversations/{u1.id}/read", headers=_token(u2)
                )
                assert r.json()["data"]["marked_count"] == 2
                r = await client.get("/api/v1/messages/unread-count", headers=_token(u2))
                assert r.json()["data"]["total_unread"] == 0
        finally:
            await _cleanup(test_session_maker, u1, u2)

    @pytest.mark.asyncio
    async def test_non_follower_cannot_send(self, test_app, test_session_maker):
        """A user who is not mutual followers with the target cannot send a DM."""
        u1 = await _create_user(test_session_maker)
        u2 = await _create_user(test_session_maker)
        # u1 does NOT follow u2
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post("/api/v1/messages", json={
                    "receiver_id": u2.id, "content": "hi from stranger"
                }, headers=_token(u1))
                assert r.json()["success"] is False
                assert r.json()["error"]["code"] == "FORBIDDEN"
        finally:
            await _cleanup(test_session_maker, u1, u2)

    @pytest.mark.asyncio
    async def test_one_way_follow_cannot_send(self, test_app, test_session_maker):
        """DMs require mutual follows, not just sender -> receiver follow."""
        u1 = await _create_user(test_session_maker)
        u2 = await _create_user(test_session_maker)
        await _follow(test_session_maker, u1.id, u2.id)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post("/api/v1/messages", json={
                    "receiver_id": u2.id, "content": "one-way follow"
                }, headers=_token(u1))
                assert r.json()["success"] is False
                assert r.json()["error"]["code"] == "FORBIDDEN"
        finally:
            await _cleanup(test_session_maker, u1, u2)

    @pytest.mark.asyncio
    async def test_sender_id_in_payload_cannot_spoof_sender(self, test_app, test_session_maker):
        """sender_id in request JSON is ignored; sender is the authenticated user."""
        sender = await _create_user(test_session_maker)
        receiver = await _create_user(test_session_maker)
        spoofed = await _create_user(test_session_maker)
        await _mutual_follow(test_session_maker, sender.id, receiver.id)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post(
                    "/api/v1/messages",
                    json={
                        "receiver_id": receiver.id,
                        "sender_id": spoofed.id,
                        "content": "spoof attempt",
                    },
                    headers=_token(sender),
                )
                assert r.status_code == 200
                data = r.json()["data"]
                assert data["sender_id"] == sender.id
                assert data["receiver_id"] == receiver.id
        finally:
            await _cleanup(test_session_maker, sender, receiver, spoofed)

    @pytest.mark.asyncio
    async def test_mark_conversation_read_only_marks_received_messages(self, test_app, test_session_maker):
        """Conversation read marks messages from target to current user only."""
        u1 = await _create_user(test_session_maker)
        u2 = await _create_user(test_session_maker)
        await _follow(test_session_maker, u1.id, u2.id)
        await _follow(test_session_maker, u2.id, u1.id)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.post(
                    "/api/v1/messages",
                    json={"receiver_id": u2.id, "content": "u1 to u2"},
                    headers=_token(u1),
                )
                msg_to_u2 = r.json()["data"]["id"]
                r = await client.post(
                    "/api/v1/messages",
                    json={"receiver_id": u1.id, "content": "u2 to u1"},
                    headers=_token(u2),
                )
                msg_to_u1 = r.json()["data"]["id"]

                r = await client.put(
                    f"/api/v1/messages/conversations/{u1.id}/read",
                    headers=_token(u2),
                )
                assert r.json()["data"]["marked_count"] == 1

                async with test_session_maker() as s:
                    to_u2 = await s.get(Message, msg_to_u2)
                    to_u1 = await s.get(Message, msg_to_u1)
                    assert to_u2.is_read is True
                    assert to_u1.is_read is False
        finally:
            await _cleanup(test_session_maker, u1, u2)

    @pytest.mark.asyncio
    async def test_deleted_or_inactive_users_cannot_be_messaged(self, test_app, test_session_maker):
        sender = await _create_user(test_session_maker)
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
                r = await client.post(
                    "/api/v1/messages",
                    json={"receiver_id": inactive.id, "content": "hi"},
                    headers=_token(sender),
                )
                assert r.json()["success"] is False
                assert r.json()["error"]["code"] == "NOT_FOUND"

                r = await client.post(
                    "/api/v1/messages",
                    json={"receiver_id": deleted.id, "content": "hi"},
                    headers=_token(sender),
                )
                assert r.json()["success"] is False
                assert r.json()["error"]["code"] == "NOT_FOUND"
        finally:
            await _cleanup(test_session_maker, sender, inactive, deleted)


class TestUnreadCountResponses:
    """Verify NotificationUnreadCountResponse and MessageUnreadCountResponse don't collide."""

    @pytest.mark.asyncio
    async def test_notification_unread_count_response_shape(self, test_app, test_session_maker):
        """GET /notifications/unread-count returns {count: N} — not message fields."""
        u1 = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.get("/api/v1/notifications/unread-count", headers=_token(u1))
                assert r.status_code == 200
                data = r.json()
                assert data["success"] is True
                # Notification schema: {count: int}
                assert "count" in data["data"]
                assert isinstance(data["data"]["count"], int)
                # Must NOT have message schema fields
                assert "total_unread" not in data["data"]
                assert "conversation_unreads" not in data["data"]
        finally:
            await _cleanup(test_session_maker, u1)

    @pytest.mark.asyncio
    async def test_message_unread_count_response_shape(self, test_app, test_session_maker):
        """GET /messages/unread-count returns {total_unread, conversation_unreads}."""
        u1 = await _create_user(test_session_maker)
        try:
            transport = ASGITransport(app=test_app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                r = await client.get("/api/v1/messages/unread-count", headers=_token(u1))
                assert r.status_code == 200
                data = r.json()
                assert data["success"] is True
                # Message schema: {total_unread, conversation_unreads}
                assert "total_unread" in data["data"]
                assert "conversation_unreads" in data["data"]
                assert isinstance(data["data"]["total_unread"], int)
                assert isinstance(data["data"]["conversation_unreads"], list)
        finally:
            await _cleanup(test_session_maker, u1)
