# Data Model: Initialize SiroMix V2 MVP Foundation

**Feature**: 001-mvp-foundation  
**Date**: 2026-02-22  
**Purpose**: Define canonical data entities and relationships for MVP foundation

---

## Overview

This feature introduces three core entities that form the foundation of the SiroMix V2 task processing system:
- **User**: Authenticated Google account holders
- **Task**: Asynchronous processing jobs through pipeline stages
- **TaskLog**: Structured observability logs for task execution

All entities use UUID primary keys (except TaskLog which uses serial integer for performance). Timestamps provide audit trails. JSONB columns enable flexible storage for retry metadata.

---

## Entity: User

### Purpose
Represents an authenticated user account linked to a Google identity. Users own tasks and are identified by Google's unique subject identifier (`google_sub`).

### Attributes

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| `user_id` | UUID | PK, NOT NULL | Internal unique identifier for user |
| `google_sub` | VARCHAR(255) | UNIQUE, NOT NULL, INDEXED | Google's unique subject identifier from ID token (immutable) |
| `email` | VARCHAR(255) | NOT NULL | User's email address from Google account |
| `display_name` | VARCHAR(255) | NULLABLE | User's full name from Google profile |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | When user record was created |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | When user record was last modified |

### Relationships
- **One-to-Many with Task**: A user can own multiple tasks (user → tasks)

### Indexes
- **Primary Key**: `user_id`
- **Unique Index**: `google_sub` (for fast lookup during auth)

### Business Rules
- `google_sub` is immutable once set (Google's unique identifier never changes)
- Email may change if user updates Google account, but `google_sub` remains stable
- User records are never deleted (soft delete pattern may be added later)

### Example Record
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "google_sub": "1234567890abcdefghij",
  "email": "user@example.com",
  "display_name": "John Doe",
  "created_at": "2026-02-22T10:30:00Z",
  "updated_at": "2026-02-22T10:30:00Z"
}
```

### Validation Rules
- `google_sub` must match pattern from Google tokens (numeric string, 21 chars typical)
- `email` must be valid email format (Google provides pre-validated emails)
- `display_name` may be null if not provided by Google

### Future Considerations
- Profile photo URL (not in MVP)
- User preferences (language, theme, etc.)
- Soft delete timestamp for account deactivation
- Last login tracking

---

## Entity: Task

### Purpose
Represents a single asynchronous processing job through the SiroMix pipeline. For MVP, tasks execute mock pipeline stages with progress tracking and error handling. Future versions will process actual DOCX documents through AI-powered stages.

### Attributes

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| `task_id` | UUID | PK, NOT NULL | Unique identifier for the task |
| `user_id` | UUID | FK → users.user_id, NOT NULL, INDEXED | Owner of the task |
| `status` | ENUM | NOT NULL, INDEXED | Current task status: `queued`, `running`, `completed`, `failed` |
| `current_stage` | ENUM | NULLABLE | Current pipeline stage: `extract_docx`, `ai_understanding`, `ai_analysis`, `shuffle`, `render_docx` |
| `progress` | INTEGER | NOT NULL, DEFAULT 0, CHECK (0-100) | Percentage completion (0-100) |
| `retry_count_by_stage` | JSONB | NOT NULL, DEFAULT '{}' | Map of stage name to retry count, e.g., `{"ai_understanding": 2}` |
| `error` | TEXT | NULLABLE | Error message if task failed |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | When task was created |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | When task was last modified |

### Enumerations

**TaskStatus**:
- `queued`: Task created, waiting for worker
- `running`: Worker is processing task
- `completed`: All stages finished successfully
- `failed`: Task failed at a stage

**TaskStage**:
- `extract_docx`: Extract document structure (mock in MVP)
- `ai_understanding`: Map to canonical schema (mock in MVP)
- `ai_analysis`: Add metadata/quality checks (mock in MVP)
- `shuffle`: Generate exam variants (mock in MVP)
- `render_docx`: Export final documents (mock in MVP)

### Relationships
- **Belongs-To User**: Each task is owned by one user (task → user via `user_id`)
- **One-to-Many with TaskLog**: A task has multiple log entries (task → logs)

### Indexes
- **Primary Key**: `task_id`
- **Index**: `user_id` (for fetching user's tasks)
- **Index**: `status` (for worker queries: "get queued tasks")
- **Index**: `created_at DESC` (for recent tasks, pagination)

### Business Rules
- `current_stage` is null when status is `queued`
- `current_stage` must be non-null when status is `running`
- `progress` must be 100 when status is `completed`
- `error` must be non-null when status is `failed`
- `retry_count_by_stage` tracks attempts per stage (incremented on retry)
- Status transitions: `queued` → `running` → `completed`/`failed` → (retry) → `running`

### Example Record (Running)
```json
{
  "task_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "current_stage": "ai_understanding",
  "progress": 40,
  "retry_count_by_stage": {
    "extract_docx": 0,
    "ai_understanding": 0
  },
  "error": null,
  "created_at": "2026-02-22T10:35:00Z",
  "updated_at": "2026-02-22T10:35:12Z"
}
```

### Example Record (Failed)
```json
{
  "task_id": "8d7f5689-8536-51ef-a855-f18ed2g01bf8",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "failed",
  "current_stage": "ai_understanding",
  "progress": 20,
  "retry_count_by_stage": {
    "extract_docx": 0,
    "ai_understanding": 1
  },
  "error": "Simulated failure at ai_understanding stage",
  "created_at": "2026-02-22T10:40:00Z",
  "updated_at": "2026-02-22T10:40:15Z"
}
```

### Validation Rules
- Progress must be integer between 0 and 100
- Status must be one of defined enum values
- Current stage must be one of defined enum values or null
- Retry count values must be non-negative integers

### State Transitions

```
           ┌─────────┐
           │ queued  │
           └────┬────┘
                │
         (worker picks up)
                │
                ▼
           ┌─────────┐
    ┌──────┤ running ├──────┐
    │      └─────────┘      │
    │                       │
