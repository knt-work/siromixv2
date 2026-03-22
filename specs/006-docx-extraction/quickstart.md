# Developer Quickstart: DOCX Extraction Pipeline

**Feature**: 006-docx-extraction  
**Branch**: `006-docx-extraction`  
**Purpose**: Get developers productive with DOCX extraction implementation

---

## Overview

This feature implements the `extract_docx` pipeline stage, converting DOCX files into Document Intermediate JSON (DIJ) - the canonical format for downstream AI analysis. The implementation follows a **test-driven development (TDD)** approach per Constitution Principle IX.

**What you'll build**:
- DOCX parser extracting paragraphs, tables, images, math equations
- DIJ schema v1.0 with comprehensive formatting metadata
- Integration with existing Celery pipeline and artifact storage
- Structured error handling with diagnostic messages
- Comprehensive unit and integration tests

---

## Prerequisites

- **Python 3.11+** installed
- **PostgreSQL** running (local or Docker)
- **Redis** running (for Celery)
- **MinIO** or AWS S3 configured (for artifact storage)
- **Git** repository cloned: `siromixv2`
- **Backend dependencies** installed: `cd backend && pip install -e .`

---

## Quick Setup

### 1. Install New Dependencies

Add to `backend/pyproject.toml`:

```toml
[project]
dependencies = [
    # ... existing dependencies ...
    "python-docx>=1.1.0",
    "lxml>=5.0.0",  # For OMML/XSLT processing
]
```

Install:

```bash
cd backend
pip install python-docx lxml
```

### 2. Verify Environment

```bash
# Check Python version
python --version  # Should be 3.11+

# Test database connection
python -c "from app.core.database import get_db; print('DB OK')"

# Test Redis connection
redis-cli ping  # Should return "PONG"

# Test MinIO/S3 access
python -c "from app.core.storage import storage_client; print('Storage OK')"
```

### 3. Checkout Feature Branch

```bash
git checkout 006-docx-extraction
```

---

## Project Structure (What You'll Create)

```text
backend/app/
├── core/
│   ├── docx_parser.py         # NEW: DOCX parsing logic
│   ├── math_converter.py      # NEW: OMML → LaTeX conversion
│   └── image_extractor.py     # NEW: Image extraction
├── schemas/
│   ├── dij.py                 # NEW: DIJ Pydantic models
│   └── extraction.py          # NEW: Extraction request/response
├── services/
│   └── extraction_service.py  # NEW: Orchestration service
└── tasks/
    └── pipeline_stages.py     # UPDATE: Replace mock extract_docx

backend/tests/
├── unit/
│   ├── test_docx_parser.py
│   ├── test_math_converter.py
│   ├── test_image_extractor.py
│   └── test_extraction_service.py
├── integration/
│   └── test_extract_docx_stage.py
└── fixtures/
    └── sample_exams/
        ├── simple_text.docx
        ├── with_tables.docx
        ├── with_images.docx
        └── with_math.docx
```

---

## Development Workflow (TDD Approach)

### Phase 1: P1 - Text Paragraphs

**Goal**: Extract plain text paragraphs with comprehensive formatting

#### Step 1: Create DIJ Schema Models

**File**: `backend/app/schemas/dij.py`

```python
from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime

class TextRun(BaseModel):
    text: str
    bold: bool = False
    italic: bool = False
    underline: bool = False
    font_name: str | None = None
    font_size: float | None = None  # In points
    color: str | None = None  # Hex RGB

class ParagraphContent(BaseModel):
    runs: list[TextRun]
    alignment: str | None = None
    indent_left: float | None = None
    indent_right: float | None = None
    space_before: float | None = None
    space_after: float | None = None
    line_spacing: float | None = None
    style: str | None = None

class Provenance(BaseModel):
    source_document_id: str
    original_position: int
    extraction_timestamp: datetime
    extraction_method: str

class Block(BaseModel):
    id: str
    type: Literal["paragraph", "table", "image", "math"]
    sequence: int
    content: dict
    provenance: Provenance

class ExtractionMetadata(BaseModel):
    extraction_timestamp: datetime
    source_filename: str
    source_file_size: int
    total_blocks: int
    block_type_counts: dict[str, int]
    extraction_duration_ms: int
    warnings: list[str]

class DIJv1(BaseModel):
    version: Literal["1.0"] = "1.0"
    document_id: str
    blocks: list[Block]
    metadata: ExtractionMetadata
```

