"""
Contract test for POST /api/v1/tasks endpoint (T040).

Tests 201 response, task_id returned, queued status.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock, MagicMock

from app.main import app
from app.core.database import get_db
from tests.utils import create_test_user


@pytest.mark.asyncio
async def test_create_task_with_valid_token(async_session):
    """Test POST /api/v1/tasks returns 201 with valid token."""
    # Create a test user
    user = await create_test_user(
        async_session,
        google_sub="task_creator",
        email="creator@example.com",
        display_name="Task Creator"
    )
    
    # Mock Google token verification
    mock_verify = AsyncMock(return_value={
        "google_sub": "task_creator",
        "email": "creator@example.com",
        "display_name": "Task Creator"
    })
    
    # Mock Celery task.delay() to prevent actual task enqueueing
    mock_celery_task = MagicMock()
    mock_celery_task.delay = MagicMock(return_value=MagicMock(id="mock-celery-task-id"))
    
    # Override database dependency
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_verify):
            with patch("app.tasks.process_task.process_task.delay", mock_celery_task.delay):
                response = await client.post(
                    "/api/v1/tasks",
                    json={"simulate_failure_stage": None},
                    headers={"Authorization": "Bearer valid.test.token"}
                )
    
    app.dependency_overrides.clear()
    
    # Verify response
    assert response.status_code == 201
    data = response.json()
    
    assert "task_id" in data
    assert data["status"] == "queued"
    assert data["current_stage"] is None
    assert data["progress"] == 0
    assert data["error"] is None
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_create_task_with_simulate_failure(async_session):
    """Test POST /api/v1/tasks with simulate_failure_stage parameter."""
    user = await create_test_user(
        async_session,
        google_sub="task_creator_sim",
        email="sim@example.com"
    )
    
    mock_verify = AsyncMock(return_value={
        "google_sub": "task_creator_sim",
        "email": "sim@example.com",
        "display_name": "Sim User"
    })
    
    mock_celery_task = MagicMock()
    mock_celery_task.delay = MagicMock(return_value=MagicMock(id="mock-task-id"))
    
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_verify):
            with patch("app.tasks.process_task.process_task.delay", mock_celery_task.delay):
                response = await client.post(
                    "/api/v1/tasks",
                    json={"simulate_failure_stage": "ai_understanding"},
                    headers={"Authorization": "Bearer valid.test.token"}
                )
    
    app.dependency_overrides.clear()
    
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "queued"
    
    # Note: simulate_failure_stage is stored internally, not returned in response
    # The worker will use it when processing


@pytest.mark.asyncio
async def test_create_task_without_token():
    """Test POST /api/v1/tasks returns 401 without authorization token."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/tasks",
            json={"simulate_failure_stage": None}
        )
    
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_create_task_with_invalid_token():
    """Test POST /api/v1/tasks returns 401 with invalid token."""
    from app.core.auth import GoogleTokenError
    
    mock_invalid = AsyncMock(side_effect=GoogleTokenError("Invalid token"))
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_invalid):
            response = await client.post(
                "/api/v1/tasks",
                json={"simulate_failure_stage": None},
                headers={"Authorization": "Bearer invalid.token"}
            )
    
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_create_task_with_invalid_simulate_failure_stage(async_session):
    """Test POST /api/v1/tasks returns 422 with invalid simulate_failure_stage."""
    user = await create_test_user(
        async_session,
        google_sub="task_creator_invalid",
        email="invalid@example.com"
    )
    
    mock_verify = AsyncMock(return_value={
        "google_sub": "task_creator_invalid",
        "email": "invalid@example.com",
        "display_name": "Invalid User"
    })
    
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_verify):
            response = await client.post(
                "/api/v1/tasks",
                json={"simulate_failure_stage": "invalid_stage_name"},
                headers={"Authorization": "Bearer valid.test.token"}
            )
    
    app.dependency_overrides.clear()
    
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_create_task_empty_body(async_session):
    """Test POST /api/v1/tasks with empty body (should succeed with defaults)."""
    user = await create_test_user(
        async_session,
        google_sub="task_creator_empty",
        email="empty@example.com"
    )
    
    mock_verify = AsyncMock(return_value={
        "google_sub": "task_creator_empty",
        "email": "empty@example.com",
        "display_name": "Empty User"
    })
    
    mock_celery_task = MagicMock()
    mock_celery_task.delay = MagicMock(return_value=MagicMock(id="mock-task-id"))
    
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_verify):
            with patch("app.tasks.process_task.process_task.delay", mock_celery_task.delay):
                response = await client.post(
                    "/api/v1/tasks",
                    json={},
                    headers={"Authorization": "Bearer valid.test.token"}
                )
    
    app.dependency_overrides.clear()
    
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "queued"


@pytest.mark.asyncio
async def test_create_multiple_tasks_same_user(async_session):
    """Test creating multiple tasks for the same user."""
    user = await create_test_user(
        async_session,
        google_sub="multi_task_user",
        email="multi@example.com"
    )
    
    mock_verify = AsyncMock(return_value={
        "google_sub": "multi_task_user",
        "email": "multi@example.com",
        "display_name": "Multi Task User"
    })
    
    mock_celery_task = MagicMock()
    mock_celery_task.delay = MagicMock(return_value=MagicMock(id="mock-task-id"))
    
    async def override_get_db():
        yield async_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("app.core.deps.verify_google_token", mock_verify):
            with patch("app.tasks.process_task.process_task.delay", mock_celery_task.delay):
                # Create first task
                response1 = await client.post(
                    "/api/v1/tasks",
                    json={},
                    headers={"Authorization": "Bearer valid.test.token"}
                )
                
                # Create second task
                response2 = await client.post(
                    "/api/v1/tasks",
                    json={},
                    headers={"Authorization": "Bearer valid.test.token"}
                )
    
    app.dependency_overrides.clear()
    
    assert response1.status_code == 201
    assert response2.status_code == 201
    
    task1_id = response1.json()["task_id"]
    task2_id = response2.json()["task_id"]
    
    # Verify both tasks have unique IDs
    assert task1_id != task2_id
