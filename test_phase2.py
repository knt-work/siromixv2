#!/usr/bin/env python3
"""
Phase 2 Foundational Testing Script
Tests all Phase 2 components without requiring OAuth/API endpoints
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

async def test_database_connection():
    """Test T017: Database connection setup"""
    print("\n=== Testing Database Connection ===")
    try:
        from app.core.database import engine, AsyncSessionLocal
        from sqlalchemy import text
        
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            assert result.scalar() == 1
        
        print("✓ Database connection successful")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False


async def test_models():
    """Test T009-T012: Database models"""
    print("\n=== Testing Database Models ===")
    try:
        from app.models import User, Task, TaskLog
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import select
        import uuid
        
        async with AsyncSessionLocal() as session:
            # Test User model (T010)
            test_user = User(
                google_sub=f"test_{uuid.uuid4().hex[:8]}",
                email="test@example.com",
                display_name="Test User"
            )
            session.add(test_user)
            await session.commit()
            await session.refresh(test_user)
            print(f"✓ User model works (ID: {test_user.user_id})")
            
            # Test Task model (T011)
            test_task = Task(
                user_id=test_user.user_id,
                status="queued",
                current_stage=None,
                progress=0,
                retry_count_by_stage={}
            )
            session.add(test_task)
            await session.commit()
            await session.refresh(test_task)
            print(f"✓ Task model works (ID: {test_task.task_id})")
            
            # Test TaskLog model (T012)
            test_log = TaskLog(
                task_id=test_task.task_id,
                stage="test",
                level="info",
                message="Test log entry",
                data_json={"test": True}
            )
            session.add(test_log)
            await session.commit()
            await session.refresh(test_log)
            print(f"✓ TaskLog model works (ID: {test_log.log_id})")
            
            # Cleanup
            await session.delete(test_log)
            await session.delete(test_task)
            await session.delete(test_user)
            await session.commit()
            print("✓ Cleanup successful")
            
        return True
    except Exception as e:
        print(f"✗ Model testing failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_schemas():
    """Test T014-T016: Pydantic schemas"""
    print("\n=== Testing Pydantic Schemas ===")
    try:
        from app.schemas.user import UserCreate, UserResponse
        from app.schemas.task import TaskCreate, TaskResponse, TaskStatus, TaskStage
        from app.schemas.task_log import TaskLogResponse, LogLevel
        from datetime import datetime
        import uuid
        
        # Test User schemas (T014)
        user_create = UserCreate(
            google_sub="test123",
            email="test@example.com",
            display_name="Test User"
        )
        print(f"✓ UserCreate schema validates")
        
        user_response = UserResponse(
            user_id=uuid.uuid4(),
            google_sub="test123",
            email="test@example.com",
            display_name="Test User",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        print(f"✓ UserResponse schema validates")
        
        # Test Task schemas (T015)
        task_id = uuid.uuid4()
        task_create = TaskCreate(simulate_failure_stage=None)
        print(f"✓ TaskCreate schema validates")
        
        task_response = TaskResponse(
            task_id=task_id,
            user_id=uuid.uuid4(),
            status=TaskStatus.QUEUED,
            current_stage=None,
            progress=0,
            retry_count_by_stage={},
            error=None,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            logs=[]
        )
        print(f"✓ TaskResponse schema validates")
        print(f"✓ TaskStatus enum works: {[e.value for e in TaskStatus]}")
        print(f"✓ TaskStage enum works: {[e.value for e in TaskStage]}")
        
        # Test TaskLog schemas (T016)
        log_response = TaskLogResponse(
            log_id=1,
            task_id=task_id,
            stage="extract_docx",
            level=LogLevel.INFO,
            message="Test message",
            data_json={"key": "value"},
            timestamp=datetime.now()
        )
        print(f"✓ TaskLogResponse schema validates")
        print(f"✓ LogLevel enum works: {[e.value for e in LogLevel]}")
        
        return True
    except Exception as e:
        print(f"✗ Schema testing failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_redis_connection():
    """Test T021: Redis connection"""
    print("\n=== Testing Redis Connection ===")
    try:
        from app.core.redis import REDIS_URL
        import redis.asyncio as redis
        
        r = await redis.from_url(REDIS_URL, decode_responses=True)
        
        # Test connection
        await r.ping()
        print("✓ Redis connection successful")
        
        # Test basic operations
        await r.set("test_key", "test_value")
        value = await r.get("test_key")
        assert value == "test_value"
        await r.delete("test_key")
        print("✓ Redis basic operations work")
        
        await r.aclose()
        return True
    except Exception as e:
        print(f"✗ Redis connection failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_celery_config():
    """Test T022: Celery app configuration"""
    print("\n=== Testing Celery Configuration ===")
    try:
        from app.tasks.celery_app import celery_app
        
        # Check broker URL is configured
        assert celery_app.conf.broker_url, "Broker URL not configured"
        print(f"✓ Celery broker configured: {celery_app.conf.broker_url}")
        
        # Check result backend is configured
        assert celery_app.conf.result_backend, "Result backend not configured"
        print(f"✓ Celery result backend configured: {celery_app.conf.result_backend}")
        
        # Check task is registered (skip - process_task is US2, not Phase 2)
        print("✓ Celery app configured correctly (process_task is part of US2, not Phase 2)")
        
        return True
    except Exception as e:
        print(f"✗ Celery configuration failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_fastapi_app():
    """Test T020: FastAPI app structure"""
    print("\n=== Testing FastAPI App ===")
    try:
        from app.main import app
        
        # Check app exists
        assert app is not None
        print("✓ FastAPI app created")
        
        # Check routes exist
        routes = [route.path for route in app.routes]
        print(f"✓ Routes registered: {len(routes)} routes")
        
        # Check CORS is configured
        for middleware in app.user_middleware:
            if 'CORSMiddleware' in str(middleware):
                print("✓ CORS middleware configured")
                break
        
        return True
    except Exception as e:
        print(f"✗ FastAPI app testing failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_auth_utilities():
    """Test T018: Auth utilities (basic import check)"""
    print("\n=== Testing Auth Utilities ===")
    try:
        from app.core.auth import verify_google_token
        
        print("✓ verify_google_token function imported")
        print("  (Note: Full testing requires valid Google token)")
        
        return True
    except Exception as e:
        print(f"✗ Auth utilities testing failed: {e}")
        return False


async def test_dependencies():
    """Test T019: FastAPI dependencies"""
    print("\n=== Testing FastAPI Dependencies ===")
    try:
        from app.core.deps import get_current_user
        
        print("✓ get_current_user dependency imported")
        print("  (Note: Full testing requires valid token)")
        
        return True
    except Exception as e:
        print(f"✗ Dependencies testing failed: {e}")
        return False


async def main():
    """Run all Phase 2 tests"""
    print("=" * 60)
    print("PHASE 2 FOUNDATIONAL TESTING")
    print("=" * 60)
    
    results = {}
    
    # Run tests
    results['Database Connection'] = await test_database_connection()
    results['Database Models'] = await test_models()
    results['Pydantic Schemas'] = await test_schemas()
    results['Redis Connection'] = await test_redis_connection()
    results['Celery Configuration'] = await test_celery_config()
    results['FastAPI App'] = await test_fastapi_app()
    results['Auth Utilities'] = await test_auth_utilities()
    results['FastAPI Dependencies'] = await test_dependencies()
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status:8} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All Phase 2 foundational tests PASSED!")
        print("✓ Ready to proceed with User Story 1 (OAuth)")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        print("Fix issues before proceeding to User Story 1")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
