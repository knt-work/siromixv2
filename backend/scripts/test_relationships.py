"""Test relationship loading for exam→artifacts and user→exams.

This script validates that SQLAlchemy relationships are properly configured
and can eagerly load related entities.
"""

import asyncio
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import AsyncSessionLocal
from app.models.exam import Exam
from app.models.user import User


async def test_exam_artifacts():
    """Test loading exam with artifacts."""
    async with AsyncSessionLocal() as db:
        # Load exam with artifacts eagerly
        result = await db.execute(
            select(Exam)
            .options(selectinload(Exam.artifacts))
            .limit(1)
        )
        exam = result.scalar_one_or_none()
        
        if not exam:
            print("❌ No exams found")
            return
        
        print(f"📋 Exam: {exam.name}")
        print(f"   Status: {exam.status}")
        print(f"   Artifacts ({len(exam.artifacts)}):")
        
        if exam.artifacts:
            for artifact in exam.artifacts:
                print(f"      - {artifact.file_name} ({artifact.artifact_type})")
        else:
            print("      (no artifacts)")


async def test_user_exams():
    """Test loading user with exams."""
    async with AsyncSessionLocal() as db:
        # Load user with exams eagerly
        result = await db.execute(
            select(User)
            .options(selectinload(User.exams))
            .limit(1)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print("❌ No users found")
            return
        
        print(f"👤 User: {user.display_name} ({user.email})")
        print(f"   Exams ({len(user.exams)}):")
        
        if user.exams:
            for exam in user.exams:
                print(f"      - {exam.name} [{exam.status}]")
        else:
            print("      (no exams)")


async def main():
    """Run all relationship tests."""
    await test_exam_artifacts()
    print()
    await test_user_exams()


if __name__ == "__main__":
    asyncio.run(main())
