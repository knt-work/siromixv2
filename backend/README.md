# SiroMix V2 Backend API

FastAPI-based backend for SiroMix V2 MVP Foundation.

## Tech Stack

- **Python 3.11+**
- **FastAPI 0.104+** - Web framework
- **SQLAlchemy 2.0+** - ORM with async support
- **PostgreSQL 15+** - Database
- **Redis 7+** - Job queue and caching
- **Celery** - Async task processing
- **Alembic** - Database migrations
- **google-auth 2.x** - Google ID token verification

## Project Structure

```
backend/
├── app/
│   ├── api/              # API routes
│   │   └── v1/
│   │       └── endpoints/
│   ├── core/             # Core functionality (auth, config, database)
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   └── tasks/            # Celery tasks
├── tests/
│   ├── unit/             # Unit tests
│   ├── contract/         # API contract tests
│   └── integration/      # Integration tests
├── alembic/              # Database migrations
│   └── versions/
└── pyproject.toml        # Dependencies and configuration
```

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"
```

### Environment Variables

Create `.env` file in the backend directory:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://siromix:password@localhost:5432/siromix_v2

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Run Migrations

```bash
# Generate migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Run Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Run Celery Worker

```bash
celery -A app.tasks.celery_app worker --loglevel=info
```

### Run Tests

```bash
# All tests
pytest

# Unit tests only
pytest tests/unit/

# With coverage
pytest --cov=app --cov-report=html
```

### Linting & Formatting

```bash
# Format code
black .

# Lint code
ruff check .

# Type check
mypy app/
```

## API Documentation

Once running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## Architecture

### Authentication Flow

1. Frontend sends Google ID token in `Authorization: Bearer <token>` header
2. Backend verifies token using `google-auth` library
3. Extract `sub` (Google subject ID) and create/retrieve User record
4. Attach User to request context via FastAPI dependency

### Task Processing Flow

1. Client creates task via `POST /api/v1/tasks`
2. Task record created in database with status `queued`
3. Celery task enqueued to Redis
4. Worker picks up task and processes through pipeline stages:
   - extract_docx → ai_understanding → ai_analysis → shuffle → render_docx
5. Worker updates task status, progress, and logs to database
6. Client polls `GET /api/v1/tasks/{task_id}` for status updates

### Database Schema

See data model specifications for detailed entity definitions:

- **MVP Foundation** (`specs/001-mvp-foundation/data-model.md`):
  - **users**: Google OAuth user accounts
  - **tasks**: Async processing jobs
  - **task_logs**: Structured execution logs

- **Exams & Artifacts** (`specs/003-exams-artifacts-model/data-model.md`):
  - **exams**: Exam business metadata (name, subject, year, variants, status)
  - **artifacts**: Generated pipeline outputs (DIJ, question previews, NES, variants, answer matrix)
  - **tasks.exam_id**: Foreign key linking tasks to parent exam

#### Migration: Adding Exams and Artifacts Tables

The `002_add_exams_and_artifacts_tables` migration adds exam and artifact tracking to the system with backward compatibility for existing tasks:

**Migration Strategy**:
1. **Step 1**: Creates `exams` and `artifacts` tables, adds `tasks.exam_id` column as NULLABLE
2. **Step 2**: Data migration - creates "Legacy Import" exam for each user with existing tasks, links all tasks to their user's legacy exam  
3. **Step 3**: Makes `tasks.exam_id` NOT NULL, adds foreign key constraint with CASCADE delete

**Apply Migration**:
```bash
cd backend
alembic upgrade head
```

**Rollback Migration**:
```bash
cd backend
alembic downgrade -1
```

**Test Migration** (requires Docker and PostgreSQL running):
```bash
cd backend

# Clean database test
alembic upgrade head

# Rollback test  
alembic downgrade -1
alembic upgrade head

# With existing data test
# See scripts/test_migration.md for detailed test scenarios
```

**Verify Tables Created**:
```bash
docker exec -it siromix-postgres psql -U siromix -d siromix_v2

\dt  # List all tables - should include exams, artifacts
\d exams  # Describe exams table structure
\q
```

#### Quickstart: Testing Exam/Artifact Features

After applying the migration, use helper scripts to verify functionality:

```bash
cd backend

# Create test data
python scripts/create_test_exam.py        # Creates test user and exam
python scripts/create_test_artifact.py    # Creates test artifact for exam

# Test relationships
python scripts/test_relationships.py      # Verifies exam→artifacts and user→exams loading

# Test cascade deletion
python scripts/test_cascade_delete.py     # Verifies DELETE exam → CASCADE artifacts/tasks
```

See **`specs/003-exams-artifacts-model/quickstart.md`** for comprehensive validation steps, debugging scenarios, and performance testing.

## Development

### Adding New Endpoint

1. Create Pydantic schemas in `app/schemas/`
2. Create service logic in `app/services/`
3. Create endpoint in `app/api/v1/endpoints/`
4. Register route in `app/api/v1/api.py`
5. Write tests in `tests/contract/` and `tests/integration/`

### Adding New Model

1. Create model in `app/models/`
2. Import in `app/models/__init__.py`
3. Generate migration: `alembic revision --autogenerate -m "add_model"`
4. Review and apply: `alembic upgrade head`
5. Create corresponding Pydantic schemas
6. Write unit tests

## License

Copyright © 2026 SiroMix Team
