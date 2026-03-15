"""
Artifact Pydantic schemas for API validation.

This module defines validation schemas for artifact creation and responses.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.artifact import ArtifactType


class ArtifactCreate(BaseModel):
    """Schema for creating a new artifact."""

    exam_id: UUID = Field(
        ...,
        description="Associated exam ID"
    )

    task_id: UUID | None = Field(
        None,
        description="Optional task that generated this artifact"
    )

    artifact_type: ArtifactType = Field(
        ...,
        description="Type of artifact output"
    )

    file_name: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Original filename with extension",
        examples=["math-final-2026.dij.pdf", "question-1.png", "metadata.nes.json"]
    )

    file_path: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Relative path from storage root",
        examples=[
            "exams/550e8400-e29b-41d4-a716-446655440000/math-final-2026/math-final-2026.dij.pdf",
            "exams/550e8400-e29b-41d4-a716-446655440000/physics-midterm/question-1.png"
        ]
    )

    mime_type: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="MIME type of file",
        examples=["application/pdf", "image/png", "application/json", "application/zip"]
    )

    @field_validator('file_name', 'file_path')
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        """Remove leading/trailing whitespace."""
        return v.strip()

    @field_validator('file_path')
    @classmethod
    def validate_path_format(cls, v: str) -> str:
        """Validate file path follows expected format."""
        if not v.startswith('exams/'):
            raise ValueError("file_path must start with 'exams/'")
        if '//' in v or v.endswith('/'):
            raise ValueError("file_path cannot contain double slashes or end with slash")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "exam_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
                    "task_id": "3b241101-e2bb-4255-8caf-4136c566a962",
                    "artifact_type": "dij",
                    "file_name": "math-final-2026.dij.pdf",
                    "file_path": "exams/550e8400-e29b-41d4-a716-446655440000/math-final-2026/math-final-2026.dij.pdf",
                    "mime_type": "application/pdf"
                }
            ]
        }
    )


class ArtifactResponse(BaseModel):
    """Schema for artifact API responses."""

    artifact_id: int = Field(..., description="Unique artifact identifier (auto-increment)")
    exam_id: UUID = Field(..., description="Associated exam ID")
    task_id: UUID | None = Field(None, description="Task that generated this artifact")
    artifact_type: ArtifactType
    file_name: str
    file_path: str
    mime_type: str
    created_at: datetime = Field(..., description="UTC creation timestamp")

    model_config = ConfigDict(
        from_attributes=True,  # Allow ORM model conversion
        json_schema_extra={
            "examples": [
                {
                    "artifact_id": 42,
                    "exam_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
                    "task_id": "3b241101-e2bb-4255-8caf-4136c566a962",
                    "artifact_type": "dij",
                    "file_name": "math-final-2026.dij.pdf",
                    "file_path": "exams/550e8400-e29b-41d4-a716-446655440000/math-final-2026/math-final-2026.dij.pdf",
                    "mime_type": "application/pdf",
                    "created_at": "2026-03-12T11:45:00Z"
                }
            ]
        }
    )


class ArtifactListResponse(BaseModel):
    """Schema for paginated artifact list responses."""

    items: list[ArtifactResponse] = Field(..., description="List of artifacts")
    total: int = Field(..., description="Total count across all pages", ge=0)
    page: int = Field(..., description="Current page number", ge=1)
    page_size: int = Field(..., description="Items per page", ge=1, le=100)

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "items": [
                        {
                            "artifact_id": 42,
                            "exam_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
                            "task_id": "3b241101-e2bb-4255-8caf-4136c566a962",
                            "artifact_type": "dij",
                            "file_name": "math-final-2026.dij.pdf",
                            "file_path": "exams/550e8400-e29b-41d4-a716-446655440000/math-final-2026/math-final-2026.dij.pdf",
                            "mime_type": "application/pdf",
                            "created_at": "2026-03-12T11:45:00Z"
                        }
                    ],
                    "total": 127,
                    "page": 1,
                    "page_size": 20
                }
            ]
        }
    )


class ArtifactsByType(BaseModel):
    """Schema for artifacts grouped by type."""

    exam_id: UUID
    artifacts_by_type: dict[ArtifactType, list[ArtifactResponse]] = Field(
        ...,
        description="Artifacts organized by type"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "exam_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
                    "artifacts_by_type": {
                        "dij": [
                            {
                                "artifact_id": 42,
                                "exam_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
                                "task_id": "3b241101-e2bb-4255-8caf-4136c566a962",
                                "artifact_type": "dij",
                                "file_name": "math-final.dij.pdf",
                                "file_path": "exams/.../math-final.dij.pdf",
                                "mime_type": "application/pdf",
                                "created_at": "2026-03-12T11:45:00Z"
                            }
                        ],
                        "question_preview": [
                            {
                                "artifact_id": 43,
                                "exam_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
                                "task_id": None,
                                "artifact_type": "question_preview",
                                "file_name": "question-1.png",
                                "file_path": "exams/.../question-1.png",
                                "mime_type": "image/png",
                                "created_at": "2026-03-12T11:46:00Z"
                            }
                        ]
                    }
                }
            ]
        }
    )
