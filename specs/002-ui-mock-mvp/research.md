# Research: SiroMix UI MVP (Mock Data Phase)

**Feature**: 002-ui-mock-mvp  
**Date**: 2026-03-10  
**Purpose**: Resolve technical unknowns before implementation

---

## Research Tasks

### 1. Design Token Extraction from Visily Designs

**Decision**: Extract design tokens from Visily exported HTML (`./html/`) to create centralized design system with exact values

**Rationale**: 
- Design tokens centralize visual consistency (colors, typography, spacing)
- Enable theme-ability and easy visual updates without touching components
- Prevent hardcoded styles scattered across codebase
- **Clarifications confirmed**: Purple brand #9a94de, preserve exact Visily values per page (shadows, radius, padding)
- 6 Visily CSS files analyzed to extract actual design system values

**Findings from Visily CSS/React Analysis**:

**Colors** (extracted from `html/*/src/style.css`):
```typescript
export const colors = {
  brand: {
    primary: '#9a94de',      // Purple brand - buttons, logo, badges, accents
    light: '#9a94de0d',      // 5% opacity backgrounds
  },
  text: {
    dark: '#171a1f',         // Headings, primary content
    gray: '#565d6d',         // Secondary text, labels
  },
  border: '#dee1e6',         // Card borders, dividers
  background: {
    main: '#fcfcfd',         // Off-white subtle background
    white: '#ffffff',        // Pure white for cards
  },
  status: {
    success: '#39a85e',      // Completed tasks (green)
    warning: '#fcb831',      // Medium confidence (yellow)
    error: '#d3595e',        // Failed, low confidence (red)
    processing: '#9a94de',   // Processing stages (purple)
    pending: '#6b7280',      // Pending/gray states
  }
}
```

**Typography** (consistent across all 6 exports):
```typescript
export const typography = {
  fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  letterSpacing: {
    heading: '-0.02em',      // For headlines
    tight: '-0.5px',         // For tight text
  },
  fontSmoothing: 'antialiased',  // -webkit-font-smoothing
}
```

**Spacing & Layout** (per-page variations per clarifications):
- Homepage: `px-4 lg:px-[144px]` (wider for hero section)
- Create Exam: `px-4 lg:px-36` (medium for form)
- Task Management: `px-4 lg:px-32` (tighter for table density)
- Exam Detail: `px-4 lg:px-[120px]` (balanced for content)
- Login: Centered card `max-w-[560px]`
- Preview: Container `max-w-[1152px]`

**Decision**: Document in `contracts/pages.md`, use exact classes per page (NO normalization)

**Border Radius** (context-specific):
- Inputs: `rounded-md`
- Cards/Logo container: `rounded-[10px]`
- Large cards: `rounded-xl`
- Medium components: `rounded-lg`
- Avatars/Badges: `rounded-full`

**Shadows** (multiple definitions):
- Standard: `shadow-sm`
- Custom card: `shadow-[0px_2px_5px_0px_#171a1f17,_0px_0px_2px_0px_#171a1f1f]`
- Auth card: `shadow-[0px_10px_25px_rgba(23, 26, 31, 0.08)]`

**Custom CSS Classes** (from Visily):
- `custom-dashed-border`: SVG data URI for file upload dotted border
- `custom-scrollbar`: 5-6px width, `#e5e7eb` thumb color
- `hide-scrollbar`: MS/webkit variants for hiding scrollbars
- `step-line-active`: Green gradient for progress steps
- `log-container`: `font-feature-settings: "tnum"` for tabular numbers

**Vietnamese Language** (per clarifications Q2):
- All UI text in Vietnamese extracted from Visily App.tsx files
- Examples: "Đăng nhập" (Login), "Tạo đề mới" (Create Exam), "Xác nhận" (Confirm)
- **Implementation**: Centralized in `src/constants/content.ts` with semantic keys

**Approach**:
1. Create `src/lib/design-tokens.ts` with exact Visily values above
2. Create `src/styles/custom.css` with custom CSS classes (dashed-border, scrollbar, etc.)
3. Configure Tailwind CSS to extend theme with purple brand, exact spacing values
4. Create `src/constants /content.ts` with all Vietnamese text from Visily exports

**Alternatives Considered**:
- ❌ Normalize all values to single scale → Rejected: Clarifications Q5 requires preserving exact Visily values per page
- ❌ Use Tailwind default theme → Rejected: Doesn't match purple brand #9a94de or Visily spacing
- ✅ Extract exact values + preserve per-page variations → Honors design intent, passes clarifications

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

**Decision**: Hardcoded TypeScript objects in `lib/mock-data/` with factory functions + Vietnamese content

