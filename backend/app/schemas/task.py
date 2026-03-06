"""
Task schemas for API requests and responses.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from enum import Enum
import uuid


class TaskStatus(str, Enum):
    """Task execution status."""
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskStage(str, Enum):
    """Pipeline processing stages."""
    EXTRACT_DOCX = "extract_docx"
    AI_UNDERSTANDING = "ai_understanding"
    AI_ANALYSIS = "ai_analysis"
    SHUFFLE = "shuffle"
    RENDER_DOCX = "render_docx"


class TaskBase(BaseModel):
    """Base task schema."""
    pass


class TaskCreate(TaskBase):
    """Schema for creating a new task."""
    
    # MVP: No input parameters, tasks run mock pipeline
    simulate_failure_stage: TaskStage | None = Field(
        None,
        description="Stage at which to simulate failure (for testing)"
    )


class TaskResponse(TaskBase):
    """Schema for task response."""
    
    task_id: uuid.UUID = Field(..., description="Unique task identifier")
    user_id: uuid.UUID = Field(..., description="Owner user ID")
    status: TaskStatus = Field(..., description="Current task status")
    current_stage: TaskStage | None = Field(None, description="Current pipeline stage")
    progress: int = Field(..., ge=0, le=100, description="Completion percentage (0-100)")
    retry_count_by_stage: dict[str, int] = Field(default_factory=dict, description="Retry count per stage")
    error: str | None = Field(None, description="Error message if failed")
    created_at: datetime = Field(..., description="When task was created")
    updated_at: datetime = Field(..., description="When task was last updated")
    
    model_config = ConfigDict(from_attributes=True)


class TaskRetryRequest(BaseModel):
    """Schema for retrying a failed task."""
    
    force: bool = Field(
        False,
        description="Force retry even if task is not in failed state"
    )
