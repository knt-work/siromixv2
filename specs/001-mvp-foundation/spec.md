# Feature Specification: Initialize SiroMix V2 MVP Foundation

**Feature Branch**: `001-mvp-foundation`  
**Created**: 2026-02-22  
**Status**: Draft  
**Input**: User description: "Feature 001: Initialize SiroMix V2 MVP foundation — monorepo skeleton, Google OAuth auth, and task-based workflow framework with a mock pipeline (no DOCX parsing, no AI yet)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Google OAuth Authentication (Priority: P1)

A developer or end-user visits the SiroMix V2 application for the first time. They click "Sign in with Google" and are redirected to Google's OAuth consent screen. After granting permissions, they are redirected back to the application with an authenticated session. The backend receives the Google ID token, verifies it, and creates or retrieves the user record based on the Google `sub` (subject identifier). Subsequent API requests include the ID token in the Authorization header, which the backend validates on each protected endpoint.

**Why this priority**: Authentication is the foundation of the entire system. Without user authentication, no other features can function securely. This establishes trust boundaries and enables user-specific task management.

**Independent Test**: Can be fully tested by completing Google OAuth flow in frontend, verifying token is stored, making an authenticated API call to `/api/v1/me`, and confirming user identity is returned. System should reject requests with invalid/missing tokens with 401 status.

**Acceptance Scenarios**:

1. **Given** user is not authenticated, **When** user clicks "Sign in with Google", **Then** user is redirected to Google OAuth consent screen
2. **Given** user approves Google OAuth consent, **When** redirect back to application occurs, **Then** frontend receives and stores Google ID token
3. **Given** authenticated user, **When** frontend makes API request with valid token, **Then** backend verifies token and returns 200 with user data
4. **Given** unauthenticated request, **When** frontend makes API request without token, **Then** backend returns 401 Unauthorized
5. **Given** authenticated user, **When** backend receives valid Google ID token, **Then** system creates or retrieves user record by google_sub
6. **Given** expired or invalid token, **When** API request is made, **Then** backend returns 401 and frontend redirects to login

---

### User Story 2 - Task Workflow Foundation (Priority: P2)

An authenticated user creates a new task through the API. The system enqueues the task and a background worker begins processing it through the mock pipeline stages: extract_docx → ai_understanding → ai_analysis → shuffle → render_docx. Each stage updates the task's status, current_stage, and progress (0-100%). The worker logs structured messages (stage, level, message, data_json) to the database. If an optional simulate_failure_stage parameter was provided, the worker simulates a failure at that stage with an error message. The task persists all state changes including retry counts per stage.

**Why this priority**: Task workflow is the core business logic of SiroMix. This establishes the pipeline architecture, async processing model, and observability patterns that all future document processing will build upon.

**Independent Test**: Can be fully tested by creating a task via API, verifying it enters "queued" status, observing worker pick it up and transition through all mock stages with progress updates, checking structured logs are persisted, and confirming task reaches "completed" status. Simulate-failure mode can be tested independently to verify error handling.

**Acceptance Scenarios**:

1. **Given** authenticated user, **When** user POSTs to `/api/v1/tasks`, **Then** system creates task with status "queued" and returns task_id
2. **Given** task is queued, **When** worker picks up task, **Then** task status changes to "running" and current_stage is "extract_docx"
3. **Given** task is running, **When** worker completes a stage, **Then** current_stage advances and progress increases (0→20→40→60→80→100)
4. **Given** task is in any stage, **When** worker processes stage, **Then** structured logs (stage, level, message, data_json) are persisted to database
5. **Given** all stages complete successfully, **When** final stage finishes, **Then** task status changes to "completed" and progress is 100
6. **Given** task with simulate_failure_stage parameter, **When** worker reaches that stage, **Then** task status changes to "failed", error message is set, and processing stops
7. **Given** stage completes (success or failure), **When** stage finishes, **Then** retry_count for that stage is recorded in retry_count_by_stage

---

### User Story 3 - Task Progress Monitoring & Retry (Priority: P3)

An authenticated user wants to monitor their task's progress. They poll GET `/api/v1/tasks/{task_id}` endpoint which returns the current status, stage, progress percentage, recent logs, and any error message. If a task failed at a particular stage, the user can inspect the error and logs to understand what happened. The user then POSTs to `/api/v1/tasks/{task_id}/retry` to restart processing from the failed stage. The system increments the retry count for that stage, resets the task status to "running", and the worker resumes processing. Retry operations are idempotent - retrying an already-running or completed task has no adverse effects.

