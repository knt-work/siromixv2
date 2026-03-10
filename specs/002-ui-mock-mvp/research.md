# Research: SiroMix UI MVP (Mock Data Phase)

**Feature**: 002-ui-mock-mvp  
**Date**: 2026-03-10  
**Purpose**: Resolve technical unknowns before implementation

---

## Research Tasks

### 1. Design Token Extraction from Visily Designs

**Decision**: Extract design tokens from Visily exported HTML (`./html/`) to create centralized design system

**Rationale**: 
- Design tokens centralize visual consistency (colors, typography, spacing)
- Enable theme-ability and easy visual updates without touching components
- Prevent hardcoded styles scattered across codebase
- Visily exports contain CSS variables and computed styles that can be systematically extracted

**Approach**:
1. Inspect Visily HTML/CSS for color palette, typography scales, spacing units
2. Create `src/components/design-system/tokens.ts` with categorized tokens:
   - **Colors**: primary, secondary, success, warning, error, gray scale, status badges
   - **Typography**: font families, size scale, line heights, font weights
   - **Spacing**: 4px/8px grid system (spacing scale: xs=4px, sm=8px, md=16px, lg=24px, xl=32px, 2xl=48px)
   - **Border Radius**: button radius, card radius, input radius
   - **Shadows**: card shadow, modal shadow, hover shadow
   - **Breakpoints**: desktop-only (1024px minimum, 1280px, 1536px)
3. Export tokens as TypeScript constants for type safety
4. Configure Tailwind CSS to use custom tokens (extend theme in tailwind.config.js)

**Example Token Structure**:
```typescript
export const colors = {
  primary: { 50: '#...', 500: '#...', 900: '#...' },
  gray: { 50: '#...', 500: '#...', 900: '#...' },
  status: {
    pending: '#6B7280',      // gray
    extracting: '#3B82F6',   // blue
    understanding: '#3B82F6', // blue
    awaiting: '#F59E0B',     // amber
    shuffling: '#8B5CF6',    // purple
    generating: '#8B5CF6',   // purple
    completed: '#10B981',    // green
    failed: '#EF4444'        // red
  }
}
```

**Alternatives Considered**:
- Option: Use Tailwind default theme → Rejected: Doesn't match Visily designs, inconsistent visual identity
- Option: Hardcode styles in components → Rejected: Violates FR-056, difficult to maintain consistency

---

### 2. Component Architecture Pattern Selection

**Decision**: Adopt **Atomic Design** with strict bottom-up implementation order

**Rationale**:
- FR-048 mandates bottom-up order: Design Foundations → Core UI Elements → Shared Components → App Layout → Feature Sections → Pages
- Atomic Design provides proven hierarchy: atoms → molecules → organisms → templates → pages
- Enforces reusability and prevents "page-first" development (NFR-014)
- Each layer composes from previous layer, ensuring no circular dependencies

**Implementation Order** (per FR-048):
1. **Design Foundations** (`components/design-system/`): tokens.ts, theme.ts
2. **Atoms** (`components/ui/`): Button, Input, Badge, Avatar, ProgressBar, Spinner
3. **Molecules** (`components/shared/`): Card, FormField (Label+Input+Error), StatusBadge, FileUpload
4. **Organisms** (`components/shared/`, `components/sections/`): Modal, Datatable, ExamMetadata, ProcessingStatus, QuestionList, CreateExamForm
5. **Templates** (`components/layout/`): Navbar, PageContainer, AuthGuard
6. **Pages** (`app/*/page.tsx`): Compose from templates, organisms, molecules

**Component Guidelines**:
- All components accept props for customization (no tight coupling)
- All components use design tokens (no hardcoded colors/spacing)
- All components are co-located with styles (if using CSS modules) or styled via Tailwind
- All components have TypeScript interfaces for props
- All base components have Storybook-style documentation (comments describing usage)

**Alternatives Considered**:
- Option: Feature-based architecture → Rejected: Leads to duplication, harder to maintain consistency
- Option: Page-first development → Rejected: Violates FR-054, NFR-014, creates one-off patterns

---

### 3. State Management Approach

**Decision**: Use **Zustand** for global state with localStorage persistence

**Rationale**:
- Lightweight (3KB) compared to Redux (20KB), simpler API than Redux Toolkit
- Built-in middleware for localStorage persistence (maintains state across page refreshes per FR-045)
- TypeScript-friendly with minimal boilerplate
- Easy to replace with real API calls in future (clear store actions map to API endpoints)
- Works well with React 18+ and Next.js 14 App Router (no SSR hydration issues)