(success)              (failure)
    │                       │
    ▼                       ▼
┌───────────┐         ┌──────────┐
│ completed │         │  failed  │
└───────────┘         └────┬─────┘
                           │
                      (user retry)
                           │
                           ▼
                      ┌─────────┐
                      │ running │
                      └─────────┘
```

### Future Considerations
- `input_artifact_id`: Reference to uploaded DOCX (future)
- `output_artifact_ids`: Array of generated document IDs (future)
- `canonical_schema_id`: Reference to NES (future)
- `simulate_failure_stage`: Move to request parameter, not persisted
- Task priority/queue management
- Scheduled/delayed start time
- Webhook notification URL

---

## Entity: TaskLog

### Purpose
Structured observability logs for task execution. Each log entry captures a specific event during task processing with stage context, severity level, human-readable message, and optional JSON data for debugging.

### Attributes

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| `log_id` | INTEGER | PK, SERIAL, NOT NULL | Auto-incrementing log entry ID |
| `task_id` | UUID | FK → tasks.task_id, NOT NULL, INDEXED | Task this log belongs to |
| `stage` | ENUM | NOT NULL | Pipeline stage when log was created (same values as Task.current_stage) |
| `level` | ENUM | NOT NULL | Log severity: `info`, `warning`, `error` |
| `message` | TEXT | NOT NULL | Human-readable log message |
| `data_json` | JSONB | NULLABLE | Additional structured data for debugging (JSON object) |
| `timestamp` | TIMESTAMP | NOT NULL, DEFAULT NOW() | When log entry was created |

### Enumerations

**LogLevel**:
- `info`: Informational message (stage start, progress update)
- `warning`: Non-critical issue (retry, slow operation)
- `error`: Error condition (validation failure, exception)

**Stage**: Same as Task.current_stage enum

### Relationships
- **Belongs-To Task**: Each log entry belongs to one task (log → task via `task_id`)
- Cascade delete: When task is deleted (future), logs are deleted

### Indexes
- **Primary Key**: `log_id`
- **Composite Index**: (`task_id`, `timestamp`) for efficient log retrieval ordered by time

### Business Rules
- Logs are append-only (never updated or deleted individually)
- `data_json` can contain arbitrary JSON for context (stack traces, variables, etc.)
- Stage must match one of the pipeline stages
- Timestamp is when log was created, not when event occurred (assume same for MVP)

### Example Records

```json
[
  {
    "log_id": 1,
    "task_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "stage": "extract_docx",
    "level": "info",
    "message": "Starting document extraction",
    "data_json": null,
    "timestamp": "2026-02-22T10:35:05Z"
  },
  {
    "log_id": 2,
    "task_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "stage": "extract_docx",
    "level": "info",
    "message": "Extraction complete",
    "data_json": {"blocks_extracted": 0, "duration_ms": 3200},
    "timestamp": "2026-02-22T10:35:08Z"
  },
  {
    "log_id": 3,
    "task_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "stage": "ai_understanding",
    "level": "warning",
    "message": "Mock stage: simulating processing delay",
    "data_json": {"sleep_seconds": 4},
    "timestamp": "2026-02-22T10:35:10Z"
  },
  {
    "log_id": 4,
    "task_id": "8d7f5689-8536-51ef-a855-f18ed2g01bf8",
    "stage": "ai_understanding",
    "level": "error",
    "message": "Simulated failure at ai_understanding stage",
    "data_json": {"error_code": "MOCK_FAILURE", "stage_index": 1},
    "timestamp": "2026-02-22T10:40:15Z"
  }
]
```

### Validation Rules
- Message must not be empty
- Level must be one of: info, warning, error
- Stage must match Task.current_stage enum values
- data_json must be valid JSON if present

### Query Patterns

**Fetch recent logs for task**:
```sql
SELECT * FROM task_logs
WHERE task_id = ?
ORDER BY timestamp DESC
LIMIT 50;
```

**Count errors per stage (analytics)**:
```sql
SELECT stage, COUNT(*) as error_count
FROM task_logs
WHERE level = 'error' AND task_id = ?
GROUP BY stage;
```

### Future Considerations
- Log retention policy (archive old logs)
- Full-text search on message field
- Correlation IDs for distributed tracing
- Separate error tracking system (Sentry integration)
- Log sampling for high-volume tasks

---

## Entity Relationships Diagram

```
┌─────────────────────┐
│       User          │
│─────────────────────│
│ user_id (PK)        │
│ google_sub (UNIQUE) │
│ email               │
│ display_name        │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │
           │ 1:N
           │ owns
           │
           ▼