**Why this priority**: Observability and recovery are essential for production systems. Users need visibility into what's happening and the ability to recover from transient failures without losing work or creating duplicate artifacts.

**Independent Test**: Can be fully tested by creating a task with simulated failure, polling until failure occurs, verifying error details are returned, calling retry endpoint, and confirming task resumes from failed stage and completes successfully on retry.

**Acceptance Scenarios**:

1. **Given** task exists, **When** user GETs `/api/v1/tasks/{task_id}`, **Then** response includes status, current_stage, progress, recent logs, error (if any), and timestamps
2. **Given** task is running, **When** user polls task status every 2 seconds, **Then** user observes progress incrementing and current_stage advancing
3. **Given** task failed at specific stage, **When** user inspects task, **Then** status is "failed", error message describes failure, and current_stage indicates failure point
4. **Given** task failed at stage X, **When** user POSTs to `/api/v1/tasks/{task_id}/retry`, **Then** task status changes to "running", current_stage resets to stage X, retry_count_by_stage[X] increments by 1
5. **Given** task was retried, **When** worker processes retry, **Then** processing resumes from failed stage and continues through remaining stages
6. **Given** task is already completed, **When** user calls retry endpoint, **Then** system returns appropriate response indicating retry is not applicable (idempotent behavior)
7. **Given** task is currently running, **When** user calls retry endpoint, **Then** system returns appropriate response indicating retry is not applicable (idempotent behavior)

---

### User Story 4 - Frontend Task Management UI (Priority: P4)

A user opens the frontend application and sees a login screen. After signing in with Google, they see a dashboard with a "Create Task" button. Clicking the button creates a new task via the API and navigates to a task progress view. The task progress view displays the current status, a progress bar showing percentage completion, the current pipeline stage with visual indicators, and a scrollable log view showing recent structured logs. If the task fails, a "Retry" button appears. Clicking retry calls the retry endpoint and resumes progress monitoring. The UI polls the backend every 2-3 seconds to refresh task status and logs.

**Why this priority**: User interface is the delivery mechanism but not core business logic. A minimal UI enables manual testing and demonstration, but the API-first approach means the backend can function independently.

**Independent Test**: Can be fully tested by completing full user flow in browser: login, create task, watch progress bar and logs update in real-time, observe completion or failure, test retry button on failure, and confirm successful completion after retry.

**Acceptance Scenarios**:

1. **Given** unauthenticated user visits app, **When** page loads, **Then** user sees "Sign in with Google" button
2. **Given** user signs in successfully, **When** auth completes, **Then** user sees dashboard with "Create Task" button
3. **Given** authenticated user on dashboard, **When** user clicks "Create Task", **Then** API request is made, task is created, and user is shown task progress view
4. **Given** user is on task progress view, **When** page loads, **Then** user sees task ID, status badge, progress bar, current stage indicator, and log viewer
5. **Given** task is running, **When** progress updates occur, **Then** progress bar animates, stage indicator updates, and new logs appear (polling every 2-3 seconds)
6. **Given** task completes successfully, **When** status changes to "completed", **Then** progress bar shows 100%, status badge shows "Completed", and no retry button appears
7. **Given** task fails, **When** status changes to "failed", **Then** status badge shows "Failed", error message is displayed, and "Retry" button appears
8. **Given** user sees retry button, **When** user clicks retry button, **Then** retry API call is made, progress view refreshes, and user observes task resuming

---

### Edge Cases

