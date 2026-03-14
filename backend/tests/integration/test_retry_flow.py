"""
Integration test for retry flow (T056).

Tests: task fails at stage, retry resumes from that stage, retry_count increments, completes on retry.
"""

import pytest
import asyncio

from app.models.task import Task, TaskStatus, TaskStage
from app.models.task_log import LogLevel
from app.services.task_service import create_task, retry_task, get_task_by_id
from app.services.task_log_service import get_error_logs
from tests.utils import create_test_user, create_test_exam


@pytest.mark.asyncio
async def test_retry_flow_task_fails_then_completes(async_session):
    """
    Integration test for retry flow.
    
    Flow:
    1. Create task with simulate_failure_stage
    2. Simulate task failing at that stage
    3. Verify task status = failed, error populated, logs exist
    4. Call retry_task
    5. Verify status = running, retry_count incremented, error cleared
    """
    # Create test user
    user = await create_test_user(
        async_session,
        google_sub="retry_flow_user",
        email="retry_flow@example.com"
    )
    exam = await create_test_exam(async_session, user)
    
    # 1. Create task (would normally enqueue to Celery, but we'll simulate)
    task = await create_task(
        db=async_session,
        user_id=user.user_id,
        exam_id=exam.exam_id,
        simulate_failure_stage=TaskStage.AI_UNDERSTANDING
    )
    
    assert task.status == TaskStatus.QUEUED
    assert task.progress == 0
    initial_task_id = task.task_id
    
    # 2. Simulate task processing and failure at ai_understanding
    # (In real workflow, the Celery worker would do this)
    
    # First stage succeeds
    task = await get_task_by_id(async_session, task.task_id)
    task.status = TaskStatus.RUNNING
    task.current_stage = TaskStage.EXTRACT_DOCX
    task.progress = 20
    await async_session.commit()
    await async_session.refresh(task)
    
    # Second stage (ai_understanding) fails
    task.current_stage = TaskStage.AI_UNDERSTANDING
    task.status = TaskStatus.FAILED
    task.progress = 40
    task.error = "Simulated failure at ai_understanding"
    task.retry_count_by_stage = {
        "extract_docx": 0,
        "ai_understanding": 0
    }
    await async_session.commit()
    await async_session.refresh(task)
    
    # 3. Verify failed state
    assert task.status == TaskStatus.FAILED
    assert task.current_stage == TaskStage.AI_UNDERSTANDING
    assert task.error == "Simulated failure at ai_understanding"
    assert task.retry_count_by_stage["ai_understanding"] == 0
    
    # 4. Call retry
    retried_task = await retry_task(
        db=async_session,
        task_id=task.task_id,
        user_id=user.user_id
    )
    
    # 5. Verify retry state
    assert retried_task.task_id == initial_task_id
    assert retried_task.status == TaskStatus.RUNNING
    assert retried_task.current_stage == TaskStage.AI_UNDERSTANDING  # Should resume from failed stage
    assert retried_task.error is None  # Error cleared
    assert retried_task.retry_count_by_stage["ai_understanding"] == 1  # Retry count incremented
    assert retried_task.retry_count_by_stage["extract_docx"] == 0  # Other stages unchanged
    
    # Simulate successful completion after retry
    retried_task.current_stage = TaskStage.RENDER_DOCX
    retried_task.status = TaskStatus.COMPLETED
    retried_task.progress = 100
    await async_session.commit()
    await async_session.refresh(retried_task)
    
    # Verify final state
    assert retried_task.status == TaskStatus.COMPLETED
    assert retried_task.progress == 100
    assert retried_task.retry_count_by_stage["ai_understanding"] == 1


@pytest.mark.asyncio
async def test_retry_flow_multiple_failures(async_session):
    """Test retry flow with multiple failures at same stage."""
    user = await create_test_user(
        async_session,
        google_sub="multi_fail_user",
        email="multi_fail@example.com"
    )
    exam = await create_test_exam(async_session, user)
    
    # Create task
    task = await create_task(
        db=async_session,
        user_id=user.user_id,
        exam_id=exam.exam_id,
        simulate_failure_stage=TaskStage.SHUFFLE
    )
    
    # Simulate processing to shuffle stage
    task.status = TaskStatus.RUNNING
    task.current_stage = TaskStage.SHUFFLE
    task.progress = 80
    task.retry_count_by_stage = {
        "extract_docx": 0,
        "ai_understanding": 0,
        "ai_analysis": 0,
        "shuffle": 0
    }
    await async_session.commit()
    
    # First failure
    task.status = TaskStatus.FAILED
    task.error = "First failure"
    await async_session.commit()
    await async_session.refresh(task)
    
    # First retry
    task = await retry_task(async_session, task.task_id, user.user_id)
    assert task.retry_count_by_stage["shuffle"] == 1
    assert task.status == TaskStatus.RUNNING
    
    # Second failure
    task.status = TaskStatus.FAILED
    task.error = "Second failure"
    await async_session.commit()
    await async_session.refresh(task)
    
    # Second retry
    task = await retry_task(async_session, task.task_id, user.user_id)
    assert task.retry_count_by_stage["shuffle"] == 2
    assert task.status == TaskStatus.RUNNING
    assert task.error is None
    
    # Complete successfully
    task.status = TaskStatus.COMPLETED
    task.current_stage = TaskStage.RENDER_DOCX
    task.progress = 100
    await async_session.commit()
    await async_session.refresh(task)
    
    # Verify final state
    assert task.status == TaskStatus.COMPLETED
    assert task.retry_count_by_stage["shuffle"] == 2


@pytest.mark.asyncio
async def test_retry_flow_different_stages(async_session):
    """Test retry flow with failures at different stages."""
    user = await create_test_user(
        async_session,
        google_sub="diff_stages_user",
        email="diff_stages@example.com"
    )
    exam = await create_test_exam(async_session, user)
    
    task = await create_task(async_session, user.user_id, exam.exam_id)
    
    # Fail at extract_docx
    task.status = TaskStatus.RUNNING
    task.current_stage = TaskStage.EXTRACT_DOCX
    task.progress = 20
    task.retry_count_by_stage = {"extract_docx": 0}
    await async_session.commit()
    
    task.status = TaskStatus.FAILED
    task.error = "Extract failed"
    await async_session.commit()
    await async_session.refresh(task)
    
    # Retry and succeed extract
    task = await retry_task(async_session, task.task_id, user.user_id)
    assert task.retry_count_by_stage["extract_docx"] == 1
    
    # Continue to ai_analysis and fail there
    task.current_stage = TaskStage.AI_ANALYSIS
    task.progress = 60
    task.retry_count_by_stage["ai_understanding"] = 0
    task.retry_count_by_stage["ai_analysis"] = 0
    task.status = TaskStatus.FAILED
    task.error = "Analysis failed"
    await async_session.commit()
    await async_session.refresh(task)
    
    # Retry again
    task = await retry_task(async_session, task.task_id, user.user_id)
    assert task.retry_count_by_stage["extract_docx"] == 1  # Previous retry count preserved
    assert task.retry_count_by_stage["ai_analysis"] == 1  # New stage incremented
    assert task.status == TaskStatus.RUNNING
    
    # Complete successfully
    task.status = TaskStatus.COMPLETED
    task.current_stage = TaskStage.RENDER_DOCX
    task.progress = 100
    await async_session.commit()
    await async_session.refresh(task)
    
    assert task.status == TaskStatus.COMPLETED
    assert task.retry_count_by_stage["extract_docx"] == 1
    assert task.retry_count_by_stage["ai_analysis"] == 1
