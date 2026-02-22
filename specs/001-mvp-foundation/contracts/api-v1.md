# API v1 Contracts: Initialize SiroMix V2 MVP Foundation

**Feature**: 001-mvp-foundation  
**Date**: 2026-02-22  
**Base URL**: `/api/v1`  
**Authentication**: Bearer token (Google ID token) in Authorization header

---

## Overview

This document defines the HTTP API contracts for the SiroMix V2 MVP foundation. All endpoints require authentication via Google ID token verification. The API follows RESTful conventions with JSON request/response bodies.

**Common Headers**:
- `Authorization: Bearer <google_id_token>` (required for all protected endpoints)
- `Content-Type: application/json` (for request bodies)

**Common Error Responses**:
- `401 Unauthorized`: Missing, invalid, or expired token
- `403 Forbidden`: User does not own the requested resource
- `404 Not Found`: Resource does not exist
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server-side error

---

## Endpoint: POST /api/v1/tasks

### Purpose
Create a new task and enqueue it for processing through the mock pipeline.

### Authentication
**Required**: Yes (Bearer token)

### Request Body

```json
{
  "simulate_failure_stage": "ai_understanding" | null
}
```

**Fields**:
- `simulate_failure_stage` (optional): Stage at which to simulate failure
  - Type: `string | null`
  - Enum values: `"extract_docx"`, `"ai_understanding"`, `"ai_analysis"`, `"shuffle"`, `"render_docx"`
  - Default: `null` (no simulated failure)
  - Purpose: Testing/demo - causes worker to fail at specified stage

### Response (201 Created)

```json
{
  "task_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "queued",
  "current_stage": null,
  "progress": 0,
  "error": null,
  "created_at": "2026-02-22T10:35:00Z",
  "updated_at": "2026-02-22T10:35:00Z"
}
```

**Fields**:
- `task_id`: UUID of created task
- `status`: Initially `"queued"`
- `current_stage`: Initially `null` (not started)
- `progress`: Initially `0`
- `error`: Initially `null`
- `created_at`: Timestamp when task was created
- `updated_at`: Timestamp of last update (same as created_at initially)

### Error Responses

**401 Unauthorized**:
```json
{
  "detail": "Invalid or missing authorization token"
}
```

**422 Unprocessable Entity**:
```json
{
  "detail": [
    {
      "loc": ["body", "simulate_failure_stage"],
      "msg": "value is not a valid enumeration member; permitted: 'extract_docx', 'ai_understanding', 'ai_analysis', 'shuffle', 'render_docx'",
      "type": "type_error.enum"
    }
  ]
}
```

### Example Request

```bash
curl -X POST http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"simulate_failure_stage": null}'
```

### Business Logic
1. Verify Google ID token from Authorization header
2. Create Task record with `status=queued`, `progress=0`
3. Associate task with authenticated user (`user_id`)
4. Enqueue Celery task for background processing
5. Return task details

---

## Endpoint: GET /api/v1/tasks/{task_id}

### Purpose
Retrieve current status, progress, and recent logs for a specific task.

### Authentication
**Required**: Yes (Bearer token)

### Path Parameters
- `task_id` (required): UUID of the task
  - Format: UUID v4
  - Example: `7c9e6679-7425-40de-944b-e07fc1f90ae7`

### Response (200 OK)

```json
{
  "task_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "running",
  "current_stage": "ai_understanding",
  "progress": 40,
  "error": null,
  "retry_count_by_stage": {
    "extract_docx": 0,
    "ai_understanding": 0
  },
  "created_at": "2026-02-22T10:35:00Z",
  "updated_at": "2026-02-22T10:35:12Z",
  "logs": [
    {
      "log_id": 1,
      "stage": "extract_docx",
      "level": "info",
      "message": "Starting document extraction",
      "data_json": null,
      "timestamp": "2026-02-22T10:35:05Z"
    },
    {
      "log_id": 2,
      "stage": "extract_docx",
      "level": "info",
      "message": "Extraction complete",
      "data_json": {"blocks_extracted": 0, "duration_ms": 3200},
      "timestamp": "2026-02-22T10:35:08Z"
    },
    {
      "log_id": 3,
      "stage": "ai_understanding",
      "level": "info",
      "message": "Starting AI understanding",
      "data_json": null,
      "timestamp": "2026-02-22T10:35:10Z"
    }
  ]
}
```

