# Clarification Session Report

**Date**: March 13, 2026  
**Feature**: File Upload & Exam Creation API  
**Specification**: [spec.md](spec.md)  
**Status**: ✅ COMPLETED

## Session Summary

**Questions Asked & Answered**: 5 of 5

All critical ambiguities have been resolved through structured questioning. The specification has been updated to align with existing backend schemas and clarify field mappings.

## Clarifications Applied

### 1. **Duration Field** (P1 - Data Model)
- **Question**: Should `duration_minutes` be added to Exam schema, removed from spec, or stored elsewhere?
- **Answer**: Add duration_minutes field to Exam schema and database model
- **Rationale**: Important exam metadata in Vietnam that must be tracked at database level
- **Impact**: High - Requires database migration and schema updates

### 2. **Task Status** (P1 - Terminology)
- **Question**: Use "pending" (spec) vs "queued" (backend enum)?
- **Answer**: Use "queued" as initial task status
- **Rationale**: Matches existing TaskStatus enum; avoids adding new status value
- **Impact**: Medium - Spec terminology updated, no code changes needed

### 3. **Exam Name Field** (P1 - API Contract)
- **Question**: Use "exam_name" (spec) vs "name" (backend schema)?
- **Answer**: Update spec to use "name"
- **Rationale**: Backend ExamCreate schema already uses "name"; lower risk to update spec
- **Impact**: Medium - Spec updated to match implementation

### 4. **Instructions Field** (P2 - API Contract)
- **Question**: Use "notes" in API with mapping to "instructions", or use "instructions" consistently?
- **Answer**: Use "instructions" consistently
- **Rationale**: Eliminates mapping layer, clearer semantic meaning
- **Impact**: Low - Simplifies API contract, spec updated

### 5. **Task-Exam Association** (P1 - Data Model)
- **Question**: Make exam_id required or keep optional in Task model?
- **Answer**: Make exam_id required (non-nullable) and add to TaskCreate schema
- **Rationale**: Ensures referential integrity for exam creation workflow
- **Impact**: High - Requires model changes and schema updates

## Specification Updates

### Sections Modified

1. **Clarifications Section** (NEW)
   - Added `## Clarifications` with `### Session 2026-03-13` subsection
   - Documented all 5 Q&A pairs in bullet format

2. **User Scenarios & Testing**
   - User Story 1: Changed "pending" → "queued", "notes" → "instructions", "exam_name" → "name"
   - Acceptance scenarios updated with correct field names

3. **Requirements**
   - FR-001: Updated field list (exam_name → name, notes → instructions)
   - FR-003: Updated required fields (exam_name → name)
   - FR-004: Updated constraints (exam_name → name)
   - FR-005: Added note about duration_minutes extension
   - FR-007: Changed "pending" → "queued"
   - FR-008: Changed "pending" → "queued"
   - FR-016: Removed obsolete notes→instructions mapping requirement
   - FR-017: Renumbered from FR-018

4. **Key Entities**
   - Exam entity: Added duration_minutes field, clarified instructions usage, changed exam_name → name
   - Task entity: Changed "pending" → "queued"
   - API Request: Updated field list

5. **Edge Cases**
   - Updated reference from exam_name to name field

## Coverage Assessment

| Category | Status | Notes |
|----------|--------|-------|
| **Functional Scope & Behavior** | ✅ Resolved | Core user goals clear; exam creation with file upload well-defined |
| **Domain & Data Model** | ✅ Resolved | All entity attributes clarified (duration_minutes, exam_id association); field naming aligned |
| **Interaction & UX Flow** | ✅ Clear | User journey from form submission to response documented; validation flows specified |
| **Non-Functional Quality Attributes** | ✅ Clear | Performance targets (5s upload, 1s retrieval), file size limits (50MB), concurrency handling specified |
| **Integration & External Dependencies** | ✅ Clear | Dependency on Feature 003 schemas explicit; storage integration clear |
| **Edge Cases & Failure Handling** | ✅ Clear | Comprehensive edge cases documented; error handling scenarios defined |
| **Constraints & Tradeoffs** | ✅ Clear | Field length constraints from Feature 003 applied; technical decisions aligned with backend |
| **Terminology & Consistency** | ✅ Resolved | Field naming standardized (name, instructions, queued); no conflicting synonyms |
| **Completion Signals** | ✅ Clear | Acceptance criteria testable; success metrics measurable |
| **Placeholders & Ambiguities** | ✅ Resolved | All 5 high-impact ambiguities addressed; no outstanding clarification markers |

**Overall Coverage**: 10/10 categories resolved or clear

## Implementation Readiness

### Schema Changes Required

1. **Exam Model** (`backend/app/models/exam.py`)
   - Add `duration_minutes: Mapped[int]` field (INTEGER, nullable=False)
   - Add check constraint: `duration_minutes > 0`

2. **Exam Schema** (`backend/app/schemas/exam.py`)
   - Add `duration_minutes: int = Field(..., gt=0)` to `ExamCreate`
   - Add `duration_minutes: int` to `ExamResponse`
   - Add `duration_minutes: Optional[int]` to `ExamUpdate`

3. **Task Model** (`backend/app/models/task.py`)
   - Change `exam_id: Mapped[uuid.UUID | None]` → `exam_id: Mapped[uuid.UUID]`
   - Change `nullable=True` → `nullable=False`

4. **Task Schema** (`backend/app/schemas/task.py`)
   - Add `exam_id: uuid.UUID = Field(...)` to `TaskCreate`

5. **Database Migration**
   - Alembic migration to add `duration_minutes` column to `exams` table
   - Alembic migration to change `exam_id` to NOT NULL in `tasks` table (handle existing NULL rows first)

### Frontend Changes Required

1. **Exam Create Form** (`frontend/src/app/exams/create/page.tsx`)
   - Add `grade_level` field (currently missing from UI)
   - Add `duration` field (maps to duration_minutes)
   - Rename `notes` field label to "Instructions" (API contract uses `instructions`)
   - Update form submission to match API contract: `{name, academic_year, grade_level, subject, duration_minutes, num_versions, instructions, file}`

2. **Type Definitions** (`frontend/src/types/`)
   - Update `ExamMetadata` interface to match backend schema

## Next Steps

### ✅ Recommended: Proceed to `/speckit.plan`

All critical ambiguities have been resolved. The specification is now ready for implementation planning.

**Why proceed now:**
- All 5 high-impact clarifications answered
- Field naming and data types aligned with backend
- No outstanding [NEEDS CLARIFICATION] markers
- Coverage assessment shows 100% resolved/clear status

**Planning phase will address:**
- Detailed API endpoint design (route handlers, request/response shapes)
- File upload implementation (multipart/form-data handling, storage client)
- Database migration strategy (duration_minutes, exam_id nullable constraint)
- Transaction boundaries and rollback mechanisms
- Celery task enqueueing integration
- Test strategy (unit, integration, e2e)

### Alternative: `/speckit.clarify` Again (Not recommended)

Only re-run clarification if:
- Stakeholders raise new concerns after reviewing clarifications
- Technical discovery reveals additional ambiguities during planning
- Business requirements change

## Validation

✅ All mandatory sections in spec.md completed  
✅ No [NEEDS CLARIFICATION] markers remain  
✅ Terminology consistent (name, instructions, queued, duration_minutes)  
✅ Field constraints documented and aligned with backend  
✅ User scenarios cover primary flows  
✅ Edge cases comprehensively identified  
✅ Success criteria measurable and technology-agnostic  

**Specification Quality**: Production-ready for planning phase
