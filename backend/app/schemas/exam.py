"""
Exam Pydantic schemas for API validation.

This module defines validation schemas for exam creation, updates, and responses.
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime
from uuid import UUID
from typing import Optional

from app.models.exam import ExamStatus


class ExamCreate(BaseModel):
    """Schema for creating a new exam."""
    
    name: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Exam title/name",
        examples=["Mathematics Final Exam 2026", "AP Physics C - Mechanics"]
    )
    
    subject: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Subject area",
        examples=["Mathematics", "Physics", "Chemistry"]
    )
    
    academic_year: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Academic year or term",
        examples=["2025-2026", "Spring 2026", "Fall 2025"]
    )
    
    grade_level: Optional[str] = Field(
        None,
        max_length=100,
        description="Optional grade or class level",
        examples=["Grade 10", "Grade 12 - Advanced Placement", "College Freshman"]
    )
    
    num_variants: int = Field(
        ...,
        gt=0,
        le=100,
        description="Number of exam variants to generate",
        examples=[3, 5, 10]
    )
    
    duration_minutes: int = Field(
        ...,
        gt=0,
        description="Exam duration in minutes",
        examples=[45, 60, 90, 120]
    )
    
    instructions: Optional[str] = Field(
        None,
        description="Optional exam-level instructions",
        examples=["Use blue or black pen only.", "Show all work for partial credit."]
    )
    
    @field_validator('name', 'subject', 'academic_year')
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        """Remove leading/trailing whitespace."""
        return v.strip()
    
    @field_validator('grade_level', 'instructions')
    @classmethod
    def strip_optional_whitespace(cls, v: Optional[str]) -> Optional[str]:
        """Remove leading/trailing whitespace from optional fields."""
        return v.strip() if v else None
    
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "Mathematics Final Exam 2026",
                    "subject": "Mathematics",
                    "academic_year": "2025-2026",
                    "grade_level": "Grade 10",
                    "duration_minutes": 60,
                    "num_variants": 5,
                    "instructions": "Use blue or black pen only. Show all work for partial credit."
                }
            ]
        }
    )


class ExamUpdate(BaseModel):
    """Schema for updating an existing exam."""
    
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=500
    )
    
    subject: Optional[str] = Field(
        None,
        min_length=1,
        max_length=500
    )
    
    academic_year: Optional[str] = Field(
        None,
        min_length=1,
        max_length=50
    )
    
    grade_level: Optional[str] = Field(
        None,
        max_length=100
    )
    
    num_variants: Optional[int] = Field(
        None,
        gt=0,
        le=100
    )
    
    duration_minutes: Optional[int] = Field(
        None,
        gt=0,
        description="Exam duration in minutes"
    )
    
    instructions: Optional[str] = None
    
    status: Optional[ExamStatus] = Field(
        None,
        description="Update exam status"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "status": "processing"
                },
                {
                    "name": "Updated Exam Name",
                    "num_variants": 7
                }
            ]
        }
    )


class ExamResponse(BaseModel):
    """Schema for exam API responses."""
    
    exam_id: UUID = Field(..., description="Unique exam identifier")
    user_id: UUID = Field(..., description="Owning user ID")
    name: str
    subject: str
    academic_year: str
    grade_level: Optional[str] = None
    num_variants: int
    duration_minutes: int
    instructions: Optional[str] = None
    status: ExamStatus
    created_at: datetime = Field(..., description="UTC creation timestamp")
    updated_at: datetime = Field(..., description="UTC last update timestamp")
    
    model_config = ConfigDict(
        from_attributes=True,  # Allow ORM model conversion
        json_schema_extra={
            "examples": [
                {
                    "exam_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
                    "user_id": "550e8400-e29b-41d4-a716-446655440000",
                    "name": "Mathematics Final Exam 2026",
                    "subject": "Mathematics",
                    "academic_year": "2025-2026",
                    "grade_level": "Grade 10",
                    "duration_minutes": 60,
                    "num_variants": 5,
                    "instructions": "Use blue or black pen only.",
                    "status": "draft",
                    "created_at": "2026-03-12T10:30:00Z",
                    "updated_at": "2026-03-12T10:30:00Z"
                }
            ]
        }
    )


class ExamListResponse(BaseModel):
    """Schema for paginated exam list responses."""
    
    items: list[ExamResponse] = Field(..., description="List of exams")
    total: int = Field(..., description="Total count across all pages", ge=0)
    page: int = Field(..., description="Current page number", ge=1)
    page_size: int = Field(..., description="Items per page", ge=1, le=100)
    
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "items": [
                        {
                            "exam_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
                            "user_id": "550e8400-e29b-41d4-a716-446655440000",
                            "name": "Mathematics Final Exam 2026",
                            "subject": "Mathematics",
                            "academic_year": "2025-2026",
                            "grade_level": "Grade 10",
                            "num_variants": 5,
                            "instructions": None,
                            "status": "draft",
                            "created_at": "2026-03-12T10:30:00Z",
                            "updated_at": "2026-03-12T10:30:00Z"
                        }
                    ],
                    "total": 42,
                    "page": 1,
                    "page_size": 20
                }
            ]
        }
    )
