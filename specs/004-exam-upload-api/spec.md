# Feature Specification: File Upload & Exam Creation API

**Feature Branch**: `004-exam-upload-api`  
**Created**: March 13, 2026  
**Status**: Draft  
**Input**: User description: "Create File Upload & Exam Creation API - UI Page: Create Exam Form. Backend implementation for accepting multipart form data with exam metadata and DOCX file, creating Exam and Task records using Feature 003 schema, uploading files to S3/MinIO storage, and returning exam_id and task_id for tracking."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User submits exam creation form with file upload (Priority: P1)

When a teacher fills out the Create New Exam form with exam metadata (academic year, exam name, subject, duration, number of versions, optional instructions) and attaches a DOCX file, they click Submit and the system accepts the multipart form data, creates an exam record with "draft" status, uploads the file to object storage, creates a task record with "queued" status, and returns the exam ID and task ID to the UI for tracking.

**Why this priority**: This is the foundational capability that enables the entire exam creation workflow. Without this, users cannot submit exams for processing. This represents the minimum viable feature that delivers end-to-end value from form submission to storage.

**Independent Test**: Can be fully tested by submitting a complete form with a valid DOCX file through the API endpoint, verifying that an exam record is created in the database with "draft" status, the file appears in object storage at the correct path, a task record exists with "queued" status and correct exam_id reference, and the API response contains valid exam_id and task_id UUIDs.

**Acceptance Scenarios**:

1. **Given** a user has completed the exam creation form with all required fields (academic_year="2025-2026", grade_level="6", name="Kiểm tra giữa kì - Toán", subject="Toán học", duration_minutes=60, num_versions=3) and attached a DOCX file, **When** they submit the form, **Then** the API creates an exam record with status="draft", uploads the file to object storage, creates a task record with status="queued", and returns JSON containing exam_id, task_id, and status="queued"
2. **Given** a user submits an exam with optional instructions field populated, **When** the API processes the request, **Then** the instructions are stored in the exam record's instructions field
3. **Given** an authenticated user submits the exam creation form, **When** the exam record is created, **Then** the user_id is automatically associated with the exam record

---

### User Story 2 - System validates file format and metadata before processing (Priority: P2)

When a user submits the exam creation form, the system validates that the uploaded file is a DOCX format, all required metadata fields are present and meet constraints (field lengths, data types, value ranges), and rejects submissions that don't meet validation rules with clear error messages indicating which fields failed validation.

**Why this priority**: Prevents invalid data from entering the system and provides immediate user feedback. This is P2 because P1 establishes the happy path, and validation protects data integrity.

**Independent Test**: Can be fully tested by submitting forms with various invalid inputs (non-DOCX files, missing required fields, fields exceeding length limits, invalid data types) and verifying that each returns appropriate 400 Bad Request responses with specific validation error messages without creating database records or uploading files.

**Acceptance Scenarios**:

1. **Given** a user submits an exam creation form with a PDF file instead of DOCX, **When** the API validates the file, **Then** it returns a 400 Bad Request with error message "Invalid file format. Only DOCX files are accepted"
2. **Given** a user submits a form with name missing, **When** the API validates the request, **Then** it returns a 400 Bad Request with error message "Required field missing: name"
3. **Given** a user submits a form with name exceeding 500 characters, **When** the API validates the request, **Then** it returns a 400 Bad Request with error message "Field 'name' exceeds maximum length of 500 characters"
4. **Given** a user submits a form with num_versions=0 or negative number, **When** the API validates the request, **Then** it returns a 400 Bad Request with error message "Field 'num_versions' must be a positive integer"
5. **Given** a user submits a form with a file larger than the allowed limit, **When** the API validates the file size, **Then** it returns a 400 Bad Request with error message "File size exceeds maximum allowed limit of [X] MB"

---

### User Story 3 - System organizes uploaded files in user-specific storage paths (Priority: P2)

When the system uploads a DOCX file to object storage, it generates a structured path following the pattern `exams/{user_id}/{exam-name-kebab}/original.docx` using the artifact path utilities from Feature 003, ensuring files are organized by user and exam, preventing naming collisions, and enabling efficient retrieval.

**Why this priority**: Essential for file organization, multi-tenancy, and integration with the artifact management system from Feature 003. This is P2 because file upload must work (P1) before path structure matters.

