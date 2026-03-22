"""
DOCX Parser - Core extraction logic

Provides foundational DOCX parsing capabilities:
- File validation (format, size, corruption checks)
- Timeout protection (5 minute limit)
- Document structure traversal
- Block extraction coordination

This module will be extended in Phases 3-6 with specific extraction logic
for paragraphs, tables, images, and math equations.
"""

from pathlib import Path
from zipfile import ZipFile, BadZipFile
from functools import wraps
import time
import signal
from typing import Callable, Any
from datetime import datetime, timezone
from uuid import uuid4

from docx import Document
from docx.opc.exceptions import PackageNotFoundError
from docx.shared import RGBColor

from app.core.exceptions import (
    ExtractionError,
    ValidationError,
    TimeoutError,
    ErrorCode
)


# Configuration constants
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
EXTRACTION_TIMEOUT_SECONDS = 5 * 60  # 5 minutes


def timeout_decorator(timeout_seconds: int = EXTRACTION_TIMEOUT_SECONDS):
    """
    Decorator to enforce timeout on extraction functions
    
    Raises TimeoutError if function execution exceeds timeout_seconds.
    Uses signal.alarm on Unix systems; on Windows, provides basic time tracking.
    
    Args:
        timeout_seconds: Maximum execution time (default: 300 seconds = 5 minutes)
    
    Example:
        @timeout_decorator(timeout_seconds=60)
        def extract_document(file_path: str) -> dict:
            # Long-running extraction code
            pass
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            # Windows doesn't support signal.alarm, so use basic timing check
            start_time = time.time()
            
            try:
                # For Unix systems with signal support
                if hasattr(signal, 'SIGALRM'):
                    def timeout_handler(signum, frame):
                        raise TimeoutError(
                            technical_details=f"Function {func.__name__} exceeded {timeout_seconds}s timeout"
                        )
                    
                    # Set alarm
                    signal.signal(signal.SIGALRM, timeout_handler)
                    signal.alarm(timeout_seconds)
                
                result = func(*args, **kwargs)
                
                # Cancel alarm if set
                if hasattr(signal, 'SIGALRM'):
                    signal.alarm(0)
                
                # Check elapsed time on Windows
                elapsed = time.time() - start_time
                if elapsed > timeout_seconds:
                    raise TimeoutError(
                        technical_details=f"Function {func.__name__} exceeded {timeout_seconds}s timeout ({elapsed:.1f}s elapsed)"
                    )
                
                return result
            
            except TimeoutError:
                raise
            except Exception as e:
                # Cancel alarm on other exceptions
                if hasattr(signal, 'SIGALRM'):
                    signal.alarm(0)
                raise
        
        return wrapper
    return decorator


class DocxParser:
    """
    Core DOCX document parser
    
    Validates and extracts structured content from Microsoft Word DOCX files.
    Produces Document Intermediate JSON (DIJ v1.0) format.
    
    Usage:
        parser = DocxParser()
        parser.validate_docx(file_path)
        dij = parser.extract(file_path)
    """
    
    def __init__(self):
        """Initialize parser with default configuration"""
        self.max_file_size = MAX_FILE_SIZE_BYTES
        self.extraction_timeout = EXTRACTION_TIMEOUT_SECONDS
    
    def validate_docx(self, file_path: str | Path) -> None:
        """
        Validate DOCX file before extraction
        
        Performs three checks:
        1. File exists and is readable
        2. File size does not exceed 50MB limit
        3. File has valid DOCX/ZIP structure
        
        Args:
            file_path: Path to DOCX file
        
        Raises:
            ValidationError: If any validation check fails
        
        Example:
            try:
                parser.validate_docx("exam.docx")
            except ValidationError as e:
                print(f"Validation failed: {e.user_message}")
                print(f"Error code: {e.error_code}")
        """
        file_path = Path(file_path)
        
        # Check 1: File exists
        if not file_path.exists():
            raise ValidationError(
                error_code=ErrorCode.DOCX_INVALID_FORMAT,
                technical_details=f"File not found: {file_path}",
                file_path=str(file_path)
            )
        
        if not file_path.is_file():
            raise ValidationError(
                error_code=ErrorCode.DOCX_INVALID_FORMAT,
                technical_details=f"Path is not a file: {file_path}",
                file_path=str(file_path)
            )
        
        # Check 2: File size limit
        file_size = file_path.stat().st_size
        if file_size > self.max_file_size:
            raise ValidationError(
                error_code=ErrorCode.DOCX_TOO_LARGE,
                technical_details=f"File size {file_size} bytes exceeds limit {self.max_file_size} bytes",
                file_path=str(file_path),
                file_size=file_size,
                max_size=self.max_file_size
            )
        
        # Check 3: Valid DOCX/ZIP structure
        try:
            # DOCX is a ZIP archive - verify it can be opened
            with ZipFile(file_path, 'r') as zip_file:
                # Check for required DOCX components
                namelist = zip_file.namelist()
                required_files = ['[Content_Types].xml', 'word/document.xml']
                missing_files = [f for f in required_files if f not in namelist]
                
                if missing_files:
                    raise ValidationError(
                        error_code=ErrorCode.DOCX_INVALID_FORMAT,
                        technical_details=f"Missing required DOCX components: {missing_files}",
                        file_path=str(file_path),
                        missing_components=missing_files
                    )
        
        except BadZipFile as e:
            raise ValidationError(
                error_code=ErrorCode.DOCX_CORRUPTED,
                technical_details="File is not a valid ZIP archive (DOCX must be ZIP format)",
                original_exception=e,
                file_path=str(file_path)
            ) from e
        
        except ValidationError:
            # Re-raise our ValidationError unchanged
            raise
        
        except Exception as e:
            # Catch any other unexpected errors during validation
            raise ValidationError(
                error_code=ErrorCode.DOCX_INVALID_FORMAT,
                technical_details=f"Unexpected error during validation: {type(e).__name__}",
                original_exception=e,
                file_path=str(file_path)
            ) from e
        
        # All checks passed - validation successful
    
    def open_document(self, file_path: str | Path) -> Document:
        """
        Open DOCX document using python-docx
        
        Args:
            file_path: Path to validated DOCX file
        
        Returns:
            Document object from python-docx
        
        Raises:
            ExtractionError: If document cannot be opened
        """
        try:
            return Document(file_path)
        except PackageNotFoundError as e:
            raise ExtractionError(
                error_code=ErrorCode.DOCX_INVALID_FORMAT,
                technical_details="python-docx could not open document package",
                original_exception=e,
                file_path=str(file_path)
            ) from e
        except Exception as e:
            raise ExtractionError(
                error_code=ErrorCode.DOCX_CORRUPTED,
                technical_details=f"Failed to open DOCX: {type(e).__name__}",
                original_exception=e,
                file_path=str(file_path)
            ) from e
    
    def extract_blocks(self, file_path: str | Path, source_document_id: str | None = None) -> list[dict]:
        """
        Extract all blocks (paragraphs, tables, images, math) from DOCX
        
        Currently implements paragraph (Phase 3) and table (Phase 4) extraction.
        Images and math will be added in Phases 5-6.
        
        Args:
            file_path: Path to DOCX file
            source_document_id: UUID of source artifact (defaults to new UUID)
        
        Returns:
            List of block dictionaries with type, content, sequence, provenance
        
        Raises:
            ExtractionError: If extraction fails
        """
        # Validate and open document
        self.validate_docx(file_path)
        document = self.open_document(file_path)
        
        # Generate document ID if not provided
        if source_document_id is None:
            source_document_id = str(uuid4())
        
        blocks = []
        sequence = 1
        original_position = 0
        
        # Build maps for quick lookup
        paragraph_map = {id(p._element): p for p in document.paragraphs}
        table_map = {id(t._element): t for t in document.tables}
        
        # Iterate through document body elements in order
        # This preserves the correct sequence of paragraphs and tables
        for element in document.element.body:
            # Check if this is a paragraph
            if id(element) in paragraph_map:
                para = paragraph_map[id(element)]
                
                # Check if paragraph contains math equations (Phase 6 - T089)
                has_math = self._paragraph_has_math(para)
                
                if has_math:
                    # Extract as math block
                    block = self._extract_math(
                        para,
                        sequence=sequence,
                        original_position=original_position,
                        source_document_id=source_document_id
                    )
                    blocks.append(block)
                    sequence += 1
                    original_position += 1
                    continue
                
                # Check if paragraph contains an inline image (Phase 5 - T070)
                has_image = self._paragraph_has_inline_image(para)
                
                if has_image:
                    # Extract as image block
                    block = self._extract_image(
                        para,
                        sequence=sequence,
                        original_position=original_position,
                        source_document_id=source_document_id
                    )
                    blocks.append(block)
                    sequence += 1
                    original_position += 1
                else:
                    # Skip empty paragraphs (filter)
                    text_content = para.text.strip()
                    if not text_content:
                        original_position += 1
                        continue
                    
                    # Extract paragraph block
                    block = self._extract_paragraph(
                        para,
                        sequence=sequence,
                        original_position=original_position,
                        source_document_id=source_document_id
                    )
                    
                    blocks.append(block)
                    sequence += 1
                    original_position += 1
            
            # Check if this is a table (Phase 4)
            elif id(element) in table_map:
                table = table_map[id(element)]
                
                # Extract table block
                block = self._extract_table(
                    table,
                    sequence=sequence,
                    original_position=original_position,
                    source_document_id=source_document_id
                )
                
                blocks.append(block)
                sequence += 1
                original_position += 1
            
            else:
                # Other element types (images, math, etc.)
                # Skip for now - will be added in Phases 5-6
                original_position += 1
        
        # TODO Phase 5: Extract images
        # TODO Phase 6: Extract math equations
        
        return blocks
    
    def _extract_paragraph(
        self,
        para,
        sequence: int,
        original_position: int,
        source_document_id: str
    ) -> dict:
        """
        Extract a single paragraph with formatting
        
        Args:
            para: python-docx Paragraph object
            sequence: Sequential position (1-indexed)
            original_position: Original position in document (0-indexed)
            source_document_id: UUID of source document
        
        Returns:
            Paragraph block dictionary
        """
        # Extract all text runs with formatting
        runs = []
        for run in para.runs:
            run_data = self._extract_text_run(run)
            runs.append(run_data)
        
        # Extract paragraph-level formatting
        para_format = self._extract_paragraph_format(para)
        
        # Create provenance metadata
        provenance = self._create_provenance(
            source_document_id=source_document_id,
            original_position=original_position
        )
        
        # Assemble paragraph block
        return {
            "id": f"block-{uuid4().hex[:12]}",
            "type": "paragraph",
            "sequence": sequence,
            "content": {
                "runs": runs,
                **para_format
            },
            "provenance": provenance
        }
    
    def _extract_text_run(self, run) -> dict:
        """
        Extract a single text run with formatting
        
        Args:
            run: python-docx Run object
        
        Returns:
            TextRun dictionary with text and formatting
        """
        run_data = {
            "text": run.text,
            "bold": run.bold or False,
            "italic": run.italic or False,
            "underline": run.underline or False
        }
        
        # Extract font properties
        if run.font.name:
            run_data["font_name"] = run.font.name
        
        if run.font.size is not None:
            # Convert EMU to points (1 point = 12700 EMU)
            run_data["font_size"] = run.font.size.pt
        
        if run.font.color and run.font.color.rgb:
            # Convert RGB to hex format #RRGGBB
            rgb = run.font.color.rgb
            run_data["color"] = f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"
        
        return run_data
    
    def _extract_paragraph_format(self, para) -> dict:
        """
        Extract paragraph-level formatting
        
        Args:
            para: python-docx Paragraph object
        
        Returns:
            Dictionary with alignment, indents, spacing, style
        """
        format_data = {}
        
        # Alignment
        if para.alignment is not None:
            alignment_map = {
                0: "left",      # WD_ALIGN_PARAGRAPH.LEFT
                1: "center",    # WD_ALIGN_PARAGRAPH.CENTER
                2: "right",     # WD_ALIGN_PARAGRAPH.RIGHT
                3: "justify"    # WD_ALIGN_PARAGRAPH.JUSTIFY
            }
            format_data["alignment"] = alignment_map.get(para.alignment, "left")
        
        # Indentation (convert EMU to points)
        if para.paragraph_format.left_indent is not None:
            format_data["indent_left"] = para.paragraph_format.left_indent.pt
        
        if para.paragraph_format.right_indent is not None:
            format_data["indent_right"] = para.paragraph_format.right_indent.pt
        
        # Spacing (convert EMU to points)
        if para.paragraph_format.space_before is not None:
            format_data["space_before"] = para.paragraph_format.space_before.pt
        
        if para.paragraph_format.space_after is not None:
            format_data["space_after"] = para.paragraph_format.space_after.pt
        
        # Line spacing
        if para.paragraph_format.line_spacing is not None:
            format_data["line_spacing"] = para.paragraph_format.line_spacing
        
        # Style
        if para.style and para.style.name:
            format_data["style"] = para.style.name
        
        return format_data
    
    def _paragraph_has_inline_image(self, para) -> bool:
        """
        Detect if paragraph contains an inline image (Phase 5 - T070)
        
        Args:
            para: python-docx Paragraph object
        
        Returns:
            True if paragraph contains at least one inline image
        """
        # Check each run for inline shapes
        for run in para.runs:
            # Look for blip elements (image references) in the run
            blips = run._element.findall('.//{*}blip')
            if blips:
                return True
        
        return False
    
    def _paragraph_has_math(self, para) -> bool:
        """
        Detect if paragraph contains math equations (Phase 6 - T089)
        
        Args:
            para: python-docx Paragraph object
        
        Returns:
            True if paragraph contains at least one OMML equation
        """
        # Look for oMath elements (Office Math Markup Language)
        omml_namespace = "http://schemas.openxmlformats.org/officeDocument/2006/math"
        omml_elements = para._element.findall(f'.//{{{omml_namespace}}}oMath')
        
        return len(omml_elements) > 0
    
    def _extract_image(
        self,
        para,
        sequence: int,
        original_position: int,
        source_document_id: str
    ) -> dict:
        """
        Extract image block placeholder (Phase 5 - T071)
        
        Creates image block with position and metadata placeholders.
        Actual image upload and artifact_id population happens in ExtractionService.
        
        Args:
            para: python-docx Paragraph object containing inline image
            sequence: Sequential position (1-indexed)
            original_position: Original position in document (0-indexed)
            source_document_id: UUID of source document
        
        Returns:
            Image block dictionary with placeholder content
        """
        # Find the first blip (image) in the paragraph
        image_rel_id = None
        for run in para.runs:
            blips = run._element.findall('.//{*}blip')
            if blips:
                # Get the relationship ID from the blip
                blip = blips[0]
                ns_r = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
                image_rel_id = blip.get(f'{ns_r}embed')
                break
        
        # Create provenance metadata
        provenance = self._create_provenance(
            source_document_id=source_document_id,
            original_position=original_position
        )
        
        # Create image block placeholder
        # The artifact_id and other metadata will be populated by ExtractionService
        return {
            "id": f"block-{uuid4().hex[:12]}",
            "type": "image",
            "sequence": sequence,
            "content": {
                "artifact_id": None,  # Will be populated by ExtractionService
                "width": None,  # Will be populated by ImageExtractor
                "height": None,  # Will be populated by ImageExtractor
                "alt_text": None,  # Will be populated by ImageExtractor
                "title": None,  # Will be populated by ImageExtractor
                "content_type": None,  # Will be populated by ImageExtractor
                "_image_rel_id": image_rel_id  # Internal: for ExtractionService to find the image
            },
            "provenance": provenance
        }
    
    def _extract_math(
        self,
        para,
        sequence: int,
        original_position: int,
        source_document_id: str
    ) -> dict:
        """
        Extract math equation block (Phase 6 - T090)
        
        Creates math block with OMML XML content.
        LaTeX conversion happens in ExtractionService.
        
        Args:
            para: python-docx Paragraph object containing math equation
            sequence: Sequential position (1-indexed)
            original_position: Original position in document (0-indexed)
            source_document_id: UUID of source document
        
        Returns:
            Math block dictionary with OMML content
        """
        from lxml import etree
        
        # Extract OMML XML from paragraph
        omml_namespace = "http://schemas.openxmlformats.org/officeDocument/2006/math"
        omml_elements = para._element.findall(f'.//{{{omml_namespace}}}oMath')
        
        # Get the first OMML element as XML string
        omml_xml = ""
        if omml_elements:
            omml_xml = etree.tostring(omml_elements[0], encoding='unicode')
        
        # Create provenance metadata
        provenance = self._create_provenance(
            source_document_id=source_document_id,
            original_position=original_position
        )
        
        # Create math block with OMML
        # LaTeX conversion will be done by ExtractionService
        return {
            "id": f"block-{uuid4().hex[:12]}",
            "type": "math",
            "sequence": sequence,
            "content": {
                "latex": None,  # Will be populated by ExtractionService
                "omml": omml_xml,  # Always preserve original OMML
                "conversion_failed": None,  # Will be set by ExtractionService
                "conversion_error": None  # Will be set by ExtractionService
            },
            "provenance": provenance
        }
    
    def _create_provenance(
        self,
        source_document_id: str,
        original_position: int
    ) -> dict:
        """
        Create provenance metadata for a block
        
        Args:
            source_document_id: UUID of source artifact
            original_position: 0-indexed position in original document
        
        Returns:
            Provenance dictionary
        """
        from docx import __version__ as docx_version
        
        return {
            "source_document_id": source_document_id,
            "original_position": original_position,
            "extraction_timestamp": datetime.now(timezone.utc).isoformat(),
            "extraction_method": f"python-docx-{docx_version}"
        }
    
    def _extract_table(
        self,
        table,
        sequence: int,
        original_position: int,
        source_document_id: str
    ) -> dict:
        """
        Extract a table block with rows, cells, and formatting
        
        Args:
            table: python-docx Table object
            sequence: Sequential position (1-indexed)
            original_position: Original position in document (0-indexed)
            source_document_id: UUID of source document
        
        Returns:
            Table block dictionary
        """
        # Extract all rows
        rows_data = []
        for row_idx, row in enumerate(table.rows):
            row_data = self._extract_table_row(row, is_first_row=(row_idx == 0))
            rows_data.append(row_data)
        
        # Extract table style if available
        table_style = table.style.name if table.style else None
        
        # Create provenance metadata
        provenance = self._create_provenance(
            source_document_id=source_document_id,
            original_position=original_position
        )
        
        # Assemble table block
        return {
            "id": f"block-{uuid4().hex[:12]}",
            "type": "table",
            "sequence": sequence,
            "content": {
                "rows": rows_data,
                "style": table_style
            },
            "provenance": provenance
        }
    
    def _extract_table_row(self, row, is_first_row: bool = False) -> dict:
        """
        Extract a table row with cells
        
        Args:
            row: python-docx Row object
            is_first_row: Whether this is the first row (potential header)
        
        Returns:
            Row dictionary with cells and is_header flag
        """
        cells_data = []
        for cell in row.cells:
            cell_data = self._extract_table_cell(cell)
            cells_data.append(cell_data)
        
        return {
            "cells": cells_data,
            "is_header": is_first_row  # Simple heuristic: first row is header
        }
    
    def _extract_table_cell(self, cell) -> dict:
        """
        Extract table cell with content, spans, and formatting
        
        Args:
            cell: python-docx Cell object
        
        Returns:
            Cell dictionary with content, rowspan, colspan, background_color, borders
        """
        # Extract cell content (paragraphs within the cell)
        content = []
        for para in cell.paragraphs:
            # Skip empty paragraphs in cells
            if not para.text.strip():
                continue
            
            # Extract text runs (same as paragraph extraction)
            runs = []
            for run in para.runs:
                run_data = self._extract_text_run(run)
                runs.append(run_data)
            
            # If we have runs, add as text content
            if runs:
                # Extract paragraph formatting
                para_format = self._extract_paragraph_format(para)
                
                content.append({
                    "type": "text",
                    "data": {
                        "runs": runs,
                        **para_format
                    }
                })
        
        # Get cell properties
        cell_data = {
            "content": content,
            "rowspan": 1,
            "colspan": 1
        }
        
        # Extract grid span (colspan) from cell properties
        try:
            tc = cell._element
            tcPr = tc.tcPr
            if tcPr is not None:
                gridSpan = tcPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}gridSpan')
                if gridSpan is not None:
                    val = gridSpan.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val')
                    if val:
                        cell_data["colspan"] = int(val)
                
                # Check for vertical merge (rowspan)
                vMerge = tcPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}vMerge')
                if vMerge is not None:
                    # vMerge with val="restart" starts a merge
                    # vMerge without val or val="continue" continues a merge
                    # For now, we'll mark it but won't calculate the full rowspan
                    # (that requires tracking across multiple rows)
                    val = vMerge.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val')
                    if val == "restart":
                        # This cell starts a vertical merge
                        # TODO: Calculate actual rowspan by counting subsequent merged cells
                        pass
        except Exception:
            # If we can't extract spans, use defaults
            pass
        
        # Extract background color if available
        try:
            # Access cell shading via XML properties
            tc = cell._element
            tcPr = tc.tcPr
            if tcPr is not None:
                shd = tcPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}shd')
                if shd is not None and shd.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fill'):
                    fill_color = shd.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fill')
                    # Convert from RRGGBB to #RRGGBB (if not 'auto')
                    if fill_color and fill_color != 'auto' and len(fill_color) == 6:
                        cell_data["background_color"] = f"#{fill_color}"
        except Exception:
            # If we can't extract background color, skip it
            pass
        
        # Extract borders if available
        try:
            tc = cell._element
            tcPr = tc.tcPr
            if tcPr is not None:
                tcBorders = tcPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tcBorders')
                if tcBorders is not None:
                    borders = {}
                    
                    # Extract each border side
                    for side in ['top', 'left', 'bottom', 'right']:
                        border_elem = tcBorders.find(f'{{http://schemas.openxmlformats.org/wordprocessingml/2006/main}}{side}')
                        if border_elem is not None:
                            border_width = border_elem.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}sz')
                            border_color = border_elem.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}color')
                            border_style = border_elem.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val')
                            
                            if border_width and border_color and border_style:
                                borders[side] = {
                                    "width": float(border_width) / 8.0,  # Convert eighths of a point to points
                                    "color": f"#{border_color}" if border_color != "auto" and len(border_color) == 6 else "#000000",
                                    "style": border_style
                                }
                    
                    if borders:
                        cell_data["borders"] = borders
        except Exception:
            # If we can't extract borders, skip them
            pass
        
        return cell_data
    
    @timeout_decorator()
    def extract(self, file_path: str | Path) -> dict:
        """
        Extract complete document to DIJ format (STUB - will be implemented in Phase 3-6)
        
        This method will be implemented progressively:
        - Phase 3: Paragraph extraction
        - Phase 4: Table extraction
        - Phase 5: Image extraction
        - Phase 6: Math equation extraction
        - Phase 7: Full integration
        
        Args:
            file_path: Path to DOCX file
        
        Returns:
            Complete DIJ v1.0 structure as dictionary
        
        Raises:
            TimeoutError: If extraction exceeds 5 minute timeout
            ExtractionError: If extraction fails
        """
        # Validate first
        self.validate_docx(file_path)
        
        # Open document
        document = self.open_document(file_path)
        
        # TODO: Implement in Phases 3-6
        # - Extract paragraphs (Phase 3)
        # - Extract tables (Phase 4)
        # - Extract images (Phase 5)
        # - Extract math equations (Phase 6)
        # - Assemble DIJ structure (Phase 7)
        
        raise NotImplementedError(
            "Full extraction not yet implemented. "
            "Will be completed in Phases 3-7. "
            "See specs/006-docx-extraction/tasks.md for implementation plan."
        )
