# Data Model: Document Intermediate JSON (DIJ) v1.0

**Feature**: 006-docx-extraction  
**Schema Version**: 1.0  
**Purpose**: Define canonical structure for extracted DOCX content

---

## Overview

Document Intermediate JSON (DIJ) is the **canonical representation** of exam content extracted from DOCX files. It serves as the structured input to all downstream AI analysis stages. DIJ uses a **block-based model** where each block represents a semantic unit (paragraph, table, image, math equation) with full source provenance.

**Key Principles**:
- Versioned schema for future compatibility
- Block-level granularity with sequential ordering
- Comprehensive formatting metadata (fonts, colors, sizes)
- External references for non-text content (images)
- Source provenance for every block
- Validation-gated before persistence

---

## Root Schema

```python
class DIJv1(BaseModel):
    """Document Intermediate JSON version 1.0"""
    
    version: Literal["1.0"] = "1.0"
    document_id: str          # UUID linking to source exam/artifact
    blocks: list[Block]       # Sequential blocks (paragraphs, tables, images, math)
    metadata: ExtractionMetadata
```

### Example (minimal)

```json
{
  "version": "1.0",
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "blocks": [
    {
      "id": "block-001",
      "type": "paragraph",
      "sequence": 1,
      "content": { ... },
      "provenance": { ... }
    }
  ],
  "metadata": {
    "extraction_timestamp": "2026-03-22T14:30:00Z",
    "source_filename": "midterm_exam.docx",
    "total_blocks": 1
  }
}
```

---

## Block Model (Base)

All blocks share common fields:

```python
class Block(BaseModel):
    id: str                   # Unique block UUID
    type: BlockType           # "paragraph" | "table" | "image" | "math"
    sequence: int             # Sequential position (1-indexed)
    content: dict             # Type-specific content (see below)
    provenance: Provenance    # Source tracking
```

### BlockType Enum

```python
class BlockType(str, Enum):
    PARAGRAPH = "paragraph"
    TABLE = "table"
    IMAGE = "image"
    MATH = "math"
```

### Provenance

```python
class Provenance(BaseModel):
    source_document_id: str         # UUID of source artifact (DOCX file)
    original_position: int          # Zero-based index in source document
    extraction_timestamp: datetime  # When this block was extracted
    extraction_method: str          # e.g., "python-docx-1.1.0"
```

---

## Paragraph Block

Text paragraph with comprehensive formatting metadata.

### Schema

```python
class ParagraphContent(BaseModel):
    runs: list[TextRun]        # Formatted text runs
    alignment: str | None      # "left" | "center" | "right" | "justify"
    indent_left: float | None  # Left indent in points
    indent_right: float | None # Right indent in points
    space_before: float | None # Spacing before paragraph (points)
    space_after: float | None  # Spacing after paragraph (points)
    line_spacing: float | None # Line spacing multiplier
    style: str | None          # Named style (e.g., "Heading 1")

class TextRun(BaseModel):
    text: str
    bold: bool = False
    italic: bool = False
    underline: bool = False
    font_name: str | None = None
    font_size: float | None = None  # In points
    color: str | None = None        # Hex RGB (e.g., "#FF5733")
```

### Example

```json
{
  "id": "block-001",
  "type": "paragraph",
  "sequence": 1,
  "content": {
    "runs": [
      {
        "text": "Question 1: ",
        "bold": true,
        "font_name": "Calibri",
        "font_size": 11.0,
        "color": "#000000"
      },
      {
        "text": "Solve for x",
        "bold": false,
        "italic": true,
        "font_name": "Calibri",
        "font_size": 11.0
      }
    ],
    "alignment": "left",
    "style": "Normal"
  },
  "provenance": {
    "source_document_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_position": 0,
    "extraction_timestamp": "2026-03-22T14:30:00Z",
    "extraction_method": "python-docx-1.1.0"
  }
}
```

---

## Table Block

Table structure with cells, spans, and nested content.

### Schema

```python
class TableContent(BaseModel):
    rows: list[TableRow]
    style: str | None = None  # Named table style

class TableRow(BaseModel):
    cells: list[TableCell]
    is_header: bool = False   # Header row flag

class TableCell(BaseModel):
    content: list[CellContent]  # Can contain paragraphs, images, math
    rowspan: int = 1
    colspan: int = 1
    background_color: str | None = None  # Hex RGB
    borders: CellBorders | None = None

class CellContent(BaseModel):
    type: Literal["text", "image", "math"]
    data: dict  # Type-specific data (similar to paragraph runs or artifact refs)

class CellBorders(BaseModel):
    top: BorderStyle | None = None
    right: BorderStyle | None = None
    bottom: BorderStyle | None = None
    left: BorderStyle | None = None

class BorderStyle(BaseModel):
    width: float  # In points
    color: str    # Hex RGB
    style: str    # "single" | "double" | "dashed" | etc.
```

