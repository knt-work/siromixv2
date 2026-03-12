"""
Artifact model: Tracks generated pipeline outputs.

This model stores metadata for files produced during exam processing.
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey, Enum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ArtifactType(str, enum.Enum):
    """Types of artifacts produced by the pipeline."""
    DIJ = "dij"
    QUESTION_PREVIEW = "question_preview"
    NES = "nes"
    VARIANTS_PACKAGE = "variants_package"
    ANSWER_MATRIX = "answer_matrix"


class Artifact(Base):
    """
    Generated output files and JSON results produced during task pipeline execution.
    
    Tracks file metadata, storage location, and lineage back to source exam and
    producing task.
    
    Attributes:
        artifact_id: Auto-incrementing identifier
        exam_id: Foreign key to parent exam
        task_id: Optional foreign key to producing task
        artifact_type: Type of artifact (dij, question_preview, etc.)
        file_name: Original or generated file name
        file_path: Relative path from storage root
        mime_type: MIME type
        created_at: Artifact creation timestamp
    """
    __tablename__ = "artifacts"
    
    artifact_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exams.exam_id", ondelete="CASCADE"), nullable=False, index=True)
    task_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tasks.task_id", ondelete="SET NULL"), nullable=True, index=True)
    artifact_type: Mapped[ArtifactType] = mapped_column(Enum(ArtifactType, native_enum=False), nullable=False, index=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    
    # Relationships
    exam: Mapped["Exam"] = relationship("Exam", back_populates="artifacts")
    task: Mapped["Task"] = relationship("Task", back_populates="artifacts")
    
    __table_args__ = (
        Index('ix_artifacts_exam_id_artifact_type', 'exam_id', 'artifact_type'),  # Composite index
    )
