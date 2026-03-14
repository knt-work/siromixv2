"""Unit tests for Exam Pydantic schemas.

Feature: 003-exams-artifacts-model
User Story 1: Exam Metadata Storage

Tests: T019-T023 (TDD - write first, ensure FAIL before implementation)
"""

import pytest
from pydantic import ValidationError
from uuid import uuid4
from datetime import datetime

from app.schemas.exam import ExamCreate, ExamUpdate, ExamResponse, ExamListResponse
from app.models.exam import Exam, ExamStatus


def test_exam_create_valid():
    """T019: Test ExamCreate schema validation with all required fields."""
    # Valid data with all required fields
    data = {
        "name": "Mathematics Final Exam 2026",
        "subject": "Mathematics",
        "academic_year": "2025-2026",
        "grade_level": "Grade 10",
        "num_variants": 5,
        "duration_minutes": 90,
        "instructions": "Use blue or black pen only."
    }
    
    exam = ExamCreate(**data)
    
    # Verify all fields are set
    assert exam.name == "Mathematics Final Exam 2026"
    assert exam.subject == "Mathematics"
    assert exam.academic_year == "2025-2026"
    assert exam.grade_level == "Grade 10"
    assert exam.num_variants == 5
    assert exam.duration_minutes == 90
    assert exam.instructions == "Use blue or black pen only."


def test_exam_create_minimal():
    """Test ExamCreate with only required fields."""
    data = {
        "name": "Minimal Exam",
        "subject": "Physics",
        "academic_year": "2026",
        "num_variants": 3,
        "duration_minutes": 60,
    }
    
    exam = ExamCreate(**data)
    
    assert exam.name == "Minimal Exam"
    assert exam.subject == "Physics"
    assert exam.academic_year == "2026"
    assert exam.num_variants == 3
    assert exam.duration_minutes == 60
    assert exam.grade_level is None
    assert exam.instructions is None


def test_exam_create_missing_required_field():
    """Test that missing required fields raise ValidationError."""
    # Missing name
    data = {
        "subject": "Mathematics",
        "academic_year": "2026",
        "num_variants": 5
    }
    
    with pytest.raises(ValidationError) as exc_info:
        ExamCreate(**data)
    
    errors = exc_info.value.errors()
    assert any(e["loc"] == ("name",) and e["type"] == "missing" for e in errors)


def test_exam_create_length_constraints():
    """T020: Test ExamCreate schema field length validation."""
    # Name too long (>500 chars)
    data_name_too_long = {
        "name": "A" * 501,  # Exceeds 500 char limit
        "subject": "Math",
        "academic_year": "2026",
        "num_variants": 5
    }
    
    with pytest.raises(ValidationError) as exc_info:
        ExamCreate(**data_name_too_long)
    
    errors = exc_info.value.errors()
    assert any(e["loc"] == ("name",) and "at most 500 characters" in str(e["msg"]).lower() for e in errors)
    
    # Subject too long (>500 chars)
    data_subject_too_long = {
        "name": "Test Exam",
        "subject": "B" * 501,  # Exceeds 500 char limit
        "academic_year": "2026",
        "num_variants": 5
    }
    
    with pytest.raises(ValidationError):
        ExamCreate(**data_subject_too_long)
    
    # Academic year too long (>50 chars)
    data_year_too_long = {
        "name": "Test Exam",
        "subject": "Math",
        "academic_year": "C" * 51,  # Exceeds 50 char limit
        "num_variants": 5
    }
    
    with pytest.raises(ValidationError):
        ExamCreate(**data_year_too_long)
    
    # Grade level too long (>100 chars)
    data_grade_too_long = {
        "name": "Test Exam",
        "subject": "Math",
        "academic_year": "2026",
        "grade_level": "D" * 101,  # Exceeds 100 char limit
        "num_variants": 5
    }
    
    with pytest.raises(ValidationError):
        ExamCreate(**data_grade_too_long)
    
    # num_variants = 0 (must be > 0)
    data_num_variants_zero = {
        "name": "Test Exam",
        "subject": "Math",
        "academic_year": "2026",
        "num_variants": 0  # Must be > 0
    }
    
    with pytest.raises(ValidationError) as exc_info:
        ExamCreate(**data_num_variants_zero)
    
    errors = exc_info.value.errors()
    assert any(e["loc"] == ("num_variants",) and "greater than 0" in str(e["msg"]).lower() for e in errors)
    
    # num_variants > 100
    data_num_variants_too_high = {
        "name": "Test Exam",
        "subject": "Math",
        "academic_year": "2026",
        "num_variants": 101  # Exceeds max 100
    }
    
    with pytest.raises(ValidationError):
        ExamCreate(**data_num_variants_too_high)


