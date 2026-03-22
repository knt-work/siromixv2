"""
Extraction Service - Orchestrates DOCX to DIJ conversion

Coordinates the full extraction pipeline:
1. Parse DOCX using DocxParser
2. Build complete DIJ structure
3. Calculate metadata (timing, counts, warnings)
4. Validate against Pydantic schema
5. Return validated DIJ
"""

from pathlib import Path
from datetime import datetime, timezone
import time
from typing import Any
from collections import Counter

from app.core.docx_parser import DocxParser
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
        source_filename: str | None = None
    ) -> DIJv1:
        """
        Extract complete DIJ from DOCX file
        
        Orchestrates the full extraction pipeline:
        1. Validate and parse DOCX
        2. Extract all blocks (paragraphs, tables, images, math)
        3. Build metadata (timing, counts, warnings)
        4. Validate against DIJv1 schema
        5. Return validated DIJ
        
        Args:
            file_path: Path to DOCX file
            source_document_id: UUID of source artifact/exam
            source_filename: Original filename (defaults to file_path basename)
        
        Returns:
            Validated DIJv1 object
        
        Raises:
            ExtractionError: If extraction or validation fails
        
        Example:
            service = ExtractionService()
            dij = service.extract_dij(
                file_path="exam.docx",
                source_document_id="550e8400-e29b-41d4-a716-446655440000",
                source_filename="midterm_exam.docx"
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
