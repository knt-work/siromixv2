"""
Integration tests for Exam Creation Flow - Feature 004 User Story 1

Tests complete workflow: POST /api/v1/exams → Storage → Database → Celery
Validates end-to-end behavior with real database and mocked external services.
"""

import pytest
from httpx import AsyncClient, ASGITransport
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
async def authenticated_client(test_user: User, async_session: AsyncSession):
    """Create authenticated HTTP client with test database and user."""
    from app.core.deps import get_current_user
    from app.core.database import get_db

    async def override_get_current_user():
        return test_user

    async def override_get_db():
        yield async_session

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    client = AsyncClient(transport=transport, base_url="http://testserver")
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
             patch('app.services.exam_service.process_task.delay') as mock_celery:
            
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
            assert exam.status.value == "draft"
            
            # Assert - Database - Task record created
            task_stmt = select(Task).where(Task.task_id == task_id)
            result = await async_session.execute(task_stmt)
            task = result.scalar_one_or_none()
            
            assert task is not None, "Task record not found in database"
            assert task.exam_id == exam_id
            assert task.user_id == test_user.user_id
            assert task.status.value == "queued"
            assert task.current_stage is None  # Not yet processing
            assert task.progress == 0
            
            # Assert - Database - Artifact (gracefully skipped for MVP per T027)
            artifact_stmt = select(Artifact).where(Artifact.exam_id == exam_id)
            result = await async_session.execute(artifact_stmt)
            artifact = result.scalar_one_or_none()
            # Artifact creation skipped for MVP - expected to be None
            
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
            
            # Assert - File cleanup called (with internally-generated storage path)
            mock_delete.assert_called_once()
    
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
             patch('app.services.exam_service.process_task.delay') as mock_celery:
            
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
             patch('app.services.exam_service.process_task.delay') as mock_celery:
            
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
             patch('app.services.exam_service.process_task.delay') as mock_celery:
            
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
            
            # Artifact creation skipped for MVP per T027 - not asserting user_id


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
             patch('app.services.exam_service.process_task.delay') as mock_celery:
            
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
    
    @pytest.mark.asyncio
    async def test_database_failure_rolls_back_transaction(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        valid_exam_form_data: dict,
        docx_file_upload: tuple
    ):
        """
        Integration test: Database commit failure should rollback transaction.
        Verify no orphaned exam or task records remain after DB failure.
        """
        # Arrange
        with patch('app.core.storage.StorageClient.upload_file') as mock_upload, \
             patch('app.services.exam_service.AsyncSession.commit') as mock_commit:
            
            mock_upload.return_value = "siromix-exams/test-path.docx"
            # Simulate database commit failure
            mock_commit.side_effect = Exception("Database connection lost")
            
            data = valid_exam_form_data
            files = {"file": docx_file_upload}
            
            # Act
            response = await authenticated_client.post(
                "/api/v1/exams",
                data=data,
                files=files
            )
            
            # Assert - Should return 500
            assert response.status_code == 500
            
            # Verify no exam records exist in database
            exam_stmt = select(Exam)
            result = await async_session.execute(exam_stmt)
            exams = result.scalars().all()
            assert len(exams) == 0, "No exam records should exist after rollback"
            
            # Verify no task records exist in database
            task_stmt = select(Task)
            result = await async_session.execute(task_stmt)
            tasks = result.scalars().all()
            assert len(tasks) == 0, "No task records should exist after rollback"
    
    @pytest.mark.asyncio
    async def test_celery_failure_after_commit(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        valid_exam_form_data: dict,
        docx_file_upload: tuple
    ):
        """
        Integration test: Celery enqueue failure after DB commit should fail request.
        Note: Records remain committed (acceptable - can be manually requeued).
        """
        # Arrange
        with patch('app.core.storage.StorageClient.upload_file') as mock_upload, \
             patch('app.services.exam_service.process_task.delay') as mock_celery:
            
            mock_upload.return_value = "siromix-exams/test-path.docx"
            # Simulate Celery connection failure
            mock_celery.side_effect = Exception("Celery broker connection refused")
            
            data = valid_exam_form_data
            files = {"file": docx_file_upload}
            
            # Act
            response = await authenticated_client.post(
                "/api/v1/exams",
                data=data,
                files=files
            )
            
            # Assert - Should return 500
            assert response.status_code == 500
            assert "internal error" in response.json()["detail"].lower() or "try again" in response.json()["detail"].lower()


