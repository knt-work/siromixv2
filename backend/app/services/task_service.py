"""
Task service: Business logic for task management.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
import uuid
from fastapi import HTTPException

from app.models.task import Task, TaskStatus, TaskStage


async def create_task(
    db: AsyncSession,
    user_id: uuid.UUID,
    simulate_failure_stage: Optional[TaskStage] = None,
) -> Task:
    """
    Create a new task and prepare it for processing.
    
    Args:
        db: Database session
        user_id: UUID of the user creating the task
        simulate_failure_stage: Stage at which to simulate failure (for testing)
        
    Returns:
        Task: Newly created task with status="queued"
        
    Note:
        This function creates the task record but does NOT enqueue the Celery task.
        The endpoint should enqueue the Celery task after calling this function.
        The simulate_failure_stage parameter should be passed to the Celery task.
    """
    # Create new task
    task = Task(
        user_id=user_id,
        status=TaskStatus.QUEUED,
        current_stage=None,
        progress=0,
        retry_count_by_stage={},
        error=None,
    )
    
    db.add(task)
    await db.commit()
    await db.refresh(task)
    
    return task


async def get_task_by_id(
    db: AsyncSession,
    task_id: uuid.UUID,
) -> Optional[Task]:
    """
    Get task by task_id.
    
    Args:
        db: Database session
        task_id: UUID of task
        
    Returns:
        Task if found, None otherwise
    """
    result = await db.execute(
        select(Task).where(Task.task_id == task_id)
    )
    return result.scalar_one_or_none()


async def get_user_tasks(
    db: AsyncSession,
    user_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
) -> list[Task]:
    """
    Get tasks for a specific user, ordered by creation time (newest first).
    
    Args:
        db: Database session
        user_id: UUID of the user
        limit: Maximum number of tasks to return
        offset: Number of tasks to skip (for pagination)
        
    Returns:
        List of tasks owned by the user
    """
    result = await db.execute(
        select(Task)
        .where(Task.user_id == user_id)
        .order_by(Task.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def update_task_status(
    db: AsyncSession,
    task_id: uuid.UUID,
    status: TaskStatus,
    current_stage: Optional[TaskStage] = None,
    progress: Optional[int] = None,
    error: Optional[str] = None,
) -> Optional[Task]:
    """
    Update task status and related fields.
    
    Args:
        db: Database session
        task_id: UUID of task to update
        status: New task status
        current_stage: Current pipeline stage (optional)
        progress: Progress percentage 0-100 (optional)
        error: Error message if failed (optional)
        
    Returns:
        Updated task if found, None otherwise
    """
    task = await get_task_by_id(db, task_id)
    if not task:
        return None
    
    task.status = status
    if current_stage is not None:
        task.current_stage = current_stage
    if progress is not None:
        task.progress = progress
    if error is not None:
        task.error = error
    
    await db.commit()
    await db.refresh(task)
    return task


async def increment_retry_count(
    db: AsyncSession,
    task_id: uuid.UUID,
    stage: TaskStage,
) -> Optional[Task]:
    """
    Increment retry count for a specific stage.
    
    Args:
        db: Database session
        task_id: UUID of task
        stage: Pipeline stage to increment retry count for
        
    Returns:
        Updated task if found, None otherwise
    """
    task = await get_task_by_id(db, task_id)
    if not task:
        return None
    
    # Get current retry count for this stage
    stage_name = stage.value
    current_count = task.retry_count_by_stage.get(stage_name, 0)
    
    # Increment retry count
    task.retry_count_by_stage[stage_name] = current_count + 1
    
    # Mark the change (SQLAlchemy may not detect JSONB dict updates)
    from sqlalchemy.orm import attributes
    attributes.flag_modified(task, "retry_count_by_stage")
    
    await db.commit()
    await db.refresh(task)
    return task


async def get_task_with_logs(
    db: AsyncSession,
    task_id: uuid.UUID,
    user_id: uuid.UUID,
    log_limit: int = 50,
) -> Task:
    """
    Get task by ID with recent logs, with ownership validation.
    
    Args:
        db: Database session
        task_id: UUID of task
        user_id: UUID of authenticated user (for ownership check)
        log_limit: Maximum number of recent logs to fetch
        
    Returns:
        Task with logs relationship loaded
        
    Raises:
        HTTPException: 404 if task not found, 403 if user doesn't own task
    """
    # Fetch task with logs eagerly loaded
    result = await db.execute(
        select(Task)
        .where(Task.task_id == task_id)
        .options(selectinload(Task.logs))
    )
    task = result.scalar_one_or_none()
    
    # Check if task exists
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check ownership
    if task.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this task"
        )
    
    # Limit logs to most recent entries (already ordered by timestamp DESC in model)
    if task.logs and len(task.logs) > log_limit:
        task.logs = task.logs[:log_limit]
    
    return task


async def retry_task(
    db: AsyncSession,
    task_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Task:
    """
    Retry a failed task, incrementing retry count and re-enqueuing the Celery task.
    
    Args:
        db: Database session
        task_id: UUID of task to retry
        user_id: UUID of authenticated user (for ownership check)
        
    Returns:
        Updated task with status="running" and retry_count incremented
        
    Raises:
        HTTPException: 404 if task not found, 403 if not owner, 400 if not failed
    """
    # Fetch task
    result = await db.execute(
        select(Task).where(Task.task_id == task_id)
    )
    task = result.scalar_one_or_none()
    
    # Check if task exists
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check ownership
    if task.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to retry this task"
        )
    
    # Check if task is in failed state
    if task.status != TaskStatus.FAILED:
        raise HTTPException(
            status_code=400,
            detail=f"Task is not in failed state (current status: {task.status.value})"
        )
    
    # Increment retry count for the failed stage
    if task.current_stage:
        stage_name = task.current_stage.value
        current_count = task.retry_count_by_stage.get(stage_name, 0)
        task.retry_count_by_stage[stage_name] = current_count + 1
        
        # Mark the JSONB field as modified
        from sqlalchemy.orm import attributes
        attributes.flag_modified(task, "retry_count_by_stage")
    
    # Reset task to running state
    task.status = TaskStatus.RUNNING
    task.error = None
    
    await db.commit()
    await db.refresh(task)
    
    return task

