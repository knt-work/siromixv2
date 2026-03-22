"""
Document Intermediate JSON (DIJ) Schema v1.0

Pydantic models for the canonical representation of extracted DOCX content.
All models follow the DIJ v1.0 specification defined in:
specs/006-docx-extraction/data-model.md
"""

from datetime import datetime
from enum import Enum
from typing import Literal, Any
from pydantic import BaseModel, Field, ConfigDict


class BlockType(str, Enum):
    """Type of content block in DIJ"""
    PARAGRAPH = "paragraph"
    TABLE = "table"
    IMAGE = "image"
    MATH = "math"


class Provenance(BaseModel):
    """Source tracking metadata for each block"""
    source_document_id: str = Field(..., description="UUID of source artifact (DOCX file)")
    original_position: int = Field(..., description="Zero-based index in source document")
    extraction_timestamp: datetime = Field(..., description="When this block was extracted")
    extraction_method: str = Field(..., description="Extraction tool/version (e.g., 'python-docx-1.1.0')")


class Block(BaseModel):
    """Base block model - all blocks share these common fields"""
    id: str = Field(..., description="Unique block UUID")
    type: BlockType = Field(..., description="Block type (paragraph, table, image, math)")
    sequence: int = Field(..., ge=1, description="Sequential position (1-indexed)")
    content: dict[str, Any] = Field(..., description="Type-specific content")
    provenance: Provenance = Field(..., description="Source tracking metadata")


class ExtractionMetadata(BaseModel):
    """Metadata about the extraction process"""
    extraction_timestamp: datetime = Field(..., description="When extraction completed (ISO 8601)")
    source_filename: str = Field(..., description="Original DOCX filename")
    source_file_size: int = Field(..., ge=0, description="File size in bytes")
    total_blocks: int = Field(..., ge=0, description="Total blocks extracted")
    block_type_counts: dict[str, int] = Field(..., description="Count of each block type")
    extraction_duration_ms: int = Field(..., ge=0, description="Extraction duration in milliseconds")
    warnings: list[str] = Field(default_factory=list, description="Non-fatal warnings during extraction")


class DIJv1(BaseModel):
    """Document Intermediate JSON version 1.0 - Root schema"""
    version: Literal["1.0"] = "1.0"
    document_id: str = Field(..., description="UUID linking to source exam/artifact")
    blocks: list[Block] = Field(..., description="Sequential blocks (paragraphs, tables, images, math)")
    metadata: ExtractionMetadata = Field(..., description="Extraction metadata")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "version": "1.0",
                "document_id": "550e8400-e29b-41d4-a716-446655440000",
                "blocks": [
                    {
                        "id": "block-001",
                        "type": "paragraph",
                        "sequence": 1,
                        "content": {
                            "runs": [{"text": "Sample paragraph", "bold": False}],
                            "alignment": "left"
                        },
                        "provenance": {
                            "source_document_id": "550e8400-e29b-41d4-a716-446655440000",
                            "original_position": 0,
                            "extraction_timestamp": "2026-03-22T14:30:00Z",
                            "extraction_method": "python-docx-1.1.0"
                        }
                    }
                ],
                "metadata": {
                    "extraction_timestamp": "2026-03-22T14:30:00Z",
                    "source_filename": "exam.docx",
                    "source_file_size": 1048576,
                    "total_blocks": 1,
                    "block_type_counts": {"paragraph": 1},
                    "extraction_duration_ms": 5000,
                    "warnings": []
                }
            }
        }
    )


# Paragraph-specific models (will be used in Phase 3 - US1)
class TextRun(BaseModel):
    """Formatted text run within a paragraph"""
    text: str
    bold: bool = False
    italic: bool = False
    underline: bool = False
    font_name: str | None = None
    font_size: float | None = Field(None, description="Font size in points")
    color: str | None = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$', description="Hex RGB color")


class ParagraphContent(BaseModel):
    """Content structure for paragraph blocks"""
    runs: list[TextRun] = Field(..., min_length=1, description="Formatted text runs")
    alignment: str | None = Field(None, description="left, center, right, justify")
    indent_left: float | None = Field(None, description="Left indent in points")
    indent_right: float | None = Field(None, description="Right indent in points")
    space_before: float | None = Field(None, description="Spacing before paragraph (points)")
    space_after: float | None = Field(None, description="Spacing after paragraph (points)")
    line_spacing: float | None = Field(None, description="Line spacing multiplier")
    style: str | None = Field(None, description="Named style (e.g., 'Heading 1')")


# Table-specific models (will be used in Phase 4 - US2)
class CellContent(BaseModel):
    """Content within a table cell"""
    type: Literal["text", "image", "math"]
    data: dict[str, Any]


class BorderStyle(BaseModel):
    """Border style for table cells"""
    width: float = Field(..., description="Border width in points")
    color: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$', description="Hex RGB color")
    style: str = Field(..., description="Border style (single, double, dashed, etc.)")


class CellBorders(BaseModel):
    """Border configuration for table cell"""
    top: BorderStyle | None = None
    right: BorderStyle | None = None
    bottom: BorderStyle | None = None
    left: BorderStyle | None = None


class TableCell(BaseModel):
    """Table cell with content and formatting"""
    content: list[CellContent]
    rowspan: int = Field(default=1, ge=1)
    colspan: int = Field(default=1, ge=1)
    background_color: str | None = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    borders: CellBorders | None = None


class TableRow(BaseModel):
    """Table row with cells"""
    cells: list[TableCell]
    is_header: bool = False


class TableContent(BaseModel):
    """Content structure for table blocks"""
    rows: list[TableRow] = Field(..., min_length=1)
    style: str | None = Field(None, description="Named table style")


# Image-specific models (will be used in Phase 5 - US3)
class ImageContent(BaseModel):
    """Content structure for image blocks"""
    artifact_id: str = Field(..., description="UUID of image artifact in storage")
    width: float | None = Field(None, description="Original width in pixels")
    height: float | None = Field(None, description="Original height in pixels")
    alt_text: str | None = Field(None, description="Alternative text from DOCX")
    title: str | None = Field(None, description="Image title from DOCX")
    content_type: str = Field(..., pattern=r'^image/', description="MIME type (e.g., 'image/png')")


# Math-specific models (will be used in Phase 6 - US4)
class MathContent(BaseModel):
    """Content structure for math blocks"""
    latex: str | None = Field(None, description="LaTeX representation (if conversion succeeded)")
    omml: str = Field(..., description="Original OMML XML (always preserved)")
    conversion_failed: bool = Field(..., description="True if LaTeX conversion failed")
    conversion_error: str | None = Field(None, description="Error message if conversion failed")
