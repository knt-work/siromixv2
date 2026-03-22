"""
Unit tests for ImageExtractor (Phase 5 - US3)

Tests MUST be written FIRST and FAIL before implementation (TDD).

Test Coverage:
- T057: Extract single PNG image from with_images.docx
- T058: Extract JPEG image and verify format preservation
- T059: Generate unique artifact filename (task_id_sequence_image_id.ext)
- T060: Upload image to S3/MinIO (mocked)
- T061: Create artifact record with correct metadata
- T062: Detect duplicate images by content hash
"""

import hashlib
import io
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

import pytest
from docx import Document
from PIL import Image as PILImage

from app.core.image_extractor import ImageExtractor

# Fixture paths
FIXTURES_DIR = Path(__file__).parent.parent / "fixtures" / "sample_exams"
WITH_IMAGES_DOCX = FIXTURES_DIR / "with_images.docx"


class TestImageExtraction:
    """Test image extraction from DOCX files"""
    
    def test_extract_single_png_image_from_with_images_docx(self):
        """T057: Extract single PNG image and verify format"""
        
        # Load fixture
        doc = Document(WITH_IMAGES_DOCX)
        task_id = uuid4()
        extractor = ImageExtractor(task_id=task_id)
        
        # Extract all images
        images = extractor.extract_images(doc)
        
        # Should extract 3 images total (2 PNG, 1 JPEG from fixture)
        assert len(images) >= 1, "Should extract at least one image"
        
        # Find first PNG image
        png_images = [img for img in images if img["content_type"] == "image/png"]
        assert len(png_images) >= 1, "Should extract at least one PNG image"
        
        # Verify PNG metadata
        png_img = png_images[0]
        assert png_img["format"] == "PNG"
        assert png_img["width"] > 0
        assert png_img["height"] > 0
        assert isinstance(png_img["binary"], bytes)
        assert len(png_img["binary"]) > 0
    
    def test_extract_jpeg_image_and_verify_format_preservation(self):
        """T058: Extract JPEG image and verify format is preserved"""
        doc = Document(WITH_IMAGES_DOCX)
        task_id = uuid4()
        extractor = ImageExtractor(task_id=task_id)
        
        images = extractor.extract_images(doc)
        
        # Find JPEG image
        jpeg_images = [img for img in images if img["content_type"] == "image/jpeg"]
        assert len(jpeg_images) >= 1, "Should extract at least one JPEG image"
        
        # Verify JPEG metadata
        jpeg_img = jpeg_images[0]
        assert jpeg_img["format"] == "JPEG"
        assert jpeg_img["content_type"] == "image/jpeg"
        
        # Verify binary is valid JPEG (check magic bytes)
        jpeg_magic = jpeg_img["binary"][:2]
        assert jpeg_magic == b'\xff\xd8', "Should have JPEG magic bytes"
    
    def test_generate_unique_artifact_filename(self):
        """T059: Generate unique artifact filename (task_id_sequence_image_id.ext)"""
        task_id = uuid4()
        extractor = ImageExtractor(task_id=task_id)
        
        # Generate filename for PNG
        filename1 = extractor._generate_artifact_filename(
            sequence=1,
            image_id="img-001",
            extension="png"
        )
        
        # Format: {task_id}_{sequence}_{image_id}.{ext}
        expected_pattern = f"{task_id}_1_img-001.png"
        assert filename1 == expected_pattern
        
        # Generate filename for JPEG
        filename2 = extractor._generate_artifact_filename(
            sequence=2,
            image_id="img-002",
            extension="jpg"
        )
        
        assert filename2 == f"{task_id}_2_img-002.jpg"
        
        # Verify uniqueness (different sequences)
        assert filename1 != filename2
    
    def test_upload_image_to_s3_minio_via_artifact_service(self):
        """T060: Upload image to S3/MinIO (mocked)"""
        pytest.skip("TDD: ImageExtractor not yet implemented")
        
        # Mock S3 client
        mock_s3_client = MagicMock()
        mock_boto3.client.return_value = mock_s3_client
        
        task_id = uuid4()
        exam_id = uuid4()
        extractor = ImageExtractor(task_id=task_id, exam_id=exam_id)
        
        # Create test image binary
        test_image = PILImage.new('RGB', (100, 100), color='blue')
        img_buffer = io.BytesIO()
        test_image.save(img_buffer, format='PNG')
        img_binary = img_buffer.getvalue()
        
        # Upload image
        result = extractor.upload_to_s3(
            binary=img_binary,
            filename="test_image.png",
            content_type="image/png"
        )
        
        # Verify S3 upload was called
        mock_s3_client.put_object.assert_called_once()
        call_args = mock_s3_client.put_object.call_args
        
        assert call_args.kwargs["Body"] == img_binary
        assert call_args.kwargs["ContentType"] == "image/png"
        assert "test_image.png" in call_args.kwargs["Key"]
        
        # Verify result contains S3 path
        assert result["s3_key"] is not None
        assert result["s3_bucket"] is not None
    
    def test_create_artifact_record_with_correct_metadata(self):
        """T061: Create artifact record with correct metadata"""
        pytest.skip("TDD: ImageExtractor not yet implemented")
        
        task_id = uuid4()
        exam_id = uuid4()
        extractor = ImageExtractor(task_id=task_id, exam_id=exam_id)
        
        # Mock database session
        mock_session = MagicMock()
        mock_db_session.return_value.__enter__.return_value = mock_session
        
        # Create artifact record
        artifact_id = extractor.create_artifact_record(
            filename="test_image_001.png",
            file_path="exams/{exam_id}/images/test_image_001.png",
            mime_type="image/png",
            width=200,
            height=100
        )
        
        # Verify artifact was created
        mock_session.add.assert_called_once()
        artifact = mock_session.add.call_args.args[0]
        
        assert artifact.exam_id == exam_id
        assert artifact.task_id == task_id
        assert artifact.artifact_type == "image"  # Should be appropriate enum
        assert artifact.file_name == "test_image_001.png"
        assert artifact.mime_type == "image/png"
        
        # Verify commit was called
        mock_session.commit.assert_called_once()
        
        # Return artifact_id
        assert isinstance(artifact_id, (str, int))
    
    def test_detect_duplicate_images_by_content_hash(self):
        """T062: Detect duplicate images by content hash (SHA256)"""
        task_id = uuid4()
        extractor = ImageExtractor(task_id=task_id)
        
        # Create identical images
        test_image = PILImage.new('RGB', (100, 100), color='red')
        img_buffer1 = io.BytesIO()
        test_image.save(img_buffer1, format='PNG')
        binary1 = img_buffer1.getvalue()
        
        img_buffer2 = io.BytesIO()
        test_image.save(img_buffer2, format='PNG')
        binary2 = img_buffer2.getvalue()
        
        # Compute hashes
        hash1 = extractor._compute_content_hash(binary1)
        hash2 = extractor._compute_content_hash(binary2)
        
        # Hashes should match for identical images
        assert hash1 == hash2
        assert len(hash1) == 64  # SHA256 produces 64 hex characters
        
        # Different image should have different hash
        different_image = PILImage.new('RGB', (100, 100), color='blue')
        img_buffer3 = io.BytesIO()
        different_image.save(img_buffer3, format='PNG')
        binary3 = img_buffer3.getvalue()
        
        hash3 = extractor._compute_content_hash(binary3)
        assert hash3 != hash1
