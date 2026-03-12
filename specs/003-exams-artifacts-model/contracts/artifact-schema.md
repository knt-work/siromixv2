# Contract: Artifact Pydantic Schemas

**Feature**: 003-exams-artifacts-model  
**Date**: March 12, 2026  
**Purpose**: API validation schemas for artifact entity

## Overview

This document defines the Pydantic validation schemas for the `artifacts` table. These schemas track exam processing outputs (DIJ files, question previews, NES metadata, variant packages, answer matrices).

---

## Schema Definitions

### ArtifactType Enum

```python
from enum import Enum

class ArtifactType(str, Enum):
    """Artifact output type classification."""
    DIJ = "dij"                           # Annotated PDF with bounding boxes
    QUESTION_PREVIEW = "question_preview"  # Individual question image
    NES = "nes"                           # NES metadata JSON
    VARIANTS_PACKAGE = "variants_package"  # Generated exam variants ZIP
    ANSWER_MATRIX = "answer_matrix"       # Answer key matrix
```

**Values**:
- `dij`: Annotated PDF file with question/answer bounding boxes (Desktop Interface JSON)
- `question_preview`: PNG/JPEG image preview of individual question
- `nes`: JSON metadata file conforming to NES schema
- `variants_package`: ZIP archive containing all generated exam variants
- `answer_matrix`: CSV/JSON file with answer key matrix for all variants

**JSON Representation**: Plain string (e.g., `"dij"`, not `"ArtifactType.DIJ"`)

---

### ArtifactCreate (Request Schema)

**Purpose**: Validate artifact creation requests from pipeline tasks.

```python
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from uuid import UUID

class ArtifactCreate(BaseModel):
    """Schema for creating a new artifact."""
    
    exam_id: UUID = Field(
        ...,
        description="Associated exam ID"
    )
    
    task_id: Optional[UUID] = Field(
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
    
    model_config = {
        "json_schema_extra": {
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
    }
```

**Validation Rules**:
- Required fields: `exam_id`, `artifact_type`, `file_name`, `file_path`, `mime_type`
- `task_id` optional (some artifacts not tied to specific task)
- `file_name`: 1-500 characters
- `file_path`: 1-1000 characters, must start with `exams/`, no double slashes, no trailing slash
- `mime_type`: 1-100 characters
- All text fields trimmed of whitespace

**Example JSON Payload**:
```json
{
  "exam_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "task_id": "3b241101-e2bb-4255-8caf-4136c566a962",
  "artifact_type": "dij",
  "file_name": "math-final-2026.dij.pdf",
  "file_path": "exams/550e8400-e29b-41d4-a716-446655440000/math-final-2026/math-final-2026.dij.pdf",
  "mime_type": "application/pdf"
}
```

---

### ArtifactResponse (Response Schema)

**Purpose**: Format artifact data in API responses.

```python
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional

class ArtifactResponse(BaseModel):
    """Schema for artifact API responses."""
    
    artifact_id: int = Field(..., description="Unique artifact identifier (auto-increment)")
    exam_id: UUID = Field(..., description="Associated exam ID")
    task_id: Optional[UUID] = Field(None, description="Task that generated this artifact")
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
```

**Features**:
- Includes all database fields
- `from_attributes=True` enables direct SQLAlchemy model conversion
- Timestamp serialized as ISO 8601 string in JSON
- `artifact_id` is auto-increment integer (optimized for high volume)

**Example JSON Response**:
```json
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
```

---

### ArtifactListResponse (Paginated List)

**Purpose**: Format paginated artifact lists.

```python
from pydantic import BaseModel, Field
from typing import List

class ArtifactListResponse(BaseModel):
    """Schema for paginated artifact list responses."""
    
    items: List[ArtifactResponse] = Field(..., description="List of artifacts")
    total: int = Field(..., description="Total count across all pages", ge=0)
    page: int = Field(..., description="Current page number", ge=1)
    page_size: int = Field(..., description="Items per page", ge=1, le=100)
    
    model_config = {
        "json_schema_extra": {
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
    }
```

---

### ArtifactsByType (Grouped Response)

