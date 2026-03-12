"""Unit tests for Exam model.

Feature: 003-exams-artifacts-model
User Story 1: Exam Metadata Storage

Tests: T014-T018 (TDD - write first, ensure FAIL before implementation)
"""

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from app.models.exam import Exam, ExamStatus
from tests.utils import create_test_user


@pytest.mark.asyncio
async def test_exam_creation(async_session):
    """T014: Test creating an exam with all required fields."""
    # Create user first (exams belong to users)
    user = await create_test_user(async_session, google_sub="exam_test_user")
    
    # Create exam
    exam = Exam(
        user_id=user.user_id,
        name="Mathematics Final Exam 2026",
        subject="Mathematics",
        academic_year="2025-2026",
        grade_level="Grade 10",
        num_variants=5,
        instructions="Use blue or black pen only.",
        status=ExamStatus.DRAFT
    )
    
    async_session.add(exam)
    await async_session.commit()
    await async_session.refresh(exam)
    
    # Verify exam was created with all fields
    assert exam.exam_id is not None
    assert exam.user_id == user.user_id
    assert exam.name == "Mathematics Final Exam 2026"
    assert exam.subject == "Mathematics"
    assert exam.academic_year == "2025-2026"
    assert exam.grade_level == "Grade 10"
    assert exam.num_variants == 5
    assert exam.instructions == "Use blue or black pen only."
    assert exam.status == ExamStatus.DRAFT
    assert exam.created_at is not None
    assert exam.updated_at is not None


@pytest.mark.asyncio
async def test_exam_status_enum_values(async_session):
    """T015: Test ExamStatus enum validation."""
    user = await create_test_user(async_session, google_sub="exam_status_test")
    
    # Test DRAFT status
    exam1 = Exam(
        user_id=user.user_id,
        name="Draft Exam",
        subject="Test",
        academic_year="2026",
        num_variants=1,
        status=ExamStatus.DRAFT
    )
    async_session.add(exam1)
    await async_session.commit()
    await async_session.refresh(exam1)
    assert exam1.status == ExamStatus.DRAFT
    assert exam1.status.value == "draft"
    
    # Test PROCESSING status
    exam2 = Exam(
        user_id=user.user_id,
        name="Processing Exam",
        subject="Test",
        academic_year="2026",
        num_variants=1,
        status=ExamStatus.PROCESSING
    )
    async_session.add(exam2)
    await async_session.commit()
    await async_session.refresh(exam2)
    assert exam2.status == ExamStatus.PROCESSING
    assert exam2.status.value == "processing"
    
    # Test COMPLETED status
    exam3 = Exam(
        user_id=user.user_id,
        name="Completed Exam",
        subject="Test",
        academic_year="2026",
        num_variants=1,
        status=ExamStatus.COMPLETED
    )
    async_session.add(exam3)
    await async_session.commit()
    await async_session.refresh(exam3)
    assert exam3.status == ExamStatus.COMPLETED
    assert exam3.status.value == "completed"


@pytest.mark.asyncio
async def test_exam_num_variants_constraint(async_session):
    """T016: Test num_variants CHECK constraint (must be > 0)."""
    user = await create_test_user(async_session, google_sub="exam_constraint_test")
    user_id = user.user_id  # Capture user_id before any commits
    
    # Valid: num_variants = 1
    exam_valid = Exam(
        user_id=user_id,
        name="Valid Exam",
        subject="Test",
        academic_year="2026",
        num_variants=1,
        status=ExamStatus.DRAFT
    )
    async_session.add(exam_valid)
    await async_session.commit()
    await async_session.refresh(exam_valid)
    assert exam_valid.num_variants == 1
    
    # Invalid: num_variants = 0 should fail
    exam_invalid = Exam(
        user_id=user_id,
        name="Invalid Exam",
        subject="Test",
        academic_year="2026",
        num_variants=0,  # Should violate CHECK constraint
        status=ExamStatus.DRAFT
    )
    async_session.add(exam_invalid)
    
    with pytest.raises(IntegrityError):
        await async_session.commit()
    
    await async_session.rollback()
    
    # Invalid: num_variants < 0 should also fail
    exam_negative = Exam(
        user_id=user_id,
        name="Negative Exam",
        subject="Test",
        academic_year="2026",
        num_variants=-1,  # Should violate CHECK constraint
        status=ExamStatus.DRAFT
    )
    async_session.add(exam_negative)
    
    with pytest.raises(IntegrityError):
        await async_session.commit()