**State Stores**:
1. **Auth Store** (`lib/state/auth-store.ts`):
   - State: `user: User | null`, `isAuthenticated: boolean`, `isLoading: boolean`
   - Actions: `login(mockUser)`, `logout()`, `checkAuth()`
   - Persisted: localStorage key `auth-state`

2. **Task Store** (`lib/state/task-store.ts`):
   - State: `tasks: Task[]`, `currentTask: Task | null`
   - Actions: `createTask(metadata)`, `updateTaskStatus(id, status, progress)`, `retryTask(id)`, `addTaskLog(id, log)`
   - Persisted: localStorage key `task-state`

**Polling Strategy**:
- Custom hook `useTaskPolling` wraps `setInterval` with cleanup
- Checks task status every 3 seconds (configurable via NFR-006)
- Updates store via `updateTaskStatus` action
- Stops polling when task reaches "completed" or "failed"
- Resumes polling on retry

**Alternatives Considered**:
- Option: Redux Toolkit → Rejected: Heavier, more boilerplate, overkill for mock data
- Option: React Context → Rejected: Performance issues with frequent updates (polling every 3s), no built-in persistence
- Option: TanStack Query (React Query) → Rejected: Designed for server data, unnecessary for pure frontend mock

---

### 4. Processing Pipeline Simulation

**Decision**: Use **timer-based state machine** with configurable stage durations

**Rationale**:
- FR-017 requires 5 sequential stages: extract → understand → shuffle → generate → completed
- FR-019 specifies progress increments: 0-25%, 25-50%, 50-75%, 75-100%
- FR-018 requires pause after "understand" stage for manual confirmation
- Configurable timers (NFR-007) enable testing rapid vs slow scenarios

**Implementation** (`lib/simulation/pipeline.ts`):
```typescript
const STAGE_DURATIONS = {
  extract: 5000,        // 5 seconds (configurable)
  understand: 5000,     // 5 seconds
  shuffle: 5000,        // 5 seconds (after confirmation)
  generate: 5000,       // 5 seconds
};

const STAGE_PROGRESS = {
  pending: 0,
  extracting: 12,       // midpoint of 0-25%
  understanding: 37,    // midpoint of 25-50%
  awaiting: 50,         // paused at 50%
  shuffling: 62,        // midpoint of 50-75%
  generating: 87,       // midpoint of 75-100%
  completed: 100,
};

async function simulateStage(taskId, stage, onProgress) {
  const duration = STAGE_DURATIONS[stage];
  await sleep(duration);
  onProgress(taskId, stage, STAGE_PROGRESS[stage]);
}
```

**State Machine**:
- **Pending** → start timer → **Extracting** (0-25% progress)
- **Extracting** → timer completes → **Understanding** (25-50% progress)
- **Understanding** → timer completes → **Awaiting Confirmation** (50% progress, PAUSE)
- **Awaiting Confirmation** → user clicks Confirm → **Shuffling** (50-75% progress)
- **Shuffling** → timer completes → **Generating** (75-100% progress)
- **Generating** → timer completes → **Completed** (100% progress)

**Failure Simulation** (FR-022):
- Optional `simulateFailureStage` parameter on task creation
- If set, task fails at specified stage with mock error message
- Status changes to "Failed", error stored in task.error field

**Alternatives Considered**:
- Option: Immediate status changes → Rejected: Doesn't simulate realistic processing time, SC-004 requires 60 seconds total
- Option: Random delays → Rejected: Makes testing unpredictable, violates NFR-007 (configurable durations)

---

### 5. Form Validation Strategy

**Decision**: Use **React Hook Form** with **Zod** schema validation

**Rationale**:
- React Hook Form is performant (uncontrolled inputs, minimal re-renders)
- Zod provides runtime type safety and validation schema that matches TypeScript types
- FR-013 requires clear error messages and validation before submission
- FR-014 requires numeric field validation (duration > 0, versions 1-10)
- Inline validation provides immediate feedback (NFR-003)

**Validation Schema Example** (`lib/validation/create-exam-schema.ts`):
```typescript
import { z } from 'zod';

export const createExamSchema = z.object({
  academicYear: z.string().min(1, 'Academic year is required'),
  examName: z.string().min(1, 'Exam name is required'),
  subject: z.string().min(1, 'Subject is required'),
  duration: z.number().int().positive('Duration must be greater than 0'),
  numVersions: z.number().int().min(1).max(10, 'Number of versions must be between 1 and 10'),
  notes: z.string().optional(),
  file: z.instanceof(File).refine(
    (file) => file.name.endsWith('.doc') || file.name.endsWith('.docx'),
    'File must be a Word document (.doc or .docx)'
  ),
});
```