**Purpose**: Return artifacts grouped by type for exam detail page.

```python
from pydantic import BaseModel, Field
from typing import List, Dict

class ArtifactsByType(BaseModel):
    """Schema for artifacts grouped by type."""
    
    exam_id: UUID
    artifacts_by_type: Dict[ArtifactType, List[ArtifactResponse]] = Field(
        ...,
        description="Artifacts organized by type"
    )
    
    model_config = {
        "json_schema_extra": {
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
                                "task_id": null,
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
    }
```

---

## Common MIME Types by Artifact Type

| Artifact Type       | Expected MIME Types                                  |
|---------------------|------------------------------------------------------|
| `dij`               | `application/pdf`                                    |
| `question_preview`  | `image/png`, `image/jpeg`                            |
| `nes`               | `application/json`                                   |
| `variants_package`  | `application/zip`, `application/x-zip-compressed`    |
| `answer_matrix`     | `text/csv`, `application/json`                       |

---

## Validation Examples

### Valid ArtifactCreate

```python
artifact_data = {
    "exam_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "task_id": "3b241101-e2bb-4255-8caf-4136c566a962",
    "artifact_type": "dij",
    "file_name": "math-final.dij.pdf",
    "file_path": "exams/550e8400-e29b-41d4-a716-446655440000/math-final/math-final.dij.pdf",
    "mime_type": "application/pdf"
}
artifact = ArtifactCreate(**artifact_data)  # ✅ Passes validation
```

### Valid ArtifactCreate (No Task ID)

```python
artifact_data = {
    "exam_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    # task_id omitted (optional)
    "artifact_type": "question_preview",
    "file_name": "question-1.png",
    "file_path": "exams/550e8400-e29b-41d4-a716-446655440000/math-final/question-1.png",
    "mime_type": "image/png"
}
artifact = ArtifactCreate(**artifact_data)  # ✅ Passes validation
```

### Invalid ArtifactCreate (Bad Path Format)

```python
artifact_data = {
    "exam_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "artifact_type": "dij",
    "file_name": "test.pdf",
    "file_path": "uploads/test.pdf",  # ❌ Must start with 'exams/'
    "mime_type": "application/pdf"
}
artifact = ArtifactCreate(**artifact_data)  # ❌ ValidationError: file_path must start with 'exams/'
```

### Invalid ArtifactCreate (Missing Required Field)

```python
artifact_data = {
    "exam_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "artifact_type": "dij",
    # Missing 'file_name', 'file_path', 'mime_type'
}
artifact = ArtifactCreate(**artifact_data)  # ❌ ValidationError: Field required
```

---

## Usage in FastAPI Endpoints (Future Reference)

```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID

router = APIRouter(prefix="/artifacts", tags=["artifacts"])

@router.post("/", response_model=ArtifactResponse, status_code=status.HTTP_201_CREATED)
async def create_artifact(
    artifact_data: ArtifactCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new artifact (typically called by pipeline tasks)."""
    # Verify exam exists and belongs to user
    exam = await db.get(Exam, artifact_data.exam_id)
    if not exam or exam.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Create artifact
    artifact = Artifact(**artifact_data.model_dump())
    db.add(artifact)
    await db.commit()
    await db.refresh(artifact)
    return artifact

@router.get("/exam/{exam_id}", response_model=ArtifactListResponse)
async def get_exam_artifacts(
    exam_id: UUID,
    artifact_type: Optional[ArtifactType] = Query(None, description="Filter by artifact type"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all artifacts for an exam, optionally filtered by type."""
    # Verify exam belongs to user
    exam = await db.get(Exam, exam_id)
    if not exam or exam.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Build query
    query = select(Artifact).where(Artifact.exam_id == exam_id)
    if artifact_type:
        query = query.where(Artifact.artifact_type == artifact_type)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    # Get paginated results
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    artifacts = result.scalars().all()
    
    return ArtifactListResponse(
        items=artifacts,
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/exam/{exam_id}/by-type", response_model=ArtifactsByType)
async def get_artifacts_by_type(
    exam_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get artifacts grouped by type for exam detail page."""
    # Verify exam belongs to user
    exam = await db.get(Exam, exam_id)
    if not exam or exam.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Get all artifacts
    query = select(Artifact).where(Artifact.exam_id == exam_id)
    result = await db.execute(query)
    artifacts = result.scalars().all()
    
    # Group by type
    artifacts_by_type = {}
    for artifact in artifacts:
        if artifact.artifact_type not in artifacts_by_type:
            artifacts_by_type[artifact.artifact_type] = []
        artifacts_by_type[artifact.artifact_type].append(artifact)
    
    return ArtifactsByType(
        exam_id=exam_id,
        artifacts_by_type=artifacts_by_type
    )
```

