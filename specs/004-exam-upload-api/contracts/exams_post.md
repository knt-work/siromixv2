# API Contract: POST /api/v1/exams

## Endpoint

**Method**: `POST`  
**Path**: `/api/v1/exams`  
**Purpose**: Create new exam with file upload  
**Authentication**: Required (JWT token in Authorization header)

## Request

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```

### Body (multipart/form-data)

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `name` | string | Yes | Exam name/title | 1-500 characters |
| `subject` | string | Yes | Subject area | 1-500 characters |
| `academic_year` | string | Yes | Academic year (e.g., "2025-2026") | 1-50 characters |
| `grade_level` | string | No | Grade/class level | 0-100 characters |
| `duration_minutes` | integer | Yes | Exam duration in minutes | Must be > 0 |
| `num_variants` | integer | Yes | Number of exam variants to generate | Must be > 0 |
| `instructions` | string | No | Exam-level instructions | No limit |
| `file` | binary | Yes | DOCX exam document | DOCX format, ≤ 50MB |

### Example Request (curl)

```bash
curl -X POST http://localhost:8000/api/v1/exams \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "name=Kiểm tra giữa kì - Toán" \
  -F "subject=Toán học" \
  -F "academic_year=2025-2026" \
  -F "grade_level=6" \
  -F "duration_minutes=60" \
  -F "num_variants=3" \
  -F "instructions=Học sinh được sử dụng máy tính cầm tay" \
  -F "file=@/path/to/exam.docx"
```

### Example Request (JavaScript - Frontend)

```typescript
const formData = new FormData();
formData.append('name', 'Kiểm tra giữa kì - Toán');
formData.append('subject', 'Toán học');
formData.append('academic_year', '2025-2026');
formData.append('grade_level', '6');
formData.append('duration_minutes', '60');
formData.append('num_variants', '3');
formData.append('instructions', 'Học sinh được sử dụng máy tính cầm tay');
formData.append('file', selectedFile); // File object from input

const response = await fetch('/api/v1/exams', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});
```

## Response

### Success Response (201 Created)

**Status Code**: `201 Created`  
**Content-Type**: `application/json`

```json
{
  "exam_id": "123e4567-e89b-12d3-a456-426614174000",
  "task_id": "987fcdeb-51a2-43b1-9f8a-123456789abc",
  "status": "queued"
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `exam_id` | string (UUID) | Unique identifier for created exam |
| `task_id` | string (UUID) | Unique identifier for processing task |
| `status` | string | Task status (always "queued" for new submissions) |

### Error Responses

#### 400 Bad Request - Validation Errors

**Scenario**: Missing required fields, invalid field values, invalid file format

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "name"],
      "msg": "Field required",
      "input": null
    }
  ]
}
```

**Common Validation Errors**:
| Error | Status | Response |
|-------|--------|----------|
| Missing required field | 400 | `{"detail": [{"loc": ["body", "field_name"], "msg": "Field required"}]}` |
| Field exceeds max length | 400 | `{"detail": [{"loc": ["body", "name"], "msg": "String should have at most 500 characters"}]}` |
| Invalid integer value | 400 | `{"detail": [{"loc": ["body", "num_variants"], "msg": "Input should be greater than 0"}]}` |
| Invalid file format | 400 | `{"detail": "Invalid file format. Only DOCX files are accepted"}` |
| File size exceeds limit | 400 | `{"detail": "File size exceeds maximum allowed limit of 50 MB"}` |
| Missing file upload | 400 | `{"detail": "File upload is required"}` |

#### 401 Unauthorized - Authentication Required

**Scenario**: Missing or invalid JWT token

```json
{
  "detail": "Not authenticated"
}
```

#### 403 Forbidden - Insufficient Permissions

**Scenario**: Token valid but user lacks permission to create exams

```json
{
  "detail": "Insufficient permissions to create exams"
}
```

#### 413 Payload Too Large - File Size Limit

**Scenario**: File exceeds 50MB limit (may be caught at reverse proxy level)

```json
{
  "detail": "File size exceeds maximum allowed limit of 50 MB"
}
```

#### 500 Internal Server Error - Database Failure

**Scenario**: Database connection failure, transaction rollback

```json
{
  "detail": "An internal error occurred. Please try again later."
}
```

**Note**: Detailed error information is logged server-side but not exposed to client.

#### 503 Service Unavailable - Storage Unavailable

**Scenario**: Object storage service unreachable or unavailable

```json
{
  "detail": "Storage service is temporarily unavailable. Please try again later."
}
```

#### 504 Gateway Timeout - Upload Timeout

**Scenario**: File upload operation times out

```json
{
  "detail": "File upload timed out. Please try again with a smaller file."
}
```

#### 507 Insufficient Storage - Quota Exceeded

**Scenario**: Storage quota limit reached

```json
{
  "detail": "Storage capacity reached. Please contact support."
}
```

## Validation Rules

### Field Validation (Pydantic Layer)

Performed before file processing:
- All string fields: Check length constraints
- Integer fields: Check positive value constraint (> 0)
- Required fields: Check presence

### File Validation (Application Layer)

Performed after receiving file:
1. **Size check**: Verify file size ≤ 50MB
2. **Format check**: Verify MIME type is `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
3. **Extension check**: Verify filename ends with `.docx`
4. **Corruption check**: Verify DOCX is valid ZIP archive (optional - may defer to processing stage)

