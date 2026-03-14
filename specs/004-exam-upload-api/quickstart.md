# Quickstart Guide - Feature 004: File Upload & Exam Creation API

## Overview

This guide helps developers set up and test the File Upload & Exam Creation API locally. By the end, you'll be able to submit exam files via API and verify the complete flow (file upload → database records → task queue).

## Prerequisites

Before starting, ensure you have:

- **Python 3.11+** installed (`python --version`)
- **PostgreSQL 14+** running locally or accessible remotely
- **Redis 5.0+** running locally (for Celery broker)
- **MinIO or AWS S3** access (for object storage)
- **Git** for cloning the repository
- **curl or Postman** for testing API endpoints

## Environment Setup

### 1. Install Dependencies

```bash
cd backend

# Install production dependencies
pip install -e .

# Install development dependencies (includes pytest)
pip install -e ".[dev]"

# Install boto3 for S3/MinIO integration (NEW for this feature)
pip install boto3>=1.34.0
```

**Note**: Update `pyproject.toml` to include `boto3>=1.34.0` in the `dependencies` array.

### 2. Configure Environment Variables

Create or update `backend/.env` with the following:

```bash
# Database Configuration
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/siromix_dev

# Redis Configuration (Celery Broker)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# Object Storage Configuration (NEW for this feature)
STORAGE_BUCKET_NAME=siromix-exams
STORAGE_ENDPOINT_URL=http://localhost:9000  # MinIO local, or AWS S3 URL
STORAGE_ACCESS_KEY_ID=minioadmin           # MinIO default, or AWS key
STORAGE_SECRET_ACCESS_KEY=minioadmin       # MinIO default, or AWS secret
STORAGE_REGION=us-east-1                   # Required for AWS S3, ignored by MinIO

# JWT Authentication
JWT_SECRET_KEY=your-secret-key-here  # Generate with: openssl rand -hex 32
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60

# Application Settings
ENVIRONMENT=development
DEBUG=true
```

### 3. Set Up Object Storage (MinIO Local Development)

**Option A: MinIO via Docker (Recommended for Local Dev)**

```bash
# Start MinIO container
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"

# Verify MinIO is running
curl http://localhost:9000/minio/health/live

# Access MinIO Console at http://localhost:9001
# Login: minioadmin / minioadmin
```

**Create Bucket via Console**:
1. Open http://localhost:9001
2. Login with `minioadmin` / `minioadmin`
3. Navigate to "Buckets" → "Create Bucket"
4. Enter bucket name: `siromix-exams`
5. Click "Create Bucket"

**Option B: AWS S3**

If using AWS S3, update `.env`:
```bash
STORAGE_ENDPOINT_URL=  # Leave empty for AWS S3
STORAGE_BUCKET_NAME=your-s3-bucket-name
STORAGE_ACCESS_KEY_ID=your-aws-access-key
STORAGE_SECRET_ACCESS_KEY=your-aws-secret-key
STORAGE_REGION=your-aws-region  # e.g., us-east-1
```

### 4. Set Up PostgreSQL Database

```bash
# Create database
createdb siromix_dev

# Or via psql
psql -U postgres
CREATE DATABASE siromix_dev;
\q
```

### 5. Run Database Migrations

```bash
cd backend

# Run existing migrations (Feature 003 - Exam/Task models without new fields)
alembic upgrade head

# Generate migration for Feature 004 changes
alembic revision --autogenerate -m "Add duration_minutes to Exam and make Task.exam_id required"

# Review generated migration in backend/alembic/versions/
# Edit if necessary (see data-model.md for migration scripts)

# Apply new migration
alembic upgrade head

# Verify tables
psql -U postgres -d siromix_dev -c "\d exams"
psql -U postgres -d siromix_dev -c "\d tasks"
```

**Expected Schema After Migration**:
- `exams` table has `duration_minutes` column (INTEGER, NOT NULL)
- `tasks` table has `exam_id` column (UUID, NOT NULL, FOREIGN KEY)

