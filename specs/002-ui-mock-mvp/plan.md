# Implementation Plan: SiroMix UI MVP (Mock Data Phase)

**Branch**: `002-ui-mock-mvp` | **Date**: 2026-03-10 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/002-ui-mock-mvp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement complete frontend user experience for SiroMix exam processing workflow using **mock data and simulated backend** - no real API integration in this phase. Build UI foundation using **bottom-up architecture**: design tokens → atomic components → compound components → page sections → composed pages. Implement 6 prioritized user journeys: (1) Homepage & Navigation, (2) Simulated OAuth Authentication, (3) Create Exam Form, (4) Preview & Confirmation of extracted data, (5) Task Management with polling, (6) Exam Detail with retry. Technical approach: Next.js 14+ with TypeScript, component library following atomic design principles, frontend state management (React Context/Zustand), simulated processing pipeline using timers, localStorage for state persistence. All UI components are reusable, theme-able via design tokens derived from Visily designs, and architected for seamless backend integration in future phases.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14+ (App Router), React 18+  
**Primary Dependencies**: Next.js 14+, React 18+, TypeScript 5.x, Tailwind CSS 3.x (or alternative CSS-in-JS), state management library (Zustand/Redux/React Context), React Hook Form for forms, date-fns for timestamps  
**Storage**: Frontend-only: localStorage/sessionStorage for state persistence (authentication state, task list), no backend database in this phase  
**Testing**: Vitest for unit tests (components, utilities), React Testing Library for component integration tests, optional Playwright for E2E (manual testing acceptable for MVP)  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - last 2 versions), desktop-first (minimum 1024px viewport width)  
**Project Type**: Web application frontend (SPA with client-side routing), mock UI phase - no backend integration  
**Performance Goals**: Page load <2s, component render <100ms, simulated polling updates every 3s without UI lag, form validation <50ms response  
**Constraints**: Desktop-only (no mobile responsive required for MVP), English-only (no i18n), no accessibility compliance beyond semantic HTML, mock data only (no real file processing)  
**Scale/Scope**: 6 main pages (Homepage, Login, Create Exam, Preview, Task Management, Exam Detail), ~30-40 reusable UI components, 5-stage simulated pipeline, 10-20 mock exam questions, support for 20+ task records with pagination

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Principle I (Pipeline-First)**: N/A for this feature  
This feature simulates the 5-stage pipeline (extract → understand → shuffle → generate) using frontend timers, but does not implement the real pipeline architecture. Real pipeline implementation deferred to future features.

✅ **Principle II (AI is a Component, Not the Controller)**: N/A for this feature  
No AI integration in this mock UI phase. AI understanding/analysis stages are simulated with mock data only.

✅ **Principle III (Schema-First, Validation-Gated)**: PASS  
TypeScript interfaces define strict schemas for mock data models (User, Task, ExamData, Question, TaskLog). Mock task status transitions follow defined enum values. Frontend validates form inputs before submission (FR-013, FR-014).

✅ **Principle IV (Non-Text Content is Always Block + Reference)**: N/A for this feature  
No real document content processing. Mock exam data uses simple text strings, not block-based architecture. Real block implementation deferred to future features.

✅ **Principle V (Traceability & Provenance by Design)**: N/A for this feature  
Mock data has no provenance requirements. Future: when real extraction is implemented, TaskLog entries will provide audit trail.

✅ **Principle VI (Determinism After Normalization)**: N/A for this feature  
No real shuffle/variant generation. Simulated processing uses configurable timers, not deterministic algorithms. Real determinism deferred to future features.

✅ **Principle VII (Idempotent, Retryable Tasks)**: PASS  
Simulated retry mechanism (FR-041) is idempotent: resets task to Pending, restarts from extract stage, logs retry event. Retry button is debounced/disabled during processing (FR-042) to prevent duplicate actions. Mock implementation prepares for real idempotent backend tasks.

✅ **Principle VIII (Separation of Content vs Rendering)**: PASS (with future preparation)  
UI components separate data (props) from presentation (rendering logic). Design tokens separate styling values from component implementation (NFR-011). This establishes pattern for future content/template separation.

✅ **Principle IX (Unit Testing Mandatory)**: PASS  
Component testing framework established (Vitest + React Testing Library). All reusable UI components require unit tests. Form validation logic requires tests. State management utilities require tests. Testing infrastructure enables TDD for future features.

**Status**: ✅ **ALL APPLICABLE PRINCIPLES SATISFIED**  
**Complexity Violations**: None

## Project Structure

### Documentation (this feature)