**Form Implementation**:
- `useForm()` hook from React Hook Form
- `zodResolver(createExamSchema)` for validation
- Error messages displayed inline via `<FormField>` molecule component
- Submit button disabled until form is valid

**Alternatives Considered**:
- Option: Manual validation → Rejected: Error-prone, difficult to maintain, no type safety
- Option: Formik → Rejected: React Hook Form is more performant, better TypeScript support
- Option: Yup for validation → Rejected: Zod provides better TypeScript integration and inference

---

### 6. Component Testing Approach

**Decision**: **Vitest + React Testing Library** for unit/integration tests

**Rationale**:
- Vitest is fast, has Vite integration, compatible with Next.js 14
- React Testing Library encourages testing user behavior over implementation details
- Principle IX requires unit tests for all components
- Existing setup from 001-mvp-foundation (frontend/vitest.config.ts)

**Testing Strategy**:
- **Atoms** (Button, Input, Badge): Test variants, states (disabled, loading), accessibility (aria-labels)
- **Molecules** (FormField, Card): Test composition (renders child components), error display, interactions
- **Organisms** (Datatable, ExamForm): Test data flow, user interactions (submit, pagination), validation
- **Pages**: Optional E2E with Playwright (manual testing acceptable for MVP per spec)

**Example Test** (`components/ui/Button.test.tsx`):
```typescript
import { render, screen, userEvent } from '@testing-library/react';
import Button from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
});

test('calls onClick when clicked', async () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  await userEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledOnce();
});

test('does not call onClick when disabled', async () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick} disabled>Click me</Button>);
  await userEvent.click(screen.getByRole('button'));
  expect(handleClick).not.toHaveBeenCalled();
});
```

**Alternatives Considered**:
- Option: Jest → Rejected: Vitest is faster, better Vite/Next.js integration
- Option: Enzyme → Rejected: Deprecated, React Testing Library is community standard
- Option: Cypress Component Testing → Rejected: Overkill for unit tests, better suited for E2E

---

### 7. Mock Data Structure

**Decision**: Hardcoded TypeScript objects in `lib/mock-data/` with factory functions

**Rationale**:
- FR-046 requires configurable mock data (10-20 questions, mock user)
- TypeScript ensures mock data matches real data model interfaces
- Factory functions enable generating varied mock data for testing
- Easy to replace with API calls in future (same interfaces, different source)

**Mock Data Files**:
1. `lib/mock-data/users.ts`: 1 mock user (John Doe, email, avatar URL)
2. `lib/mock-data/questions.ts`: 15 mock exam questions with 4 options each, correct answer
3. `lib/mock-data/tasks.ts`: Factory function `createMockTask(metadata)` returns Task object

**Example Mock Question**:
```typescript
export const mockQuestions: Question[] = [
  {
    question_id: 'q1',
    question_text: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correct_answer: 'C',
    question_order: 1,
  },
  // ... 14 more questions
];
```

**Alternatives Considered**:
- Option: Fetch from JSON file → Rejected: Adds HTTP request overhead, TypeScript support requires extra setup
- Option: Use faker.js → Rejected: Generates random data, makes testing unpredictable, FR-046 specifies "configurable" not "random"

---

## Summary of Decisions

| Research Area | Decision | Key Rationale |
|---------------|----------|---------------|
| Design Tokens | Extract from Visily HTML, centralize in tokens.ts | Visual consistency (FR-056), theme-ability (NFR-011) |
| Component Architecture | Atomic Design, bottom-up order | FR-048 mandate, reusability (FR-055) |
| State Management | Zustand with localStorage persistence | Lightweight, TypeScript-friendly, persistence (FR-045) |
| Pipeline Simulation | Timer-based state machine, configurable durations | FR-017, FR-019, testable (NFR-007) |
| Form Validation | React Hook Form + Zod | Performance, type safety, inline feedback (NFR-003) |
| Component Testing | Vitest + React Testing Library | Fast, user-behavior focused, Principle IX |
| Mock Data | Hardcoded TypeScript with factory functions | Type safety, configurable (FR-046), easy replacement |

All decisions align with constitutional principles (Schema-First, Testing Mandatory) and FR-048 bottom-up implementation mandate.
