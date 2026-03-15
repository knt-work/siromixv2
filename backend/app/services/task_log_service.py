"""
Task log service: Business logic for task log management.
"""

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task_log import LogLevel, TaskLog


async def create_log(
    db: AsyncSession,
    task_id: uuid.UUID,
    stage: str | None,
    level: LogLevel,
    message: str,
    data_json: dict[str, Any] | None = None,
) -> TaskLog:
    """
    Create a structured log entry for a task.
    
    Args:
        db: Database session
        task_id: UUID of the task
        stage: Pipeline stage name (or None for general task logs)
        level: Log severity level (debug/info/warning/error)
        message: Human-readable log message
        data_json: Structured metadata (optional)
        
    Returns:
        TaskLog: Newly created log entry
    """
    log = TaskLog(
        task_id=task_id,
        stage=stage,
        level=level,
        message=message,
        data_json=data_json,
    )

    db.add(log)
    await db.commit()
    await db.refresh(log)

    return log


async def get_task_logs(
    db: AsyncSession,
    task_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
) -> list[TaskLog]:
    """
    Get logs for a specific task, ordered by timestamp (newest first).
    
    Args:
        db: Database session
        task_id: UUID of the task
        limit: Maximum number of logs to return
        offset: Number of logs to skip (for pagination)
        
    Returns:
        List of log entries for the task
    """
    result = await db.execute(
        select(TaskLog)
        .where(TaskLog.task_id == task_id)
        .order_by(TaskLog.timestamp.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def get_recent_logs(
    db: AsyncSession,
    task_id: uuid.UUID,
    count: int = 50,
) -> list[TaskLog]:
    """
    Get the most recent logs for a task.
    
    Args:
        db: Database session
        task_id: UUID of the task
        count: Number of recent logs to return
        
    Returns:
        List of most recent log entries, ordered by timestamp ascending
        (oldest first), so they can be displayed in chronological order
    """
    # Get logs in descending order (newest first)
    result = await db.execute(
        select(TaskLog)
        .where(TaskLog.task_id == task_id)
        .order_by(TaskLog.timestamp.desc())
        .limit(count)
    )
    logs = list(result.scalars().all())

    # Reverse to return in ascending order (oldest first)
    logs.reverse()

    return logs


async def get_logs_by_stage(
    db: AsyncSession,
    task_id: uuid.UUID,
    stage: str,
    limit: int = 50,
) -> list[TaskLog]:
    """
    Get logs for a specific stage of a task.
    
    Args:
        db: Database session
        task_id: UUID of the task
        stage: Pipeline stage name
        limit: Maximum number of logs to return
        
    Returns:
        List of log entries for the specified stage
    """
    result = await db.execute(
        select(TaskLog)
        .where(TaskLog.task_id == task_id, TaskLog.stage == stage)
        .order_by(TaskLog.timestamp.asc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_error_logs(
    db: AsyncSession,
    task_id: uuid.UUID,
) -> list[TaskLog]:
    """
    Get all error-level logs for a task.
    
    Args:
        db: Database session
        task_id: UUID of the task
        
    Returns:
        List of error-level log entries
    """
    result = await db.execute(
        select(TaskLog)
        .where(TaskLog.task_id == task_id, TaskLog.level == LogLevel.ERROR)
        .order_by(TaskLog.timestamp.asc())
    )
    return list(result.scalars().all())
