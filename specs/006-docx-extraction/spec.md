# Feature Specification: DOCX Extraction Pipeline

**Feature Branch**: `006-docx-extraction`  
**Created**: 2026-03-22  
**Status**: Draft  
**Input**: User description: "DOCX Extraction Pipeline (extract_docx stage) - This is the highest-leverage next step. It replaces the first mock pipeline stage with a real DOCX parser that produces a Document Intermediate JSON (DIJ) — the canonical output required by Constitution Principle I as input to the AI Understanding stage. Without this, the platform cannot deliver its core value proposition."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Extract Text Paragraphs from DOCX (Priority: P1)

When an exam document is uploaded to the system, the platform extracts all text paragraphs from the DOCX file and produces a structured Document Intermediate JSON (DIJ) containing the text blocks with their source provenance.

**Why this priority**: This is the foundational capability required for the platform to deliver its core value proposition. Without text extraction, no downstream AI analysis can occur. This unblocks the entire exam analysis pipeline.

**Independent Test**: Can be fully tested by uploading a DOCX file containing only text paragraphs and verifying that the DIJ output contains all paragraph text with correct sequencing and provenance metadata.

**Acceptance Scenarios**:

1. **Given** a DOCX file with multiple paragraphs, **When** the extraction pipeline processes the file, **Then** the DIJ output contains all paragraph blocks in order with accurate text content
2. **Given** a DOCX file with formatted text (bold, italic, underline, fonts, colors, styles), **When** the extraction runs, **Then** the DIJ preserves text content while recording comprehensive formatting metadata
3. **Given** a DOCX file with empty paragraphs, **When** extraction occurs, **Then** empty paragraphs are filtered and excluded from the DIJ output
4. **Given** a malformed DOCX file, **When** extraction is attempted, **Then** the system reports a clear error message identifying the parsing failure

---

### User Story 2 - Extract Tables from DOCX (Priority: P2)

When an exam document contains tables (common for answer keys, grading rubrics, or structured data), the system extracts table structures including rows, columns, and cell contents, and represents them in the DIJ format.

**Why this priority**: Tables are prevalent in educational documents and contain critical structured information. This enables the platform to understand answer keys, rubrics, and structured exam data.

**Independent Test**: Can be tested independently by uploading a DOCX containing only tables and verifying the DIJ accurately represents table structure and cell content.

**Acceptance Scenarios**:

1. **Given** a DOCX file with a simple table, **When** extraction runs, **Then** the DIJ contains a table block with correct row/column structure and cell text
2. **Given** a DOCX with tables containing merged cells, **When** extraction occurs, **Then** the DIJ represents merged cells with appropriate span metadata
3. **Given** a DOCX with nested tables, **When** extraction runs, **Then** the DIJ captures the hierarchical table structure
4. **Given** a DOCX with tables containing formatted content, **When** extraction occurs, **Then** cell contents preserve text and formatting metadata

---

### User Story 3 - Extract Images from DOCX (Priority: P3)

When an exam document contains images (diagrams, charts, figures), the system extracts the image data, stores it separately, and creates image block references in the DIJ with source provenance.

**Why this priority**: Images often contain essential exam content like diagrams, charts, or visual questions. Extracting them enables multimodal AI analysis in downstream stages.

**Independent Test**: Can be tested by uploading a DOCX with embedded images and verifying that images are extracted as separate artifacts and referenced correctly in the DIJ.

**Acceptance Scenarios**:

1. **Given** a DOCX file with embedded images, **When** extraction runs, **Then** each image is stored as a separate external artifact and the DIJ contains image block references with artifact IDs
2. **Given** a DOCX with images of various formats (PNG, JPEG), **When** extraction occurs, **Then** all image formats are correctly extracted and stored as external artifacts
3. **Given** a DOCX with inline images and floating images, **When** extraction runs, **Then** the DIJ preserves the positional context of each image type with references to external artifacts
4. **Given** a DOCX with image captions, **When** extraction occurs, **Then** the DIJ associates captions with their corresponding image block references

---

### User Story 4 - Convert Math Notation (OMML to LaTeX) (Priority: P4)

When an exam document contains mathematical equations in Office Math Markup Language (OMML) format, the system converts them to LaTeX notation and includes them in the DIJ as math blocks.