@pytest.mark.asyncio
async def test_exam_timestamps(async_session):
    """T017: Test created_at and updated_at timestamps."""
    user = await create_test_user(async_session, google_sub="exam_timestamp_test")
    
    # Create exam
    exam = Exam(
        user_id=user.user_id,
        name="Timestamp Test Exam",
        subject="Test",
        academic_year="2026",
        num_variants=1,
        status=ExamStatus.DRAFT
    )
    async_session.add(exam)
    await async_session.commit()
    await async_session.refresh(exam)
    
    # Verify timestamps are set
    assert exam.created_at is not None
    assert exam.updated_at is not None
    assert isinstance(exam.created_at, datetime)
    assert isinstance(exam.updated_at, datetime)
    
    # Store original timestamps
    original_created = exam.created_at
    original_updated = exam.updated_at
    
    # Update exam
    exam.name = "Updated Timestamp Test Exam"
    await async_session.commit()
    await async_session.refresh(exam)
    
    # created_at should not change, updated_at should be newer or equal
    assert exam.created_at == original_created
    assert exam.updated_at >= original_updated


@pytest.mark.asyncio
async def test_exam_user_fk(async_session):
    """T018: Test user_id foreign key constraint."""
    user = await create_test_user(async_session, google_sub="exam_fk_test")
    
    # Valid: exam with valid user_id
    exam = Exam(
        user_id=user.user_id,
        name="FK Test Exam",
        subject="Test",
        academic_year="2026",
        num_variants=1,
        status=ExamStatus.DRAFT
    )
    async_session.add(exam)
    await async_session.commit()
    await async_session.refresh(exam)
    assert exam.user_id == user.user_id
    
    # Verify relationship access
    await async_session.refresh(exam, ["user"])
    assert exam.user is not None
    assert exam.user.user_id == user.user_id
    
    # Query exam by user_id
    stmt = select(Exam).where(Exam.user_id == user.user_id)
    result = await async_session.execute(stmt)
    found_exam = result.scalar_one_or_none()
    assert found_exam is not None
    assert found_exam.exam_id == exam.exam_id


@pytest.mark.asyncio
async def test_exam_optional_fields(async_session):
    """Test that grade_level and instructions are optional."""
    user = await create_test_user(async_session, google_sub="exam_optional_test")
    
    # Create exam without optional fields
    exam = Exam(
        user_id=user.user_id,
        name="Minimal Exam",
        subject="Test",
        academic_year="2026",
        num_variants=1,
        status=ExamStatus.DRAFT
        # grade_level and instructions omitted
    )
    async_session.add(exam)
    await async_session.commit()
    await async_session.refresh(exam)
    
    # Verify optional fields can be None
    assert exam.grade_level is None
    assert exam.instructions is None


@pytest.mark.asyncio
async def test_exam_default_status(async_session):
    """Test that status defaults to DRAFT."""
    user = await create_test_user(async_session, google_sub="exam_default_status")
    
    # Create exam without specifying status
    exam = Exam(
        user_id=user.user_id,
        name="Default Status Exam",
        subject="Test",
        academic_year="2026",
        num_variants=1
        # status not specified
    )
    async_session.add(exam)
    await async_session.commit()
    await async_session.refresh(exam)
    
    # Verify default status is DRAFT
    assert exam.status == ExamStatus.DRAFT
