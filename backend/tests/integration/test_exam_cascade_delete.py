"""Integration tests for exam cascade deletion behavior.

Feature: 003-exams-artifacts-model
User Story 4: User Ownership & Cascade Delete
"""

import pytest
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.exam import Exam, ExamStatus
from app.models.task import Task, TaskStatus
from app.models.task_log import TaskLog, LogLevel
from app.models.artifact import Artifact, ArtifactType
from tests.utils import create_test_user


@pytest.mark.asyncio
async def test_exam_ownership_by_user(async_session: AsyncSession):
    """
    T073: Verify exams are properly owned by users.
    
    Scenario: Create exams for different users, verify each user owns only their exams.
    """
    # Create two users
    user1 = await create_test_user(async_session, "user1@example.com", "User One")
    user2 = await create_test_user(async_session, "user2@example.com", "User Two")
    
    # Capture user IDs
    user1_id = user1.user_id
    user2_id = user2.user_id
    
    # Create 2 exams for user1
    exam1_user1 = Exam(
        user_id=user1_id,
        name="User1 Exam 1",
        subject="Math",
        academic_year="2025-2026",
        num_variants=3,
        status=ExamStatus.DRAFT
    )
    exam2_user1 = Exam(
        user_id=user1_id,
        name="User1 Exam 2",
        subject="Science",
        academic_year="2025-2026",
        num_variants=2,
        status=ExamStatus.PROCESSING
    )
    
    # Create 1 exam for user2
    exam1_user2 = Exam(
        user_id=user2_id,
        name="User2 Exam 1",
        subject="History",
        academic_year="2025-2026",
        num_variants=1,
        status=ExamStatus.COMPLETED
    )
    
    async_session.add_all([exam1_user1, exam2_user1, exam1_user2])
    await async_session.commit()
    
    # Query exams for user1
    result = await async_session.execute(
        select(Exam).where(Exam.user_id == user1_id)
    )
    user1_exams = result.scalars().all()
    
    # Query exams for user2
    result = await async_session.execute(
        select(Exam).where(Exam.user_id == user2_id)
    )
    user2_exams = result.scalars().all()
    
    # Verify user1 owns exactly 2 exams
    assert len(user1_exams) == 2
    assert all(exam.user_id == user1_id for exam in user1_exams)
    assert set([exam.name for exam in user1_exams]) == {"User1 Exam 1", "User1 Exam 2"}
    
    # Verify user2 owns exactly 1 exam
    assert len(user2_exams) == 1
    assert user2_exams[0].user_id == user2_id
    assert user2_exams[0].name == "User2 Exam 1"


@pytest.mark.asyncio
async def test_user_delete_cascades_exams(async_session: AsyncSession):
    """
    T074: Verify deleting a user cascades to delete all owned exams.
    
    Scenario: Create user with exams, delete user, verify all exams are deleted.
    """
    # Create user with 2 exams
    user = await create_test_user(async_session, "cascade-user@example.com", "Cascade User")
    user_id = user.user_id
    
    exam1 = Exam(
        user_id=user_id,
        name="Exam 1",
        subject="Math",
        academic_year="2025-2026",
        num_variants=3,
        status=ExamStatus.DRAFT
    )
    exam2 = Exam(
        user_id=user_id,
        name="Exam 2",
        subject="Science",
        academic_year="2025-2026",
        num_variants=2,
        status=ExamStatus.PROCESSING
    )
    
    async_session.add_all([exam1, exam2])
    await async_session.commit()
    
    # Capture exam IDs before deletion
    exam1_id = exam1.exam_id
    exam2_id = exam2.exam_id
    
    # Verify exams exist
    result = await async_session.execute(
        select(Exam).where(Exam.user_id == user_id)
    )
    exams_before = result.scalars().all()
    assert len(exams_before) == 2
    
    # Delete the user
    await async_session.delete(user)
    await async_session.commit()
    
    # Verify all exams are cascade deleted
    result = await async_session.execute(
        select(Exam).where(Exam.exam_id.in_([exam1_id, exam2_id]))
    )
    exams_after = result.scalars().all()
    assert len(exams_after) == 0, "Exams should be cascade deleted when user is deleted"


