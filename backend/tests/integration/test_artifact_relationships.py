"""Integration tests for artifact relationships.

Feature: 003-exams-artifacts-model
User Story 3: Artifact Tracking
"""

import pytest
from sqlalchemy import select

from app.models.artifact import Artifact, ArtifactType
from app.models.exam import Exam, ExamStatus
from app.models.task import Task, TaskStatus
from tests.utils import create_test_user


@pytest.mark.asyncio
async def test_query_artifacts_by_exam(async_session):
    """T056: Test querying artifacts by exam_id."""
    user = await create_test_user(async_session, google_sub="artifact_by_exam_test")
    
    # Create two exams
    exam1 = Exam(
        user_id=user.user_id,
        name="Exam 1",
        subject="Math",
        academic_year="2026",
        num_variants=3,
        status=ExamStatus.DRAFT
    )
    exam2 = Exam(
        user_id=user.user_id,
        name="Exam 2",
        subject="Physics",
        academic_year="2026",
        num_variants=2,
        status=ExamStatus.DRAFT
    )
    async_session.add_all([exam1, exam2])
    await async_session.commit()
    await async_session.refresh(exam1)
    await async_session.refresh(exam2)
    
    # Create artifacts for exam1
    artifact1_1 = Artifact(
        exam_id=exam1.exam_id,
        artifact_type=ArtifactType.DIJ,
        file_name="exam1.dij.pdf",
        file_path="exams/user/exam1/exam1.dij.pdf",
        mime_type="application/pdf"
    )
    artifact1_2 = Artifact(
        exam_id=exam1.exam_id,
        artifact_type=ArtifactType.NES,
        file_name="exam1.nes.json",
        file_path="exams/user/exam1/exam1.nes.json",
        mime_type="application/json"
    )
    
    # Create artifacts for exam2
    artifact2_1 = Artifact(
        exam_id=exam2.exam_id,
        artifact_type=ArtifactType.DIJ,
        file_name="exam2.dij.pdf",
        file_path="exams/user/exam2/exam2.dij.pdf",
        mime_type="application/pdf"
    )
    
    async_session.add_all([artifact1_1, artifact1_2, artifact2_1])
    await async_session.commit()
    
    # Query artifacts for exam1
    result = await async_session.execute(
        select(Artifact).where(Artifact.exam_id == exam1.exam_id)
    )
    exam1_artifacts = result.scalars().all()
    
    assert len(exam1_artifacts) == 2
    artifact_types = {a.artifact_type for a in exam1_artifacts}
    assert artifact_types == {ArtifactType.DIJ, ArtifactType.NES}
    
    # Query artifacts for exam2
    result = await async_session.execute(
        select(Artifact).where(Artifact.exam_id == exam2.exam_id)
    )
    exam2_artifacts = result.scalars().all()
    
    assert len(exam2_artifacts) == 1
    assert exam2_artifacts[0].artifact_type == ArtifactType.DIJ


