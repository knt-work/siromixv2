"""
Exam model: Business metadata for exam creation and tracking.

This model stores exam-level information and serves as the parent for artifacts.
"""

import uuid
import enum
from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, Enum, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ExamStatus(str, enum.Enum):
    """Exam lifecycle status."""
    DRAFT = "draft"
    PROCESSING = "processing"
    COMPLETED = "completed"


class Exam(Base):
    """
    Business metadata for exam creation and tracking.
    
    Stores high-level exam information including subject, academic year,
    and generation settings. Serves as parent for exam artifacts and
    associates with processing tasks.
    
    Attributes:
        exam_id: Unique identifier
        user_id: Foreign key to owning user
        name: Exam title/name
        subject: Subject area (e.g., "Mathematics", "Physics")
        academic_year: Academic year (e.g., "2025-2026")
        grade_level: Optional grade/class level
        num_variants: Number of exam variants to generate
        instructions: Optional exam-level instructions
        status: Exam lifecycle status (draft/processing/completed)
        created_at: Record creation timestamp
        updated_at: Last modification timestamp
    """
    __tablename__ = "exams"
    
    exam_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    academic_year: Mapped[str] = mapped_column(String(50), nullable=False)
    grade_level: Mapped[str | None] = mapped_column(String(100), nullable=True)
    num_variants: Mapped[int] = mapped_column(Integer, nullable=False)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ExamStatus] = mapped_column(Enum(ExamStatus, native_enum=False), nullable=False, default=ExamStatus.DRAFT, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="exams")
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="exam", cascade="all, delete-orphan")
    artifacts: Mapped[list["Artifact"]] = relationship("Artifact", back_populates="exam", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint("num_variants > 0", name="check_num_variants_positive"),
    )