@pytest.mark.asyncio
async def test_exam_delete_cascades_tasks(async_session: AsyncSession):
    """
    T075: Verify deleting an exam cascades to delete all linked tasks.
    
    Scenario: Create exam with tasks, delete exam, verify all tasks are deleted.
    """
    # Create user and exam
    user = await create_test_user(async_session, "task-cascade@example.com", "Task Cascade User")
    user_id = user.user_id
    
    exam = Exam(
        user_id=user_id,
        name="Exam with Tasks",
        subject="Physics",
        academic_year="2025-2026",
        num_variants=2,
        status=ExamStatus.PROCESSING
    )
    async_session.add(exam)
    await async_session.commit()
    
    exam_id = exam.exam_id
    
    # Create 3 tasks linked to the exam
    task1 = Task(
        user_id=user_id,
        exam_id=exam_id,
        status=TaskStatus.COMPLETED
    )
    task2 = Task(
        user_id=user_id,
        exam_id=exam_id,
        status=TaskStatus.RUNNING
    )
    task3 = Task(
        user_id=user_id,
        exam_id=exam_id,
        status=TaskStatus.QUEUED
    )
    
    async_session.add_all([task1, task2, task3])
    await async_session.commit()
    
    # Capture task IDs
    task_ids = [task1.task_id, task2.task_id, task3.task_id]
    
    # Verify tasks exist
    result = await async_session.execute(
        select(Task).where(Task.exam_id == exam_id)
    )
    tasks_before = result.scalars().all()
    assert len(tasks_before) == 3
    
    # Delete the exam
    await async_session.delete(exam)
    await async_session.commit()
    
    # Verify all tasks are cascade deleted
    result = await async_session.execute(
        select(Task).where(Task.task_id.in_(task_ids))
    )
    tasks_after = result.scalars().all()
    assert len(tasks_after) == 0, "Tasks should be cascade deleted when exam is deleted"


@pytest.mark.asyncio
async def test_exam_delete_cascades_artifacts(async_session: AsyncSession):
    """
    T076: Verify deleting an exam cascades to delete all linked artifacts.
    
    Scenario: Create exam with artifacts, delete exam, verify all artifacts are deleted.
    """
    # Create user and exam
    user = await create_test_user(async_session, "artifact-cascade@example.com", "Artifact Cascade User")
    user_id = user.user_id
    
    exam = Exam(
        user_id=user_id,
        name="Exam with Artifacts",
        subject="Chemistry",
        academic_year="2025-2026",
        num_variants=3,
        status=ExamStatus.COMPLETED
    )
    async_session.add(exam)
    await async_session.commit()
    
    exam_id = exam.exam_id
    
    # Create 4 artifacts linked to the exam
    artifact1 = Artifact(
        exam_id=exam_id,
        artifact_type=ArtifactType.DIJ,
        file_name="questions.json",
        file_path="exams/chemistry-2026/questions.json",
        mime_type="application/json"
    )
    artifact2 = Artifact(
        exam_id=exam_id,
        artifact_type=ArtifactType.QUESTION_PREVIEW,
        file_name="preview.pdf",
        file_path="exams/chemistry-2026/preview.pdf",
        mime_type="application/pdf"
    )
    artifact3 = Artifact(
        exam_id=exam_id,
        artifact_type=ArtifactType.NES,
        file_name="nes-output.pdf",
        file_path="exams/chemistry-2026/nes-output.pdf",
        mime_type="application/pdf"
    )
    artifact4 = Artifact(
        exam_id=exam_id,
        artifact_type=ArtifactType.VARIANTS_PACKAGE,
        file_name="variants.zip",
        file_path="exams/chemistry-2026/variants.zip",
        mime_type="application/zip"
    )
    
    async_session.add_all([artifact1, artifact2, artifact3, artifact4])
    await async_session.commit()
    
    # Capture artifact IDs
    artifact_ids = [artifact1.artifact_id, artifact2.artifact_id, artifact3.artifact_id, artifact4.artifact_id]
    
    # Verify artifacts exist
    result = await async_session.execute(
        select(Artifact).where(Artifact.exam_id == exam_id)
    )
    artifacts_before = result.scalars().all()
    assert len(artifacts_before) == 4
    
    # Delete the exam
    await async_session.delete(exam)
    await async_session.commit()
    
    # Verify all artifacts are cascade deleted
    result = await async_session.execute(
        select(Artifact).where(Artifact.artifact_id.in_(artifact_ids))
    )
    artifacts_after = result.scalars().all()
    assert len(artifacts_after) == 0, "Artifacts should be cascade deleted when exam is deleted"