def test_exam_create_strip_whitespace():
    """T021: Test ExamCreate schema whitespace stripping."""
    # Data with leading/trailing whitespace
    data = {
        "name": "  Mathematics Final Exam  ",
        "subject": "  Mathematics  ",
        "academic_year": "  2025-2026  ",
        "grade_level": "  Grade 10  ",
        "num_variants": 5,
        "duration_minutes": 60,
        "instructions": "  Use blue pen only.  "
    }
    
    exam = ExamCreate(**data)
    
    # Verify whitespace was stripped
    assert exam.name == "Mathematics Final Exam"
    assert exam.subject == "Mathematics"
    assert exam.academic_year == "2025-2026"
    assert exam.grade_level == "Grade 10"
    assert exam.instructions == "Use blue pen only."


def test_exam_update_partial():
    """T022: Test ExamUpdate schema partial updates."""
    # Update only status
    data1 = {"status": "processing"}
    exam_update1 = ExamUpdate(**data1)
    assert exam_update1.status == "processing"
    assert exam_update1.name is None
    assert exam_update1.subject is None
    
    # Update only name and num_variants
    data2 = {
        "name": "Updated Exam Name",
        "num_variants": 7
    }
    exam_update2 = ExamUpdate(**data2)
    assert exam_update2.name == "Updated Exam Name"
    assert exam_update2.num_variants == 7
    assert exam_update2.subject is None
    assert exam_update2.status is None
    
    # Empty update (all fields optional)
    data3 = {}
    exam_update3 = ExamUpdate(**data3)
    assert exam_update3.name is None
    assert exam_update3.subject is None


def test_exam_response_from_orm():
    """T023: Test ExamResponse schema ORM conversion."""
    # Create a mock ORM model instance (without database)
    exam_orm = type('Exam', (), {
        'exam_id': uuid4(),
        'user_id': uuid4(),
        'name': 'Mathematics Final Exam 2026',
        'subject': 'Mathematics',
        'academic_year': '2025-2026',
        'grade_level': 'Grade 10',
        'num_variants': 5,
        'duration_minutes': 90,
        'instructions': 'Use blue or black pen only.',
        'status': ExamStatus.DRAFT,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    })()
    
    # Convert ORM model to Pydantic schema
    response = ExamResponse.model_validate(exam_orm)
    
    # Verify all fields are present
    assert response.exam_id == exam_orm.exam_id
    assert response.user_id == exam_orm.user_id
    assert response.name == exam_orm.name
    assert response.subject == exam_orm.subject
    assert response.academic_year == exam_orm.academic_year
    assert response.grade_level == exam_orm.grade_level
    assert response.num_variants == exam_orm.num_variants
    assert response.instructions == exam_orm.instructions
    assert response.status == exam_orm.status
    assert response.created_at == exam_orm.created_at
    assert response.updated_at == exam_orm.updated_at


def test_exam_list_response():
    """Test ExamListResponse pagination schema."""
    # Create mock exam response
    exam_dict = {
        'exam_id': uuid4(),
        'user_id': uuid4(),
        'name': 'Test Exam',
        'subject': 'Test',
        'academic_year': '2026',
        'grade_level': None,
        'num_variants': 1,
        'duration_minutes': 60,
        'instructions': None,
        'status': ExamStatus.DRAFT,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    exam_response = ExamResponse(**exam_dict)
    
    # Create list response
    list_response = ExamListResponse(
        items=[exam_response],
        total=42,
        page=1,
        page_size=20
    )
    
    assert len(list_response.items) == 1
    assert list_response.total == 42
    assert list_response.page == 1
    assert list_response.page_size == 20
