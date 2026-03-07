"""
Contract tests for GET /api/v1/me endpoint (T027).

Tests 200 with valid token, 401 without token.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock

from app.main import app
from app.core.database import get_db
from tests.utils import create_test_user


@pytest.mark.asyncio
async def test_me_endpoint_with_valid_token(async_session):
    """Test GET /api/v1/me returns 200 with valid token."""
    # Create a test user
    user = await create_test_user(
        async_session,
        google_sub="test_me_user",
        email="me@example.com",
        display_name="Me Test User"
    )
    
    # Mock Google token verification
    mock_verify = AsyncMock(return_value={
        "google_sub": "test_me_user",
        "email": "me@example.com",
        "display_name": "Me Test User"
    })
    
    # Override database dependency
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_verify):
            response = await client.get(
                "/api/v1/me",
                headers={"Authorization": "Bearer valid.test.token"}
            )
    
    app.dependency_overrides.clear()
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    
    assert data["google_sub"] == "test_me_user"
    assert data["email"] == "me@example.com"
    assert data["display_name"] == "Me Test User"
    assert "user_id" in data
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_me_endpoint_without_token():
    """Test GET /api/v1/me returns 401 without authorization token."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/me")
    
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_me_endpoint_with_invalid_token():
    """Test GET /api/v1/me returns 401 with invalid token."""
    from app.core.auth import GoogleTokenError
    
    mock_invalid = AsyncMock(side_effect=GoogleTokenError("Invalid token"))
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_invalid):
            response = await client.get(
                "/api/v1/me",
                headers={"Authorization": "Bearer invalid.token"}
            )
    
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_me_endpoint_creates_user_on_first_login(async_session):
    """Test that /me endpoint creates user record on first login."""
    # Mock token for NEW user (not in database yet)
    async def mock_verify(token: str):
        return {
            "google_sub": "brand_new_user",
            "email": "new@example.com",
            "display_name": "Brand New User"
        }
    
    # Override database dependency
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_verify):
            response = await client.get(
                "/api/v1/me",
                headers={"Authorization": "Bearer new.user.token"}
            )
    
    app.dependency_overrides.clear()
    
    # Should create user and return 200
    assert response.status_code == 200
    data = response.json()
    
    assert data["google_sub"] == "brand_new_user"
    assert data["email"] == "new@example.com"
    assert data["display_name"] == "Brand New User"


@pytest.mark.asyncio
async def test_me_endpoint_with_expired_token():
    """Test GET /api/v1/me returns 401 with expired token."""
    from app.core.auth import GoogleTokenError
    
    mock_expired = AsyncMock(side_effect=GoogleTokenError("Token expired"))
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_expired):
            response = await client.get(
                "/api/v1/me",
                headers={"Authorization": "Bearer expired.token"}
            )
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_endpoint_malformed_auth_header():
    """Test GET /api/v1/me returns 401 with malformed authorization header."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/me",
            headers={"Authorization": "NotBearer invalidformat"}
        )
    
    assert response.status_code == 401
