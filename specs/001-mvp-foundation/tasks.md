# Tasks: Initialize SiroMix V2 MVP Foundation

**Feature**: 001-mvp-foundation  
**Input**: Design documents from `/specs/001-mvp-foundation/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-v1.md, quickstart.md

**Tests**: Tests are **MANDATORY** per Constitution Principle IX. Unit tests are required for all features/functions.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1=OAuth, US2=Task Workflow, US3=Monitoring/Retry, US4=Frontend UI)
- Include exact file paths in descriptions

## Path Conventions

This is a monorepo with:
- **Backend**: `backend/` (Python 3.11+, FastAPI, SQLAlchemy, Celery)
- **Frontend**: `frontend/` (Next.js 14+, TypeScript, React 18+)
- **Infrastructure**: `infra/` (Docker Compose, etc.)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and monorepo structure

- [X] T001 Create monorepo directory structure: backend/, frontend/, infra/, specs/, .specify/, .github/
- [X] T002 [P] Initialize backend Python project in backend/ with pyproject.toml, configure Poetry/pip dependencies (FastAPI, SQLAlchemy, Celery, google-auth, pytest)
- [X] T003 [P] Initialize frontend Next.js 14 project in frontend/ with package.json, configure TypeScript, Tailwind CSS, NextAuth
- [X] T004 [P] Create infra/docker-compose.yml with services: postgres, redis, backend, frontend, worker
- [X] T005 [P] Setup backend testing framework: pytest, pytest-asyncio, httpx in backend/tests/conftest.py
- [X] T006 [P] Setup frontend testing framework: Vitest, React Testing Library in frontend/vitest.config.ts
- [X] T007 [P] Create .env.example with all required environment variables (GOOGLE_CLIENT_ID, DATABASE_URL, REDIS_URL, etc.)
- [X] T008 [P] Configure linting: Ruff/Black for backend, ESLint/Prettier for frontend

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Create database models in backend/app/models/__init__.py: import User, Task, TaskLog
- [X] T010 [P] Implement User model in backend/app/models/user.py with fields: user_id, google_sub, email, display_name, created_at, updated_at
- [X] T011 [P] Implement Task model in backend/app/models/task.py with fields: task_id, user_id, status, current_stage, progress, retry_count_by_stage, error, created_at, updated_at
- [X] T012 [P] Implement TaskLog model in backend/app/models/task_log.py with fields: log_id, task_id, stage, level, message, data_json, timestamp
- [X] T013 Setup Alembic in backend/alembic/ and create initial migration for User, Task, TaskLog tables
- [X] T014 [P] Create Pydantic schemas in backend/app/schemas/user.py: UserCreate, UserResponse
- [X] T015 [P] Create Pydantic schemas in backend/app/schemas/task.py: TaskCreate, TaskResponse, TaskStatus, TaskStage enums
- [X] T016 [P] Create Pydantic schemas in backend/app/schemas/task_log.py: TaskLogResponse, LogLevel enum
- [X] T017 [P] Implement database connection setup in backend/app/core/database.py with async SQLAlchemy engine and session factory
- [X] T018 [P] Implement core auth utilities in backend/app/core/auth.py: verify_google_token function using google-auth library
- [X] T019 [P] Create FastAPI dependency in backend/app/core/deps.py: get_current_user that verifies token and returns User
- [X] T020 Setup FastAPI app structure in backend/app/main.py: create app, include routers, configure CORS
- [X] T021 [P] Create Redis connection setup in backend/app/core/redis.py for Celery broker
- [X] T022 [P] Create Celery app configuration in backend/app/tasks/celery_app.py with Redis broker and result backend
- [X] T023 [P] Setup test fixtures in backend/tests/conftest.py: async database session, test user, mock Google token
- [X] T024 [P] Create test utilities in backend/tests/utils.py: create_test_user, create_test_task, mock_google_token_verify

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Google OAuth Authentication (Priority: P1) 🎯 MVP

**Goal**: Enable users to sign in with Google OAuth, verify ID tokens on backend, and create/retrieve user records

**Independent Test**: Complete OAuth flow in browser, verify token is stored, call GET /api/v1/me, confirm user identity is returned. Test 401 rejection for invalid tokens.

### Tests for User Story 1 (MANDATORY per Constitution) ✅

> **CONSTITUTION REQUIREMENT: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T025 [P] [US1] Unit tests for User model in backend/tests/unit/test_user_model.py: test user creation, google_sub uniqueness
- [X] T026 [P] [US1] Unit tests for verify_google_token in backend/tests/unit/test_auth.py: test valid token, expired token, invalid signature
- [X] T027 [P] [US1] Contract test for GET /api/v1/me in backend/tests/contract/test_me_endpoint.py: test 200 with valid token, 401 without token
- [X] T028 [P] [US1] Integration test for auth flow in backend/tests/integration/test_auth_flow.py: test user creation on first login, user retrieval on subsequent logins

### Implementation for User Story 1

- [X] T029 [P] [US1] Implement user service in backend/app/services/user_service.py: get_or_create_user(google_sub, email, display_name)
- [X] T030 [US1] Implement GET /api/v1/me endpoint in backend/app/api/v1/endpoints/me.py using get_current_user dependency
- [X] T031 [US1] Create API router in backend/app/api/v1/api.py and include me endpoint
- [X] T032 [P] [US1] Configure NextAuth in frontend/src/app/api/auth/[...nextauth]/route.ts with Google Provider, store ID token in JWT callback
- [X] T033 [P] [US1] Create auth context in frontend/src/lib/auth/AuthContext.tsx: expose session and idToken
- [X] T034 [P] [US1] Create API client in frontend/src/lib/api/client.ts: fetch wrapper that adds Authorization: Bearer header
- [X] T035 [US1] Create login page in frontend/src/app/page.tsx with "Sign in with Google" button using NextAuth signIn
- [X] T036 [US1] Add authentication to frontend layout in frontend/src/app/layout.tsx: wrap with SessionProvider
- [ ] T037 [US1] Test full OAuth flow: frontend login → backend token verification → user creation → GET /api/v1/me returns user data

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Task Workflow Foundation (Priority: P2)

**Goal**: Enable task creation, enqueue to worker, process through mock pipeline stages with progress tracking and structured logging

**Independent Test**: Create task via API, verify "queued" status, observe worker process through 5 stages (extract_docx → ai_understanding → ai_analysis → shuffle → render_docx) with progress 0→20→40→60→80→100, check logs persisted, confirm "completed" status.

### Tests for User Story 2 (MANDATORY per Constitution) ✅

> **CONSTITUTION REQUIREMENT: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T038 [P] [US2] Unit tests for Task model in backend/tests/unit/test_task_model.py: test status transitions, progress constraints (0-100), retry_count_by_stage JSONB
- [ ] T039 [P] [US2] Unit tests for TaskLog model in backend/tests/unit/test_task_log_model.py: test log creation with stage/level/message/data_json
- [ ] T040 [P] [US2] Contract test for POST /api/v1/tasks in backend/tests/contract/test_create_task.py: test 201 response, task_id returned, queued status
- [ ] T041 [P] [US2] Unit tests for mock pipeline stages in backend/tests/unit/test_pipeline_stages.py: test each stage updates progress, logs structured messages
- [ ] T042 [P] [US2] Integration test for worker in backend/tests/integration/test_worker_pipeline.py: test task goes queued→running→completed, logs persisted, simulate_failure_stage works

### Implementation for User Story 2

- [ ] T043 [P] [US2] Implement task service in backend/app/services/task_service.py: create_task(user_id, simulate_failure_stage) - creates Task and enqueues Celery task
- [ ] T044 [P] [US2] Implement task log service in backend/app/services/task_log_service.py: create_log(task_id, stage, level, message, data_json)
- [ ] T045 [US2] Implement POST /api/v1/tasks endpoint in backend/app/api/v1/endpoints/tasks.py using get_current_user and task_service
- [ ] T046 [US2] Update API router in backend/app/api/v1/api.py to include tasks endpoints
- [ ] T047 [P] [US2] Implement mock pipeline stages in backend/app/tasks/pipeline_stages.py: extract_docx, ai_understanding, ai_analysis, shuffle, render_docx functions (each sleeps 3-5s, updates progress +20%)
- [ ] T048 [US2] Implement Celery worker task in backend/app/tasks/process_task.py: process_task(task_id) - orchestrates all 5 stages, updates Task status/current_stage/progress, handles simulate_failure_stage
- [ ] T049 [US2] Implement structured logging in backend/app/tasks/process_task.py: call task_log_service.create_log at stage start/end with appropriate level and data_json
- [ ] T050 [US2] Update Task model status to "running" when worker picks up task, update current_stage on each stage entry
- [ ] T051 [US2] Implement error handling in backend/app/tasks/process_task.py: catch exceptions, set Task.status="failed", set Task.error to exception message
- [ ] T052 [US2] Test worker locally: start Celery worker, create task via API, observe logs in console, verify database shows completed task with logs

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently (can create tasks and watch them process)

---

## Phase 5: User Story 3 - Task Progress Monitoring & Retry (Priority: P3)

**Goal**: Enable polling of task status/progress/logs and retrying failed tasks from the failed stage with incremented retry count

**Independent Test**: Create task with simulated failure, poll until failure occurs, verify error details returned, call retry endpoint, confirm task resumes from failed stage and completes successfully on retry.

### Tests for User Story 3 (MANDATORY per Constitution) ✅

> **CONSTITUTION REQUIREMENT: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T053 [P] [US3] Contract test for GET /api/v1/tasks/{task_id} in backend/tests/contract/test_get_task.py: test 200 with task data, 404 for non-existent task, 403 for other user's task
- [ ] T054 [P] [US3] Contract test for POST /api/v1/tasks/{task_id}/retry in backend/tests/contract/test_retry_task.py: test 200 on failed task, 400 on completed/running task, 403 for other user's task
- [ ] T055 [P] [US3] Unit tests for retry logic in backend/tests/unit/test_retry_logic.py: test retry_count_by_stage increments, status changes to "running", error cleared
- [ ] T056 [P] [US3] Integration test for retry in backend/tests/integration/test_retry_flow.py: test task fails at stage, retry resumes from that stage, retry_count increments, completes on retry

### Implementation for User Story 3

- [ ] T057 [P] [US3] Implement get_task service method in backend/app/services/task_service.py: get_task_with_logs(task_id, user_id) - returns Task with recent 50 logs, raises 404/403
- [ ] T058 [P] [US3] Implement retry_task service method in backend/app/services/task_service.py: retry_task(task_id, user_id) - validates status="failed", increments retry_count_by_stage, resets status to "running", re-enqueues Celery task
- [ ] T059 [US3] Implement GET /api/v1/tasks/{task_id} endpoint in backend/app/api/v1/endpoints/tasks.py: calls get_task_with_logs, returns TaskResponse with logs array
- [ ] T060 [US3] Implement POST /api/v1/tasks/{task_id}/retry endpoint in backend/app/api/v1/endpoints/tasks.py: calls retry_task, returns updated TaskResponse
- [ ] T061 [US3] Add ownership validation in task service: raise HTTPException(403) if task.user_id != authenticated_user.user_id
- [ ] T062 [US3] Implement idempotent retry logic: POST retry on completed/running task returns 400 with message "Task is not in failed state"
- [ ] T063 [US3] Update worker process_task to handle retry: resume from Task.current_stage instead of starting from extract_docx
- [ ] T064 [US3] Test retry flow: create task with simulate_failure_stage="ai_understanding", wait for failure, call retry, verify completes successfully and retry_count_by_stage["ai_understanding"]=1

**Checkpoint**: All backend user stories (US1-US3) should now be independently functional

---

## Phase 6: User Story 4 - Frontend Task Management UI (Priority: P4)

**Goal**: Provide user interface for login, creating tasks, monitoring progress with real-time updates, viewing logs, and retrying failed tasks

**Independent Test**: Complete full user flow in browser: login with Google, see dashboard, click "Create Task", watch progress bar and logs update in real-time (polling every 2-3s), observe completion or failure, test retry button on failure, confirm successful completion after retry.

### Tests for User Story 4 (Optional - Playwright E2E) ✅

> **Note**: Frontend unit tests for components are recommended. E2E tests with Playwright are optional but valuable for this story.

- [ ] T065 [P] [US4] Frontend component tests in frontend/src/components/__tests__/: test Login, Dashboard, TaskProgress, ProgressBar, LogViewer components render correctly
- [ ] T066 [P] [US4] Frontend E2E test (optional) in frontend/tests/e2e/task-lifecycle.spec.ts: test full flow from login to task creation to completion using Playwright

### Implementation for User Story 4

- [ ] T067 [P] [US4] Create Dashboard page in frontend/src/app/dashboard/page.tsx with "Create Task" button and task list placeholder
- [ ] T068 [P] [US4] Create TaskProgress page in frontend/src/app/tasks/[taskId]/page.tsx with status, progress bar, stage indicator, log viewer, retry button
- [ ] T069 [P] [US4] Create ProgressBar component in frontend/src/components/ProgressBar.tsx: displays progress 0-100% with animated bar
- [ ] T070 [P] [US4] Create StageIndicator component in frontend/src/components/StageIndicator.tsx: shows 5 stage boxes with current stage highlighted
- [ ] T071 [P] [US4] Create LogViewer component in frontend/src/components/LogViewer.tsx: scrollable list of logs with level badges (info/warning/error)
- [ ] T072 [P] [US4] Create StatusBadge component in frontend/src/components/StatusBadge.tsx: color-coded badges for queued/running/completed/failed
- [ ] T073 [US4] Implement createTask API call in frontend/src/lib/api/tasks.ts: POST /api/v1/tasks with Authorization header
- [ ] T074 [US4] Implement getTask API call in frontend/src/lib/api/tasks.ts: GET /api/v1/tasks/{taskId} with Authorization header
- [ ] T075 [US4] Implement retryTask API call in frontend/src/lib/api/tasks.ts: POST /api/v1/tasks/{taskId}/retry with Authorization header
- [ ] T076 [US4] Implement polling logic in frontend/src/hooks/useTaskPolling.ts: useEffect with setInterval (2-3s), cleanup on unmount, stop polling when task completed/failed
- [ ] T077 [US4] Connect Dashboard to createTask: on button click, call API, navigate to TaskProgress page
- [ ] T078 [US4] Connect TaskProgress page to polling: call useTaskPolling hook, update UI on each poll response
- [ ] T079 [US4] Connect retry button to retryTask: on click, call API, resume polling to show retry progress
- [ ] T080 [US4] Add error handling to all API calls: display toast/alert on network errors, show 401 → redirect to login
- [ ] T081 [US4] Add loading states: show spinner while task.status="queued" or "running", disable retry button while loading
- [ ] T082 [US4] Test full UI flow: sign in, create task, watch progress update every 2-3s, simulate failure (checkbox on create), retry, and observe success

**Checkpoint**: All user stories (US1-US4) should now be independently functional. Full end-to-end flow works.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and ensure production-readiness

- [ ] T083 [P] Add comprehensive error handling middleware in backend/app/core/middleware.py: catch all exceptions, return consistent JSON error format
- [ ] T084 [P] Add request/response logging middleware in backend/app/core/middleware.py: log all API requests with duration and status code
- [ ] T085 [P] Implement graceful shutdown for Celery worker in backend/app/tasks/celery_app.py: handle SIGTERM to finish current task before exit
- [ ] T086 [P] Add API versioning notes to backend/app/main.py: document /api/v1 prefix and future v2 strategy
- [ ] T087 [P] Create README.md in repository root: link to quickstart.md, explain monorepo structure, list key commands
- [ ] T088 [P] Create backend/README.md: explain API structure, how to run migrations, how to start worker
- [ ] T089 [P] Create frontend/README.md: explain component structure, how to configure NextAuth
- [ ] T090 [P] Add health check endpoint in backend/app/api/v1/endpoints/health.py: GET /api/v1/health returns 200 with database/redis connection status
- [ ] T091 [P] Add frontend environment validation in frontend/src/lib/env.ts: throw error if GOOGLE_CLIENT_ID or API_BASE_URL missing
- [ ] T092 [P] Write integration tests in backend/tests/integration/test_full_lifecycle.py: test complete task lifecycle from creation through all stages to completion
- [ ] T093 [P] Write integration test for failure/retry in backend/tests/integration/test_failure_retry.py: create task with simulate_failure, verify failure, retry, verify success
- [ ] T094 Run all unit and integration tests: `pytest backend/tests/` - ensure 100% pass rate
- [ ] T095 Validate quickstart.md: follow steps in quickstart.md from fresh clone, verify all services start, test OAuth flow, create and complete task
- [ ] T096 [P] Performance check: measure task creation (<200ms), task polling (<100ms), mock pipeline duration (15-25s total)
- [ ] T097 [P] Security audit: verify all protected endpoints require auth, test 401/403 responses, check CORS configuration
- [ ] T098 Code cleanup: remove console.logs, unused imports, commented code; run linters (Ruff, ESLint)
- [ ] T099 Documentation review: ensure all docstrings present on public functions, update API documentation if needed
- [ ] T100 Final manual test: complete entire user journey from fresh login to task creation to monitoring to retry

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - OAuth)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2 - Task Workflow)**: Can start after Foundational (Phase 2) - Uses User model from US1 but independently testable
- **User Story 3 (P3 - Monitoring/Retry)**: Can start after Foundational (Phase 2) - Extends endpoints from US2 but independently testable
- **User Story 4 (P4 - Frontend UI)**: Can start after Foundational (Phase 2) - Consumes APIs from US1-US3 but backend can be tested with curl/Postman first

**Recommended MVP Approach**: Complete Phase 1 → Phase 2 → Phase 3 (US1 only) → Validate → Add more stories incrementally

### Within Each User Story

1. Tests MUST be written and FAIL before implementation (TDD approach per Constitution)
2. Models before services (services depend on models)
3. Services before endpoints (endpoints depend on services)
4. Core implementation before integration (e.g., task creation before worker)
5. Story complete and tested before moving to next priority

### Parallel Opportunities

**Setup Phase (Phase 1)**:
- All tasks marked [P] can run in parallel (T002-T008)

**Foundational Phase (Phase 2)**:
- T010, T011, T012 (models) can run in parallel
- T014, T015, T016 (schemas) can run in parallel after models
- T017, T018, T019, T021, T022 (infrastructure) can run in parallel
- T023, T024 (test utilities) can run in parallel after database setup

**User Story 1 (Phase 3)**:
- T025, T026 (unit tests) can run in parallel
- T027, T028 (contract/integration tests) can run in parallel after unit tests
- T029 (user service) and T032, T033, T034 (frontend auth) can run in parallel
- T030, T031 (backend endpoint) and T035, T036 (frontend pages) can run in parallel

**User Story 2 (Phase 4)**:
- T038, T039, T040, T041 (tests) can run in parallel
- T043, T044, T047 (services and stages) can run in parallel
- T045, T046 (endpoints) depend on T043 completing

**User Story 3 (Phase 5)**:
- T053, T054, T055 (tests) can run in parallel
- T057, T058 (service methods) can run in parallel

**User Story 4 (Phase 6)**:
- T065, T066 (tests) can run in parallel
- T067-T072 (all UI components) can run in parallel
- T073-T075 (API calls) can run in parallel
- T076 (polling hook) depends on T074

**Polish Phase (Phase 7)**:
- T083-T099 (most polish tasks) can run in parallel as they touch different files

### Critical Path (Minimum Sequential Work)

```
T001 (structure)
→ T002 (backend init) → T009-T013 (models & migrations) → T020 (FastAPI app)
→ T032 (NextAuth) → T029 (user service) → T030 (me endpoint) → T037 (test OAuth)
→ T043 (task service) → T045 (create task endpoint) → T048 (worker) → T052 (test worker)
→ T057-T058 (get/retry services) → T059-T060 (get/retry endpoints) → T064 (test retry)
→ T067-T082 (frontend UI) → T095 (validate quickstart) → T100 (final test)
```

**Estimated Critical Path**: 35-40 tasks (out of 100) - significant parallelization possible with team

---

## Parallel Example: User Story 1 (OAuth)

```bash
# After Foundational Phase completes, launch User Story 1 tests in parallel:
- "Unit tests for User model in backend/tests/unit/test_user_model.py"
- "Unit tests for verify_google_token in backend/tests/unit/test_auth.py"

