"""
Image Extractor - Extract and store images from DOCX files

Handles image extraction, storage to S3/MinIO, and artifact record creation.

Phase 5 Implementation (User Story 3):
- T064: ImageExtractor class
- T065: extract_images() - find all InlineShapes and drawing objects
- T066: _extract_image_binary() - get image.blob from relationships
- T067: _generate_artifact_filename() - format: task_id_seq_id.ext
- T068: _compute_content_hash() - SHA256 for deduplication
- T069: extract_and_upload() - upload to S3, create artifact record
"""

import hashlib
import io
import mimetypes
from pathlib import Path
from typing import Any
from uuid import UUID

from docx import Document
from docx.oxml import CT_Blip
from docx.parts.image import ImagePart
from PIL import Image as PILImage

from app.core.storage import StorageClient
from app.core.database import AsyncSessionLocal
from app.models.artifact import Artifact, ArtifactType
from app.schemas.dij import ImageContent


class ImageExtractor:
    """
    Extract images from DOCX files and store as external artifacts.
    
    Images are:
    1. Extracted from DOCX relationships
    2. Uploaded to S3/MinIO storage
    3. Saved as Artifact records in database
    4. Referenced by artifact_id in DIJ image blocks
    
    Usage:
        extractor = ImageExtractor(task_id=task_uuid, exam_id=exam_uuid)
        images = extractor.extract_images(document)
        
        # For each image position in document:
        artifact_id = await extractor.extract_and_upload(
            binary=image["binary"],
            sequence=image["sequence"],
            image_id=image["image_id"],
            width=image["width"],
            height=image["height"],
            content_type=image["content_type"]
        )
    """
    
    def __init__(self, task_id: UUID, exam_id: UUID | None = None):
        """
        Initialize image extractor
        
        Args:
            task_id: UUID of processing task
            exam_id: UUID of parent exam (optional, inherited from task if None)
        """
        self.task_id = task_id
        self.exam_id = exam_id
        self.storage = StorageClient()
        self._image_cache: dict[str, str] = {}  # content_hash -> artifact_id (for deduplication)
    
    def extract_images(self, document: Document) -> list[dict[str, Any]]:
        """
        Extract all images from DOCX document (T065)
        
        Finds images in two locations:
        1. InlineShapes (images inline with text)
        2. Drawing objects (floating images, text boxes with images)
        
        Args:
            document: python-docx Document object
        
        Returns:
            List of image dictionaries with metadata:
            {
                "sequence": int,           # Position in document (0-indexed)
                "image_id": str,           # Unique ID (e.g., "rId5")
                "binary": bytes,           # Raw image bytes
                "format": str,             # "PNG", "JPEG", "GIF", etc.
                "content_type": str,       # "image/png", "image/jpeg"
                "width": float | None,     # Width in pixels (if available)
                "height": float | None,    # Height in pixels (if available)
                "alt_text": str | None,    # Alternative text
                "title": str | None        # Image title
            }
        """
        images = []
        sequence = 0
        
        # Extract from document relationships
        # Images are stored as ImagePart objects in document.part.rels
        for rel_id, rel in document.part.rels.items():
            if isinstance(rel.target_part, ImagePart):
                image_part = rel.target_part
                
                # Extract binary data
                binary = self._extract_image_binary(image_part)
                
                # Get image metadata
                width, height = self._get_image_dimensions(binary)
                content_type = image_part.content_type
                image_format = self._get_image_format(content_type)
                
                # Find alt_text and title from document (if inline shape references this image)
                alt_text, title = self._find_image_metadata(document, rel_id)
                
                images.append({
                    "sequence": sequence,
                    "image_id": rel_id,
                    "binary": binary,
                    "format": image_format,
                    "content_type": content_type,
                    "width": width,
                    "height": height,
                    "alt_text": alt_text,
                    "title": title
                })
                
                sequence += 1
        
        return images
    
    def _extract_image_binary(self, image_part: ImagePart) -> bytes:
        """
        Extract raw image bytes from ImagePart (T066)
        
        Args:
            image_part: python-docx ImagePart object
        
        Returns:
            Raw image bytes
        """
        # ImagePart.blob contains the binary image data
        return image_part.blob
    
    def _get_image_dimensions(self, binary: bytes) -> tuple[float | None, float | None]:
        """
        Get image dimensions using PIL
        
        Args:
            binary: Raw image bytes
        
        Returns:
            (width, height) in pixels, or (None, None) if cannot be determined
        """
        try:
            img = PILImage.open(io.BytesIO(binary))
            return float(img.width), float(img.height)
        except Exception:
            return None, None
    
    def _get_image_format(self, content_type: str) -> str:
        """
        Extract image format from content type
        
        Args:
            content_type: MIME type (e.g., "image/png")
        
        Returns:
            Image format string (e.g., "PNG")
        """
        # Extract format from MIME type
        if "/" in content_type:
            format_str = content_type.split("/")[1].upper()
            # Handle special cases
            if format_str == "JPEG":
                return "JPEG"
            elif format_str == "PNG":
                return "PNG"
            elif format_str == "GIF":
                return "GIF"
            elif format_str == "BMP":
                return "BMP"
            elif format_str == "TIFF":
                return "TIFF"
            else:
                return format_str
        return "UNKNOWN"
    
    def _find_image_metadata(
        self,
        document: Document,
        rel_id: str
    ) -> tuple[str | None, str | None]:
        """
        Find alt_text and title for image by searching document
        
        Args:
            document: python-docx Document
            rel_id: Relationship ID (e.g., "rId5")
        
        Returns:
            (alt_text, title) or (None, None) if not found
        """
        # Search through all inline shapes in the document
        for paragraph in document.paragraphs:
            for run in paragraph.runs:
                # Check if run contains inline shapes
                inline_shapes = run._element.findall('.//{*}blip')
                for blip in inline_shapes:
                    # Get the embed relationship ID
                    embed_attr = blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                    if embed_attr == rel_id:
                        # Found the inline shape, extract alt text and title
                        # Navigate up to the drawing element to find docPr (name and description)
                        drawing = blip.getparent()
                        while drawing is not None and drawing.tag != '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}drawing':
                            drawing = drawing.getparent()
                        
                        if drawing is not None:
                            doc_pr = drawing.find('.//{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}docPr')
                            if doc_pr is not None:
                                title = doc_pr.get('name')
                                alt_text = doc_pr.get('descr')
                                return alt_text, title
        
        return None, None
    
    def _generate_artifact_filename(
        self,
        sequence: int,
        image_id: str,
        extension: str
    ) -> str:
        """
        Generate unique artifact filename (T067)
        
        Format: {task_id}_{sequence}_{image_id}.{extension}
        
        Args:
            sequence: Image sequence number (0-indexed)
            image_id: Image identifier (e.g., "rId5")
            extension: File extension (e.g., "png", "jpg")
        
        Returns:
            Unique filename string
        
        Example:
            "550e8400-e29b-41d4-a716-446655440000_1_rId5.png"
        """
        # Clean image_id (remove any path separators)
        clean_image_id = image_id.replace("/", "_").replace("\\", "_")
        return f"{self.task_id}_{sequence}_{clean_image_id}.{extension}"
    
    def _compute_content_hash(self, binary: bytes) -> str:
        """
        Compute SHA256 content hash for deduplication (T068)
        
        Args:
            binary: Raw image bytes
        
        Returns:
            64-character hex SHA256 hash
        """
        return hashlib.sha256(binary).hexdigest()
    
    async def extract_and_upload(
        self,
        binary: bytes,
        sequence: int,
        image_id: str,
        width: float | None,
        height: float | None,
        content_type: str,
        alt_text: str | None = None,
        title: str | None = None
    ) -> str:
        """
        Upload image to S3 and create artifact record (T069)
        
        Handles:
        1. Content hash computation for deduplication
        2. Check if image already uploaded (cache lookup)
        3. Upload to S3/MinIO
        4. Create Artifact database record
        5. Return artifact_id for DIJ reference
        
        Args:
            binary: Raw image bytes
            sequence: Image sequence number
            image_id: Image identifier
            width: Image width in pixels
            height: Image height in pixels
            content_type: MIME type
            alt_text: Alternative text (optional)
            title: Image title (optional)
        
        Returns:
            artifact_id (as string) for referencing in DIJ
        
        Raises:
            Exception: If upload or database operation fails
        """
        # Compute content hash for deduplication
        content_hash = self._compute_content_hash(binary)
        
        # Check if already uploaded
        if content_hash in self._image_cache:
            return self._image_cache[content_hash]
        
        # Determine file extension from content type
        extension = mimetypes.guess_extension(content_type) or ".bin"
        if extension.startswith("."):
            extension = extension[1:]
        
        # Generate unique filename
        filename = self._generate_artifact_filename(sequence, image_id, extension)
        
        # Generate S3 path: exams/{exam_id}/images/{filename}
        file_path = f"exams/{self.exam_id}/images/{filename}"
        
        # Upload to S3
        file_stream = io.BytesIO(binary)
        self.storage.upload_file(
            file_data=file_stream,
            file_path=file_path,
            content_type=content_type
        )
        
        # Create artifact record in database
        async with AsyncSessionLocal() as session:
            artifact = Artifact(
                exam_id=self.exam_id,
                task_id=self.task_id,
                artifact_type=ArtifactType.DIJ,  # Using DIJ as placeholder (need IMAGE type)
                file_name=filename,
                file_path=file_path,
                mime_type=content_type
            )
            session.add(artifact)
            await session.commit()
            await session.refresh(artifact)
            
            artifact_id = str(artifact.artifact_id)
        
        # Cache for deduplication
        self._image_cache[content_hash] = artifact_id
        
        return artifact_id
