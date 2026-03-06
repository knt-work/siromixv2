"""
TaskLog model: Structured observability logs for task execution.
"""

import enum
import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, Enum, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base


class LogLevel(str, enum.Enum):
    """Log message severity levels."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class TaskLog(Base):
    """
    Structured log entry for task execution observability.
    
    Provides stage-level logging with structured metadata for debugging,
    monitoring, and audit trails.
    
    Attributes:
        log_id: Auto-incrementing primary key (for performance)
        task_id: Foreign key to parent task
        stage: Pipeline stage that generated this log
        level: Log severity (debug/info/warning/error)
        message: Human-readable log message
        data_json: Structured metadata (JSONB)
        timestamp: When log was created
    """
    
    __tablename__ = "task_logs"
    
    # Primary key (serial integer for performance)
    log_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )
    
    # Foreign key to task
    task_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("tasks.task_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Parent task ID"
    )
    
    # Log metadata
    stage: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment="Pipeline stage name"
    )
    
    level: Mapped[LogLevel] = mapped_column(
        Enum(LogLevel, name="log_level", native_enum=False),
        nullable=False,
        default=LogLevel.INFO,
        comment="Log severity level"
    )
    
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Human-readable log message"
    )
    
    data_json: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
        comment="Structured metadata"
    )
    
    # Timestamp
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
        comment="When log was created"
    )
    
    # Relationships
    task: Mapped["Task"] = relationship(
        "Task",
        back_populates="logs"
    )
    
    def __repr__(self) -> str:
        return f"<TaskLog(log_id={self.log_id}, level={self.level.value}, stage={self.stage})>"