# Then launch User Story 1 backend AND frontend in parallel:
Backend team:
- "Implement user service in backend/app/services/user_service.py"
- "Implement GET /api/v1/me endpoint in backend/app/api/v1/endpoints/me.py"

Frontend team (parallel):
- "Configure NextAuth in frontend/src/app/api/auth/[...nextauth]/route.ts"
- "Create auth context in frontend/src/lib/auth/AuthContext.tsx"
- "Create API client in frontend/src/lib/api/client.ts"
- "Create login page in frontend/src/app/page.tsx"
```

---

## Parallel Example: User Story 2 (Task Workflow)

```bash
# After User Story 1 completes (or in parallel with US1 if separate team), launch US2 tests:
- "Unit tests for Task model in backend/tests/unit/test_task_model.py"
- "Unit tests for TaskLog model in backend/tests/unit/test_task_log_model.py"
- "Contract test for POST /api/v1/tasks in backend/tests/contract/test_create_task.py"

# Then launch services and stages in parallel:
- "Implement task service in backend/app/services/task_service.py"
- "Implement task log service in backend/app/services/task_log_service.py"
- "Implement mock pipeline stages in backend/app/tasks/pipeline_stages.py"

# Then endpoint and worker (worker depends on service):
- "Implement POST /api/v1/tasks endpoint in backend/app/api/v1/endpoints/tasks.py"
- "Implement Celery worker task in backend/app/tasks/process_task.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) - Fastest Path to Demo

