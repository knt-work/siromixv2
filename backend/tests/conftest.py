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
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.task import Task, TaskStatus
from app.models.task_log import TaskLog, LogLevel
import uuid

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
        echo=False,  # Disable SQL logging
        poolclass=StaticPool,  # Use StaticPool for in-memory SQLite
        connect_args={"check_same_thread": False},  # Allow multiple threads
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
        user_id=uuid.uuid4(),
        google_sub="test_google_sub_123",
        email="test@example.com",
        display_name="Test User",
    )
    async_session.add(user)
    await async_session.commit()
    await async_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def test_task(async_session: AsyncSession, test_user: User) -> Task:
    """Create a test task."""
    task = Task(
        task_id=uuid.uuid4(),
        user_id=test_user.user_id,
        status=TaskStatus.QUEUED,
        progress=0,
        retry_count_by_stage={},
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    return task


@pytest_asyncio.fixture(scope="function")
async def test_task_log(async_session: AsyncSession, test_task: Task) -> TaskLog:
    """Create a test task log entry."""
    log = TaskLog(
        task_id=str(test_task.task_id),
        stage="extract_docx",
        level=LogLevel.INFO,
        message="Test log message",
        data_json=None,
    )
    async_session.add(log)
    await async_session.commit()
    await async_session.refresh(log)
    return log


@pytest_asyncio.fixture(scope="function")
async def async_client_with_db(async_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Create async HTTP client for testing FastAPI endpoints.
    
    Overrides database dependency to use test database.
    
    Usage:
        async def test_endpoint(async_client_with_db):
            response = await async_client_with_db.get("/api/v1/endpoint")
            assert response.status_code == 200
    """
    # Override database dependency
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    
    app.dependency_overrides.clear()
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
