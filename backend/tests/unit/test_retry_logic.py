"""
Unit tests for retry logic (T055).

Tests retry_count_by_stage increments, status changes, error clearing.
"""

import pytest
from fastapi import HTTPException

from app.models.task import Task, TaskStatus, TaskStage
from app.services.task_service import retry_task, get_task_by_id
from tests.utils import create_test_user


@pytest.mark.asyncio
async def test_retry_increments_retry_count(async_session):
    """Test retry_task increments retry_count_by_stage for failed stage."""
    user = await create_test_user(
        async_session,
        google_sub="retry_count_user",
        email="retry_count@example.com"
    )
    
    task = Task(
        user_id=user.user_id,
        status=TaskStatus.FAILED,
        current_stage=TaskStage.AI_UNDERSTANDING,
        progress=40,
        error="Simulated failure",
        retry_count_by_stage={
            "extract_docx": 0,
            "ai_understanding": 0
        }
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    # Retry the task
    retried_task = await retry_task(
        db=async_session,
        task_id=task.task_id,
        user_id=user.user_id
    )
    
    # Verify retry count incremented
    assert retried_task.retry_count_by_stage["ai_understanding"] == 1
    assert retried_task.retry_count_by_stage["extract_docx"] == 0


@pytest.mark.asyncio
async def test_retry_changes_status_to_running(async_session):
    """Test retry_task changes status from failed to running."""
    user = await create_test_user(
        async_session,
        google_sub="status_change_user",
        email="status_change@example.com"
    )
    
    task = Task(
        user_id=user.user_id,
        status=TaskStatus.FAILED,
        current_stage=TaskStage.SHUFFLE,
        progress=80,
        error="Shuffle failed",
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
    
    # Retry the task
    retried_task = await retry_task(
        db=async_session,
        task_id=task.task_id,
        user_id=user.user_id
    )
    
    # Verify status changed to running
    assert retried_task.status == TaskStatus.RUNNING


@pytest.mark.asyncio
async def test_retry_clears_error_message(async_session):
    """Test retry_task clears the error message."""
    user = await create_test_user(
        async_session,
        google_sub="error_clear_user",
        email="error_clear@example.com"
    )
    
    task = Task(
        user_id=user.user_id,
        status=TaskStatus.FAILED,
        current_stage=TaskStage.AI_ANALYSIS,
        progress=60,
        error="Analysis service timeout",
        retry_count_by_stage={
            "extract_docx": 0,
            "ai_understanding": 0,
            "ai_analysis": 0
        }
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    # Retry the task
    retried_task = await retry_task(
        db=async_session,
        task_id=task.task_id,
        user_id=user.user_id
    )
    
    # Verify error cleared
    assert retried_task.error is None


@pytest.mark.asyncio
async def test_retry_multiple_times_accumulates_count(async_session):
    """Test multiple retries accumulate retry count for same stage."""
    user = await create_test_user(
        async_session,
        google_sub="multi_retry_user",
        email="multi_retry@example.com"
    )
    
    task = Task(
        user_id=user.user_id,
        status=TaskStatus.FAILED,
        current_stage=TaskStage.RENDER_DOCX,
        progress=95,
        error="Render failed",
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
    
    # First retry
    retried_task = await retry_task(
        db=async_session,
        task_id=task.task_id,
        user_id=user.user_id
    )
    assert retried_task.retry_count_by_stage["render_docx"] == 1
    
    # Simulate failure again
    retried_task.status = TaskStatus.FAILED
    retried_task.error = "Render failed again"
    await async_session.commit()
    await async_session.refresh(retried_task)
    
    # Second retry
    retried_again = await retry_task(
        db=async_session,
        task_id=task.task_id,
        user_id=user.user_id
    )
    assert retried_again.retry_count_by_stage["render_docx"] == 2
    assert retried_again.status == TaskStatus.RUNNING
    assert retried_again.error is None


@pytest.mark.asyncio
async def test_retry_not_found_raises_404(async_session):
    """Test retry_task raises 404 for non-existent task."""
    import uuid
    
    user = await create_test_user(
        async_session,
        google_sub="notfound_user",
        email="notfound@example.com"
    )
    
    fake_task_id = uuid.uuid4()
    
    with pytest.raises(HTTPException) as exc_info:
        await retry_task(
            db=async_session,
            task_id=fake_task_id,
            user_id=user.user_id
        )
    
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_retry_other_user_raises_403(async_session):
    """Test retry_task raises 403 for other user's task."""
    owner = await create_test_user(
        async_session,
        google_sub="owner_user",
        email="owner@example.com"
    )
    
    other = await create_test_user(
        async_session,
        google_sub="other_user",
        email="other@example.com"
    )
    
    task = Task(
        user_id=owner.user_id,
        status=TaskStatus.FAILED,
        current_stage=TaskStage.AI_UNDERSTANDING,
        error="Failed",
        retry_count_by_stage={"ai_understanding": 0}
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    with pytest.raises(HTTPException) as exc_info:
        await retry_task(
            db=async_session,
            task_id=task.task_id,
            user_id=other.user_id
        )
    
    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_retry_completed_task_raises_400(async_session):
    """Test retry_task raises 400 for completed task."""
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
    
    with pytest.raises(HTTPException) as exc_info:
        await retry_task(
            db=async_session,
            task_id=task.task_id,
            user_id=user.user_id
        )
    
    assert exc_info.value.status_code == 400
    assert "not in failed state" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_retry_running_task_raises_400(async_session):
    """Test retry_task raises 400 for running task."""
    user = await create_test_user(
        async_session,
        google_sub="running_user",
        email="running@example.com"
    )
    
    task = Task(
        user_id=user.user_id,
        status=TaskStatus.RUNNING,
        current_stage=TaskStage.SHUFFLE,
        progress=75,
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
    
    with pytest.raises(HTTPException) as exc_info:
        await retry_task(
            db=async_session,
            task_id=task.task_id,
            user_id=user.user_id
        )
    
    assert exc_info.value.status_code == 400
    assert "not in failed state" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_retry_queued_task_raises_400(async_session):
    """Test retry_task raises 400 for queued task."""
    user = await create_test_user(
        async_session,
        google_sub="queued_user",
        email="queued@example.com"
    )
    
    task = Task(
        user_id=user.user_id,
        status=TaskStatus.QUEUED,
        retry_count_by_stage={}
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    with pytest.raises(HTTPException) as exc_info:
        await retry_task(
            db=async_session,
            task_id=task.task_id,
            user_id=user.user_id
        )
    
    assert exc_info.value.status_code == 400
    assert "not in failed state" in exc_info.value.detail.lower()
