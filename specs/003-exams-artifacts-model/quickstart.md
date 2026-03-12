# Developer Quickstart Guide

**Feature**: 003-exams-artifacts-model  
**Date**: March 12, 2026  
**Purpose**: Fast setup and validation guide for exam/artifact data model implementation

## Prerequisites

- Python 3.11+ installed
- Docker and Docker Compose running
- PostgreSQL 15 container active
- Backend virtual environment activated

---

## 1. Apply Database Migration

### Step 1.1: Generate Migration File

```powershell
# From repository root
cd backend

# Generate new migration with descriptive name
alembic revision --autogenerate -m "add_exams_and_artifacts_tables"
```

**Expected Output**:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.autogenerate.compare] Detected added table 'exams'
INFO  [alembic.autogenerate.compare] Detected added table 'artifacts'
INFO  [alembic.autogenerate.compare] Detected added column 'tasks.exam_id'
  Generating c:\...\backend\alembic\versions\<revision_id>_add_exams_and_artifacts_tables.py ...  done
```

### Step 1.2: Review Generated Migration

Open the new migration file in `backend/alembic/versions/` and verify:

✅ `exams` table created with all columns (exam_id, user_id, name, subject, etc.)  
✅ `artifacts` table created with all columns (artifact_id, exam_id, task_id, artifact_type, etc.)  
✅ `tasks.exam_id` column added (nullable, UUID type)  
✅ All foreign keys defined with CASCADE delete  
✅ All indexes created (see [data-model.md](data-model.md) for index list)

### Step 1.3: Apply Migration

```powershell
# Apply migration to database
alembic upgrade head
```

**Expected Output**:
```
INFO  [alembic.runtime.migration] Running upgrade <prev_revision> -> <new_revision>, add_exams_and_artifacts_tables
```

### Step 1.4: Verify Tables Exist

```powershell
# Connect to PostgreSQL container
docker exec -it siromixv2-postgres-1 psql -U siromix -d siromix_db

# List all tables
\dt

# Expected output includes:
#   exams
#   artifacts
#   tasks (with exam_id column)
#   users
#   task_logs

# Describe exams table
\d exams

# Exit psql
\q
```

---

## 2. Create Test Data

### Step 2.1: Create Test Exam

Create a test script `backend/scripts/create_test_exam.py`:

```python
import asyncio
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_engine, AsyncSessionLocal
from app.models.exam import Exam
from app.models.user import User

async def create_test_exam():
    """Create a test exam for development."""
    async with AsyncSessionLocal() as db:
        # Get or create test user
        from sqlalchemy import select
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
```

**Run the script**:
```powershell
cd backend
python scripts/create_test_exam.py
```

### Step 2.2: Create Test Artifact

Create a test script `backend/scripts/create_test_artifact.py`:

```python
import asyncio
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_engine, AsyncSessionLocal
from app.models.artifact import Artifact
from app.models.exam import Exam
from sqlalchemy import select

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
```

**Run the script**:
```powershell
cd backend
python scripts/create_test_artifact.py
```

---

## 3. Query Relationships

### Step 3.1: Test Exam → Artifacts Relationship

Create `backend/scripts/test_relationships.py`:

```python
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import AsyncSessionLocal
from app.models.exam import Exam
from app.models.artifact import Artifact

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
        
        for artifact in exam.artifacts:
            print(f"      - {artifact.file_name} ({artifact.artifact_type})")

async def test_user_exams():
    """Test loading user with exams."""
    from app.models.user import User
    
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
        
        for exam in user.exams:
            print(f"      - {exam.name} [{exam.status}]")

async def main():
    await test_exam_artifacts()
    print()
    await test_user_exams()

if __name__ == "__main__":
    asyncio.run(main())
```

**Run the script**:
```powershell
cd backend
python scripts/test_relationships.py
```

**Expected Output**:
```
📋 Exam: Mathematics Final Exam 2026
   Status: draft
   Artifacts (1):
      - question-1.png (question_preview)

👤 User: Test User (test@example.com)
   Exams (1):
      - Mathematics Final Exam 2026 [draft]
