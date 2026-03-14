# Implementation Plan: File Upload & Exam Creation API

**Branch**: `004-exam-upload-api` | **Date**: March 13, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-exam-upload-api/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Create a backend API endpoint that accepts multipart/form-data submissions containing exam metadata (name, subject, academic_year, grade_level, duration_minutes, num_versions, instructions) and a DOCX file. The system will validate inputs, create an Exam record with "draft" status, upload the file to object storage following a structured path pattern, create a linked Task record with "queued" status, and return exam_id and task_id for tracking. This feature extends the existing Exam and Task models from Feature 003 with the duration_minutes field and makes exam_id mandatory in the Task model.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript/Node.js (frontend with Next.js 14)  
**Primary Dependencies**: FastAPI 0.104+, SQLAlchemy 2.0+ (async), Pydantic 2.0+, Celery 5.3+, Redis 5.0+, boto3 1.34+ (S3-compatible storage client)  
**Storage**: PostgreSQL (asyncpg driver) for database, S3/MinIO (via boto3) for file uploads - configurable via endpoint_url  
**Testing**: pytest 7.4+ with pytest-asyncio, pytest-cov for backend; vitest for frontend  
**Target Platform**: Linux server (backend API), Web browsers (frontend)  
**Project Type**: Web service (REST API backend + Next.js frontend)  
**Performance Goals**: <5s upload for files <10MB, <1s file retrieval, handle concurrent submissions without collisions  
**Constraints**: 50MB file size limit, atomic transactions (no orphaned records), DOCX format validation  
**Scale/Scope**: Multi-user exam creation, features integrate with existing User, Exam, Task, Artifact models from Feature 003

**Technical Decisions** (from Phase 0 research - see [research.md](research.md)):
- Object storage: boto3 with S3-compatible configuration (supports AWS S3 and MinIO)
- File handling: FastAPI UploadFile (streaming) + Form() parameters  
- Transaction pattern: Upload file first, then DB transaction with rollback
- Celery: Enqueue task via `.delay()` after successful DB commit

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle Alignment

| Principle | Status | Evaluation |
|-----------|--------|------------|
| **I. Pipeline-First** | ✅ PASS | Feature creates exam + task as entry point to pipeline; does not modify pipeline stages |
| **II. AI is Component** | ✅ PASS | No AI in this feature; file upload and metadata storage are deterministic |
| **III. Schema-First** | ✅ PASS | Uses existing Exam/Task schemas from Feature 003; extends with duration_minutes field; validates all inputs |
| **IV. Non-Text Content** | ✅ PASS | DOCX file stored as blob with reference path; not parsed or embedded in this feature |
| **V. Traceability** | ✅ PASS | Exam record links to user_id; Task record links to exam_id; file path includes user_id and exam identifier |
| **VI. Determinism** | ✅ PASS | All operations deterministic (validation, DB writes, file storage); no randomness |
| **VII. Idempotent Tasks** | ✅ PASS | Transaction boundaries ensure rollback on failure; no partial state; duplicate submissions create distinct exams (by design) |
| **VIII. Content vs Rendering** | ✅ PASS | Metadata storage only; rendering happens in later pipeline stages |
| **IX. Unit Testing** | ✅ PASS | Will require unit tests for: API endpoint, validation logic, schema changes, transaction handling |

### Quality Gates

| Gate | Status | Evaluation |
|------|--------|------------|
| **1. Schema validation** | ✅ PASS | Pydantic schemas validate all inputs; field constraints enforced |
| **2. Artifacts persisted** | ✅ PASS | Exam record, Task record, uploaded file all persisted with references |
| **3. Task state tracking** | ✅ PASS | Task created with status="queued", exam_id reference, ready for pipeline |
| **4. Idempotent & retryable** | ✅ PASS | Transaction rollback on any failure; safe to retry entire request |
| **5. Deterministic** | ✅ PASS | No randomness; same inputs produce same database state (different UUIDs but deterministic behavior) |
| **6. Unit tests** | ⚠️ PENDING | Tests must be written for all new code per constitution |

