"""
Integration tests for authentication flow (T028).

Tests user creation on first login and retrieval on subsequent logins.
"""

import pytest
from sqlalchemy import select
from unittest.mock import patch, AsyncMock

from app.models.user import User
from app.core.deps import get_current_user
from app.core.database import AsyncSessionLocal


@pytest.mark.asyncio
async def test_auth_flow_first_login_creates_user(async_session):
    """Test that first login creates a new user in database."""
    mock_verify = AsyncMock(return_value={
        "google_sub": "first_login_user",
        "email": "firstlogin@example.com",
        "display_name": "First Login User"
    })
    
    # Verify user doesn't exist yet
    stmt = select(User).where(User.google_sub == "first_login_user")
    result = await async_session.execute(stmt)
    assert result.scalar_one_or_none() is None
    
    # Simulate authentication (this triggers get_or_create_user)
    with patch("app.core.deps.verify_google_token", mock_verify):
        user = await get_current_user(
            authorization="Bearer test.token",
            db=async_session
        )
    
    # Verify user was created
    assert user is not None
    assert user.google_sub == "first_login_user"
    assert user.email == "firstlogin@example.com"
    assert user.display_name == "First Login User"
    
    # Verify user exists in database
    stmt = select(User).where(User.google_sub == "first_login_user")
    result = await async_session.execute(stmt)
    db_user = result.scalar_one_or_none()
    assert db_user is not None
    assert db_user.user_id == user.user_id


@pytest.mark.asyncio
async def test_auth_flow_subsequent_login_retrieves_user(async_session):
    """Test that subsequent logins retrieve existing user without duplication."""
    mock_verify = AsyncMock(return_value={
        "google_sub": "returning_user",
        "email": "returning@example.com",
        "display_name": "Returning User"
    })
    
    # First login - creates user
    with patch("app.core.deps.verify_google_token", mock_verify):
        user1 = await get_current_user(
            authorization="Bearer test.token.1",
            db=async_session
        )
        first_user_id = user1.user_id
    
    # Second login - should retrieve same user
    with patch("app.core.deps.verify_google_token", mock_verify):
        user2 = await get_current_user(
            authorization="Bearer test.token.2",
            db=async_session
        )
        second_user_id = user2.user_id
    
    # Should be the same user (same user_id)
    assert first_user_id == second_user_id
    
    # Verify only one user exists in database
    stmt = select(User).where(User.google_sub == "returning_user")
    result = await async_session.execute(stmt)
    all_users = result.scalars().all()
    assert len(all_users) == 1


@pytest.mark.asyncio
async def test_auth_flow_updates_user_info_if_changed(async_session):
    """Test that user info is updated if Google profile changes."""
    # First login with initial data
    mock_verify_v1 = AsyncMock(return_value={
        "google_sub": "updateable_user",
        "email": "old@example.com",
        "display_name": "Old Name"
    })
    
    with patch("app.core.deps.verify_google_token", mock_verify_v1):
        user1 = await get_current_user(
            authorization="Bearer test.token",
            db=async_session
        )
    
    assert user1.email == "old@example.com"
    assert user1.display_name == "Old Name"
    
    # Second login with updated profile info
    mock_verify_v2 = AsyncMock(return_value={
        "google_sub": "updateable_user",  # Same user
        "email": "new@example.com",  # Updated email
        "display_name": "New Name"  # Updated name
    })
    
    with patch("app.core.deps.verify_google_token", mock_verify_v2):
        user2 = await get_current_user(
            authorization="Bearer test.token.2",
            db=async_session
        )
    
    # Should be same user but with updated info
    assert user2.user_id == user1.user_id
    assert user2.email == "new@example.com"
    assert user2.display_name == "New Name"


@pytest.mark.asyncio
async def test_auth_flow_rejects_invalid_token(async_session):
    """Test that invalid tokens are rejected."""
    from app.core.auth import GoogleTokenError
    from fastapi import HTTPException
    
    mock_invalid = AsyncMock(side_effect=GoogleTokenError("Invalid token"))
    
    with patch("app.core.deps.verify_google_token", mock_invalid):
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(
                authorization="Bearer invalid.token",
                db=async_session
            )
    
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_auth_flow_rejects_missing_token(async_session):
    """Test that requests without tokens are rejected."""
    from fastapi import HTTPException
    
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(
            authorization=None,
            db=async_session
        )
    
    assert exc_info.value.status_code == 401
