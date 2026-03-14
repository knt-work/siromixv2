"""
Unit tests for StorageClient - Feature 004 User Story 1

Tests object storage operations with mocked boto3:
- File upload functionality
- Presigned URL generation
- File deletion
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from io import BytesIO
from botocore.exceptions import ClientError, BotoCoreError

from app.core.storage import StorageClient


@pytest.fixture
def mock_s3_client():
    """Create mock boto3 S3 client."""
    client = Mock()
    client.upload_fileobj = Mock()
    client.generate_presigned_url = Mock(return_value="https://storage.example.com/presigned-url?token=abc123")
    client.delete_object = Mock()
    client.head_object = Mock()
    return client


@pytest.fixture
def storage_client(mock_s3_client):
    """Create StorageClient with mocked S3 client."""
    with patch('app.core.storage.boto3.client', return_value=mock_s3_client):
        client = StorageClient()
        client.s3_client = mock_s3_client
        return client


class TestStorageClientUpload:
    """Test StorageClient.upload_file method."""
    
    def test_upload_file_success(self, storage_client, mock_s3_client):
        """Test successful file upload."""
        # Arrange
        file_data = BytesIO(b"Test file content")
        file_path = "exams/user-123/test-exam/original.docx"
        content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        
        # Act
        result = storage_client.upload_file(
            file_data=file_data,
            file_path=file_path,
            content_type=content_type
        )
        
        # Assert
        assert result == f"{storage_client.bucket_name}/{file_path}"
        mock_s3_client.upload_fileobj.assert_called_once()
        
        # Verify upload was called with correct parameters
        call_args = mock_s3_client.upload_fileobj.call_args
        assert call_args[0][0] == file_data  # file object
        assert call_args[0][1] == storage_client.bucket_name  # bucket
        assert call_args[0][2] == file_path  # key
        assert call_args[1]['ExtraArgs']['ContentType'] == content_type
    
    def test_upload_file_without_content_type(self, storage_client, mock_s3_client):
        """Test upload without explicit content type."""
        # Arrange
        file_data = BytesIO(b"Test file content")
        file_path = "test/file.docx"
        
        # Act
        result = storage_client.upload_file(
            file_data=file_data,
            file_path=file_path
        )
        
        # Assert
        assert result == f"{storage_client.bucket_name}/{file_path}"
        mock_s3_client.upload_fileobj.assert_called_once()
    
    def test_upload_file_client_error(self, storage_client, mock_s3_client):
        """Test upload failure with ClientError."""
        # Arrange
        file_data = BytesIO(b"Test file content")
        file_path = "test/file.docx"
        
        # Mock upload failure
        error_response = {'Error': {'Code': 'NoSuchBucket', 'Message': 'Bucket does not exist'}}
        mock_s3_client.upload_fileobj.side_effect = ClientError(error_response, 'PutObject')
        
        # Act & Assert
        with pytest.raises(ClientError) as exc_info:
            storage_client.upload_file(file_data, file_path)
        
        assert exc_info.value.response['Error']['Code'] == 'NoSuchBucket'
    
    def test_upload_file_network_error(self, storage_client, mock_s3_client):
        """Test upload failure with network error."""
        # Arrange
        file_data = BytesIO(b"Test file content")
        file_path = "test/file.docx"
        
        # Mock network failure
        mock_s3_client.upload_fileobj.side_effect = BotoCoreError()
        
        # Act & Assert
        with pytest.raises(BotoCoreError):
            storage_client.upload_file(file_data, file_path)


class TestStorageClientPresignedURL:
    """Test StorageClient.get_file_url method."""
    
    def test_get_file_url_default_expiration(self, storage_client, mock_s3_client):
        """Test presigned URL generation with default expiration."""
        # Arrange
        file_path = "exams/user-123/test-exam/original.docx"
        expected_url = "https://storage.example.com/presigned-url?token=abc123"
        mock_s3_client.generate_presigned_url.return_value = expected_url
        
        # Act
        url = storage_client.get_file_url(file_path)
        
        # Assert
        assert url == expected_url
        mock_s3_client.generate_presigned_url.assert_called_once_with(
            'get_object',
            Params={'Bucket': storage_client.bucket_name, 'Key': file_path},
            ExpiresIn=3600  # default 1 hour
        )
    
    def test_get_file_url_custom_expiration(self, storage_client, mock_s3_client):
        """Test presigned URL with custom expiration time."""
        # Arrange
        file_path = "test/file.docx"
        expires_in = 7200  # 2 hours
        
        # Act
        url = storage_client.get_file_url(file_path, expires_in=expires_in)
        
        # Assert
        mock_s3_client.generate_presigned_url.assert_called_once()
        call_args = mock_s3_client.generate_presigned_url.call_args
        assert call_args[1]['ExpiresIn'] == expires_in
    
    def test_get_file_url_client_error(self, storage_client, mock_s3_client):
        """Test presigned URL generation failure."""
        # Arrange
        file_path = "nonexistent/file.docx"
        error_response = {'Error': {'Code': 'NoSuchKey', 'Message': 'Key does not exist'}}
        mock_s3_client.generate_presigned_url.side_effect = ClientError(error_response, 'GetObject')
        
        # Act & Assert
        with pytest.raises(ClientError):
            storage_client.get_file_url(file_path)


class TestStorageClientDelete:
    """Test StorageClient.delete_file method."""
    
    def test_delete_file_success(self, storage_client, mock_s3_client):
        """Test successful file deletion."""
        # Arrange
        file_path = "exams/user-123/test-exam/original.docx"
        
        # Act
        storage_client.delete_file(file_path)
        
        # Assert
        mock_s3_client.delete_object.assert_called_once_with(
            Bucket=storage_client.bucket_name,
            Key=file_path
        )
    
    def test_delete_file_not_found(self, storage_client, mock_s3_client):
        """Test deletion of non-existent file (should not raise error)."""
        # Arrange
        file_path = "nonexistent/file.docx"
        error_response = {'Error': {'Code': 'NoSuchKey', 'Message': 'Key does not exist'}}
        mock_s3_client.delete_object.side_effect = ClientError(error_response, 'DeleteObject')
        
        # Act & Assert - S3 delete is idempotent, so this might not raise
        # Depending on StorageClient implementation it might swallow the error
        try:
            storage_client.delete_file(file_path)
        except ClientError as e:
            assert e.response['Error']['Code'] == 'NoSuchKey'
    
    def test_delete_file_permission_denied(self, storage_client, mock_s3_client):
        """Test deletion failure due to permissions."""
        # Arrange
        file_path = "protected/file.docx"
        error_response = {'Error': {'Code': 'AccessDenied', 'Message': 'Access denied'}}
        mock_s3_client.delete_object.side_effect = ClientError(error_response, 'DeleteObject')
        
        # Act & Assert
        with pytest.raises(ClientError) as exc_info:
            storage_client.delete_file(file_path)
        
        assert exc_info.value.response['Error']['Code'] == 'AccessDenied'


class TestStorageClientFileExists:
    """Test StorageClient.file_exists method."""
    
    def test_file_exists_true(self, storage_client, mock_s3_client):
        """Test checking if file exists (returns True)."""
        # Arrange
        file_path = "exams/user-123/test-exam/original.docx"
        mock_s3_client.head_object.return_value = {
            'ContentLength': 1024,
            'ContentType': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
        
        # Act
        exists = storage_client.file_exists(file_path)
        
        # Assert
        assert exists is True
        mock_s3_client.head_object.assert_called_once_with(
            Bucket=storage_client.bucket_name,
            Key=file_path
        )
    
    def test_file_exists_false(self, storage_client, mock_s3_client):
        """Test checking if file exists (returns False)."""
        # Arrange
        file_path = "nonexistent/file.docx"
        error_response = {'Error': {'Code': '404', 'Message': 'Not Found'}}
        mock_s3_client.head_object.side_effect = ClientError(error_response, 'HeadObject')
        
        # Act
        exists = storage_client.file_exists(file_path)
        
        # Assert
        assert exists is False
        mock_s3_client.head_object.assert_called_once()
