# Research: DOCX Extraction Pipeline

**Feature**: 006-docx-extraction  
**Date**: 2026-03-22  
**Purpose**: Resolve technical unknowns identified in Technical Context

---

## Research Task 1: DOCX Parsing Library Selection

**Question**: Which Python library should we use for DOCX parsing?

### Options Evaluated

| Library | Pros | Cons | Verdict |
|---------|------|------|---------|
| **python-docx** | ✅ Pure Python, easy to install<br>✅ Well-documented, stable API<br>✅ Handles paragraphs, tables, images<br>✅ Active maintenance | ⚠️ Limited OMML support<br>⚠️ Some complex formatting may need custom handling | **✅ SELECTED** |
| **mammoth** | ✅ Good HTML conversion<br>✅ Clean output | ❌ Designed for HTML conversion, not structured extraction<br>❌ Less control over block-level extraction | ❌ Rejected |
| **docx2python** | ✅ Extracts to nested lists | ❌ Output structure less suitable for our block model<br>❌ Less flexible for custom extraction | ❌ Rejected |

### Decision: python-docx

**Rationale**: `python-docx` provides the right level of control for extracting structured blocks (paragraphs, tables, runs with formatting, images, relationships). Its object model aligns well with our block-based DIJ schema. While it has limited built-in OMML handling, the XML can be accessed directly for custom math conversion.

**Installation**: Already compatible with Python 3.11, add to `pyproject.toml`

---

## Research Task 2: OMML to LaTeX Conversion

**Question**: How do we convert Office Math Markup Language (OMML) to LaTeX?

### Options Evaluated

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **omml2mathml + mathml2latex** | ✅ Two-stage conversion via MathML<br>✅ MathML is standardized | ❌ Requires two libraries<br>❌ MathML intermediate may lose fidelity | ⚠️ Backup option |
| **Custom XSLT Transform** | ✅ Direct OMML→LaTeX<br>✅ Microsoft provides OMML2MML.XSL | ❌ Requires XSLT processor (lxml)<br>❌ Then still need MathML→LaTeX | ⚠️ Backup option |
| **Manual XML Parsing** | ✅ Full control<br>✅ Can handle edge cases | ❌ Significant implementation effort<br>❌ Must maintain mapping rules | ❌ Too complex for MVP |
| **python-mammoth (subset)** | ✅ Has some OMML handling | ❌ Limited to what mammoth supports<br>❌ Not primary use case | ❌ Not suitable |
| **omml-to-latex (if exists)** | ✅ Direct conversion | ⚠️ Need to verify library exists and quality | **✅ INVESTIGATE** |

### Decision: Two-Phase Approach

**Selected Strategy**:
1. **Extract OMML XML** from `python-docx` math elements (`oMath` objects)
2. **Attempt LaTeX conversion** using conversion library/XSLT
3. **On failure**: Preserve original OMML XML in DIJ with `conversion_failed: true` flag
4. **Store both** LaTeX (when successful) and original OMML for future retry

**Rationale**: Failsafe approach ensures no data loss. Preserving OMML enables future conversion improvements without re-extracting. Constitution Principle V (Provenance) satisfied by keeping source.

**Implementation Notes**:
- Check for existing `omml-to-latex` Python package
- If unavailable, use `lxml` + Microsoft's OMML2MML.XSL + simple MathML parser
- Wrap conversion in try/except with detailed error logging
- Success rate target: 90% (per spec SC-006)

---

## Research Task 3: Image Extraction and Storage Strategy

**Question**: How do we extract images from DOCX and store them as external artifacts?

### Approach

**python-docx Image Access**:
- Images are `InlineShape` or drawing objects in paragraphs
- Access via `document.inline_shapes` or paragraph relationships
- Binary data available through `image.blob` property
- Image format info available (`image.content_type`, e.g., `image/png`)

**Storage Workflow**:
1. **Extract** image binary from DOCX relationship
2. **Generate** unique filename: `{task_id}_{block_sequence}_{image_id}.{ext}`
3. **Upload** to MinIO/S3 using existing `artifact_service.py`
4. **Create** Artifact record with metadata:
   - `content_type`: image/png, image/jpeg, etc.
   - `size_bytes`: file size
   - `storage_path`: S3 key
   - `source_document_id`: link to source exam
5. **Reference** in DIJ image block: `{"type": "image", "artifact_id": "uuid", ...}`

**Idempotency**: Use content-based hash (MD5 or SHA256) to detect duplicate images. If same image appears multiple times in document, store once and reference multiple times.

**Decision**: ✅ Use existing artifact storage infrastructure. No new storage mechanism needed.

---

## Research Task 4: Error Handling and Structured Diagnostics

**Question**: How do we implement structured error messages per spec requirement?