```text
specs/002-ui-mock-mvp/
├── spec.md              # Feature specification (already created)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── components.md    # Component API contracts and props interfaces
├── checklists/
│   └── requirements.md  # Quality validation (already created)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/                          # Existing Next.js 14 project from 001-mvp-foundation
├── src/
│   ├── app/                       # Next.js 14 App Router (pages)
│   │   ├── (auth)/                # Auth route group
│   │   │   └── login/
│   │   │       └── page.tsx       # Login page (US2)
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Homepage/Dashboard (US1)
│   │   ├── exams/
│   │   │   ├── create/
│   │   │   │   └── page.tsx       # Create Exam form (US3)
│   │   │   ├── preview/
│   │   │   │   └── [taskId]/
│   │   │   │       └── page.tsx   # Preview Analysis (US4)
│   │   │   └── [taskId]/
│   │   │       └── page.tsx       # Exam Detail (US6)
│   │   ├── tasks/
│   │   │   └── page.tsx           # Task Management (US5)
│   │   ├── guide/
│   │   │   └── page.tsx           # User Guide (static content)
│   │   ├── page.tsx               # Root homepage redirect
│   │   ├── layout.tsx             # Root layout with Navbar
│   │   └── globals.css            # Global styles, Tailwind imports
│   │
│   ├── components/                # UI components (atomic design)
│   │   ├── design-system/         # **PHASE 1: Design Foundations**
│   │   │   ├── tokens.ts          # Design tokens (colors, spacing, typography, etc.)
│   │   │   └── theme.ts           # Theme configuration
│   │   │
│   │   ├── ui/                    # **PHASE 2: Core UI Elements (Atoms)**
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Icon.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── Spinner.tsx
│   │   │
│   │   ├── shared/                # **PHASE 3: Shared Components (Molecules/Organisms)**
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Datatable.tsx
│   │   │   ├── FormField.tsx      # Label + Input + Error wrapper
│   │   │   ├── StatusBadge.tsx    # Specialized badge with color mapping
│   │   │   ├── LogViewer.tsx
│   │   │   └── FileUpload.tsx
│   │   │
│   │   ├── layout/                # **PHASE 4: App Layout Structure**
│   │   │   ├── Navbar.tsx         # Adaptive navbar (US1, US2)
│   │   │   ├── Sidebar.tsx        # Optional sidebar
│   │   │   ├── PageContainer.tsx  # Consistent page wrapper
│   │   │   └── AuthGuard.tsx      # Authentication check wrapper
│   │   │
│   │   ├── sections/              # **PHASE 5: Feature-Level Sections (Organisms)**
│   │   │   ├── ExamMetadata.tsx   # Display exam metadata (US6)
│   │   │   ├── ProcessingStatus.tsx # Display status, progress, logs (US6)
│   │   │   ├── QuestionList.tsx   # Display question list (US4, US6)
│   │   │   ├── TaskSummaryCard.tsx # Task row in datatable (US5)
│   │   │   ├── CreateExamForm.tsx # Full form for exam creation (US3)
│   │   │   └── ProcessingModal.tsx # Modal for processing stages (US4)
│   │   │
│   │   └── pages/                 # **PHASE 6: Page-Level Components** (if needed)
│   │       └── (Page-specific components that don't fit elsewhere)
│   │
│   ├── lib/                       # **PHASE 7: Mock Data, State, Utilities**
│   │   ├── mock-data/
│   │   │   ├── users.ts           # Mock user data
│   │   │   ├── tasks.ts           # Mock task data
│   │   │   └── questions.ts       # Mock exam questions (10-20 questions)
│   │   ├── state/
│   │   │   ├── auth-store.ts      # Authentication state (Zustand/Context)
│   │   │   ├── task-store.ts      # Task management state
│   │   │   └── storage.ts         # localStorage/sessionStorage utilities
│   │   ├── simulation/
│   │   │   ├── pipeline.ts        # Simulated processing pipeline with timers
│   │   │   ├── polling.ts         # Polling logic and intervals
│   │   │   └── oauth.ts           # Simulated OAuth flow
│   │   └── utils/
│   │       ├── validation.ts      # Form validation utilities
│   │       ├── formatters.ts      # Date, progress formatting
│   │       └── constants.ts       # Enums, constants
│   │
│   ├── types/                     # **TypeScript types and interfaces**
│   │   ├── user.ts                # User interface
│   │   ├── task.ts                # Task, TaskLog interfaces
│   │   ├── exam.ts                # ExamData, Question interfaces
│   │   └── index.ts               # Re-exports
│   │
│   └── hooks/                     # **PHASE 8: Custom React hooks**
│       ├── useAuth.ts             # Authentication state hook
│       ├── useTaskPolling.ts      # Polling hook (US5, US6)
│       ├── useSimulation.ts       # Processing simulation hook
│       └── useLocalStorage.ts     # localStorage persistence hook
│
├── tests/
│   ├── setup.ts
│   ├── unit/
│   │   ├── components/            # Component unit tests
│   │   └── utils/                 # Utility function tests
│   └── e2e/                       # Optional E2E tests (Playwright)
│       └── task-lifecycle.spec.ts
│
├── public/
│   └── (Static assets, images, icons)
│
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── vitest.config.ts
```

**Structure Decision**: **Frontend-only implementation** expanding the existing Next.js 14 project from feature 001-mvp-foundation. Architecture follows **atomic design principles** with strict separation of concerns: design tokens → atoms → molecules → organisms → templates → pages. This bottom-up approach ensures all UI components are reusable, testable, and ready for future backend integration. Mock data and simulation logic are isolated in `lib/` directory for easy replacement with real API calls in Phase 2. State management uses Zustand (or React Context) with localStorage persistence to simulate backend sessions. No backend code changes required for this feature - purely frontend scaffold.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - All applicable constitutional principles are satisfied. No complexity violations to track.
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
