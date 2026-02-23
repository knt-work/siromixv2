"""
Pytest configuration and fixtures for SiroMix V2 backend tests.

This module provides shared fixtures for:
- Database sessions (async)
- Test users
- Mock Google tokens
- HTTP clients
"""

import asyncio
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.core.database import Base
from app.main import app
from app.models.user import User

# Test database URL (use in-memory or separate test database)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def async_engine():
    """Create async engine for tests."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        poolclass=NullPool,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def async_session(async_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create async database session for tests."""
    async_session_maker = async_sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session_maker() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def test_user(async_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        google_sub="test_google_sub_123",
        email="test@example.com",
        display_name="Test User",
    )
    async_session.add(user)
    await async_session.commit()
    await async_session.refresh(user)
    return user


@pytest.fixture
def mock_google_token() -> str:
    """Return a mock Google ID token for testing."""
    # In real tests, this would be a properly structured JWT
    # For now, return a placeholder that auth mocking can recognize
    return "mock_google_token_for_testing"


@pytest.fixture
def mock_google_token_payload() -> dict:
    """Return mock Google token payload."""
    return {
        "sub": "test_google_sub_123",
        "email": "test@example.com",
        "name": "Test User",
        "iss": "https://accounts.google.com",
        "aud": "test-client-id",
        "exp": 9999999999,  # Far future
        "iat": 1000000000,
    }


@pytest_asyncio.fixture(scope="function")
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """
    Create async HTTP client for testing FastAPI endpoints.
    
    Usage:
        async def test_endpoint(async_client):
            response = await async_client.get("/api/v1/endpoint")
            assert response.status_code == 200
    """
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
def auth_headers(mock_google_token: str) -> dict:
    """Return authorization headers with mock token."""
    return {
        "Authorization": f"Bearer {mock_google_token}",
        "Content-Type": "application/json",
    }