**Duration**: ~3-5 days with 1 developer

1. ✅ Complete Phase 1: Setup (~4-6 hours)
2. ✅ Complete Phase 2: Foundational (~1-2 days)
3. ✅ Complete Phase 3: User Story 1 - OAuth (~1-2 days)
4. **STOP and VALIDATE**: Test OAuth flow end-to-end, demo sign-in
5. Deploy/demo authentication foundation

**Value**: Secure authentication foundation, ready to build on

### MVP Plus Core Workflow (User Stories 1-2) - Functional Demo

**Duration**: ~5-8 days with 1 developer, ~3-5 days with 2 developers

1. Complete Setup + Foundational (~2 days)
2. Add User Story 1 - OAuth (~2 days)
3. Add User Story 2 - Task Workflow (~2-3 days)
4. **STOP and VALIDATE**: Create task, watch worker process, verify completion
5. Deploy/demo task processing system

**Value**: Full backend task workflow, can demo pipeline concept

### Full MVP (User Stories 1-3) - Production-Ready Backend

**Duration**: ~8-12 days with 1 developer, ~5-7 days with 2 developers

1. Complete Setup + Foundational
2. Add User Story 1 - OAuth
3. Add User Story 2 - Task Workflow
4. Add User Story 3 - Monitoring/Retry
5. **STOP and VALIDATE**: Test full lifecycle with failure and retry
6. Deploy/demo complete backend API

