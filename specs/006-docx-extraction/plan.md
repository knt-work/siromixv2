# Implementation Plan: DOCX Extraction Pipeline

**Branch**: `006-docx-extraction` | **Date**: 2026-03-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-docx-extraction/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Replace the mock `extract_docx` pipeline stage with a real DOCX parser that produces Document Intermediate JSON (DIJ) - the canonical input to downstream AI analysis stages. The feature extracts text paragraphs, tables, images, and math equations from DOCX files, storing them in a versioned, structured JSON format with source provenance. Images are stored as external artifacts, and OMML math is converted to LaTeX (with OMML fallback on failure). This unblocks the core exam processing value proposition by enabling actual document understanding.

## Technical Context

**Language/Version**: Python 3.11  
**Primary Dependencies**: python-docx (DOCX parsing), LaTeX conversion library (TBD in research), FastAPI, SQLAlchemy, Celery  
**Storage**: PostgreSQL (artifact metadata), MinIO/S3 (binary image storage)  
**Testing**: pytest, pytest-asyncio, pytest-cov  
**Target Platform**: Linux server (containerized backend workers)  
**Project Type**: Backend service module (pipeline stage within modular monolith)  
**Performance Goals**: Extract typical exam DOCX (10-50 pages) in <30 seconds; absolute timeout 5 minutes  
**Constraints**: 50MB max file size, comprehensive formatting preservation, 100% text accuracy, external image storage  
**Scale/Scope**: Process individual DOCX files asynchronously via Celery tasks; store DIJ as artifact; integrate with existing Task/Artifact models

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence / Notes |
|-----------|--------|------------------|
| **I. Pipeline-First** | ✅ PASS | Feature implements a single pipeline stage (extract_docx) with strict DIJ output contract. Replaces mock stage in existing pipeline. Clear input (DOCX file) and output (DIJ JSON) boundaries. |
| **II. AI is a Component, Not the Controller** | ✅ PASS | Zero AI involvement. Pure deterministic DOCX parsing and transformation. No AI decision-making in this stage. |
| **III. Schema-First, Validation-Gated** | ✅ PASS | Produces versioned DIJ schema. Validation occurs before persisting artifact. Stage outputs validated DIJ or fails explicitly. |
| **IV. Non-Text Content is Block + Reference** | ✅ PASS | Images stored as external artifacts in S3/MinIO. DIJ image blocks contain artifact ID references only. No base64 or embedded binaries in JSON. |
| **V. Traceability & Provenance by Design** | ✅ PASS | Every DIJ block includes source provenance: document_id, block sequence, original position. Enables tracing canonical content back to source DOCX blocks. |
| **VI. Determinism After Normalization** | ✅ PASS | Extraction is fully deterministic. Same DOCX input produces identical DIJ output. No randomness or non-deterministic processing. |
| **VII. Idempotent, Retryable Tasks** | ✅ PASS | Stage must be idempotent via existing Celery retry mechanism. Creates artifacts with idempotency keys. Safe to retry on failure without duplicating artifacts. |
| **VIII. Separation of Content vs Rendering** | ✅ PASS | DIJ is pure content (text, structure, semantic blocks). Formatting metadata captured but rendering is downstream responsibility. No template/style decisions in extraction. |
| **IX. Unit Testing Mandatory** | ✅ PASS | All extraction functions will have unit tests (paragraph extraction, table parsing, image handling, math conversion, error cases). TDD approach documented in tasks phase. |

### Quality Gates

- ✅ Output conforms to DIJ schema v1.0
- ✅ All artifacts persisted with artifact_id references
- ✅ Task state updated with progress/logs
- ✅ Idempotent: re-running extraction produces same DIJ artifact_id (by content hash or task_id)
- ✅ Unit tests cover all block types and error scenarios
- ✅ Error handling produces structured diagnostics (error code, user message, technical details, stack trace)