### Violations Requiring Justification

None. Feature fully complies with constitution principles and quality gates.

## Project Structure

### Documentation (this feature)

```text
specs/004-exam-upload-api/
├── spec.md              # Feature specification (completed)
├── CLARIFICATION_REPORT.md  # Clarification session results
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated)
│   └── exams_post.md    # POST /api/v1/exams contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── alembic/
│   └── versions/
│       └── [new]_add_duration_minutes_to_exams.py  # Migration for duration field
│       └── [new]_make_exam_id_required_in_tasks.py # Migration for exam_id constraint
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── endpoints/
│   │           └── exams.py  # NEW: POST /api/v1/exams endpoint
│   ├── core/
│   │   ├── artifact_paths.py  # EXISTS: Path generation utilities
│   │   ├── storage.py  # NEW: Object storage client (S3/MinIO)
│   │   └── deps.py  # EXISTS: Dependency injection (auth, db sessions)
│   ├── models/
│   │   ├── exam.py  # MODIFY: Add duration_minutes field
│   │   └── task.py  # MODIFY: Make exam_id non-nullable
│   ├── schemas/
│   │   ├── exam.py  # MODIFY: Add duration_minutes to ExamCreate/Response/Update
│   │   └── task.py  # MODIFY: Add exam_id to TaskCreate
│   └── services/
│       └── exam_service.py  # NEW: Business logic for exam creation
└── tests/
    ├── unit/
    │   ├── models/
    │   │   └── test_exam.py  # MODIFY: Add duration_minutes tests
    │   ├── schemas/
    │   │   ├── test_exam_schema.py  # MODIFY: Add duration_minutes validation tests
    │   │   └── test_task_schema.py  # MODIFY: Add exam_id tests
    │   └── services/
    │       └── test_exam_service.py  # NEW: Unit tests for exam creation logic
    ├── integration/
    │   └── test_exam_upload.py  # NEW: Integration tests for file upload flow
    └── contract/
        └── test_exams_api.py  # NEW: API contract tests

frontend/
├── src/
│   ├── app/
│   │   └── exams/
│   │       └── create/
│   │           └── page.tsx  # MODIFY: Add grade_level and duration fields
│   ├── components/
│   │   └── sections/
│   │       └── ExamMetadataForm.tsx  # MODIFY: Update form to match API contract
│   └── types/
│       └── index.ts  # MODIFY: Update ExamMetadata interface
└── tests/
    └── components/
        └── ExamMetadataForm.test.tsx  # MODIFY: Add tests for new fields
```

**Structure Decision**: This is a web application (Option 2 from template) with FastAPI backend and Next.js frontend. The feature modifies existing backend models/schemas and adds new API endpoints + storage integration. Frontend modifications add missing UI fields to match backend contract.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. This section is not applicable for this feature.

---

## Phase 0: Research & Technical Decisions

**Status**: ✅ COMPLETED

**Outputs**: [research.md](research.md)

### Research Questions Resolved

1. **Object Storage Library Selection**: Decided on boto3 with S3-compatible configuration (supports both AWS S3 and MinIO)
   - Rationale: Single library, flexible deployment, production-ready
   - Configuration: endpoint_url parameter allows switching between S3 and MinIO

2. **File Upload Pattern**: FastAPI UploadFile (streaming) + Form() parameters for multipart/form-data
   - Rationale: Native FastAPI support, memory-efficient streaming, concurrent parameter handling
   - Validation: Check MIME type and file extension before processing

3. **Transaction Atomicity**: Upload file first, then DB transaction with rollback on failure
   - Rationale: File storage is not transactional, so upload first and clean up on DB failure
   - Failure handling: Delete uploaded file if DB transaction fails

4. **Celery Integration**: Use `.delay()` method to enqueue task after DB commit
   - Rationale: Async task execution without blocking API response
   - Timing: Enqueue only after successful commit to avoid orphaned tasks

### Dependencies Identified

