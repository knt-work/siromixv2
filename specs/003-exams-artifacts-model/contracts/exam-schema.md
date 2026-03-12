# Contract: Exam Pydantic Schemas

**Feature**: 003-exams-artifacts-model  
**Date**: March 12, 2026  
**Purpose**: API validation schemas for exam entity

## Overview

This document defines the Pydantic validation schemas for the `exams` table. These schemas enforce validation rules at the API boundary before data reaches the database layer.

---

## Schema Definitions

### ExamStatus Enum

```python
from enum import Enum

class ExamStatus(str, Enum):
    """Exam lifecycle status."""
    DRAFT = "draft"
    PROCESSING = "processing"
    COMPLETED = "completed"
```

**Values**:
- `draft`: Exam created but not yet submitted for processing
- `processing`: Exam actively being processed through pipeline
- `completed`: All pipeline stages finished, artifacts generated

**JSON Representation**: Plain string (e.g., `"draft"`, not `"ExamStatus.DRAFT"`)

---

### ExamCreate (Request Schema)

**Purpose**: Validate exam creation requests from Create New Exam form.

```python
from pydantic import BaseModel, Field, field_validator
from typing import Optional

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
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Mathematics Final Exam 2026",
                    "subject": "Mathematics",
                    "academic_year": "2025-2026",
                    "grade_level": "Grade 10",
                    "num_variants": 5,
                    "instructions": "Use blue or black pen only. Show all work for partial credit."
                }
            ]
        }
    }
```

**Validation Rules**:
- Required fields: `name`, `subject`, `academic_year`, `num_variants`
- `name`, `subject`: 1-500 characters
- `academic_year`: 1-50 characters
- `grade_level`: max 100 characters (optional)
- `num_variants`: 1-100 (positive integer)
- `instructions`: unlimited length TEXT (optional)
- All text fields trimmed of leading/trailing whitespace

**Example JSON Payload**:
```json
{
  "name": "Mathematics Final Exam 2026",
  "subject": "Mathematics",
  "academic_year": "2025-2026",
  "grade_level": "Grade 10",
  "num_variants": 5,
  "instructions": "Use blue or black pen only."
}
```

---

### ExamUpdate (Request Schema)

**Purpose**: Validate exam update requests (partial updates allowed).

```python
from pydantic import BaseModel, Field
from typing import Optional

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
    
    instructions: Optional[str] = None
    
    status: Optional[ExamStatus] = Field(
        None,
        description="Update exam status"
    )
    
    model_config = {
        "json_schema_extra": {
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
    }
```

**Validation Rules**:
- All fields optional (partial updates)
- Same constraints as ExamCreate when provided
- `status` can be updated to any valid ExamStatus value

**Example JSON Payload** (partial update):
```json
{
  "status": "processing"
}
```

---

### ExamResponse (Response Schema)

**Purpose**: Format exam data in API responses.

```python
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional

class ExamResponse(BaseModel):
    """Schema for exam API responses."""
    
    exam_id: UUID = Field(..., description="Unique exam identifier")
    user_id: UUID = Field(..., description="Owning user ID")
    name: str
    subject: str
    academic_year: str
    grade_level: Optional[str] = None
    num_variants: int
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
                    "num_variants": 5,
                    "instructions": "Use blue or black pen only.",
                    "status": "draft",
                    "created_at": "2026-03-12T10:30:00Z",
                    "updated_at": "2026-03-12T10:30:00Z"
                }
            ]
        }
    )
```

**Features**:
- Includes all database fields
- `from_attributes=True` enables direct SQLAlchemy model conversion
- Timestamps serialized as ISO 8601 strings in JSON
- UUIDs serialized as string format

**Example JSON Response**:
```json
{
  "exam_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Mathematics Final Exam 2026",
  "subject": "Mathematics",
  "academic_year": "2025-2026",
  "grade_level": "Grade 10",
  "num_variants": 5,
  "instructions": "Use blue or black pen only.",
  "status": "draft",
  "created_at": "2026-03-12T10:30:00Z",
  "updated_at": "2026-03-12T10:30:00Z"
}
```

