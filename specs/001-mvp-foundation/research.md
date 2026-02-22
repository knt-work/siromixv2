# Research: Initialize SiroMix V2 MVP Foundation

**Feature**: 001-mvp-foundation  
**Date**: 2026-02-22  
**Purpose**: Resolve technical unknowns and establish implementation best practices

---

## Research Task 1: Google OAuth Implementation Best Practices

### Decision: NextAuth.js with Google Provider + Backend Token Verification

**Rationale**: NextAuth.js provides battle-tested OAuth 2.0 flows with built-in CSRF protection, session management, and token handling. Google Provider is officially supported and well-documented.

### Implementation Approach

**Frontend (NextAuth.js)**:
- Use NextAuth.js v4 with Google Provider
- Configuration in `app/api/auth/[...nextauth]/route.ts` (Next.js 14 App Router)
- JWT strategy (not database sessions) for stateless architecture
- Store ID token in JWT session for backend verification

**Backend (google-auth)**:
- Use `google-auth` library (official Google Python library) for ID token verification
- Verify on every protected endpoint request
- Extract `sub` (subject) claim for user identification
- No session storage - verify token on each request (stateless)

**Token Refresh Strategy**:
- NextAuth automatically handles token refresh via Google OAuth refresh token
- Frontend includes valid ID token in Authorization header
- If token expires mid-session, NextAuth redirects to login

**Security Considerations**:
- CSRF protection: NextAuth handles automatically
- Token storage: NextAuth stores in httpOnly cookies (secure)
- Token transmission: Always use HTTPS in production
- Validate `aud` (audience) and `iss` (issuer) claims on backend

### Alternatives Considered

1. **Passport.js**: More flexible but requires more boilerplate. NextAuth is simpler for OAuth-only use case.
2. **Manual JWT decode**: Insecure. Must use official Google library to verify signature and claims.
3. **Session-based auth**: Violates constitution's stateless requirement and adds Redis/DB dependency for sessions.

### Reference Implementation

```typescript
// frontend/src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.idToken = account.id_token; // Store Google ID token
      }
      return token;
    },
    async session({ session, token }) {
      session.idToken = token.idToken; // Expose to client
      return session;
    },
  },
};

export const GET = NextAuth(authOptions);
export const POST = NextAuth(authOptions);
```

```python
# backend/src/services/auth.py
from google.oauth2 import id_token
from google.auth.transport import requests

def verify_google_token(token: str) -> dict:
    """Verify Google ID token and return claims"""
    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            os.getenv("GOOGLE_CLIENT_ID")
        )
        
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Invalid issuer')
            
        return idinfo  # Contains 'sub', 'email', 'name', etc.
    except ValueError:
        raise Unauthorized("Invalid token")
```

---

## Research Task 2: Task Queue Selection

### Decision: Celery with Redis Broker

**Rationale**: Celery is the de facto standard for Python async task processing. Redis broker provides simplicity, performance, and reliability for MVP requirements. Mature ecosystem with extensive documentation.

### Celery Advantages
- **Mature**: 10+ years, battle-tested in production
- **Feature-rich**: Retry logic, result backends, monitoring tools (Flower)
- **Async support**: Works with asyncio for FastAPI integration
- **Worker management**: Graceful shutdown, prefork/gevent/eventlet options
- **Monitoring**: Built-in task tracking, Flower UI

### Redis as Broker
- **Simple setup**: Single container in docker-compose
- **Reliable**: Supports task persistence with AOF/RDB
- **Fast**: In-memory operations, low latency
- **Dual purpose**: Job queue + optional caching

### Alternatives Considered

1. **Dramatiq**: Simpler API, less overhead. Rejected because Celery's maturity and monitoring tools (Flower) outweigh simplicity benefit.
2. **RQ (Redis Queue)**: Simplest option. Rejected because lacks advanced features like task routing, complex workflows, and autoscaling support needed for future growth.
3. **Arq**: Async-first, minimal. Too new, smaller community, less production-proven.

### Implementation Approach

**Worker Deployment**:
- Separate Docker container running `celery worker`
- Uses same backend codebase (backend/src/workers/)
- Connects to same Postgres and Redis as API server
- Configured with concurrency=1 for MVP (single worker sufficient)

**Graceful Shutdown**:
- Celery handles SIGTERM gracefully by default
- Worker finishes current task before exiting
- Task state persisted to database, resumable on restart