@pytest.mark.asyncio
async def test_exam_delete_cascades_task_logs(async_session: AsyncSession):
    """
    T077: Verify deleting an exam cascades through tasks to delete task_logs.
    
    Scenario: Create exam with tasks and task_logs, delete exam, verify all task_logs are deleted.
    """
    # Create user and exam
    user = await create_test_user(async_session, "task-log-cascade@example.com", "Task Log Cascade User")
    user_id = user.user_id
    
    exam = Exam(
        user_id=user_id,
        name="Exam with Task Logs",
        subject="Biology",
        academic_year="2025-2026",
        num_variants=2,
        status=ExamStatus.PROCESSING
    )
    async_session.add(exam)
    await async_session.commit()
    
    exam_id = exam.exam_id
    
    # Create task linked to the exam
    task = Task(
        user_id=user_id,
        exam_id=exam_id,
        status=TaskStatus.RUNNING
    )
    async_session.add(task)
    await async_session.commit()
    
    task_id = task.task_id
    
    # Create 3 task logs for the task
    log1 = TaskLog(
        task_id=task_id,
        level=LogLevel.INFO,
        message="Task started",
        stage="extract_questions"
    )
    log2 = TaskLog(
        task_id=task_id,
        level=LogLevel.INFO,
        message="Processing questions",
        stage="extract_questions"
    )
    log3 = TaskLog(
        task_id=task_id,
        level=LogLevel.ERROR,
        message="Validation error",
        stage="extract_questions",
        data_json={"error": "Invalid format"}
    )
    
    async_session.add_all([log1, log2, log3])
    await async_session.commit()
    
    # Capture log IDs
    log_ids = [log1.log_id, log2.log_id, log3.log_id]
    
    # Verify logs exist
    result = await async_session.execute(
        select(TaskLog).where(TaskLog.task_id == task_id)
    )
    logs_before = result.scalars().all()
    assert len(logs_before) == 3
    
    # Delete the exam (should cascade through task to task_logs)
    await async_session.delete(exam)
    await async_session.commit()
    
    # Verify all task_logs are cascade deleted
    result = await async_session.execute(
        select(TaskLog).where(TaskLog.log_id.in_(log_ids))
    )
    logs_after = result.scalars().all()
    assert len(logs_after) == 0, "Task logs should be cascade deleted when exam is deleted (via task deletion)"


@pytest.mark.asyncio
async def test_task_delete_nullifies_artifact_task_id(async_session: AsyncSession):
    """
    T078: Verify deleting a task sets artifact.task_id to NULL (not cascade delete).
    
    Scenario: Create task with artifacts, delete task, verify artifacts remain with task_id=NULL.
    """
    # Create user and exam
    user = await create_test_user(async_session, "task-nullify@example.com", "Task Nullify User")
    user_id = user.user_id
    
    exam = Exam(
        user_id=user_id,
        name="Exam for Task Nullify Test",
        subject="Geography",
        academic_year="2025-2026",
        num_variants=2,
        status=ExamStatus.PROCESSING
    )
    async_session.add(exam)
    await async_session.commit()
    
    exam_id = exam.exam_id
    
    # Create task linked to the exam
    task = Task(
        user_id=user_id,
        exam_id=exam_id,
        status=TaskStatus.COMPLETED
    )
    async_session.add(task)
    await async_session.commit()
    
    task_id = task.task_id
    
    # Create 2 artifacts: one linked to task, one exam-level only
    artifact_with_task = Artifact(
        exam_id=exam_id,
        task_id=task_id,  # Linked to specific task
        artifact_type=ArtifactType.DIJ,
        file_name="dij-from-task.json",
        file_path="exams/geography-2026/dij-from-task.json",
        mime_type="application/json"
    )
    artifact_exam_only = Artifact(
        exam_id=exam_id,
        task_id=None,  # Exam-level artifact (no specific task)
        artifact_type=ArtifactType.QUESTION_PREVIEW,
        file_name="preview.pdf",
        file_path="exams/geography-2026/preview.pdf",
        mime_type="application/pdf"
    )
    
    async_session.add_all([artifact_with_task, artifact_exam_only])
    await async_session.commit()
    
    # Capture artifact IDs
    artifact_task_id = artifact_with_task.artifact_id
    artifact_exam_id = artifact_exam_only.artifact_id
    
    # Verify initial state
    result = await async_session.execute(
        select(Artifact).where(Artifact.artifact_id == artifact_task_id)
    )
    artifact_before = result.scalar_one()
    assert artifact_before.task_id == task_id
    
    # Delete the task
    await async_session.delete(task)
    await async_session.commit()
    
    # Verify both artifacts still exist
    result = await async_session.execute(
        select(Artifact).where(Artifact.artifact_id.in_([artifact_task_id, artifact_exam_id]))
    )
    artifacts_after = result.scalars().all()
    assert len(artifacts_after) == 2, "Artifacts should NOT be deleted when task is deleted"
    
    # Verify artifact.task_id is set to NULL
    result = await async_session.execute(
        select(Artifact).where(Artifact.artifact_id == artifact_task_id)
    )
    artifact_after = result.scalar_one()
    assert artifact_after.task_id is None, "Artifact.task_id should be NULL after task deletion"
    assert artifact_after.exam_id == exam_id, "Artifact.exam_id should remain unchanged"
    
    # Verify exam-level artifact unchanged
    result = await async_session.execute(
        select(Artifact).where(Artifact.artifact_id == artifact_exam_id)
    )
    exam_artifact = result.scalar_one()
    assert exam_artifact.task_id is None
    assert exam_artifact.exam_id == exam_id


