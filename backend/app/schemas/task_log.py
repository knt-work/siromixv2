"""
TaskLog schemas for API responses.
"""

import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class LogLevel(str, Enum):
    """Log message severity levels."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class TaskLogResponse(BaseModel):
    """Schema for task log response."""

    log_id: int = Field(..., description="Unique log identifier")
    task_id: uuid.UUID = Field(..., description="Parent task ID")
    stage: str | None = Field(None, description="Pipeline stage name")
    level: LogLevel = Field(..., description="Log severity level")
    message: str = Field(..., description="Human-readable log message")
    data_json: dict | None = Field(None, description="Structured metadata")
    timestamp: datetime = Field(..., description="When log was created")

    model_config = ConfigDict(from_attributes=True)
