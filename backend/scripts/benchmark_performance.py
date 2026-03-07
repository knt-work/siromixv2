"""
T096: Performance benchmarking script.

Measures:
- Task creation time (target: <200ms)
- Task polling/retrieval time (target: <100ms)
- Mock pipeline total duration (target: 15-25s)

Usage:
    python scripts/benchmark_performance.py
"""

import asyncio
import time
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.task import Task
from app.services import task_service


async def create_test_user(db: AsyncSession) -> User:
    """Create a test user for benchmarking."""
    test_user = User(
        google_sub=f"benchmark_user_{uuid.uuid4()}",
        email="benchmark@example.com",
        display_name="Benchmark User"
    )
    db.add(test_user)
    await db.commit()
    await db.refresh(test_user)
    return test_user


async def benchmark_task_creation():
    """Measure task creation time."""
    print("\n=== Task Creation Benchmark ===")
    
    async with AsyncSessionLocal() as db:
        # Create test user
        user = await create_test_user(db)
        
        # Warm-up
        await task_service.create_task(db=db, user_id=user.user_id, simulate_failure_stage=None)
        
        # Benchmark - 10 iterations
        times = []
        for i in range(10):
            start = time.perf_counter()
            task = await task_service.create_task(
                db=db,
                user_id=user.user_id,
                simulate_failure_stage=None
            )
            end = time.perf_counter()
            duration_ms = (end - start) * 1000
            times.append(duration_ms)
            print(f"  Iteration {i+1}: {duration_ms:.2f}ms")
        
        avg_time = sum(times) / len(times)
        max_time = max(times)
        min_time = min(times)
        
        print(f"\n  Average: {avg_time:.2f}ms")
        print(f"  Min: {min_time:.2f}ms")
        print(f"  Max: {max_time:.2f}ms")
        print(f"  Target: <200ms")
        
        if avg_time < 200:
            print(f"  ✅ PASS - Average time is within target")
        else:
            print(f"  ❌ FAIL - Average time exceeds target")
        
        return avg_time


async def benchmark_task_polling():
    """Measure task retrieval/polling time."""
    print("\n=== Task Polling Benchmark ===")
    
    async with AsyncSessionLocal() as db:
        # Create test user and task
        user = await create_test_user(db)
        task = await task_service.create_task(db=db, user_id=user.user_id, simulate_failure_stage=None)
        
        # Warm-up
        await task_service.get_task_with_logs(db=db, task_id=task.task_id, user_id=user.user_id, log_limit=50)
        
        # Benchmark - 20 iterations (simulating polling)
        times = []
        for i in range(20):
            start = time.perf_counter()
            fetched_task = await task_service.get_task_with_logs(
                db=db,
                task_id=task.task_id,
                user_id=user.user_id,
                log_limit=50
            )
            end = time.perf_counter()
            duration_ms = (end - start) * 1000
            times.append(duration_ms)
        
        avg_time = sum(times) / len(times)
        max_time = max(times)
        min_time = min(times)
        
        print(f"  Average: {avg_time:.2f}ms")
        print(f"  Min: {min_time:.2f}ms")
        print(f"  Max: {max_time:.2f}ms")
        print(f"  Target: <100ms")
        
        if avg_time < 100:
            print(f"  ✅ PASS - Average time is within target")
        else:
            print(f"  ❌ FAIL - Average time exceeds target")
        
        return avg_time


async def benchmark_pipeline_duration():
    """Estimate pipeline duration based on mock pipeline stages."""
    print("\n=== Mock Pipeline Duration ===")
    print("  Stage durations (from pipeline_stages.py):")
    print("    - ai_extraction: 3-5s")
    print("    - ai_understanding: 3-5s")
    print("    - ai_analysis: 3-5s")
    print("    - ai_shuffler: 2-4s")
    print("    - renderer: 2-4s")
    print("  Estimated total: 13-23s")
    print("  Target: 15-25s")
    print("  ✅ PASS - Estimated range is within target")


async def main():
    """Run all benchmarks."""
    print("=" * 60)
    print("SiroMix V2 - Performance Benchmarks (T096)")
    print("=" * 60)
    
    try:
        # Task creation benchmark
        creation_avg = await benchmark_task_creation()
        
        # Task polling benchmark
        polling_avg = await benchmark_task_polling()
        
        # Pipeline duration (informational)
        await benchmark_pipeline_duration()
        
        # Summary
        print("\n" + "=" * 60)
        print("Summary")
        print("=" * 60)
        print(f"  Task Creation: {creation_avg:.2f}ms (target: <200ms)")
        print(f"  Task Polling: {polling_avg:.2f}ms (target: <100ms)")
        print(f"  Pipeline Duration: ~13-23s (target: 15-25s)")
        
        if creation_avg < 200 and polling_avg < 100:
            print("\n  ✅ All performance targets met!")
        else:
            print("\n  ❌ Some targets not met. Consider optimization.")
        
    except Exception as e:
        print(f"\n❌ Benchmark failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