**Fields**:
- `task_id`: UUID of the task
- `status`: Current status (`"queued"` | `"running"` | `"completed"` | `"failed"`)
- `current_stage`: Current pipeline stage (null if queued)
- `progress`: Integer 0-100 representing completion percentage
- `error`: Error message (null if not failed)
- `retry_count_by_stage`: Object mapping stage names to retry counts
- `created_at`: Timestamp when task was created
- `updated_at`: Timestamp of last update
- `logs`: Array of recent log entries (last 50), ordered by timestamp DESC

**Log Entry Fields**:
- `log_id`: Integer log entry ID
- `stage`: Stage when log was created
- `level`: Log severity (`"info"` | `"warning"` | `"error"`)
- `message`: Human-readable message
- `data_json`: Additional structured data (nullable)
- `timestamp`: When log was created

### Error Responses

**401 Unauthorized**:
```json
{
  "detail": "Invalid or missing authorization token"
}
```

**403 Forbidden**:
```json
{
  "detail": "You do not have permission to access this task"
}
```

**404 Not Found**:
```json
{
  "detail": "Task not found"
}
```

### Example Request

```bash
curl -X GET http://localhost:8000/api/v1/tasks/7c9e6679-7425-40de-944b-e07fc1f90ae7 \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Business Logic
1. Verify Google ID token from Authorization header
2. Query Task by task_id
3. Verify task belongs to authenticated user (403 if not)
4. Query recent 50 TaskLog entries for this task
5. Return task details with logs

---

## Endpoint: POST /api/v1/tasks/{task_id}/retry

### Purpose
Retry a failed task from the stage where it failed. Increments retry count for that stage and re-enqueues the task.

### Authentication
**Required**: Yes (Bearer token)

### Path Parameters
- `task_id` (required): UUID of the task to retry
  - Format: UUID v4
  - Must be a task in `"failed"` status

### Request Body
None (empty body or omitted)

### Response (200 OK)

```json
{
  "task_id": "8d7f5689-8536-51ef-a855-f18ed2g01bf8",
  "status": "running",
  "current_stage": "ai_understanding",
  "progress": 20,
  "error": null,
  "retry_count_by_stage": {
    "extract_docx": 0,
    "ai_understanding": 2
  },
  "created_at": "2026-02-22T10:40:00Z",
  "updated_at": "2026-02-22T10:41:00Z"
}
```

**Fields**:
- `task_id`: UUID of the retried task
- `status`: Changed to `"running"`
- `current_stage`: Set to the failed stage (where retry will resume)
- `progress`: Typically unchanged (progress from previous run)
- `error`: Cleared (set to `null`)
- `retry_count_by_stage`: Failed stage's count incremented by 1
- `created_at`: Original creation timestamp (unchanged)
- `updated_at`: Updated to current timestamp

### Error Responses

**400 Bad Request** - Task not in failed state:
```json
{
  "detail": "Task is not in failed state. Current status: completed"
}
```

**401 Unauthorized**:
```json
{
  "detail": "Invalid or missing authorization token"
}
```

**403 Forbidden**:
```json
{
  "detail": "You do not have permission to retry this task"
}
```

**404 Not Found**:
```json
{
  "detail": "Task not found"
}
```

### Example Request

```bash
curl -X POST http://localhost:8000/api/v1/tasks/8d7f5689-8536-51ef-a855-f18ed2g01bf8/retry \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### Business Logic
1. Verify Google ID token from Authorization header
2. Query Task by task_id
3. Verify task belongs to authenticated user (403 if not)
4. Verify task status is `"failed"` (400 if not)
5. Update task:
   - Set `status = "running"`
   - Clear `error = null`
   - Increment `retry_count_by_stage[current_stage] += 1`
   - Update `updated_at = now()`