@pytest.mark.asyncio
async def test_query_artifacts_by_task(async_session):
    """T057: Test querying artifacts by task_id."""
    user = await create_test_user(async_session, google_sub="artifact_by_task_test")
    
    exam = Exam(
        user_id=user.user_id,
        name="Task Artifact Test Exam",
        subject="Chemistry",
        academic_year="2026",
        num_variants=3,
        status=ExamStatus.PROCESSING
    )
    async_session.add(exam)
    await async_session.commit()
    await async_session.refresh(exam)
    
    # Create two tasks for the exam
    task1 = Task(
        user_id=user.user_id,
        exam_id=exam.exam_id,
        status=TaskStatus.COMPLETED,
        progress=100
    )
    task2 = Task(
        user_id=user.user_id,
        exam_id=exam.exam_id,
        status=TaskStatus.RUNNING,
        progress=50
    )
    async_session.add_all([task1, task2])
    await async_session.commit()
    await async_session.refresh(task1)
    await async_session.refresh(task2)
    
    # Create artifacts for task1
    artifact_task1_1 = Artifact(
        exam_id=exam.exam_id,
        task_id=task1.task_id,
        artifact_type=ArtifactType.DIJ,
        file_name="task1-dij.pdf",
        file_path="exams/user/exam/task1-dij.pdf",
        mime_type="application/pdf"
    )
    artifact_task1_2 = Artifact(
        exam_id=exam.exam_id,
        task_id=task1.task_id,
        artifact_type=ArtifactType.NES,
        file_name="task1-nes.json",
        file_path="exams/user/exam/task1-nes.json",
        mime_type="application/json"
    )
    
    # Create artifact for task2
    artifact_task2 = Artifact(
        exam_id=exam.exam_id,
        task_id=task2.task_id,
        artifact_type=ArtifactType.QUESTION_PREVIEW,
        file_name="task2-preview.png",
        file_path="exams/user/exam/task2-preview.png",
        mime_type="image/png"
    )
    
    # Create artifact with no task (exam-level artifact)
    artifact_no_task = Artifact(
        exam_id=exam.exam_id,
        task_id=None,
        artifact_type=ArtifactType.ANSWER_MATRIX,
        file_name="answer-matrix.csv",
        file_path="exams/user/exam/answer-matrix.csv",
        mime_type="text/csv"
    )
    
    async_session.add_all([artifact_task1_1, artifact_task1_2, artifact_task2, artifact_no_task])
    await async_session.commit()
    
    # Query artifacts for task1
    result = await async_session.execute(
        select(Artifact).where(Artifact.task_id == task1.task_id)
    )
    task1_artifacts = result.scalars().all()
    
    assert len(task1_artifacts) == 2
    task1_types = {a.artifact_type for a in task1_artifacts}
    assert task1_types == {ArtifactType.DIJ, ArtifactType.NES}
    
    # Query artifacts for task2
    result = await async_session.execute(
        select(Artifact).where(Artifact.task_id == task2.task_id)
    )
    task2_artifacts = result.scalars().all()
    
    assert len(task2_artifacts) == 1
    assert task2_artifacts[0].artifact_type == ArtifactType.QUESTION_PREVIEW
    
    # Query artifacts with no task (exam-level)
    result = await async_session.execute(
        select(Artifact).where(Artifact.task_id.is_(None))
    )
    no_task_artifacts = result.scalars().all()
    
    assert len(no_task_artifacts) >= 1  # At least our artifact_no_task
    artifact_no_task_found = any(a.file_name == "answer-matrix.csv" for a in no_task_artifacts)
    assert artifact_no_task_found


@pytest.mark.asyncio
async def test_artifacts_from_multiple_tasks(async_session):
    """T058: Test artifact creation from multiple tasks for same exam."""
    user = await create_test_user(async_session, google_sub="multi_task_artifact_test")
    
    exam = Exam(
        user_id=user.user_id,
        name="Multi-Task Exam",
        subject="Biology",
        academic_year="2026",
        num_variants=5,
        status=ExamStatus.PROCESSING
    )
    async_session.add(exam)
    await async_session.commit()
    await async_session.refresh(exam)
    
    # Simulate pipeline: multiple tasks each producing artifacts
    tasks = []
    for i in range(3):
        task = Task(
            user_id=user.user_id,
            exam_id=exam.exam_id,
            status=TaskStatus.COMPLETED,
            progress=100
        )
        async_session.add(task)
        tasks.append(task)
    
    await async_session.commit()
    for task in tasks:
        await async_session.refresh(task)
    
    # Each task produces 2 artifacts
    all_artifacts = []
    for idx, task in enumerate(tasks):
        artifact1 = Artifact(
            exam_id=exam.exam_id,
            task_id=task.task_id,
            artifact_type=ArtifactType.QUESTION_PREVIEW,
            file_name=f"preview-{idx}-1.png",
            file_path=f"exams/user/exam/preview-{idx}-1.png",
            mime_type="image/png"
        )
        artifact2 = Artifact(
            exam_id=exam.exam_id,
            task_id=task.task_id,
            artifact_type=ArtifactType.QUESTION_PREVIEW,
            file_name=f"preview-{idx}-2.png",
            file_path=f"exams/user/exam/preview-{idx}-2.png",
            mime_type="image/png"
        )
        async_session.add_all([artifact1, artifact2])
        all_artifacts.extend([artifact1, artifact2])
    
    await async_session.commit()
    
    # Query all artifacts for the exam
    result = await async_session.execute(
        select(Artifact).where(Artifact.exam_id == exam.exam_id)
    )
    exam_artifacts = result.scalars().all()
    
    # Should have 6 artifacts total (3 tasks × 2 artifacts each)
    assert len(exam_artifacts) == 6
    
    # All should be question previews
    for artifact in exam_artifacts:
        assert artifact.artifact_type == ArtifactType.QUESTION_PREVIEW
        assert artifact.task_id is not None  # All linked to tasks
    
    # Verify we can query by task and get the right count
    for task in tasks:
        result = await async_session.execute(
            select(Artifact).where(Artifact.task_id == task.task_id)
        )
        task_artifacts = result.scalars().all()
        assert len(task_artifacts) == 2  # Each task produced 2 artifacts