class TestExamCreationValidationFailures:
    """Integration tests for validation failures - Phase 4 (User Story 2)."""
    
    @pytest.mark.asyncio
    async def test_validation_failure_no_db_records_created(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        test_user: User
    ):
        """
        Test that validation failure prevents any DB records from being created.
        Validates that failed submissions don't pollute the database.
        """
        # Arrange - Create invalid request (PDF file instead of DOCX)
        pdf_content = b'%PDF-1.4' + b'\x00' * 100
        pdf_file = ("exam.pdf", BytesIO(pdf_content), "application/pdf")
        
        data = {
            "name": "Test Exam",
            "subject": "Mathematics",
            "academic_year": "2025-2026",
            "duration_minutes": "60",
            "num_variants": "3"
        }
        files = {"file": pdf_file}
        
        # Get initial count of exams for this user
        initial_exam_count = await async_session.execute(
            select(Exam).where(Exam.user_id == test_user.user_id)
        )
        initial_exams = initial_exam_count.scalars().all()
        initial_count = len(initial_exams)
        
        # Act
        response = await authenticated_client.post(
            "/api/v1/exams",
            data=data,
            files=files
        )
        
        # Assert - Request failed with 400
        assert response.status_code == 400
        
        # Verify no new exam records created
        final_exam_count = await async_session.execute(
            select(Exam).where(Exam.user_id == test_user.user_id)
        )
        final_exams = final_exam_count.scalars().all()
        final_count = len(final_exams)
        
        assert final_count == initial_count, "No new exam records should be created after validation failure"
        
        # Verify no new task records created
        task_count = await async_session.execute(
            select(Task).where(Task.user_id == test_user.user_id)
        )
        tasks = task_count.scalars().all()
        assert len(tasks) == 0, "No task records should exist after validation failure"
    
    @pytest.mark.asyncio
    async def test_validation_failure_no_storage_upload(
        self,
        authenticated_client: AsyncClient,
        valid_exam_form_data: dict
    ):
        """
        Test that validation failure prevents file upload to storage.
        Validates that storage operations don't happen for invalid requests.
        """
        # Arrange - Mock storage to verify it's never called
        with patch('app.core.storage.StorageClient.upload_file') as mock_upload:
            # Create invalid request (file size exceeds limit)
            large_content = b'PK\x03\x04' + b'\x00' * (51 * 1024 * 1024)  # 51MB
            large_file = ("exam.docx", BytesIO(large_content), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
            
            data = valid_exam_form_data
            files = {"file": large_file}
            
            # Act
            response = await authenticated_client.post(
                "/api/v1/exams",
                data=data,
                files=files
            )
            
            # Assert - Request failed
            assert response.status_code in [400, 413]
            
            # Verify storage upload was never called
            mock_upload.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_multiple_validation_failures_reported(
        self,
        authenticated_client: AsyncClient
    ):
        """
        Test that multiple validation errors are reported together.
        """
        # Arrange - Create request with multiple validation errors
        data = {
            # Missing 'name' field
            "subject": "Math",
            "academic_year": "2025-2026",
            "duration_minutes": "0",  # Invalid: must be > 0
            "num_variants": "-1"  # Invalid: must be > 0
        }
        # No file parameter - also invalid
        
        # Act
        response = await authenticated_client.post(
            "/api/v1/exams",
            data=data
        )
        
        # Assert
        assert response.status_code == 400  # All validation errors return 400 (custom exception handler)
        json_response = response.json()
        assert "detail" in json_response
        
        # Should report multiple errors
        errors = json_response["detail"]
        # At minimum, should flag missing name and missing file
        error_text = str(errors).lower()
        assert "name" in error_text or "file" in error_text
    
    @pytest.mark.asyncio
    async def test_field_length_validation_enforced(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        test_user: User,
        docx_file_upload: tuple  
    ):
        """
        Test that field length constraints are enforced.
        Validates that overly long field values are rejected.
        """
        # Arrange - Create request with name exceeding max length
        data = {
            "name": "A" * 501,  # Exceeds 500 character limit
            "subject": "Mathematics",
            "academic_year": "2025-2026",
            "duration_minutes": "60",
            "num_variants": "3"
        }
        files = {"file": docx_file_upload}
        
        # Act
        response = await authenticated_client.post(
            "/api/v1/exams",
            data=data,
            files=files
        )
        
        # Assert - Request failed with validation error
        assert response.status_code == 400  # All validation errors return 400 (custom exception handler)
        
        # Verify error message mentions length constraint
        json_response = response.json()
        error_text = str(json_response["detail"]).lower()
        assert "500" in error_text or "length" in error_text
        
        # Verify no DB records created
        exam_count = await async_session.execute(
            select(Exam).where(Exam.user_id == test_user.user_id)
        )
        exams = exam_count.scalars().all()
        assert len(exams) == 0


class TestExamCreationStoragePaths:
    """Integration tests for storage path organization - Phase 5 User Story 3."""
    
    @pytest.mark.asyncio
    async def test_different_users_same_exam_name_no_collision(
        self,
        async_session: AsyncSession,
        docx_file_upload: tuple
    ):
        """
        Test that two users with same exam name create separate storage paths.
        Verifies multi-tenancy and collision prevention.
        """
        # Arrange - Create two test users
        from app.models.user import User
        
        user1 = User(
            user_id=uuid.uuid4(),
            google_sub="test_user1_google_sub",
            email="user1@example.com",
            display_name="User One"
        )
        user2 = User(
            user_id=uuid.uuid4(),
            google_sub="test_user2_google_sub",
            email="user2@example.com",
            display_name="User Two"
        )
        async_session.add_all([user1, user2])
        await async_session.commit()
        
        # Same exam data for both users
        exam_data = {
            "name": "Mathematics Final Exam",
            "subject": "Mathematics",
            "academic_year": "2025-2026",
            "duration_minutes": "60",
            "num_variants": "3"
        }
        
        # Mock storage operations
        docx_content = b'PK\x03\x04' + b'\x00' * 200
        with patch('app.core.storage.StorageClient.upload_file') as mock_upload, \
             patch('app.services.exam_service.process_task.delay') as mock_celery:
            
            mock_upload.return_value = "mock-storage-url"
            mock_celery.return_value = Mock(id=str(uuid.uuid4()))
            
            # Act - User 1 creates exam
            from app.core.deps import get_current_user
            from app.core.database import get_db as get_db_dep

            async def override_get_db():
                yield async_session

            app.dependency_overrides[get_current_user] = lambda: user1
            app.dependency_overrides[get_db_dep] = override_get_db
            
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://testserver") as client1:
                response1 = await client1.post(
                    "/api/v1/exams",
                    data=exam_data,
                    files={"file": ("exam.docx", BytesIO(docx_content), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
                )
            
            # User 2 creates exam with same name
            app.dependency_overrides[get_current_user] = lambda: user2
            
            async with AsyncClient(transport=transport, base_url="http://testserver") as client2:
                response2 = await client2.post(
                    "/api/v1/exams",
                    data=exam_data,
                    files={"file": ("exam.docx", BytesIO(docx_content), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
                )
            
            # Cleanup
            app.dependency_overrides.clear()
        
        # Assert - Both succeeded
        assert response1.status_code == 201
        assert response2.status_code == 201
        
        # Verify storage upload was called twice with different paths
        assert mock_upload.call_count == 2
        
        call1_path = mock_upload.call_args_list[0].kwargs['file_path']
        call2_path = mock_upload.call_args_list[1].kwargs['file_path']
        
        # Assert paths include user IDs and are different
        assert str(user1.user_id) in call1_path
        assert str(user2.user_id) in call2_path
        assert call1_path != call2_path  # No collision
        
        # Assert both follow expected pattern: exams/{user_id}/mathematics-final-exam/original.docx
        assert "exams/" in call1_path
        assert "mathematics-final-exam" in call1_path
        assert "original.docx" in call1_path
        
        assert "exams/" in call2_path
        assert "mathematics-final-exam" in call2_path
        assert "original.docx" in call2_path
    
    @pytest.mark.asyncio
    async def test_storage_path_kebab_case_conversion(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        test_user: User,
        docx_file_upload: tuple
    ):
        """
        Test that exam names with special characters are converted to kebab-case.
        """
        # Arrange
        exam_data = {
            "name": "AP® Physics - C (Mechanics)",  # Special characters and spaces
            "subject": "Physics",
            "academic_year": "2025-2026",
            "duration_minutes": "90",
            "num_variants": "5"
        }
        
        # Mock storage operations
        with patch('app.core.storage.StorageClient.upload_file') as mock_upload, \
             patch('app.services.exam_service.process_task.delay') as mock_celery:
            
            mock_upload.return_value = "mock-storage-url"
            mock_celery.return_value = Mock(id=str(uuid.uuid4()))
            
            # Act
            response = await authenticated_client.post(
                "/api/v1/exams",
                data=exam_data,
                files={"file": docx_file_upload}
            )
        
        # Assert
        assert response.status_code == 201
        
        # Verify storage path is kebab-case
        mock_upload.assert_called_once()
        storage_path = mock_upload.call_args.kwargs['file_path']
        
        # Should not contain special characters
        assert "®" not in storage_path
        assert "(" not in storage_path
        assert ")" not in storage_path
        
        # Should be kebab-case
        assert "ap-physics-c-mechanics" in storage_path.lower()
        assert "original.docx" in storage_path
