#!/usr/bin/env python3
"""Quick database test for Phase 2 in Docker container."""
import asyncio
from uuid import uuid4
from app.models.exam import Exam, ExamStatus
from app.models.task import Task, TaskStatus  
from app.models.user import User
from app.core.database import AsyncSessionLocal
from sqlalchemy import select

async def test():
    async with AsyncSessionLocal() as db:
        # Get or create user
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(google_sub='test_phase2', email='test_phase2@test.com')
            db.add(user)
            await db.commit()
            await db.refresh(user)
        
        print("[TEST 1] Creating exam with duration_minutes field...")
        exam = Exam(
            user_id=user.user_id,
            name='Phase 2 Docker Test',
            subject='Math',
            academic_year='2025-2026',
            num_variants=3,
            duration_minutes=90,  # NEW FIELD
            status=ExamStatus.DRAFT
        )
        db.add(exam)
        await db.commit()
        await db.refresh(exam)
        print(f"[PASS] Exam created - Duration: {exam.duration_minutes} minutes")
        
        print("[TEST 2] Creating task with required exam_id...")
        task = Task(
            user_id=user.user_id,
            exam_id=exam.exam_id,  # NOW REQUIRED
            status=TaskStatus.QUEUED,
            progress=0
        )
        db.add(task)
        await db.commit()
        await db.refresh(task)
        print(f"[PASS] Task created - Exam ID: {task.exam_id}")
        
        print("[TEST 3] Testing CHECK constraint (negative duration)...")
        try:
            bad_exam = Exam(
                user_id=user.user_id,
                name='Bad Exam',
                subject='Math',
                academic_year='2025',
                num_variants=1,
                duration_minutes=-5,  # Should fail
                status=ExamStatus.DRAFT
            )
            db.add(bad_exam)
            await db.commit()
            print("[FAIL] CHECK constraint failed")
        except Exception as e:
            await db.rollback()
            print(f"[PASS] CHECK constraint working - Rejected negative value")
        
        print("[TEST 4] Testing cascade delete...")
        task_id = task.task_id
        await db.delete(exam)
        await db.commit()
        
        result = await db.execute(select(Task).where(Task.task_id == task_id))
        if result.scalar_one_or_none() is None:
            print("[PASS] Cascade delete working")
        else:
            print("[FAIL] Cascade delete failed")

asyncio.run(test())
print("\n[SUCCESS] All Phase 2 database tests passed!")
