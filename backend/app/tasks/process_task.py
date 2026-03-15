"""
Celery worker task for processing tasks through the pipeline (T048-T051).

This module implements the main task orchestration logic that:
- Updates task status to "running" (T050)
- Processes tasks through all 5 pipeline stages
- Implements structured logging at each stage (T049)
- Implements error handling and failure recovery (T051)
"""

import asyncio
import os
import uuid

from celery.utils.log import get_task_logger
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models.task import TaskStage, TaskStatus
from app.models.task_log import LogLevel
from app.services import task_log_service, task_service
from app.tasks import pipeline_stages
from app.tasks.celery_app import celery_app

# Celery logger
logger = get_task_logger(__name__)


def get_async_session_factory():
    """
    Create a new async session factory for the current event loop.
    This is needed because Celery workers use asyncio.run() which creates
    a new event loop for each task, and SQLAlchemy engines must be created
    in the same event loop where they'll be used.
    
    Returns:
        tuple: (session_factory, engine) so the engine can be disposed later
    """
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://siromix:siromix_dev_password@localhost:5432/siromix_v2"
    )

    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )

    session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    return session_factory, engine


@celery_app.task(bind=True, name="process_task")
def process_task(self, task_id_str: str, simulate_failure_stage: str | None = None):
    """
    Process a task through all pipeline stages.
    
    This is the main worker task that orchestrates the entire pipeline:
    1. extract_docx (progress: 0 -> 20%)
    2. ai_understanding (progress: 20 -> 40%)
    3. ai_analysis (progress: 40 -> 60%)
    4. shuffle (progress: 60 -> 80%)
    5. render_docx (progress: 80 -> 100%)
    
    Args:
        task_id_str: UUID string of the task to process
        simulate_failure_stage: Stage name to simulate failure at (for testing)
    """
    # Run the async processing function
    return asyncio.run(_process_task_async(task_id_str, simulate_failure_stage))


async def _process_task_async(task_id_str: str, simulate_failure_stage: str | None = None):
    """
    Async implementation of task processing.
    
    Args:
        task_id_str: UUID string of the task to process
        simulate_failure_stage: Stage name to simulate failure at (for testing)
    """
    task_id = uuid.UUID(task_id_str)

    # Create a new session factory for this event loop
    AsyncSessionLocal, engine = get_async_session_factory()

    try:
        # Create database session
        async with AsyncSessionLocal() as db:
            try:
                # T050: Update task status to "running"
                task = await task_service.get_task_by_id(db, task_id)
                if not task:
                    logger.error(f"Task {task_id} not found")
                    return {"status": "error", "message": "Task not found"}

                task.status = TaskStatus.RUNNING
                await db.commit()

                # T049: Log task start
                await task_log_service.create_log(
                    db=db,
                    task_id=task_id,
                    stage=None,
                    level=LogLevel.INFO,
                    message="Task processing started",
                    data_json={"celery_task_id": str(task_id)}
                )

                # Define pipeline stages with progress increments
                stages = [
                    (TaskStage.EXTRACT_DOCX, pipeline_stages.extract_docx, 20),
                    (TaskStage.AI_UNDERSTANDING, pipeline_stages.ai_understanding, 40),
                    (TaskStage.AI_ANALYSIS, pipeline_stages.ai_analysis, 60),
                    (TaskStage.SHUFFLE, pipeline_stages.shuffle, 80),
                    (TaskStage.RENDER_DOCX, pipeline_stages.render_docx, 100),
                ]

                # T063: Determine starting point for retry
                # If task has current_stage, it's a retry - resume from that stage
                start_index = 0
                if task.current_stage:
                    # Find index of current stage
                    stage_names = [s[0] for s in stages]
                    if task.current_stage in stage_names:
                        start_index = stage_names.index(task.current_stage)

                        # Log retry resume
                        await task_log_service.create_log(
                            db=db,
                            task_id=task_id,
                            stage=task.current_stage.value,
                            level=LogLevel.INFO,
                            message=f"Resuming from {task.current_stage.value} (retry)",
                            data_json={
                                "retry_count": task.retry_count_by_stage.get(task.current_stage.value, 0)
                            }
                        )

                # Process each stage starting from start_index
                for stage_enum, stage_func, target_progress in stages[start_index:]:
                    stage_name = stage_enum.value

                    # Update current stage
                    task.current_stage = stage_enum
                    await db.commit()

                    # T049: Log stage start
                    await task_log_service.create_log(
                        db=db,
                        task_id=task_id,
                        stage=stage_name,
                        level=LogLevel.INFO,
                        message=f"Starting {stage_name}",
                        data_json=None
                    )

                    try:
                        # Check if we should simulate failure at this stage
                        should_fail = (simulate_failure_stage == stage_name)

                        # Execute stage
                        result = await stage_func(
                            task_id=task_id_str,
                            simulate_failure=should_fail
                        )

                        # Update progress
                        task.progress = target_progress
                        await db.commit()

                        # T049: Log stage completion
                        await task_log_service.create_log(
                            db=db,
                            task_id=task_id,
                            stage=stage_name,
                            level=LogLevel.INFO,
                            message=f"Completed {stage_name}",
                            data_json=result
                        )

                        # Initialize retry count for this stage if not exists
                        if stage_name not in task.retry_count_by_stage:
                            task.retry_count_by_stage[stage_name] = 0
                            # Mark JSONB field as modified
                            from sqlalchemy.orm import attributes
                            attributes.flag_modified(task, "retry_count_by_stage")
                            await db.commit()

                    except Exception as stage_error:
                        # T051: Error handling - log error and fail task
                        error_message = f"Error in {stage_name}: {str(stage_error)}"
                        logger.error(error_message)

                        # Log error
                        await task_log_service.create_log(
                            db=db,
                            task_id=task_id,
                            stage=stage_name,
                            level=LogLevel.ERROR,
                            message=error_message,
                            data_json={
                                "exception_type": type(stage_error).__name__,
                                "exception_message": str(stage_error),
                            }
                        )

                        # Update task to failed status
                        task.status = TaskStatus.FAILED
                        task.error = error_message
                        await db.commit()

                        return {
                            "status": "failed",
                            "stage": stage_name,
                            "error": error_message
                        }

                # All stages completed successfully
                task.status = TaskStatus.COMPLETED
                task.current_stage = TaskStage.RENDER_DOCX  # Last stage
                task.progress = 100
                await db.commit()

                # T049: Log task completion
                await task_log_service.create_log(
                    db=db,
                    task_id=task_id,
                    stage=None,
                    level=LogLevel.INFO,
                    message="Task processing completed successfully",
                    data_json={"final_progress": 100}
                )

                return {
                    "status": "completed",
                    "task_id": task_id_str,
                    "progress": 100
                }

            except Exception as e:
                # T051: Handle unexpected errors
                logger.exception(f"Unexpected error processing task {task_id}")

                try:
                    # Try to log the error and update task status
                    await task_log_service.create_log(
                        db=db,
                        task_id=task_id,
                        stage=None,
                        level=LogLevel.ERROR,
                        message=f"Unexpected error: {str(e)}",
                        data_json={
                            "exception_type": type(e).__name__,
                            "exception_message": str(e),
                        }
                    )

                    task = await task_service.get_task_by_id(db, task_id)
                    if task:
                        task.status = TaskStatus.FAILED
                        task.error = f"Unexpected error: {str(e)}"
                        await db.commit()
                except Exception as log_error:
                    logger.error(f"Failed to log error: {log_error}")

                return {
                    "status": "error",
                    "error": str(e)
                }
    finally:
        # Dispose the engine to clean up connections
        await engine.dispose()

