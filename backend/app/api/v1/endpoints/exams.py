"""
/exams endpoints: Exam creation and management.

Feature 004: File Upload & Exam Creation API
"""

from fastapi import APIRouter, Depends, status, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.database import get_db
from app.core.deps import get_current_user, get_storage_client
from app.models.user import User
from app.schemas.exam import ExamCreate, ExamResponse
from app.services.exam_service import ExamService
from app.core.storage import StorageClient


router = APIRouter()


@router.post("/exams", status_code=status.HTTP_201_CREATED)
async def create_exam(
    # File upload
    file: UploadFile = File(..., description="DOCX exam document (≤50MB)"),
    
    # Form fields (Pydantic model cannot be used directly with multipart/form-data)
    name: str = Form(..., max_length=500, description="Exam name/title"),
    subject: str = Form(..., max_length=500, description="Subject area"),
    academic_year: str = Form(..., max_length=50, description="Academic year (e.g., '2025-2026')"),
    grade_level: str = Form(None, max_length=100, description="Grade/class level"),
    duration_minutes: int = Form(..., gt=0, description="Exam duration in minutes"),
    num_variants: int = Form(..., gt=0, description="Number of exam variants to generate"),
    instructions: str = Form(None, description="Exam-level instructions"),
    
    # Dependencies
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage_client: StorageClient = Depends(get_storage_client),
):
    """
    Create new exam with file upload.
    
    Accepts multipart/form-data with exam metadata and DOCX file.
    Returns exam_id, task_id, and queued status upon successful creation.
    
    Workflow:
    1. Validate file format and size
    2. Upload file to object storage (MinIO/S3)
    3. Create Exam record (status="DRAFT")
    4. Create Task record (status="QUEUED") with required exam_id
    5. Enqueue Celery task for pipeline processing
    6. Return IDs for tracking
    
    Args:
        file: Uploaded DOCX exam document (max 50MB)
        name: Exam name (1-500 characters)
        subject: Subject area (1-500 characters)
        academic_year: Academic year like "2025-2026" (1-50 characters)
        grade_level: Optional grade/class level (0-100 characters)
        duration_minutes: Exam duration in minutes (must be > 0)
        num_variants: Number of variants to generate (must be > 0)
        instructions: Optional exam-level instructions
        current_user: Authenticated user from JWT token
        db: Database session
        storage_client: Object storage client
    
    Returns:
        JSON response with:
        - exam_id (UUID): Unique identifier for created exam
        - task_id (UUID): Unique identifier for processing task
        - status (str): Task status (always "queued" for new submissions)
    
    Raises:
        400: Validation error (missing fields, invalid values, wrong file format)
        401: Authentication required (missing or invalid JWT token)
        403: Insufficient permissions
        413: File size exceeds 50MB limit
        500: Internal server error (database failure)
        503: Storage service unavailable
        507: Storage quota exceeded
    
    Example:
        ```bash
        curl -X POST http://localhost:8000/api/v1/exams \\
          -H "Authorization: Bearer <token>" \\
          -F "name=Kiểm tra giữa kì - Toán" \\
          -F "subject=Toán học" \\
          -F "academic_year=2025-2026" \\
          -F "grade_level=6" \\
          -F "duration_minutes=60" \\
          -F "num_variants=3" \\
          -F "instructions=Học sinh được sử dụng máy tính" \\
          -F "file=@exam.docx"
        ```
    """
    # Validate file presence
    if not file:
        raise HTTPException(
            status_code=400,
            detail="File upload is required"
        )
    
    # Read file to determine size (needed for validation)
    file_content = await file.read()
    file.size = len(file_content)  # Set size attribute for validation
    
    # Reset file pointer for validation and service consumption
    await file.seek(0)
    
    # Validate file using centralized validation logic (Phase 4)
    # Create temporary service instance for validation
    temp_service = ExamService(db=db, storage_client=storage_client)
    temp_service.validate_docx_file(file)
    
    # Reset file pointer again after validation
    await file.seek(0)
    
    # Create ExamCreate Pydantic model from form fields
    exam_data = ExamCreate(
        name=name,
        subject=subject,
        academic_year=academic_year,
        grade_level=grade_level,
        num_variants=num_variants,
        duration_minutes=duration_minutes,
        instructions=instructions
    )
    
    # Call service layer to handle business logic
    exam_service = ExamService(db=db, storage_client=storage_client)
    
    exam_id, task_id, task_status = await exam_service.create_exam_with_upload(
        exam_data=exam_data,
        file=file,
        user_id=current_user.user_id
    )
    
    # Return response per API contract
    return {
        "exam_id": str(exam_id),
        "task_id": str(task_id),
        "status": task_status
    }
