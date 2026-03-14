"""
Contract test for POST /api/v1/tasks/{task_id}/retry endpoint (T054).

Tests 200 on failed task, 400 on non-failed task, 403 for other user, 404 not found.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock
import uuid

from app.main import app
from app.core.database import get_db
from app.models.task import Task, TaskStatus, TaskStage
from tests.utils import create_test_user, create_test_exam


@pytest.mark.asyncio
async def test_retry_failed_task(async_session):
    """Test POST /api/v1/tasks/{task_id}/retry returns 200 for failed task."""
    # Create user and failed task
    user = await create_test_user(
        async_session,
        google_sub="retry_user",
        email="retry@example.com"
    )
    exam = await create_test_exam(async_session, user)
    
    task = Task(
        user_id=user.user_id,
        exam_id=exam.exam_id,
        status=TaskStatus.FAILED,
        current_stage=TaskStage.AI_ANALYSIS,
        progress=60,
        error="Simulated failure at ai_analysis",
        retry_count_by_stage={
            "extract_docx": 0,
            "ai_understanding": 0,
            "ai_analysis": 0
        }
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    # Mock Google token verification
    mock_verify = AsyncMock(return_value={
        "google_sub": "retry_user",
        "email": "retry@example.com",
        "display_name": "Retry User"
    })
    
    # Mock Celery task
    mock_celery_task = AsyncMock()
    
    # Override database dependency
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_verify):
            with patch("app.tasks.process_task.process_task.delay", mock_celery_task):
                response = await client.post(
                    f"/api/v1/tasks/{task.task_id}/retry",
                    headers={"Authorization": "Bearer valid.test.token"}
                )
    
    app.dependency_overrides.clear()
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    
    # Task should be running after retry
    assert data["status"] == "running"
    assert data["error"] is None
    assert data["retry_count_by_stage"]["ai_analysis"] == 1
    
    # Celery task should be re-enqueued
    mock_celery_task.assert_called_once()


@pytest.mark.asyncio
async def test_retry_completed_task(async_session):
    """Test POST /api/v1/tasks/{task_id}/retry returns 400 for completed task."""
    user = await create_test_user(
        async_session,
        google_sub="completed_retry_user",
        email="completed_retry@example.com"
    )
    exam = await create_test_exam(async_session, user)
    
    task = Task(
        user_id=user.user_id,
        exam_id=exam.exam_id,
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
        "google_sub": "completed_retry_user",
        "email": "completed_retry@example.com",
        "display_name": "Completed User"
    })
    
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_verify):
            response = await client.post(
                f"/api/v1/tasks/{task.task_id}/retry",
                headers={"Authorization": "Bearer valid.test.token"}
            )
    
    app.dependency_overrides.clear()
    
    # Should return 400 Bad Request
    assert response.status_code == 400
    data = response.json()
    assert "not in failed state" in data["detail"].lower()


@pytest.mark.asyncio
async def test_retry_running_task(async_session):
    """Test POST /api/v1/tasks/{task_id}/retry returns 400 for running task."""
    user = await create_test_user(
        async_session,
        google_sub="running_retry_user",
        email="running_retry@example.com"
    )
    exam = await create_test_exam(async_session, user)
    
    task = Task(
        user_id=user.user_id,
        exam_id=exam.exam_id,
        status=TaskStatus.RUNNING,
        current_stage=TaskStage.SHUFFLE,
        progress=80,
        retry_count_by_stage={
            "extract_docx": 0,
            "ai_understanding": 0,
            "ai_analysis": 0,
            "shuffle": 0
        }
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    mock_verify = AsyncMock(return_value={
        "google_sub": "running_retry_user",
        "email": "running_retry@example.com",
        "display_name": "Running User"
    })
    
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_verify):
            response = await client.post(
                f"/api/v1/tasks/{task.task_id}/retry",
                headers={"Authorization": "Bearer valid.test.token"}
            )
    
    app.dependency_overrides.clear()
    
    # Should return 400 Bad Request
    assert response.status_code == 400
    data = response.json()
    assert "not in failed state" in data["detail"].lower()


@pytest.mark.asyncio
async def test_retry_without_token(async_session):
    """Test POST /api/v1/tasks/{task_id}/retry returns 401 without token."""
    task_id = uuid.uuid4()
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(f"/api/v1/tasks/{task_id}/retry")
    
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_retry_not_found(async_session):
    """Test POST /api/v1/tasks/{task_id}/retry returns 404 for non-existent task."""
    user = await create_test_user(
        async_session,
        google_sub="notfound_retry_user",
        email="notfound_retry@example.com"
    )
    
    mock_verify = AsyncMock(return_value={
        "google_sub": "notfound_retry_user",
        "email": "notfound_retry@example.com",
        "display_name": "NotFound User"
    })
    
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    fake_task_id = uuid.uuid4()
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_verify):
            response = await client.post(
                f"/api/v1/tasks/{fake_task_id}/retry",
                headers={"Authorization": "Bearer valid.test.token"}
            )
    
    app.dependency_overrides.clear()
    
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_retry_forbidden_other_user(async_session):
    """Test POST /api/v1/tasks/{task_id}/retry returns 403 for other user's task."""
    # Create owner user and failed task
    owner = await create_test_user(
        async_session,
        google_sub="task_owner_retry",
        email="owner_retry@example.com"
    )
    exam = await create_test_exam(async_session, owner)
    
    task = Task(
        user_id=owner.user_id,
        exam_id=exam.exam_id,
        status=TaskStatus.FAILED,
        current_stage=TaskStage.AI_UNDERSTANDING,
        progress=40,
        error="Failed at ai_understanding",
        retry_count_by_stage={
            "extract_docx": 0,
            "ai_understanding": 0
        }
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    # Create different user who will try to retry the task
    other_user = await create_test_user(
        async_session,
        google_sub="other_user_retry",
        email="other_retry@example.com"
    )
    
    mock_verify = AsyncMock(return_value={
        "google_sub": "other_user_retry",
        "email": "other_retry@example.com",
        "display_name": "Other User"
    })
    
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_verify):
            response = await client.post(
                f"/api/v1/tasks/{task.task_id}/retry",
                headers={"Authorization": "Bearer valid.test.token"}
            )
    
    app.dependency_overrides.clear()
    
    assert response.status_code == 403
    data = response.json()
    assert "detail" in data
