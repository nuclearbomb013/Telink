"""
Tests for authentication API cookie/token behavior.
"""

import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import PasswordManager
from app.models.user import User, UserRole


async def _create_active_user(session_maker, password: str = "TestPass123!") -> User:
    async with session_maker() as session:
        suffix = uuid.uuid4().hex[:8]
        user = User(
            username=f"auth_{suffix}",
            email=f"auth_{suffix}@example.com",
            password_hash=PasswordManager.hash_password(password),
            role=UserRole.USER,
            is_active=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


@pytest.mark.asyncio
async def test_login_sets_refresh_token_cookie_without_body_refresh_token(
    test_app,
    test_session_maker,
):
    password = "TestPass123!"
    user = await _create_active_user(test_session_maker, password=password)

    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "username": user.username,
                "password": password,
                "remember": True,
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["token"]["accessToken"]
    assert payload["data"]["token"]["refreshToken"] == ""

    set_cookie = response.headers.get("set-cookie", "")
    assert "refresh_token=" in set_cookie
    assert "HttpOnly" in set_cookie
    assert "Path=/api/v1/auth" in set_cookie
