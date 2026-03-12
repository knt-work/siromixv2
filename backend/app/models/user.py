"""
User model: Authenticated Google OAuth users.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    """
    User account linked to Google OAuth identity.
    
    Attributes:
        user_id: Internal unique identifier (UUID)
        google_sub: Google's unique subject identifier (immutable)
        email: User's email address from Google
        display_name: User's full name from Google profile
        created_at: Record creation timestamp
        updated_at: Last modification timestamp
    """
    
    __tablename__ = "users"
    
    # Primary key
    user_id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    
    # Google OAuth fields
    google_sub: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="Google's unique subject identifier"
    )
    
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="User's email address"
    )
    
    display_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        comment="User's display name"
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
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
    tasks: Mapped[list["Task"]] = relationship(
        "Task",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    exams: Mapped[list["Exam"]] = relationship(
        "Exam",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<User(user_id={self.user_id}, email={self.email})>"
