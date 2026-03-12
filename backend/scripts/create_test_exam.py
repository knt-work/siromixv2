"""Create test exam data for development and testing.

This script creates a test user and exam in the database.
Used for quickstart validation and local development.
"""

import asyncio
from uuid import uuid4
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.exam import Exam
from app.models.user import User


async def create_test_exam():
    """Create a test exam for development."""
    async with AsyncSessionLocal() as db:
        # Get or create test user
        result = await db.execute(
            select(User).where(User.email == "test@example.com")
        )
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(
                user_id=uuid4(),
                google_sub="test_google_sub_12345",
                email="test@example.com",
                display_name="Test User"
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            print(f"✅ Created test user: {user.email} (ID: {user.user_id})")
        else:
            print(f"✅ Using existing user: {user.email} (ID: {user.user_id})")
        
        # Create test exam
        exam = Exam(
            exam_id=uuid4(),
            user_id=user.user_id,
            name="Mathematics Final Exam 2026",
            subject="Mathematics",
            academic_year="2025-2026",
            grade_level="Grade 10",
            num_variants=5,
            instructions="Use blue or black pen only. Show all work for partial credit.",
            status="draft"
        )
        db.add(exam)
        await db.commit()
        await db.refresh(exam)
        
        print(f"✅ Created test exam: {exam.name}")
        print(f"   Exam ID: {exam.exam_id}")
        print(f"   Status: {exam.status}")
        print(f"   Variants: {exam.num_variants}")
        return exam


if __name__ == "__main__":
    asyncio.run(create_test_exam())