6. Re-enqueue Celery task with resume-from-stage flag
7. Return updated task details

### Idempotency Behavior

**Scenario**: Retry endpoint called on already-running or completed task

**Response** (400 Bad Request):
```json
{
  "detail": "Task is not in failed state. Current status: running"
}
```

This prevents duplicate processing or corrupting completed tasks. Only tasks with `status="failed"` can be retried.

---

## Endpoint: GET /api/v1/me

### Purpose
Retrieve authenticated user's profile information. Useful for displaying user info in UI and debugging auth issues.

### Authentication
**Required**: Yes (Bearer token)

### Response (200 OK)

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "google_sub": "1234567890abcdefghij",
  "email": "user@example.com",
  "display_name": "John Doe",
  "created_at": "2026-01-15T08:20:00Z",
  "updated_at": "2026-01-15T08:20:00Z"
}
```

**Fields**:
- `user_id`: Internal UUID for the user
- `google_sub`: Google's unique subject identifier
- `email`: User's email from Google account
- `display_name`: User's full name from Google profile
- `created_at`: When user record was created
- `updated_at`: When user record was last modified

### Error Responses

**401 Unauthorized**:
```json
{
  "detail": "Invalid or missing authorization token"
}
```

### Example Request

```bash
curl -X GET http://localhost:8000/api/v1/me \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Business Logic
1. Verify Google ID token from Authorization header
2. Extract user identity from token (google_sub)
3. Find or create User record
4. Return user details

---

## Authentication Flow Details

### Token Verification Process

All protected endpoints follow this flow:

1. **Extract Token**: Parse `Authorization: Bearer <token>` header
2. **Verify Signature**: Use Google's public keys to verify JWT signature
3. **Validate Claims**: Check `aud` (audience), `iss` (issuer), `exp` (expiration)
4. **Extract Identity**: Get `sub` (subject), `email`, `name` claims
5. **Find/Create User**: Query User by `google_sub`, create if first login
6. **Attach to Request**: Make User object available to endpoint handler

### Token Lifetime

- **ID Token TTL**: 1 hour (Google default)
- **Refresh**: NextAuth handles automatically on frontend
- **Expired Token**: Backend returns 401, frontend redirects to login

### Error Codes

- `401`: Token missing, invalid signature, expired, or wrong audience
- `403`: Token valid but user lacks permission (e.g., accessing other user's task)

---

## Rate Limiting (Future)

MVP does not implement rate limiting. Future versions should add:
- Per-user limits: 100 requests/minute
- Task creation limit: 10 tasks/hour per user
- Polling friendly: GET requests excluded from strict limits

---

## API Versioning Strategy

**Current**: `/api/v1` prefix on all endpoints

**Future Breaking Changes**:
- Introduce `/api/v2` while maintaining v1
- Deprecation period: 6 months minimum
- Version header alternative: `Accept: application/vnd.siromix.v2+json`

**What Constitutes Breaking Change**:
- Removing endpoints or fields
- Changing field types or enums
- Renaming fields
- Changing error response structure

**Non-Breaking Changes** (safe in v1):
- Adding new optional fields
- Adding new endpoints
- Adding new enum values (if clients handle unknown gracefully)

---

## OpenAPI Specification (Optional)

Auto-generated by FastAPI at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- JSON spec: `http://localhost:8000/openapi.json`

Consider exporting to `/shared/api-contracts.json` for frontend TypeScript generation.

---

## Summary

**4 Core Endpoints**:
1. `POST /api/v1/tasks` - Create task
2. `GET /api/v1/tasks/{task_id}` - Get task status and logs
3. `POST /api/v1/tasks/{task_id}/retry` - Retry failed task
4. `GET /api/v1/me` - Get current user (optional but useful)

**Authentication**: All endpoints require valid Google ID token verified on every request (stateless).

**Constitution Alignment**:
- Idempotent retry (Principle VII)
- Task status and logs provide traceability (Principle V)
- Clear stage enumeration supports pipeline-first (Principle I)
- Schema validation via Pydantic (Principle III)

Ready for quickstart guide and implementation.