**Task Definition**:
```python
# backend/src/workers/tasks.py
from .celery_app import celery_app
from .pipeline import run_mock_pipeline

@celery_app.task(bind=True, max_retries=3)
def process_task(self, task_id: str):
    """Process a task through mock pipeline stages"""
    try:
        run_mock_pipeline(task_id)
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
```

**Celery Configuration**:
- Broker: Redis (URL from env var)
- Result backend: Database (Postgres via SQLAlchemy)
- Task serialization: JSON (not pickle for security)
- Acks late: True (ensure task completion before ACK)

---

## Research Task 3: Database Schema Design

### Decision: PostgreSQL with SQLAlchemy 2.0 Async, JSONB for retry_count_by_stage

**Rationale**: Postgres native JSONB type provides indexed JSON storage with query capabilities. SQLAlchemy 2.0 async enables non-blocking database operations in FastAPI. Alembic provides robust migration management.

### Schema Design Decisions

**JSONB for retry_count_by_stage**:
- Native Postgres type, not plain JSON text
- Allows efficient queries and updates
- Example: `{"extract_docx": 0, "ai_understanding": 2, "shuffle": 1}`
- Can index specific keys if needed: `CREATE INDEX idx_retry_ai ON tasks USING GIN ((retry_count_by_stage->'ai_understanding'))`

**Enum Types**:
- Use SQLAlchemy Enum with Python enums
- NOT Postgres native ENUMs (harder to modify)
- Stored as VARCHAR with CHECK constraint
- Example:
```python
class TaskStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class Task(Base):
    status = Column(Enum(TaskStatus), nullable=False, index=True)
```

**Index Strategy**:
- `users.google_sub`: UNIQUE index (lookup by Google account)
- `tasks.user_id`: Index (filter tasks by user)
- `tasks.status`: Index (worker queries for queued tasks)
- `tasks.created_at`: Index (recent tasks, pagination)
- `task_logs.task_id, task_logs.timestamp`: Composite index (fetch logs ordered by time)

**Migration Strategy**:
- Alembic for version-controlled schema changes
- One migration per logical change
- Reversible: all migrations must have `downgrade()`
- Named meaningfully: `001_create_users_table.py`

### Schema Definitions

**users table**:
```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_sub VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_google_sub ON users(google_sub);
```

**tasks table**:
```sql
CREATE TABLE tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    current_stage VARCHAR(50) CHECK (current_stage IN ('extract_docx', 'ai_understanding', 'ai_analysis', 'shuffle', 'render_docx')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    retry_count_by_stage JSONB NOT NULL DEFAULT '{}'::jsonb,
    error TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
```

**task_logs table**:
```sql
CREATE TABLE task_logs (
    log_id SERIAL PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL,
    level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warning', 'error')),
    message TEXT NOT NULL,
    data_json JSONB,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_logs_task_id_timestamp ON task_logs(task_id, timestamp);
```

### SQLAlchemy 2.0 Async Pattern

```python
# backend/src/db/session.py
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with async_session() as session:
        yield session
```

---

## Research Task 4: FastAPI + Async Patterns

### Decision: FastAPI with Async SQLAlchemy, Dependency Injection for Auth

**Rationale**: FastAPI's async support enables high concurrency. Dependency injection provides clean auth middleware. Pydantic integration ensures request/response validation.

### Async Database Operations

**Pattern**: Use SQLAlchemy 2.0 async throughout
```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def get_task(db: AsyncSession, task_id: str) -> Task:
    result = await db.execute(select(Task).where(Task.task_id == task_id))
    return result.scalar_one_or_none()
```

**Transaction Management**:
- Use `async with db.begin()` for explicit transactions
- FastAPI dependency handles session lifecycle (commit/rollback)

### Dependency Injection for Auth

**Pattern**: Create dependency that verifies token and returns user
```python
# backend/src/api/v1/deps.py
from fastapi import Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from ...services.auth import verify_google_token
from ...db.session import get_db

async def get_current_user(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Extract and verify Google ID token, return user"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split("Bearer ")[1]
    claims = verify_google_token(token)
    
    # Get or create user
    user = await get_user_by_google_sub(db, claims['sub'])
    if not user:
        user = await create_user(db, claims)
    
    return user

# Use in endpoints
@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return user
```

### Background Task Enqueueing

