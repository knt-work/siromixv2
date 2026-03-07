"""
Task model: Asynchronous processing jobs through pipeline stages.
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, Enum, CheckConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base


class TaskStatus(str, enum.Enum):
    """Task execution status."""
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskStage(str, enum.Enum):
    """Pipeline processing stages."""
    EXTRACT_DOCX = "extract_docx"
    AI_UNDERSTANDING = "ai_understanding"
    AI_ANALYSIS = "ai_analysis"
    SHUFFLE = "shuffle"
    RENDER_DOCX = "render_docx"


class Task(Base):
    """
    Asynchronous processing job through the SiroMix pipeline.
    
    For MVP: Executes mock pipeline stages with progress tracking.
    Future: Process actual DOCX documents through AI-powered stages.
    
    Attributes:
        task_id: Unique identifier
        user_id: Foreign key to owning user
        status: Current task status (queued/running/completed/failed)
        current_stage: Current pipeline stage being processed
        progress: Completion percentage (0-100)
        retry_count_by_stage: JSONB map of stage -> retry count
        error: Error message if task failed
        created_at: Record creation timestamp
        updated_at: Last modification timestamp
    """
    
    __tablename__ = "tasks"
    
    # Primary key
    task_id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    
    # Foreign key to user
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Owner of the task"
    )
    
    # Task status
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus, name="task_status", native_enum=False),
        nullable=False,
        index=True,
        default=TaskStatus.QUEUED,
        comment="Current task status"
    )
    
    current_stage: Mapped[TaskStage | None] = mapped_column(
        Enum(TaskStage, name="task_stage", native_enum=False),
        nullable=True,
        comment="Current pipeline stage"
    )
    
    # Progress tracking
    progress: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="Completion percentage (0-100)"
    )
    
    # Retry metadata
    retry_count_by_stage: Mapped[dict] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        nullable=False,
        default=dict,
        server_default="{}",
        comment="Map of stage name to retry count"
    )
    
    # Error tracking
    error: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Error message if failed"
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
        comment="Record creation time"
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="Last update time"
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="tasks"
    )
    
    logs: Mapped[list["TaskLog"]] = relationship(
        "TaskLog",
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="TaskLog.timestamp"
    )
    
    # Constraints
    __table_args__ = (
        CheckConstraint("progress >= 0 AND progress <= 100", name="progress_range"),
    )
    
    def __repr__(self) -> str:
        return f"<Task(task_id={self.task_id}, status={self.status.value}, progress={self.progress}%)>"
