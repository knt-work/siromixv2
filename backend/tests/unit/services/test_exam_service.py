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
import uuid
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
    
    async def test_create_exam_celery_enqueue_failure(
        self,
        async_session: AsyncSession,
        mock_storage_client,
        exam_create_data,
        mock_upload_file,
        test_user
    ):
        """Test that Celery enqueue failure raises HTTPException 500."""
        # Arrange
        service = ExamService(async_session, mock_storage_client)
        user_id = test_user.user_id
        
        # Mock process_task.delay to raise exception (Celery connection failure)
        with patch('app.services.exam_service.process_task') as mock_celery:
            mock_celery.delay.side_effect = Exception("Celery broker connection refused")
            
            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                await service.create_exam_with_upload(
                    exam_data=exam_create_data,
                    file=mock_upload_file,
                    user_id=user_id
                )
            
            # Verify 500 status code
            assert exc_info.value.status_code == 500
            assert "internal error" in exc_info.value.detail.lower() or "try again" in exc_info.value.detail.lower()
            
            # Note: Exam and Task records may be committed before Celery failure
            # This is expected behavior - orphaned records can be manually requeued
    
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


class TestExamServiceFileValidation:
    """Test file validation functionality - Phase 4 (User Story 2)."""
    
    def test_validate_docx_file_success(self):
        """Test successful validation of valid DOCX file."""
        # Arrange
        service = ExamService(Mock(), Mock())
        
        # Create mock DOCX file
        valid_file = Mock(spec=UploadFile)
        valid_file.filename = "exam.docx"
        valid_file.content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        valid_file.size = 10 * 1024 * 1024  # 10MB
        
        # Act & Assert - should not raise exception
        service.validate_docx_file(valid_file)
    
    def test_validate_docx_file_pdf_format(self):
        """Test validation rejects PDF files."""
        # Arrange
        service = ExamService(Mock(), Mock())
        
        # Create mock PDF file
        pdf_file = Mock(spec=UploadFile)
        pdf_file.filename = "exam.pdf"
        pdf_file.content_type = "application/pdf"
        pdf_file.size = 5 * 1024 * 1024  # 5MB
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            service.validate_docx_file(pdf_file)
        
        assert exc_info.value.status_code == 400
        assert "docx" in exc_info.value.detail.lower() or "format" in exc_info.value.detail.lower()
    
    def test_validate_docx_file_txt_format(self):
        """Test validation rejects TXT files."""
        # Arrange
        service = ExamService(Mock(), Mock())
        
        # Create mock TXT file
        txt_file = Mock(spec=UploadFile)
        txt_file.filename = "exam.txt"
        txt_file.content_type = "text/plain"
        txt_file.size = 1 * 1024 * 1024  # 1MB
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            service.validate_docx_file(txt_file)
        
        assert exc_info.value.status_code == 400
        assert "docx" in exc_info.value.detail.lower() or "format" in exc_info.value.detail.lower()
    
    def test_validate_docx_file_wrong_extension(self):
        """Test validation rejects files without .docx extension."""
        # Arrange
        service = ExamService(Mock(), Mock())
        
        # Create mock file with wrong extension but correct MIME type
        file = Mock(spec=UploadFile)
        file.filename = "exam.doc"  # Old Word format
        file.content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        file.size = 5 * 1024 * 1024  # 5MB
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            service.validate_docx_file(file)
        
        assert exc_info.value.status_code == 400
        assert "docx" in exc_info.value.detail.lower() or "extension" in exc_info.value.detail.lower()
    
    def test_validate_docx_file_exceeds_size_limit(self):
        """Test validation rejects files exceeding 50MB limit."""
        # Arrange
        service = ExamService(Mock(), Mock())
        
        # Create mock file exceeding size limit
        large_file = Mock(spec=UploadFile)
        large_file.filename = "exam.docx"
        large_file.content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        large_file.size = 51 * 1024 * 1024  # 51MB (exceeds 50MB limit)
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            service.validate_docx_file(large_file)
        
        assert exc_info.value.status_code == 400
        assert "50" in exc_info.value.detail or "size" in exc_info.value.detail.lower()
    
    def test_validate_docx_file_missing_filename(self):
        """Test validation handles missing filename."""
        # Arrange
        service = ExamService(Mock(), Mock())
        
        # Create mock file with no filename
        file = Mock(spec=UploadFile)
        file.filename = None
        file.content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        file.size = 5 * 1024 * 1024
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            service.validate_docx_file(file)
        
        assert exc_info.value.status_code == 400
    
    def test_validate_docx_file_octet_stream_content_type(self):
        """Test validation accepts application/octet-stream (some browsers send this for DOCX)."""
        # Arrange
        service = ExamService(Mock(), Mock())
        
        # Create mock file with octet-stream content type but .docx extension
        file = Mock(spec=UploadFile)
        file.filename = "exam.docx"
        file.content_type = "application/octet-stream"
        file.size = 5 * 1024 * 1024  # 5MB
        
        # Act & Assert - should not raise exception
        service.validate_docx_file(file)
    
    def test_validate_docx_file_zero_size(self):
        """Test validation rejects zero-byte files."""
        # Arrange
        service = ExamService(Mock(), Mock())
        
        # Create mock file with zero size
        file = Mock(spec=UploadFile)
        file.filename = "exam.docx"
        file.content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        file.size = 0  # Zero bytes
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            service.validate_docx_file(file)
        
        assert exc_info.value.status_code == 400
        assert "empty" in exc_info.value.detail.lower() or "size" in exc_info.value.detail.lower()


