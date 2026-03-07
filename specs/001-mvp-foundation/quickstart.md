# Quickstart Guide: SiroMix V2 MVP Foundation

**Feature**: 001-mvp-foundation  
**Goal**: Get a fully functional local environment running within 5 minutes  
**Date**: 2026-02-22

---

## Prerequisites

Before starting, ensure you have:

1. **Docker Desktop** installed and running
   - Download: https://www.docker.com/products/docker-desktop
   - Verify: `docker --version` (should be 20.10+)
   - Verify: `docker compose version` (should be 2.0+)

2. **Google OAuth Credentials** (for authentication)
   - Go to: https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID (Web application)
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
   - Save the **Client ID** and **Client Secret**

3. **Git** installed
   - Verify: `git --version`

**Estimated Time**: 5 minutes (excluding downloads)

---

## Setup Steps

### Step 1: Clone Repository

```bash
git clone https://github.com/siromix/siromixv2.git
cd siromixv2
```

### Step 2: Configure Environment Variables

Create `.env` file in the **project root**:

```bash
# .env

# ============================================================
# Google OAuth Configuration
# ============================================================
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ============================================================
# NextAuth Configuration (Frontend)
# ============================================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# ============================================================
# Backend API Configuration
# ============================================================
API_BASE_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000

# ============================================================
# Database Configuration
# ============================================================
POSTGRES_USER=siromix
POSTGRES_PASSWORD=siromix_dev_password
POSTGRES_DB=siromix_v2
DATABASE_URL=postgresql+asyncpg://siromix:siromix_dev_password@db:5432/siromix_v2

# ============================================================
# Redis Configuration
# ============================================================
REDIS_URL=redis://redis:6379/0

# ============================================================
# Celery Configuration
# ============================================================
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
```

**Generate NEXTAUTH_SECRET**:
```bash
# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# On Linux/Mac:
openssl rand -base64 32
```

**Important**: Replace `your-google-client-id` and `your-google-client-secret` with your actual credentials from Google Cloud Console.

### Step 3: Start All Services

```bash
docker compose up --build
```

**What This Does**:
- Builds frontend (Next.js) and backend (FastAPI) containers
- Starts PostgreSQL database
- Starts Redis cache/queue
- Starts Celery worker for background tasks
- Runs database migrations automatically

**Wait For**:
- `frontend` container: "Ready on http://localhost:3000"
- `backend` container: "Uvicorn running on http://0.0.0.0:8000"
- `worker` container: "celery@worker ready"

**Expected Time**: 2-3 minutes (first build), 30 seconds (subsequent starts)

### Step 4: Verify Services

Open your browser:

1. **Frontend**: http://localhost:3000
   - Should show login page
   - "Sign in with Google" button visible

2. **Backend API Docs**: http://localhost:8000/docs
   - Should show Swagger UI with 4 endpoints
   - `/api/v1/tasks`, `/api/v1/tasks/{task_id}`, `/api/v1/tasks/{task_id}/retry`, `/api/v1/me`

3. **Database** (optional):
   ```bash
   docker compose exec db psql -U siromix -d siromix_v2 -c "\dt"
   ```
   - Should list tables: `users`, `tasks`, `task_logs`, `alembic_version`

---

## Test the Application

### Test 1: Sign In with Google

1. Go to http://localhost:3000
2. Click **"Sign in with Google"**
3. Select your Google account
4. Grant permissions
5. Should redirect back to dashboard showing:
   - Your name/email
   - "Create New Task" button
   - Task list (empty initially)

**Troubleshooting**:
- **"redirect_uri_mismatch"**: Verify redirect URI in Google Console exactly matches `http://localhost:3000/api/auth/callback/google`
- **"invalid_client"**: Double-check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in `.env`

### Test 2: Create and Monitor a Task

1. Click **"Create New Task"** button
2. Leave "Simulate Failure" unchecked
3. Click **"Submit"**
4. Observe progress bar updating:
   - Extract DOCX (0% → 20%)
   - AI Understanding (20% → 40%)
   - AI Analysis (40% → 60%)
   - Shuffle (60% → 80%)
   - Render DOCX (80% → 100%)