**Independent Test**: Can be fully tested by submitting exams with various user IDs and exam names, then verifying the files appear in object storage at paths matching the expected pattern with properly kebab-cased exam names, and confirming subsequent requests use the artifact_paths.py utilities to construct retrieval URLs.

**Acceptance Scenarios**:

1. **Given** user with ID "123e4567-e89b-12d3-a456-426614174000" submits an exam named "Kiểm tra giữa kì - Toán", **When** the file is uploaded to storage, **Then** it is stored at path `exams/123e4567-e89b-12d3-a456-426614174000/kiem-tra-giua-ki-toan/original.docx`
2. **Given** two different users submit exams with the same name, **When** files are uploaded, **Then** both files are stored in separate user-specific directories without collision
3. **Given** an exam file is uploaded successfully, **When** the system needs to generate a download URL, **Then** it uses the artifact_paths.py utilities to construct the correct storage path

---

### User Story 4 - System provides meaningful error responses for storage and database failures (Priority: P3)

When file upload to object storage fails (network issues, storage unavailable, permission denied), or when database operations fail (connection timeout, unique constraint violation), the system rolls back any partial operations, returns appropriate HTTP status codes (500 for server errors, 503 for service unavailable), logs detailed error information, and provides user-friendly error messages without exposing internal system details.

**Why this priority**: Critical for production reliability and debugging, but P3 because happy path and validation (P1, P2) must work first. Error handling enhances user experience but isn't blocking for MVP.

**Independent Test**: Can be fully tested by simulating various failure scenarios (mock storage service returning errors, database connection failures, partial failures after exam creation but before task creation) and verifying correct status codes, rollback behavior (no orphaned records), error logging, and user-facing error messages.

**Acceptance Scenarios**:

1. **Given** the object storage service is unavailable, **When** a user submits an exam creation form, **Then** the API returns 503 Service Unavailable with message "Unable to upload file. Please try again later" and no exam or task records are created
2. **Given** the exam record is created successfully but task creation fails, **When** the API detects the failure, **Then** it rolls back the exam record creation and returns 500 Internal Server Error
3. **Given** a network timeout occurs during file upload, **When** the API times out, **Then** it returns 504 Gateway Timeout with message "File upload timed out. Please try again" and cleans up any partial uploads
4. **Given** any error occurs during the exam creation process, **When** the error is caught, **Then** detailed error information (stack trace, context) is logged to the application logs for debugging

---

### Edge Cases

- What happens when a user uploads a DOCX file with a corrupted format that passes initial validation but fails during processing? → System should detect corruption during file read operations and return an appropriate error without creating invalid records.
- How does the system handle duplicate exam submissions (same user, same metadata, submitted within seconds)? → System should allow duplicates by design since teachers may intentionally create multiple versions of similar exams; use database timestamps and unique IDs to differentiate.
- What happens when the uploaded file name contains special characters or non-ASCII characters? → System should sanitize file names for storage path generation while preserving the original exam name in the name field.
- How does the system handle very large DOCX files? → System should enforce file size limits (validate in P2) and return clear error messages; consider implementing chunked upload for larger files in future iterations.
- What happens when object storage quota is exceeded? → System should catch quota exceeded errors and return 507 Insufficient Storage with message "Storage capacity reached. Please contact support."

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an exam submission mechanism that accepts exam metadata fields (academic_year, grade_level, name, subject, duration_minutes, num_versions, instructions) along with a document file
- **FR-002**: System MUST validate that the uploaded file is in DOCX format
- **FR-003**: System MUST validate all required metadata fields are present: academic_year, name, subject, duration_minutes, num_versions
- **FR-004**: System MUST validate field constraints per Feature 003 schema: name ≤500 chars, subject ≤500 chars, academic_year ≤50 chars, grade_level ≤100 chars (optional), num_versions must be positive integer, duration_minutes must be positive integer
- **FR-005**: System MUST create an Exam record using the database schema from Feature 003 (extended with duration_minutes field) with status="draft", user_id from authenticated session, and all provided metadata fields including duration_minutes
- **FR-006**: System MUST store the DOCX file in persistent storage following a structured path pattern `exams/{user_id}/{exam-name-kebab}/original.docx` where exam-name-kebab is the kebab-cased version of the exam name
- **FR-007**: System MUST create a Task record linked to the exam via exam_id foreign key with status="queued"
- **FR-008**: System MUST return JSON response containing exam_id (UUID), task_id (UUID), and status (string="queued") upon successful creation
- **FR-009**: System MUST use the artifact_paths.py utilities from Feature 003 to generate storage paths for consistency with artifact management
- **FR-010**: System MUST associate the exam with the authenticated user's ID from the session
- **FR-011**: System MUST perform all operations (exam creation, file upload, task creation) within a transactional boundary to ensure atomicity
- **FR-012**: System MUST roll back all operations if any step fails (no orphaned exam records without files, no files without exam records)
- **FR-013**: System MUST return appropriate status responses indicating: success, validation failures, authentication failures, system failures, and storage unavailability
- **FR-014**: System MUST generate unique identifiers (UUIDs) for exam_id and task_id
- **FR-015**: System MUST store exam creation timestamp and updated timestamp in the exam record
- **FR-016**: System MUST enforce a reasonable file size limit appropriate for exam documents (typically 50MB based on industry standards for document uploads containing text, images, and basic formatting)
- **FR-017**: System MUST initiate background processing for exam extraction after successful creation