#### Step 2: Write Test First

**File**: `backend/tests/unit/test_docx_parser.py`

```python
import pytest
from pathlib import Path
from app.core.docx_parser import DocxParser

def test_extract_simple_paragraph():
    """Test extracting a single paragraph with plain text"""
    parser = DocxParser()
    docx_path = Path(__file__).parent.parent / "fixtures/sample_exams/simple_text.docx"
    
    blocks = parser.extract_blocks(docx_path)
    
    assert len(blocks) == 1
    assert blocks[0]["type"] == "paragraph"
    assert blocks[0]["content"]["runs"][0]["text"] == "This is a simple paragraph."
    assert blocks[0]["sequence"] == 1

def test_extract_paragraph_with_formatting():
    """Test extracting paragraph with bold/italic runs"""
    parser = DocxParser()
    docx_path = Path(__file__).parent.parent / "fixtures/sample_exams/formatted_text.docx"
    
    blocks = parser.extract_blocks(docx_path)
    
    # First run is bold
    assert blocks[0]["content"]["runs"][0]["bold"] is True
    # Second run is italic
    assert blocks[0]["content"]["runs"][1]["italic"] is True
```

#### Step 3: Implement DocxParser

**File**: `backend/app/core/docx_parser.py`

```python
from pathlib import Path
from docx import Document
from docx.shared import Pt, RGBColor
import uuid

class DocxParser:
    """Extract structured blocks from DOCX files"""
    
    def __init__(self):
        self.extraction_method = "python-docx-1.1.0"
    
    def extract_blocks(self, docx_path: Path) -> list[dict]:
        """Extract all blocks from DOCX file"""
        doc = Document(docx_path)
        blocks = []
        sequence = 1
        
        for paragraph_index, paragraph in enumerate(doc.paragraphs):
            # Skip empty paragraphs (per clarification decision)
            if not paragraph.text.strip():
                continue
            
            block = self._extract_paragraph(paragraph, paragraph_index, sequence)
            blocks.append(block)
            sequence += 1
        
        return blocks
    
    def _extract_paragraph(self, paragraph, original_position: int, sequence: int) -> dict:
        """Extract paragraph block with formatting"""
        runs = []
        for run in paragraph.runs:
            run_data = {
                "text": run.text,
                "bold": run.bold or False,
                "italic": run.italic or False,
                "underline": run.underline or False,
            }
            
            # Font name
            if run.font.name:
                run_data["font_name"] = run.font.name
            
            # Font size (convert to points)
            if run.font.size:
                run_data["font_size"] = float(run.font.size.pt)
            
            # Color (convert to hex RGB)
            if run.font.color and run.font.color.rgb:
                rgb = run.font.color.rgb
                run_data["color"] = f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"
            
            runs.append(run_data)
        
        content = {
            "runs": runs,
            "alignment": paragraph.alignment.name if paragraph.alignment else None,
            "style": paragraph.style.name if paragraph.style else None,
        }
        
        # Indentation and spacing
        if paragraph.paragraph_format.left_indent:
            content["indent_left"] = float(paragraph.paragraph_format.left_indent.pt)
        if paragraph.paragraph_format.right_indent:
            content["indent_right"] = float(paragraph.paragraph_format.right_indent.pt)
        if paragraph.paragraph_format.space_before:
            content["space_before"] = float(paragraph.paragraph_format.space_before.pt)
        if paragraph.paragraph_format.space_after:
            content["space_after"] = float(paragraph.paragraph_format.space_after.pt)
        if paragraph.paragraph_format.line_spacing:
            content["line_spacing"] = paragraph.paragraph_format.line_spacing
        
        return {
            "id": str(uuid.uuid4()),
            "type": "paragraph",
            "sequence": sequence,
            "content": content,
            "provenance": {
                "original_position": original_position,
                "extraction_method": self.extraction_method,
            }
        }
```

#### Step 4: Run Tests

```bash
cd backend
pytest tests/unit/test_docx_parser.py -v
```

#### Step 5: Create Test Fixtures

Create sample DOCX files in `backend/tests/fixtures/sample_exams/`:

**simple_text.docx**: Single paragraph with plain text  
**formatted_text.docx**: Paragraph with bold, italic, colors  
**with_tables.docx**: Document with tables  
**with_images.docx**: Document with embedded images  
**with_math.docx**: Document with math equations

Use Microsoft Word or LibreOffice to create these files manually.

---

### Phase 2: P2 - Tables

Follow same TDD cycle:
1. Write test in `test_docx_parser.py`
2. Implement `_extract_table()` method in `DocxParser`
3. Run tests
4. Refactor

**Key Challenges**: Cell spans, nested content, borders

---

### Phase 3: P3 - Images

**New File**: `backend/app/core/image_extractor.py`

1. Write tests for image extraction
2. Implement extraction + artifact upload
3. Test with fixture DOCX containing images

**Integration**: Use existing `artifact_service.py` for S3 upload

---

### Phase 4: P4 - Math Conversion

**New File**: `backend/app/core/math_converter.py`

1. Write tests with OMML samples
2. Implement XSLT-based conversion
3. Test fallback behavior (preserve OMML on failure)

**Target**: 90% conversion success rate (SC-006)

---

### Phase 5: Service Orchestration

**File**: `backend/app/services/extraction_service.py`

Tie everything together:

```python
from app.core.docx_parser import DocxParser
from app.core.image_extractor import ImageExtractor
from app.core.math_converter import MathConverter
from app.schemas.dij import DIJv1, ExtractionMetadata
from datetime import datetime
import time

class ExtractionService:
    """Orchestrate DOCX extraction and DIJ creation"""
    
    def __init__(self):
        self.parser = DocxParser()
        self.image_extractor = ImageExtractor()
        self.math_converter = MathConverter()
    
    async def extract_dij(self, docx_path: Path, document_id: str, task_id: str) -> DIJv1:
        """Extract complete DIJ from DOCX file"""
        start_time = time.time()
        
        # Parse all blocks
        blocks = self.parser.extract_blocks(docx_path)
        
        # Extract images (upload to S3)
        for block in blocks:
            if block["type"] == "image":
                artifact_id = await self.image_extractor.extract_and_upload(
                    docx_path, block["content"], task_id
                )
                block["content"]["artifact_id"] = artifact_id
        
        # Convert math equations
        for block in blocks:
            if block["type"] == "math":
                latex = self.math_converter.convert_omml_to_latex(block["content"]["omml"])
                block["content"]["latex"] = latex
        
        # Build metadata
        duration_ms = int((time.time() - start_time) * 1000)
        metadata = ExtractionMetadata(
            extraction_timestamp=datetime.utcnow(),
            source_filename=docx_path.name,
            source_file_size=docx_path.stat().st_size,
            total_blocks=len(blocks),
            block_type_counts=self._count_block_types(blocks),
            extraction_duration_ms=duration_ms,
            warnings=[]
        )
        
        # Assemble DIJ
        dij = DIJv1(
            document_id=document_id,
            blocks=blocks,
            metadata=metadata
        )
        
        return dij
    
    def _count_block_types(self, blocks: list[dict]) -> dict[str, int]:
        counts = {}
        for block in blocks:
            block_type = block["type"]
            counts[block_type] = counts.get(block_type, 0) + 1
        return counts
```

---

### Phase 6: Pipeline Integration

**File**: `backend/app/tasks/pipeline_stages.py`

Replace mock implementation:

```python
from app.services.extraction_service import ExtractionService
from app.services.artifact_service import ArtifactService
from app.core.database import get_db
from app.models.task import Task
import logging

async def extract_docx(task_id: str, simulate_failure: bool = False) -> dict:
    """Extract DOCX file and produce DIJ artifact"""
    logger = logging.getLogger(__name__)
    start_time = time.time()
    
    try:
        # Load task
        async with get_db() as db:
            task = await db.get(Task, task_id)
            if not task:
                raise ValueError(f"Task {task_id} not found")
            
            # Get DOCX artifact path
            docx_path = await artifact_service.get_artifact_path(task.metadata["docx_artifact_id"])
            
            # Extract DIJ
            extraction_service = ExtractionService()
            dij = await extraction_service.extract_dij(
                docx_path,
                document_id=task.exam_id,
                task_id=task_id
            )
            
            # Persist DIJ as artifact
            artifact_id = await artifact_service.create_artifact(
                content=dij.model_dump_json(),
                content_type="application/json",
                artifact_type="dij",
                metadata={
                    "schema_version": "1.0",
                    "source_task_id": task_id,
                    "source_exam_id": task.exam_id
                }
            )
            
            # Update task
            task.metadata["dij_artifact_id"] = str(artifact_id)
            await db.commit()
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            return {
                "blocks_extracted": dij.metadata.total_blocks,
                "duration_ms": duration_ms,
                "stage": "extract_docx",
                "status": "completed",
                "artifact_id": str(artifact_id)
            }
    
    except Exception as e:
        logger.exception(f"DOCX extraction failed for task {task_id}")
        raise ExtractionError(
            error_code="EXTRACTION_FAILED",
            user_message="Failed to extract content from document",
            technical_details={
                "task_id": task_id,
                "error": str(e)
            },
            original_exception=e
        )
```

---

## Testing

### Unit Tests

```bash
# Run all unit tests
pytest tests/unit/ -v

# Run specific test file
pytest tests/unit/test_docx_parser.py -v

# Run with coverage
pytest tests/unit/ --cov=app.core --cov-report=html
```

### Integration Tests

```bash
# Run integration test (requires DB, Redis, MinIO)
pytest tests/integration/test_extract_docx_stage.py -v
```

### Manual Testing with Celery

```bash
# Start Celery worker
celery -A app.tasks.celery_app worker --loglevel=info

# Trigger extraction via API or Python shell
python -c "
from app.tasks.process_task import process_task
task_id = 'test-task-uuid'
process_task.delay(task_id)
"
```

---

## Common Issues & Solutions

### Issue: `python-docx` not found

**Solution**: Ensure installed in virtual environment
```bash
pip install python-docx
```

### Issue: OMML conversion fails for all equations

**Solution**: Check `lxml` installation and XSLT file path
```bash
pip install lxml
```

### Issue: Image upload fails with S3 error

**Solution**: Verify MinIO credentials in `.env`
```bash
# Check environment variables
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
echo $S3_BUCKET_NAME
```

### Issue: Tests fail with "fixture not found"

**Solution**: Create sample DOCX files in `tests/fixtures/sample_exams/`

---

## Success Criteria Checklist

Before marking implementation complete, verify:

- ✅ **SC-001**: Extract paragraphs, tables, images, math equations
- ✅ **SC-002**: DIJ validates against schema v1.0
- ✅ **SC-003**: Images stored as external artifacts (not embedded)
- ✅ **SC-004**: Extraction completes in <30 seconds for 50-page DOCX
- ✅ **SC-005**: 100% text accuracy (character-for-character match)
- ✅ **SC-006**: 90% math conversion success rate
- ✅ **SC-007**: Comprehensive formatting metadata captured
- ✅ **SC-008**: Idempotent retry behavior
- ✅ **SC-009**: All unit tests pass, >80% coverage

Run validation:
```bash
pytest tests/ -v --cov=app --cov-report=term-missing
```

---

## Next Steps After Implementation

1. **Code Review**: Submit PR from `006-docx-extraction` to `main`
2. **QA Testing**: Test with real exam DOCX files
3. **Performance Tuning**: Profile extraction for large files
4. **Documentation**: Update API docs with DIJ schema
5. **Monitoring**: Add extraction metrics to observability dashboard

---

## Resources

- **Spec**: [specs/006-docx-extraction/spec.md](./spec.md)
- **Research**: [specs/006-docx-extraction/research.md](./research.md)
- **Data Model**: [specs/006-docx-extraction/data-model.md](./data-model.md)
- **DIJ Schema**: [specs/006-docx-extraction/contracts/dij-schema-v1.0.json](./contracts/dij-schema-v1.0.json)
- **python-docx Docs**: https://python-docx.readthedocs.io/
- **Constitution**: [.specify/memory/constitution.md](../../.specify/memory/constitution.md)

---

## Getting Help

- **Stuck on DOCX parsing?** Check `python-docx` documentation for object model details
- **OMML conversion issues?** See research.md for conversion strategy
- **Test failures?** Run with `-vv` for verbose output
- **Questions?** Tag `@backend-team` in Slack

Happy coding! 🚀
