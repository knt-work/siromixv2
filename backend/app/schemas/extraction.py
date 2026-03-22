"""
Extraction Request/Response Schemas (Phase 7 - T096)

Schemas for pipeline stage communication:
- ExtractionRequest: Input to extract_docx stage
- ExtractionResponse: Output from extract_docx stage
- Validation and error handling structures
"""

from pydantic import BaseModel, Field
from typing import Any
from uuid import UUID


class ExtractionRequest(BaseModel):
    """
    Request schema for DOCX extraction pipeline stage
    
    Fields:
        task_id: UUID of the Task being processed
        docx_artifact_id: UUID of the DOCX artifact to extract
        exam_id: UUID of the parent Exam
        simulate_failure: For testing - force extraction failure
    """
    task_id: UUID = Field(..., description="Task UUID being processed")
    docx_artifact_id: UUID = Field(..., description="DOCX artifact UUID to extract")
    exam_id: UUID = Field(..., description="Parent exam UUID")
    simulate_failure: bool = Field(default=False, description="Test flag - simulate failure")


class ExtractionResponse(BaseModel):
    """
    Response schema from DOCX extraction pipeline stage
    
    Fields:
        task_id: UUID of the processed Task
        dij_artifact_id: UUID of the created DIJ artifact (None if failed)
        blocks_extracted: Number of blocks extracted (paragraphs, tables, images, math)
        duration_ms: Extraction duration in milliseconds
        status: 'completed' or 'failed'
        error: Error message if status='failed' (None otherwise)
        warnings: List of non-fatal warnings during extraction
        metadata: Additional extraction metadata
    """
    task_id: UUID = Field(..., description="Task UUID processed")
    dij_artifact_id: UUID | None = Field(None, description="DIJ artifact UUID created (None if failed)")
    blocks_extracted: int = Field(..., description="Number of blocks extracted")
    duration_ms: int = Field(..., description="Extraction duration in milliseconds")
    status: str = Field(..., description="'completed' or 'failed'")
    error: str | None = Field(None, description="Error message if failed")
    warnings: list[str] = Field(default_factory=list, description="Non-fatal warnings")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    
    class Config:
        json_schema_extra = {
            "example": {
                "task_id": "550e8400-e29b-41d4-a716-446655440000",
                "dij_artifact_id": "660e8400-e29b-41d4-a716-446655440001",
                "blocks_extracted": 42,
                "duration_ms": 1245,
                "status": "completed",
                "error": None,
                "warnings": ["Math conversion failed for block-abc123"],
                "metadata": {
                    "source_filename": "exam.docx",
                    "file_size_bytes": 524288,
                    "extraction_timestamp": "2026-03-22T10:30:00Z"
                }
            }
        }
