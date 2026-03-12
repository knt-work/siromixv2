# Data Model: Exams and Artifacts Schema

**Feature**: 003-examsartifacts-model  
**Date**: March 12, 2026  
**Phase**: 1 - Design

## Entity Relationship Diagram

```
┌─────────────────────┐
│      users          │
│─────────────────────│
│ user_id (PK, UUID)  │◄──────────┐
│ google_sub          │           │
│ email               │           │ 1
│ display_name        │           │
│ created_at          │           │
│ updated_at          │           │
└─────────────────────┘           │
                                  │
                                  │
                                  │ *
┌─────────────────────────────────┴─┐
│           exams                    │
│────────────────────────────────────│
│ exam_id (PK, UUID)                 │◄────────┬─────────┐
│ user_id (FK → users)               │         │         │
│ name (VARCHAR 500)                 │         │ 1       │ 1
│ subject (VARCHAR 500)              │         │         │
│ academic_year (VARCHAR 50)         │         │         │
│ grade_level (VARCHAR 100, NULL)    │         │         │
│ num_variants (INTEGER)             │         │         │
│ instructions (TEXT, NULL)          │         │         │
│ status (ENUM: draft|processing|...)│         │         │
│ created_at (TIMESTAMPTZ)           │         │         │
│ updated_at (TIMESTAMPTZ)           │         │         │
└────────────────────────────────────┘         │         │
                                               │         │
                                               │ *       │ *
                    ┌──────────────────────────┴───┐ ┌───┴──────────────────────────────┐
                    │        tasks                 │ │        artifacts                 │
                    │──────────────────────────────│ │──────────────────────────────────│
                    │ task_id (PK, UUID)           │ │ artifact_id (PK, BIGSERIAL)      │
                    │ user_id (FK → users)         │ │ exam_id (FK → exams)             │
                    │ exam_id (FK → exams) [NEW]   │ │ task_id (FK → tasks, NULL)       │
                    │ status (ENUM)                │ │ artifact_type (ENUM)             │
                    │ current_stage (ENUM, NULL)   │ │ file_name (VARCHAR 255)          │
                    │ progress (INTEGER 0-100)     │ │ file_path (VARCHAR 500)          │
                    │ retry_count_by_stage (JSONB) │ │ mime_type (VARCHAR 100)          │
                    │ error (TEXT, NULL)           │ │ created_at (TIMESTAMPTZ)         │
                    │ created_at (TIMESTAMPTZ)     │ └──────────────────────────────────┘
                    │ updated_at (TIMESTAMPTZ)     │
                    └──────────────────┬───────────┘
                                       │
                                       │ 1
                                       │
                                       │ *
                    ┌──────────────────┴───────────┐
                    │       task_logs              │
                    │──────────────────────────────│
                    │ log_id (PK, BIGSERIAL)       │
                    │ task_id (FK → tasks)         │
                    │ stage (VARCHAR 50, NULL)     │
                    │ level (ENUM)                 │
                    │ message (TEXT)               │
                    │ data_json (JSONB, NULL)      │
                    │ timestamp (TIMESTAMPTZ)      │
                    └──────────────────────────────┘

Cascade Delete Rules:
• DELETE user → CASCADE DELETE exams → CASCADE DELETE (tasks, artifacts)
• DELETE exam → CASCADE DELETE (tasks, artifacts)  
• DELETE task → CASCADE DELETE task_logs, CASCADE SET NULL artifacts.task_id (optional FK)
```

---

## Table Specifications

### Table: `exams`

**Purpose**: Store business-level metadata for exam documents submitted through the Create New Exam form.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `exam_id` | UUID | PRIMARY KEY, NOT NULL | uuid4() | Unique exam identifier |
| `user_id` | UUID | FOREIGN KEY → users(user_id) ON DELETE CASCADE, NOT NULL, INDEX | - | Owning user |
| `name` | VARCHAR(500) | NOT NULL | - | Exam title/name |
| `subject` | VARCHAR(500) | NOT NULL | - | Subject area (e.g., "Mathematics", "Physics") |
| `academic_year` | VARCHAR(50) | NOT NULL | - | Academic year (e.g., "2025-2026", "Spring 2026") |
| `grade_level` | VARCHAR(100) | NULL | NULL | Optional grade/class level (e.g., "Grade 10 - Advanced Placement") |
| `num_variants` | INTEGER | NOT NULL, CHECK > 0 | - | Number of exam variants to generate |
| `instructions` | TEXT | NULL | NULL | Optional exam-level instructions |
| `status` | VARCHAR(20) | NOT NULL, CHECK IN ('draft', 'processing', 'completed') | 'draft' | Exam lifecycle status |
| `created_at` | TIMESTAMPTZ | NOT NULL, INDEX | NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | Last update timestamp (auto-updated) |

