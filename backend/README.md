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

- **File Upload & Exam Creation** (`specs/004-exam-upload-api/data-model.md`):
  - **exams.duration_minutes**: Added exam duration field (INTEGER, NOT NULL, CHECK > 0)
  - **tasks.exam_id**: Changed from nullable to non-nullable (CASCADE DELETE)

#### Feature 004 API Endpoints

**POST /api/v1/exams** — Create exam with file upload

Accepts `multipart/form-data`. Requires `Authorization: Bearer <token>`.

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | ✅ | 1–500 chars |
| `subject` | string | ✅ | 1–500 chars |
| `academic_year` | string | ✅ | 1–50 chars |
| `grade_level` | string | ❌ | 0–100 chars |
| `duration_minutes` | integer | ✅ | > 0 |
| `num_variants` | integer | ✅ | > 0, ≤ 100 |
| `instructions` | string | ❌ | no limit |
| `file` | binary | ✅ | DOCX format, ≤ 50 MB |

**Success response (201)**:
```json
{ "exam_id": "<uuid>", "task_id": "<uuid>", "status": "queued" }
```

Uploaded files are stored at `exams/{user_id}/{exam-name-kebab}/original.docx` in object storage.

**Storage Environment Variables** (add to `.env`):
```bash
STORAGE_BUCKET_NAME=siromix-uploads
STORAGE_ENDPOINT_URL=http://localhost:9000   # MinIO local; omit for AWS S3
STORAGE_ACCESS_KEY_ID=minioadmin
STORAGE_SECRET_ACCESS_KEY=minioadmin
STORAGE_REGION=us-east-1                    # AWS S3 only
```

See **`specs/004-exam-upload-api/contracts/exams_post.md`** for the full API contract, error responses, and integration examples.

#### Migration: Adding Exams and Artifacts Tables

The `002_add_exams_and_artifacts_tables` migration adds exam and artifact tracking to the system with backward compatibility for existing tasks:

**Migration Strategy**:
1. **Step 1**: Creates `exams` and `artifacts` tables, adds `tasks.exam_id` column as NULLABLE
2. **Step 2**: Data migration - creates "Legacy Import" exam for each user with existing tasks, links all tasks to their user's legacy exam  
3. **Step 3**: Makes `tasks.exam_id` NOT NULL, adds foreign key constraint with CASCADE delete

---

## Feature 006: DOCX Extraction Pipeline

**Status**: ✅ **Production Ready** (Phase 7 complete)  
**Purpose**: Replace mock `extract_docx` pipeline stage with real DOCX parser that produces Document Intermediate JSON (DIJ)

### Overview

The DOCX extraction feature is the first real pipeline stage that transforms uploaded DOCX exam files into structured, AI-ready JSON format. It extracts:

- ✅ **Text Paragraphs** - All text content with formatting metadata
- ✅ **Tables** - Structure preservation including merged cells
- ✅ **Images** - Stored as external S3 artifacts with references
- ✅ **Math Equations** - OMML converted to LaTeX (with fallback)

### Document Intermediate JSON (DIJ)

DIJ is the canonical output format required by Constitution Principle I. Structure:

```json
{
  "version": "1.0",
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "blocks": [
    {
      "id": "block-uuid-1",
      "type": "paragraph",
      "sequence": 1,
      "content": {
        "runs": [{"text": "Question 1:", "bold": true}]
      },
      "provenance": {
        "source_document_id": "exam-uuid",
        "original_position": {"paragraph_index": 0},
        "extraction_timestamp": "2026-03-22T10:30:00Z",
        "extraction_method": "python-docx-v1.1.0"
      }
    }
  ],
  "metadata": {
    "extraction_timestamp": "2026-03-22T10:30:00Z",
    "source_filename": "midterm_exam.docx",
    "source_file_size": 1048576,
    "total_blocks": 42,
    "block_type_counts": {"paragraph": 35, "table": 5, "image": 2},
    "extraction_duration_ms": 1250,
    "warnings": []
  }
}
```

### Setup Requirements

#### Dependencies

```bash
# Install DOCX extraction dependencies (already in pyproject.toml)
pip install python-docx>=1.1.0 lxml>=5.0.0 Pillow>=10.0.0
```

#### Storage Configuration

DIJ artifacts and extracted images require object storage (MinIO or S3):

```bash
# Add to .env (if not already present from Feature 004)
STORAGE_BUCKET_NAME=siromix-uploads
STORAGE_ENDPOINT_URL=http://localhost:9000   # MinIO local
STORAGE_ACCESS_KEY_ID=minioadmin
STORAGE_SECRET_ACCESS_KEY=minioadmin
```

**Start MinIO locally** (Docker):

```bash
docker run -d -p 9000:9000 -p 9001:9001 \
  --name minio \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  quay.io/minio/minio server /data --console-address ":9001"
```

