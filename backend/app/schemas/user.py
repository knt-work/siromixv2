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


class UserResponse(BaseModel):
    """Schema for user response (matches frontend User type)."""

    user_id: uuid.UUID = Field(..., description="Unique user identifier")
    email: EmailStr = Field(..., description="User's email address")
    full_name: str = Field(..., description="User's display name (from Google)")
    avatar_url: str | None = Field(None, description="Google profile photo URL")
    role: str = Field(default="professor", description="User role (fixed for MVP)")
    created_at: datetime = Field(..., description="When user was created")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