**GATE STATUS**: ✅ **PASS** - All constitution principles satisfied. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/006-docx-extraction/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── dij-schema-v1.0.json  # DIJ JSON schema
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── services/
│   │   ├── extraction_service.py      # NEW: DOCX extraction orchestration
│   │   └── artifact_service.py        # EXISTING: Artifact storage operations
│   ├── models/
│   │   ├── artifact.py                # EXISTING: Artifact model
│   │   └── task.py                    # EXISTING: Task model with TaskStage enum
│   ├── schemas/
│   │   ├── dij.py                     # NEW: DIJ Pydantic models (versioned)
│   │   └── extraction.py              # NEW: Extraction request/response schemas
│   ├── tasks/
│   │   ├── pipeline_stages.py         # UPDATE: Replace mock extract_docx with real implementation
│   │   └── process_task.py            # EXISTING: Celery task orchestration
│   └── core/
│       ├── docx_parser.py             # NEW: python-docx wrapper and block extraction
│       ├── math_converter.py          # NEW: OMML → LaTeX conversion
│       └── image_extractor.py         # NEW: Image extraction and artifact storage
└── tests/
    ├── unit/
    │   ├── test_docx_parser.py        # NEW: Unit tests for DOCX parsing
    │   ├── test_math_converter.py     # NEW: Unit tests for math conversion
    │   ├── test_image_extractor.py    # NEW: Unit tests for image extraction
    │   └── test_extraction_service.py # NEW: Unit tests for extraction service
    ├── integration/
    │   └── test_extract_docx_stage.py # NEW: Integration test for full stage
    └── fixtures/
        └── sample_exams/              # NEW: Test DOCX files with various content types
            ├── simple_text.docx
            ├── with_tables.docx
            ├── with_images.docx
            └── with_math.docx
```

**Structure Decision**: Uses existing backend modular monolith structure. New extraction logic added to `app/core/` for reusable components, `app/services/` for orchestration, and `app/schemas/` for DIJ models. Integrates with existing Task/Artifact models and Celery pipeline. No new microservices or projects required.

---

## Phase 0: Research & Technology Decisions

**Output Artifact**: [research.md](./research.md)

### Research Tasks Completed

All technical unknowns identified in Technical Context have been resolved through systematic evaluation:

#### 1. DOCX Parsing Library Selection

**Decision**: `python-docx` library (version 1.1.0+)

**Rationale**: Provides direct access to DOCX structure (paragraphs, runs, tables, relationships) needed for block-level extraction. Well-maintained, pure Python, extensive documentation. Alternative libraries (mammoth, docx2python) are optimized for HTML conversion or nested list output rather than structured block extraction.

**Implementation**: Add `python-docx>=1.1.0` to `pyproject.toml` dependencies.

#### 2. OMML to LaTeX Conversion

**Decision**: XSLT-based conversion with OMML preservation fallback

**Strategy**:
- Extract OMML XML from `python-docx` math elements
- Convert to LaTeX using XSLT transform (Microsoft's OMML2MML.XSL) + MathML-to-LaTeX parser
- On conversion failure: preserve original OMML XML in DIJ with `conversion_failed: true` flag
- Store both LaTeX (when successful) and original OMML for future retry capability
- Target 90% conversion success rate (per spec SC-006)

**Rationale**: Failsafe approach prevents data loss. Preserving OMML enables future conversion improvements without re-extracting source documents (aligns with Constitution Principle V: Provenance).

**Implementation**: Use `lxml` for XSLT processing. Wrap conversion in try/except with structured error logging.

#### 3. Image Extraction and Storage

**Decision**: External artifact storage via existing `artifact_service.py`

**Workflow**:
1. Extract image binary from DOCX relationships (via `python-docx` InlineShape objects)
2. Generate unique filename: `{task_id}_{block_sequence}_{image_id}.{ext}`
3. Upload to MinIO/S3 using existing artifact infrastructure
4. Create Artifact record with metadata (content_type, size_bytes, storage_path)
5. Reference in DIJ image block via `artifact_id` (never embed binary data)

**Idempotency**: Use content-based hash (SHA256) to detect duplicate images. If same image appears multiple times in document, store once and reference multiple times.

**Rationale**: Reuses existing infrastructure. Aligns with Constitution Principle IV (Block + Reference pattern). No new storage mechanisms required.

#### 4. Error Handling and Structured Diagnostics

**Decision**: Custom `ExtractionError` exception class with structured fields

**Format**:
```python
class ExtractionError(Exception):
    error_code: str              # e.g., "DOCX_CORRUPTED", "TIMEOUT"
    user_message: str            # User-friendly explanation
    technical_details: dict      # Filename, stage, line number, etc.
    stack_trace: str | None      # Full stack trace for debugging
