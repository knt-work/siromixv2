"""
Contract tests for POST /api/v1/exams - Feature 004 User Story 1

Tests the exam creation endpoint against the API contract specification.
Contract: specs/004-exam-upload-api/contracts/exams_post.md
"""

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import Mock, patch
from io import BytesIO
import uuid

from app.main import app
from app.models.user import User


@pytest.fixture
def valid_exam_data():
    """Valid exam creation form data."""
    return {
        "name": "Kiểm tra giữa kì - Toán",
        "subject": "Toán học",
        "academic_year": "2025-2026",
        "grade_level": "6",
        "duration_minutes": "60",
        "num_variants": "3",
        "instructions": "Học sinh được sử dụng máy tính cầm tay"
    }


@pytest.fixture
def valid_docx_file():
    """Mock valid DOCX file upload."""
    # DOCX files start with PK (ZIP header)
    content = b'PK\x03\x04' + b'\x00' * 100  # Minimal DOCX-like header
    file = BytesIO(content)
    return ("exam.docx", file, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")


@pytest.fixture
def authenticated_client(test_user: User):
    """Create authenticated HTTP client with mocked JWT."""
    # Mock JWT token for test user
    mock_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token"
    
    async def override_get_current_user():
        return test_user
    
    # Override dependency to return test user
    from app.core.deps import get_current_user
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://testserver")


class TestPostExamsSuccess:
    """Test successful exam creation (201 Created)."""
    
    @pytest.mark.asyncio
    async def test_create_exam_success(
        self,
        authenticated_client: AsyncClient,
        valid_exam_data: dict,
        valid_docx_file: tuple,
        test_user: User
    ):
        """
        Test successful exam creation with valid data.
        
        Contract: POST /api/v1/exams
        Expected: 201 Created with {exam_id, task_id, status: "queued"}
        """
        # Arrange
        with patch('app.services.exam_service.ExamService.create_exam_with_upload') as mock_create:
            # Mock successful creation
            exam_id = uuid.uuid4()
            task_id = uuid.uuid4()
            mock_create.return_value = {
                "exam_id": exam_id,
                "task_id": task_id,
                "status": "queued"
            }
            
            # Prepare multipart/form-data
            files = {"file": valid_docx_file}
            data = valid_exam_data
            
            # Act
            response = await authenticated_client.post(
                "/api/v1/exams",
                data=data,
                files=files
            )
            
            # Assert
            assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
            
            json_response = response.json()
            assert "exam_id" in json_response
            assert "task_id" in json_response
            assert "status" in json_response
            
            # Verify UUID format
            assert isinstance(uuid.UUID(json_response["exam_id"]), uuid.UUID)
            assert isinstance(uuid.UUID(json_response["task_id"]), uuid.UUID)
            
            # Verify status
            assert json_response["status"] == "queued"
            
            # Verify service was called
            mock_create.assert_called_once()


class TestPostExamsValidationErrors:
    """Test validation error scenarios (400 Bad Request)."""
    
    @pytest.mark.asyncio
    async def test_missing_required_field_name(
        self,
        authenticated_client: AsyncClient,
        valid_exam_data: dict,
        valid_docx_file: tuple
    ):
        """Test missing required field 'name'."""
        # Arrange
        data = {**valid_exam_data}
        del data["name"]  # Remove required field
        files = {"file": valid_docx_file}
        
        # Act
        response = await authenticated_client.post(
            "/api/v1/exams",
            data=data,
            files=files
        )
        
        # Assert
        assert response.status_code == 400
        json_response = response.json()
        assert "detail" in json_response
        
        # Check validation error structure
        errors = json_response["detail"]
        assert isinstance(errors, list)
        assert any("name" in str(error.get("loc", [])) for error in errors)
    
    @pytest.mark.asyncio
    async def test_missing_required_field_duration_minutes(
        self,
        authenticated_client: AsyncClient,
        valid_exam_data: dict,
        valid_docx_file: tuple
    ):
        """Test missing required field 'duration_minutes'."""
        # Arrange
        data = {**valid_exam_data}
        del data["duration_minutes"]
        files = {"file": valid_docx_file}
        
        # Act
        response = await authenticated_client.post(
            "/api/v1/exams",
            data=data,
            files=files
        )
        
        # Assert
        assert response.status_code == 400
        json_response = response.json()
        assert "detail" in json_response
    
    @pytest.mark.asyncio
    async def test_invalid_duration_minutes_zero(
        self,
        authenticated_client: AsyncClient,
        valid_exam_data: dict,
        valid_docx_file: tuple
    ):
        """Test duration_minutes = 0 (must be > 0)."""
        # Arrange
        data = {**valid_exam_data, "duration_minutes": "0"}
        files = {"file": valid_docx_file}
        
        # Act
        response = await authenticated_client.post(
            "/api/v1/exams",
            data=data,
            files=files
        )
        
        # Assert
        assert response.status_code == 400
        json_response = response.json()
        assert "detail" in json_response
        
        # Check error mentions positive value requirement
        error_text = str(json_response["detail"]).lower()
        assert "greater than 0" in error_text or "positive" in error_text
    
    @pytest.mark.asyncio
    async def test_invalid_duration_minutes_negative(
        self,
        authenticated_client: AsyncClient,
        valid_exam_data: dict,
        valid_docx_file: tuple
    ):
        """Test negative duration_minutes value."""
        # Arrange
        data = {**valid_exam_data, "duration_minutes": "-10"}
        files = {"file": valid_docx_file}
        
        # Act
        response = await authenticated_client.post(
            "/api/v1/exams",
            data=data,
            files=files
        )
        
        # Assert
        assert response.status_code == 400
    
    @pytest.mark.asyncio
    async def test_invalid_num_variants_zero(
        self,
        authenticated_client: AsyncClient,
        valid_exam_data: dict,
        valid_docx_file: tuple
    ):
        """Test num_variants = 0 (must be > 0)."""
        # Arrange
        data = {**valid_exam_data, "num_variants": "0"}
        files = {"file": valid_docx_file}
        
        # Act
        response = await authenticated_client.post(
            "/api/v1/exams",
            data=data,
            files=files
        )
        
        # Assert
        assert response.status_code == 400
    
    @pytest.mark.asyncio
    async def test_name_exceeds_max_length(
        self,
        authenticated_client: AsyncClient,
        valid_exam_data: dict,
        valid_docx_file: tuple
    ):
        """Test name field exceeding 500 characters."""
        # Arrange
        data = {**valid_exam_data, "name": "A" * 501}  # 501 chars (max is 500)
        files = {"file": valid_docx_file}
        
        # Act
        response = await authenticated_client.post(
            "/api/v1/exams",
            data=data,
            files=files
        )
        
        # Assert
        assert response.status_code == 400
        json_response = response.json()
        error_text = str(json_response["detail"]).lower()
        assert "500" in error_text or "length" in error_text
    
    @pytest.mark.asyncio
    async def test_missing_file_upload(
        self,
        authenticated_client: AsyncClient,
        valid_exam_data: dict
    ):
        """Test request without file upload."""
        # Arrange
        data = valid_exam_data
        # No files parameter
        
        # Act
        response = await authenticated_client.post(
            "/api/v1/exams",
            data=data
        )
        
        # Assert
        assert response.status_code == 400
        json_response = response.json()
        assert "detail" in json_response
        assert "file" in str(json_response["detail"]).lower()
    
    @pytest.mark.asyncio
    async def test_invalid_file_format_pdf(
        self,
        authenticated_client: AsyncClient,
        valid_exam_data: dict
    ):
        """Test uploading non-DOCX file (PDF)."""
        # Arrange
        pdf_content = b'%PDF-1.4' + b'\x00' * 100
        pdf_file = ("exam.pdf", BytesIO(pdf_content), "application/pdf")
        
        data = valid_exam_data
        files = {"file": pdf_file}
        
        # Act
        response = await authenticated_client.post(
            "/api/v1/exams",
            data=data,
            files=files
        )
        
        # Assert
        assert response.status_code == 400
        json_response = response.json()
        error_text = str(json_response["detail"]).lower()
        assert "docx" in error_text or "format" in error_text
    
    @pytest.mark.asyncio
    async def test_file_size_exceeds_limit(
        self,
        authenticated_client: AsyncClient,
        valid_exam_data: dict
    ):
        """Test file exceeding 50MB limit."""
        # Arrange - Create large file (51MB)
        large_content = b'PK\x03\x04' + b'\x00' * (51 * 1024 * 1024)
        large_file = ("exam.docx", BytesIO(large_content), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        
        data = valid_exam_data
        files = {"file": large_file}
        
        # Act
        response = await authenticated_client.post(
            "/api/v1/exams",
            data=data,
            files=files
        )
        
        # Assert
        assert response.status_code in [400, 413]  # 400 or 413 Payload Too Large
        json_response = response.json()
        assert "detail" in json_response
        assert "50" in str(json_response["detail"]) or "size" in str(json_response["detail"]).lower()


class TestPostExamsAuthenticationErrors:
    """Test authentication and authorization errors."""
    
    @pytest.mark.asyncio
    async def test_missing_authentication_token(
        self,
        valid_exam_data: dict,
        valid_docx_file: tuple
    ):
        """Test request without JWT token (401 Unauthorized)."""
        # Arrange
        transport = ASGITransport(app=app)
        client = AsyncClient(transport=transport, base_url="http://testserver")
        data = valid_exam_data
        files = {"file": valid_docx_file}
        
        # Act
        response = await client.post(
            "/api/v1/exams",
            data=data,
            files=files
        )
        
        # Assert
        assert response.status_code == 401
        json_response = response.json()
        assert "detail" in json_response
        assert "authenticated" in str(json_response["detail"]).lower()
    
    @pytest.mark.asyncio
    async def test_invalid_authentication_token(
        self,
        valid_exam_data: dict,
        valid_docx_file: tuple
    ):
        """Test request with invalid JWT token."""
        # Arrange
        transport = ASGITransport(app=app)
        client = AsyncClient(transport=transport, base_url="http://testserver")
        data = valid_exam_data
        files = {"file": valid_docx_file}
        headers = {"Authorization": "Bearer invalid.token.here"}
        
        # Act
        response = await client.post(
            "/api/v1/exams",
            data=data,
            files=files,
            headers=headers
        )
        
        # Assert
        assert response.status_code == 401


class TestPostExamsStorageErrors:
    """Test storage service error scenarios."""
    
    @pytest.mark.asyncio
    async def test_storage_service_unavailable(
        self,
        authenticated_client: AsyncClient,
        valid_exam_data: dict,
        valid_docx_file: tuple
    ):
        """Test storage service unavailable (503 Service Unavailable)."""
        # Arrange
        with patch('app.services.exam_service.ExamService.create_exam_with_upload') as mock_create:
            from fastapi import HTTPException
            mock_create.side_effect = HTTPException(
                status_code=503,
                detail="Storage service is temporarily unavailable. Please try again later."
            )
            
            data = valid_exam_data
            files = {"file": valid_docx_file}
            
            # Act
            response = await authenticated_client.post(
                "/api/v1/exams",
                data=data,
                files=files
            )
            
            # Assert
            assert response.status_code == 503
            json_response = response.json()
            assert "storage" in str(json_response["detail"]).lower()
    
    @pytest.mark.asyncio
    async def test_storage_quota_exceeded(
        self,
        authenticated_client: AsyncClient,
        valid_exam_data: dict,
        valid_docx_file: tuple
    ):
        """Test storage quota exceeded (507 Insufficient Storage)."""
        # Arrange
        with patch('app.services.exam_service.ExamService.create_exam_with_upload') as mock_create:
            from fastapi import HTTPException
            mock_create.side_effect = HTTPException(
                status_code=507,
                detail="Storage capacity reached. Please contact support."
            )
            
            data = valid_exam_data
            files = {"file": valid_docx_file}
            
            # Act
            response = await authenticated_client.post(
                "/api/v1/exams",
                data=data,
                files=files
            )
            
            # Assert
            assert response.status_code == 507
            json_response = response.json()
            assert "storage" in str(json_response["detail"]).lower() or "capacity" in str(json_response["detail"]).lower()


class TestPostExamsDatabaseErrors:
    """Test database error scenarios."""
    
    @pytest.mark.asyncio
    async def test_database_connection_failure(
        self,
        authenticated_client: AsyncClient,
        valid_exam_data: dict,
        valid_docx_file: tuple
    ):
        """Test database connection failure (500 Internal Server Error)."""
        # Arrange
        with patch('app.services.exam_service.ExamService.create_exam_with_upload') as mock_create:
            from fastapi import HTTPException
            mock_create.side_effect = HTTPException(
                status_code=500,
                detail="An internal error occurred. Please try again later."
            )
            
            data = valid_exam_data
            files = {"file": valid_docx_file}
            
            # Act
            response = await authenticated_client.post(
                "/api/v1/exams",
                data=data,
                files=files
            )
            
            # Assert
            assert response.status_code == 500
            json_response = response.json()
            assert "detail" in json_response
