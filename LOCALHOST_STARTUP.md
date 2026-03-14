# SiroMix V2 - Local Development Startup Guide

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
