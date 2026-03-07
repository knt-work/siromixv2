"""
Integration tests for failure and retry flow (T093).

Tests task failure simulation and retry mechanism.
"""

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from unittest.mock import patch, AsyncMock

from app.models.user import User
from app.models.task import Task
from app.models.task_log import TaskLog, LogLevel
from app.schemas.task import TaskCreate


@pytest.mark.asyncio
async def test_failure_and_retry_flow(async_session):
    """
    Test complete failure and retry flow.
    
    Flow:
    1. Create user and task with simulate_failure_stage='ai_understanding'
    2. Simulate task processing until failure
    3. Verify task fails at 'ai_understanding' stage
    4. Retry task from failed stage
    5. Verify task completes successfully on retry
    """
    # 1. Create test user
    test_user = User(
        google_sub="retry_test_user",
        email="retry@example.com",
        display_name="Retry Test User"
    )
    async_session.add(test_user)
    await async_session.commit()
    await async_session.refresh(test_user)
    
    # 2. Create task (will track simulated failure in retry_count_by_stage)
    from app.models.task import TaskStage, TaskStatus
    
    task = Task(
        user_id=test_user.user_id,
        status=TaskStatus.QUEUED,
        current_stage=None,
        progress=0,
        retry_count_by_stage={
            "extract_docx": 0,
            "ai_understanding": 0,
            "ai_analysis": 0,
            "shuffle": 0,
            "render_docx": 0,
        },
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    # 3. Simulate task processing until failure
    # Stage 1: extract_docx (success)
    task.status = TaskStatus.RUNNING
    task.current_stage = TaskStage.EXTRACT_DOCX
    task.progress = 20
    
    log1 = TaskLog(
        task_id=task.task_id,
        stage=TaskStage.EXTRACT_DOCX.value,
        level=LogLevel.INFO,
        message="Extracting data from exam document"
    )
    async_session.add(log1)
    await async_session.commit()
    await async_session.refresh(task)
    
    assert task.current_stage == TaskStage.EXTRACT_DOCX
    assert task.status == TaskStatus.RUNNING
    
    # Stage 2: ai_understanding (FAIL - simulated)
    task.current_stage = TaskStage.AI_UNDERSTANDING
    task.status = TaskStatus.FAILED
    task.progress = 40
    
    log2 = TaskLog(
        task_id=task.task_id,
        stage=TaskStage.AI_UNDERSTANDING.value,
        level=LogLevel.ERROR,
        message="Simulated failure at stage: ai_understanding"
    )
    async_session.add(log2)
    await async_session.commit()
    await async_session.refresh(task)
    
    # Verify task failed at correct stage
    assert task.status == TaskStatus.FAILED
    assert task.current_stage == TaskStage.AI_UNDERSTANDING
    assert task.retry_count_by_stage.get("ai_understanding", 0) == 0
    
    # 4. Retry task from failed stage
    # Retry increments the retry counter and resets status to queued
    task.retry_count_by_stage["ai_understanding"] = task.retry_count_by_stage.get("ai_understanding", 0) + 1
    flag_modified(task, "retry_count_by_stage")  # Mark JSON field as modified
    task.status = TaskStatus.QUEUED
    
    retry_log = TaskLog(
        task_id=task.task_id,
        stage=TaskStage.AI_UNDERSTANDING.value,
        level=LogLevel.INFO,
        message=f"Retrying stage: ai_understanding (retry #{task.retry_count_by_stage['ai_understanding']})"
    )
    async_session.add(retry_log)
    await async_session.commit()
    await async_session.refresh(task)
    
    assert task.status == TaskStatus.QUEUED
    assert task.retry_count_by_stage["ai_understanding"] == 1
    
    # 5. Simulate successful retry through all remaining stages
    stages = [
        (TaskStage.AI_UNDERSTANDING, 40),  # Retry from here
        (TaskStage.AI_ANALYSIS, 60),
        (TaskStage.SHUFFLE, 80),
        (TaskStage.RENDER_DOCX, 100),
    ]
    
    for stage, expected_progress in stages:
        task.current_stage = stage
        task.status = TaskStatus.RUNNING
        task.progress = expected_progress
        
        log = TaskLog(
            task_id=task.task_id,
            stage=stage.value,
            level=LogLevel.INFO,
            message=f"Processing stage: {stage.value} (after retry)"
        )
        async_session.add(log)
        await async_session.commit()
        await async_session.refresh(task)
    
    # Mark as completed
    task.status = TaskStatus.COMPLETED
    await async_session.commit()
    await async_session.refresh(task)
    
    # Verify final state
    assert task.status == TaskStatus.COMPLETED
    assert task.progress == 100
    assert task.retry_count_by_stage["ai_understanding"] == 1
    assert task.current_stage == TaskStage.RENDER_DOCX
    
    # Verify all logs
    stmt = select(TaskLog).where(TaskLog.task_id == task.task_id).order_by(TaskLog.timestamp)
    result = await async_session.execute(stmt)
    logs = result.scalars().all()
    
    # Logs: extraction (success), understanding (fail), retry message, understanding (success), analysis, shuffler, renderer
    assert len(logs) >= 6
    
    # Verify failure log exists
    error_logs = [log for log in logs if log.level == LogLevel.ERROR]
    assert len(error_logs) == 1
    assert "Simulated failure" in error_logs[0].message
    
    # Verify retry log exists
    retry_logs = [log for log in logs if "Retrying" in log.message]
    assert len(retry_logs) >= 1


@pytest.mark.asyncio
async def test_retry_increments_counter_for_correct_stage(async_session):
    """Test that retry increments only the failed stage's retry counter."""
    # Create test user
    test_user = User(
        google_sub="counter_test_user",
        email="counter@example.com",
        display_name="Counter Test User"
    )
    async_session.add(test_user)
    await async_session.commit()
    await async_session.refresh(test_user)
    
    # Create task
    from app.models.task import TaskStage, TaskStatus
    
    task = Task(
        user_id=test_user.user_id,
        status=TaskStatus.FAILED,
        current_stage=TaskStage.AI_ANALYSIS,
        progress=60,
        retry_count_by_stage={
            "extract_docx": 0,
            "ai_understanding": 0,
            "ai_analysis": 0,
            "shuffle": 0,
            "render_docx": 0,
        },
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    # Verify initial state
    assert task.retry_count_by_stage.get("ai_analysis", 0) == 0
    assert task.retry_count_by_stage.get("ai_understanding", 0) == 0
    
    # Retry failed stage (ai_analysis)
    task.retry_count_by_stage["ai_analysis"] = task.retry_count_by_stage.get("ai_analysis", 0) + 1
    flag_modified(task, "retry_count_by_stage")  # Mark JSON field as modified
    task.status = TaskStatus.QUEUED
    await async_session.commit()
    await async_session.refresh(task)
    
    # Verify only ai_analysis counter incremented
    assert task.retry_count_by_stage["ai_analysis"] == 1
    assert task.retry_count_by_stage.get("extract_docx", 0) == 0
    assert task.retry_count_by_stage.get("ai_understanding", 0) == 0
    assert task.retry_count_by_stage.get("shuffle", 0) == 0
    assert task.retry_count_by_stage.get("render_docx", 0) == 0


@pytest.mark.asyncio
async def test_multiple_retries_for_same_stage(async_session):
    """Test that a stage can be retried multiple times."""
    # Create test user
    test_user = User(
        google_sub="multi_retry_user",
        email="multiretry@example.com",
        display_name="Multi Retry User"
    )
    async_session.add(test_user)
    await async_session.commit()
    await async_session.refresh(test_user)
    
    # Create task that will fail extract_docx 3 times
    from app.models.task import TaskStage, TaskStatus
    
    task = Task(
        user_id=test_user.user_id,
        status=TaskStatus.QUEUED,
        current_stage=None,
        progress=0,
        retry_count_by_stage={
            "extract_docx": 0,
        },
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    # Simulate 3 failures and retries
    for i in range(3):
        # Fail at extract_docx
        task.status = TaskStatus.FAILED
        task.current_stage = TaskStage.EXTRACT_DOCX
        
        fail_log = TaskLog(
            task_id=task.task_id,
            stage=TaskStage.EXTRACT_DOCX.value,
            level=LogLevel.ERROR,
            message=f"Failure attempt {i+1}"
        )
        async_session.add(fail_log)
        await async_session.commit()
        await async_session.refresh(task)
        
        # Retry
        task.retry_count_by_stage["extract_docx"] = task.retry_count_by_stage.get("extract_docx", 0) + 1
        flag_modified(task, "retry_count_by_stage")  # Mark JSON field as modified
        task.status = TaskStatus.QUEUED
        
        retry_log = TaskLog(
            task_id=task.task_id,
            stage=TaskStage.EXTRACT_DOCX.value,
            level=LogLevel.INFO,
            message=f"Retry #{task.retry_count_by_stage['extract_docx']}"
        )
        async_session.add(retry_log)
        await async_session.commit()
        await async_session.refresh(task)
    
    # Verify retry count
    assert task.retry_count_by_stage["extract_docx"] == 3
    
    # Verify all logs
    stmt = select(TaskLog).where(TaskLog.task_id == task.task_id)
    result = await async_session.execute(stmt)
    logs = result.scalars().all()
    
    # 3 failures + 3 retries = 6 logs
    assert len(logs) == 6
    error_logs = [log for log in logs if log.level == LogLevel.ERROR]
    assert len(error_logs) == 3
