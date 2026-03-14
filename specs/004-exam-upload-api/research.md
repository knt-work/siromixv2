# Research: File Upload & Exam Creation API

**Feature**: 004-exam-upload-api  
**Date**: March 13, 2026  
**Phase**: Phase 0 - Technical Research

## Purpose

Resolve technical uncertainties identified in Technical Context to inform implementation decisions.

## Research Questions

### 1. Object Storage Solution: S3 vs MinIO

**Question**: Should we use AWS S3 (via boto3) or MinIO (via minio Python client) for object storage?

**Context**: The system needs to store uploaded DOCX files and generated artifacts. No object storage implementation exists yet. The constitution specifies object storage (S3/MinIO) in architecture decisions but doesn't mandate a specific solution.

**Research Findings**:

#### Option A: AWS S3 (boto3)
- **Pros**:
  - Production-grade, highly reliable (99.999999999% durability)
  - Extensive documentation and community support
  - boto3 is well-maintained official SDK
  - S3-compatible APIs supported by many providers (DigitalOcean Spaces, Backblaze B2, etc.)
  - Built-in features: versioning, lifecycle policies, encryption, access logging
  - Easy to switch to S3-compatible services later

- **Cons**:
  - AWS costs (though minimal for MVP volumes)
  - Requires AWS account setup
  - Network latency for uploads/downloads
  - Vendor lock-in concerns (mitigated by S3-compatible API)

#### Option B: MinIO (minio-py)
- **Pros**:
  - Self-hosted, no cloud dependency
  - S3-compatible API (can switch to S3 later with minimal code changes)
  - Zero storage costs for local/self-hosted deployment
  - Fast local development (no network latency)
  - Good for air-gapped or on-premise requirements
  - Lightweight, easy Docker deployment

- **Cons**:
  - Self-hosting operational burden (backups, monitoring, scaling)
  - Less battle-tested at scale compared to S3
  - Need to manage storage infrastructure
  - minio-py client less mature than boto3

**Decision**: **Use boto3 with S3-compatible configuration** (supports both S3 and MinIO)

**Rationale**:
1. **Flexibility**: boto3 works with S3 and any S3-compatible service (including MinIO)
2. **Configuration-driven**: Use environment variables to point to S3 or MinIO endpoint
3. **Dev/Prod parity**: MinIO for local development, S3 for production
4. **Best of both worlds**: No lock-in, prod-ready SDK, easy testing
5. **Constitution alignment**: Modular monolith principle - storage backend is swappable

**Implementation approach**:
```python
# configuration pattern
STORAGE_ENDPOINT = os.getenv("STORAGE_ENDPOINT")  # None for S3, "http://localhost:9000" for MinIO
STORAGE_BUCKET = os.getenv("STORAGE_BUCKET", "siromix-exams")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

# boto3 s3 client works with both
s3_client = boto3.client(
    's3',
    endpoint_url=STORAGE_ENDPOINT,  # None = use AWS S3
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)
```

**Alternatives considered**:
- Direct minio-py: Rejected because boto3 has broader compatibility and better docs
- File system storage: Rejected because doesn't scale, no built-in reliability features, violates architecture decision in constitution

---

### 2. File Upload Handling: FastAPI multipart/form-data

**Question**: What's the best practice for handling large file uploads in FastAPI with validation?

**Research Findings**:

#### FastAPI File Upload Options

1. **UploadFile (Recommended)**:
   ```python
   from fastapi import File, UploadFile, Form
   
   @router.post("/exams")
   async def create_exam(
       file: UploadFile = File(...),
       name: str = Form(...),
       subject: str = Form(...),
       # ... other form fields
   ):
       # file.filename, file.content_type, file.file (SpooledTemporaryFile)
       content = await file.read()
   ```
   - **Pros**: Streaming, handles large files efficiently, built-in content-type
   - **Cons**: Cannot use Pydantic model directly for form data (need separate Form fields)

2. **bytes (Not recommended for this use case)**:
   - Loads entire file into memory
   - Not suitable for files >10MB

**Decision**: Use `UploadFile` with individual `Form()` parameters

**Rationale**:
- Efficient for 50MB limit
- Streaming prevents memory issues
- Can validate MIME type from `file.content_type`
- Follows FastAPI best practices