**Indexes**:
- `ix_exams_exam_id` (PRIMARY KEY, implicit B-tree)
- `ix_exams_user_id` (B-tree, supports queries by user per FR-025)
- `ix_exams_status` (B-tree, supports status filtering)
- `ix_exams_created_at` (B-tree, supports chronological sorting)

**Relationships**:
- `user`: Many-to-One with `users` (exam belongs to one user)
- `tasks`: One-to-Many with `tasks` (exam can have multiple processing tasks)
- `artifacts`: One-to-Many with `artifacts` (exam can have multiple generated outputs)

**Constraints**:
- `CHECK (num_variants > 0)` - At least one variant required
- `CHECK (status IN ('draft', 'processing', 'completed'))` - Valid status values only

**SQLAlchemy Model Signature**:
```python
class ExamStatus(str, enum.Enum):
    DRAFT = "draft"
    PROCESSING = "processing"
    COMPLETED = "completed"

class Exam(Base):
    __tablename__ = "exams"
    
    exam_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    academic_year: Mapped[str] = mapped_column(String(50), nullable=False)
    grade_level: Mapped[str | None] = mapped_column(String(100), nullable=True)
    num_variants: Mapped[int] = mapped_column(Integer, nullable=False)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ExamStatus] = mapped_column(Enum(ExamStatus, native_enum=False), nullable=False, default=ExamStatus.DRAFT, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="exams")
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="exam", cascade="all, delete-orphan")
    artifacts: Mapped[list["Artifact"]] = relationship("Artifact", back_populates="exam", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint("num_variants > 0", name="check_num_variants_positive"),
    )
```

---

### Table: `artifacts`

**Purpose**: Track generated output files and JSON results produced during task pipeline execution.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `artifact_id` | BIGSERIAL | PRIMARY KEY, NOT NULL, AUTO INCREMENT | nextval() | Auto-incrementing artifact identifier |
| `exam_id` | UUID | FOREIGN KEY → exams(exam_id) ON DELETE CASCADE, NOT NULL, INDEX | - | Source exam reference |
| `task_id` | UUID | FOREIGN KEY → tasks(task_id) ON DELETE CASCADE, NULL, INDEX | NULL | Optional producing task reference |
| `artifact_type` | VARCHAR(50) | NOT NULL, CHECK IN (...), INDEX | - | Type of artifact (dij, question_preview, nes, etc.) |
| `file_name` | VARCHAR(255) | NOT NULL | - | Original or generated file name |
| `file_path` | VARCHAR(500) | NOT NULL | - | Relative path from storage root (exams/<user>/<exam-slug>/<file>) |
| `mime_type` | VARCHAR(100) | NOT NULL | - | MIME type (application/json, application/vnd.openxmlformats-officedocument.wordprocessingml.document, etc.) |
| `created_at` | TIMESTAMPTZ | NOT NULL, INDEX | NOW() | Artifact creation timestamp |

**Indexes**:
- `ix_artifacts_artifact_id` (PRIMARY KEY, implicit B-tree)
- `ix_artifacts_exam_id` (B-tree, supports queries by exam per FR-022)
- `ix_artifacts_task_id` (B-tree, supports queries by task per FR-023, handles NULL)
- `ix_artifacts_artifact_type` (B-tree, supports filtering by type)
- `ix_artifacts_exam_id_artifact_type` (Composite B-tree, optimizes "get DIJ for exam" queries)

**Relationships**:
- `exam`: Many-to-One with `exams` (artifact belongs to one exam, required)
- `task`: Many-to-One with `tasks` (artifact optionally links to producing task)

**Constraints**:
- `CHECK (artifact_type IN ('dij', 'question_preview', 'nes', 'variants_package', 'answer_matrix'))` - Valid MVP artifact types only

