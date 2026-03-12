"""Create test artifact data for development and testing.

This script creates a test artifact linked to an existing exam.
Used for quickstart validation and local development.
"""

import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.artifact import Artifact
from app.models.exam import Exam


async def create_test_artifact():
    """Create a test artifact for development."""
    async with AsyncSessionLocal() as db:
        # Get first exam
        result = await db.execute(select(Exam).limit(1))
        exam = result.scalar_one_or_none()
        
        if not exam:
            print("❌ No exams found. Run create_test_exam.py first.")
            return
        
        # Create test artifact
        artifact = Artifact(
            exam_id=exam.exam_id,
            task_id=None,  # Not tied to specific task
            artifact_type="question_preview",
            file_name="question-1.png",
            file_path=f"exams/{exam.user_id}/mathematics-final-exam-2026/question-1.png",
            mime_type="image/png"
        )
        db.add(artifact)
        await db.commit()
        await db.refresh(artifact)
        
        print(f"✅ Created test artifact: {artifact.file_name}")
        print(f"   Artifact ID: {artifact.artifact_id}")
        print(f"   Type: {artifact.artifact_type}")
        print(f"   Exam: {exam.name}")
        return artifact


if __name__ == "__main__":
    asyncio.run(create_test_artifact())
