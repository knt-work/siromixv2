# Research: Extend Core Data Model with Exams and Artifacts

**Feature**: 003-exams-artifacts-model  
**Date**: March 12, 2026  
**Phase**: 0 - Technical Research & Decision Documentation

## Overview

This document captures technical research, patterns, and implementation decisions for extending the SiroMix database schema with `exams` and `artifacts` tables. All decisions are informed by the project's existing SQLAlchemy 2.0 async architecture and PostgreSQL setup.

---

## Research Areas

### 1. SQLAlchemy 2.0 Async Relationship Patterns with Cascade Delete

**Question**: How to properly configure cascade delete relationships in SQLAlchemy 2.0 async models to ensure referential integrity?

**Research Findings**:

SQLAlchemy 2.0's `Mapped` typing and `relationship()` provide cascade configuration via the `cascade` parameter. For our use case:

```python
from sqlalchemy.orm import Mapped, mapped_column, relationship

class User(Base):
    exams: Mapped[list["Exam"]] = relationship(
        "Exam",
        back_populates="user",
        cascade="all, delete-orphan"  # Delete exams when user is deleted
    )

class Exam(Base):
    user: Mapped["User"] = relationship("User", back_populates="exams")
    
    tasks: Mapped[list["Task"]] = relationship(
        "Task",
        back_populates="exam",
        cascade="all, delete-orphan"  # Delete tasks when exam is deleted
    )
    
    artifacts: Mapped[list["Artifact"]] = relationship(
        "Artifact",
        back_populates="exam",
        cascade="all, delete-orphan"  # Delete artifacts when exam is deleted
    )
```

**Key Patterns**:
- `cascade="all, delete-orphan"` ensures child records are deleted when parent is deleted
- Database-level cascades defined in ForeignKey: `ForeignKey("exams.exam_id", ondelete="CASCADE")`
- Both ORM and DB-level cascades recommended for consistency

**Existing Pattern in SiroMix**:
Looking at `backend/app/models/user.py` and `task.py`, the project already uses this pattern:
```python
# From user.py
tasks: Mapped[list["Task"]] = relationship(
    "Task",
    back_populates="user",
    cascade="all, delete-orphan"
)

# From task.py
user_id: Mapped[uuid.UUID] = mapped_column(
    ForeignKey("users.user_id", ondelete="CASCADE"),
    ...
)
```

**Decision**: ✅ Use `cascade="all, delete-orphan"` in relationship definitions + `ondelete="CASCADE"` in ForeignKey constraints. This matches existing project conventions.

---

### 2. Alembic Migration Best Practices for Adding Foreign Keys to Existing Tables

**Question**: How to add `exam_id` foreign key to existing `tasks` table with potential data, ensuring zero downtime and data safety?

**Research Findings**:

Multi-step migration approach:

**Step 1**: Add nullable column
```python
op.add_column('tasks', sa.Column('exam_id', sa.Uuid(), nullable=True))
```

**Step 2**: Create "Legacy Import" exams for existing users with tasks
```python
# Find all users with tasks
conn = op.get_bind()
users_with_tasks = conn.execute(
    text("SELECT DISTINCT user_id FROM tasks")
).fetchall()

# Create legacy exam for each user
for (user_id,) in users_with_tasks:
    legacy_exam_id = uuid.uuid4()
    conn.execute(
        text("""
            INSERT INTO exams (exam_id, user_id, name, subject, academic_year, 
                               num_variants, status, created_at, updated_at)
            VALUES (:exam_id, :user_id, 'Legacy Import', 'Imported', 'Pre-Migration', 
                    1, 'completed', NOW(), NOW())
        """),
        {"exam_id": legacy_exam_id, "user_id": user_id}
    )
    
    # Update tasks to reference legacy exam
    conn.execute(
        text("UPDATE tasks SET exam_id = :exam_id WHERE user_id = :user_id"),
        {"exam_id": legacy_exam_id, "user_id": user_id}
    )
```

**Step 3**: Make column NOT NULL and add FK constraint
```python
op.alter_column('tasks', 'exam_id', nullable=False)
op.create_foreign_key(
    'fk_tasks_exam_id_exams',
    'tasks', 'exams',
    ['exam_id'], ['exam_id'],
    ondelete='CASCADE'
)
```

**Alternative Considered**: Make exam_id nullable permanently
- **Rejected**: Violates FR-012 (every task MUST belong to exactly one exam)
- Nullable FKs complicate application logic and allow orphaned tasks

**Decision**: ✅ Use 3-step migration with legacy exam creation. Ensures data safety, maintains referential integrity, aligns with FR-012.

---

### 3. PostgreSQL Enum Type Handling in SQLAlchemy

**Question**: Should we use PostgreSQL native ENUM types or VARCHAR with Python enum validation?

**Research Findings**:

Two approaches:

**Option A: Native PostgreSQL ENUM**
```python
from sqlalchemy import Enum as SQLEnum
import enum

class ExamStatus(str, enum.Enum):
    DRAFT = "draft"
    PROCESSING = "processing"
    COMPLETED = "completed"

class Exam(Base):
    status: Mapped[ExamStatus] = mapped_column(
        SQLEnum(ExamStatus, name="exam_status", native_enum=True),
        nullable=False
    )
```

**Pros**: Database enforces validation, explicit type
**Cons**: Harder to add values (requires migration), PostgreSQL-specific

**Option B: VARCHAR with Python validation**
```python
class Exam(Base):
    status: Mapped[ExamStatus] = mapped_column(
        SQLEnum(ExamStatus, name="exam_status", native_enum=False),  # Stored as VARCHAR
        nullable=False
    )
```

**Pros**: Easy to extend, database-agnostic, Python still validates
**Cons**: Database doesn't enforce constraint

**Existing Pattern in SiroMix**:
Checking `backend/app/models/task.py`:
```python
status: Mapped[TaskStatus] = mapped_column(
    Enum(TaskStatus, name="task_status", native_enum=False),  # VARCHAR approach
    nullable=False,
    ...
)
```

**Decision**: ✅ Use `native_enum=False` (VARCHAR storage with Python enum validation). This matches existing project conventions and provides flexibility for future status additions without complex migrations.

---

### 4. File Path Generation Pattern for Artifacts

**Question**: How to generate kebab-case file paths from exam names for the `exams/<user_id>/<exam-name-kebab-case>/<filename>` pattern?

**Research Findings**:

Python utility function for kebab-case conversion:

```python
import re
import unicodedata

def to_kebab_case(text: str, max_length: int = 100) -> str:
    """
    Convert text to kebab-case for filesystem-safe directory names.
    
    Examples:
        "Mathematics Final 2026" → "mathematics-final-2026"
        "AP® Physics - C" → "ap-physics-c"
        "Grade 10 Exam (Advanced)" → "grade-10-exam-advanced"
    
    Args:
        text: Input text (exam name)
        max_length: Maximum length for output (default 100)
        
    Returns:
        Kebab-case string safe for filesystem use
    """
    # Normalize unicode (remove accents: café → cafe)
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    
    # Lowercase
    text = text.lower()
    
    # Replace non-alphanumeric with hyphens
    text = re.sub(r'[^a-z0-9]+', '-', text)
    
    # Remove leading/trailing hyphens
    text = text.strip('-')
    
    # Collapse multiple hyphens
    text = re.sub(r'-+', '-', text)
    
    # Truncate to max length at word boundary
    if len(text) > max_length:
        text = text[:max_length].rsplit('-', 1)[0]
    
    return text or 'untitled'  # Fallback for empty result
```

**Usage in artifact path construction**:
```python
def generate_artifact_path(
    user_id: UUID, 
    exam_name: str, 
    filename: str
) -> str:
    """Generate relative artifact path from storage root."""
    exam_slug = to_kebab_case(exam_name)
    return f"exams/{user_id}/{exam_slug}/{filename}"

# Example:
# generate_artifact_path(
#     UUID("abc-123"),
#     "Mathematics Final 2026",
#     "dij-final.json"
# )
# → "exams/abc-123/mathematics-final-2026/dij-final.json"
```

**Edge Cases Handled**:
- Unicode/accents: "Exámen" → "examen"
- Special characters: "AP® Physics - C" → "ap-physics-c"
- Multiple spaces: "Math    Final" → "math-final"
- Empty result: "" → "untitled"

**Decision**: ✅ Create utility function `to_kebab_case()` in `backend/app/utils/path_helpers.py`. Tested edge cases, max 100 chars for directory name, fallback to "untitled".

---

### 5. Indexing Strategy for High-Volume Queries

**Question**: Which indexes are needed to support SC-009 (10,000+ exam records per user without query degradation)?

**Research Findings**:

Based on functional requirements and expected query patterns:

**Critical Indexes**:

```python
# Exam table indexes
Index('ix_exams_user_id', 'user_id')          # FR-025: Query exams by user
Index('ix_exams_status', 'status')             # Filter by status (draft/processing/completed)
Index('ix_exams_created_at', 'created_at')     # Sort by creation date

# Task table indexes (existing + new)
Index('ix_tasks_task_id', 'task_id')           # ✅ Already exists (PK lookup)
Index('ix_tasks_user_id', 'user_id')           # ✅ Already exists (user tasks)
Index('ix_tasks_exam_id', 'exam_id')           # ➕ NEW: FR-024: Query tasks by exam
Index('ix_tasks_status', 'status')             # ✅ Already exists (status filtering)

# Artifact table indexes
Index('ix_artifacts_exam_id', 'exam_id')       # FR-022: Query artifacts by exam
Index('ix_artifacts_task_id', 'task_id')       # FR-023: Query artifacts by task (nullable)
Index('ix_artifacts_artifact_type', 'artifact_type')  # Filter by type (dij, nes, etc.)

# Composite indexes for common queries
Index('ix_artifacts_exam_type', 'exam_id', 'artifact_type')  # Get specific artifact types for exam
```