### Example

```json
{
  "id": "block-005",
  "type": "table",
  "sequence": 5,
  "content": {
    "rows": [
      {
        "cells": [
          {
            "content": [
              {
                "type": "text",
                "data": {
                  "runs": [
                    {"text": "Name", "bold": true}
                  ]
                }
              }
            ],
            "rowspan": 1,
            "colspan": 1
          },
          {
            "content": [
              {
                "type": "text",
                "data": {
                  "runs": [
                    {"text": "Score", "bold": true}
                  ]
                }
              }
            ]
          }
        ],
        "is_header": true
      },
      {
        "cells": [
          {
            "content": [
              {
                "type": "text",
                "data": {
                  "runs": [
                    {"text": "Alice"}
                  ]
                }
              }
            ]
          },
          {
            "content": [
              {
                "type": "text",
                "data": {
                  "runs": [
                    {"text": "95"}
                  ]
                }
              }
            ]
          }
        ]
      }
    ],
    "style": "Grid Table 4 - Accent 1"
  },
  "provenance": {
    "source_document_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_position": 4,
    "extraction_timestamp": "2026-03-22T14:30:00Z",
    "extraction_method": "python-docx-1.1.0"
  }
}
```

---

## Image Block

Image reference with artifact metadata.

### Schema

```python
class ImageContent(BaseModel):
    artifact_id: str          # UUID of image artifact in storage
    width: float | None       # Original width in pixels
    height: float | None      # Original height in pixels
    alt_text: str | None      # Alternative text from DOCX
    title: str | None         # Image title from DOCX
    content_type: str         # MIME type (e.g., "image/png")
```

### Example

```json
{
  "id": "block-010",
  "type": "image",
  "sequence": 10,
  "content": {
    "artifact_id": "660e9500-f39c-52e5-b827-557766551111",
    "width": 640.0,
    "height": 480.0,
    "alt_text": "Diagram showing cell division",
    "content_type": "image/png"
  },
  "provenance": {
    "source_document_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_position": 9,
    "extraction_timestamp": "2026-03-22T14:30:00Z",
    "extraction_method": "python-docx-1.1.0"
  }
}
```

**Note**: Image binary data is stored in MinIO/S3 via `artifact_id`. DIJ contains only a reference (Constitution Principle IV: Block + Reference).

---

## Math Block

Mathematical equation with LaTeX and OMML representations.

### Schema

```python
class MathContent(BaseModel):
    latex: str | None         # LaTeX representation (if conversion succeeded)
    omml: str                 # Original OMML XML (always preserved)
    conversion_failed: bool   # True if LaTeX conversion failed
    conversion_error: str | None  # Error message if conversion failed
```

### Example (successful conversion)

```json
{
  "id": "block-015",
  "type": "math",
  "sequence": 15,
  "content": {
    "latex": "\\frac{d}{dx}(x^2) = 2x",
    "omml": "<m:oMathPara>...</m:oMathPara>",
    "conversion_failed": false
  },
  "provenance": {
    "source_document_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_position": 14,
    "extraction_timestamp": "2026-03-22T14:30:00Z",
    "extraction_method": "python-docx-1.1.0"
  }
}
```

### Example (failed conversion)

```json
{
  "id": "block-016",
  "type": "math",
  "sequence": 16,
  "content": {
    "latex": null,
    "omml": "<m:oMathPara><m:oMath><m:sSup>...</m:sSup></m:oMath></m:oMathPara>",
    "conversion_failed": true,
    "conversion_error": "Unsupported OMML element: m:sSup with nested m:func"
  },
  "provenance": {
    "source_document_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_position": 15,
    "extraction_timestamp": "2026-03-22T14:30:00Z",
    "extraction_method": "python-docx-1.1.0"
  }
}
```

**Note**: OMML is always preserved for future retry. Target: 90% successful LaTeX conversion (SC-006).

---

## Extraction Metadata

```python
class ExtractionMetadata(BaseModel):
    extraction_timestamp: datetime
    source_filename: str
    source_file_size: int        # In bytes
    total_blocks: int
    block_type_counts: dict[str, int]  # e.g., {"paragraph": 50, "table": 5, "image": 3}
    extraction_duration_ms: int
    warnings: list[str]          # Non-fatal warnings (e.g., "Skipped decorative image")
```

### Example

```json
{
  "extraction_timestamp": "2026-03-22T14:30:00Z",
  "source_filename": "midterm_exam.docx",
  "source_file_size": 2048576,
  "total_blocks": 120,
  "block_type_counts": {
    "paragraph": 95,
    "table": 12,
    "image": 8,
    "math": 5
  },
  "extraction_duration_ms": 15234,
  "warnings": [
    "Skipped empty paragraph at position 42",
    "OMML conversion failed for equation at position 87"
  ]
}
```

---

## Validation Rules