**Value**: Complete backend with observability and error recovery

### Complete Feature (User Stories 1-4) - Full Application

**Duration**: ~12-16 days with 1 developer, ~7-10 days with 2-3 developers

1. Complete Setup + Foundational
2. Add User Story 1 - OAuth
3. Add User Story 2 - Task Workflow
4. Add User Story 3 - Monitoring/Retry
5. Add User Story 4 - Frontend UI
6. Add Phase 7 - Polish
7. **VALIDATE**: Follow quickstart.md, test everything, fix bugs
8. Deploy/demo complete application

**Value**: Full feature with user interface, ready for user testing

### Incremental Delivery Strategy

Each phase adds value without breaking previous phases:

- **Phase 1-2**: Foundation ready → Other features can now build on this
- **+ US1 (OAuth)**: Authentication works → Can secure any feature
- **+ US2 (Task Workflow)**: Tasks process → Can add real pipeline stages
- **+ US3 (Monitoring/Retry)**: Observability + recovery → Production-ready backend
- **+ US4 (Frontend UI)**: User interface → End users can interact
- **+ Phase 7 (Polish)**: Production-quality → Ready to ship

### Parallel Team Strategy

**With 2 Developers**:
- Dev 1: Phase 1-2 (days 1-2), then US1 backend (day 3), then US2 backend (days 4-5), then US3 (days 6-7)
- Dev 2: Phase 1-2 (days 1-2), then US1 frontend (day 3), then US4 frontend (days 4-7)
- Together: Phase 7 polish and testing (days 8-9)

