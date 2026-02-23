"""
Test utilities for SiroMix V2 backend.

Helper functions for creating test data, mocking external services, etc.
"""

from typing import Dict, Any
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.task import Task, TaskStatus, TaskStage
from app.models.task_log import TaskLog, LogLevel


async def create_test_user(
    session: AsyncSession,
    google_sub: str = None,
    email: str = "test@example.com",
    display_name: str = "Test User",
) -> User:
    """Create a test user in the database."""
    if google_sub is None:
        google_sub = f"test_sub_{uuid4().hex[:8]}"
    
    user = User(
        google_sub=google_sub,
        email=email,
        display_name=display_name,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def create_test_task(
    session: AsyncSession,
    user: User,
    status: TaskStatus = TaskStatus.QUEUED,
    current_stage: TaskStage = None,
    progress: int = 0,
    error: str = None,
) -> Task:
    """Create a test task in the database."""
    task = Task(
        user_id=user.user_id,
        status=status,
        current_stage=current_stage,
        progress=progress,
        error=error,
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


async def create_test_log(
    session: AsyncSession,
    task: Task,
    stage: TaskStage = TaskStage.EXTRACT_DOCX,
    level: LogLevel = LogLevel.INFO,
    message: str = "Test log message",
    data_json: Dict[str, Any] = None,
) -> TaskLog:
    """Create a test log entry in the database."""
    log = TaskLog(
        task_id=task.task_id,
        stage=stage,
        level=level,
        message=message,
        data_json=data_json,
    )
    session.add(log)
    await session.commit()
    await session.refresh(log)
    return log


def mock_google_token_verify(token: str) -> Dict[str, Any]:
    """
    Mock for google.oauth2.id_token.verify_oauth2_token.
    
    Returns mock token payload for testing.
    Use this in monkeypatch or unittest.mock.patch.
    """
    if token == "invalid_token":
        raise ValueError("Invalid token")
    
    if token == "expired_token":
        raise ValueError("Token expired")
    
    # Return mock payload
    return {
        "sub": "test_google_sub_123",
        "email": "test@example.com",
        "name": "Test User",
        "iss": "https://accounts.google.com",
        "aud": "test-client-id",
        "exp": 9999999999,
        "iat": 1000000000,
    }
