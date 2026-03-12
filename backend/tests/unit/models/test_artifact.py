"""Unit tests for Artifact model.

Feature: 003-exams-artifacts-model
User Story 3: Artifact Tracking
"""

import pytest
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.models.artifact import Artifact, ArtifactType
from app.models.exam import Exam, ExamStatus
from app.models.task import Task, TaskStatus
from tests.utils import create_test_user


@pytest.mark.asyncio
async def test_artifact_creation(async_session):
    """T046: Test Artifact model creation with all required fields."""
    user = await create_test_user(async_session, google_sub="artifact_test_user")
    
    # Create an exam first
    exam = Exam(
        user_id=user.user_id,
        name="Test Exam",
        subject="Math",
        academic_year="2026",
        num_variants=3,
        status=ExamStatus.DRAFT
    )
    async_session.add(exam)
    await async_session.commit()
    await async_session.refresh(exam)
    
    # Create a task
    task = Task(
        user_id=user.user_id,
        exam_id=exam.exam_id,
        status=TaskStatus.COMPLETED,
        progress=100
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    # Create an artifact
    artifact = Artifact(
        exam_id=exam.exam_id,
        task_id=task.task_id,
        artifact_type=ArtifactType.DIJ,
        file_name="math-exam.dij.pdf",
        file_path="exams/user123/math-exam/math-exam.dij.pdf",
        mime_type="application/pdf"
    )
    async_session.add(artifact)
    await async_session.commit()
    await async_session.refresh(artifact)
    
    # Verify all fields
    assert artifact.artifact_id is not None  # Auto-increment PK
    assert artifact.exam_id == exam.exam_id
    assert artifact.task_id == task.task_id
    assert artifact.artifact_type == ArtifactType.DIJ
    assert artifact.file_name == "math-exam.dij.pdf"
    assert artifact.file_path == "exams/user123/math-exam/math-exam.dij.pdf"
    assert artifact.mime_type == "application/pdf"
    assert artifact.created_at is not None


@pytest.mark.asyncio
async def test_artifact_type_enum_values(async_session):
    """T047: Test ArtifactType enum validation."""
    user = await create_test_user(async_session, google_sub="artifact_enum_test")
    
    exam = Exam(
        user_id=user.user_id,
        name="Enum Test Exam",
        subject="Physics",
        academic_year="2026",
        num_variants=5,
        status=ExamStatus.DRAFT
    )
    async_session.add(exam)
    await async_session.commit()
    await async_session.refresh(exam)
    
    # Test all valid artifact types
    artifact_types = [
        (ArtifactType.DIJ, "application/pdf"),
        (ArtifactType.QUESTION_PREVIEW, "image/png"),
        (ArtifactType.NES, "application/json"),
        (ArtifactType.VARIANTS_PACKAGE, "application/zip"),
        (ArtifactType.ANSWER_MATRIX, "text/csv")
    ]
    
    for artifact_type, mime_type in artifact_types:
        artifact = Artifact(
            exam_id=exam.exam_id,
            artifact_type=artifact_type,
            file_name=f"test.{artifact_type.value}",
            file_path=f"exams/test/test.{artifact_type.value}",
            mime_type=mime_type
        )
        async_session.add(artifact)
    
    await async_session.commit()
    
    # Query back and verify
    result = await async_session.execute(
        select(Artifact).where(Artifact.exam_id == exam.exam_id)
    )
    artifacts = result.scalars().all()
    
    assert len(artifacts) == 5
    artifact_types_found = {a.artifact_type for a in artifacts}
    assert artifact_types_found == {
        ArtifactType.DIJ,
        ArtifactType.QUESTION_PREVIEW,
        ArtifactType.NES,
        ArtifactType.VARIANTS_PACKAGE,
        ArtifactType.ANSWER_MATRIX
    }


@pytest.mark.asyncio
async def test_artifact_exam_fk(async_session):
    """T048: Test Artifact model exam_id FK constraint."""
    user = await create_test_user(async_session, google_sub="artifact_fk_test")
    
    exam = Exam(
        user_id=user.user_id,
        name="FK Test Exam",
        subject="Chemistry",
        academic_year="2026",
        num_variants=2,
        status=ExamStatus.DRAFT
    )
    async_session.add(exam)
    await async_session.commit()
    await async_session.refresh(exam)
    
    # Create artifact with valid exam_id
    artifact = Artifact(
        exam_id=exam.exam_id,
        artifact_type=ArtifactType.DIJ,
        file_name="test.pdf",
        file_path="exams/test/test.pdf",
        mime_type="application/pdf"
    )
    async_session.add(artifact)
    await async_session.commit()
    await async_session.refresh(artifact)
    
    # Verify relationship works
    assert artifact.exam is not None
    assert artifact.exam.exam_id == exam.exam_id
    assert artifact.exam.name == "FK Test Exam"


@pytest.mark.asyncio
async def test_artifact_task_fk_nullable(async_session):
    """T049: Test Artifact model task_id FK constraint (nullable)."""
    user = await create_test_user(async_session, google_sub="artifact_nullable_fk_test")
    
    exam = Exam(
        user_id=user.user_id,
        name="Nullable FK Test Exam",
        subject="Biology",
        academic_year="2026",
        num_variants=3,
        status=ExamStatus.DRAFT
    )
    async_session.add(exam)
    await async_session.commit()
    await async_session.refresh(exam)
    
    # Create artifact WITHOUT task_id (should be allowed)
    artifact_no_task = Artifact(
        exam_id=exam.exam_id,
        task_id=None,  # Explicitly NULL
        artifact_type=ArtifactType.QUESTION_PREVIEW,
        file_name="question-1.png",
        file_path="exams/test/question-1.png",
        mime_type="image/png"
    )
    async_session.add(artifact_no_task)
    await async_session.commit()
    await async_session.refresh(artifact_no_task)
    
    assert artifact_no_task.task_id is None
    assert artifact_no_task.task is None
    
    # Create artifact WITH task_id
    task = Task(
        user_id=user.user_id,
        exam_id=exam.exam_id,
        status=TaskStatus.COMPLETED,
        progress=100
    )
    async_session.add(task)
    await async_session.commit()
    await async_session.refresh(task)
    
    artifact_with_task = Artifact(
        exam_id=exam.exam_id,
        task_id=task.task_id,
        artifact_type=ArtifactType.NES,
        file_name="metadata.json",
        file_path="exams/test/metadata.json",
        mime_type="application/json"
    )
    async_session.add(artifact_with_task)
    await async_session.commit()
    await async_session.refresh(artifact_with_task)
    
    assert artifact_with_task.task_id == task.task_id
    assert artifact_with_task.task is not None


@pytest.mark.asyncio
async def test_artifact_auto_increment_pk(async_session):
    """T050: Test Artifact model auto-increment PK."""
    user = await create_test_user(async_session, google_sub="artifact_pk_test")
    
    exam = Exam(
        user_id=user.user_id,
        name="PK Test Exam",
        subject="Math",
        academic_year="2026",
        num_variants=1,
        status=ExamStatus.DRAFT
    )
    async_session.add(exam)
    await async_session.commit()
    await async_session.refresh(exam)
    
    # Create multiple artifacts
    artifact1 = Artifact(
        exam_id=exam.exam_id,
        artifact_type=ArtifactType.DIJ,
        file_name="artifact1.pdf",
        file_path="exams/test/artifact1.pdf",
        mime_type="application/pdf"
    )
    artifact2 = Artifact(
        exam_id=exam.exam_id,
        artifact_type=ArtifactType.NES,
        file_name="artifact2.json",
        file_path="exams/test/artifact2.json",
        mime_type="application/json"
    )
    async_session.add_all([artifact1, artifact2])
    await async_session.commit()
    await async_session.refresh(artifact1)
    await async_session.refresh(artifact2)
    
    # Verify auto-increment
    assert artifact1.artifact_id is not None
    assert artifact2.artifact_id is not None
    assert artifact2.artifact_id > artifact1.artifact_id  # Should increment
    assert isinstance(artifact1.artifact_id, int)
    assert isinstance(artifact2.artifact_id, int)


@pytest.mark.asyncio
async def test_artifact_timestamps(async_session):
    """T051: Test Artifact model timestamps."""
    user = await create_test_user(async_session, google_sub="artifact_timestamp_test")
    
    exam = Exam(
        user_id=user.user_id,
        name="Timestamp Test Exam",
        subject="Math",
        academic_year="2026",
        num_variants=1,
        status=ExamStatus.DRAFT
    )
    async_session.add(exam)
    await async_session.commit()
    await async_session.refresh(exam)
    
    # Record time before creation (drop microseconds for SQLite compatibility)
    before_create = datetime.now(timezone.utc).replace(microsecond=0)
    
    artifact = Artifact(
        exam_id=exam.exam_id,
        artifact_type=ArtifactType.DIJ,
        file_name="timestamp-test.pdf",
        file_path="exams/test/timestamp-test.pdf",
        mime_type="application/pdf"
    )
    async_session.add(artifact)
    await async_session.commit()
    await async_session.refresh(artifact)
    
    # Record time after creation
    after_create = datetime.now(timezone.utc)
    
    # Verify created_at is set automatically
    assert artifact.created_at is not None
    assert isinstance(artifact.created_at, datetime)
    
    # Handle timezone-aware and naive datetime comparison
    # SQLite returns naive datetimes, PostgreSQL returns timezone-aware
    created_at = artifact.created_at
    if created_at.tzinfo is None:
        # Naive datetime from SQLite - assume UTC
        created_at = created_at.replace(tzinfo=timezone.utc)
    
    # Verify timestamp is reasonable (within 2 seconds of test execution)
    # Use timedelta for safe comparison accounting for microsecond truncation
    from datetime import timedelta
    assert before_create <= created_at <= after_create + timedelta(seconds=1)