**SQLAlchemy Model Signature**:
```python
class ArtifactType(str, enum.Enum):
    DIJ = "dij"
    QUESTION_PREVIEW = "question_preview"
    NES = "nes"
    VARIANTS_PACKAGE = "variants_package"
    ANSWER_MATRIX = "answer_matrix"

class Artifact(Base):
    __tablename__ = "artifacts"
    
    artifact_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exam_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exams.exam_id", ondelete="CASCADE"), nullable=False, index=True)
    task_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tasks.task_id", ondelete="CASCADE"), nullable=True, index=True)
    artifact_type: Mapped[ArtifactType] = mapped_column(Enum(ArtifactType, native_enum=False), nullable=False, index=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    
    # Relationships
    exam: Mapped["Exam"] = relationship("Exam", back_populates="artifacts")
    task: Mapped["Task"] = relationship("Task", back_populates="artifacts")
    
    __table_args__ = (
        Index('ix_artifacts_exam_id_artifact_type', 'exam_id', 'artifact_type'),  # Composite index
    )
```

---

### Table: `tasks` (Modifications)

**Changes**: Add `exam_id` foreign key column and relationship

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `exam_id` | UUID | FOREIGN KEY → exams(exam_id) ON DELETE CASCADE, NOT NULL, INDEX | - | **NEW**: Parent exam reference |

**New Index**:
- `ix_tasks_exam_id` (B-tree, supports queries by exam per FR-024)

**New Relationship**:
- `exam`: Many-to-One with `exams` (task belongs to one exam)
- `artifacts`: One-to-Many with `artifacts` (task can produce multiple artifacts)

**SQLAlchemy Model Changes**:
```python
class Task(Base):
    __tablename__ = "tasks"
    
    # ... existing fields ...
    
    # NEW FIELD
    exam_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("exams.exam_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Parent exam reference"
    )
    
    # ... existing fields ...
    
    # UPDATED RELATIONSHIPS
    user: Mapped["User"] = relationship("User", back_populates="tasks")
    exam: Mapped["Exam"] = relationship("Exam", back_populates="tasks")  # NEW
    logs: Mapped[list["TaskLog"]] = relationship("TaskLog", back_populates="task", cascade="all, delete-orphan")
    artifacts: Mapped[list["Artifact"]] = relationship("Artifact", back_populates="task")  # NEW
```

---

### Table: `users` (Modifications)

**Changes**: Add `exams` relationship

**New Relationship**:
- `exams`: One-to-Many with `exams` (user can own multiple exams)

**SQLAlchemy Model Changes**:
```python
class User(Base):
    __tablename__ = "users"
    
    # ... existing fields ...
    
    # UPDATED RELATIONSHIPS
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    exams: Mapped[list["Exam"]] = relationship("Exam", back_populates="user", cascade="all, delete-orphan")  # NEW
```

---

## Migration DDL (Reference)

### Forward Migration (Simplified)

```sql
-- Step 1: Create exams table
CREATE TABLE exams (
    exam_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    grade_level VARCHAR(100),
    num_variants INTEGER NOT NULL CHECK (num_variants > 0),
    instructions TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_exams_user_id ON exams(user_id);
CREATE INDEX ix_exams_status ON exams(status);
CREATE INDEX ix_exams_created_at ON exams(created_at);

-- Step 2: Create artifacts table
CREATE TABLE artifacts (
    artifact_id BIGSERIAL PRIMARY KEY,
    exam_id UUID NOT NULL REFERENCES exams(exam_id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(task_id) ON DELETE CASCADE,
    artifact_type VARCHAR(50) NOT NULL CHECK (artifact_type IN ('dij', 'question_preview', 'nes', 'variants_package', 'answer_matrix')),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_artifacts_exam_id ON artifacts(exam_id);
CREATE INDEX ix_artifacts_task_id ON artifacts(task_id);
CREATE INDEX ix_artifacts_artifact_type ON artifacts(artifact_type);
CREATE INDEX ix_artifacts_exam_id_artifact_type ON artifacts(exam_id, artifact_type);

-- Step 3: Add exam_id to tasks (nullable initially)
ALTER TABLE tasks ADD COLUMN exam_id UUID;

-- Step 4: Create legacy exams and link orphaned tasks
-- (See research.md for detailed migration logic)
INSERT INTO exams (exam_id, user_id, name, subject, academic_year, num_variants, status, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    user_id,
    'Legacy Import',
    'Imported',
    'Pre-Migration',
    1,
    'completed',
    NOW(),
    NOW()
FROM (SELECT DISTINCT user_id FROM tasks WHERE exam_id IS NULL) AS users_with_tasks;

UPDATE tasks 
SET exam_id = e.exam_id
FROM exams e
WHERE tasks.user_id = e.user_id 
  AND e.name = 'Legacy Import'
  AND tasks.exam_id IS NULL;

-- Step 5: Make exam_id NOT NULL and add FK constraint
ALTER TABLE tasks ALTER COLUMN exam_id SET NOT NULL;
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_exam_id_exams 
    FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE;
CREATE INDEX ix_tasks_exam_id ON tasks(exam_id);
```