```

---

## 4. Run Model Tests

### Step 4.1: Create Unit Tests

Ensure tests exist for:
- `tests/unit/models/test_exam.py` - Exam model validations
- `tests/unit/models/test_artifact.py` - Artifact model validations
- `tests/unit/schemas/test_exam_schema.py` - Pydantic schema validations
- `tests/unit/schemas/test_artifact_schema.py` - Pydantic schema validations

### Step 4.2: Run Tests

```powershell
cd backend

# Run all model tests
pytest tests/unit/models/ -v

# Run specific exam tests
pytest tests/unit/models/test_exam.py -v

# Run with coverage
pytest tests/unit/models/ --cov=app.models --cov-report=term-missing
```

**Expected Output**:
```
tests/unit/models/test_exam.py::test_exam_creation PASSED
tests/unit/models/test_exam.py::test_exam_status_enum PASSED
tests/unit/models/test_exam.py::test_exam_relationships PASSED
tests/unit/models/test_artifact.py::test_artifact_creation PASSED
tests/unit/models/test_artifact.py::test_artifact_type_enum PASSED
======================== 8 passed in 0.45s =========================
```

---

## 5. Test Cascade Deletes

### Step 5.1: Test Exam Deletion Cascades

Create `backend/scripts/test_cascade_delete.py`:

```python
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.exam import Exam
from app.models.artifact import Artifact
from app.models.task import Task

async def test_exam_cascade_delete():
    """Test that deleting exam cascades to artifacts and tasks."""
    async with AsyncSessionLocal() as db:
        # Get exam with artifacts
        result = await db.execute(select(Exam).limit(1))
        exam = result.scalar_one_or_none()
        
        if not exam:
            print("❌ No exams found")
            return
        
        exam_id = exam.exam_id
        
        # Count related entities before delete
        artifacts_before = await db.scalar(
            select(func.count()).where(Artifact.exam_id == exam_id)
        )
        tasks_before = await db.scalar(
            select(func.count()).where(Task.exam_id == exam_id)
        )
        
        print(f"📋 Exam: {exam.name}")
        print(f"   Artifacts before delete: {artifacts_before}")
        print(f"   Tasks before delete: {tasks_before}")
        
        # Delete exam
        await db.delete(exam)
        await db.commit()
        
        # Verify cascaded deletion
        artifacts_after = await db.scalar(
            select(func.count()).where(Artifact.exam_id == exam_id)
        )
        tasks_after = await db.scalar(
            select(func.count()).where(Task.exam_id == exam_id)
        )
        
        print(f"   Artifacts after delete: {artifacts_after}")
        print(f"   Tasks after delete: {tasks_after}")
        
        if artifacts_after == 0 and tasks_after == 0:
            print("✅ Cascade delete successful!")
        else:
            print("❌ Cascade delete failed!")

if __name__ == "__main__":
    asyncio.run(test_exam_cascade_delete())
```

**Run the test**:
```powershell
cd backend
python scripts/test_cascade_delete.py
```

---

## 6. Common Debugging Scenarios

### Scenario 1: Migration Fails with FK Constraint Error

**Symptom**:
```
sqlalchemy.exc.IntegrityError: (psycopg2.errors.ForeignKeyViolation) 
insert or update on table "artifacts" violates foreign key constraint "fk_artifacts_exam_id"
```

**Solution**:
```powershell
# Check if exam_id exists in exams table
docker exec -it siromixv2-postgres-1 psql -U siromix -d siromix_db

SELECT exam_id FROM exams WHERE exam_id = '<your_exam_id>';

# If not found, create exam first before artifact
```

### Scenario 2: Enum Value Validation Error

**Symptom**:
```python
pydantic.ValidationError: 1 validation error for ExamCreate
status
  Input should be 'draft', 'processing' or 'completed'
```

**Solution**:
Ensure status values match enum exactly (case-sensitive):
```python
# ❌ Wrong
exam_data = {"status": "DRAFT"}  

# ✅ Correct
exam_data = {"status": "draft"}
```

### Scenario 3: Relationship Not Loading

**Symptom**:
```python
exam.artifacts  # Returns empty list when data exists
```

**Solution**:
Use eager loading with `selectinload()`:
```python
# ❌ Lazy loading (default)
exam = await db.get(Exam, exam_id)

