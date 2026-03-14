"""
Object storage client for S3-compatible storage (AWS S3, MinIO).

Handles file upload, download, and deletion operations for exam documents
and generated artifacts.
"""

import os
from typing import BinaryIO, Optional
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from botocore.config import Config


class StorageClient:
    """
    S3-compatible storage client using boto3.
    
    Supports both AWS S3 and MinIO through configurable endpoint URL.
    
    Configuration via environment variables:
    - STORAGE_BUCKET_NAME: Target bucket name
    - STORAGE_ENDPOINT_URL: S3 endpoint (empty for AWS S3, http://localhost:9000 for MinIO)
    - STORAGE_ACCESS_KEY_ID: Access key ID
    - STORAGE_SECRET_ACCESS_KEY: Secret access key
    - STORAGE_REGION: AWS region (required for AWS S3, ignored by MinIO)
    """
    
    def __init__(self):
        """Initialize S3 client with environment configuration."""
        self.bucket_name = os.getenv("STORAGE_BUCKET_NAME", "siromix-exams")
        endpoint_url = os.getenv("STORAGE_ENDPOINT_URL")
        
        # Empty string or None for AWS S3, URL for MinIO
        endpoint_url = endpoint_url if endpoint_url else None
        
        # Create boto3 S3 client
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=os.getenv("STORAGE_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("STORAGE_SECRET_ACCESS_KEY"),
            region_name=os.getenv("STORAGE_REGION", "us-east-1"),
            config=Config(signature_version="s3v4"),
        )
    
    def upload_file(
        self,
        file_data: BinaryIO,
        file_path: str,
        content_type: Optional[str] = None
    ) -> str:
        """
        Upload file to object storage.
        
        Args:
            file_data: Binary file data stream
            file_path: Target path within bucket (e.g., "exams/user-id/exam-name/original.docx")
            content_type: MIME type (e.g., "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        
        Returns:
            Full storage path (bucket + file_path)
        
        Raises:
            ClientError: If upload fails (network, permissions, quota)
        """
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type
        
        try:
            self.s3_client.upload_fileobj(
                file_data,
                self.bucket_name,
                file_path,
                ExtraArgs=extra_args
            )
            return f"{self.bucket_name}/{file_path}"
        except (BotoCoreError, ClientError) as e:
            # Re-raise for caller to handle
            raise
    
    def get_file_url(self, file_path: str, expires_in: int = 3600) -> str:
        """
        Generate presigned URL for file download.
        
        Args:
            file_path: File path within bucket
            expires_in: URL expiration time in seconds (default: 1 hour)
        
        Returns:
            Presigned URL for temporary file access
        
        Raises:
            ClientError: If URL generation fails
        """
        try:
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": file_path},
                ExpiresIn=expires_in
            )
            return url
        except (BotoCoreError, ClientError) as e:
            raise
    
    def delete_file(self, file_path: str) -> None:
        """
        Delete file from object storage.
        
        Args:
            file_path: File path within bucket
        
        Raises:
            ClientError: If deletion fails
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=file_path
            )
        except (BotoCoreError, ClientError) as e:
            raise
    
    def file_exists(self, file_path: str) -> bool:
        """
        Check if file exists in storage.
        
        Args:
            file_path: File path within bucket
        
        Returns:
            True if file exists, False otherwise
        """
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=file_path)
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                return False
            raise