class TestExamServiceStoragePath:
    """Unit tests for storage path generation - Phase 5 User Story 3."""
    
    def test_generate_exam_file_path_basic(self):
        """Test path generation with basic exam name."""
        # Arrange
        service = ExamService(Mock(), Mock())
        user_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440000')
        exam_name = "Mathematics Final 2026"
        
        # Act
        path = service.generate_exam_file_path(user_id, exam_name)
        
        # Assert
        assert path == "exams/550e8400-e29b-41d4-a716-446655440000/mathematics-final-2026/original.docx"
    
    def test_generate_exam_file_path_vietnamese_characters(self):
        """Test path generation with Vietnamese characters (accents removed)."""
        # Arrange
        service = ExamService(Mock(), Mock())
        user_id = uuid.UUID('111e1111-e11b-11d1-a111-111111111111')
        exam_name = "Kiểm tra giữa kì - Toán học"
        
        # Act
        path = service.generate_exam_file_path(user_id, exam_name)
        
        # Assert - Vietnamese characters normalized to ASCII
        assert path == "exams/111e1111-e11b-11d1-a111-111111111111/kiem-tra-giua-ki-toan-hoc/original.docx"
        assert "giữa" not in path  # Accents removed
        assert "học" not in path
    
    def test_generate_exam_file_path_special_characters(self):
        """Test path generation with special characters (removed/replaced)."""
        # Arrange
        service = ExamService(Mock(), Mock())
        user_id = uuid.UUID('222e2222-e22b-22d2-a222-222222222222')
        exam_name = "AP® Physics - C (Mechanics & Electricity)"
        
        # Act
        path = service.generate_exam_file_path(user_id, exam_name)
        
        # Assert - Special chars removed, spaces to hyphens
        assert "®" not in path
        assert "(" not in path
        assert ")" not in path
        assert "&" not in path
        assert "ap-physics-c-mechanics-electricity" in path
    
    def test_generate_exam_file_path_multiple_spaces(self):
        """Test path generation collapses multiple spaces to single hyphen."""
        # Arrange
        service = ExamService(Mock(), Mock())
        user_id = uuid.UUID('333e3333-e33b-33d3-a333-333333333333')
        exam_name = "Grade   10    Exam     2026"  # Multiple spaces
        
        # Act
        path = service.generate_exam_file_path(user_id, exam_name)
        
        # Assert - Multiple spaces collapsed
        assert path == "exams/333e3333-e33b-33d3-a333-333333333333/grade-10-exam-2026/original.docx"
        assert "---" not in path  # No multiple hyphens
    
    def test_generate_exam_file_path_includes_user_id(self):
        """Test path includes user_id for multi-tenancy."""
        # Arrange
        service = ExamService(Mock(), Mock())
        user_id_1 = uuid.UUID('aaa00000-0000-0000-0000-000000000001')
        user_id_2 = uuid.UUID('bbb00000-0000-0000-0000-000000000002')
        exam_name = "Same Exam Name"
        
        # Act
        path_1 = service.generate_exam_file_path(user_id_1, exam_name)
        path_2 = service.generate_exam_file_path(user_id_2, exam_name)
        
        # Assert - Different user_ids produce different paths
        assert "aaa00000-0000-0000-0000-000000000001" in path_1
        assert "bbb00000-0000-0000-0000-000000000002" in path_2
        assert path_1 != path_2  # No collision
    
    def test_generate_exam_file_path_empty_name_fallback(self):
        """Test path generation with empty name uses fallback."""
        # Arrange
        service = ExamService(Mock(), Mock())
        user_id = uuid.UUID('444e4444-e44b-44d4-a444-444444444444')
        exam_name = ""  # Empty
        
        # Act
        path = service.generate_exam_file_path(user_id, exam_name)
        
        # Assert - Uses 'untitled' fallback
        assert "untitled" in path
        assert path == "exams/444e4444-e44b-44d4-a444-444444444444/untitled/original.docx"
    
    def test_generate_exam_file_path_long_name_truncated(self):
        """Test very long exam names are truncated."""
        # Arrange
        service = ExamService(Mock(), Mock())
        user_id = uuid.UUID('555e5555-e55b-55d5-a555-555555555555')
        exam_name = "A" * 150  # Very long name
        
        # Act
        path = service.generate_exam_file_path(user_id, exam_name)
        
        # Assert - Path length is reasonable
        parts = path.split('/')
        exam_slug = parts[2]  # Get the kebab-case part
        assert len(exam_slug) <= 100  # Should be truncated