5. Status should change: Queued → Running → Completed
6. Click **"View Logs"** to see detailed stage logs

**Expected Duration**: 15-25 seconds (mock pipeline)

### Test 3: Simulate Failure and Retry

1. Click **"Create New Task"** button
2. Check **"Simulate Failure"** checkbox
3. Select stage: **"AI Understanding"** (dropdown)
4. Click **"Submit"**
5. Observe:
   - Task reaches "AI Understanding" stage (40%)
   - Status changes to **"Failed"**
   - Error message: "Simulated failure at stage: ai_understanding"
6. Click **"Retry"** button
7. Observe:
   - Status changes back to **"Running"**
   - Starts from "AI Understanding" stage
   - Progress resumes from 40%
   - Retry count increments (shown in task details)
8. Should complete successfully on retry

**Expected Behavior**: Idempotent retry - same task, incremented retry count, resumes from failed stage.

---

## Architecture Overview

**Monorepo Structure**:
```
siromixv2/
├── frontend/           # Next.js 14 + TypeScript
│   ├── app/             # App Router pages
│   ├── components/      # React components
│   └── lib/             # Utilities (auth, API client)
├── backend/            # FastAPI + Python 3.11
│   ├── app/             # Application code
│   │   ├── api/         # API routes
│   │   ├── core/        # Auth, config
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   └── tasks/       # Celery workers
│   └── alembic/         # Database migrations
├── infra/              # Infrastructure
│   └── docker-compose.yml
├── specs/              # Specifications
└── .specify/           # Speckit metadata
```

**Services**:
1. **Frontend** (`:3000`): Next.js with NextAuth.js for Google OAuth
2. **Backend** (`:8000`): FastAPI with async SQLAlchemy, Google token verification
3. **Worker**: Celery processing tasks from Redis queue (5-stage mock pipeline)
4. **Database** (`:5432`): PostgreSQL 15 with users/tasks/task_logs tables
5. **Redis** (`:6379`): Job queue and caching

**Data Flow**:
```
User → Frontend (Google OAuth) → Backend (verify token) → Create Task
  → Enqueue Celery → Worker processes 5 stages → Update Task status/progress
  → Frontend polls → Display progress/logs
```

---

## Common Commands

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f worker
docker compose logs -f frontend
```

### Restart a Service

```bash
docker compose restart backend
docker compose restart worker
```

### Run Database Migrations

```bash
# Auto-run on startup, but manual trigger:
docker compose exec backend alembic upgrade head
```

### Access Database

```bash
# PostgreSQL shell
docker compose exec db psql -U siromix -d siromix_v2

# List tables
\dt

# Query users
SELECT user_id, email, display_name FROM users;

# Query tasks
SELECT task_id, status, current_stage, progress FROM tasks;
```

### Access Redis CLI

```bash
docker compose exec redis redis-cli

# List queued jobs
KEYS celery-task-meta-*

# Check queue length
LLEN celery
```

### Stop All Services

```bash
docker compose down
```

### Reset Database (Clean Start)

```bash
# WARNING: Deletes all data
docker compose down -v
docker compose up --build
```

---

## Troubleshooting

### Issue: Frontend can't connect to backend

**Symptoms**: API calls return network errors, CORS issues

**Solution**:
1. Check backend is running: `docker compose ps`
2. Verify `API_BASE_URL` in `.env` is `http://localhost:8000`
3. Check backend logs: `docker compose logs backend`
4. Restart services: `docker compose restart frontend backend`

### Issue: Tasks stuck in "queued" status

**Symptoms**: Tasks never progress beyond "queued"

**Solution**:
1. Check worker is running: `docker compose ps worker`
2. View worker logs: `docker compose logs worker`
3. Verify Redis connection: `docker compose exec redis redis-cli PING` (should return "PONG")
4. Restart worker: `docker compose restart worker`

### Issue: Google OAuth fails