┌─────────────────────────┐
│       Task              │
│─────────────────────────│
│ task_id (PK)            │
│ user_id (FK)            │
│ status                  │
│ current_stage           │
│ progress                │
│ retry_count_by_stage    │
│ error                   │
│ created_at              │
│ updated_at              │
└──────────┬──────────────┘
           │
           │ 1:N
           │ has
           │
           ▼
┌─────────────────────────┐
│      TaskLog            │
│─────────────────────────│
│ log_id (PK)             │
│ task_id (FK)            │
│ stage                   │
│ level                   │
│ message                 │
│ data_json               │
│ timestamp               │
└─────────────────────────┘
```

---

## Database Migration Strategy

### Initial Migration (001_create_foundation_tables.py)

Creates all three tables with constraints and indexes:

1. Create `users` table
   - Add unique constraint on `google_sub`
   - Add index on `google_sub`

2. Create `tasks` table
   - Add foreign key to `users`
   - Add check constraint on `progress` (0-100)
   - Add indexes on `user_id`, `status`, `created_at`

3. Create `task_logs` table
   - Add foreign key to `tasks` with ON DELETE CASCADE
   - Add composite index on (`task_id`, `timestamp`)

### Rollback Strategy

All tables can be dropped in reverse order (task_logs → tasks → users) due to foreign key constraints.

---

## Data Access Patterns

### Authentication Flow
1. Frontend sends Google ID token
2. Backend verifies token, extracts `google_sub`
3. Query: `SELECT * FROM users WHERE google_sub = ?`
4. If not found, INSERT new user record
5. Return user_id for subsequent requests

### Task Creation
1. Frontend requests new task
2. Backend creates Task record: `status=queued, progress=0`
3. Enqueue Celery task with task_id
4. Return task_id to frontend

### Worker Processing
1. Worker receives task_id from queue
2. Query: `SELECT * FROM tasks WHERE task_id = ?`
3. Update: `status=running, current_stage=extract_docx`
4. For each stage:
   - INSERT log entries as processing occurs
   - UPDATE progress and current_stage
5. Final update: `status=completed, progress=100` OR `status=failed, error=...`

### Frontend Polling
1. Poll every 2-3 seconds: `GET /api/v1/tasks/{task_id}`
2. Query task + recent 50 logs (JOIN or two queries)
3. Return task status, progress, stage, logs
4. Stop polling when status is terminal (completed/failed)

### Task Retry
1. Frontend POSTs to `/api/v1/tasks/{task_id}/retry`
2. Query: `SELECT * FROM tasks WHERE task_id = ? AND status = 'failed'`
3. Update: `status=running, error=null, retry_count_by_stage.{failed_stage} += 1`
4. Re-enqueue Celery task
5. Worker resumes from failed stage

---

## Summary

Three entities form the MVP foundation:
- **User**: 6 fields, identifies Google accounts
- **Task**: 9 fields, tracks pipeline execution with progress and retry metadata
- **TaskLog**: 7 fields, provides structured observability

All entities support constitution principles:
- Pipeline-First (Task stages model pipeline explicitly)
- Idempotent/Retryable (retry_count_by_stage, status transitions)
- Traceability (TaskLog with stage context, timestamps throughout)
- Unit Testing (clear constraints, enums enable validation tests)

Ready for contract definition (API endpoints that manipulate these entities).