- **Add to pyproject.toml**: `boto3>=1.34.0` (S3/MinIO client)
- **Environment Variables**: 
  - `STORAGE_BUCKET_NAME`
  - `STORAGE_ENDPOINT_URL` (for MinIO or S3)
  - `STORAGE_ACCESS_KEY_ID`
  - `STORAGE_SECRET_ACCESS_KEY`
  - `STORAGE_REGION` (AWS S3 only)

---

## Phase 1: Design & Contracts

**Status**: ✅ COMPLETED

**Outputs**: 
- [data-model.md](data-model.md)
- [quickstart.md](quickstart.md)
- [contracts/exams_post.md](contracts/exams_post.md)

### Data Model

**Schema Changes**:
1. **Exam model**: Add `duration_minutes` (INTEGER, NOT NULL, CHECK > 0)
2. **Task model**: Change `exam_id` from nullable to non-nullable (FOREIGN KEY to exams.exam_id, CASCADE DELETE)

**Pydantic Schema Changes**:
1. **ExamCreate**: Add `duration_minutes: int` with `gt=0` validation
2. **TaskCreate**: Add `exam_id: uuid.UUID` field

**Migrations Required**: 2 Alembic migrations
- Add Exam.duration_minutes with constraint
- Make Task.exam_id non-nullable (requires data migration for existing NULL values)

**File Storage Structure**: `exams/{user_id}/{exam-name-kebab}/original.docx`

### API Contract

**Endpoint**: `POST /api/v1/exams`

**Request**: multipart/form-data with 8 fields (name, subject, academic_year, grade_level, duration_minutes, num_variants, instructions, file)

**Response**: 201 Created with JSON `{exam_id, task_id, status}`

**Error Codes**: 400 (validation), 401 (auth), 500 (server), 503 (storage unavailable), 504 (timeout), 507 (quota exceeded)

### Quickstart Guide

Developer setup instructions covering:
- Prerequisites (Python 3.11+, PostgreSQL, Redis, MinIO/S3)
- Environment variable configuration
- Database migrations
- Running services (FastAPI, Celery, Frontend)
- Testing workflow with example cURL commands
- Common issues and solutions

### Agent Context Update

✅ Updated GitHub Copilot agent context with new technologies:
- boto3 1.34+ (S3-compatible storage client)
- S3/MinIO object storage patterns
- Multipart form data handling with FastAPI

### Post-Design Constitution Re-Check

*Required by Gate: Re-check after Phase 1 design*

All principles remain **PASS** after design phase:

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| **I. Pipeline-First** | ✅ PASS | Design confirms entry point to existing pipeline; no stage modifications |
| **II. AI is Component** | ✅ PASS | No AI integration in design; pure data validation and storage |
| **III. Schema-First** | ✅ PASS | Schema changes clearly defined in data-model.md; Pydantic validation first |
| **IV. Non-Text Content** | ✅ PASS | File storage pattern documented; DOCX remains opaque blob |
| **V. Traceability** | ✅ PASS | Database relationships enforce traceability (user → exam → task → artifacts) |
| **VI. Determinism** | ✅ PASS | All operations deterministic; transaction pattern prevents non-determinism |
| **VII. Idempotent Tasks** | ✅ PASS | Rollback strategy ensures clean failures; duplicate submissions intentionally allowed |
| **VIII. Content vs Rendering** | ✅ PASS | Storage only; rendering deferred to pipeline stages |
| **IX. Unit Testing** | ⚠️ PENDING | Implementation phase must include unit tests per testing strategy |

**Quality Gate Status**: All gates PASS except pending unit test implementation.

**No violations introduced by design phase**. Implementation can proceed.

---

## Phase 2: Task Breakdown

**Status**: ⏳ NOT STARTED

**Command**: `/speckit.tasks` (separate command, not part of `/speckit.plan`)

**Output**: [tasks.md](tasks.md) (will contain actionable implementation tasks organized by dependency order)

**Note**: This phase is executed separately after planning is complete. Run `/speckit.tasks` to generate the task breakdown for implementation.
