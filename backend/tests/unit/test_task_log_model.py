"""
Unit tests for TaskLog model (T039).

Tests log creation with stage, level, message, and data_json fields.
"""

import pytest
import uuid
from datetime import datetime
from sqlalchemy import select

from app.models.task import Task, TaskStage
from app.models.task_log import TaskLog, LogLevel


@pytest.mark.asyncio
async def test_task_log_creation(async_session, test_user):
    """Test basic task log creation."""
    # Create a task first
    task = Task(user_id=test_user.user_id)
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    # Create log
    log = TaskLog(
        task_id=task.task_id,
        stage="extract_docx",
        level=LogLevel.INFO,
        message="Starting document extraction"
    )
    async_session.add(log)
    await async_session.commit()
    await async_session.refresh(log)
    
    assert log.log_id is not None
    assert log.task_id == task.task_id
    assert log.stage == "extract_docx"
    assert log.level == LogLevel.INFO
    assert log.message == "Starting document extraction"
    assert log.data_json is None
    assert log.timestamp is not None
    assert isinstance(log.timestamp, datetime)


@pytest.mark.asyncio
async def test_task_log_with_data_json(async_session, test_user):
    """Test log creation with structured data_json."""
    task = Task(user_id=test_user.user_id)
    async_session.add(task)
    await async_session.commit()
    
    # Create log with JSONB data
    log = TaskLog(
        task_id=task.task_id,
        stage="ai_analysis",
        level=LogLevel.INFO,
        message="Analysis complete",
        data_json={
            "blocks_analyzed": 42,
            "duration_ms": 3200,
            "confidence_score": 0.95
        }
    )
    async_session.add(log)
    await async_session.commit()
    await async_session.refresh(log)
    
    assert log.data_json is not None
    assert log.data_json["blocks_analyzed"] == 42
    assert log.data_json["duration_ms"] == 3200
    assert log.data_json["confidence_score"] == 0.95


@pytest.mark.asyncio
async def test_task_log_all_log_levels(async_session, test_user):
    """Test creating logs with different log levels."""
    task = Task(user_id=test_user.user_id)
    async_session.add(task)
    await async_session.commit()
    
    # Create logs with all levels
    log_debug = TaskLog(
        task_id=task.task_id,
        stage="extract_docx",
        level=LogLevel.DEBUG,
        message="Debug trace information"
    )
    log_info = TaskLog(
        task_id=task.task_id,
        stage="ai_understanding",
        level=LogLevel.INFO,
        message="Processing stage started"
    )
    log_warning = TaskLog(
        task_id=task.task_id,
        stage="ai_analysis",
        level=LogLevel.WARNING,
        message="Low confidence detected"
    )
    log_error = TaskLog(
        task_id=task.task_id,
        stage="shuffle",
        level=LogLevel.ERROR,
        message="Variant generation failed"
    )
    
    async_session.add_all([log_debug, log_info, log_warning, log_error])
    await async_session.commit()
    
    # Verify all logs were created
    stmt = select(TaskLog).where(TaskLog.task_id == task.task_id)
    result = await async_session.execute(stmt)
    logs = result.scalars().all()
    
    assert len(logs) == 4
    levels = [log.level for log in logs]
    assert LogLevel.DEBUG in levels
    assert LogLevel.INFO in levels
    assert LogLevel.WARNING in levels
    assert LogLevel.ERROR in levels


@pytest.mark.asyncio
async def test_task_log_null_stage(async_session, test_user):
    """Test that stage can be null for general task logs."""
    task = Task(user_id=test_user.user_id)
    async_session.add(task)
    await async_session.commit()
    
    # Create log without stage (general task log)
    log = TaskLog(
        task_id=task.task_id,
        stage=None,
        level=LogLevel.INFO,
        message="Task enqueued successfully"
    )
    async_session.add(log)
    await async_session.commit()
    await async_session.refresh(log)
    
    assert log.stage is None
    assert log.message == "Task enqueued successfully"