**Query Performance Analysis**:

| Query Pattern | Index Used | Estimated Rows @ 10K Exams | Performance |
|---------------|------------|----------------------------|-------------|
| Get exams for user | `ix_exams_user_id` | 10,000 | O(log n) - ~13 comparisons |
| Get tasks for exam | `ix_tasks_exam_id` | ~5-10 per exam| O(log n) |
| Get artifacts by exam | `ix_artifacts_exam_id` | ~5-7 per exam | O(log n) |
| Get DIJ artifacts only | `ix_artifacts_exam_type` | 1 per exam | O(log n) |

**PostgreSQL B-tree Performance**:
- 10,000 records: ~13 levels (log₂ 10,000 ≈ 13.3)
- Each index lookup: <1ms typical
- Composite index avoids secondary lookup

**Existing Pattern in SiroMix**:
From `task.py`:
```python
task_id: Mapped[uuid.UUID] = mapped_column(
    primary_key=True,
    default=uuid.uuid4,
    index=True  # Creates ix_tasks_task_id
)
```

**Decision**: ✅ Add indexes via SQLAlchemy `index=True` parameter in mapped_column + explicit composite indexes in model `__table_args__`. B-tree indexes sufficient for all query patterns. No need for partial or specialized indexes at MVP scale.

---

## Alternative Approaches Considered

### Alternative 1: Single Polymorphic Entity Table

**Description**: Use single table with `entity_type` discriminator instead of separate exams/artifacts tables.

**Rejected Because**:
- Violates separation of concerns (business metadata mixed with output references)
- Many nullable columns (exam-specific fields null for artifacts, vice versa)
- Complex queries requiring type filtering
- Harder to add entity-specific constraints

**Spec Alignment**: FR-019, FR-020, FR-021 explicitly require separation.

---

### Alternative 2: UUID Primary Keys for Artifacts

**Description**: Use UUID instead of auto-increment integer for artifact_id.

**Rejected Because**:
- Artifacts are high-volume, append-only records (similar to logs)
- Auto-increment provides better sequential insert performance
- Smaller index size (8 bytes vs 16 bytes)
- No distributed generation requirement (single database)
- Matches existing TaskLog pattern (log_id is integer)

**Clarification Decision**: Artifacts use auto-increment per Session 2026-03-12.

---

### Alternative 3: Embedded Artifact Metadata in Exam Table

**Description**: Store artifact references as JSONB array in exams table instead of separate artifacts table.

**Rejected Because**:
- Can't query artifacts independently (FR-022, FR-023)
- Can't track task-level provenance (FR-014)
- JSONB queries slower than indexed FK lookups
- Violates normalized design
- Hard to enforce type constraints on array elements

**Spec Alignment**: FR-002 explicitly requires separate artifacts table.

---

## Implementation Notes

### Migration Execution Order

1. **Create exams table** (no dependencies)
2. **Create artifacts table** (depends on exams)
3. **Add tasks.exam_id column** (nullable initially)
4. **Create legacy exams and link orphaned tasks** (data migration)
5. **Make tasks.exam_id NOT NULL** (constraint enforcement)
6. **Add all indexes** (performance optimization)

### Testing Strategy

**Unit Tests**:
- Model field validation (length constraints, enum values)
- Relationship configuration (back_populates, cascade)
- Default values (created_at, updated_at, status)

**Integration Tests**:
- Cascade delete behavior (user → exams → tasks/artifacts)
- FK constraint enforcement (can't create task without exam)
- Orphan prevention (delete-orphan cascade)
- Query performance with indexes

**Migration Tests**:
- Forward migration (create schema)
- Backward migration (rollback)
- Data preservation (legacy exam creation)
- Constraint enforcement (exam_id NOT NULL)

---

## Decisions Summary

| # | Decision Area | Choice | Rationale |
|---|---------------|---------|-----------|
| 1 | Cascade Pattern | `cascade="all, delete-orphan"` + `ondelete="CASCADE"` | Matches existing pattern, ensures consistency |
| 2 | Migration Strategy | 3-step (nullable → populate → NOT NULL) | Zero data loss, maintains referential integrity |
| 3 | Enum Storage | `native_enum=False` (VARCHAR) | Matches existing pattern, flexibility |
| 4 | Path Generation | kebab-case utility function | Filesystem-safe, predictable, handles edge cases |
| 5 | Indexing | Single-column + composite B-tree indexes | Sufficient for query patterns and scale |

---

## Next Steps (Phase 1)

With research complete, Phase 1 will produce:
- **data-model.md**: Complete ERD, field specifications, migration DDL
- **contracts/**: Pydantic schema definitions with validation rules
- **quickstart.md**: Developer setup and testing guide

All technical unknowns resolved. Ready to proceed to design phase.