## Internal Processing Flow

**Not visible to API consumer, documented for implementation reference:**

1. **Receive request**: FastAPI parses multipart/form-data
2. **Authenticate**: Verify JWT token and extract user_id
3. **Validate metadata**: Pydantic validates ExamCreate schema
4. **Validate file**: Check size, format, extension
5. **Upload file to storage**:
   - Generate storage path: `exams/{user_id}/{exam-name-kebab}/original.docx`
   - Upload via boto3 S3 client
   - Get file URL/path
6. **Begin database transaction**:
   - Create Exam record (status="draft", user_id from token)
   - Create Artifact record (file_path, exam_id)
   - Create Task record (status="queued", exam_id)
   - Commit transaction
7. **Enqueue Celery task**: Call `process_exam_task.delay(task_id)`
8. **Return response**: JSON with exam_id, task_id, status

**Rollback on Failure**:
- If storage upload fails → Return 503
- If DB transaction fails → Delete uploaded file, return 500
- If Celery enqueue fails → Log error, return 500 (task can be requeued manually)

## Rate Limiting

**Not implemented in MVP**. Future consideration:
- Limit: 10 requests per minute per user
- Response: 429 Too Many Requests

## CORS Configuration

**Required for frontend**:
- Allow origin: `http://localhost:3000` (dev), production domain (prod)
- Allow methods: `POST, OPTIONS`
- Allow headers: `Authorization, Content-Type`

## Security Considerations

1. **Authentication**: JWT token required, validated before processing
2. **Authorization**: User can only create exams under their own user_id
3. **File validation**: Prevent malicious file uploads (size limit, format check)
4. **Path traversal**: Sanitize exam names before generating storage paths (use kebab-case utility)
5. **SQL injection**: Use parameterized queries (SQLAlchemy ORM)
6. **Error disclosure**: Don't expose internal errors (stack traces, file paths) in API responses

## Performance Expectations

- **Small files (<5MB)**: Response within 2 seconds
- **Medium files (5-20MB)**: Response within 5 seconds
- **Large files (20-50MB)**: Response within 10 seconds

**Note**: Response time includes file upload to storage + database writes. Actual exam processing happens asynchronously in Celery worker.

## OpenAPI Specification

```yaml
/api/v1/exams:
  post:
    summary: Create new exam with file upload
    tags:
      - exams
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        multipart/form-data:
          schema:
            type: object
            required:
              - name
              - subject
              - academic_year
              - duration_minutes
              - num_variants
              - file
            properties:
              name:
                type: string
                maxLength: 500
                example: "Kiểm tra giữa kì - Toán"
              subject:
                type: string
                maxLength: 500
                example: "Toán học"
              academic_year:
                type: string
                maxLength: 50
                example: "2025-2026"
              grade_level:
                type: string
                maxLength: 100
                example: "6"
              duration_minutes:
                type: integer
                minimum: 1
                example: 60
              num_variants:
                type: integer
                minimum: 1
                example: 3
              instructions:
                type: string
                example: "Học sinh được sử dụng máy tính cầm tay"
              file:
                type: string
                format: binary
                description: "DOCX file (max 50MB)"
    responses:
      '201':
        description: Exam created successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                exam_id:
                  type: string
                  format: uuid
                task_id:
                  type: string
                  format: uuid
                status:
                  type: string
                  enum: [queued]
      '400':
        description: Validation error
      '401':
        description: Not authenticated
      '500':
        description: Internal server error
      '503':
        description: Storage service unavailable
```

## Testing Checklist

### Happy Path Tests
- ✅ Submit valid exam with all required fields + DOCX file → 201 with exam_id, task_id
- ✅ Submit exam with optional fields (grade_level, instructions) → 201
- ✅ Verify exam record created with status="draft"
- ✅ Verify task record created with status="queued"
- ✅ Verify file uploaded to correct storage path
- ✅ Verify Celery task enqueued

### Validation Tests
- ✅ Submit without file → 400
- ✅ Submit with PDF instead of DOCX → 400
- ✅ Submit with file > 50MB → 400/413
- ✅ Submit with missing required field (name) → 400
- ✅ Submit with name > 500 chars → 400
- ✅ Submit with num_variants = 0 → 400
- ✅ Submit with duration_minutes = -5 → 400

### Authentication Tests
- ✅ Submit without token → 401
- ✅ Submit with invalid token → 401
- ✅ Submit with expired token → 401

### Error Handling Tests
- ✅ Storage service unavailable → 503
- ✅ Database connection failure → 500
- ✅ Transaction rollback on error → No orphaned records
- ✅ File uploaded but DB fails → File cleaned up

### Concurrency Tests
- ✅ Multiple users submit simultaneously → No collisions
- ✅ Same user submits duplicate exams → Both created with unique IDs
