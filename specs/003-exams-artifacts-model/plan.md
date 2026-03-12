# Implementation Plan: Extend Core Data Model with Exams and Artifacts

**Branch**: `003-exams-artifacts-model` | **Date**: March 12, 2026 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/003-exams-artifacts-model/spec.md`

## Summary

This feature extends the SiroMix database schema with two new tables (`exams` and `artifacts`) to cleanly separate business metadata from execution state. The `exams` table stores top-level exam business information (name, subject, academic year, variants, etc.), while the `artifacts` table tracks generated pipeline outputs (DIJ, question previews, NES, variants packages, answer matrices). The existing `tasks` table is extended with an `exam_id` foreign key to link processing jobs to their business context.

**Technical Approach**: Define SQLAlchemy 2.0 async models → Create Pydantic validation schemas → Generate Alembic migration with cascade delete rules → Add relationship configurations → Create migration script for legacy data → Validate with integration tests.

## Technical Context

**Language/Version**: Python 3.11+  
**Primary Dependencies**: SQLAlchemy 2.0+ (asyncio), Alembic 1.12+, Pydantic 2.0+, asyncpg 0.29+  
**Storage**: PostgreSQL 15 with asyncpg driver  
**Testing**: pytest 7.4+, pytest-asyncio 0.21+, pytest-cov 4.1+  
**Target Platform**: Linux/Docker containers (development + production)  
**Project Type**: Web service backend (FastAPI modular monolith with Celery workers)  
**Performance Goals**: Support 10,000+ exam records per user without query degradation on standard lookups  
**Constraints**: Zero data loss during migration, backward compatibility with existing tasks, <200ms p95 for exam/artifact queries  
**Scale/Scope**: +2 tables (exams, artifacts), +1 FK column (tasks.exam_id), +5 relationships, +2 enums, ~300 lines model code

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate # | Principle | Requirement | Status | Notes |
|--------|-----------|-------------|--------|-------|
| 1 | Pipeline-First | Data model must support pipeline stage contracts | ✅ PASS | Exams store business metadata only; artifacts track stage outputs; clean separation maintained |
| 2 | Schema-First, Validation-Gated | Schema must be versioned and validated | ✅ PASS | SQLAlchemy models provide schema definition. Alembic provides migration versioning. Pydantic schemas validate API layer |
| 3 | Traceability & Provenance | Artifacts must maintain traceability | ✅ PASS | Artifacts reference both exam_id (business context) and task_id (execution provenance) per FR-013, FR-014 |
| 4 | Determinism After Normalization | Schema must support seed-based reproducibility | ✅ PASS | Exam and artifact records are deterministic data structures; no random generation in models |
| 5 | Idempotent, Retryable Tasks | Schema must support idempotent operations | ✅ PASS | Artifact creation can check for existing type+exam+task combinations; exam lookup by user+name possible for deduplication |
| 6 | Unit Testing Mandatory | All models must have unit tests | ⚠️ PENDING | Tests written during implementation phase (tasks.md → implement); success criterion SC-008 validates migration |
| 7 | Task & Workflow Model | Schema must support task_id workflow | ✅ PASS | Task table already implements workflow model per constitution; extension adds business context via exam_id FK per FR-003, FR-012 |

**Verdict**: ✅ PASSES - No constitution violations. Unit testing gate is standard workflow (tests written during implementation, not planning phase).

## Project Structure

### Documentation (this feature)

```text
specs/003-exams-artifacts-model/
├── spec.md                    # ✅ Complete (user scenarios, 25 FRs, 10 success criteria)
├── checklists/
│   └── requirements.md        # ✅ Complete (quality validation checklist)
├── plan.md                    # 📝 This file (implementation plan)
├── research.md                # 🔄 Phase 0 output (technical decisions, patterns, alternatives)
├── data-model.md              # 🔄 Phase 1 output (ERD, field specs, indexes, migration strategy)
├── quickstart.md              # 🔄 Phase 1 output (local dev setup, testing guide, debugging)
└── contracts/                 # 🔄 Phase 1 output (Pydantic schemas, validation rules)
    ├── exam-schema.md
    └── artifact-schema.md
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── models/
│   │   ├── __init__.py        # 🔄 UPDATE: export Exam, Artifact, ExamStatus, ArtifactType
│   │   ├── exam.py            # ➕ NEW: Exam model with status enum
│   │   ├── artifact.py        # ➕ NEW: Artifact model with type enum
│   │   ├── task.py            # 🔄 UPDATE: Add exam_id FK, exam relationship
│   │   ├── user.py            # 🔄 UPDATE: Add exams relationship
│   │   └── task_log.py        # ✅ NO CHANGE (continues to belong to tasks)
│   ├── schemas/
│   │   ├── exam.py            # ➕ NEW: ExamCreate, ExamResponse, ExamUpdate Pydantic models
│   │   └── artifact.py        # ➕ NEW: ArtifactCreate, ArtifactResponse Pydantic models
│   └── api/
│       └── (out of scope - schemas prepared for future endpoints)
├── alembic/
│   └── versions/
│       └── XXXX_add_exams_artifacts.py  # ➕ NEW: Migration adding exams, artifacts, exam_id FK
└── tests/
    ├── unit/
    │   ├── models/
    │   │   ├── test_exam.py           # ➕ NEW: Exam model validation tests
    │   │   ├── test_artifact.py       # ➕ NEW: Artifact model validation tests
    │   │   └── test_task_exam_fk.py   # ➕ NEW: Task-exam FK constraint tests
    └── integration/
        ├── test_exam_cascade_delete.py       # ➕ NEW: User→Exam→Task→Artifact cascade
        └── test_artifact_relationships.py    # ➕ NEW: Exam/Task→Artifact queries
```

**Structure Decision**: Backend-only changes using existing FastAPI + SQLAlchemy + Alembic stack. No frontend modifications required (pure data model feature). Tests follow existing pytest structure with unit tests for model validation and integration tests for relationship behavior.

## Complexity Tracking

> **No constitution violations requiring justification.**

This feature maintains full alignment with SiroMix constitution principles:

- **Pipeline-First**: Exams are business entities (metadata), artifacts are pipeline outputs (stage results) - clean separation per Principle I
- **Schema-First**: SQLAlchemy provides strict typing, Alembic provides versioning, Pydantic validates boundaries per Principle III
- **Traceability**: Artifacts maintain dual FK (exam_id + task_id) for business and execution provenance per Principle V
- **Idempotent Design**: Models support existence checks and upsert patterns per Principle VII
- **Task Workflow**: Extends existing task model without breaking workflow contracts per Constitution Task Model section

**No simpler alternatives rejected** - this is the minimal additive change to support exam-level business operations.
