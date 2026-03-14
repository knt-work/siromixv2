"""
/tasks endpoints: Task creation and management.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.task import TaskCreate, TaskResponse, TaskWithLogsResponse
from app.services import task_service


router = APIRouter()


@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TaskResponse:
    """
    Create a new task and enqueue it for processing.
    
    Args:
        task_data: Task creation parameters (simulate_failure_stage optional)
        current_user: Authenticated user from token verification
        db: Database session
        
    Returns:
        TaskResponse: Newly created task with status="queued"
        
    Raises:
        401: If token is missing, invalid, or expired
        422: If task_data validation fails
    """
    # Create task in database
    task = await task_service.create_task(
        db=db,
        user_id=current_user.user_id,
        exam_id=task_data.exam_id,
        simulate_failure_stage=task_data.simulate_failure_stage,
    )
    
    # Enqueue Celery task for background processing
    # Import here to avoid circular dependency
    from app.tasks.process_task import process_task
    
    # Pass task_id and simulate_failure_stage to worker
    process_task.delay(
        str(task.task_id),
        task_data.simulate_failure_stage.value if task_data.simulate_failure_stage else None
    )
    
    return TaskResponse.model_validate(task)


@router.get("/tasks/{task_id}", response_model=TaskWithLogsResponse)
async def get_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TaskWithLogsResponse:
    """
    Get task by ID with recent logs (last 50).
    
    Args:
        task_id: UUID of the task to retrieve
        current_user: Authenticated user from token verification
        db: Database session
        
    Returns:
        TaskWithLogsResponse: Task data with logs array
        
    Raises:
        401: If token is missing, invalid, or expired
        403: If task belongs to a different user
        404: If task not found
    """
    # Fetch task with ownership validation
    task = await task_service.get_task_with_logs(
        db=db,
        task_id=task_id,
        user_id=current_user.user_id,
        log_limit=50
    )
    
    return TaskWithLogsResponse.model_validate(task)


@router.post("/tasks/{task_id}/retry", response_model=TaskResponse)
async def retry_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TaskResponse:
    """
    Retry a failed task, incrementing retry count and resuming from failed stage.
    
    Args:
        task_id: UUID of the task to retry
        current_user: Authenticated user from token verification
        db: Database session
        
    Returns:
        TaskResponse: Updated task with status="running"
        
    Raises:
        401: If token is missing, invalid, or expired
        403: If task belongs to a different user
        404: If task not found
        400: If task is not in failed state
    """
    # Retry task with ownership and state validation
    task = await task_service.retry_task(
        db=db,
        task_id=task_id,
        user_id=current_user.user_id
    )
    
    # Re-enqueue Celery task for background processing
    from app.tasks.process_task import process_task
    
    # Pass task_id and None for simulate_failure_stage (retry should complete)
    process_task.delay(str(task.task_id), None)
    
    return TaskResponse.model_validate(task)

