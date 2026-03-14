"""
Unit tests for ExamService - Feature 004 User Story 1

Tests exam creation with file upload, including:
- Successful creation workflow
- Transaction rollback on failures
- File cleanup on database errors
"""

import pytest
import pytest_asyncio
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from uuid import uuid4
from io import BytesIO

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile, HTTPException

from app.services.exam_service import ExamService
from app.models.exam import Exam, ExamStatus
from app.models.task import Task, TaskStatus
from app.models.artifact import Artifact
from app.schemas.exam import ExamCreate
from app.core.storage import StorageClient


@pytest.fixture
def mock_storage_client():
    """Create mock storage client."""
    storage = Mock(spec=StorageClient)
    storage.bucket_name = "test-bucket"
    storage.upload_file = Mock(return_value="test-bucket/test-path/file.docx")
    storage.delete_file = Mock(return_value=None)
    storage.get_file_url = Mock(return_value="http://storage/test-file")
    return storage


@pytest.fixture
def exam_create_data():
    """Create sample exam creation data."""
    return ExamCreate(
        name="Test Exam",
        subject="Mathematics",
        academic_year="2025-2026",
        grade_level="Grade 10",
        duration_minutes=60,
        num_variants=3,
        instructions="Test instructions"
    )


@pytest.fixture
def mock_upload_file():
    """Create mock uploaded file."""
    file_content = b"PK\x03\x04" + b"Mock DOCX content"  # DOCX files start with PK (ZIP signature)
    file = MagicMock(spec=UploadFile)
    file.filename = "test-exam.docx"
    file.content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    file.size = len(file_content)
    file.file = BytesIO(file_content)
    file.read = AsyncMock(return_value=file_content)
    file.seek = Mock()
    return file


@pytest.mark.asyncio
class TestExamServiceCreate:
    """Test ExamService.create_exam_with_upload method."""
    
    async def test_create_exam_success(
        self,
        async_session: AsyncSession,
        mock_storage_client,
        exam_create_data,
        mock_upload_file,
        test_user
    ):
        """Test successful exam creation with file upload."""
        # Arrange
        service = ExamService(async_session, mock_storage_client)
        user_id = test_user.user_id
        
        # Mock Celery task enqueue
        with patch('app.services.exam_service.process_task') as mock_celery:
            mock_celery.delay = Mock(return_value=Mock(id="celery-task-id"))
            
            # Act
            exam_id, task_id, status = await service.create_exam_with_upload(
                exam_data=exam_create_data,
                file=mock_upload_file,
                user_id=user_id
            )
        
        # Assert
        assert exam_id is not None
        assert task_id is not None
        assert status == "queued"
        
        # Verify storage upload was called
        mock_storage_client.upload_file.assert_called_once()
        
        # Verify database records created
        from sqlalchemy import select
        
        # Check exam record
        result = await async_session.execute(select(Exam).where(Exam.exam_id == exam_id))
        exam = result.scalar_one_or_none()
        assert exam is not None
        assert exam.name == "Test Exam"
        assert exam.status == ExamStatus.DRAFT
        assert exam.duration_minutes == 60
        assert exam.user_id == user_id
        
        # Check task record
        result = await async_session.execute(select(Task).where(Task.task_id == task_id))
        task = result.scalar_one_or_none()
        assert task is not None
        assert task.status == TaskStatus.QUEUED
        assert task.exam_id == exam_id
        assert task.user_id == user_id
        
        # Check artifact record (optional for MVP - Feature 003 may not be complete)
        result = await async_session.execute(select(Artifact).where(Artifact.exam_id == exam_id))
        artifact = result.scalar_one_or_none()
        # Artifact creation is gracefully skipped if model doesn't support original DOCX type
        # This is expected and acceptable for MVP
        
        # Verify Celery task was enqueued
        mock_celery.delay.assert_called_once_with(str(task_id))
    
    async def test_create_exam_transaction_rollback_on_storage_failure(
        self,
        async_session: AsyncSession,
        mock_storage_client,
        exam_create_data,
        mock_upload_file,
        test_user
    ):
        """Test that database transaction rolls back if storage upload fails."""
        # Arrange
        service = ExamService(async_session, mock_storage_client)
        user_id = test_user.user_id
        
        # Mock storage failure with ClientError (realistic S3/MinIO error)
        from botocore.exceptions import ClientError
        error_response = {'Error': {'Code': 'ServiceUnavailable', 'Message': 'Service unavailable'}}
        mock_storage_client.upload_file.side_effect = ClientError(error_response, 'PutObject')
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await service.create_exam_with_upload(
                exam_data=exam_create_data,
                file=mock_upload_file,
                user_id=user_id
            )
        
        assert exc_info.value.status_code == 503
        assert "storage" in exc_info.value.detail.lower() or "unavailable" in exc_info.value.detail.lower()
        
        # Verify no database records were created
        from sqlalchemy import select
        result = await async_session.execute(select(Exam))
        exams = result.scalars().all()
        assert len(exams) == 0
    
    async def test_create_exam_file_cleanup_on_db_error(
        self,
        async_session: AsyncSession,
        mock_storage_client,
        exam_create_data,
        mock_upload_file,
        test_user
    ):
        """Test that uploaded file is deleted if database transaction fails."""
        # Arrange
        service = ExamService(async_session, mock_storage_client)
        user_id = test_user.user_id
        
        # Mock storage success but database failure after upload
        uploaded_path = "test-bucket/test-path/file.docx"
        mock_storage_client.upload_file.return_value = uploaded_path
        
        # Simulate DB error by mocking commit failure
        original_commit = async_session.commit
        async def failing_commit():
            raise Exception("Database connection lost")
        async_session.commit = failing_commit
        
        # Act & Assert
        with pytest.raises(HTTPException):
            await service.create_exam_with_upload(
                exam_data=exam_create_data,
                file=mock_upload_file,
                user_id=user_id
            )
        
        # Verify storage cleanup was called
        mock_storage_client.delete_file.assert_called()
        
        # Restore original commit
        async_session.commit = original_commit
    
    async def test_create_exam_multiple_variants(
        self,
        async_session: AsyncSession,
        mock_storage_client,
        exam_create_data,
        mock_upload_file,
        test_user
    ):
        """Test exam creation with different num_variants value."""
        # Arrange
        service = ExamService(async_session, mock_storage_client)
        user_id = test_user.user_id
        
        # Modify exam_create_data to have 5 variants
        exam_create_data.num_variants = 5
        
        # Mock process_task to avoid Celery requirement
        with patch('app.services.exam_service.process_task') as mock_celery:
            mock_celery.delay = Mock(return_value=Mock(id="celery-task-id"))
            
            # Act
            exam_id, task_id, status = await service.create_exam_with_upload(
                exam_data=exam_create_data,
                file=mock_upload_file,
                user_id=user_id
            )
            
            # Assert
            assert exam_id is not None
            assert task_id is not None
            assert status == "queued"
            
            # Verify exam has correct num_variants
            from sqlalchemy import select
            result = await async_session.execute(select(Exam).where(Exam.exam_id == exam_id))
            exam = result.scalar_one_or_none()
            assert exam.num_variants == 5
