# Tasks: File Upload & Exam Creation API

**Feature**: 004-exam-upload-api  
**Input**: Design documents from `/specs/004-exam-upload-api/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/exams_post.md

**Tests**: MANDATORY per Constitution Principle IX - All unit tests marked below MUST be written and FAIL before implementation.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency setup

- [X] T001 Add boto3>=1.34.0 to backend/pyproject.toml dependencies array
- [X] T002 [P] Install boto3 in virtual environment via pip install boto3
- [X] T003 [P] Add storage environment variables to backend/.env.example (STORAGE_BUCKET_NAME, STORAGE_ENDPOINT_URL, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY, STORAGE_REGION)
- [X] T004 Create storage module skeleton in backend/app/core/storage.py with StorageClient class
- [X] T005 Create exam service module skeleton in backend/app/services/exam_service.py with ExamService class

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema Changes

- [X] T006 Generate Alembic migration for adding duration_minutes to Exam model: `alembic revision --autogenerate -m "Add duration_minutes to Exam"`
- [X] T007 Review and edit migration script in backend/alembic/versions/[timestamp]_add_duration_minutes_to_exam.py per data-model.md (add column as nullable, set default 60, make non-nullable, add CHECK constraint)
- [X] T008 Generate Alembic migration for making Task.exam_id non-nullable: `alembic revision --autogenerate -m "Make Task exam_id required"`
- [X] T009 Review and edit migration script in backend/alembic/versions/[timestamp]_make_task_exam_id_required.py per data-model.md (delete NULL exam_id tasks, make column non-nullable)
- [X] T010 Apply migrations to development database: `alembic upgrade head`
- [X] T011 Verify schema changes with psql: Check exams.duration_minutes and tasks.exam_id constraints

### Pydantic Schema Updates

- [X] T012 [P] Update ExamCreate schema in backend/app/schemas/exam.py to add duration_minutes: int field with gt=0 validation
- [X] T013 [P] Update ExamResponse schema in backend/app/schemas/exam.py to include duration_minutes field
- [X] T014 [P] Update ExamUpdate schema in backend/app/schemas/exam.py to include optional duration_minutes field
- [X] T015 [P] Update TaskCreate schema in backend/app/schemas/task.py to add exam_id: uuid.UUID field
- [X] T016 Update Exam model in backend/app/models/exam.py to add duration_minutes: Mapped[int] field with CheckConstraint

### Storage Infrastructure

- [X] T017 Implement StorageClient class in backend/app/core/storage.py with __init__ (boto3 S3 client initialization), upload_file, get_file_url, delete_file methods
- [X] T018 Add storage configuration to backend/app/core/config.py (STORAGE_BUCKET_NAME, STORAGE_ENDPOINT_URL, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY, STORAGE_REGION settings)
- [X] T019 Create get_storage_client dependency in backend/app/core/deps.py that returns StorageClient instance

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User submits exam creation form with file upload (Priority: P1) 🎯 MVP

**Goal**: Enable teachers to submit exam creation form with metadata and DOCX file, creating exam record (draft status), uploading file to storage, creating task record (queued status), and returning exam_id/task_id for tracking.

**Independent Test**: Submit complete form with valid DOCX file → verify exam record created with status="draft", file in storage at correct path, task record with status="queued" and correct exam_id, API response contains valid exam_id and task_id UUIDs.

### Tests for User Story 1 (MANDATORY - Write FIRST, ensure they FAIL) ✅

- [X] T020 [P] [US1] Unit tests for ExamService.create_exam_with_upload in backend/tests/unit/services/test_exam_service.py (test successful creation, transaction rollback on failure, file cleanup on DB error)
- [X] T021 [P] [US1] Unit tests for StorageClient methods in backend/tests/unit/core/test_storage.py (test upload_file, get_file_url, delete_file with mocked boto3)
- [X] T022 [P] [US1] Contract test for POST /api/v1/exams in backend/tests/contract/test_exams_api.py (test 201 response schema with exam_id, task_id, status)
- [X] T023 [P] [US1] Integration test for exam creation flow in backend/tests/integration/test_exam_upload.py (test end-to-end: API request → DB records → storage upload → Celery enqueue)

### Implementation for User Story 1

- [X] T024 [US1] Implement ExamService.create_exam_with_upload in backend/app/services/exam_service.py (upload file to storage, begin DB transaction, create Exam record with status="draft", create Artifact record, create Task record with status="queued", commit transaction, enqueue Celery task, return exam_id/task_id)
- [X] T025 [US1] Create POST /api/v1/exams endpoint in backend/app/api/v1/endpoints/exams.py (accept multipart/form-data, authenticate user, parse form fields into ExamCreate schema, validate file parameter exists, call ExamService.create_exam_with_upload, return 201 with exam_id/task_id/status)
- [X] T026 [US1] Register exams router in backend/app/api/v1/api.py (import exams router, add to API router with prefix="/exams" and tag="exams")
- [X] T027 [US1] Add Artifact model creation in ExamService (gracefully skipped for MVP - Artifact model doesn't support original DOCX type yet, will be added in future phases)

**Checkpoint**: User Story 1 fully functional - users can submit exams and track processing

---

## Phase 4: User Story 2 - System validates file format and metadata before processing (Priority: P2)

**Goal**: Prevent invalid data entry by validating DOCX format, required fields presence, field constraints (lengths, types, ranges), and rejecting invalid submissions with clear error messages.

**Independent Test**: Submit forms with invalid inputs (non-DOCX files, missing fields, exceeded lengths, invalid types) → verify each returns 400 Bad Request with specific validation error message, no DB records created, no files uploaded.

### Tests for User Story 2 (MANDATORY - Write FIRST, ensure they FAIL) ✅

- [X] T028 [P] [US2] Unit tests for file validation in backend/tests/unit/services/test_exam_service.py (test validate_docx_file with PDF, TXT, corrupted files - expect ValidationError)
- [X] T029 [P] [US2] Contract tests for validation errors in backend/tests/contract/test_exams_api.py (test 400 responses for: missing name, name > 500 chars, num_variants = 0, duration_minutes = -5, file > 50MB, non-DOCX file)
- [X] T030 [P] [US2] Integration tests for validation failures in backend/tests/integration/test_exam_upload.py (test no DB records or files created after validation failure)

### Implementation for User Story 2

- [X] T031 [P] [US2] Implement file validation function in backend/app/services/exam_service.py: validate_docx_file (check file size ≤ 50MB, check MIME type = application/vnd.openxmlformats-officedocument.wordprocessingml.document, check extension .docx, raise HTTPException 400 with specific error message)
- [X] T032 [US2] Add file validation call in POST /api/v1/exams endpoint in backend/app/api/v1/endpoints/exams.py before ExamService.create_exam_with_upload (validate file parameter not None, call validate_docx_file)
- [X] T033 [US2] Add Pydantic field validators to ExamCreate schema in backend/app/schemas/exam.py (add custom error messages for each field constraint per contracts/exams_post.md)

**Checkpoint**: Validation prevents all invalid submissions - data integrity ensured

---

## Phase 5: User Story 3 - System organizes uploaded files in user-specific storage paths (Priority: P2)

**Goal**: Organize DOCX files in structured paths following `exams/{user_id}/{exam-name-kebab}/original.docx` pattern using artifact_paths utilities, ensuring files organized by user/exam, preventing naming collisions, enabling efficient retrieval.

**Independent Test**: Submit exams with various user IDs and exam names → verify files in storage at paths matching expected pattern with properly kebab-cased exam names, subsequent requests use artifact_paths.py to construct retrieval URLs.

### Tests for User Story 3 (MANDATORY - Write FIRST, ensure they FAIL) ✅

- [X] T034 [P] [US3] Unit tests for storage path generation in backend/tests/unit/services/test_exam_service.py (test generate_exam_file_path with Vietnamese characters, special characters, spaces - verify kebab-case output and user_id inclusion)
- [X] T035 [P] [US3] Integration tests for path structure in backend/tests/integration/test_exam_upload.py (test two users with same exam name create separate paths, verify no collisions)

### Implementation for User Story 3

- [X] T036 [US3] Implement generate_exam_file_path function in backend/app/services/exam_service.py using artifact_paths.generate_storage_path utility (input: user_id, exam_name; output: exams/{user_id}/{exam-name-kebab}/original.docx)
- [X] T037 [US3] Integrate generate_exam_file_path in ExamService.create_exam_with_upload in backend/app/services/exam_service.py (use generated path for storage upload, store path in Artifact record)
- [ ] T038 [US3] Add file path to API response for future retrieval (optional) in backend/app/api/v1/endpoints/exams.py

**Checkpoint**: Files organized systematically - multi-tenancy and collision prevention working

---

## Phase 6: User Story 4 - System provides meaningful error responses for storage and database failures (Priority: P3)

**Goal**: Handle storage failures (network issues, unavailable, permission denied) and database failures (connection timeout, constraint violation) by rolling back partial operations, returning appropriate HTTP status codes (500, 503), logging detailed errors, providing user-friendly messages without exposing internals.

**Independent Test**: Simulate failure scenarios (mock storage errors, DB connection failures, partial failures) → verify correct status codes, rollback behavior (no orphaned records), error logging, user-facing error messages.

### Tests for User Story 4 (MANDATORY - Write FIRST, ensure they FAIL) ✅

- [ ] T039 [P] [US4] Unit tests for error handling in backend/tests/unit/services/test_exam_service.py (test storage unavailable → raises HTTPException 503 and no DB records, DB failure after file upload → deletes file and raises 500, Celery enqueue failure → logs error and raises 500)
- [ ] T040 [P] [US4] Contract tests for error responses in backend/tests/contract/test_exams_api.py (test 503 for storage unavailable, 500 for DB failure, 504 for timeout, 507 for quota exceeded)
- [ ] T041 [P] [US4] Integration tests for transaction rollback in backend/tests/integration/test_exam_upload.py (test exam created but task creation fails → exam rolled back, file uploaded but DB fails → file deleted)

### Implementation for User Story 4

- [ ] T042 [US4] Add exception handling for storage errors in ExamService.create_exam_with_upload in backend/app/services/exam_service.py (catch boto3 exceptions, map to HTTPException 503 with user-friendly message, log detailed error with stack trace)
- [ ] T043 [US4] Add transaction rollback logic in ExamService.create_exam_with_upload in backend/app/services/exam_service.py (wrap DB operations in try-except, rollback on failure, call storage delete_file if transaction fails after upload)
- [ ] T044 [US4] Add exception handling for database errors in backend/app/api/v1/endpoints/exams.py (catch SQLAlchemy exceptions, return HTTPException 500 with generic user message, log detailed error)
- [ ] T045 [US4] Add exception handling for Celery enqueue failures in ExamService.create_exam_with_upload in backend/app/services/exam_service.py (catch Celery exceptions, log error, return 500 - note: record already committed, task can be manually requeued)
- [ ] T046 [P] [US4] Add structured logging throughout exam creation flow in backend/app/services/exam_service.py (log: upload start/success/failure, DB transaction start/commit/rollback, Celery enqueue success/failure with context: user_id, exam_name, file_size)

**Checkpoint**: Error handling robust - production-ready reliability with clear user feedback

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories and deployment readiness

### Frontend Integration

- [ ] T047 [P] Update ExamMetadataForm component in frontend/src/components/sections/ExamMetadataForm.tsx to add grade_level field (dropdown with common grade levels)
- [ ] T048 [P] Update ExamMetadataForm component in frontend/src/components/sections/ExamMetadataForm.tsx to add duration field (number input for minutes)
- [ ] T049 Update exam creation page in frontend/src/app/exams/create/page.tsx to map form fields to API contract (examName → name, notes → instructions, add gradeLevel and duration)
- [ ] T050 [P] Update ExamMetadata type interface in frontend/src/types/index.ts to include gradeLevel and duration properties
- [ ] T051 [P] Add frontend validation for duration field in frontend/src/components/sections/ExamMetadataForm.tsx (must be positive integer, reasonable range 15-300 minutes)

### Documentation & Validation

- [ ] T052 [P] Update backend README in backend/README.md with Feature 004 endpoints and storage configuration
- [ ] T053 [P] Run quickstart validation per specs/004-exam-upload-api/quickstart.md (verify migrations, test API endpoint, check storage upload, verify Celery task)
- [ ] T054 [P] Generate OpenAPI spec and verify POST /api/v1/exams appears correctly in Swagger UI at http://localhost:8000/docs

### Code Quality

- [ ] T055 [P] Run pytest with coverage for all new tests: `pytest --cov=app --cov-report=html`
- [ ] T056 [P] Verify test coverage ≥ 80% for new modules (exam_service.py, storage.py, endpoints/exams.py)
- [ ] T057 [P] Run linting on new code: `ruff check backend/app/` and fix any issues
- [ ] T058 [P] Run type checking: `mypy backend/app/` and fix any type errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T005) - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational (T006-T019) completion
  - US1, US2, US3, US4 can proceed in parallel after foundational phase (if staffed)
  - Or sequentially in priority order: US1 (P1) → US2 (P2) → US3 (P2) → US4 (P3)
- **Polish (Phase 7)**: Depends on US1 completion minimum (MVP), ideally all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - **THIS IS MVP**
- **User Story 2 (P2)**: Enhances US1 with validation - Can start after Foundational or after US1
- **User Story 3 (P2)**: Enhances US1 with path organization - Can start after Foundational or after US1
- **User Story 4 (P3)**: Adds production reliability - Should start after US1 is working

### Within Each User Story

1. **Tests FIRST** (Constitution requirement) - All test tasks must FAIL before implementation
2. **Models** before services (Foundational phase handles model updates)
3. **Services** before endpoints
4. **Core implementation** before error handling
5. **Story checkpoint** verified before moving to next priority

### Parallel Opportunities Within Phases

**Phase 1 (Setup)**: T002, T003 can run in parallel (independent tasks)

**Phase 2 (Foundational)**:
- T012-T015 (Pydantic schema updates) can run in parallel
- T017-T019 (Storage infrastructure) can run in parallel with T012-T015
- Database migrations (T006-T011) must be sequential

**Phase 3 (US1 Tests)**: T020, T021, T022, T023 can all run in parallel (different test files)

**Phase 4 (US2 Tests)**: T028, T029, T030 can all run in parallel

**Phase 5 (US3 Tests)**: T034, T035 can run in parallel

**Phase 6 (US4 Tests)**: T039, T040, T041 can all run in parallel

**Phase 7 (Polish)**: T047-T048, T050-T051, T052-T054, T055-T058 can all run in parallel (different files/concerns)

### Suggested MVP Scope (Deliver First)

For fastest MVP delivery, implement in this order:
1. **Phase 1 + 2** (Setup & Foundational) - T001 through T019
2. **Phase 3** (US1 - Core upload functionality) - T020 through T027
3. **Phase 7 (Partial)** - T049 (Frontend integration), T053 (Quickstart validation), T055-T056 (Test coverage)

**MVP Validation**: After completing above, users can submit exams via API and verify full flow works.

**Post-MVP Enhancements**: Add US2 (validation), US3 (path organization), US4 (error handling) sequentially.

---

## Implementation Strategy

### Test-Driven Development (TDD) - MANDATORY

Per Constitution Principle IX, **ALL test tasks must be completed and FAILING before implementation**:

1. Write unit tests for service layer → Run pytest → Tests FAIL (no implementation yet)
2. Write contract tests for API endpoints → Run pytest → Tests FAIL
3. Write integration tests for full flow → Run pytest → Tests FAIL
4. Implement service logic → Run pytest → Unit tests PASS
5. Implement API endpoint → Run pytest → Contract tests PASS
6. Complete integration → Run pytest → Integration tests PASS

### Incremental Delivery

- **Week 1**: Phase 1 + 2 (Foundation) → Database ready, schemas updated
- **Week 2**: Phase 3 (US1 MVP) → Core functionality working end-to-end
- **Week 3**: Phase 4 + 5 (US2 + US3 validation & organization) → Production-grade validation
- **Week 4**: Phase 6 (US4 error handling) + Phase 7 (Polish) → Production-ready deployment

### Quality Gates

Before marking any user story complete:
- ✅ All tests for that story PASS
- ✅ Test coverage ≥ 80% for new code in that story
- ✅ Independent test (from spec.md) manually verified
- ✅ Linting passes (ruff check)
- ✅ Type checking passes (mypy)

---

## Task Summary

- **Total Tasks**: 58
- **Setup**: 5 tasks
- **Foundational**: 14 tasks (blocks all stories)
- **User Story 1 (P1 - MVP)**: 8 tasks (4 tests + 4 implementation)
- **User Story 2 (P2)**: 6 tasks (3 tests + 3 implementation)
- **User Story 3 (P2)**: 5 tasks (2 tests + 3 implementation)
- **User Story 4 (P3)**: 8 tasks (3 tests + 5 implementation)
- **Polish**: 12 tasks

**Parallel Opportunities**: 32 tasks marked [P] can run concurrently (different files, no blocking dependencies)

**MVP Task Count**: 19 tasks (Phase 1 + Phase 2 + US1 core)

**Test Coverage**: 12 test task groups covering unit, contract, and integration levels per Constitution requirements