**With 3 Developers**:
- Dev 1: Backend lead - Phase 1-2, US1 backend, US2 backend, US3 backend
- Dev 2: Frontend lead - Phase 1-2, US1 frontend, US4 frontend
- Dev 3: Testing + infrastructure - Phase 1-2, all test writing, Phase 7 polish

**Total Duration with 3 Developers**: ~5-7 days to complete everything

---

## Task Count Summary

- **Phase 1 (Setup)**: 8 tasks
- **Phase 2 (Foundational)**: 16 tasks
- **Phase 3 (User Story 1 - OAuth)**: 13 tasks
- **Phase 4 (User Story 2 - Task Workflow)**: 15 tasks
- **Phase 5 (User Story 3 - Monitoring/Retry)**: 12 tasks
- **Phase 6 (User Story 4 - Frontend UI)**: 18 tasks
- **Phase 7 (Polish)**: 18 tasks
- **TOTAL**: 100 tasks

**Parallel Tasks**: 62 tasks marked [P] (62% can run in parallel with proper team coordination)

**Test Tasks**: 21 tasks (21% of total) - mandatory per Constitution Principle IX

**MVP Minimum** (Setup + Foundational + US1): 37 tasks (~4-5 days solo)

---

## Notes

- ✅ All tasks follow strict checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
- ✅ All user stories are independently testable per specification requirements
- ✅ Tests are mandatory and written before implementation (TDD approach)
- ✅ Each task includes specific file paths for clear implementation guidance
- ✅ [P] marker indicates parallelizable tasks (different files, no blocking dependencies)
- ✅ [Story] label maps each task to its user story for traceability
- ✅ Constitution Principle IX (Unit Testing Mandatory) is enforced throughout
- ✅ Clear checkpoints after each phase for validation
- ✅ Incremental delivery strategy enables MVP-first approach
- ✅ Parallel execution guide shows team collaboration opportunities

**Recommended Workflow**:
1. Start with Phase 1 (Setup) - get infrastructure in place
2. Complete Phase 2 (Foundational) - this blocks all stories, so finish it fully
3. Pick User Story 1 (P1 - OAuth) for MVP - smallest valuable increment
4. Validate US1 independently before proceeding
5. Add US2 (Task Workflow) next - core business logic
6. Validate US1+US2 together
7. Continue incrementally through US3 and US4
8. Finish with Phase 7 (Polish) for production-readiness

**Success Criteria**: After completing all tasks, you should be able to:
- Clone repo, run `docker compose up`, have environment running in <5 minutes (SC-001)
- Complete Google OAuth flow in <30 seconds (SC-002)
- Create task with <200ms response time (SC-003)
- Process mock pipeline in 15-25 seconds (SC-004)
- Poll task status with <100ms response time (SC-005)
- See frontend updates within 3 seconds of backend changes (SC-006)
- Simulate failure and retry successfully (SC-007)
- Persist 10-20 structured log entries per task (SC-008)
- Retry is idempotent (SC-009)
- All invalid auth tokens rejected with 401 (SC-010)
- All unauthorized access blocked with 403 (SC-011)
- All database operations succeed with proper error handling (SC-012)