1. **Version**: Must be `"1.0"` (exact string match)
2. **Block IDs**: Must be unique within document
3. **Block Sequences**: Must be 1-indexed, sequential, no gaps
4. **Artifact References**: Image `artifact_id` must exist in artifact storage
5. **Math Blocks**: OMML field is required; LaTeX is optional
6. **Provenance**: All blocks must have complete provenance (source_document_id, original_position, timestamp)
7. **Empty Content**: Blocks with empty content should be filtered (per clarification decision)

**Validation**: Performed via Pydantic model validation before persisting DIJ artifact.

---

## Storage

**Format**: JSON (UTF-8 encoded)  
**Location**: MinIO/S3 via `artifact_service.py`  
**Artifact Type**: `"dij"`  
**Idempotency Key**: `{task_id}_dij_v1`  
**Metadata**:
```json
{
  "artifact_type": "dij",
  "schema_version": "1.0",
  "source_task_id": "task-uuid",
  "source_exam_id": "exam-uuid"
}
```

**Database Record** (via Artifact model):
- `artifact_id`: UUID
- `content_type`: `"application/json"`
- `storage_path`: S3 key (e.g., `"dij/task-uuid/dij_v1.json"`)
- `size_bytes`: JSON file size
- `metadata`: JSONB with schema_version, source references

---

## Future Versioning

When DIJ schema changes (e.g., adding new block types or fields):

1. Increment version: `"1.0"` → `"2.0"`
2. Create new Pydantic model: `DIJv2(BaseModel)`
3. Implement converter: `convert_dij_v1_to_v2(dij_v1: DIJv1) -> DIJv2`
4. Downstream stages check version field and convert if needed
5. Old DIJ v1.0 documents remain valid (immutable)

**Backward Compatibility**: Version field enables graceful migration without breaking existing pipelines.

---

## Complete Example

```json
{
  "version": "1.0",
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "blocks": [
    {
      "id": "block-001",
      "type": "paragraph",
      "sequence": 1,
      "content": {
        "runs": [
          {
            "text": "Biology Midterm Exam",
            "bold": true,
            "font_name": "Calibri",
            "font_size": 14.0
          }
        ],
        "alignment": "center",
        "style": "Title"
      },
      "provenance": {
        "source_document_id": "550e8400-e29b-41d4-a716-446655440000",
        "original_position": 0,
        "extraction_timestamp": "2026-03-22T14:30:00Z",
        "extraction_method": "python-docx-1.1.0"
      }
    },
    {
      "id": "block-002",
      "type": "paragraph",
      "sequence": 2,
      "content": {
        "runs": [
          {
            "text": "Question 1: Describe the process of mitosis.",
            "bold": false,
            "font_name": "Calibri",
            "font_size": 11.0
          }
        ],
        "alignment": "left",
        "style": "Normal"
      },
      "provenance": {
        "source_document_id": "550e8400-e29b-41d4-a716-446655440000",
        "original_position": 1,
        "extraction_timestamp": "2026-03-22T14:30:00Z",
        "extraction_method": "python-docx-1.1.0"
      }
    },
    {
      "id": "block-003",
      "type": "image",
      "sequence": 3,
      "content": {
        "artifact_id": "660e9500-f39c-52e5-b827-557766551111",
        "width": 640.0,
        "height": 480.0,
        "alt_text": "Cell division diagram",
        "content_type": "image/png"
      },
      "provenance": {
        "source_document_id": "550e8400-e29b-41d4-a716-446655440000",
        "original_position": 2,
        "extraction_timestamp": "2026-03-22T14:30:00Z",
        "extraction_method": "python-docx-1.1.0"
      }
    }
  ],
  "metadata": {
    "extraction_timestamp": "2026-03-22T14:30:00Z",
    "source_filename": "biology_midterm.docx",
    "source_file_size": 1048576,
    "total_blocks": 3,
    "block_type_counts": {
      "paragraph": 2,
      "image": 1
    },
    "extraction_duration_ms": 8500,
    "warnings": []
  }
}
```

---

## Implementation Notes

- **Pydantic Models**: All schemas defined as Pydantic v2 models for type safety and validation
- **JSON Serialization**: Use `model.model_dump_json()` for consistent formatting
- **Validation**: Validate before persisting: `DIJv1.model_validate(data)`
- **Testing**: Include sample DIJ fixtures for each block type in unit tests
- **Performance**: DIJ for typical 50-page exam ~500KB JSON (well within limits)

---

## References

- Constitution Principle III: Schema-First, Validation-Gated
- Constitution Principle IV: Non-Text Content is Block + Reference
- Constitution Principle V: Traceability & Provenance by Design
- Constitution Principle VIII: Separation of Content vs Rendering
- Spec: [specs/006-docx-extraction/spec.md](./spec.md)
- Research: [specs/006-docx-extraction/research.md](./research.md)
