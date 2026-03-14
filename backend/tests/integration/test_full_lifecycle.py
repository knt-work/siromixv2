"""
Integration tests for full task lifecycle (T092).

Tests complete task lifecycle from creation through all stages to completion.
"""

import pytest
import asyncio
from sqlalchemy import select
from unittest.mock import patch, AsyncMock

from app.models.user import User
from app.models.exam import Exam, ExamStatus
from app.models.task import Task
from app.models.task_log import TaskLog, LogLevel
from app.schemas.task import TaskCreate
from app.core.deps import get_current_user
from app.api.v1.endpoints import tasks


@pytest.mark.asyncio
async def test_full_task_lifecycle_creation_to_completion(async_session):
    """
    Test complete task lifecycle without Celery.
    
    Flow:
    1. Create user
    2. Create task
    3. Verify task is created with status='queued'
    4. Simulate task processing through all 5 stages
    5. Verify task completes with status='completed'
    6. Verify all task logs are created
    """
    # 1. Create test user
    test_user = User(
        google_sub="lifecycle_test_user",
        email="lifecycle@example.com",
        display_name="Lifecycle Test User"
    )
    async_session.add(test_user)
    await async_session.commit()
    await async_session.refresh(test_user)
    exam = Exam(user_id=test_user.user_id, name="Test Exam", subject="Test", academic_year="2025-2026", num_variants=1, duration_minutes=60)
    async_session.add(exam)
    await async_session.commit()
    await async_session.refresh(exam)
    
    # 2. Create task (simulate API endpoint call)
    task_data = TaskCreate(
        exam_id=exam.exam_id,
        simulate_failure_stage=None  # No simulated failure
    )
    
    # Create task directly (bypass Celery for testing)
    task_dict = task_data.model_dump()
    task = Task(
        user_id=test_user.user_id,
        exam_id=exam.exam_id,
        status="queued",
        current_stage=None,
        progress=0,
        retry_count_by_stage={},
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    # 3. Verify task is created with correct initial state
    assert task.task_id is not None
    assert task.status.value == "queued"
    assert task.current_stage is None
    assert task.progress == 0
    assert task.user_id == test_user.user_id
    
    # 4. Simulate task processing through all 5 stages
    from app.models.task import TaskStage, TaskStatus
    
    stages = [
        (TaskStage.EXTRACT_DOCX, 20),
        (TaskStage.AI_UNDERSTANDING, 40),
        (TaskStage.AI_ANALYSIS, 60),
        (TaskStage.SHUFFLE, 80),
        (TaskStage.RENDER_DOCX, 100),
    ]
    
    for stage, expected_progress in stages:
        # Update task to simulate stage processing
        task.current_stage = stage
        task.status = TaskStatus.RUNNING
        task.progress = expected_progress
        
        # Create task log for stage
        log = TaskLog(
            task_id=task.task_id,
            stage=stage.value,
            level=LogLevel.INFO,
            message=f"Processing stage: {stage.value}",
            data_json={"progress": expected_progress}
        )
        async_session.add(log)
        
        await async_session.commit()
        await async_session.refresh(task)
        
        # Verify stage progress
        assert task.current_stage == stage
        assert task.progress == expected_progress
        assert task.status == TaskStatus.RUNNING
    
    # 5. Mark task as completed
    task.status = TaskStatus.COMPLETED
    task.current_stage = TaskStage.RENDER_DOCX  # Last stage
    await async_session.commit()
    await async_session.refresh(task)
    
    # Verify final state
    assert task.status == TaskStatus.COMPLETED
    assert task.progress == 100
    assert task.current_stage == TaskStage.RENDER_DOCX
    
    # 6. Verify all task logs were created
    stmt = select(TaskLog).where(TaskLog.task_id == task.task_id)
    result = await async_session.execute(stmt)
    logs = result.scalars().all()
    
    assert len(logs) == 5  # One log per stage
    stage_names = [log.stage for log in logs]
    assert TaskStage.EXTRACT_DOCX in stage_names
    assert TaskStage.AI_UNDERSTANDING in stage_names
    assert TaskStage.AI_ANALYSIS in stage_names
    assert TaskStage.SHUFFLE in stage_names
    assert TaskStage.RENDER_DOCX in stage_names


@pytest.mark.asyncio
async def test_task_status_transitions(async_session):
    """
    Test that task status transitions are valid.
    
    Valid transitions:
    - queued → running
    - running → completed
    - running → failed
    """
    # Create test user
    test_user = User(
        google_sub="transition_test_user",
        email="transition@example.com",
        display_name="Transition Test User"
    )
    async_session.add(test_user)
    await async_session.commit()
    await async_session.refresh(test_user)
    exam = Exam(user_id=test_user.user_id, name="Test Exam", subject="Test", academic_year="2025-2026", num_variants=1, duration_minutes=60)
    async_session.add(exam)
    await async_session.commit()
    await async_session.refresh(exam)
    
    # Create task
    from app.models.task import TaskStage, TaskStatus
    
    task = Task(
        user_id=test_user.user_id,
        exam_id=exam.exam_id,
        status=TaskStatus.QUEUED,
        current_stage=None,
        progress=0,
        retry_count_by_stage={},
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    # Transition: queued → running
    task.status = TaskStatus.RUNNING
    task.current_stage = TaskStage.EXTRACT_DOCX
    await async_session.commit()
    await async_session.refresh(task)
    assert task.status == TaskStatus.RUNNING
    
    # Transition: running → completed
    task.status = TaskStatus.COMPLETED
    task.progress = 100
    await async_session.commit()
    await async_session.refresh(task)
    assert task.status == TaskStatus.COMPLETED
    assert task.progress == 100


@pytest.mark.asyncio
async def test_multiple_tasks_for_same_user(async_session):
    """Test that a user can have multiple tasks."""
    # Create test user
    test_user = User(
        google_sub="multi_task_user",
        email="multitask@example.com",
        display_name="Multi Task User"
    )
    async_session.add(test_user)
    await async_session.commit()
    await async_session.refresh(test_user)
    exam = Exam(user_id=test_user.user_id, name="Test Exam", subject="Test", academic_year="2025-2026", num_variants=1, duration_minutes=60)
    async_session.add(exam)
    await async_session.commit()
    await async_session.refresh(exam)
    
    # Create 3 tasks for the same user
    from app.models.task import TaskStatus
    
    tasks = []
    for i in range(3):
        task = Task(
            user_id=test_user.user_id,
            exam_id=exam.exam_id,
            status=TaskStatus.QUEUED,
            current_stage=None,
            progress=0,
            retry_count_by_stage={},
        )
        async_session.add(task)
        tasks.append(task)
    
    await async_session.commit()
    
    # Refresh all tasks
    for task in tasks:
        await async_session.refresh(task)
    
    # Verify all tasks have different IDs but same user_id
    task_ids = [task.task_id for task in tasks]
    assert len(set(task_ids)) == 3  # All unique
    assert all(task.user_id == test_user.user_id for task in tasks)
    
    # Query tasks by user
    stmt = select(Task).where(Task.user_id == test_user.user_id)
    result = await async_session.execute(stmt)
    user_tasks = result.scalars().all()
    
    assert len(user_tasks) == 3
