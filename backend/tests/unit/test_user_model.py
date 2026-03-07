"""
Unit tests for User model (T025).

Tests user creation, google_sub uniqueness constraint.
"""

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.models.user import User
from tests.utils import create_test_user


@pytest.mark.asyncio
async def test_create_user(async_session):
    """Test creating a user with valid data."""
    user = User(
        google_sub="test_unique_sub_001",
        email="test@example.com",
        display_name="Test User"
    )
    
    async_session.add(user)
    await async_session.commit()
    await async_session.refresh(user)
    
    # Verify user was created
    assert user.user_id is not None
    assert user.google_sub == "test_unique_sub_001"
    assert user.email == "test@example.com"
    assert user.display_name == "Test User"
    assert user.created_at is not None
    assert user.updated_at is not None


@pytest.mark.asyncio
async def test_user_google_sub_uniqueness(async_session):
    """Test that google_sub must be unique."""
    # Create first user
    user1 = User(
        google_sub="duplicate_sub",
        email="user1@example.com",
        display_name="User One"
    )
    async_session.add(user1)
    await async_session.commit()
    
    # Try to create second user with same google_sub
    user2 = User(
        google_sub="duplicate_sub",  # Duplicate!
        email="user2@example.com",
        display_name="User Two"
    )
    async_session.add(user2)
    
    # Should raise IntegrityError due to unique constraint
    with pytest.raises(IntegrityError):
        await async_session.commit()


@pytest.mark.asyncio
async def test_user_query_by_google_sub(async_session):
    """Test querying user by google_sub."""
    # Create test user
    user = await create_test_user(async_session, google_sub="query_test_sub")
    
    # Query by google_sub
    stmt = select(User).where(User.google_sub == "query_test_sub")
    result = await async_session.execute(stmt)
    found_user = result.scalar_one_or_none()
    
    # Verify we found the right user
    assert found_user is not None
    assert found_user.user_id == user.user_id
    assert found_user.email == user.email


@pytest.mark.asyncio
async def test_user_update_display_name(async_session):
    """Test updating user display name."""
    user = await create_test_user(async_session, display_name="Original Name")
    
    # Update display name
    user.display_name = "Updated Name"
    await async_session.commit()
    await async_session.refresh(user)
    
    # Verify update
    assert user.display_name == "Updated Name"
    assert user.updated_at >= user.created_at  # >= because SQLite timestamps have second precision


@pytest.mark.asyncio
async def test_user_required_fields(async_session):
    """Test that required fields must be provided."""
    # Missing email should fail
    user = User(
        google_sub="test_sub",
        display_name="Test User"
        # email is missing - should fail on commit
    )
    async_session.add(user)
    
    with pytest.raises((IntegrityError, Exception)):
        await async_session.commit()