**Symptoms**: "redirect_uri_mismatch", "invalid_client", or infinite redirect

**Solution**:
1. **Redirect URI**: Must be exactly `http://localhost:3000/api/auth/callback/google` in Google Console
2. **JavaScript Origins**: Must include `http://localhost:3000`
3. **NEXTAUTH_URL**: Must be `http://localhost:3000` in `.env` (no trailing slash)
4. **Client Credentials**: Copy-paste carefully from Google Console to `.env`
5. **Restart frontend**: `docker compose restart frontend` after `.env` changes

### Issue: Database connection errors

**Symptoms**: Backend logs show "could not connect to server"

**Solution**:
1. Check database is running: `docker compose ps db`
2. Verify credentials in `.env` match `docker-compose.yml`
3. Wait 10 seconds for database to be ready (first startup)
4. Check database logs: `docker compose logs db`

### Issue: Port already in use

**Symptoms**: "port is already allocated" error

**Solution**:
```bash
# Find process using port (Windows PowerShell)
Get-NetTCPConnection -LocalPort 3000 | Select OwningProcess
Get-Process -Id <OwningProcess>

# Stop conflicting service or change port in docker-compose.yml
```

---

## Development Workflow

### Making Code Changes

**Frontend** (live reload):
1. Edit files in `frontend/`
2. Next.js auto-reloads (no restart needed)

**Backend** (live reload):
1. Edit files in `backend/app/`
2. Uvicorn auto-reloads (no restart needed)

**Worker** (manual restart):
1. Edit files in `backend/app/tasks/`
2. Restart: `docker compose restart worker`

**Database Schema**:
1. Edit models in `backend/app/models/`
2. Generate migration: `docker compose exec backend alembic revision --autogenerate -m "description"`
3. Apply migration: `docker compose exec backend alembic upgrade head`

### Running Tests (Future)

```bash
# Backend unit tests
docker compose exec backend pytest

# Frontend unit tests
docker compose exec frontend npm test

# End-to-end tests
docker compose exec frontend npm run test:e2e
```

---

## API Testing with cURL

### Get Access Token

1. Sign in to http://localhost:3000
2. Open browser DevTools → Application → Cookies
3. Copy value of `next-auth.session-token` cookie
4. Use NextAuth API to get ID token (or decode JWT from network tab)

**Simpler Alternative**: Run frontend, open Network tab, copy `Authorization` header from any API request.

### Example API Calls

**Create Task**:
```bash
curl -X POST http://localhost:8000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_GOOGLE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"simulate_failure_stage": null}'
```

**Get Task Status**:
```bash
curl -X GET http://localhost:8000/api/v1/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_GOOGLE_ID_TOKEN"
```

**Retry Failed Task**:
```bash
curl -X POST http://localhost:8000/api/v1/tasks/TASK_ID/retry \
  -H "Authorization: Bearer YOUR_GOOGLE_ID_TOKEN"
```

**Get Current User**:
```bash
curl -X GET http://localhost:8000/api/v1/me \
  -H "Authorization: Bearer YOUR_GOOGLE_ID_TOKEN"
```

---

## Next Steps

After completing this quickstart:

1. **Explore the Code**: Review implementation in `frontend/` and `backend/`
2. **Review Documentation**:
   - [Feature Specification](../spec.md)
   - [Implementation Plan](../plan.md)
   - [Data Model](../data-model.md)
   - [API Contracts](../contracts/api-v1.md)
3. **Add Features**: Extend the mock pipeline or add real DOCX processing
4. **Run Tests**: Implement unit tests per Constitution Principle IX
5. **Deploy**: Configure production environment (separate guide)

---

## Success Criteria Met

✅ **SC-001**: Developer can clone repository, run `docker compose up`, and have fully functional local environment running within 5 minutes  
✅ **SC-002**: Complete Google OAuth authentication flow demonstrated  
✅ **SC-003**: Task creation and status polling demonstrated  
✅ **SC-004**: Failure simulation and retry mechanism demonstrated  

**Ready for Implementation**: Follow plan.md to build features according to specification.