---

## Testing Contract

### Unit Test Example

```python
import pytest
from pydantic import ValidationError
from uuid import uuid4

def test_artifact_create_valid():
    """Test valid artifact creation."""
    data = {
        "exam_id": uuid4(),
        "task_id": uuid4(),
        "artifact_type": "dij",
        "file_name": "test.pdf",
        "file_path": "exams/550e8400-e29b-41d4-a716-446655440000/test/test.pdf",
        "mime_type": "application/pdf"
    }
    artifact = ArtifactCreate(**data)
    assert artifact.artifact_type == ArtifactType.DIJ
    assert artifact.file_name == "test.pdf"

def test_artifact_create_no_task_id():
    """Test artifact creation without task_id."""
    data = {
        "exam_id": uuid4(),
        # task_id omitted
        "artifact_type": "question_preview",
        "file_name": "q1.png",
        "file_path": "exams/550e8400-e29b-41d4-a716-446655440000/test/q1.png",
        "mime_type": "image/png"
    }
    artifact = ArtifactCreate(**data)
    assert artifact.task_id is None

def test_artifact_create_invalid_path():
    """Test file_path validation."""
    data = {
        "exam_id": uuid4(),
        "artifact_type": "dij",
        "file_name": "test.pdf",
        "file_path": "uploads/test.pdf",  # Invalid: doesn't start with 'exams/'
        "mime_type": "application/pdf"
    }
    with pytest.raises(ValidationError) as exc_info:
        ArtifactCreate(**data)
    assert "must start with 'exams/'" in str(exc_info.value)

def test_artifact_create_double_slash():
    """Test file_path rejects double slashes."""
    data = {
        "exam_id": uuid4(),
        "artifact_type": "dij",
        "file_name": "test.pdf",
        "file_path": "exams//test.pdf",  # Invalid: double slash
        "mime_type": "application/pdf"
    }
    with pytest.raises(ValidationError) as exc_info:
        ArtifactCreate(**data)
    assert "double slashes" in str(exc_info.value)

def test_artifact_response_from_orm():
    """Test ORM model conversion."""
    # Assuming ORM model instance
    orm_artifact = Artifact(
        artifact_id=1,
        exam_id=uuid4(),
        task_id=uuid4(),
        artifact_type="dij",
        file_name="test.pdf",
        file_path="exams/550e8400-e29b-41d4-a716-446655440000/test/test.pdf",
        mime_type="application/pdf",
        created_at=datetime.utcnow()
    )
    response = ArtifactResponse.model_validate(orm_artifact)
    assert response.artifact_id == 1
    assert response.file_name == "test.pdf"
```

---

## File Path Generation Utility

**Reference**: See [research.md](../research.md) for `generate_exam_path()` utility function that generates kebab-case paths from exam names.

**Example**:
```python
from app.utils.path import generate_exam_path

exam_name = "Mathematics Final Exam 2026"
user_id = "550e8400-e29b-41d4-a716-446655440000"

# Generate base path
base_path = generate_exam_path(user_id, exam_name)
# Returns: "exams/550e8400-e29b-41d4-a716-446655440000/mathematics-final-exam-2026"

# Full artifact path
file_path = f"{base_path}/math-final.dij.pdf"
# Returns: "exams/550e8400-e29b-41d4-a716-446655440000/mathematics-final-exam-2026/math-final.dij.pdf"
```

---

## Schema Version

**Version**: 1.0.0  
**Compatible With**: SiroMix V2 backend >= 0.1.0  
**Pydantic Version**: 2.0+