**Why this priority**: STEM exams frequently contain mathematical notation. Converting to LaTeX enables standardized representation for AI understanding and potential re-rendering.

**Independent Test**: Can be tested by uploading a DOCX with math equations and verifying the DIJ contains accurate LaTeX representations of the equations.

**Acceptance Scenarios**:

1. **Given** a DOCX file with OMML math equations, **When** extraction runs, **Then** the DIJ contains math blocks with LaTeX representations for successfully converted equations
2. **Given** a DOCX with inline equations, **When** extraction occurs, **Then** the DIJ preserves the inline context of math content
3. **Given** a DOCX with display-mode equations, **When** extraction runs, **Then** the DIJ marks math blocks as display-mode
4. **Given** a DOCX with complex nested math structures, **When** extraction occurs, **Then** the LaTeX conversion accurately represents the mathematical structure
5. **Given** a DOCX with OMML equations that fail conversion, **When** extraction runs, **Then** the DIJ preserves the original OMML XML as fallback with a conversion_failed flag

### Edge Cases

- What happens when a DOCX file is corrupted or incomplete?
- What happens when a DOCX file exceeds the 50MB size limit?
- How does the system handle DOCX files with extremely large embedded images (e.g., 50MB+ single image)?
- How does the system handle unsupported content types like embedded videos or macros (skip with warning logged, continue processing)?
- How does the system process DOCX files with mixed text directions (RTL and LTR)?
- How does the system handle tables with hundreds of rows or columns (process all content completely for exam data integrity)?
- How does the system handle DOCX files with custom XML parts or non-standard extensions?
- What happens when math notation uses vendor-specific OMML extensions not covered by standard LaTeX conversion?
- How does the system handle DOCX files created by non-Microsoft tools (Google Docs, LibreOffice) that may have subtle format variations?
- What happens when a DOCX contains linked or referenced content pointing to external files?

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST parse DOCX files and extract text paragraph content
- **FR-002**: System MUST extract table structures including rows, columns, cell content, and merged cell information
- **FR-003**: System MUST extract embedded images and store them as separate artifacts
- **FR-004**: System MUST convert OMML (Office Math Markup Language) equations to LaTeX notation when possible, and preserve original OMML XML with conversion_failed flag when conversion fails
- **FR-005**: System MUST produce a versioned Document Intermediate JSON (DIJ) schema containing all extracted blocks
- **FR-006**: System MUST include source provenance metadata for each extracted block (original document location, block type, sequence)
- **FR-007**: System MUST store the DIJ output as an Artifact record in the database
- **FR-008**: System MUST replace the existing mock extraction stage in the exam processing pipeline
- **FR-009**: System MUST handle common DOCX parsing errors gracefully with structured error messages containing error code, user-friendly message, technical details, and stack trace
- **FR-010**: System MUST preserve the sequential order of content blocks as they appear in the source document
- **FR-011**: System MUST handle DOCX files with mixed content types (text, tables, images, math) in a single document
- **FR-012**: System MUST validate DOCX file integrity before attempting extraction
- **FR-013**: Extracted image artifacts MUST maintain original format and quality
- **FR-014**: DIJ schema MUST include version information for future compatibility
- **FR-015**: System MUST log extraction operations for debugging and auditing purposes
- **FR-016**: System MUST reject DOCX files larger than 50MB with a clear error message
- **FR-017**: System MUST terminate extraction operations that exceed 5 minutes with a timeout error
- **FR-018**: System MUST skip unsupported content types (videos, macros, embedded objects) with warning logged and continue processing supported content

### Key Entities

- **Document Intermediate JSON (DIJ)**: A standardized, versioned JSON representation of extracted document content. Structure includes: `version` (schema version string), `document_id` (UUID of source document), and `blocks` (ordered array of block objects). Each block contains: `id` (unique UUID), `type` (paragraph/table/image/math), `sequence` (integer ordering), `content` (type-specific nested object), and `provenance` (nested object with source metadata). Serves as the canonical output of extraction and input to downstream AI stages.

- **Block**: A unit of content within the DIJ. Types include: paragraph (text content with comprehensive formatting metadata including fonts, styles, bold, italic, underline, strikethrough, colors, borders, shading, spacing), table (row/column structure with cell data), image (reference to stored artifact with positional context), and math (LaTeX representation with display mode, or original OMML XML with conversion_failed flag if LaTeX conversion fails). Each block includes source provenance and sequence number.