@pytest.mark.asyncio
async def test_task_log_task_relationship(async_session, test_user):
    """Test relationship between TaskLog and Task."""
    task = Task(user_id=test_user.user_id)
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    # Create logs
    log1 = TaskLog(
        task_id=task.task_id,
        level=LogLevel.INFO,
        message="First log"
    )
    log2 = TaskLog(
        task_id=task.task_id,
        level=LogLevel.INFO,
        message="Second log"
    )
    async_session.add_all([log1, log2])
    await async_session.commit()
    
    # Access logs through task relationship
    await async_session.refresh(task, ['logs'])
    assert len(task.logs) == 2
    assert any(log.message == "First log" for log in task.logs)
    assert any(log.message == "Second log" for log in task.logs)
    
    # Access task through log relationship
    await async_session.refresh(log1, ['task'])
    assert log1.task.task_id == task.task_id


@pytest.mark.asyncio
async def test_task_log_cascade_delete(async_session, test_user):
    """Test that logs are deleted when parent task is deleted."""
    task = Task(user_id=test_user.user_id)
    async_session.add(task)
    await async_session.commit()
    
    # Create logs
    log1 = TaskLog(
        task_id=task.task_id,
        level=LogLevel.INFO,
        message="Log 1"
    )
    log2 = TaskLog(
        task_id=task.task_id,
        level=LogLevel.INFO,
        message="Log 2"
    )
    async_session.add_all([log1, log2])
    await async_session.commit()
    
    log1_id = log1.log_id
    log2_id = log2.log_id
    
    # Delete task
    await async_session.delete(task)
    await async_session.commit()
    
    # Verify logs are also deleted
    stmt = select(TaskLog).where(TaskLog.log_id.in_([log1_id, log2_id]))
    result = await async_session.execute(stmt)
    remaining_logs = result.scalars().all()
    
    assert len(remaining_logs) == 0


@pytest.mark.asyncio
async def test_task_log_ordering(async_session, test_user):
    """Test that logs are ordered by timestamp."""
    import asyncio
    
    task = Task(user_id=test_user.user_id)
    async_session.add(task)
    await async_session.commit()
    
    # Create logs with small delays
    log1 = TaskLog(
        task_id=task.task_id,
        level=LogLevel.INFO,
        message="First log"
    )
    async_session.add(log1)
    await async_session.commit()
    
    await asyncio.sleep(0.01)  # Small delay
    
    log2 = TaskLog(
        task_id=task.task_id,
        level=LogLevel.INFO,
        message="Second log"
    )
    async_session.add(log2)
    await async_session.commit()
    
    await asyncio.sleep(0.01)  # Small delay
    
    log3 = TaskLog(
        task_id=task.task_id,
        level=LogLevel.INFO,
        message="Third log"
    )
    async_session.add(log3)
    await async_session.commit()
    
    # Refresh task with logs (should be ordered by timestamp)
    await async_session.refresh(task, ['logs'])
    
    assert len(task.logs) == 3
    assert task.logs[0].message == "First log"
    assert task.logs[1].message == "Second log"
    assert task.logs[2].message == "Third log"
    
    # Verify timestamps are in order
    assert task.logs[0].timestamp <= task.logs[1].timestamp
    assert task.logs[1].timestamp <= task.logs[2].timestamp


@pytest.mark.asyncio
async def test_task_log_complex_data_json(async_session, test_user):
    """Test log with complex nested JSONB data."""
    task = Task(user_id=test_user.user_id)
    async_session.add(task)
    await async_session.commit()
    
    # Create log with complex nested data
    log = TaskLog(
        task_id=task.task_id,
        stage="ai_understanding",
        level=LogLevel.INFO,
        message="Schema mapping complete",
        data_json={
            "input": {
                "questions": 25,
                "options_per_question": [4, 4, 3, 5, 4]
            },
            "output": {
                "mapped_questions": 23,
                "unmapped_questions": 2,
                "warnings": ["Question 12: ambiguous options", "Question 18: missing key"]
            },
            "metrics": {
                "duration_ms": 1250,
                "confidence": {
                    "mean": 0.87,
                    "median": 0.92,
                    "min": 0.45
                }
            }
        }
    )
    async_session.add(log)
    await async_session.commit()
    await async_session.refresh(log)
    
    assert log.data_json["input"]["questions"] == 25
    assert log.data_json["output"]["mapped_questions"] == 23
    assert log.data_json["metrics"]["confidence"]["mean"] == 0.87
    assert len(log.data_json["output"]["warnings"]) == 2