## Running the Services

### Terminal 1: Start FastAPI Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Verify**: Open http://localhost:8000/docs (Swagger UI should load)

### Terminal 2: Start Celery Worker

```bash
cd backend
celery -A app.tasks.celery_app worker --loglevel=info
```

**Verify**: Console shows "celery@hostname ready" message

### Terminal 3: Start Frontend (Optional)

```bash
cd frontend
npm install
npm run dev
```

**Verify**: Open http://localhost:3000 (exam creation form should load)

## Testing the Feature

### Step 1: Authenticate and Get JWT Token

**Register/Login** (assuming auth endpoint exists):

```bash
# Example: Login with Google OAuth (adjust to your auth flow)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"id_token": "your-google-id-token"}'
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Save token for subsequent requests**.

### Step 2: Create Exam with File Upload

```bash
curl -X POST http://localhost:8000/api/v1/exams \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Kiểm tra giữa kì - Toán" \
  -F "subject=Toán học" \
  -F "academic_year=2025-2026" \
  -F "grade_level=6" \
  -F "duration_minutes=60" \
  -F "num_variants=3" \
  -F "instructions=Học sinh được sử dụng máy tính cầm tay" \
  -F "file=@/path/to/your/exam.docx"
```

**Expected Response (201 Created)**:
```json
{
  "exam_id": "123e4567-e89b-12d3-a456-426614174000",
  "task_id": "987fcdeb-51a2-43b1-9f8a-123456789abc",
  "status": "queued"
}
```

### Step 3: Verify Database Records

```bash
# Check exam record
psql -U postgres -d siromix_dev -c \
  "SELECT exam_id, name, status, duration_minutes FROM exams ORDER BY created_at DESC LIMIT 1;"

# Check task record
psql -U postgres -d siromix_dev -c \
  "SELECT task_id, exam_id, status FROM tasks ORDER BY created_at DESC LIMIT 1;"

# Check artifact record (if Artifact table exists)
psql -U postgres -d siromix_dev -c \
  "SELECT artifact_id, exam_id, file_path FROM artifacts ORDER BY upload_date DESC LIMIT 1;"
```

**Expected Results**:
- Exam: `status = 'draft'`, `duration_minutes = 60`
- Task: `status = 'queued'`, `exam_id = <exam_id from Step 2>`
- Artifact: `file_path = 'exams/{user_id}/{exam-name-kebab}/original.docx'`

### Step 4: Verify File Upload to Storage

**MinIO Console**:
1. Open http://localhost:9001
2. Navigate to "Buckets" → `siromix-exams`
3. Browse to `exams/{user_id}/{exam-name-kebab}/`
4. Verify `original.docx` exists and has correct size

**CLI (using AWS CLI with MinIO)**:
```bash
aws s3 ls s3://siromix-exams/exams/ \
  --endpoint-url http://localhost:9000 \
  --no-sign-request

# Download file to verify integrity
aws s3 cp s3://siromix-exams/exams/{user_id}/{exam-name-kebab}/original.docx ./downloaded.docx \
  --endpoint-url http://localhost:9000 \
  --no-sign-request
```

### Step 5: Monitor Celery Task Execution

**In Celery Worker Terminal (Terminal 2)**, watch for log output:

```
[2026-03-13 10:30:45,123: INFO/MainProcess] Task process_exam_task[987fcdeb-51a2-43b1-9f8a-123456789abc] received
[2026-03-13 10:30:46,456: INFO/ForkPoolWorker-1] Task process_exam_task[987fcdeb-51a2-43b1-9f8a-123456789abc] succeeded in 1.2s
```

**Check task status update**:
```bash
psql -U postgres -d siromix_dev -c \
  "SELECT task_id, status, current_stage, progress FROM tasks WHERE task_id = '987fcdeb-51a2-43b1-9f8a-123456789abc';"
```

**Expected**: `status = 'running'` or `'completed'` (depending on processing stage)

## Running Unit Tests

```bash
cd backend