**Validation approach**:
```python
# file size validation
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
if file.size and file.size > MAX_FILE_SIZE:
    raise HTTPException(400, "File size exceeds 50MB limit")

# MIME type validation
ALLOWED_MIME_TYPES = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream"  # Some browsers send this for .docx
]
if file.content_type not in ALLOWED_MIME_TYPES:
    raise HTTPException(400, "Invalid file format. Only DOCX files are accepted")

# Extension validation (secondary check)
if not file.filename.endswith('.docx'):
    raise HTTPException(400, "File must have .docx extension")
```

---

### 3. Transaction Management: Database + File Upload Atomicity

**Question**: How to ensure atomicity when operations span database and object storage?

**Research Findings**:

#### Problem
- Database transactions can rollback
- S3/MinIO uploads cannot participate in DB transactions
- Risk: uploaded file but no DB record, or DB record but upload failed

#### Patterns

1. **Upload First, Then DB (Recommended)**:
   ```python
   # 1. Upload file to storage (idempotent path)
   file_path = upload_to_storage(file, user_id, exam_name)
   
   # 2. DB transaction with rollback
   try:
       async with db.begin():
           exam = create_exam_record(...)
           task = create_task_record(exam_id=exam.id)
           await db.commit()
       return exam, task
   except Exception:
       # File orphaned in storage, but no DB reference
       # Cleanup can happen asynchronously via cron/background job
       raise
   ```
   - **Pros**: DB rollback works normally, orphaned files are unreferenced
   - **Cons**: Orphaned files need eventual cleanup (acceptable)

2. **DB First, Then Upload**:
   - **Cons**: If upload fails, need to rollback DB (complex error handling)
   - Not recommended

3. **Two-Phase Commit**:
   - **Cons**: Overly complex for this use case
   - Not available with S3

**Decision**: Upload first, then DB transaction with rollback

**Rationale**:
- Simpler error handling
- DB rollback is clean
- Orphaned files are harmless (no references, can be cleaned up)
- Aligns with "fail fast" principle

**Cleanup strategy**:
- Background job finds files in storage with no DB references (>24hrs old)
- Delete orphaned files
- Not critical for MVP (orphans are rare and harmless)

---

### 4. Celery Task Enqueueing

**Question**: How to enqueue Celery task after exam creation?

**Research Findings**:

#### Current Implementation Check
- Celery is in dependencies (celery>=5.3.0, redis>=5.0.0)
- Need to verify if Celery is configured and running

#### Integration Pattern
```python
from app.tasks.process_exam import process_exam_task

# After DB commit
celery_task = process_exam_task.delay(task_id=task.task_id, exam_id=exam.exam_id)
# .delay() returns AsyncResult with task_id for tracking
```

**Decision**: Call `.delay()` after successful DB commit

**Rationale**:
- Standard Celery pattern
- Task only enqueued if DB transaction succeeds
- Fire-and-forget (don't wait for completion)

**Note**: Task implementation (process_exam_task) is out of scope for this feature. This feature only creates the Task record and enqueues the Celery job. Pipeline execution is separate.

---

## Summary of Decisions

| Research Question | Decision | Impact |
|-------------------|----------|--------|
| Object storage library | boto3 with S3-compatible config | Add boto3>=1.34.0 to dependencies |
| Storage backend | Configurable (S3 or MinIO via endpoint_url) | Environment-based configuration |
| File upload handling | FastAPI UploadFile + Form() parameters | Cannot use Pydantic model for multipart |
| Transaction atomicity | Upload first, DB transaction, rollback on error | Orphaned files acceptable (cleanup later) |
| DOCX validation | MIME type + extension checks | Implement in endpoint before upload |
| Celery integration | .delay() after DB commit | Assumes Celery is configured (verify in implementation) |

## Dependencies to Add

```toml
[project.dependencies]
# Add to backend/pyproject.toml
"boto3>=1.34.0",  # AWS SDK (works with S3 and MinIO)
```

## Environment Variables Required

```bash
# Object Storage Configuration
STORAGE_ENDPOINT=  # Empty/unset for AWS S3, "http://localhost:9000" for MinIO
STORAGE_BUCKET="siromix-exams"
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION="us-east-1"  # Required for S3, ignored by MinIO

# File Upload Limits
MAX_FILE_SIZE_MB=50
```

## Next Steps

- Phase 1: Define data model changes (duration_minutes, exam_id constraints)
- Phase 1: Define API contract (POST /api/v1/exams)
- Phase 1: Create storage service module design