@pytest.mark.asyncio
async def test_query_exams_by_user(async_session: AsyncSession):
    """
    T079: Verify querying exams by user_id returns correct results.
    
    Scenario: Create multiple users with exams, verify query filters correctly.
    """
    # Create 3 users
    user1 = await create_test_user(async_session, "query-user1@example.com", "Query User 1")
    user2 = await create_test_user(async_session, "query-user2@example.com", "Query User 2")
    user3 = await create_test_user(async_session, "query-user3@example.com", "Query User 3")
    
    user1_id = user1.user_id
    user2_id = user2.user_id
    user3_id = user3.user_id
    
    # Create exams for each user
    # User1: 3 exams
    exam1_u1 = Exam(user_id=user1_id, name="U1 Math", subject="Math", academic_year="2025-2026", num_variants=2, status=ExamStatus.DRAFT)
    exam2_u1 = Exam(user_id=user1_id, name="U1 Science", subject="Science", academic_year="2025-2026", num_variants=3, status=ExamStatus.PROCESSING)
    exam3_u1 = Exam(user_id=user1_id, name="U1 History", subject="History", academic_year="2025-2026", num_variants=1, status=ExamStatus.COMPLETED)
    
    # User2: 2 exams
    exam1_u2 = Exam(user_id=user2_id, name="U2 Physics", subject="Physics", academic_year="2025-2026", num_variants=2, status=ExamStatus.DRAFT)
    exam2_u2 = Exam(user_id=user2_id, name="U2 Chemistry", subject="Chemistry", academic_year="2025-2026", num_variants=4, status=ExamStatus.COMPLETED)
    
    # User3: 0 exams (no exams created)
    
    async_session.add_all([exam1_u1, exam2_u1, exam3_u1, exam1_u2, exam2_u2])
    await async_session.commit()
    
    # Query exams for user1
    result = await async_session.execute(
        select(Exam).where(Exam.user_id == user1_id).order_by(Exam.name)
    )
    user1_exams = result.scalars().all()
    assert len(user1_exams) == 3
    assert [e.name for e in user1_exams] == ["U1 History", "U1 Math", "U1 Science"]
    
    # Query exams for user2
    result = await async_session.execute(
        select(Exam).where(Exam.user_id == user2_id).order_by(Exam.name)
    )
    user2_exams = result.scalars().all()
    assert len(user2_exams) == 2
    assert [e.name for e in user2_exams] == ["U2 Chemistry", "U2 Physics"]
    
    # Query exams for user3 (should be empty)
    result = await async_session.execute(
        select(Exam).where(Exam.user_id == user3_id)
    )
    user3_exams = result.scalars().all()
    assert len(user3_exams) == 0
    
    # Query with additional filters (user1, status=COMPLETED)
    result = await async_session.execute(
        select(Exam).where(
            Exam.user_id == user1_id,
            Exam.status == ExamStatus.COMPLETED
        )
    )
    completed_exams = result.scalars().all()
    assert len(completed_exams) == 1
    assert completed_exams[0].name == "U1 History"
