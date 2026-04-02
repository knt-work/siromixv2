# SiroMix V2 - Local Development Startup Guide

> **Single Source of Truth**: This guide works across ALL features. Follow these steps to start the complete local development environment.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [One-Time Setup](#one-time-setup)
3. [Starting Development Environment](#starting-development-environment)
4. [Verification Steps](#verification-steps)
5. [Stopping Services](#stopping-services)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Python 3.11+** - Backend runtime
- **Node.js 18+** - Frontend runtime
- **Docker Desktop** - Infrastructure (PostgreSQL, Redis, MinIO)
- **Git** - Version control

### Verify Installations

```powershell
# PowerShell (Windows)
python --version          # Should show 3.11+
node --version            # Should show 18+
docker --version          # Should show Docker version
docker compose version    # Should show Docker Compose version
```

---

## One-Time Setup

### 1. Clone Repository

```powershell
git clone <repository-url>
cd siromixv2
```

### 2. Configure Environment Variables

#### Infrastructure Environment (.env)

```powershell
# Copy infrastructure environment template
cd infra
Copy-Item .env.example .env

# Edit .env and set your Google OAuth credentials:
# - GOOGLE_CLIENT_ID (from Google Cloud Console)
# - GOOGLE_CLIENT_SECRET (from Google Cloud Console)
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
```

**📝 Important**: Get Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/):
1. Create OAuth 2.0 Client ID
2. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
3. Copy Client ID and Client Secret to `infra/.env`

#### Backend Environment (.env)

```powershell
# Copy backend environment template
cd ..\backend
Copy-Item .env.example .env

# Update GOOGLE_CLIENT_ID in backend/.env (same as infra/.env)
# All other defaults are fine for local development
```

### 3. Install Backend Dependencies

```powershell
# From siromixv2/backend directory
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -e ".[dev]"
```

### 4. Install Frontend Dependencies

```powershell
# From siromixv2/frontend directory
cd ..\frontend
npm install
```

---

## Starting Development Environment

### Option 1: Docker Compose (Recommended) 🐋

**✅ Best for**: Full-stack development with all services (database, storage, workers)

```powershell
# From siromixv2/infra directory
cd infra
docker compose up

# Or run in background:
docker compose up -d

# View logs:
docker compose logs -f
```

**This starts:**
- ✅ PostgreSQL (port 5432)
- ✅ Redis (port 6379)
- ✅ MinIO S3 Storage (ports 9000, 9001)
- ✅ Backend API (port 8000)
- ✅ Celery Worker
- ✅ Frontend (port 3000)

**First-time setup**: Database migrations run automatically when backend container starts.

---

### Option 2: Manual Startup (Infrastructure Only)

**✅ Best for**: Backend/Frontend development with code hot-reload

#### Step 1: Start Infrastructure Services

```powershell
# From siromixv2/infra directory
docker compose up db redis minio minio-setup
```

#### Step 2: Run Database Migrations (First Time Only)

```powershell
# From siromixv2/backend directory (with .venv activated)
alembic upgrade head
```

#### Step 3: Start Backend API

```powershell
# Terminal 1 - Backend API
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Step 4: Start Celery Worker

```powershell
# Terminal 2 - Celery Worker (for background tasks)
cd backend
.\.venv\Scripts\Activate.ps1
celery -A app.tasks.celery_app worker --loglevel=info --pool=solo
```

**Note**: On Windows, use `--pool=solo` for Celery worker.

#### Step 5: Start Frontend

```powershell
# Terminal 3 - Frontend
cd frontend
npm run dev
```

---

### Option 3: Quick Start (Infrastructure + Manual App)

**✅ Best for**: Quick testing without full Docker rebuild

```powershell
# Terminal 1: Infrastructure only
cd infra
docker compose up db redis minio minio-setup

# Terminal 2: Backend (after infrastructure is healthy)
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload

# Terminal 3: Celery Worker
cd backend
.\.venv\Scripts\Activate.ps1
celery -A app.tasks.celery_app worker --loglevel=info --pool=solo

# Terminal 4: Frontend
cd frontend
npm run dev
```

---

## Verification Steps

### 1. Check Service Health

| Service | URL | Expected Response |
|---------|-----|-------------------|
| **Backend API** | http://localhost:8000 | `{"message": "SiroMix V2 API"}` |
| **API Docs** | http://localhost:8000/docs | Interactive API documentation |
| **Frontend** | http://localhost:3000 | SiroMix login page |
| **MinIO Console** | http://localhost:9001 | MinIO login (minioadmin/minioadmin) |
| **PostgreSQL** | localhost:5432 | Use `psql` or DB client |

### 2. Verify Database Connection

```powershell
# From backend directory (with .venv activated)
python -c "from app.core.database import engine; import asyncio; asyncio.run(engine.connect())"
# Should complete without errors
```

### 3. Verify MinIO Bucket

1. Open http://localhost:9001
2. Login: `minioadmin` / `minioadmin`
3. Verify bucket `siromix-exams` exists

### 4. Test Authentication Flow

1. Open http://localhost:3000
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify you're redirected to dashboard

### 5. Check Docker Services (if using Docker)

```powershell
# From infra directory
docker compose ps

# All services should show "running" or "healthy"
```

---

## Stopping Services

### Stop Docker Compose

```powershell
# From infra directory
docker compose down

# Stop and remove volumes (⚠️ deletes all data):
docker compose down -v
```

### Stop Manual Services

Press `Ctrl+C` in each terminal running:
- Backend API
- Celery Worker
- Frontend dev server

Infrastructure services (if started separately):
```powershell
docker compose down
```

---

## Troubleshooting

### Backend Won't Start

**Problem**: `ImportError` or `ModuleNotFoundError`

**Solution**:
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
```

---

### Database Connection Errors

**Problem**: `connection refused` or `database does not exist`

**Solution**:
```powershell
# Ensure PostgreSQL is running:
docker compose ps db

# Check database exists:
docker compose exec db psql -U siromix -d siromix_v2 -c "SELECT 1;"

# Run migrations:
cd backend
alembic upgrade head
```

---

### MinIO Bucket Missing

**Problem**: `NoSuchBucket` or artifact upload fails

**Solution**:
```powershell
# Ensure minio-setup container ran:
docker compose logs minio-setup

# Manually create bucket:
docker compose exec minio mc mb /data/siromix-exams
```

---

### Frontend Build Errors

**Problem**: React/TypeScript compilation errors

**Solution**:
```powershell
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```

---

### Port Already in Use

**Problem**: `Address already in use` on port 8000, 3000, 5432, etc.

**Solution**:
```powershell
# Find process using port (e.g., 8000):
netstat -ano | findstr :8000

# Kill process by PID:
taskkill /PID <pid> /F

# Or change port in configuration
```

---

### Celery Worker Won't Start (Windows)

**Problem**: `ValueError: not enough values to unpack`

**Solution**: Use `--pool=solo` flag:
```powershell
celery -A app.tasks.celery_app worker --loglevel=info --pool=solo
```

---

### Google OAuth Errors

**Problem**: `redirect_uri_mismatch` or OAuth fails

**Solution**:
1. Verify Google Cloud Console OAuth settings:
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
2. Verify `GOOGLE_CLIENT_ID` matches in both:
   - `infra/.env`
   - `backend/.env`
3. Restart frontend after changing `.env`:
   ```powershell
   # Stop frontend (Ctrl+C)
   npm run dev
   ```

---

### Docker Compose Fails to Start

**Problem**: `network not found` or `volume not found`

**Solution**:
```powershell
# Clean up and restart:
docker compose down -v
docker compose up
```

---

## Development Workflow

### Running Tests

```powershell
# Backend tests
cd backend
.\.venv\Scripts\Activate.ps1
pytest

# Frontend tests
cd frontend
npm test
```

### Database Migrations

```powershell
# Create new migration
cd backend
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Accessing Logs

```powershell
# Docker logs (all services)
docker compose logs -f

# Specific service
docker compose logs -f backend

# Backend logs (manual mode)
# Shown in terminal where uvicorn is running

# Frontend logs (manual mode)
# Shown in terminal where npm run dev is running
```

---

## Quick Reference

### Common Commands

```powershell
# Start everything (Docker)
cd infra && docker compose up

# Start infrastructure only
cd infra && docker compose up db redis minio minio-setup

# Backend development
cd backend && .\.venv\Scripts\Activate.ps1 && uvicorn app.main:app --reload

# Frontend development  
cd frontend && npm run dev

# Run tests
cd backend && pytest
cd frontend && npm test

# Database migration
cd backend && alembic upgrade head
```

### Default Ports

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Backend API | 8000 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| MinIO API | 9000 |
| MinIO Console | 9001 |

### Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| PostgreSQL | siromix | siromix_dev_password |
| MinIO | minioadmin | minioadmin |

---

## Next Steps

✅ Environment is running → Start developing!

- Backend API docs: http://localhost:8000/docs
- Frontend: http://localhost:3000
- View specific feature documentation in `specs/<feature-name>/quickstart.md`

---

**Need Help?** Check project-specific documentation in the `specs/` directory or consult the team.

## Quick Start (One Command for Everything)

This guide provides **ONE consistent way** to start all services for local development that works for all phases of Feature 004 and future features.

### Prerequisites

- **Docker Desktop** installed and running
- **Git** for cloning the repository
- **Python 3.11+** (for running backend outside Docker - optional)
- **Node.js 18+** (for running frontend outside Docker - optional)

---

## Option 1: Docker Compose (Recommended - One Command Startup)

**This is the recommended approach** - runs everything in containers with one command.

### Step 1: Configure Environment

```bash
# Navigate to infrastructure directory
cd infra

# Copy environment template
cp .env.example .env

# Edit .env with your actual values (especially Google OAuth credentials)
notepad .env  # On Windows
# OR
nano .env     # On Linux/Mac
```

**Important**: Update at minimum:
- `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret  
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`

### Step 2: Start All Services

```bash
# From the infra directory
docker-compose up -d
```

This single command starts:
- ✅ **PostgreSQL** (port 5432) - Database
- ✅ **Redis** (port 6379) - Job queue & cache
- ✅ **MinIO** (ports 9000, 9001) - Object storage (S3-compatible)
- ✅ **Backend API** (port 8000) - FastAPI server
- ✅ **Celery Worker** - Background task processor
- ✅ **Frontend** (port 3000) - Next.js app

### Step 3: Verify Services

```bash
# Check all containers are running
docker-compose ps

# Expected output:
# siromix-postgres    running (healthy)
# siromix-redis       running (healthy)
# siromix-minio       running (healthy)
# siromix-backend     running
# siromix-worker      running
# siromix-frontend    running
```

### Step 4: Initialize Database (First Time Only)

```bash
# Run migrations inside backend container
docker exec -it siromix-backend alembic upgrade head
```

### Step 5: Access Services

- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001 (login: minioadmin / minioadmin)
- **PostgreSQL**: localhost:5432 (user: siromix, password: siromix_dev_password)

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f worker
docker-compose logs -f frontend
```

---

## Option 2: Local Development (Services Run Directly)

**Use this if you need faster iteration or debugging**. Requires manual setup but allows direct code execution.

### Step 1: Start Infrastructure Only

```bash
cd infra

# Start only database, Redis, and MinIO
docker-compose up -d db redis minio minio-setup
```

### Step 2: Setup Backend

```bash
cd ../backend

# Create virtual environment (first time only)
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Windows CMD:
.\.venv\Scripts\activate.bat
# Linux/Mac:
source .venv/bin/activate

# Install dependencies (first time only)
pip install -e .
pip install -e ".[dev]"

# Copy environment template
cp .env.example .env

# Edit .env (update DATABASE_URL to localhost, STORAGE_ENDPOINT_URL to http://localhost:9000)
notepad .env  # Windows
nano .env     # Linux/Mac

# Run migrations (first time only)
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --port 8000
```

**In a new terminal**, start Celery worker:

```bash
cd backend
.\.venv\Scripts\Activate.ps1  # Activate venv

# Start Celery worker
celery -A app.tasks.celery_app worker --loglevel=info
```

### Step 3: Setup Frontend

**In a new terminal**:

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your values
notepad .env.local  # Windows
nano .env.local     # Linux/Mac

# Start development server
npm run dev
```

### Access Services

Same as Option 1:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MinIO Console: http://localhost:9001

---

## Testing Feature 004 (File Upload & Exam Creation API)

### Verify Storage is Ready

1. Open MinIO Console: http://localhost:9001
2. Login: `minioadmin` / `minioadmin`
3. Verify bucket `siromix-exams` exists

### Test API Endpoint (Once Implemented)

```bash
# Get JWT token (authenticate first)
# Then test exam creation:

curl -X POST http://localhost:8000/api/v1/exams \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Test Exam" \
  -F "subject=Mathematics" \
  -F "academic_year=2025-2026" \
  -F "grade_level=6" \
  -F "duration_minutes=60" \
  -F "num_variants=2" \
  -F "file=@path/to/your/exam.docx"
```

### Verify File Upload

1. Check MinIO Console → Buckets → siromix-exams
2. Navigate to `exams/{user_id}/{exam-name}/original.docx`
3. Verify file exists and is downloadable

### Check Database Records

```bash
# Connect to PostgreSQL
docker exec -it siromix-postgres psql -U siromix -d siromix_v2

# Check exam record
SELECT exam_id, name, status, duration_minutes FROM exams ORDER BY created_at DESC LIMIT 1;

# Check task record
SELECT task_id, exam_id, status FROM tasks ORDER BY created_at DESC LIMIT 1;

# Exit
\q
```

---

## Troubleshooting

### "Port already in use"

```bash
# Check what's using the port
# Windows:
netstat -ano | findstr :8000

# Linux/Mac:
lsof -i :8000

# Kill the process or change port in docker-compose.yml
```

### "Database connection failed"

```bash
# Check PostgreSQL is running
docker-compose ps db

# Check logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### "MinIO bucket not found"

```bash
# Check MinIO is running
docker-compose ps minio

# Re-run bucket setup
docker-compose up -d minio-setup

# Or create manually in MinIO Console
```

### "Module not found" (backend)

```bash
# Reinstall dependencies
cd backend
pip install -e .
pip install -e ".[dev]"
```

### "Cannot connect to Redis"

```bash
# Check Redis is running
docker-compose ps redis

# Restart Redis
docker-compose restart redis
```

---

## Development Workflow

### Daily Startup (Consistent for All Phases)

```bash
# Option 1 (Docker - recommended):
cd infra
docker-compose up -d

# Option 2 (Local):
cd infra && docker-compose up -d db redis minio
# Then start backend and frontend in separate terminals
```

### Making Code Changes

- **Backend**: Changes auto-reload with `--reload` flag (Docker or local)
- **Frontend**: Changes auto-reload with Next.js dev server
- **Celery Worker**: Restart required for changes (Ctrl+C and restart)

### Running Tests

```bash
# Backend unit tests
cd backend
pytest

# Backend tests with coverage
pytest --cov=app --cov-report=html

# Frontend tests
cd frontend
npm run test
```

### Database Migrations

```bash
# Generate migration (after model changes)
cd backend
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

---

## What's Running Where?

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Frontend | 3000 | http://localhost:3000 | Next.js UI |
| Backend API | 8000 | http://localhost:8000 | FastAPI REST API |
| API Docs | 8000 | http://localhost:8000/docs | Swagger UI |
| PostgreSQL | 5432 | localhost:5432 | Database |
| Redis | 6379 | localhost:6379 | Cache & Queue |
| MinIO API | 9000 | http://localhost:9000 | Object storage |
| MinIO Console | 9001 | http://localhost:9001 | Storage management UI |
| Celery Worker | - | (background) | Task processor |

---

## Next Steps After Phase 1

Phase 1 is complete! You can now:

1. **Phase 2**: Run database migrations (T006-T011)
2. **Phase 3**: Implement User Story 1 (core file upload functionality)
3. **Test**: Use the testing commands above to verify each phase

**This startup process remains consistent for all future phases** - just use `docker-compose up -d` and you're ready to develop!