### Format Design

```python
class ExtractionError(Exception):
    """Structured extraction error with diagnostic information."""
    
    def __init__(
        self,
        error_code: str,         # e.g., "DOCX_CORRUPTED", "TIMEOUT", "OMML_CONVERSION_FAILED"
        user_message: str,       # User-friendly explanation
        technical_details: dict, # Filename, stage, line number, etc.
        original_exception: Exception | None = None
    ):
        self.error_code = error_code
        self.user_message = user_message
        self.technical_details = technical_details
        self.stack_trace = traceback.format_exc() if original_exception else None
```

**Error Codes** (preliminary):
- `DOCX_INVALID_FORMAT`: File is not a valid DOCX
- `DOCX_CORRUPTED`: DOCX structure is malformed
- `DOCX_TOO_LARGE`: File exceeds 50MB limit
- `EXTRACTION_TIMEOUT`: Processing exceeded 5-minute limit
- `OMML_CONVERSION_FAILED`: Math equation conversion failed (non-fatal, preserved as fallback)
- `IMAGE_EXTRACTION_FAILED`: Could not extract embedded image
- `STORAGE_ERROR`: Failed to upload artifact to S3/MinIO

**Decision**: ✅ Implement custom exception class with structured fields. Serialize to JSON for API responses and task logs.

---

## Research Task 5: DIJ Schema Versioning Strategy

**Question**: How do we version the DIJ schema for future compatibility?

### Approach

**Schema Version Field**: Every DIJ includes `{"version": "1.0", ...}` at root level

**Pydantic Models**:
```python
class DIJv1(BaseModel):
    version: Literal["1.0"] = "1.0"
    document_id: str
    blocks: list[Block]
    metadata: dict  # extraction timestamp, source filename, etc.

class Block(BaseModel):
    id: str  # UUID
    type: Literal["paragraph", "table", "image", "math"]
    sequence: int
    content: dict  # Type-specific content
    provenance: Provenance

class Provenance(BaseModel):
    source_document_id: str
    original_position: int  # Position in source DOCX
    extraction_timestamp: datetime
```

**Future Versions**: When schema changes:
1. Create `DIJv2(BaseModel)` with new structure
2. Implement converter: `DIJv1 → DIJv2`
3. Store version in Artifact metadata
4. Downstream stages check version and convert if needed

**Decision**: ✅ Use Pydantic with version literals. Start with v1.0, increment on breaking changes.

---

## Research Task 6: Artifact Idempotency and Retry Safety

**Question**: How do we ensure idempotent extraction during retries?

### Strategy

**Idempotency Key**: `{task_id}_dij_v1` for DIJ artifacts, `{task_id}_img_{content_hash}` for images

**Workflow**:
1. **Check** if artifact with key exists
2. **If exists**: Return existing artifact_id (idempotent)
3. **If not**: Create new artifact

**Content-Based Deduplication** (images):
- Hash image binary (SHA256)
- Check if artifact with same hash exists for this exam
- Reuse if found, create new if not

**Task State**: Store DIJ artifact_id in `task.metadata["dij_artifact_id"]` after successful extraction. On retry, check this field first before re-extracting.

**Decision**: ✅ Use task_id-based keys for DIJ, content hashes for images. Store artifact refs in task metadata.

---

## Technology Stack Summary

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **DOCX Parsing** | python-docx 1.1.0+ | Mature, well-documented, good API for block extraction |
| **Math Conversion** | OMML→LaTeX via XSLT + lxml | Fallback to OMML preservation on failure |
| **Image Storage** | Existing MinIO/S3 via artifact_service | Reuse infrastructure, no new storage |
| **Schema Validation** | Pydantic v2 | Type safety, built-in validation, JSON serialization |
| **Error Handling** | Custom ExtractionError class | Structured diagnostics per spec requirement |
| **Testing** | pytest + fixtures (sample DOCX files) | TDD with real document samples |

---

## Implementation Sequence Recommendation

1. **Core Extraction** (P1 - Text Paragraphs)
2. **Table Extraction** (P2)
3. **Image Extraction** (P3)
4. **Math Conversion** (P4)
5. **Integration** with pipeline_stages.py
6. **Error Handling** and timeout enforcement
7. **Unit & Integration Tests**

---

## Resolved Unknowns

All "NEEDS CLARIFICATION" items from Technical Context have been resolved:
- ✅ DOCX parsing library: `python-docx`
- ✅ Math conversion: OMML→LaTeX with OMML fallback
- ✅ Storage strategy: Existing artifact service
- ✅ Error handling: Structured ExtractionError
- ✅ Schema versioning: Pydantic with version field
- ✅ Idempotency: Task-based keys + content hashes

Ready to proceed to **Phase 1: Data Model & Contracts**.
