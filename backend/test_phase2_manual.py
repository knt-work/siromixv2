"""
Manual test for Phase 2: Database Migrations & Schemas

Tests:
1. Pydantic schema validation with new fields
2. Database operations (create exam with duration_minutes)
3. Storage client configuration
4. Task creation with required exam_id
"""

import asyncio
import sys
import os
from uuid import uuid4

# Add app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

from app.schemas.exam import ExamCreate, ExamResponse, ExamUpdate
from app.schemas.task import TaskCreate
from app.core.database import AsyncSessionLocal
from app.models.exam import Exam, ExamStatus
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.core.storage import StorageClient
from app.core.config import settings
from sqlalchemy import select


async def test_pydantic_schemas():
    """Test 1: Pydantic schema validation with duration_minutes."""
    print("\n" + "="*60)
    print("TEST 1: Pydantic Schema Validation")
    print("="*60)
    
    # Test ExamCreate with duration_minutes
    try:
        exam_data = ExamCreate(
            name="Test Exam for Phase 2",
            subject="Mathematics",
            academic_year="2025-2026",
            grade_level="Grade 10",
            num_variants=3,
            duration_minutes=90,  # NEW FIELD
            instructions="Test instructions"
        )
        print("[PASS] ExamCreate validation PASSED")
        print(f"   - Name: {exam_data.name}")
        print(f"   - Duration: {exam_data.duration_minutes} minutes")
        print(f"   - Variants: {exam_data.num_variants}")
    except Exception as e:
        print(f"[FAIL] ExamCreate validation FAILED: {e}")
        return False
    
    # Test duration_minutes validation (must be > 0)
    try:
        invalid_exam = ExamCreate(
            name="Invalid Exam",
            subject="Math",
            academic_year="2025",
            num_variants=1,
            duration_minutes=-5  # Invalid: negative
        )
        print("[FAIL] Validation FAILED: Accepted negative duration_minutes")
        return False
    except Exception as e:
        print(f"[PASS] Negative duration_minutes rejected: {type(e).__name__}")
    
    # Test TaskCreate with exam_id
    try:
        test_exam_id = uuid4()
        task_data = TaskCreate(
            exam_id=test_exam_id  # NEW REQUIRED FIELD
        )
        print("[PASS] TaskCreate validation PASSED")
        print(f"   - Exam ID: {task_data.exam_id}")
    except Exception as e:
        print(f"[FAIL] TaskCreate validation FAILED: {e}")
        return False
    
    # Test ExamUpdate with optional duration_minutes
    try:
        update_data = ExamUpdate(
            duration_minutes=120
        )
        print("[PASS] ExamUpdate validation PASSED")
        print(f"   - Updated duration: {update_data.duration_minutes} minutes")
    except Exception as e:
        print(f"[FAIL] ExamUpdate validation FAILED: {e}")
        return False
    
    return True