# Run all tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_api/test_exams.py

# Run specific test function
pytest tests/test_api/test_exams.py::test_create_exam_success
```

**View coverage report**: Open `backend/htmlcov/index.html` in browser

## Common Issues & Solutions

### Issue 1: "Module 'boto3' not found"

**Solution**: Install boto3
```bash
pip install boto3>=1.34.0
```

### Issue 2: "Storage bucket does not exist"

**Solution**: Create bucket in MinIO Console or via AWS CLI
```bash
# MinIO
aws s3 mb s3://siromix-exams --endpoint-url http://localhost:9000

# AWS S3
aws s3 mb s3://your-bucket-name --region us-east-1
```

### Issue 3: Database migration fails - "column duration_minutes does not exist"

**Solution**: Run migration
```bash
alembic upgrade head
```

If migration doesn't exist, generate it:
```bash
alembic revision --autogenerate -m "Add duration_minutes to Exam"
alembic upgrade head
```

### Issue 4: "Could not connect to Redis"

**Solution**: Start Redis server
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### Issue 5: Celery worker not picking up tasks

**Solution**:
1. Verify worker is running: Check Terminal 2 for "celery@hostname ready"
2. Verify Redis connection: `redis-cli ping` should return `PONG`
3. Restart Celery worker: `Ctrl+C` in Terminal 2, then restart command

### Issue 6: "Field 'exam_id' is required" when creating Task

**Solution**: Verify database migration applied correctly
```bash
psql -U postgres -d siromix_dev -c "\d tasks"
```

Check that `exam_id` column has `not null` constraint. If not, run migration.

### Issue 7: File upload fails with "Access Denied"

**Solution**: Check MinIO/S3 credentials in `.env` and bucket permissions
```bash
# MinIO: Verify credentials match container
docker logs minio

# S3: Verify IAM policy grants s3:PutObject permission
```

## API Documentation

Once the backend is running, access interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Navigate to `POST /api/v1/exams` endpoint to see full contract specification and try the endpoint interactively.

## Test Data

### Sample DOCX File

Create a simple test DOCX file:

```bash
# Create test file (requires LibreOffice or Word)
echo "This is a test exam document." > test-exam.txt
# Convert to DOCX manually or use existing DOCX file
```

Or download sample: (provide link to test DOCX file in project repository)

### Sample cURL Commands

**Valid submission**:
```bash
curl -X POST http://localhost:8000/api/v1/exams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Test Exam" \
  -F "subject=Mathematics" \
  -F "academic_year=2025-2026" \
  -F "duration_minutes=45" \
  -F "num_variants=2" \
  -F "file=@test-exam.docx"
```

**Invalid submission (missing field)**:
```bash
curl -X POST http://localhost:8000/api/v1/exams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "subject=Mathematics" \
  -F "file=@test-exam.docx"
# Expected: 400 Bad Request with validation error
```

**Invalid file format**:
```bash
curl -X POST http://localhost:8000/api/v1/exams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Test Exam" \
  -F "subject=Mathematics" \
  -F "academic_year=2025-2026" \
  -F "duration_minutes=45" \
  -F "num_variants=2" \
  -F "file=@test-exam.pdf"
# Expected: 400 Bad Request - "Invalid file format"
```

## Next Steps

After verifying the feature works locally:

1. **Write unit tests** for exam creation endpoint
2. **Write integration tests** for storage upload + database transaction
3. **Add frontend integration** to submit form from UI
4. **Deploy to staging** environment with production-like storage (AWS S3)
5. **Monitor Celery tasks** in production with Flower dashboard

## References

- [Feature Specification](spec.md) - User stories and requirements
- [API Contract](contracts/exams_post.md) - Detailed endpoint specification
- [Data Model](data-model.md) - Database schema and validation rules
- [Research](research.md) - Technical decisions and patterns
- [Backend README](../backend/README.md) - Overall backend documentation
