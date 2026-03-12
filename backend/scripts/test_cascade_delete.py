"""Test cascade deletion behavior for exams.

This script validates that deleting an exam cascades to:
- All artifacts linked to the exam
- All tasks linked to the exam
"""

import asyncio
from sqlalchemy import select, func
from app.core.database import AsyncSessionLocal
from app.models.exam import Exam
from app.models.artifact import Artifact
from app.models.task import Task


async def test_exam_cascade_delete():
    """Test that deleting exam cascades to artifacts and tasks."""
    async with AsyncSessionLocal() as db:
        # Get exam
        result = await db.execute(select(Exam).limit(1))
        exam = result.scalar_one_or_none()
        
        if not exam:
            print("❌ No exams found. Run create_test_exam.py first.")
            return
        
        exam_id = exam.exam_id
        exam_name = exam.name
        
        # Count related entities before delete
        artifacts_before = await db.scalar(
            select(func.count()).select_from(Artifact).where(Artifact.exam_id == exam_id)
        )
        tasks_before = await db.scalar(
            select(func.count()).select_from(Task).where(Task.exam_id == exam_id)
        )
        
        print(f"📋 Exam: {exam_name}")
        print(f"   Exam ID: {exam_id}")
        print(f"   Artifacts before delete: {artifacts_before}")
        print(f"   Tasks before delete: {tasks_before}")
        
        # Delete exam
        await db.delete(exam)
        await db.commit()
        
        # Verify cascaded deletion
        artifacts_after = await db.scalar(
            select(func.count()).select_from(Artifact).where(Artifact.exam_id == exam_id)
        )
        tasks_after = await db.scalar(
            select(func.count()).select_from(Task).where(Task.exam_id == exam_id)
        )
        
        print(f"\n   Artifacts after delete: {artifacts_after}")
        print(f"   Tasks after delete: {tasks_after}")
        
        if artifacts_after == 0 and tasks_after == 0:
            print("\n✅ Cascade delete successful!")
        else:
            print("\n❌ Cascade delete failed - orphaned records exist!")


if __name__ == "__main__":
    asyncio.run(test_exam_cascade_delete())