async def test_database_operations():
    """Test 2: Database operations with new schema."""
    print("\n" + "="*60)
    print("TEST 2: Database Operations")
    print("="*60)
    
    async with AsyncSessionLocal() as db:
        try:
            # Get or create test user
            result = await db.execute(
                select(User).where(User.email == "test_phase2@example.com")
            )
            user = result.scalar_one_or_none()
            
            if not user:
                user = User(
                    google_sub="test_phase2_sub",
                    email="test_phase2@example.com",
                    display_name="Phase 2 Test User"
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
                print(f"[PASS] Created test user: {user.email}")
            else:
                print(f"[PASS] Using existing test user: {user.email}")
            
            # Create exam with duration_minutes
            exam = Exam(
                user_id=user.user_id,
                name="Phase 2 Test Exam",
                subject="Mathematics",
                academic_year="2025-2026",
                grade_level="Grade 10",
                num_variants=3,
                duration_minutes=90,  # NEW FIELD
                instructions="Manual test for Phase 2",
                status=ExamStatus.DRAFT
            )
            db.add(exam)
            await db.commit()
            await db.refresh(exam)
            print(f"[PASS] Created exam with duration_minutes")
            print(f"   - Exam ID: {exam.exam_id}")
            print(f"   - Duration: {exam.duration_minutes} minutes")
            print(f"   - Status: {exam.status}")
            
            # Create task with required exam_id
            task = Task(
                user_id=user.user_id,
                exam_id=exam.exam_id,  # NOW REQUIRED
                status=TaskStatus.QUEUED,
                progress=0
            )
            db.add(task)
            await db.commit()
            await db.refresh(task)
            print(f"[PASS] Created task with required exam_id")
            print(f"   - Task ID: {task.task_id}")
            print(f"   - Exam ID: {task.exam_id}")
            print(f"   - Status: {task.status}")
            
            # Verify CHECK constraint on duration_minutes
            try:
                invalid_exam = Exam(
                    user_id=user.user_id,
                    name="Invalid Exam",
                    subject="Math",
                    academic_year="2025",
                    num_variants=1,
                    duration_minutes=-10,  # Should fail CHECK constraint
                    status=ExamStatus.DRAFT
                )
                db.add(invalid_exam)
                await db.commit()
                print(f"[FAIL] CHECK constraint FAILED: Accepted negative duration")
                return False
            except Exception as e:
                await db.rollback()
                print(f"[PASS] CHECK constraint working: Rejected negative duration")
                print(f"   - Error: {type(e).__name__}")
            
            # Test cascade delete (exam deletion should delete task)
            exam_id_to_delete = exam.exam_id
            task_id_to_delete = task.task_id
            
            await db.delete(exam)
            await db.commit()
            print(f"[PASS] Deleted exam (testing cascade)")
            
            # Verify task was cascade deleted
            result = await db.execute(
                select(Task).where(Task.task_id == task_id_to_delete)
            )
            deleted_task = result.scalar_one_or_none()
            
            if deleted_task is None:
                print(f"[PASS] Cascade delete working: Task auto-deleted with exam")
            else:
                print(f"[FAIL] Cascade delete FAILED: Task still exists")
                return False
            
            return True
            
        except Exception as e:
            await db.rollback()
            print(f"[FAIL] Database operations FAILED: {e}")
            import traceback
            traceback.print_exc()
            return False


def test_storage_configuration():
    """Test 3: Storage client and configuration."""
    print("\n" + "="*60)
    print("TEST 3: Storage Configuration")
    print("="*60)
    
    try:
        # Test settings loading
        print(f"[PASS] Settings loaded:")
        print(f"   - Storage bucket: {settings.storage.BUCKET_NAME}")
        print(f"   - Storage endpoint: {settings.storage.ENDPOINT_URL}")
        print(f"   - Storage region: {settings.storage.REGION}")
        print(f"   - Storage configured: {settings.storage.is_configured()}")
        
        # Test StorageClient initialization
        storage_client = StorageClient()
        print(f"[PASS] StorageClient initialized")
        print(f"   - Bucket: {storage_client.bucket_name}")
        print(f"   - S3 client: {type(storage_client.s3_client).__name__}")
        
        return True
    except Exception as e:
        print(f"[FAIL] Storage configuration FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all Phase 2 manual tests."""
    print("\n" + "#"*60)
    print("# PHASE 2 MANUAL TEST SUITE")
    print("# Testing: Database Migrations & Schemas")
    print("#"*60)
    
    results = {
        "Pydantic Schemas": await test_pydantic_schemas(),
        "Database Operations": await test_database_operations(),
        "Storage Configuration": test_storage_configuration(),
    }
    
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    all_passed = True
    for test_name, passed in results.items():
        status = "[PASS] PASS" if passed else "[FAIL] FAIL"
        print(f"{status} - {test_name}")
        if not passed:
            all_passed = False
    
    print("="*60)
    
    if all_passed:
        print("\n[SUCCESS] ALL TESTS PASSED - Phase 2 implementation verified!")
        print("[PASS] Ready to proceed with Phase 3: User Story 1 implementation")
        return 0
    else:
        print("\n[WARNING]  SOME TESTS FAILED - Review errors above")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

