"""
Extraction Service - Orchestrates DOCX to DIJ conversion

Coordinates the full extraction pipeline:
1. Parse DOCX using DocxParser
2. Process image blocks with ImageExtractor (Phase 5)
3. Process math blocks with MathConverter (Phase 6)
4. Build complete DIJ structure
5. Calculate metadata (timing, counts, warnings)
6. Validate against Pydantic schema
7. Return validated DIJ
"""

from pathlib import Path
from datetime import datetime, timezone
import time
import asyncio
from typing import Any
from collections import Counter
from uuid import UUID

from docx import Document

from app.core.docx_parser import DocxParser
from app.core.image_extractor import ImageExtractor
from app.core.math_converter import MathConverter
from app.core.exceptions import ExtractionError, ErrorCode
from app.schemas.dij import DIJv1, Block, ExtractionMetadata, BlockType


class ExtractionService:
    """
    High-level extraction service for DOCX to DIJ conversion
    
    Usage:
        service = ExtractionService()
        dij = service.extract_dij(file_path, source_document_id)
    """
    
    def __init__(self):
        """Initialize service with parser"""
        self.parser = DocxParser()
        self.warnings: list[str] = []
    
    def extract_dij(
        self,
        file_path: str | Path,
        source_document_id: str,
        source_filename: str | None = None,
        task_id: UUID | None = None,
        exam_id: UUID | None = None
    ) -> DIJv1:
        """
        Extract complete DIJ from DOCX file
        
        Orchestrates the full extraction pipeline:
        1. Validate and parse DOCX
        2. Extract all blocks (paragraphs, tables, images, math)
        3. Process image blocks (upload to S3, create artifacts) if task_id provided
        4. Build metadata (timing, counts, warnings)
        5. Validate against DIJv1 schema
        6. Return validated DIJ
        
        Args:
            file_path: Path to DOCX file
            source_document_id: UUID of source artifact/exam
            source_filename: Original filename (defaults to file_path basename)
            task_id: Optional task ID for image artifact tracking (Phase 5)
            exam_id: Optional exam ID for image artifact tracking (Phase 5)
        
        Returns:
            Validated DIJv1 object
        
        Raises:
            ExtractionError: If extraction or validation fails
        
        Example:
            service = ExtractionService()
            dij = service.extract_dij(
                file_path="exam.docx",
                source_document_id="550e8400-e29b-41d4-a716-446655440000",
                source_filename="midterm_exam.docx",
                task_id=task_uuid,  # Optional: enables image upload
                exam_id=exam_uuid   # Optional: enables image upload
            )
        """
        # Reset warnings for this extraction
        self.warnings = []
        
        # Determine source filename
        file_path = Path(file_path)
        if source_filename is None:
            source_filename = file_path.name
        
        # Start timing
        start_time = time.time()
        extraction_timestamp = datetime.now(timezone.utc)
        
        try:
            # Validate file first (this will raise ValidationError if file doesn't exist)
            self.parser.validate_docx(file_path)
            
            # Get file size for metadata (safe after validation)
            source_file_size = file_path.stat().st_size
            
            # Extract all blocks using parser
            blocks_data = self.parser.extract_blocks(
                file_path=file_path,
                source_document_id=source_document_id
            )
            
            # Process image blocks if task_id and exam_id provided (Phase 5 - T072)
            if task_id is not None and exam_id is not None:
                blocks_data = asyncio.run(
                    self._process_image_blocks(
                        blocks_data=blocks_data,
                        document_path=file_path,
                        task_id=task_id,
                        exam_id=exam_id
                    )
                )
            
            # Process math blocks: convert OMML to LaTeX (Phase 6 - T091)
            blocks_data = self._process_math_blocks(blocks_data)
            
            # Convert block dictionaries to Block objects
            blocks = [Block(**block_data) for block_data in blocks_data]
            
            # Calculate extraction duration
            duration_ms = int((time.time() - start_time) * 1000)
            
            # Build metadata
            metadata = self._build_metadata(
                extraction_timestamp=extraction_timestamp,
                source_filename=source_filename,
                source_file_size=source_file_size,
                blocks=blocks,
                duration_ms=duration_ms
            )
            
            # Assemble DIJ structure
            dij_data = {
                "version": "1.0",
                "document_id": source_document_id,
                "blocks": blocks,
                "metadata": metadata
            }
            
            # Validate against Pydantic schema
            dij = self._validate_dij(dij_data)
            
            return dij
        
        except ExtractionError:
            # Re-raise extraction errors unchanged
            raise
        
        except Exception as e:
            # Wrap unexpected errors
            raise ExtractionError(
                error_code=ErrorCode.UNKNOWN_ERROR,
                technical_details=f"Unexpected error during DIJ extraction: {type(e).__name__}",
                original_exception=e,
                file_path=str(file_path)
            ) from e
    
    async def _process_image_blocks(
        self,
        blocks_data: list[dict],
        document_path: Path,
        task_id: UUID,
        exam_id: UUID
    ) -> list[dict]:
        """
        Process image blocks: upload to S3 and populate artifact metadata (Phase 5 - T072, T073)
        
        Handles:
        1. Open DOCX document to access image data
        2. Use ImageExtractor to extract and upload images
        3. Populate artifact_id and metadata in image blocks
        4. Handle upload errors gracefully (T073)
        
        Args:
            blocks_data: List of block dictionaries from parser
            document_path: Path to DOCX file
            task_id: Task UUID for artifact tracking
            exam_id: Exam UUID for artifact tracking
        
        Returns:
            Updated blocks_data with populated image blocks
        """
        # Find image blocks that need processing
        image_blocks = [b for b in blocks_data if b.get("type") == "image" and b["content"].get("artifact_id") is None]
        
        if not image_blocks:
            return blocks_data  # No images to process
        
        # Open document to access images
        document = Document(document_path)
        
        # Initialize ImageExtractor
        image_extractor = ImageExtractor(task_id=task_id, exam_id=exam_id)
        
        # Extract all images from document
        try:
            images = image_extractor.extract_images(document)
        except Exception as e:
            # Handle image extraction errors (T073)
            self.warnings.append(f"Failed to extract images from document: {str(e)}")
            return blocks_data  # Return blocks without processing images
        
        # Create mapping of image_rel_id to image data
        image_map = {img["image_id"]: img for img in images}
        
        # Process each image block
        for block in image_blocks:
            image_rel_id = block["content"].get("_image_rel_id")
            
            if image_rel_id not in image_map:
                self.warnings.append(f"Image block references unknown image: {image_rel_id}")
                continue
            
            image_data = image_map[image_rel_id]
            
            try:
                # Upload image and create artifact (T072)
                artifact_id = await image_extractor.extract_and_upload(
                    binary=image_data["binary"],
                    sequence=image_data["sequence"],
                    image_id=image_data["image_id"],
                    width=image_data["width"],
                    height=image_data["height"],
                    content_type=image_data["content_type"],
                    alt_text=image_data.get("alt_text"),
                    title=image_data.get("title")
                )
                
                # Populate image block with artifact metadata
                block["content"]["artifact_id"] = artifact_id
                block["content"]["width"] = image_data["width"]
                block["content"]["height"] = image_data["height"]
                block["content"]["alt_text"] = image_data.get("alt_text")
                block["content"]["title"] = image_data.get("title")
                block["content"]["content_type"] = image_data["content_type"]
                
                # Remove internal field
                if "_image_rel_id" in block["content"]:
                    del block["content"]["_image_rel_id"]
            
            except Exception as e:
                # Handle upload errors gracefully (T073)
                self.warnings.append(f"Failed to upload image {image_rel_id}: {str(e)}")
                # Leave block with None artifact_id (will fail validation, but logged)
        
        return blocks_data
    
    def _process_math_blocks(self, blocks_data: list[dict]) -> list[dict]:
        """
        Process math blocks: convert OMML to LaTeX (Phase 6 - T091, T092)
        
        Handles:
        1. Find math blocks with OMML content
        2. Use MathConverter to convert OMML to LaTeX
        3. Populate latex, conversion_failed, conversion_error fields
        4. Add conversion failure warnings to metadata (T092)
        
        Args:
            blocks_data: List of block dictionaries from parser
        
        Returns:
            Updated blocks_data with converted math blocks
        """
        # Find math blocks that need conversion
        math_blocks = [b for b in blocks_data if b.get("type") == "math"]
        
        if not math_blocks:
            return blocks_data  # No math to process
        
        # Initialize MathConverter
        math_converter = MathConverter()
        
        # Process each math block
        for block in math_blocks:
            omml_xml = block["content"].get("omml", "")
            
            if not omml_xml:
                # No OMML content - mark as failed
                block["content"]["conversion_failed"] = True
                block["content"]["conversion_error"] = "No OMML content found"
                block["content"]["latex"] = None
                self.warnings.append(f"Math block {block['id']} has no OMML content")
                continue
            
            try:
                # Convert OMML to LaTeX (T091)
                result = math_converter.convert_omml_to_latex(omml_xml)
                
                # Populate block with conversion results
                block["content"]["latex"] = result.get("latex")
                block["content"]["conversion_failed"] = result.get("conversion_failed", False)
                block["content"]["conversion_error"] = result.get("conversion_error")
                
                # Add warning if conversion failed (T092)
                if result.get("conversion_failed"):
                    error_msg = result.get("conversion_error", "Unknown error")
                    self.warnings.append(f"Math conversion failed for block {block['id']}: {error_msg}")
            
            except Exception as e:
                # Handle unexpected errors
                block["content"]["conversion_failed"] = True
                block["content"]["conversion_error"] = f"Unexpected error: {str(e)}"
                block["content"]["latex"] = None
                self.warnings.append(f"Math conversion error for block {block['id']}: {str(e)}")
        
        return blocks_data
    
    def _build_metadata(
        self,
        extraction_timestamp: datetime,
        source_filename: str,
        source_file_size: int,
        blocks: list[Block],
        duration_ms: int
    ) -> ExtractionMetadata:
        """
        Build extraction metadata
        
        Args:
            extraction_timestamp: When extraction started
            source_filename: Original DOCX filename
            source_file_size: File size in bytes
            blocks: Extracted blocks
            duration_ms: Extraction duration in milliseconds
        
        Returns:
            ExtractionMetadata object
        """
        # Count blocks by type
        block_type_counts = {}
        for block_type in BlockType:
            count = sum(1 for b in blocks if b.type == block_type)
            if count > 0:
                block_type_counts[block_type.value] = count
        
        return ExtractionMetadata(
            extraction_timestamp=extraction_timestamp,
            source_filename=source_filename,
            source_file_size=source_file_size,
            total_blocks=len(blocks),
            block_type_counts=block_type_counts,
            extraction_duration_ms=duration_ms,
            warnings=self.warnings.copy()
        )
    
    def _validate_dij(self, dij_data: dict[str, Any]) -> DIJv1:
        """
        Validate DIJ against Pydantic schema
        
        Args:
            dij_data: Raw DIJ dictionary
        
        Returns:
            Validated DIJv1 object
        
        Raises:
            ExtractionError: If validation fails
        """
        try:
            return DIJv1(**dij_data)
        except Exception as e:
            raise ExtractionError(
                error_code=ErrorCode.UNKNOWN_ERROR,
                user_message="Failed to validate extracted content",
                technical_details=f"DIJ validation failed: {str(e)}",
                original_exception=e
            ) from e
    
    def add_warning(self, warning: str) -> None:
        """
        Add a non-fatal warning to the extraction
        
        Args:
            warning: Warning message
        """
        self.warnings.append(warning)