```

**Error Codes** (preliminary):
- `DOCX_INVALID_FORMAT`: File is not valid DOCX
- `DOCX_CORRUPTED`: DOCX structure is malformed
- `DOCX_TOO_LARGE`: File exceeds 50MB limit
- `EXTRACTION_TIMEOUT`: Processing exceeded 5-minute limit
- `OMML_CONVERSION_FAILED`: Math conversion failed (non-fatal, preserved as fallback)
- `IMAGE_EXTRACTION_FAILED`: Could not extract embedded image
- `STORAGE_ERROR`: Failed to upload artifact to S3/MinIO

**Rationale**: Satisfies spec requirement for structured error diagnostics. Enables debugging while providing user-friendly messages.

#### 5. DIJ Schema Versioning Strategy

**Decision**: Pydantic models with explicit version field

**Schema Structure**:
```python
class DIJv1(BaseModel):
    version: Literal["1.0"] = "1.0"
    document_id: str
    blocks: list[Block]
    metadata: dict  # extraction timestamp, source filename, etc.
```

**Future Compatibility**: When schema changes, create `DIJv2` model and implement converters. Store version in Artifact metadata. Downstream stages check version and convert if needed.

**Rationale**: Enables schema evolution without breaking existing pipelines. Pydantic provides type safety and built-in validation.

#### 6. Artifact Idempotency and Retry Safety

**Decision**: Task-based idempotency keys + content hashes

**Strategy**:
- DIJ artifacts: key = `{task_id}_dij_v1`
- Image artifacts: key = `{task_id}_img_{content_hash}`
- Store DIJ artifact_id in `task.metadata["dij_artifact_id"]` after successful extraction
- On retry: check metadata field first before re-extracting

**Rationale**: Aligns with Constitution Principle VII (Idempotent Tasks). Prevents duplicate artifacts during Celery retries.

### Technology Stack Summary

| Component | Technology | Version/Notes |
|-----------|------------|---------------|
| DOCX Parsing | python-docx | 1.1.0+ (add to pyproject.toml) |
| Math Conversion | XSLT + lxml | Microsoft OMML2MML.XSL transform |
| Image Storage | MinIO/S3 (boto3) | Via existing artifact_service.py |
| Schema Validation | Pydantic v2 | Type safety, JSON serialization |
| Error Handling | Custom ExtractionError | Structured diagnostics |
| Testing | pytest + DOCX fixtures | Sample documents with varied content |

### Implementation Sequence (P1→P4 Priority)

1. **P1: Text Paragraphs** - Core extraction (paragraphs, runs, formatting)
2. **P2: Tables** - Table structure, cells, spans
3. **P3: Images** - Image extraction and artifact storage
4. **P4: Math** - OMML→LaTeX conversion with fallback
5. **Integration** - Replace mock `extract_docx` in pipeline_stages.py
6. **Error Handling** - Timeout enforcement, structured errors
7. **Testing** - Unit and integration tests per Constitution Principle IX

**Status**: ✅ All research tasks complete. Ready for Phase 1: Data Model & Contracts.

---

## Phase 1: Data Model & Contracts

**Output Artifacts**:
- [data-model.md](./data-model.md) - DIJ schema v1.0 definition with block types
- [contracts/dij-schema-v1.0.json](./contracts/dij-schema-v1.0.json) - JSON Schema validation contract
- [quickstart.md](./quickstart.md) - Developer setup and TDD workflow guide

### Data Model: Document Intermediate JSON (DIJ) v1.0

**Core Entity**: DIJ document with versioned block-based structure

#### Block Types Identified (from feature spec)

1. **Paragraph Block**
   - **Fields**: runs (TextRun[]), alignment, indents, spacing, line_spacing, style
   - **TextRun**: text, bold, italic, underline, font_name, font_size, color
   - **Relationships**: None (self-contained)
   - **Validation**: Must have at least one run; filter empty paragraphs by default
   - **State**: Immutable once extracted

2. **Table Block**
   - **Fields**: rows (TableRow[]), style
   - **TableRow**: cells (TableCell[]), is_header
   - **TableCell**: content (CellContent[]), rowspan, colspan, background_color, borders
   - **Relationships**: Can contain nested paragraphs, images, or math in cells
   - **Validation**: Row count must match cell array lengths; spans must be valid
   - **State**: Immutable once extracted

3. **Image Block**
   - **Fields**: artifact_id (UUID reference), width, height, alt_text, title, content_type
   - **Relationships**: References Artifact model via artifact_id (external storage)
   - **Validation**: artifact_id must exist in artifact storage before DIJ persistence
   - **State**: Binary stored in S3/MinIO; referenced via artifact_id

4. **Math Block**
   - **Fields**: latex (optional), omml (required), conversion_failed, conversion_error
   - **Relationships**: None (self-contained)
   - **Validation**: OMML must always be present; LaTeX is optional based on conversion success
   - **State**: Immutable; future retry may update LaTeX field

#### Common Fields (All Blocks)

- **id**: UUID (unique within document)
- **type**: BlockType enum ("paragraph" | "table" | "image" | "math")
- **sequence**: Integer (1-indexed, sequential, no gaps)
- **content**: Type-specific content dict (validated via Pydantic)
- **provenance**: Provenance object (source_document_id, original_position, extraction_timestamp, extraction_method)

#### Root Structure

```python
class DIJv1(BaseModel):
    version: Literal["1.0"] = "1.0"
    document_id: str  # UUID linking to source exam
    blocks: list[Block]
    metadata: ExtractionMetadata