- **Artifact**: A stored binary or structured data object. For this feature, all extracted images are stored as external artifacts (separate files with artifact metadata records), and image blocks in the DIJ reference these artifacts by ID. The DIJ itself is also stored as an artifact. Artifacts have metadata including content type, size, storage location, and relationship to source exam.

- **Source Provenance**: Metadata describing the origin of an extracted block within the source document. Includes original document identifier, block position/sequence, and any relevant styling or structural context.

- **Extraction Pipeline Stage**: A processing step in the exam analysis workflow. The extract_docx stage is the first stage that transforms uploaded DOCX files into DIJ format for subsequent AI processing stages.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: System successfully extracts text content from 95% of well-formed DOCX exam files on first attempt
- **SC-002**: Extraction process completes within 30 seconds for typical exam documents (10-50 pages), with absolute maximum timeout of 5 minutes
- **SC-003**: DIJ output accurately represents 100% of visible text paragraphs from source DOCX files
- **SC-004**: Table extraction preserves structure with 95% accuracy (correct row/column counts and cell content)
- **SC-005**: System extracts and stores all embedded images from DOCX files without data loss
- **SC-006**: Math equation conversion produces valid LaTeX for 90% of OMML equations found in STEM exam documents
- **SC-007**: Extraction pipeline enables downstream AI analysis stages to process exam content without requiring direct DOCX access
- **SC-008**: System provides clear, structured error diagnostics (error code, user-friendly message, technical details, stack trace) for 100% of failed extraction attempts
- **SC-009**: DIJ schema remains forward-compatible as new content types are added in future iterations

## Clarifications

### Session 2026-03-22

- Q: What is the exact structure of the DIJ schema (minimal vs. standard vs. extended)? → A: Standard structure with version, document_id, and blocks array containing id, type, sequence, content, and provenance fields per block
- Q: Should empty paragraphs be filtered or preserved in DIJ output? → A: Filter empty paragraphs by default - exclude from DIJ output entirely
- Q: Which formatting properties should be captured in paragraph metadata? → A: Comprehensive formatting including fonts, styles, bold, italic, underline, strikethrough, colors, borders, shading, spacing
- Q: How should images be stored (all external, hybrid, or all inline)? → A: All images stored externally - every image gets artifact record with file reference
- Q: What is the maximum DOCX file size limit for extraction? → A: 50MB maximum file size
- Q: How should very large tables (hundreds of rows/columns) be handled? → A: Process all table content regardless of size - ensure complete data extraction
- Q: What is the maximum timeout for extraction operations? → A: 5 minute timeout for extraction operations
- Q: How should failed OMML to LaTeX conversions be handled? → A: Preserve original OMML XML as fallback with conversion_failed flag
- Q: How should unsupported content types (videos, macros) be handled? → A: Skip unsupported content with warning logged - continue extracting supported content types
- Q: What level of detail should error diagnostics provide? → A: Structured errors with error code, user-friendly message, technical details, and stack trace for support

## Dependencies

- **Exam Upload Functionality**: Assumes users can already upload DOCX exam files to the platform (implemented in previous features)
- **Artifact Storage System**: Requires an existing Artifact storage mechanism to persist DIJ outputs and extracted images (Constitution Principle V)
- **Pipeline Architecture**: Depends on an existing pipeline framework that can invoke extraction stages sequentially
- **AI Understanding Stage**: The DIJ output produced by this feature serves as input to downstream AI analysis stages (Constitution Principle I requirement)

## Assumptions

- DOCX files originate from standard Microsoft Word or compatible applications (Google Docs export, LibreOffice)
- Exam documents typically range from 10-50 pages in length
- Most exam content consists of text paragraphs with occasional tables, images, and math equations
- Users expect extraction to complete in under one minute for typical documents
- The DIJ schema can be versioned independently and will evolve as new content types are supported
- Comprehensive formatting metadata capture enables future features like style-based content analysis and document reconstruction
- LaTeX is an acceptable standard format for representing mathematical notation
- Error messages for failed extractions will be reviewed by technical support staff before being shown to end users