@pytest.mark.asyncio
async def test_task_log_with_task_stage_enum(async_session, test_user):
    """Test log creation with TaskStage enum value as stage."""
    task = Task(user_id=test_user.user_id)
    async_session.add(task)
    await async_session.commit()
    
    # Create log using TaskStage enum value
    log = TaskLog(
        task_id=task.task_id,
        stage=TaskStage.RENDER_DOCX.value,
        level=LogLevel.INFO,
        message="Rendering final document"
    )
    async_session.add(log)
    await async_session.commit()
    await async_session.refresh(log)
    
    assert log.stage == "render_docx"
    assert log.stage == TaskStage.RENDER_DOCX.value


@pytest.mark.asyncio
async def test_task_log_timestamp_auto_populate(async_session, test_user):
    """Test that timestamp is automatically populated on creation."""
    task = Task(user_id=test_user.user_id)
    async_session.add(task)
    await async_session.commit()
    
    log = TaskLog(
        task_id=task.task_id,
        level=LogLevel.INFO,
        message="Timestamp test"
    )
    async_session.add(log)
    await async_session.commit()
    await async_session.refresh(log)
    
    assert log.timestamp is not None
    assert isinstance(log.timestamp, datetime)


@pytest.mark.asyncio
async def test_task_log_multiple_stages_same_task(async_session, test_user):
    """Test creating logs for different stages of the same task."""
    task = Task(user_id=test_user.user_id)
    async_session.add(task)
    await async_session.commit()
    
    # Create logs for each pipeline stage
    stages = [
        TaskStage.EXTRACT_DOCX,
        TaskStage.AI_UNDERSTANDING,
        TaskStage.AI_ANALYSIS,
        TaskStage.SHUFFLE,
        TaskStage.RENDER_DOCX
    ]
    
    logs = []
    for stage in stages:
        log = TaskLog(
            task_id=task.task_id,
            stage=stage.value,
            level=LogLevel.INFO,
            message=f"Processing {stage.value}"
        )
        logs.append(log)
    
    async_session.add_all(logs)
    await async_session.commit()
    
    # Verify all logs exist
    stmt = select(TaskLog).where(TaskLog.task_id == task.task_id)
    result = await async_session.execute(stmt)
    task_logs = result.scalars().all()
    
    assert len(task_logs) == 5
    log_stages = [log.stage for log in task_logs]
    for stage in stages:
        assert stage.value in log_stages


@pytest.mark.asyncio
async def test_task_log_error_with_exception_data(async_session, test_user):
    """Test error log with exception details in data_json."""
    task = Task(user_id=test_user.user_id)
    async_session.add(task)
    await async_session.commit()
    
    # Create error log with exception details
    log = TaskLog(
        task_id=task.task_id,
        stage="ai_analysis",
        level=LogLevel.ERROR,
        message="Analysis pipeline failed",
        data_json={
            "exception_type": "AIServiceException",
            "exception_message": "Service timeout after 30s",
            "traceback": "Traceback (most recent call last)...",
            "retry_attempt": 2,
            "can_retry": False
        }
    )
    async_session.add(log)
    await async_session.commit()
    await async_session.refresh(log)
    
    assert log.level == LogLevel.ERROR
    assert log.data_json["exception_type"] == "AIServiceException"
    assert log.data_json["retry_attempt"] == 2
    assert log.data_json["can_retry"] is False