**Rationale**:
- FR-046 requires configurable mock data with Trieu Kiem user (Vietnamese email, Visily avatar)
- **Clarifications confirmed**: User "Trieu Kiem", email "trieu.kiem@university.edu", avatar "./assets/IMG_1.webp"
- All question content in Vietnamese matching Visily exports
- TypeScript ensures mock data matches real data model interfaces
- Factory functions enable generating varied mock data for testing
- Easy to replace with API calls in future (same interfaces, different source)

**Mock Data Files**:
1. `lib/mock-data/users.ts`: Mock Trieu Kiem user with Vietnamese email and Visily avatar
   ```typescript
   export const mockUser: User = {
     user_id: 'user-1',
     name: 'Trieu Kiem',
     email: 'trieu.kiem@university.edu',
     avatar_url: '/assets/IMG_1.webp',  // Copied from html/SiroMix - Homepage/assets/
     authentication_status: true,
   };
   ```

2. `lib/mock-data/questions.ts`: 15-20 mock exam questions in Vietnamese
   ```typescript
   export const mockQuestions: Question[] = [
     {
       question_id: 'q1',
       question_text: 'Thủ đô của Việt Nam là gì?',  // Vietnamese content
       options: ['Thành phố Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ'],
       correct_answer: 'B',
       question_order: 1,
     },
     // ... 14-19 more questions in Vietnamese
   ];
   ```

3. `lib/mock-data/tasks.ts`: Factory function `createMockTask(metadata)` returns Task object

**Vietnamese Content Constants** (`src/constants/content.ts`):
- Extracted from Visily App.tsx files across all 6 pages
- Buttons: "Đăng nhập", "Tạo đề mới", "Xác nhận", "Thử lại", "Tải xuống"
- Labels: "Tên kì thi", "Môn học", "Thời gian (phút)", "Số đề cần trộn"
- Messages: "Đã bắt đầu xử lý đề thi", "Xem trước kết quả phân tích"
- Status: "Chờ xử lý", "Đang trích xuất", "Đang phân tích", "Hoàn thành", "Thất bại"

**Icon Strategy** (per clarifications Q4):
- Standard icons: `@iconify/react` library (already installed)
  - Examples: `lucide:search`, `lucide:calendar`, `lucide:download`, `lucide:chevron-down`
- Custom logo: Extract 3-layer SVG from Visily exports as `src/components/ui/SiroMixLogo.tsx`

**Asset Copying**:
- Copy `html/SiroMix - Homepage/assets/IMG_1.webp` to `frontend/public/assets/IMG_1.webp`
- Reference in mock user avatar: `/assets/IMG_1.webp`

**Alternatives Considered**:
- ❌ English content with placeholder user → Rejected: Clarifications Q2 requires Vietnamese matching Visily
- ❌ Generic "John Doe" → Rejected: Clarifications Q3 requires Trieu Kiem from Visily
- ❌ Fetch from JSON file → Rejected: Adds HTTP request overhead, TypeScript support requires extra setup
- ✅ Hardcoded TypeScript with Vietnamese + Trieu Kiem → Matches clarifications, type-safe, easy to use

---

## Summary of Decisions

| Research Area | Decision | Key Rationale |
|---------------|----------|---------------|
| Design Tokens | Extract from Visily HTML with exact values: purple #9a94de, Inter font, per-page spacing | Visual consistency (FR-056), clarifications Q1/Q5 (preserve exact values) |
| Component Architecture | Atomic Design, bottom-up order | FR-048 mandate, reusability (FR-055) |
| State Management | Zustand with localStorage persistence | Lightweight, TypeScript-friendly, persistence (FR-045) |
| Pipeline Simulation | Timer-based state machine, configurable durations | FR-017, FR-019, testable (NFR-007) |
| Form Validation | React Hook Form + Zod | Performance, type safety, inline feedback (NFR-003) |
| Component Testing | Vitest + React Testing Library | Fast, user-behavior focused, Principle IX |
| Mock Data | Hardcoded TypeScript with Trieu Kiem user + Vietnamese content from Visily | Clarifications Q2/Q3 (Vietnamese, Trieu Kiem), type safety (FR-046) |
| Icons | @iconify/react for standard + custom SVG logo component | Clarifications Q4, leverages installed package |
| Language | Vietnamese content constants extracted from Visily App.tsx files | Clarifications Q2 (all UI in Vietnamese) |

**Clarifications Compliance**:
- ✅ Q1: Purple brand #9a94de + exact Visily layouts per page → Design tokens + contracts
- ✅ Q2: Vietnamese UI text → Content constants + mock questions in Vietnamese
- ✅ Q3: Trieu Kiem user → Mock user data with university email and Visily avatar
- ✅ Q4: @iconify + custom logo → Icon strategy documented
- ✅ Q5: Preserve exact values per page → Per-page spacing/shadows/radius documented

All decisions align with constitutional principles (Schema-First, Testing Mandatory) and FR-048 bottom-up implementation mandate.