### Backward Migration (Rollback)

```sql
-- Remove exam_id FK and column from tasks
ALTER TABLE tasks DROP CONSTRAINT fk_tasks_exam_id_exams;
DROP INDEX ix_tasks_exam_id;
ALTER TABLE tasks DROP COLUMN exam_id;

-- Drop artifacts table (cascade will handle FKs)
DROP TABLE artifacts;

-- Drop exams table (cascade will handle FKs)
DROP TABLE exams;
```

---

## Sample Queries

### Query 1: Get all exams for a user (FR-025)

```sql
SELECT exam_id, name, subject, academic_year, status, created_at
FROM exams
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC;
```

**Index Used**: `ix_exams_user_id` → O(log n) lookup → `ix_exams_created_at` for sort

---

### Query 2: Get all tasks for an exam (FR-024)

```sql
SELECT task_id, status, current_stage, progress, created_at
FROM tasks
WHERE exam_id = '7c9e6679-7425-40de-944b-e07fc1f90ae7'
ORDER BY created_at ASC;
```

**Index Used**: `ix_tasks_exam_id` → O(log n) lookup

---

### Query 3: Get all artifacts for an exam (FR-022)

```sql
SELECT artifact_id, artifact_type, file_name, file_path, created_at
FROM artifacts
WHERE exam_id = '7c9e6679-7425-40de-944b-e07fc1f90ae7'
ORDER BY created_at ASC;
```

**Index Used**: `ix_artifacts_exam_id` → O(log n) lookup

---

### Query 4: Get specific artifact type for an exam (optimized)

```sql
SELECT artifact_id, file_name, file_path
FROM artifacts
WHERE exam_id = '7c9e6679-7425-40de-944b-e07fc1f90ae7'
  AND artifact_type = 'dij'
LIMIT 1;
```

**Index Used**: `ix_artifacts_exam_id_artifact_type` (composite) → Single index scan, no secondary lookup

---

### Query 5: Cascade delete verification

```sql
-- Delete user and verify cascade
DELETE FROM users WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';

-- Verify exams deleted
SELECT COUNT(*) FROM exams WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'; -- Expected: 0

-- Verify tasks deleted
SELECT COUNT(*) FROM tasks WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'; -- Expected: 0

-- Verify artifacts deleted
SELECT COUNT(*) FROM artifacts WHERE exam_id IN (
    SELECT exam_id FROM exams WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
); -- Expected: 0
```

---

## Performance Characteristics

| Operation | Complexity | Index | Notes |
|-----------|-----------|-------|-------|
| Insert exam | O(log n) | Primary key + FK check | Typical: <1ms |
| Query exams by user | O(log n + k) | ix_exams_user_id | k = result count |
| Insert artifact | O(log n) | Primary key + FK checks | Typical: <1ms |
| Query artifacts by exam | O(log n + k) | ix_artifacts_exam_id | k = result count (typically 5-7) |
| Query specific artifact type | O(log n) | ix_artifacts_exam_id_artifact_type | Single index scan |
| Delete user (cascade) | O(k × log n) | All FKs traversed | k = total related records |

**At Scale (10,000 exams per user)**:
- Exam lookup: ~13 B-tree levels (log₂ 10,000 ≈ 13.3)
- All queries remain <10ms with proper indexes
- Meets SC-009 requirement (no degradation at 10K+ scale)

---

## Schema Version

**Version**: 1.0.0  
**Alembic Revision**: `XXXX_add_exams_artifacts` (generated during implementation)  
**Compatible With**: SiroMix V2 backend >= 0.1.0

---

## Next Phase

With data model complete, Phase 1 continues with:
- **contracts/**: Pydantic schema definitions for exam and artifact validation
- **quickstart.md**: Developer setup and testing guide
- **Agent context update**: Add SQLAlchemy/PostgreSQL patterns to AI context