# ✅ Eager loading
result = await db.execute(
    select(Exam)
    .options(selectinload(Exam.artifacts))
    .where(Exam.exam_id == exam_id)
)
exam = result.scalar_one()
```

### Scenario 4: Path Validation Error

**Symptom**:
```
pydantic.ValidationError: file_path must start with 'exams/'
```

**Solution**:
Always use the path format: `exams/<user_id>/<exam-name-kebab>/<filename>`
```python
# ❌ Wrong
file_path = "uploads/test.pdf"

# ✅ Correct
file_path = "exams/550e8400-e29b-41d4-a716-446655440000/math-final/test.pdf"
```

---

## 7. Performance Validation

### Step 7.1: Create Large Dataset

Create `backend/scripts/seed_large_dataset.py`:

```python
import asyncio
from uuid import uuid4
from app.core.database import AsyncSessionLocal
from app.models.exam import Exam
from app.models.artifact import Artifact
from app.models.user import User

async def seed_large_dataset():
    """Seed database with 10K exams and 50K artifacts."""
    async with AsyncSessionLocal() as db:
        # Create test user
        user = User(
            user_id=uuid4(),
            google_sub=f"perf_test_{uuid4()}",
            email="perf@example.com",
            display_name="Performance Test User"
        )
        db.add(user)
        await db.commit()
        
        # Create 10K exams
        print("Creating 10,000 exams...")
        for i in range(10000):
            exam = Exam(
                exam_id=uuid4(),
                user_id=user.user_id,
                name=f"Exam {i}",
                subject="Performance Test",
                academic_year="2026",
                num_variants=5,
                status="draft"
            )
            db.add(exam)
            
            # Create 5 artifacts per exam (50K total)
            for j in range(5):
                artifact = Artifact(
                    exam_id=exam.exam_id,
                    artifact_type="question_preview",
                    file_name=f"q{j}.png",
                    file_path=f"exams/{user.user_id}/exam-{i}/q{j}.png",
                    mime_type="image/png"
                )
                db.add(artifact)
            
            if i % 1000 == 0:
                await db.commit()
                print(f"  {i} exams created...")
        
        await db.commit()
        print("✅ Seed complete!")

if __name__ == "__main__":
    asyncio.run(seed_large_dataset())
```

### Step 7.2: Test Query Performance

```powershell
cd backend
python -m timeit -s "import asyncio; from scripts.test_relationships import test_exam_artifacts" "asyncio.run(test_exam_artifacts())"
```

**Expected Performance** (per Success Criterion SC-009):
- Lookup by exam_id: < 10ms
- Filter by user_id + status: < 50ms
- List artifacts by exam_id: < 20ms

---

## 8. Integration Test Checklist

Before marking feature complete, verify:

- [ ] Migration applies cleanly (`alembic upgrade head`)
- [ ] Can create exam with all required fields
- [ ] Can create artifact linked to exam
- [ ] Can query exam.artifacts relationship
- [ ] Can query user.exams relationship
- [ ] Deleting exam cascades to artifacts
- [ ] Deleting exam sets tasks.exam_id to NULL
- [ ] Pydantic validation rejects invalid data
- [ ] All indexes created (check with `\di` in psql)
- [ ] Performance meets SC-009 (<10ms for 10K exams)

---

## Next Steps

After validating the data model:

1. **Run `/speckit.tasks`** to generate `tasks.md` with implementation task breakdown
2. **Run `/speckit.implement`** to execute implementation tasks
3. **Create API endpoints** in `backend/app/api/endpoints/exams.py` and `artifacts.py`
4. **Write integration tests** in `backend/tests/integration/`
5. **Update frontend** to consume new exam/artifact endpoints

---

## References

- [Data Model Specification](data-model.md) - Full schema details
- [Exam Schema Contract](contracts/exam-schema.md) - Pydantic validation rules
- [Artifact Schema Contract](contracts/artifact-schema.md) - Artifact validation rules
- [Research Decisions](research.md) - Technical rationale for design choices
- [Feature Specification](spec.md) - Complete functional requirements