### Key Entities

- **Exam**: Uses the database entity from Feature 003, extended with duration_minutes field. Represents exam metadata with attributes: name, subject, academic_year, grade_level, duration_minutes (exam duration in minutes), num_versions, instructions (optional exam-level instructions), exam_status (set to "draft" on creation), user_id, created_at, updated_at. The exam owns the uploaded document and is the parent entity for all processing tasks and generated artifacts.
- **Task**: Uses the extended database entity from Feature 003. Represents an asynchronous processing job with attributes: exam_id (foreign key), status (set to "queued" on creation), stage, progress. The task tracks the execution of the exam processing pipeline triggered by file upload.
- **File Upload**: Represents the uploaded DOCX document stored in object storage. Location determined by structured path pattern using user_id and kebab-cased exam name. Original filename preserved in exam metadata.
- **API Request**: Represents the multipart/form-data submission containing form fields (academic_year, grade_level, name, subject, duration_minutes, num_versions, instructions) and binary file data. Must include authentication token/session.
- **API Response**: Represents the JSON response returned to the UI containing exam_id, task_id, and status for client-side tracking.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully upload exam files and receive confirmation within 5 seconds for files under 10MB
- **SC-002**: API validates and rejects invalid submissions with specific error messages before any database writes occur
- **SC-003**: 100% of successful submissions create both exam and task records together with no partial failures (no orphaned records)
- **SC-004**: Uploaded files are retrievable using the generated storage path within 1 second of upload completion
- **SC-005**: API handles concurrent exam submissions from multiple users without data corruption or file naming collisions
- **SC-006**: System gracefully handles storage failures and database errors with appropriate user feedback and zero data loss
- **SC-007**: API response contains all required fields (exam_id, task_id, status) in documented JSON format 100% of the time for successful requests

## Clarifications

### Session 2026-03-13

- Q: The specification mentions a `duration_minutes` field as a required field, but the backend `ExamCreate` schema and `Exam` model do not have this field. Should we add it, remove it from spec, or store it elsewhere? → A: Add duration_minutes field to the Exam schema and database model - it is important exam metadata in Vietnam that must be tracked at the database level
- Q: The specification states that the task should be created with status="pending", but the backend TaskStatus enum defines: QUEUED, RUNNING, COMPLETED, FAILED - no "pending" status exists. Should we use "queued", add "pending" to enum, or map at API layer? → A: Use "queued" as initial task status to match existing Task schema
- Q: The specification uses field name "exam_name" throughout, but the backend ExamCreate Pydantic schema uses "name" as the field name. Should we change backend to "exam_name", update spec to "name", or support both via aliasing? → A: Update spec to use "name" instead of "exam_name" to match the existing backend schema
- Q: The specification mentions a "notes" field in API that maps to "instructions" in database. Should we keep "notes" in API with mapping, use "instructions" consistently, or support both as aliases? → A: Use "instructions" consistently in both API and database for clarity and simplicity
- Q: The specification states Task must be "linked to exam via exam_id foreign key", but the Task model defines exam_id as optional (nullable=True) and TaskCreate schema has no exam_id parameter. Should we make exam_id required, keep it optional with internal setting, or create separate schema? → A: Make exam_id required in Task model (change nullable to False) and add exam_id to TaskCreate schema for explicit association