Create bucket via MinIO Console (http://localhost:9001) or CLI:

```bash
docker exec minio mc alias set myminio http://localhost:9000 minioadmin minioadmin
docker exec minio mc mb myminio/siromix-uploads
```

### Pipeline Integration

The extraction stage runs automatically when an exam is uploaded via `POST /api/v1/exams`. The Celery worker processes tasks through pipeline stages:

**Pipeline Flow**:
```
1. extract_docx (REAL)     ← Feature 006 implementation
   ↓ Outputs: DIJ artifact
2. ai_understanding (MOCK)
   ↓
3. ai_analysis (MOCK)
   ↓
4. shuffle (MOCK)
   ↓
5. render_docx (MOCK)
```

**Monitor extraction progress**:

```bash
# Poll task status
GET /api/v1/tasks/{task_id}

# Response shows current_stage and progress
{
  "task_id": "uuid",
  "status": "completed",
  "current_stage": "extract_docx",
  "progress": 100,
  "error": null
}
```

### Extraction Constraints

| Constraint | Value | Behavior on Violation |
|------------|-------|----------------------|
| **Max file size** | 50 MB | Reject with `DOCX_TOO_LARGE` error |
| **Max extraction time** | 5 minutes | Terminate with `EXTRACTION_TIMEOUT` error |
| **Supported formats** | DOCX only | Reject with `DOCX_INVALID_FORMAT` error |

### Error Codes

All extraction errors include structured diagnostics:

| Error Code | Meaning | User Action |
|------------|---------|-------------|
| `DOCX_INVALID_FORMAT` | File is not a valid DOCX | Upload a Microsoft Word .docx file |
| `DOCX_CORRUPTED` | File is damaged or incomplete | Re-export DOCX from Word |
| `DOCX_TOO_LARGE` | File exceeds 50 MB limit | Reduce file size or split document |
| `EXTRACTION_TIMEOUT` | Extraction took >5 minutes | Simplify document or contact support |
| `DIJ_VALIDATION_ERROR` | Output failed schema validation | Report bug with document sample |

### Testing

```bash
# Run extraction tests only
pytest tests/unit/test_extraction_service.py -v
pytest tests/integration/test_extract_docx_stage.py -v

# Run all Phase 6 tests (paragraphs, tables, images, math)
pytest tests/ -k "extraction or docx or dij" -v

# Test with real fixtures
pytest tests/integration/ --fixtures=tests/fixtures/sample_exams/
```

**Test fixtures** available in `tests/fixtures/sample_exams/`:
- `simple_text.docx` - 5 paragraphs with various formatting
- `with_tables.docx` - 2 tables (simple + merged cells)
- `with_images.docx` - 3 embedded images (PNG, JPEG)
- `with_math.docx` - 4 OMML equations

### Performance Benchmarks

From integration tests (T116):

| Document Size | Extraction Time | Target |
|---------------|-----------------|--------|
| Small (1-5 pages) | <1 second | <1s |
| Medium (10-20 pages) | 2-5 seconds | <10s |
| Large (50 pages) | 10-25 seconds | <30s |

**Note**: Actual performance depends on content complexity (tables, images, math).

### Architecture

**Core Components**:

```
app/core/
├── docx_parser.py         # DOCX validation and block extraction
├── image_extractor.py     # Image extraction and S3 upload
└── math_converter.py      # OMML → LaTeX conversion

app/services/
└── extraction_service.py  # Orchestrates extraction pipeline

app/tasks/
└── pipeline_stages.py     # extract_docx() Celery task

app/schemas/
├── dij.py                 # DIJ Pydantic models (versioned)
└── extraction.py          # Extraction request/response schemas
```

**Extraction Flow**:

1. **Validate** DOCX file (format, size, integrity)
2. **Extract blocks** using `python-docx`:
   - Paragraphs with formatting metadata
   - Tables with cell structure
   - Images → upload to S3
   - Math (OMML) → convert to LaTeX
3. **Build DIJ** with provenance and metadata
4. **Validate** against Pydantic schema
5. **Upload DIJ** to S3 as artifact
6. **Create artifact record** in database
7. **Return** extraction result with artifact IDs

### Monitoring & Observability

**Extraction metrics logged** (T126 - pending):

```python
# Metrics tracked per extraction:
- extraction_duration_ms
- blocks_extracted (total and by type)
- file_size_bytes
- warnings (unsupported content, conversion failures)
- error_code (if failed)
```

**Check Celery logs** for extraction details:

```bash
# In worker output:
2026-03-22 10:30:15 INFO extract_docx: Starting extraction for task_id=abc123
2026-03-22 10:30:16 INFO extract_docx: Extracted 42 blocks (35 paragraphs, 5 tables, 2 images)
2026-03-22 10:30:16 INFO extract_docx: DIJ uploaded to exams/user-uuid/midterm-exam/dij_v1_abc123.json
2026-03-22 10:30:16 INFO extract_docx: Extraction completed in 1250ms
```

### Troubleshooting

**Issue**: Extraction fails with `DOCX_INVALID_FORMAT`  
**Solution**: Ensure file is saved as `.docx` (not `.doc` or `.odt`). Re-save from Microsoft Word.

**Issue**: Images not extracted  
**Solution**: Verify MinIO/S3 is running and credentials are correct in `.env`

**Issue**: Math equations show `conversion_failed: true`  
**Solution**: LaTeX conversion failed but original OMML XML is preserved. Equations remain accessible in DIJ.

**Issue**: Extraction timeout after 5 minutes  
**Solution**: Document is too complex. Reduce embedded images or simplify tables.

### Related Documentation

- **Feature Spec**: `specs/006-docx-extraction/spec.md`
- **Implementation Plan**: `specs/006-docx-extraction/plan.md`
- **Task Breakdown**: `specs/006-docx-extraction/tasks.md`
- **DIJ Schema Contract**: `specs/006-docx-extraction/contracts/dij-schema-v1.0.json`
- **Success Criteria**: `specs/006-docx-extraction/quickstart.md`

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
