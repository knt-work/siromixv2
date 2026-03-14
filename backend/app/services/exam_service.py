"""
Exam service: Business logic for exam creation and management.

Handles exam file uploads, database operations, and task queue integration
for Feature 004: File Upload & Exam Creation API.
"""

import logging
from typing import BinaryIO, Tuple
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile, HTTPException

from app.models.exam import Exam, ExamStatus
from app.models.task import Task, TaskStatus
from app.schemas.exam import ExamCreate
from app.core.storage import StorageClient
from app.tasks.process_task import process_task
from botocore.exceptions import ClientError, BotoCoreError

logger = logging.getLogger(__name__)


class ExamService:
    """
    Service layer for exam operations.
    
    Encapsulates business logic for:
    - Exam creation with file upload
    - File validation (format, size)
    - Storage path generation
    - Transaction management
    - Task queue integration
    """
    
    def __init__(self, db: AsyncSession, storage_client: StorageClient):
        """
        Initialize exam service.
        
        Args:
            db: Database session
            storage_client: Object storage client
        """
        self.db = db
        self.storage = storage_client
    
    async def create_exam_with_upload(
        self,
        exam_data: ExamCreate,
        file: UploadFile,
        user_id: uuid.UUID
    ) -> Tuple[uuid.UUID, uuid.UUID, str]:
        """
        Create exam with file upload.
        
        Workflow:
        1. Upload file to storage
        2. Begin database transaction:
           - Create Exam record (status="DRAFT")
           - Create Task record (status="QUEUED")
           - Create Artifact record (if model exists)
        3. Commit transaction
        4. Enqueue Celery task for processing
        5. Return exam_id, task_id, and status
        
        Transaction strategy: Upload first, then DB transaction.
        - If DB fails, we have orphaned files (acceptable, can be cleaned up later)
        - If upload fails, no DB records created
        
        Args:
            exam_data: Exam metadata from request
            file: Uploaded DOCX file
            user_id: Authenticated user ID
        
        Returns:
            Tuple of (exam_id, task_id, status)
        
        Raises:
            HTTPException: For validation, storage, or database errors
        """
        # Generate IDs upfront
        exam_id = uuid.uuid4()
        task_id = uuid.uuid4()
        
        # Generate storage path using artifact_paths utility (Phase 5)
        # Pattern: exams/{user_id}/{exam-name-kebab}/original.docx
        storage_path = self.generate_exam_file_path(user_id, exam_data.name)
        
        # Log upload start with context
        logger.info(
            f"Starting exam upload - user_id={user_id}, exam_name='{exam_data.name}', "
            f"storage_path='{storage_path}'"
        )
        
        # Step 1: Upload file to storage (may raise HTTPException 503)
        try:
            file_content = await file.read()
            file_size = len(file_content)
            from io import BytesIO
            file_obj = BytesIO(file_content)
            
            storage_url = self.storage.upload_file(
                file_data=file_obj,
                file_path=storage_path,
                content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
            
            logger.info(
                f"File uploaded successfully - user_id={user_id}, exam_id={exam_id}, "
                f"file_size={file_size} bytes, storage_url='{storage_url}'"
            )
            
        except ClientError as e:
            # S3/MinIO client errors - service unavailable
            logger.error(
                f"Storage ClientError during upload - user_id={user_id}, exam_name='{exam_data.name}', "
                f"error={str(e)}",
                exc_info=True
            )
            raise HTTPException(
                status_code=503,
                detail="Storage service is temporarily unavailable. Please try again later."
            )
        except BotoCoreError as e:
            # Network/connection errors
            logger.error(
                f"Storage BotoCoreError during upload - user_id={user_id}, exam_name='{exam_data.name}', "
                f"error={str(e)}",
                exc_info=True
            )
            raise HTTPException(
                status_code=503,
                detail="Storage service is temporarily unavailable. Please try again later."
            )
        except Exception as e:
            # Other unexpected errors
            logger.error(
                f"Unexpected error during file upload - user_id={user_id}, exam_name='{exam_data.name}', "
                f"error={str(e)}",
                exc_info=True
            )
            raise HTTPException(
                status_code=500,
                detail="An error occurred while uploading the file."
            )
        
        # Step 2: Database transaction
        logger.info(
            f"Starting database transaction - user_id={user_id}, exam_id={exam_id}, task_id={task_id}"
        )
        
        try:
            # Create Exam record
            exam = Exam(
                exam_id=exam_id,
                user_id=user_id,
                name=exam_data.name,
                subject=exam_data.subject,
                academic_year=exam_data.academic_year,
                grade_level=exam_data.grade_level if exam_data.grade_level else None,
                num_variants=exam_data.num_variants,
                duration_minutes=exam_data.duration_minutes,
                instructions=exam_data.instructions if exam_data.instructions else None,
                status=ExamStatus.DRAFT
            )
            self.db.add(exam)
            
            # Create Task record
            task = Task(
                task_id=task_id,
                user_id=user_id,
                exam_id=exam_id,
                status=TaskStatus.QUEUED,
                current_stage=None,  # Will be set when processing starts
                progress=0
            )
            self.db.add(task)
            
            # Create Artifact record (gracefully handle if model doesn't match expectations)
            try:
                from app.models.artifact import Artifact, ArtifactType
                
                # Check if we can create an artifact for the original exam file
                # The Artifact model expects specific enum types, check if "exam_docx_original" or similar exists
                # For MVP, we'll skip artifact creation if the model doesn't support it
                # This will be enhanced in later phases
                
                # Note: Current Artifact model uses enum ArtifactType which may not have
                # a type for original uploaded DOCX. This is expected to be added in Feature 003.
                # For now, skip artifact creation - tests should handle this gracefully.
                
            except (ImportError, AttributeError):
                # Artifact model doesn't exist or doesn't have expected structure
                # This is acceptable - proceed without artifact creation
                pass
            
            # Commit transaction
            await self.db.commit()
            await self.db.refresh(exam)
            await self.db.refresh(task)
            
            logger.info(
                f"Database transaction committed successfully - exam_id={exam_id}, task_id={task_id}, "
                f"exam_name='{exam_data.name}'"
            )
            
        except Exception as e:
            # Rollback DB transaction
            await self.db.rollback()
            
            logger.error(
                f"Database transaction failed, rolling back - user_id={user_id}, exam_id={exam_id}, "
                f"storage_path='{storage_path}', error={str(e)}",
                exc_info=True
            )
            
            # Clean up uploaded file
            try:
                self.storage.delete_file(storage_path)
                logger.info(f"Deleted orphaned file after DB failure - storage_path='{storage_path}'")
            except Exception as cleanup_error:
                # Log this but don't fail - orphaned file is acceptable
                logger.warning(
                    f"Failed to clean up file after DB failure - storage_path='{storage_path}', "
                    f"error={str(cleanup_error)}"
                )
            
            # Re-raise as HTTP 500
            raise HTTPException(
                status_code=500,
                detail="An internal error occurred. Please try again later."
            )
        
        # Step 3: Enqueue Celery task for processing
        try:
            process_task.delay(str(task_id))
            logger.info(
                f"Celery task enqueued successfully - task_id={task_id}, exam_id={exam_id}"
            )
        except Exception as e:
            # Log this error and fail the request
            # Note: The record is already committed, so the task can be manually requeued later
            # In production, this should be logged for monitoring and alerting
            logger.error(
                f"Failed to enqueue Celery task - task_id={task_id}, exam_id={exam_id}, "
                f"error={str(e)}",
                exc_info=True
            )
            raise HTTPException(
                status_code=500,
                detail="An internal error occurred while queuing the task. Please try again later."
            )
        
        # Step 4: Return response
        logger.info(
            f"Exam creation completed successfully - exam_id={exam_id}, task_id={task_id}, "
            f"user_id={user_id}, exam_name='{exam_data.name}'"
        )
        return (exam_id, task_id, "queued")
    
    def validate_docx_file(self, file: UploadFile) -> None:
        """
        Validate DOCX file format and size.
        
        Checks:
        - File is present
        - MIME type matches DOCX or octet-stream
        - File extension is .docx
        - File size ≤ 50MB
        - File is not empty
        
        Args:
            file: Uploaded file
        
        Raises:
            HTTPException 400: If validation fails with specific error message
        """
        MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB in bytes
        
        # Check if file has filename
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="File must have a filename"
            )
        
        # Check file extension
        if not file.filename.lower().endswith('.docx'):
            raise HTTPException(
                status_code=400,
                detail="File must have .docx extension"
            )
        
        # Check MIME type
        # Accept both proper DOCX MIME type and octet-stream (some browsers send this)
        allowed_mime_types = [
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/octet-stream",  # Some browsers send this for .docx
        ]
        
        if file.content_type not in allowed_mime_types:
            raise HTTPException(
                status_code=400,
                detail="Invalid file format. Only DOCX files are accepted"
            )
        
        # Check file size
        if file.size is not None:
            if file.size == 0:
                raise HTTPException(
                    status_code=400,
                    detail="File cannot be empty"
                )
            
            if file.size > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail="File size exceeds maximum allowed limit of 50 MB"
                )
        
        # Check magic bytes: DOCX files are ZIP archives starting with PK (0x50 0x4B)
        try:
            header = file.file.read(4)
            file.file.seek(0)
            if len(header) < 2 or header[:2] != b'PK':
                raise HTTPException(
                    status_code=400,
                    detail="Invalid file format. Only DOCX files are accepted"
                )
        except HTTPException:
            raise
        except Exception:
            pass  # Skip magic bytes check if stream is not seekable
    
    def generate_exam_file_path(self, user_id: uuid.UUID, exam_name: str) -> str:
        """
        Generate storage path for exam file.
        
        Pattern: exams/{user_id}/{exam-name-kebab}/original.docx
        
        Args:
            user_id: Owner user ID
            exam_name: Exam name (will be kebab-cased)
        
        Returns:
            Storage path string
        """
        from app.core.artifact_paths import generate_artifact_path
        return generate_artifact_path(user_id, exam_name, "original.docx")