---

### ExamListResponse (Paginated List)

**Purpose**: Format paginated exam lists.

```python
from pydantic import BaseModel, Field
from typing import List

class ExamListResponse(BaseModel):
    """Schema for paginated exam list responses."""
    
    items: List[ExamResponse] = Field(..., description="List of exams")
    total: int = Field(..., description="Total count across all pages", ge=0)
    page: int = Field(..., description="Current page number", ge=1)
    page_size: int = Field(..., description="Items per page", ge=1, le=100)
    
    model_config = {
        "json_schema_extra": {
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
                            "instructions": null,
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
    }
```

---

## Validation Examples

### Valid ExamCreate

```python
exam_data = {
    "name": "Physics Midterm",
    "subject": "Physics",
    "academic_year": "2026",
    "num_variants": 3
}
exam = ExamCreate(**exam_data)  # ✅ Passes validation
```

### Invalid ExamCreate (Missing Required Field)

```python
exam_data = {
    "name": "Physics Midterm",
    # Missing 'subject', 'academic_year', 'num_variants'
}
exam = ExamCreate(**exam_data)  # ❌ ValidationError: Field required
```

### Invalid ExamCreate (Constraint Violation)

```python
exam_data = {
    "name": "A" * 501,  # Exceeds 500 char limit
    "subject": "Math",
    "academic_year": "2026",
    "num_variants": 0  # Must be > 0
}
exam = ExamCreate(**exam_data)  # ❌ ValidationError: String too long, value must be > 0
```

---

## Usage in FastAPI Endpoints (Future Reference)

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

router = APIRouter(prefix="/exams", tags=["exams"])

@router.post("/", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(
    exam_data: ExamCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new exam."""
    # Validation happens automatically via ExamCreate schema
    exam = Exam(
        user_id=current_user.user_id,
        **exam_data.model_dump()
    )
    db.add(exam)
    await db.commit()
    await db.refresh(exam)
    return exam  # Auto-converted to ExamResponse via from_attributes=True

@router.get("/{exam_id}", response_model=ExamResponse)
async def get_exam(
    exam_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get exam by ID."""
    exam = await db.get(Exam, exam_id)
    if not exam or exam.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam  # Auto-converted to ExamResponse
```

---

## Testing Contract

### Unit Test Example

```python
import pytest
from pydantic import ValidationError

def test_exam_create_valid():
    """Test valid exam creation."""
    data = {
        "name": "Math Final",
        "subject": "Mathematics",
        "academic_year": "2026",
        "num_variants": 5
    }
    exam = ExamCreate(**data)
    assert exam.name == "Math Final"
    assert exam.num_variants == 5

def test_exam_create_strip_whitespace():
    """Test whitespace stripping."""
    data = {
        "name": "  Math Final  ",
        "subject": "  Mathematics  ",
        "academic_year": "2026",
        "num_variants": 5
    }
    exam = ExamCreate(**data)
    assert exam.name == "Math Final"  # Whitespace stripped
    assert exam.subject == "Mathematics"

def test_exam_create_invalid_num_variants():
    """Test num_variants validation."""
    data = {
        "name": "Math Final",
        "subject": "Mathematics",
        "academic_year": "2026",
        "num_variants": 0  # Invalid: must be > 0
    }
    with pytest.raises(ValidationError) as exc_info:
        ExamCreate(**data)
    assert "greater than 0" in str(exc_info.value)

def test_exam_create_name_too_long():
    """Test name length constraint."""
    data = {
        "name": "A" * 501,  # Exceeds 500 char limit
        "subject": "Mathematics",
        "academic_year": "2026",
        "num_variants": 5
    }
    with pytest.raises(ValidationError) as exc_info:
        ExamCreate(**data)
    assert "at most 500 characters" in str(exc_info.value)
```

---

## Schema Version

**Version**: 1.0.0  
**Compatible With**: SiroMix V2 backend >= 0.1.0  
**Pydantic Version**: 2.0+
