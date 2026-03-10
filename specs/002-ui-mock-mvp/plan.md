# Implementation Plan: SiroMix UI MVP (Mock Data Phase)

**Branch**: `002-ui-mock-mvp` | **Date**: 2026-03-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-ui-mock-mvp/spec.md`

**Note**: This plan follows bottom-up architecture approach extracting exact Visily designs from html/ exports per clarifications session.

## Summary

Build a fully functional Next.js/React frontend MVP with mock data demonstrating the complete SiroMix exam processing user journey across 6 pages: Homepage with Vietnamese hero content, Google OAuth simulation, Create Exam form with file upload, simulated multi-stage processing pipeline (extract→understand→shuffle→generate), Preview Analysis page with question table, Task Management with polling updates, and Exam Detail with retry capability. Implementation MUST follow bottom-up approach: design tokens extracted from Visily CSS → atomic UI components (Button, Input, Badge) → shared molecules/organisms → page sections → final pages with Vietnamese content. All designs sourced from html/ folder exports (6 Visily HTML/CSS/React prototypes) preserving exact per-page styling values (purple #9a94de brand, Inter font, custom shadows/radius/padding). No backend integration—pure frontend with localStorage persistence and JavaScript timers for stage simulation.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14+ (App Router), React 18+  
**Primary Dependencies**: Next.js (framework), React (UI), @iconify/react (icons from Visily), Tailwind CSS (styling utility per Visily exports), Zustand or React Context (state management for mock data/auth)  
**Storage**: localStorage for task persistence, sessionStorage for auth state (no backend/database)  
**Testing**: Vitest (configured in frontend/vitest.config.ts), React Testing Library for component tests  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - last 2 versions), desktop-first minimum 1024px viewport  
**Project Type**: Web application - frontend-only SPA with client-side routing and mock data simulation  
**Performance Goals**: N/A for mock phase (simulated async operations use configurable timeouts 2-10s per stage)  
**Constraints**: Desktop-only viewport ≥1024px, Vietnamese language only (no i18n), 6 Visily page designs MUST be matched exactly (shadows, radius, padding per page), no backend API calls (pure frontend state)  
**Scale/Scope**: 6 pages (Homepage, Login, Create Exam, Preview, Task Management, Detail), 10-20 mock questions, unlimited mock tasks, bottom-up component architecture (tokens→atoms→molecules→organisms→templates→pages)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence/Notes |
|-----------|--------|----------------|
| **I. Pipeline-First** | ✅ PASS | UI simulates 5-stage pipeline (extract→understand→shuffle→generate→complete) with clear stage transitions. FR-017 defines sequential stages. Task entity tracks current stage. |
| **II. AI is Component** | ✅ N/A | No real AI in mock phase—simulated via timers. Backend integration in future will follow this principle. |
| **III. Schema-First, Validation-Gated** | ✅ PASS | Entities defined (User, Task, ExamData, Question, TaskLog) with typed attributes. Form validation gates (FR-013, FR-014) prevent invalid submissions. TypeScript provides compile-time schema validation. **Phase 1 Validation**: data-model.md documents all TypeScript interfaces with validation rules, Zod schemas defined in research.md for runtime validation. |
| **IV. Non-Text Content is Block+Ref** | ✅ N/A | Mock phase uses simple question text. Future: math/images will follow block architecture from 001-mvp-foundation. |
| **V. Traceability & Provenance** | ✅ PASS | TaskLog entity (FR-021) captures stage transitions with timestamps. Logs displayed in Exam Detail (FR-038). Retry events logged (FR-041). **Phase 1 Validation**: data-model.md defines TaskLog with timestamp, stage, level, message fields. Vietnamese log messages documented in contracts/pages.md. |
| **VI. Determinism After Normalization** | ✅ N/A | Shuffle/generate stages are simulated (no real logic). Future implementation will use seeds for reproducibility. |
| **VII. Idempotent, Retryable Tasks** | ✅ PASS | Retry button (FR-040, FR-041) resets task to Pending and restarts pipeline. Debouncing prevents duplicate retries (FR-042). Task state transitions are clean (status enum). **Phase 1 Validation**: research.md documents state machine with clear transitions, data-model.md shows TaskStatus enum, contracts/pages.md specifies retry button behavior on Exam Detail page. |
| **VIII. Separation of Content vs Rendering** | ✅ PASS | Design tokens centralized (FR-049: colors, fonts, spacing extracted from Visily). Components styled via tokens, not hardcoded values (FR-055, FR-056). Bottom-up architecture enforces reusability. **Phase 1 Validation**: research.md Section 1 extracts exact design tokens from Visily (purple #9a94de, Inter font, per-page spacing), contracts/pages.md preserves exact values per page per clarifications Q5. |
| **IX. Unit Testing Mandatory** | ✅ PASS | Vitest configured (frontend/vitest.config.ts). NFR-005 requires TypeScript and React best practices. Test plan required in Phase 2 (tasks.md will include test tasks). **Phase 1 Validation**: research.md Section 6 documents Vitest + RTL testing strategy with example tests for atoms/molecules/organisms. |

**Post-Design Constitution Compliance**: ✅ **PASS** — All Phase 1 deliverables (research.md, data-model.md, contracts/pages.md) align with constitution principles. Design artifacts enforce schema-first validation (Principle III), content/rendering separation (Principle VIII), and testing requirements (Principle IX). Bottom-up component architecture documented in research.md prevents page-first violations. Vietnamese content extraction from Visily preserves traceability (Principle V).

## Project Structure

### Documentation (this feature)

```text
specs/002-ui-mock-mvp/
├── spec.md              # Feature specification (input)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (design system extraction from Visily)
├── data-model.md        # Phase 1 output (frontend entities/types)
├── quickstart.md        # Phase 1 output (local dev setup)
├── contracts/           # Phase 1 output (component API contracts)
│   ├── components.md    # Atomic design component hierarchy
│   └── pages.md         # Page-level contracts with routing
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created yet)
```

### Source Code (repository root)

```text
frontend/                              # Next.js application (this feature)
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── page.tsx                  # Homepage (US1)
│   │   ├── login/                    # Login page (US2)
│   │   ├── create-exam/              # Create Exam form (US3)
│   │   ├── preview/                  # Preview Analysis (US4 - confirmation)
│   │   ├── tasks/                    # Task Management list (US5)
│   │   └── tasks/[id]/               # Exam Detail view (US6)
│   ├── components/
│   │   ├── ui/                       # Atomic components (Button, Input, Badge, etc.)
│   │   ├── layout/                   # Navbar, PageLayout, Footer
│   │   ├── forms/                    # FormField, ExamForm
│   │   └── features/                 # ExamMetadata, ProcessingStatus, QuestionList
│   ├── lib/
│   │   ├── design-tokens.ts          # Visily-extracted colors, fonts, spacing
│   │   ├── types.ts                  # User, Task, ExamData, Question, TaskLog
│   │   └── utils.ts                  # Helpers, formatters
│   ├── stores/                       # Zustand stores or React Context providers
│   │   ├── authStore.ts              # Mock user session, authentication state
│   │   └── taskStore.ts              # Task list, CRUD operations, polling logic
│   └── mocks/
│       ├── userData.ts               # Mock Trieu Kiem user with Vietnamese data
│       └── examData.ts               # Mock questions (10-20) in Vietnamese
├── public/
│   └── assets/                       # Copied from html/ Visily exports
│       └── IMG_1.webp                # Trieu Kiem avatar
├── tests/
│   ├── unit/                         # Component unit tests (Vitest + RTL)
│   └── integration/                  # Page integration tests
├── package.json                      # Dependencies: @iconify/react, zustand, etc.
└── vitest.config.ts                  # Test configuration

backend/                               # Not modified in this feature (existing 001-mvp)
infra/                                 # Not modified in this feature
html/                                  # Visily design exports (READ-ONLY reference)
├── SiroMix - Homepage/
├── SiroMix - Login Screen/
├── SiroMix- Create New Exam/
├── SiroMix - Task Management/
├── SiroMix - Exam Detail/
└── SiroMix - Exam Analysis Result/
```

**Structure Decision**: Web application (frontend + backend) structure already established by 001-mvp-foundation feature. This feature exclusively modifies `frontend/` directory following Next.js App Router conventions with bottom-up component organization (ui atoms → layout molecules → feature organisms → page templates). The `html/` folder serves as read-only design reference (Visily exports) for extracting exact styling values per clarifications. All 6 Visily page exports map 1:1 to Next.js app routes (SiroMix - Homepage → app/page.tsx, SiroMix - Login Screen → app/login/page.tsx, etc.).

## Complexity Tracking

**Not Applicable** — No constitution violations detected. Feature complies with all SiroMix architectural principles. Bottom-up component architecture enforced via functional requirements (FR-048 through FR-056) prevents unnecessary complexity. Mock phase simplicity (no backend, no real AI) keeps scope minimal.