- What happens when Google OAuth redirect is cancelled or fails (network error, user denies consent)?
- How does system handle an ID token that becomes invalid mid-session (expired, revoked)?
- What happens when worker crashes or is terminated while processing a task?
- How does system handle multiple retry requests for the same task (idempotency)?
- What happens when task logs or state updates fail to persist to database?
- How does frontend handle polling failures or network interruptions during task monitoring?
- What happens when user creates multiple tasks concurrently?
- How does system handle worker queue backlog when many tasks are created simultaneously?
- What happens when Redis connection fails (job queue unavailable)?
- How does system handle database connection failures during task processing?

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication & Authorization
- **FR-001**: Frontend MUST implement Google OAuth 2.0 sign-in using NextAuth with Google Provider
- **FR-002**: Frontend MUST store Google ID token securely and include it in Authorization header as `Bearer <token>` for all protected API requests
- **FR-003**: Backend MUST verify Google ID token on every protected endpoint request using Google's token verification library
- **FR-004**: Backend MUST return 401 Unauthorized for requests with missing, expired, or invalid ID tokens
- **FR-005**: Backend MUST extract google_sub (subject identifier) from verified token and create or retrieve user record
- **FR-006**: System MUST store user records with at minimum: user_id (internal UUID), google_sub (Google's unique identifier), email, display name, timestamps

#### Task Workflow Framework
- **FR-007**: Backend MUST implement Task model with fields: task_id (UUID), user_id (FK to users), status (enum: queued/running/completed/failed), current_stage (enum), progress (integer 0-100), retry_count_by_stage (JSON), error (text), created_at, updated_at
- **FR-008**: System MUST define stage enum with values: extract_docx, ai_understanding, ai_analysis, shuffle, render_docx
- **FR-009**: Backend MUST implement TaskLog model with fields: log_id, task_id (FK), stage (enum), level (enum: info/warning/error), message (text), data_json (JSON), timestamp
- **FR-010**: Task creation endpoint MUST accept optional simulate_failure_stage parameter to trigger mock failure at specified stage
- **FR-011**: Worker MUST process tasks asynchronously using job queue (Redis + Celery/Dramatiq/RQ)
- **FR-012**: Worker MUST execute mock stages sequentially: extract_docx → ai_understanding → ai_analysis → shuffle → render_docx
- **FR-013**: Each mock stage MUST: update current_stage, increment progress by ~20%, sleep 2-5 seconds (simulating work), create structured log entries
- **FR-014**: Worker MUST persist structured logs to database with stage context, level, message, and optional data_json
- **FR-015**: Worker MUST update task status to "completed" when all stages finish successfully
- **FR-016**: Worker MUST update task status to "failed" with error message when simulate_failure_stage is reached or unexpected error occurs
- **FR-017**: System MUST track retry_count_by_stage as JSON mapping stage name to retry count (e.g., {"extract_docx": 0, "ai_understanding": 2})

#### API Endpoints
- **FR-018**: Backend MUST implement POST `/api/v1/tasks` endpoint (protected) that creates task, enqueues it, and returns task_id and initial status
- **FR-019**: Backend MUST implement GET `/api/v1/tasks/{task_id}` endpoint (protected) that returns task status, current_stage, progress, recent logs (last 50), error message, timestamps
- **FR-020**: Backend MUST implement POST `/api/v1/tasks/{task_id}/retry` endpoint (protected) that retries failed stage, increments retry count, and is idempotent
- **FR-021**: Backend MUST implement GET `/api/v1/me` endpoint (protected) that returns authenticated user information
- **FR-022**: All protected endpoints MUST verify user owns the task resource (task.user_id == authenticated_user_id) and return 403 if not

#### Frontend UI
- **FR-023**: Frontend MUST display Google OAuth sign-in button when user is not authenticated
- **FR-024**: Frontend MUST display dashboard with "Create Task" button after successful authentication
- **FR-025**: Frontend MUST display task progress view showing: task_id, status badge, progress bar (0-100%), current stage indicator, log viewer with scrollable list
- **FR-026**: Frontend MUST poll GET `/api/v1/tasks/{task_id}` every 2-3 seconds while task status is "queued" or "running"
- **FR-027**: Frontend MUST display "Retry" button when task status is "failed"
- **FR-028**: Frontend MUST call retry endpoint when user clicks retry button and resume polling

#### Infrastructure & Data
- **FR-029**: System MUST use monorepo structure with separate /frontend, /backend directories, and optional /shared and /infra directories
- **FR-030**: Backend MUST use PostgreSQL for persistent storage of users, tasks, and task_logs tables
- **FR-031**: Backend MUST use Redis for job queue and optional caching
- **FR-032**: System MUST provide Docker Compose configuration (optional but recommended) for local development with Postgres, Redis, backend, frontend, and worker services

### Key Entities

- **User**: Represents an authenticated user account. Attributes: user_id (internal UUID primary key), google_sub (Google's unique subject identifier, unique indexed), email (from Google token), display_name (from Google token), created_at, updated_at. Relationships: one-to-many with Task.

- **Task**: Represents a single document processing job. Attributes: task_id (UUID primary key), user_id (foreign key to User), status (enum: queued/running/completed/failed), current_stage (enum: extract_docx/ai_understanding/ai_analysis/shuffle/render_docx), progress (integer 0-100), retry_count_by_stage (JSON object mapping stage to count), error (nullable text for failure messages), created_at, updated_at. Relationships: belongs-to User, one-to-many with TaskLog.

- **TaskLog**: Represents a structured log entry for task processing. Attributes: log_id (integer primary key auto-increment), task_id (foreign key to Task), stage (enum matching Task stages), level (enum: info/warning/error), message (text description of event), data_json (nullable JSON for additional context), timestamp (when log was created). Relationships: belongs-to Task.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer can clone repository, run `docker compose up`, and have fully functional local environment running within 5 minutes
- **SC-002**: User can complete Google OAuth sign-in flow from initial page load to authenticated dashboard in under 30 seconds
- **SC-003**: Task creation request completes and returns task_id within 200 milliseconds
- **SC-004**: Mock pipeline processes a task through all 5 stages and reaches "completed" status within 15-25 seconds (simulating 3-5 seconds per stage)
- **SC-005**: Task status polling returns current state and logs within 100 milliseconds
- **SC-006**: Frontend UI displays real-time progress updates with no more than 3 second delay from backend state changes
- **SC-007**: System successfully handles simulated failures at any stage and allows retry to complete successfully
- **SC-008**: System correctly persists at least 10-20 structured log entries per task capturing all stage transitions
- **SC-009**: Retry operation is idempotent - retrying completed or running tasks returns appropriate response without side effects
- **SC-010**: Backend rejects 100% of requests with invalid or missing authentication tokens with 401 status
- **SC-011**: System prevents unauthorized access - users cannot view or retry tasks belonging to other users (403 status)
- **SC-012**: All database operations (task creation, status updates, log writes) complete successfully with proper error handling and rollback on failure

## Assumptions *(optional)*

- Google OAuth 2.0 configuration (client_id, client_secret) will be provided via environment variables or configuration files
- Frontend and backend will run on localhost during development (frontend on port 3000, backend on port 8000 are standard defaults)
- Redis will be available and accessible for job queue operations
- PostgreSQL database will be provisioned and migrations will be executed before first run
- Mock pipeline stages simulate work with sleep/delay but produce no actual output artifacts (no DOCX files, schemas, or AI responses)
- Worker process will run as a separate service/container that connects to the same Redis and Postgres instances
- Email addresses from Google OAuth are assumed to be valid and verified by Google
- Single concurrent task per user is acceptable for MVP (no queue limits or concurrency constraints needed initially)
- Task logs will be retrieved from database (not streamed) - acceptable for MVP with polling-based UI
- No sensitive data handling or PII encryption requirements beyond standard database security for MVP
- Retry logic handles transient failures but does not implement exponential backoff or retry limits (controlled manually via retry endpoint)

## Non-Functional Requirements *(optional)*

- **NFR-001**: Backend API must be versioned with `/api/v1` prefix to allow future API evolution
- **NFR-002**: All database tables must use timestamp fields (created_at, updated_at) for audit trails
- **NFR-003**: All API responses must use consistent JSON structure with proper HTTP status codes
- **NFR-004**: Environment-specific configuration (database URLs, Redis URLs, OAuth secrets) must be externalized via environment variables
- **NFR-005**: Code must follow language-specific conventions (PEP 8 for Python, ESLint/Prettier for TypeScript/JavaScript)
- **NFR-006**: Database migrations must be versioned and reversible
- **NFR-007**: Worker must gracefully handle shutdown signals without corrupting task state
- **NFR-008**: Frontend must provide user feedback for all async operations (loading states, error messages)

## Out of Scope *(optional)*

This feature explicitly excludes:

- Real DOCX file upload, parsing, or Document Intermediate JSON (DIJ) generation
- AI service integration, LLM calls, or canonical exam schema (NES) generation
- Actual shuffle algorithms or exam variant generation logic
- DOCX template rendering or output file generation
- Template management, storage, or selection
- User profile management beyond basic OAuth data
- Task filtering, search, or history views
- Task deletion or cancellation
- Email notifications or webhooks
- Rate limiting or quota management
- Multi-tenancy or organization/workspace features
- Admin panel or user management UI
- Advanced worker features: priority queues, dead letter queues, scheduled tasks
- Comprehensive error tracking or APM integration (Sentry, etc.)
- Production deployment configuration (Kubernetes, AWS, etc.)