**Pattern**: Enqueue Celery task from FastAPI endpoint
```python
from ...workers.tasks import process_task

@router.post("/tasks")
async def create_task(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Create task in database
    task = Task(user_id=user.user_id, status=TaskStatus.QUEUED)
    db.add(task)
    await db.commit()
    
    # Enqueue worker task (Celery task submission is synchronous)
    process_task.delay(str(task.task_id))
    
    return task
```

### Error Handling and Validation

**Pydantic Validation**:
- Request/response bodies use Pydantic schemas
- Automatic validation with clear error messages
- Example:
```python
class TaskCreate(BaseModel):
    simulate_failure_stage: Optional[TaskStage] = None

@router.post("/tasks", response_model=TaskResponse)
async def create_task(data: TaskCreate, ...):
    # Pydantic already validated simulate_failure_stage enum
    pass
```

**Exception Handlers**:
```python
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
```

---

## Research Task 5: Frontend Polling Strategy

### Decision: React useEffect with setInterval + Cleanup, No Polling Backoff for MVP

**Rationale**: Simple polling with useEffect and cleanup is sufficient for MVP. No complex state management library needed (Redux/Zustand). Polling backoff adds complexity without significant MVP benefit.

### Implementation Pattern

```typescript
// frontend/src/components/tasks/TaskProgressMonitor.tsx
import { useEffect, useState } from 'react';
import { fetchTask } from '@/lib/api-client';

export function TaskProgressMonitor({ taskId }: { taskId: string }) {
  const [task, setTask] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const pollTask = async () => {
      try {
        const data = await fetchTask(taskId);
        setTask(data);
        
        // Stop polling when task is terminal state
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(intervalId);
        }
      } catch (err) {
        setError(err);
        clearInterval(intervalId); // Stop on error
      }
    };
    
    // Initial fetch
    pollTask();
    
    // Poll every 2 seconds
    intervalId = setInterval(pollTask, 2000);
    
    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [taskId]);
  
  return (
    <div>
      {/* Render task status, progress, logs */}
    </div>
  );
}
```

### Polling Strategy Details

**Interval**: 2-3 seconds (2000ms chosen for balance between responsiveness and server load)

**Stop Conditions**:
- Task reaches terminal state (completed/failed)
- Component unmounts (cleanup function)
- Polling error occurs (network failure, auth error)

**Error Handling**:
- Display error message to user
- Stop polling on error (don't hammer failed endpoint)
- User can refresh page to retry

**Cleanup**:
- Always clear interval in useEffect cleanup
- Prevents memory leaks and unnecessary API calls
- Critical for React 18 StrictMode (double-mount in dev)

### Alternatives Considered

1. **WebSockets**: Real-time updates, but adds complexity (WebSocket server, connection management, reconnection logic). Overkill for MVP. Consider for future.

2. **Polling Backoff**: Exponential backoff on errors (2s → 4s → 8s). Adds complexity without MVP benefit. Current approach (stop on error) is simpler.

3. **React Query / SWR**: Excellent libraries for data fetching with built-in caching and refetching. Considered overkill for MVP's simple polling needs. Future enhancement.

### State Management Decision

**No Redux/Zustand for MVP**:
- Task progress is local to task detail page (no global state needed)
- Auth context handled by NextAuth (session available via useSession hook)
- Simple useState + useEffect sufficient

**Future Consideration**:
- If we add task list, notifications, or complex state, consider Zustand (lighter than Redux)

---

## Summary of Research Decisions

| Area | Decision | Why |
|------|----------|-----|
| **OAuth** | NextAuth.js + google-auth library | Battle-tested, secure, handles token refresh automatically |
| **Task Queue** | Celery with Redis broker | Mature, feature-rich, production-proven |
| **Database** | Postgres + SQLAlchemy 2.0 Async + JSONB | Native async, JSONB for flexible retry tracking, robust migrations |
| **Backend Framework** | FastAPI with async patterns | High performance, async-first, dependency injection, Pydantic validation |
| **Frontend Polling** | useEffect + setInterval cleanup | Simple, sufficient for MVP, easy to understand and maintain |
| **State Management** | React Context (auth) + Local state (task) | No global state needed for MVP, NextAuth handles auth state |

---

## Open Questions (Resolved)

All technical unknowns from plan.md Technical Context have been resolved. No clarifications needed. Ready to proceed to Phase 1 (Design).

---

**Next Steps**: Proceed to Phase 1 (data-model.md, contracts/, quickstart.md)