```

#### Metadata Entity

- **extraction_timestamp**: datetime (ISO 8601)
- **source_filename**: string
- **source_file_size**: integer (bytes)
- **total_blocks**: integer
- **block_type_counts**: dict[str, int] (e.g., {"paragraph": 50, "table": 5})
- **extraction_duration_ms**: integer
- **warnings**: list[str] (non-fatal issues)

### Interface Contracts

**Contract Type**: JSON Schema for external data validation

**Purpose**: Validate DIJ structure before persisting as artifact. Enables downstream stages to validate input before processing.

**Contract File**: `contracts/dij-schema-v1.0.json`

**Key Validations**:
- Version field must be `"1.0"` (exact string match)
- Block IDs must be unique within document
- Block sequences must be 1-indexed, sequential, no gaps
- Artifact references must be valid UUIDs
- Provenance required for all blocks
- Math blocks require OMML field (LaTeX optional)
- Timestamp fields must be ISO 8601 format

**Usage**:
```python
import jsonschema
from pathlib import Path

# Load schema
schema = json.loads(Path("contracts/dij-schema-v1.0.json").read_text())

# Validate DIJ
jsonschema.validate(dij_data, schema)  # Raises ValidationError if invalid
```

**Validation Gate**: DIJ must validate before being stored as artifact (Constitution Principle III).

### Developer Quickstart

**File**: `quickstart.md`

**Purpose**: Get developers productive immediately with TDD workflow

**Contents**:
1. **Prerequisites**: Python 3.11+, PostgreSQL, Redis, MinIO
2. **Quick Setup**: Install dependencies, verify environment
3. **Project Structure**: What files to create
4. **Development Workflow**: TDD phases (P1→P2→P3→P4)
5. **Phase-by-Phase Implementation**: Code examples, tests first
6. **Testing**: Unit and integration test commands
7. **Common Issues**: Troubleshooting guide
8. **Success Criteria Checklist**: Validation before marking complete

**Key Features**:
- Complete code examples for each phase
- Test-first development approach (Constitution Principle IX)
- Sample test fixtures (DOCX files with various content)
- Integration points with existing services (artifact_service, Task model)

### Agent Context Update

Agent context update completed per Phase 1 requirements.

**Script**: `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`

**Changes Applied**:
- ✅ Added language: Python 3.11
- ✅ Added framework: python-docx (DOCX parsing), LaTeX conversion library (TBD in research), FastAPI, SQLAlchemy, Celery
- ✅ Added database: PostgreSQL (artifact metadata), MinIO/S3 (binary image storage)
- ✅ Updated: `.github/agents/copilot-instructions.md`

**Result**: Agent now has context for Feature 006 technologies, enabling better code suggestions during implementation.

### Constitution Check (Post-Design)

**Re-validation after Phase 1 design**:

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| **I. Pipeline-First** | ✅ PASS | DIJ schema is pure data structure. Clear input/output contract maintained. |
| **II. AI is a Component** | ✅ PASS | No AI in extraction stage. Pure deterministic parsing. |
| **III. Schema-First** | ✅ PASS | JSON Schema contract created. Pydantic models enforce validation. |
| **IV. Block + Reference** | ✅ PASS | Image blocks store artifact_id only. No binary data in DIJ. |
| **V. Provenance** | ✅ PASS | Every block has provenance with source_document_id, original_position, timestamp. |
| **VI. Determinism** | ✅ PASS | Same DOCX produces identical DIJ every time. |
| **VII. Idempotent Tasks** | ✅ PASS | DIJ uses task_id-based storage keys. Safe to retry. |
| **VIII. Content vs Rendering** | ✅ PASS | DIJ captures content + metadata. Rendering is downstream responsibility. |
| **IX. Unit Testing** | ✅ PASS | quickstart.md documents TDD approach with test-first workflow. |

**GATE STATUS**: ✅ **PASS** - Design maintains constitutional compliance. Ready to proceed.

**Status**: ✅ Phase 1 complete. All design artifacts generated.

---

## Phase 2: Planning Complete

### Implementation Readiness

All planning artifacts completed:
- ✅ Feature specification with clarifications (spec.md)
- ✅ Research document resolving technical unknowns (research.md)
- ✅ Data model defining DIJ schema v1.0 (data-model.md)
- ✅ JSON Schema contract for validation (contracts/dij-schema-v1.0.json)
- ✅ Developer quickstart guide with TDD workflow (quickstart.md)
- ✅ Agent context updated for Feature 006 technologies

### Next Steps (Outside This Command)

**Task Decomposition** (via `/speckit.tasks`):
- Generate `tasks.md` with actionable, dependency-ordered implementation tasks
- Break down P1→P2→P3→P4 priorities into granular units
- Define acceptance criteria for each task
- Assign task IDs for tracking

**Implementation** (via `/speckit.implement`):
- Execute tasks from `tasks.md` in dependency order
- Follow TDD workflow from quickstart.md
- Validate each phase against success criteria
- Update task status as work progresses

### Summary

**Branch**: `006-docx-extraction`  
**Plan File**: `C:\My Data\Projects\Siromix\siromixv2\specs\006-docx-extraction\plan.md`

**Artifacts Generated**:
1. `research.md` - Technology decisions (python-docx, OMML conversion, image storage)
2. `data-model.md` - DIJ v1.0 schema with block types (paragraph, table, image, math)
3. `contracts/dij-schema-v1.0.json` - JSON Schema validation contract
4. `quickstart.md` - Developer guide with TDD workflow and code examples
5. `.github/agents/copilot-instructions.md` - Updated agent context

**Constitution Status**: ✅ All 9 principles validated pre and post-design. Zero violations.

**Ready for**: Task decomposition (run `/speckit.tasks`) and implementation (run `/speckit.implement`).

---

**Planning command completed successfully.** Feature 006 is fully planned and ready for implementation.
