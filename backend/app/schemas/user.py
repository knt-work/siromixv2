"""
User schemas for API requests and responses.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema with common fields."""

    email: EmailStr = Field(..., description="User's email address")
    display_name: str | None = Field(None, description="User's display name")


class UserCreate(UserBase):
    """Schema for creating a new user."""

    google_sub: str = Field(..., min_length=1, max_length=255, description="Google subject identifier")


class UserResponse(UserBase):
    """Schema for user response."""

    user_id: uuid.UUID = Field(..., description="Unique user identifier")
    google_sub: str = Field(..., description="Google subject identifier")
    created_at: datetime = Field(..., description="When user was created")
    updated_at: datetime = Field(..., description="When user was last updated")

    model_config = ConfigDict(from_attributes=True)
