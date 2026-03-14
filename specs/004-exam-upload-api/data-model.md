# Data Model - Feature 004: File Upload & Exam Creation API

## Overview

This feature extends the existing Exam and Task models from Feature 003 to support exam file uploads with duration tracking and mandatory exam-task association.

## Database Schema Changes

### Exam Model Extensions

**Table**: `exams`  
**Changes**: Add `duration_minutes` field

```python
# New field to add to app/models/exam.py
duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)

# Add constraint
__table_args__ = (
    CheckConstraint("num_variants > 0", name="check_num_variants_positive"),
    CheckConstraint("duration_minutes > 0", name="check_duration_minutes_positive"),  # NEW
)
```

**Migration**: Alembic migration required
- Migration type: Schema modification
- Backward compatibility: Breaking (requires default value or data migration for existing records)
- Migration script: Add column with NOT NULL constraint + CHECK constraint

**Rationale**: Duration is essential exam metadata in Vietnamese educational context (from clarification #1). Must be stored at database level for reporting and UI display.

### Task Model Modifications

**Table**: `tasks`  
**Changes**: Make `exam_id` non-nullable (change from optional to required)

**Current State**:
```python
exam_id: Mapped[uuid.UUID | None] = mapped_column(
    ForeignKey("exams.exam_id", ondelete="CASCADE"),
    nullable=True,  # <-- Currently optional
    index=True
)
```

**Target State**:
```python
exam_id: Mapped[uuid.UUID] = mapped_column(
    ForeignKey("exams.exam_id", ondelete="CASCADE"),
    nullable=False,  # <-- Made required
    index=True
)
```

**Migration**: Alembic migration required
- Migration type: Schema modification (NOT NULL constraint)
- Backward compatibility: Breaking (existing tasks with NULL exam_id must be handled)
- Data migration: Assign existing NULL exam_id tasks to a placeholder exam OR delete them
- Migration script: Update nullable=False, add NOT NULL constraint

**Rationale**: From clarification #5 - all tasks in this feature are exam-specific. Making exam_id required enforces data integrity and simplifies task querying.

## Pydantic Schema Changes

### ExamCreate Schema

**File**: `backend/app/schemas/exam.py`

```python
class ExamCreate(BaseModel):
    name: str = Field(..., max_length=500)
    subject: str = Field(..., max_length=500)
    academic_year: str = Field(..., max_length=50)
    grade_level: str | None = Field(None, max_length=100)
    duration_minutes: int = Field(..., gt=0)  # NEW - must be positive integer
    num_variants: int = Field(..., gt=0)
    instructions: str | None = None
```

**Changes**:
- Add `duration_minutes: int` field with validation `gt=0`

### TaskCreate Schema

**File**: `backend/app/schemas/task.py`

```python
class TaskCreate(BaseModel):
    exam_id: uuid.UUID  # NEW - explicitly require exam_id
    # Other fields can be defaulted (status, current_stage, progress)
```

**Changes**:
- Add `exam_id: uuid.UUID` field to make exam association explicit at API level

## Entity Relationships

```
User (1) ----< (N) Exam
User (1) ----< (N) Task
Exam (1) ----< (N) Task     [exam_id now REQUIRED in Task]
Exam (1) ----< (N) Artifact
```

**Cascade Behavior** (unchanged):
- Delete User → Cascade delete Exams, Tasks, Artifacts
- Delete Exam → Cascade delete Tasks, Artifacts

## File Storage Structure

**Storage Type**: Object storage (S3/MinIO via boto3)

**Path Pattern**:
```
exams/{user_id}/{exam-name-kebab}/original.docx
```

**Example**:
- User ID: `123e4567-e89b-12d3-a456-426614174000`
- Exam Name: `Kiểm tra giữa kì - Toán`
- Storage Path: `exams/123e4567-e89b-12d3-a456-426614174000/kiem-tra-giua-ki-toan/original.docx`

**Path Generation**: Uses `app.core.artifact_paths.generate_storage_path()` utility from Feature 003

**Bucket Configuration**:
- Bucket name: `STORAGE_BUCKET_NAME` environment variable
- Endpoint: `STORAGE_ENDPOINT_URL` environment variable (supports S3 and MinIO)
- Access: `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`

**File Metadata** (stored in database Artifact table):
- `artifact_id`: UUID
- `exam_id`: Foreign key to exam
- `file_type`: "original_docx"
- `file_path`: Full storage path
- `file_size`: Bytes
- `upload_date`: Timestamp

## Validation Rules

### Exam Metadata Validation

| Field | Type | Required | Constraints | Error Message |
|-------|------|----------|-------------|---------------|
| name | string | Yes | 1-500 chars | "Field 'name' exceeds maximum length of 500 characters" |
| subject | string | Yes | 1-500 chars | "Field 'subject' exceeds maximum length of 500 characters" |
| academic_year | string | Yes | 1-50 chars | "Field 'academic_year' exceeds maximum length of 50 characters" |
| grade_level | string | No | 0-100 chars | "Field 'grade_level' exceeds maximum length of 100 characters" |
| duration_minutes | integer | Yes | > 0 | "Field 'duration_minutes' must be a positive integer" |
| num_variants | integer | Yes | > 0 | "Field 'num_variants' must be a positive integer" |
| instructions | string | No | No limit (TEXT) | N/A |

### File Upload Validation

| Check | Rule | Error Message |
|-------|------|---------------|
| Format | Must be DOCX (check MIME type and extension) | "Invalid file format. Only DOCX files are accepted" |
| Size | ≤ 50MB | "File size exceeds maximum allowed limit of 50 MB" |
| Corruption | DOCX must be valid ZIP archive | "File is corrupted or not a valid DOCX document" |
| Presence | File must be included in request | "Required file upload missing" |

## State Transitions

### Exam Status Flow
```
[draft] ---> [processing] ---> [completed]
```

- **draft**: Initial status after creation (this feature creates exams in draft status)
- **processing**: Set when task starts execution (handled by Celery worker)
- **completed**: Set when task completes successfully (handled by Celery worker)

**This feature only creates exams in `draft` status**. Transitions to `processing` and `completed` are handled by the task processing pipeline.

### Task Status Flow
```
[queued] ---> [running] ---> [completed]
                   |
                   +--------> [failed]
```

- **queued**: Initial status after creation (this feature creates tasks in queued status)
- **running**: Set when Celery worker picks up task
- **completed**: Set when all pipeline stages finish successfully
- **failed**: Set when any stage encounters unrecoverable error

**This feature only creates tasks in `queued` status**. Status transitions are handled by Celery workers.

## Transaction Boundaries

**Atomicity Requirements**: All operations must succeed or all must fail (no partial state)

**Transaction Sequence**:
1. **Upload file to storage** (first, outside transaction)
   - Reason: File operations are not transactional
   - Rollback: Delete file if subsequent operations fail
2. **Begin DB transaction**
3. **Create Exam record** (status=draft, includes duration_minutes)
4. **Create Artifact record** (references uploaded file)
5. **Create Task record** (status=queued, exam_id=exam.exam_id)
6. **Commit transaction**
7. **Enqueue Celery task** (via `.delay()` after commit)

**Rollback Strategy**:
- If file upload fails → Return 503, no DB changes
- If DB operations fail → Delete uploaded file, return 500
- If Celery enqueue fails → Log error, return 500 (task can be manually requeued)

## Indexes

**Existing indexes** (from Feature 003):
- `exams.exam_id` (primary key)
- `exams.user_id` (foreign key)
- `exams.status` (for filtering)
- `exams.created_at` (for sorting)
- `tasks.task_id` (primary key)
- `tasks.user_id` (foreign key)
- `tasks.exam_id` (foreign key - already indexed)
- `tasks.status` (for queue queries)

**No new indexes required** for this feature.

## Data Migration Notes

### Adding duration_minutes to Exam

**Options**:
1. **Add with default value** (e.g., 60 minutes) for existing records
2. **Require explicit migration** (fail if existing records exist)

**Recommendation**: Option 1 - add default value of 60 minutes for existing records, then remove default to enforce explicit setting for new records.

**Migration Script Approach**:
```sql
-- Step 1: Add column as nullable
ALTER TABLE exams ADD COLUMN duration_minutes INTEGER;

-- Step 2: Set default for existing records
UPDATE exams SET duration_minutes = 60 WHERE duration_minutes IS NULL;

-- Step 3: Add NOT NULL constraint
ALTER TABLE exams ALTER COLUMN duration_minutes SET NOT NULL;

-- Step 4: Add CHECK constraint
ALTER TABLE exams ADD CONSTRAINT check_duration_minutes_positive CHECK (duration_minutes > 0);
```

### Making exam_id non-nullable in Task

**Options**:
1. **Delete tasks with NULL exam_id** (acceptable for MVP with no production data)
2. **Create placeholder exam** and assign orphaned tasks
3. **Fail migration** if orphaned tasks exist (require manual intervention)

**Recommendation**: Option 1 for MVP (no production data). For future: Option 3 (fail with clear instructions).

**Migration Script Approach**:
```sql
-- Step 1: Check for orphaned tasks
SELECT COUNT(*) FROM tasks WHERE exam_id IS NULL;

-- Step 2: Delete orphaned tasks (MVP only)
DELETE FROM tasks WHERE exam_id IS NULL;

-- Step 3: Add NOT NULL constraint
ALTER TABLE tasks ALTER COLUMN exam_id SET NOT NULL;
```

## Summary

**Schema Changes**: 2
- Exam: Add `duration_minutes` (INTEGER, NOT NULL, CHECK > 0)
- Task: Change `exam_id` from nullable to non-nullable

**Pydantic Changes**: 2
- ExamCreate: Add `duration_minutes` field
- TaskCreate: Add `exam_id` field

**Migrations Required**: 2 Alembic migrations
- Migration 1: Add Exam.duration_minutes with constraints
- Migration 2: Make Task.exam_id non-nullable

**Storage Integration**: Object storage (S3/MinIO) with structured path pattern using artifact_paths utilities

**Validation**: 11 validation rules enforced at Pydantic layer + file format/size checks

**Transaction Scope**: File upload → DB transaction (Exam + Artifact + Task) → Celery enqueue
