# SiroMix V2 Constitution

<!--
================================================================================
SYNC IMPACT REPORT
================================================================================
Version Change: 1.0.0 → 1.1.0
Bump Rationale: Added new principle (Principle IX: Unit Testing Mandatory)
Date: 2026-02-22

Modified Principles:
  - Core Principles section: Added Principle IX (Unit Testing Mandatory)
  - Quality Gates section: Added unit test requirement (#6)

Added Sections: None (amendment to existing)

Removed Sections: None

Templates Status:
  ✅ plan-template.md - Constitution gates already accommodate testing requirements
  ✅ spec-template.md - Requirements sections align with testing mandate
  ✅ tasks-template.md - Task phases support test-driven workflow
  ⚠️ commands/*.md - Not present in current workspace, skipping

Follow-up TODOs:
  - Development teams must ensure all new features include unit tests
  - Existing code should be progressively covered as modules are touched

================================================================================
-->

## Product Identity

SiroMix V2 is an **exam-processing platform** (not just an exam shuffler). It ingests flexible DOCX inputs, structures them into a canonical exam schema using constrained AI, then deterministically generates shuffled variants and exports formatted DOCX outputs.

---

## Core Principles

### I. Pipeline-First

The system is a multi-stage pipeline: **extract → understand → analyze (optional) → shuffle → generate**. Each stage has strict input/output contracts.

**Rationale**: Clear stage boundaries enable independent testing, debugging, and replacement of components without affecting the entire system. Contract enforcement prevents cascading failures.

### II. AI is a Component, Not the Controller

AI is used only where intelligence is required (understanding + analysis). All other steps are deterministic and strictly validated.

**Rationale**: Deterministic operations are testable, reproducible, and reliable. Constraining AI to specific stages prevents unpredictable behavior and maintains system control.

### III. Schema-First, Validation-Gated

Every stage produces output that MUST conform to a versioned schema. Backend validates before allowing transition to the next stage. Invalid output is rejected and retried with controlled policies.

**Rationale**: Validation gates prevent corrupted data from propagating through the pipeline. Schema versioning enables safe evolution and clear contract documentation.

### IV. Non-Text Content is Always Block + Reference

Text is text, math is math, image is image. Anything not pure text MUST be represented as an independent block and referenced via IDs (no embedding binaries or base64 in question content).

**Rationale**: Separation of content types enables specialized processing, validation, and rendering. Reference-based architecture prevents bloated schemas and enables efficient storage and caching.

### V. Traceability & Provenance by Design

Canonical content MUST be traceable back to extracted document blocks. Whenever possible, blocks carry origin/source mapping to prevent silent AI rewriting and to enable debugging/retry.

**Rationale**: Provenance enables debugging, validation, and explanation of AI decisions. It prevents content drift and supports compliance/audit requirements.

### VI. Determinism After Normalization

After canonical normalization, shuffling and variant generation MUST be fully deterministic and reproducible using seeds. Answer mapping MUST remain correct with stable IDs.

**Rationale**: Reproducibility is essential for testing, debugging, and legal/certification contexts where exam variants must be verifiable and auditable.

### VII. Idempotent, Retryable Tasks

All stages MUST be idempotent. Retries MUST NOT duplicate artifacts or corrupt state. Failures are isolated to a stage with controlled retry counts.

**Rationale**: Network failures, transient errors, and AI timeouts are inevitable. Idempotent design enables safe retries without manual intervention or state cleanup.

### VIII. Separation of Content vs Rendering

Canonical question/exam schema is content. Template/style is rendering. Render hints are optional and overridable by templates.

**Rationale**: Content/presentation separation enables independent evolution of data models and output formats. Templates can be updated without touching content schema.

### IX. Unit Testing Mandatory

Every feature and function MUST have unit tests. Tests are written BEFORE implementation (Test-Driven Development encouraged). Code without tests is considered incomplete.

**Requirements**:
- All business logic functions MUST have unit tests
- All API endpoints MUST have contract tests
- All data models MUST have validation tests
- Test coverage is tracked and reviewed in PRs
- Tests MUST be independent, repeatable, and fast

**Rationale**: Unit tests prevent regressions, document expected behavior, enable confident refactoring, and reduce debugging time. Testing first forces clear interfaces and testable design.

---

## Goals (What We Must Achieve)

The SiroMix V2 MVP MUST deliver:

- Accept flexible DOCX layouts without forcing rigid authoring formats
- Extract DOCX into a Document Intermediate JSON (DIJ) preserving order and block types
- Use an AI Understanding Agent to map DIJ → Canonical Question/Exam Schema (strict JSON output)
- (Optional) Use an AI Analysis Agent to add metadata (difficulty/tags/quality checks) without altering core content
- Deterministically generate multiple exam variants (shuffle questions/options) with correct answer mapping
- Export DOCX based on templates with stable formatting, including images and math rendering
- Provide task-based processing with `task_id`, stage status, progress, logs, and artifacts

---

## Non-Goals (Explicitly Out of Scope)

The following are explicitly OUT OF SCOPE for MVP:

- No full PC desktop app (Web App only)
- No premature full microservices deployment; start with modular monolith + workers
- No "AI rewriting" or paraphrasing of question content in understanding stage
- No multi-format ingestion beyond DOCX in initial milestone (PDF/image OCR later)
- No advanced collaborative editing or real-time multi-user authoring for MVP
- No heavy analytics/billing/enterprise tenancy at MVP stage

**Rationale**: These constraints reduce scope, enable faster delivery, and maintain focus on core value proposition. Non-goals may be revisited post-MVP.

---

## Canonical Data Representation Rules

### Block-Based Content

Canonical question content is an ordered list of `blocks`. Block types include at minimum: `text`, `math`, `image` (later: `shape`, `table`).

### Math Representation

Math MUST be stored as a `math` block with structured representation:

- **Primary**: LaTeX (and/or MathML)
- **Optional (recommended)**: OMML captured from DOCX for round-trip DOCX rendering
- Math MUST NEVER be stored as plain text approximations (e.g., "c2=a2+b2")

**Rationale**: LaTeX/MathML are standard, portable, and renderable across platforms. OMML preservation enables faithful DOCX round-tripping.

### Images & Shapes

- No base64 stored inside canonical question content
- Store binary in object storage; canonical blocks reference by `asset_id` or `image_id`
- **Shapes**:
  - MVP: store as rendered image asset
  - Future: optionally store `geometry JSON` for AI reasoning/editing

**Rationale**: External storage prevents schema bloat, enables CDN caching, and supports efficient binary handling.

### Stable IDs

Options MUST have stable internal IDs (e.g., `opt_1`), and display labels (A/B/C/D) are render-time and may change after shuffle.

**Rationale**: Stable IDs enable correct answer mapping after shuffling. Display labels are presentation concerns.

### Provenance

Canonical blocks SHOULD carry `origin/source_map` referencing DIJ blocks (doc block IDs) to enforce fidelity and enable debugging.

**Rationale**: See Principle V (Traceability & Provenance by Design).

---

## Task & Workflow Model

Each processing request creates a unique `task_id`. Task has:

- `status/stage` (parsing, ai_understanding, ai_analysis, shuffling, generating, completed, failed)
- `progress` (%)
- `logs`
- `retry_count` per stage
- `artifacts` pointers (source docx, DIJ, canonical schema, variants, outputs)

Workflow MUST support controlled retry per stage and MUST be idempotent.

**Rationale**: Task-based architecture enables async processing, progress visibility, debugging, and graceful failure handling.

---

## Architecture Decision (MVP)

**Modular Monolith with Workers**, microservice-ready boundaries.

- **Backend**: Python (FastAPI) + background workers (queue-based)
- **Frontend**: Next.js + Tailwind
- **Auth**: Google OAuth (ID token verification at backend)
- **Storage**:
  - Postgres for tasks, assets registry, artifacts metadata, templates metadata
  - Object storage (S3/MinIO) for uploads, assets, outputs
  - Redis (or equivalent) for job queue and caching

**Rationale**: Modular monolith reduces operational complexity while maintaining internal boundaries that enable future service extraction. Proven stack with strong ecosystem support.

---

## Security & Compliance

- Backend MUST verify Google ID token on every request requiring auth
- Object storage access via presigned URLs; never expose raw keys
- Validate and sanitize DOCX ingestion (size limits, file type checks)
- Log AI inputs/outputs as artifacts for debugging, with redaction options if needed later

**Rationale**: Security by design prevents vulnerabilities. Audit logging supports debugging and future compliance requirements.

---

## Quality Gates (Definition of Done)

A stage is considered **done** only if:

1. Output passes schema validation
2. Artifacts are persisted and referenced by IDs
3. Task state updated correctly with logs and progress
4. Stage is idempotent and safe to retry
5. Deterministic steps are reproducible with the same seed
6. Unit tests written and passing for all new code

**Rationale**: Quality gates prevent defects from propagating and ensure system reliability.

---

## Future-Proofing (Allowed Evolutions)

The following evolutions are **architecturally supported** and may be pursued post-MVP:

- Split services later (Extractor, AI, Render) without changing external API contracts
- Add more question types beyond multiple choice via `answer` object model
- Add PDF ingestion or OCR as separate pipeline stages
- Add UI review/human-in-the-loop stage for ambiguous parsing cases

**Rationale**: Architecture supports these extensions without requiring rewrites. Documenting allowed evolutions guides design decisions.

---

## Governance

This constitution supersedes all other practices and guidelines.

**Amendment Process**:

1. Proposed amendments MUST be documented with rationale
2. Breaking changes (principle removal/redefinition) require MAJOR version bump
3. New principles/sections require MINOR version bump
4. Clarifications/wording fixes require PATCH version bump
5. All amendments MUST include migration plan for affected code/docs

**Compliance**:

- All PRs/reviews MUST verify compliance with constitution principles
- Violations MUST be justified in `plan.md` Complexity Tracking section
- Constitution violations without justification block merge

**Versioning**:

- MAJOR.MINOR.PATCH format
- Constitution version MUST be updated in this file upon amendment
- Last Amended date MUST be updated to amendment approval date

---

**Version**: 1.1.0 | **Ratified**: 2026-02-22 | **Last Amended**: 2026-02-22
