"""
Integration tests for Exam Creation Flow - Feature 004 User Story 1

Tests complete workflow: POST /api/v1/exams → Storage → Database → Celery
Validates end-to-end behavior with real database and mocked external services.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from unittest.mock import Mock, patch, AsyncMock
from io import BytesIO
import uuid

from app.main import app
from app.models.user import User
from app.models.exam import Exam
from app.models.task import Task
from app.models.artifact import Artifact


@pytest.fixture
def valid_exam_form_data():
    """Valid exam creation request data."""
    return {
        "name": "Kiểm tra giữa kì - Toán học",
        "subject": "Toán",
        "academic_year": "2025-2026",
        "grade_level": "6",
        "duration_minutes": "90",
        "num_variants": "2",
        "instructions": "Học sinh được phép sử dụng máy tính"
    }


@pytest.fixture
def docx_file_upload():
    """Mock DOCX file for upload."""
    # DOCX files are ZIP archives starting with PK header
    content = b'PK\x03\x04' + b'\x00' * 200  # Minimal DOCX structure
    file = BytesIO(content)
    return ("test-exam.docx", file, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")


@pytest.fixture
async def authenticated_client(test_user: User):
    """Create authenticated HTTP client."""
    from app.core.deps import get_current_user
    
    async def override_get_current_user():
        return test_user
    
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    client = AsyncClient(app=app, base_url="http://testserver")
    yield client
    
    # Cleanup
    app.dependency_overrides.clear()


class TestExamCreationIntegration:
    """Integration tests for full exam creation workflow."""
    
    @pytest.mark.asyncio
    async def test_create_exam_full_workflow(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        test_user: User,
        valid_exam_form_data: dict,
        docx_file_upload: tuple
    ):
        """
        Test complete exam creation workflow:
        1. API receives request
        2. File uploaded to storage
        3. Exam record created in database
        4. Task record created
        5. Artifact record created
        6. Celery task enqueued
        7. Response returned with IDs
        """
        # Arrange
        with patch('app.core.storage.StorageClient.upload_file') as mock_upload, \
             patch('app.core.storage.StorageClient.delete_file') as mock_delete, \
             patch('app.tasks.process_task.delay') as mock_celery:
            
            # Mock successful storage upload
            storage_path = f"siromix-exams/exams/user-{test_user.user_id}/test-exam.docx"
            mock_upload.return_value = storage_path
            
            # Mock Celery task
            mock_celery.return_value = Mock(id="celery-task-123")
            
            # Prepare request
            data = valid_exam_form_data
            files = {"file": docx_file_upload}
            
            # Act
            response = await authenticated_client.post(
                "/api/v1/exams",
                data=data,
                files=files
            )
            
            # Assert - Response
            assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
            
            json_response = response.json()
            assert "exam_id" in json_response
            assert "task_id" in json_response
            assert json_response["status"] == "queued"
            
            exam_id = uuid.UUID(json_response["exam_id"])
            task_id = uuid.UUID(json_response["task_id"])
            
            # Assert - Database - Exam record created
            exam_stmt = select(Exam).where(Exam.exam_id == exam_id)
            result = await async_session.execute(exam_stmt)
            exam = result.scalar_one_or_none()
            
            assert exam is not None, "Exam record not found in database"
            assert exam.name == valid_exam_form_data["name"]
            assert exam.subject == valid_exam_form_data["subject"]
            assert exam.academic_year == valid_exam_form_data["academic_year"]
            assert exam.grade_level == valid_exam_form_data["grade_level"]
            assert exam.duration_minutes == int(valid_exam_form_data["duration_minutes"])
            assert exam.num_variants == int(valid_exam_form_data["num_variants"])
            assert exam.instructions == valid_exam_form_data["instructions"]
            assert exam.user_id == test_user.user_id
            assert exam.status == "DRAFT"
            
            # Assert - Database - Task record created
            task_stmt = select(Task).where(Task.task_id == task_id)
            result = await async_session.execute(task_stmt)
            task = result.scalar_one_or_none()
            
            assert task is not None, "Task record not found in database"
            assert task.exam_id == exam_id
            assert task.user_id == test_user.user_id
            assert task.status == "QUEUED"
            assert task.current_stage == "initialization"
            assert task.progress == 0
            
            # Assert - Database - Artifact record created
            artifact_stmt = select(Artifact).where(Artifact.exam_id == exam_id)
            result = await async_session.execute(artifact_stmt)
            artifact = result.scalar_one_or_none()
            
            assert artifact is not None, "Artifact record not found in database"
            assert artifact.exam_id == exam_id
            assert artifact.user_id == test_user.user_id
            assert artifact.type == "exam_docx_original"
            assert artifact.storage_url == storage_path
            assert artifact.file_extension == ".docx"
            
            # Assert - Storage upload called
            mock_upload.assert_called_once()
            
            # Assert - Celery task enqueued
            mock_celery.assert_called_once_with(str(task_id))
    
    @pytest.mark.asyncio
    async def test_create_exam_storage_failure_rollback(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        test_user: User,
        valid_exam_form_data: dict,
        docx_file_upload: tuple
    ):
        """
        Test rollback behavior when storage upload fails.
        Ensures no database records created if file upload fails.
        """
        # Arrange
        with patch('app.core.storage.StorageClient.upload_file') as mock_upload:
            from botocore.exceptions import ClientError
            
            # Mock storage failure
            error_response = {'Error': {'Code': 'ServiceUnavailable', 'Message': 'Service unavailable'}}
            mock_upload.side_effect = ClientError(error_response, 'PutObject')
            
            data = valid_exam_form_data
            files = {"file": docx_file_upload}
            
            # Act
            response = await authenticated_client.post(
                "/api/v1/exams",
                data=data,
                files=files
            )
            
            # Assert - Error response
            assert response.status_code == 503
            
            # Assert - No exam records in database
            exam_stmt = select(Exam).where(Exam.user_id == test_user.user_id)
            result = await async_session.execute(exam_stmt)
            exams = result.scalars().all()
            
            # Should have zero exams (or only pre-existing ones, not the new one)
            assert len(exams) == 0 or all(e.name != valid_exam_form_data["name"] for e in exams)
    
    @pytest.mark.asyncio
    async def test_create_exam_db_failure_cleanup(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        test_user: User,
        valid_exam_form_data: dict,
        docx_file_upload: tuple
    ):
        """
        Test file cleanup when database transaction fails.
        Ensures uploaded file is deleted if DB commit fails.
        """
        # Arrange
        with patch('app.core.storage.StorageClient.upload_file') as mock_upload, \
             patch('app.core.storage.StorageClient.delete_file') as mock_delete, \
             patch('sqlalchemy.ext.asyncio.AsyncSession.commit') as mock_commit:
            
            # Mock successful upload
            storage_path = "siromix-exams/exams/test-upload.docx"
            mock_upload.return_value = storage_path
            
            # Mock database commit failure
            mock_commit.side_effect = Exception("Database commit failed")
            
            data = valid_exam_form_data
            files = {"file": docx_file_upload}
            
            # Act
            response = await authenticated_client.post(
                "/api/v1/exams",
                data=data,
                files=files
            )
            
            # Assert - Error response
            assert response.status_code == 500
            
            # Assert - File cleanup called
            mock_delete.assert_called_once_with(storage_path)
    
    @pytest.mark.asyncio
    async def test_create_exam_with_optional_fields_omitted(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        test_user: User,
        docx_file_upload: tuple
    ):
        """
        Test exam creation with optional fields (grade_level, instructions) omitted.
        """
        # Arrange
        with patch('app.core.storage.StorageClient.upload_file') as mock_upload, \
             patch('app.tasks.process_task.delay') as mock_celery:
            
            mock_upload.return_value = "siromix-exams/exams/test.docx"
            mock_celery.return_value = Mock(id="celery-task-123")
            
            # Data without optional fields
            data = {
                "name": "Kiểm tra cuối kì",
                "subject": "Toán",
                "academic_year": "2024-2025",
                "duration_minutes": "120",
                "num_variants": "1"
                # grade_level and instructions omitted
            }
            files = {"file": docx_file_upload}
            
            # Act
            response = await authenticated_client.post(
                "/api/v1/exams",
                data=data,
                files=files
            )
            
            # Assert
            assert response.status_code == 201
            
            json_response = response.json()
            exam_id = uuid.UUID(json_response["exam_id"])
            
            # Verify in database
            exam_stmt = select(Exam).where(Exam.exam_id == exam_id)
            result = await async_session.execute(exam_stmt)
            exam = result.scalar_one_or_none()
            
            assert exam is not None
            assert exam.grade_level is None or exam.grade_level == ""
            assert exam.instructions is None or exam.instructions == ""
    
    @pytest.mark.asyncio
    async def test_create_exam_concurrent_requests(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        test_user: User,
        valid_exam_form_data: dict,
        docx_file_upload: tuple
    ):
        """
        Test handling of concurrent exam creation requests.
        Ensures each request creates separate records with unique IDs.
        """
        # Arrange
        with patch('app.core.storage.StorageClient.upload_file') as mock_upload, \
             patch('app.tasks.process_task.delay') as mock_celery:
            
            mock_upload.return_value = "siromix-exams/exams/test.docx"
            mock_celery.return_value = Mock(id="celery-task-123")
            
            # Create two different exam requests
            data1 = {**valid_exam_form_data, "name": "Exam 1"}
            data2 = {**valid_exam_form_data, "name": "Exam 2"}
            
            files1 = {"file": docx_file_upload}
            files2 = {"file": ("exam2.docx", BytesIO(b'PK\x03\x04' + b'\x00' * 200), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
            
            # Act - Send two requests
            response1 = await authenticated_client.post("/api/v1/exams", data=data1, files=files1)
            response2 = await authenticated_client.post("/api/v1/exams", data=data2, files=files2)
            
            # Assert - Both succeeded
            assert response1.status_code == 201
            assert response2.status_code == 201
            
            json1 = response1.json()
            json2 = response2.json()
            
            # Verify different IDs
            assert json1["exam_id"] != json2["exam_id"]
            assert json1["task_id"] != json2["task_id"]
            
            # Verify both in database
            exam_stmt = select(Exam).where(Exam.user_id == test_user.user_id)
            result = await async_session.execute(exam_stmt)
            exams = result.scalars().all()
            
            exam_names = [e.name for e in exams]
            assert "Exam 1" in exam_names
            assert "Exam 2" in exam_names
    
    @pytest.mark.asyncio
    async def test_create_exam_validates_user_ownership(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        test_user: User,
        valid_exam_form_data: dict,
        docx_file_upload: tuple
    ):
        """
        Test that created exam is associated with the authenticated user.
        Verifies user_id is set correctly in exam, task, and artifact records.
        """
        # Arrange
        with patch('app.core.storage.StorageClient.upload_file') as mock_upload, \
             patch('app.tasks.process_task.delay') as mock_celery:
            
            mock_upload.return_value = "siromix-exams/exams/test.docx"
            mock_celery.return_value = Mock(id="celery-task-123")
            
            data = valid_exam_form_data
            files = {"file": docx_file_upload}
            
            # Act
            response = await authenticated_client.post(
                "/api/v1/exams",
                data=data,
                files=files
            )
            
            # Assert
            assert response.status_code == 201
            
            json_response = response.json()
            exam_id = uuid.UUID(json_response["exam_id"])
            task_id = uuid.UUID(json_response["task_id"])
            
            # Verify exam user_id
            exam_stmt = select(Exam).where(Exam.exam_id == exam_id)
            result = await async_session.execute(exam_stmt)
            exam = result.scalar_one_or_none()
            assert exam.user_id == test_user.user_id
            
            # Verify task user_id
            task_stmt = select(Task).where(Task.task_id == task_id)
            result = await async_session.execute(task_stmt)
            task = result.scalar_one_or_none()
            assert task.user_id == test_user.user_id
            
            # Verify artifact user_id
            artifact_stmt = select(Artifact).where(Artifact.exam_id == exam_id)
            result = await async_session.execute(artifact_stmt)
            artifact = result.scalar_one_or_none()
            assert artifact.user_id == test_user.user_id


class TestExamCreationErrorHandling:
    """Integration tests for error handling and edge cases."""
    
    @pytest.mark.asyncio
    async def test_create_exam_invalid_file_content(
        self,
        authenticated_client: AsyncClient,
        valid_exam_form_data: dict
    ):
        """
        Test uploading file with invalid DOCX content.
        Should fail validation before reaching storage.
        """
        # Arrange
        # Invalid DOCX content (not a ZIP file)
        invalid_file = ("exam.docx", BytesIO(b"This is not a DOCX file"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        
        data = valid_exam_form_data
        files = {"file": invalid_file}
        
        # Act
        response = await authenticated_client.post(
            "/api/v1/exams",
            data=data,
            files=files
        )
        
        # Assert - Should fail validation
        assert response.status_code in [400, 422]
    
    @pytest.mark.asyncio
    async def test_create_exam_unicode_characters(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        test_user: User,
        docx_file_upload: tuple
    ):
        """
        Test exam creation with Vietnamese Unicode characters.
        Validates proper handling of UTF-8 text.
        """
        # Arrange
        with patch('app.core.storage.StorageClient.upload_file') as mock_upload, \
             patch('app.tasks.process_task.delay') as mock_celery:
            
            mock_upload.return_value = "siromix-exams/exams/test.docx"
            mock_celery.return_value = Mock(id="celery-task-123")
            
            # Data with Vietnamese characters
            data = {
                "name": "Kiểm tra cuối kỳ - Môn Toán",
                "subject": "Toán học",
                "academic_year": "2025-2026",
                "grade_level": "Lớp 6",
                "duration_minutes": "90",
                "num_variants": "2",
                "instructions": "Học sinh được phép sử dụng máy tính bỏ túi"
            }
            files = {"file": docx_file_upload}
            
            # Act
            response = await authenticated_client.post(
                "/api/v1/exams",
                data=data,
                files=files
            )
            
            # Assert
            assert response.status_code == 201
            
            json_response = response.json()
            exam_id = uuid.UUID(json_response["exam_id"])
            
            # Verify Unicode data stored correctly
            exam_stmt = select(Exam).where(Exam.exam_id == exam_id)
            result = await async_session.execute(exam_stmt)
            exam = result.scalar_one_or_none()
            
            assert exam.name == data["name"]
            assert exam.subject == data["subject"]
            assert exam.grade_level == data["grade_level"]
            assert exam.instructions == data["instructions"]
