"""
Contract test for GET /api/v1/tasks/{task_id} endpoint (T053).

Tests 200 with task data, 404 for non-existent task, 403 for other user's task.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock
import uuid

from app.main import app
from app.core.database import get_db
from app.models.task import Task, TaskStatus, TaskStage
from app.models.task_log import TaskLog, LogLevel
from tests.utils import create_test_user


@pytest.mark.asyncio
async def test_get_task_with_valid_token(async_session):
    """Test GET /api/v1/tasks/{task_id} returns 200 with task data."""
    # Create a test user
    user = await create_test_user(
        async_session,
        google_sub="task_owner",
        email="owner@example.com",
        display_name="Task Owner"
    )
    
    # Create a task
    task = Task(
        user_id=user.user_id,
        status=TaskStatus.RUNNING,
        current_stage=TaskStage.AI_UNDERSTANDING,
        progress=40,
        retry_count_by_stage={"extract_docx": 0, "ai_understanding": 0}
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    # Create some logs
    log1 = TaskLog(
        task_id=task.task_id,
        stage="extract_docx",
        level=LogLevel.INFO,
        message="Starting extraction"
    )
    log2 = TaskLog(
        task_id=task.task_id,
        stage="extract_docx",
        level=LogLevel.INFO,
        message="Extraction complete",
        data_json={"duration_ms": 3200}
    )
    async_session.add_all([log1, log2])
    await async_session.commit()
    
    # Mock Google token verification
    mock_verify = AsyncMock(return_value={
        "google_sub": "task_owner",
        "email": "owner@example.com",
        "display_name": "Task Owner"
    })
    
    # Override database dependency
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_verify):
            response = await client.get(
                f"/api/v1/tasks/{task.task_id}",
                headers={"Authorization": "Bearer valid.test.token"}
            )
    
    app.dependency_overrides.clear()
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    
    assert data["task_id"] == str(task.task_id)
    assert data["status"] == "running"
    assert data["current_stage"] == "ai_understanding"
    assert data["progress"] == 40
    assert data["error"] is None
    assert "retry_count_by_stage" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert "logs" in data
    assert len(data["logs"]) == 2


@pytest.mark.asyncio
async def test_get_task_without_token(async_session):
    """Test GET /api/v1/tasks/{task_id} returns 401 without token."""
    task_id = uuid.uuid4()
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(f"/api/v1/tasks/{task_id}")
    
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_get_task_not_found(async_session):
    """Test GET /api/v1/tasks/{task_id} returns 404 for non-existent task."""
    user = await create_test_user(
        async_session,
        google_sub="user_404",
        email="404@example.com"
    )
    
    mock_verify = AsyncMock(return_value={
        "google_sub": "user_404",
        "email": "404@example.com",
        "display_name": "User 404"
    })
    
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    fake_task_id = uuid.uuid4()
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_verify):
            response = await client.get(
                f"/api/v1/tasks/{fake_task_id}",
                headers={"Authorization": "Bearer valid.test.token"}
            )
    
    app.dependency_overrides.clear()
    
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_get_task_forbidden_other_user(async_session):
    """Test GET /api/v1/tasks/{task_id} returns 403 for other user's task."""
    # Create owner user and task
    owner = await create_test_user(
        async_session,
        google_sub="task_owner_403",
        email="owner403@example.com"
    )
    
    task = Task(
        user_id=owner.user_id,
        status=TaskStatus.QUEUED
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    # Create different user who will try to access the task
    other_user = await create_test_user(
        async_session,
        google_sub="other_user_403",
        email="other403@example.com"
    )
    
    mock_verify = AsyncMock(return_value={
        "google_sub": "other_user_403",
        "email": "other403@example.com",
        "display_name": "Other User"
    })
    
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_verify):
            response = await client.get(
                f"/api/v1/tasks/{task.task_id}",
                headers={"Authorization": "Bearer valid.test.token"}
            )
    
    app.dependency_overrides.clear()
    
    assert response.status_code == 403
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_get_task_completed_status(async_session):
    """Test GET /api/v1/tasks/{task_id} for completed task."""
    user = await create_test_user(
        async_session,
        google_sub="completed_user",
        email="completed@example.com"
    )
    
    task = Task(
        user_id=user.user_id,
        status=TaskStatus.COMPLETED,
        current_stage=TaskStage.RENDER_DOCX,
        progress=100,
        retry_count_by_stage={
            "extract_docx": 0,
            "ai_understanding": 0,
            "ai_analysis": 0,
            "shuffle": 0,
            "render_docx": 0
        }
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    mock_verify = AsyncMock(return_value={
        "google_sub": "completed_user",
        "email": "completed@example.com",
        "display_name": "Completed User"
    })
    
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_verify):
            response = await client.get(
                f"/api/v1/tasks/{task.task_id}",
                headers={"Authorization": "Bearer valid.test.token"}
            )
    
    app.dependency_overrides.clear()
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["progress"] ==100
    assert data["error"] is None


@pytest.mark.asyncio
async def test_get_task_failed_status(async_session):
    """Test GET /api/v1/tasks/{task_id} for failed task with error message."""
    user = await create_test_user(
        async_session,
        google_sub="failed_user",
        email="failed@example.com"
    )
    
    task = Task(
        user_id=user.user_id,
        status=TaskStatus.FAILED,
        current_stage=TaskStage.AI_ANALYSIS,
        progress=60,
        error="AI analysis service unavailable",
        retry_count_by_stage={
            "extract_docx": 0,
            "ai_understanding": 0,
            "ai_analysis": 1
        }
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    # Add error log
    error_log = TaskLog(
        task_id=task.task_id,
        stage="ai_analysis",
        level=LogLevel.ERROR,
        message="AI analysis service unavailable",
        data_json={"exception_type": "ServiceError"}
    )
    async_session.add(error_log)
    await async_session.commit()
    
    mock_verify = AsyncMock(return_value={
        "google_sub": "failed_user",
        "email": "failed@example.com",
        "display_name": "Failed User"
    })
    
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_verify):
            response = await client.get(
                f"/api/v1/tasks/{task.task_id}",
                headers={"Authorization": "Bearer valid.test.token"}
            )
    
    app.dependency_overrides.clear()
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "failed"
    assert data["progress"] == 60
    assert data["error"] == "AI analysis service unavailable"
    assert data["retry_count_by_stage"]["ai_analysis"] == 1
    assert len(data["logs"]) >= 1
    # Check that error log is present
    assert any(log["level"] == "error" for log in data["logs"])
