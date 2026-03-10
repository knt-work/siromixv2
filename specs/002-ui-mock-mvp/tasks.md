# Tasks: SiroMix UI MVP (Mock Data Phase)

**Feature**: 002-ui-mock-mvp  
**Input**: Design documents from `/specs/002-ui-mock-mvp/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/components.md ✅

**Tests**: Test tasks included per Constitution Principle IX. Component tests grouped for efficiency.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Follows **bottom-up architecture** (FR-048): Design Foundations → Core UI Elements → Shared Components → App Layout → Feature Sections → Pages → Mock Data/State → Integration.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5, US6)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETE

**Purpose**: Project initialization and basic structure verification

- [X] T001 Verify Next.js 14 project exists in frontend/ directory with App Router configuration
- [X] T002 Install dependencies in frontend/ using npm install (Next.js 14+, React 18+, TypeScript 5.x, Tailwind CSS 3.x, Zustand, React Hook Form, Zod, Vitest, React Testing Library, date-fns)
- [X] T003 [P] Verify tailwind.config.js is configured with content paths for src/app/, src/components/
- [X] T004 [P] Verify tsconfig.json has path alias @/ pointing to ./src/
- [X] T005 [P] Configure vitest.config.ts with path alias and React Testing Library setup
- [X] T006 [P] Create frontend/src/app/globals.css with Tailwind directives (@tailwind base, components, utilities)
- [X] T007 [P] Verify frontend/package.json has scripts: dev, build, start, test, test:watch, test:coverage

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Design Foundations (BLOCKS EVERYTHING)

- [ ] T008 Create design tokens file in frontend/src/components/design-system/tokens.ts with exported colors (primary, gray, status, success, warning, error), typography (fontFamily, fontSize, fontWeight, lineHeight), spacing (xs to 3xl), borderRadius, shadows per research.md
- [ ] T009 Extend tailwind.config.js theme to use tokens from frontend/src/components/design-system/tokens.ts
- [ ] T010 [P] Create theme configuration file in frontend/src/components/design-system/theme.ts with Tailwind theme extensions

### TypeScript Types (BLOCKS DATA FLOW)

- [ ] T011 [P] Create User interface in frontend/src/types/user.ts per data-model.md (user_id, email, full_name, avatar_url, role, created_at)
- [ ] T012 [P] Create Task and TaskStatus types in frontend/src/types/task.ts per data-model.md (task_id, user_id, status, progress, metadata, file_name, file_size, created_at, updated_at, completed_at, error, retry_count)
- [ ] T013 [P] Create ExamMetadata interface in frontend/src/types/task.ts (academic_year, exam_name, subject, duration_minutes, num_versions, notes)
- [ ] T014 [P] Create Question and AnswerOption types in frontend/src/types/question.ts per data-model.md (question_id, task_id, question_number, question_text, option_a/b/c/d, correct_answer, learning_objective)
- [ ] T015 [P] Create TaskLog and LogLevel types in frontend/src/types/task-log.ts per data-model.md (log_id, task_id, log_level, message, timestamp, metadata)
- [ ] T016 [P] Create ExamData interface in frontend/src/types/exam-data.ts per data-model.md (task_id, metadata, questions, num_questions, created_at)
- [ ] T017 Create index.ts barrel export in frontend/src/types/ re-exporting all type files

### State Management (BLOCKS USER INTERACTIONS)

- [ ] T018 Create auth store in frontend/src/lib/state/auth-store.ts using Zustand with persist middleware per data-model.md (user, isAuthenticated, isLoading, login, logout, checkAuth actions, localStorage key 'auth-state')
- [ ] T019 Create task store in frontend/src/lib/state/task-store.ts using Zustand with persist middleware per data-model.md (tasks, currentTask, createTask, updateTaskStatus, updateTaskError, retryTask, setCurrentTask, clearCurrentTask, addTaskLog actions, localStorage key 'task-state')
- [ ] T020 [P] Create localStorage utility helpers in frontend/src/lib/state/storage.ts (getItem, setItem, removeItem with JSON parse/stringify and error handling)

### Mock Data (BLOCKS TESTING)

- [ ] T021 [P] Create mock user data in frontend/src/lib/mock-data/users.ts per data-model.md (mockUser with user_id: 'mock-user-1', email: 'john.doe@university.edu', full_name: 'John Doe', avatar_url, role: 'professor')
- [ ] T022 [P] Create mock questions array in frontend/src/lib/mock-data/questions.ts with 15 sample questions per data-model.md (question_text, options A/B/C/D, correct_answer, learning_objective)
- [ ] T023 [P] Create task factory function in frontend/src/lib/mock-data/tasks.ts (createMockTask accepting ExamMetadata and userId, returns Task with generated task_id, status: 'pending', progress: 0)

### Simulation Logic (BLOCKS PROCESSING FLOWS)

- [ ] T024 Create pipeline simulation module in frontend/src/lib/simulation/pipeline.ts with stage durations (extract: 5s, understand: 5s, shuffle: 5s, generate: 5s) and progress mapping per research.md (pending: 0%, extracting: 12%, understanding: 37%, awaiting: 50%, shuffling: 62%, generating: 87%, completed: 100%)
- [ ] T025 Create simulateStage async function in frontend/src/lib/simulation/pipeline.ts that waits for stage duration then calls onProgress callback with taskId, status, progress
- [ ] T026 [P] Create OAuth simulation module in frontend/src/lib/simulation/oauth.ts with simulateGoogleOAuth function (1-2 second delay, returns mockUser)
- [ ] T027 [P] Create polling utility in frontend/src/lib/simulation/polling.ts with configurable interval (default 3s) and cleanup logic

### Validation & Utilities (BLOCKS FORMS)

- [ ] T028 [P] Create Zod validation schema in frontend/src/lib/validation/create-exam-schema.ts per research.md (academicYear, examName, subject, duration > 0, numVersions 1-10, notes optional, file .doc/.docx validation)
- [ ] T029 [P] Create date formatter utilities in frontend/src/lib/utils/formatters.ts (formatDate, formatTimestamp, formatRelativeTime using date-fns)
- [ ] T030 [P] Create constants file in frontend/src/lib/utils/constants.ts with TaskStatus enum, LogLevel enum, default values (POLLING_INTERVAL: 3000, PAGE_SIZE: 10)

### Testing Infrastructure (BLOCKS TEST EXECUTION)

- [ ] T031 [P] Create test utilities file in frontend/tests/utils.tsx with custom render function wrapping Zustand providers, mock router, React Query provider
- [ ] T032 [P] Update frontend/tests/setup.ts to configure global test environment, mock localStorage, matchMedia polyfill for Tailwind

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Homepage & Core Navigation (Priority: P1) 🎯 MVP

**Goal**: Provide accessible homepage with navigation structure that adapts to authentication state, enabling users to discover and access all key features (Login, Create Exam, User Guide)

**Independent Test**: Load application at root URL, verify homepage displays with product intro text, 3 CTA buttons (Login, Create New Exam, User Guide), navigation bar shows Login button when logged out, verify clicking Login navigates to /login, verify clicking Create New Exam shows auth check, manually set auth state and verify avatar appears in navbar

### Implementation for User Story 1

- [ ] T033 [P] [US1] Create Button atom in frontend/src/components/ui/Button.tsx per contracts/components.md (variants: primary, secondary, outline, ghost, danger; sizes: sm, md, lg; isLoading, leftIcon, rightIcon, fullWidth props)
- [ ] T034 [P] [US1] Create Avatar atom in frontend/src/components/ui/Avatar.tsx (src, alt, size props, fallback to initials, rounded-full styling)
- [ ] T035 [US1] Create Navbar template in frontend/src/components/layout/Navbar.tsx per contracts/components.md (user, onLogin, onLogout props, conditional rendering based on auth state, sticky top-0, displays logo/branding left, auth UI right)
- [ ] T036 [US1] Create PageContainer template in frontend/src/components/layout/PageContainer.tsx per contracts/components.md (title, subtitle, breadcrumbs, actions, children, maxWidth props, centered layout with responsive padding)
- [ ] T037 [US1] Create root layout in frontend/src/app/layout.tsx importing Navbar with auth store integration, wrapping children with global styles
- [ ] T038 [US1] Create homepage in frontend/src/app/page.tsx using PageContainer, displaying product introduction text, three CTA buttons (Login, Create New Exam, User Guide) with onClick navigation
- [ ] T039 [P] [US1] Create User Guide page in frontend/src/app/guide/page.tsx with static content explaining SiroMix features and workflow
- [ ] T040 [US1] Integrate auth check logic on Create New Exam button click in frontend/src/app/page.tsx (redirect to /login if not authenticated, else redirect to /exams/create)

### Tests for User Story 1

- [ ] T041 [P] [US1] Unit tests for Button component in frontend/tests/unit/components/ui/Button.test.tsx (test variants, sizes, loading state, icon rendering, onClick handler, disabled state)
- [ ] T042 [P] [US1] Unit tests for Navbar component in frontend/tests/unit/components/layout/Navbar.test.tsx (test unauthenticated state shows Login button, authenticated state shows avatar, onLogin/onLogout callbacks)
- [ ] T043 [P] [US1] Integration test for homepage navigation flow in frontend/tests/integration/homepage.test.tsx (test CTA button clicks navigate to correct routes, auth-gated navigation redirects to login)

**Checkpoint**: At this point, User Story 1 should be fully functional - homepage loads, navigation works, auth-aware UI renders correctly

---

## Phase 4: User Story 2 - Simulated Authentication Flow (Priority: P2)

**Goal**: Enable users to authenticate via simulated Google OAuth, persist session state, and display user avatar in navigation after successful login

**Independent Test**: Click Login button from homepage, observe 1-2 second loading/mock OAuth screen, verify automatic return to app, confirm avatar appears in navbar, verify user data stored in localStorage, refresh page and confirm auth persists, test protected route redirect after login

### Implementation for User Story 2

- [ ] T044 [P] [US2] Create Spinner atom in frontend/src/components/ui/Spinner.tsx per contracts/components.md (size: sm, md, lg, xl; variant: primary, white, gray; CSS spin animation)
- [ ] T045 [US2] Create login page in frontend/src/app/login/page.tsx displaying simulated OAuth consent/loading screen, calling simulateGoogleOAuth from lib/simulation/oauth.ts, then calling authStore.login(mockUser) and redirecting to original destination or homepage
- [ ] T046 [US2] Create AuthGuard template in frontend/src/components/layout/AuthGuard.tsx per contracts/components.md (children, fallback, redirectTo props, checks authStore.isAuthenticated, renders children if true, otherwise shows fallback or redirects)
- [ ] T047 [US2] Update Navbar in frontend/src/components/layout/Navbar.tsx to add avatar dropdown menu with Logout option when user clicks avatar
- [ ] T048 [US2] Implement auth state hydration in frontend/src/app/layout.tsx using authStore.checkAuth() in useEffect to restore session from localStorage on app load
- [ ] T049 [US2] Add redirect destination tracking in authStore (frontend/src/lib/state/auth-store.ts) to store intended URL before login redirect, restore after successful auth

### Tests for User Story 2

- [ ] T050 [P] [US2] Unit tests for AuthGuard component in frontend/tests/unit/components/layout/AuthGuard.test.tsx (test renders children when authenticated, shows fallback when not authenticated, redirects when redirectTo prop provided)
- [ ] T051 [P] [US2] Integration test for login flow in frontend/tests/integration/auth-flow.test.tsx (test clicking Login starts OAuth simulation, successful login updates auth state, avatar appears in navbar, logout clears state)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can authenticate and see persistent auth state

---

## Phase 5: User Story 3 - Create Exam Form & Submission (Priority: P3)

**Goal**: Enable authenticated users to fill out exam metadata form with validation, select mock file, submit to create task, and see task enter processing pipeline starting with "Extracting" status

**Independent Test**: Navigate to /exams/create (redirect to login if not authenticated), fill form with valid data (academic year, exam name, subject, duration, versions, notes, file), click Submit, verify task created in taskStore with status "pending" → "extracting", verify task appears in Task Management page, test form validation prevents submission with missing fields or invalid values

### Implementation for User Story 3

- [ ] T052 [P] [US3] Create Input atom in frontend/src/components/ui/Input.tsx per contracts/components.md (variant: default, filled, outlined; size: sm, md, lg; hasError, leftIcon, rightIcon, fullWidth props)
- [ ] T053 [P] [US3] Create Select atom in frontend/src/components/ui/Select.tsx (options, value, onChange, hasError, placeholder props, styled to match Input)
- [ ] T054 [P] [US3] Create Textarea atom in frontend/src/components/ui/Textarea.tsx (rows, hasError props, extends HTMLTextAreaElement, styled to match Input)
- [ ] T055 [P] [US3] Create Checkbox atom in frontend/src/components/ui/Checkbox.tsx (checked, onChange, label, disabled props, accessible with label click)
- [ ] T056 [US3] Create FormField molecule in frontend/src/components/shared/FormField.tsx per contracts/components.md (label, htmlFor, required, error, helperText, children props, wraps label + input + error message)
- [ ] T057 [US3] Create FileUpload molecule in frontend/src/components/shared/FileUpload.tsx per contracts/components.md (accept, maxSize, onChange, error, disabled, currentFile props, drag-and-drop support, file type validation)
- [ ] T058 [US3] Create ExamMetadataForm organism in frontend/src/components/sections/ExamMetadataForm.tsx per contracts/components.md using React Hook Form + Zod validation (onSubmit, defaultValues, isSubmitting, submitButtonText props, all fields from ExamMetadata + file upload)
- [ ] T059 [US3] Create /exams/create page in frontend/src/app/exams/create/page.tsx wrapping ExamMetadataForm with AuthGuard, onSubmit handler calls taskStore.createTask, starts pipeline simulation, redirects to /exams/preview/[taskId]
- [ ] T060 [US3] Implement task creation workflow in frontend/src/lib/state/task-store.ts createTask action (generate UUID, create task with metadata, set status: 'pending', progress: 0, timestamp, add to tasks array, persist to localStorage)
- [ ] T061 [US3] Integrate pipeline simulation starter in Create page that calls simulateStage for 'extract' stage after task creation, updates task status to 'extracting', then 'understanding' per pipeline.ts durations

### Tests for User Story 3

- [ ] T062 [P] [US3] Unit tests for Input, Select, Textarea, Checkbox atoms in frontend/tests/unit/components/ui/FormInputs.test.tsx (test value changes, error states, disabled states, accessibility)
- [ ] T063 [P] [US3] Unit tests for FormField molecule in frontend/tests/unit/components/shared/FormField.test.tsx (test error display, helper text, required indicator, label association)
- [ ] T064 [P] [US3] Unit tests for FileUpload component in frontend/tests/unit/components/shared/FileUpload.test.tsx (test file selection, drag-and-drop, file type validation, file size validation, error display)
- [ ] T065 [US3] Integration test for Create Exam form in frontend/tests/integration/create-exam.test.tsx (test form validation errors, successful submission creates task, task appears in store, pipeline simulation starts)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should work independently - users can create tasks and see them enter processing

---

## Phase 6: User Story 4 - Exam Analysis Preview & Confirmation (Priority: P4)

**Goal**: Display extracted exam data (questions list) after "understand" stage completes, allow user to review and confirm, then resume processing pipeline with shuffle/generate stages

**Independent Test**: Manually set a task to status "awaiting" in taskStore, navigate to /exams/preview/[taskId], verify page displays mock questions (text, options A/B/C/D, correct answer), total question count, Confirm button, click Confirm, verify task status changes to "shuffling", processing modal appears with progress, automatic redirect to Task Management after 5 seconds

### Implementation for User Story 4

- [ ] T066 [P] [US4] Create Card molecule in frontend/src/components/shared/Card.tsx per contracts/components.md (variant: default, outlined, elevated; padding: none, sm, md, lg; header, footer, onClick, className props)
- [ ] T067 [P] [US4] Create Modal molecule in frontend/src/components/shared/Modal.tsx per contracts/components.md (isOpen, onClose, title, size, showCloseButton, closeOnOverlayClick, closeOnEsc, children, footer props, focus trap, body scroll lock)
- [ ] T068 [US4] Create QuestionList organism in frontend/src/components/sections/QuestionList.tsx per contracts/components.md (questions, variant: compact or detailed, editable, onQuestionClick props, displays numbered list with options and correct answer highlight)
- [ ] T069 [US4] Create preview page in frontend/src/app/exams/preview/[taskId]/page.tsx wrapping with AuthGuard, fetching task from taskStore by taskId param, displaying QuestionList with mock questions from mockQuestions array, showing total count, Confirm button
- [ ] T070 [US4] Implement confirmation handler in preview page that calls taskStore.updateTaskStatus(taskId, 'shuffling', 50), opens processing Modal with ProgressBar, continues pipeline simulation through shuffle → generate → completed
- [ ] T071 [US4] Add auto-redirect logic in preview page that navigates to /tasks after task status changes to 'shuffling' and 5-second timer elapses
- [ ] T072 [US4] Implement automatic redirect to preview page logic in task pipeline simulation when status changes from 'understanding' to 'awaiting' (add in frontend/src/lib/simulation/pipeline.ts or page-level useEffect)

### Tests for User Story 4

- [ ] T073 [P] [US4] Unit tests for Card component in frontend/tests/unit/components/shared/Card.test.tsx (test variants, padding, header/footer rendering, onClick interaction)
- [ ] T074 [P] [US4] Unit tests for Modal component in frontend/tests/unit/components/shared/Modal.test.tsx (test open/close, overlay click, ESC key, focus trap, accessibility)
- [ ] T075 [P] [US4] Unit tests for QuestionList organism in frontend/tests/unit/components/sections/QuestionList.test.tsx (test compact vs detailed variants, question rendering, correct answer highlighting)
- [ ] T076 [US4] Integration test for preview confirmation flow in frontend/tests/integration/preview-confirm.test.tsx (test preview page displays questions, Confirm button resumes pipeline, modal shows processing, redirect to tasks after completion)

**Checkpoint**: At this point, User Stories 1-4 should work independently - complete exam creation flow with human-in-the-loop confirmation works end-to-end

---

## Phase 7: User Story 5 - Task Management & Polling (Priority: P5)

**Goal**: Display all user's tasks in paginated table with real-time status updates via polling, color-coded status badges, progress percentages, and row click navigation to detail page

**Independent Test**: Pre-populate taskStore with 3-5 mock tasks at different stages (extracting 25%, shuffling 60%, completed 100%, failed with error), navigate to /tasks, verify datatable displays all tasks with correct columns (task ID, exam name, subject, status badge with correct color, progress %, created date), observe automatic updates every 3 seconds, verify Download button appears only for completed tasks, click row to navigate to /exams/[taskId], test pagination with 10+ tasks

### Implementation for User Story 5

- [ ] T077 [P] [US5] Create Badge atom in frontend/src/components/ui/Badge.tsx per contracts/components.md (variant: pending, extracting, understanding, awaiting, shuffling, generating, completed, failed; size: sm, md, lg; color mapping to design tokens status colors)
- [ ] T078 [P] [US5] Create ProgressBar atom in frontend/src/components/ui/ProgressBar.tsx per contracts/components.md (value 0-100, max, size, variant: primary/success/warning/error, showLabel, label, animated props, uses HTML progress element)
- [ ] T079 [US5] Create Datatable organism in frontend/src/components/shared/Datatable.tsx per contracts/components.md with TypeScript generics (data, columns, keyExtractor, emptyState, loading, onRowClick, pagination, sorting props)
- [ ] T080 [US5] Create useTaskPolling custom hook in frontend/src/hooks/useTaskPolling.ts per contracts/components.md (taskId, interval default 3000ms, enabled, onComplete, onError props, returns task, isPolling, stopPolling)
- [ ] T081 [US5] Create Task Management page in frontend/src/app/tasks/page.tsx wrapping with AuthGuard, fetching tasks from taskStore, displaying Datatable with columns (Task ID, Exam Name, Subject, Status Badge, Progress Bar, Created Date), row click navigates to /exams/[taskId]
- [ ] T082 [US5] Implement polling logic in Task Management page using useEffect with setInterval that calls taskStore tasks and updates statuses/progress every 3s based on pipeline simulation state
- [ ] T083 [US5] Add pagination controls to Datatable in Task Management page (10 tasks per page, prev/next buttons, page number display)
- [ ] T084 [US5] Add Download button column to Datatable that appears only when task.status === 'completed', onClick shows placeholder/mock download action

### Tests for User Story 5

- [ ] T085 [P] [US5] Unit tests for Badge component in frontend/tests/unit/components/ui/Badge.test.tsx (test all status variants render correct colors, sizes work correctly, aria-label present)
- [ ] T086 [P] [US5] Unit tests for ProgressBar component in frontend/tests/unit/components/ui/ProgressBar.test.tsx (test value clamping 0-100, variants, label display, animation class)
- [ ] T087 [P] [US5] Unit tests for Datatable component in frontend/tests/unit/components/shared/Datatable.test.tsx (test column rendering, row click handler, pagination, sorting, empty state, loading state)
- [ ] T088 [P] [US5] Unit tests for useTaskPolling hook in frontend/tests/unit/hooks/useTaskPolling.test.tsx (test polling starts/stops, interval timing, onComplete/onError callbacks, cleanup on unmount)
- [ ] T089 [US5] Integration test for Task Management polling in frontend/tests/integration/task-polling.test.tsx (test tasks update every 3s, status badges change colors, progress bars increment, completed tasks show Download button)

**Checkpoint**: At this point, User Stories 1-5 should work independently - task monitoring with real-time updates works across all task states

---

## Phase 8: User Story 6 - Exam Detail View & Retry (Priority: P6)

**Goal**: Display comprehensive task details (metadata, processing status with logs, extracted questions) and enable retry for failed tasks, restarting pipeline simulation from extract stage

**Independent Test**: Create failed task in taskStore, navigate to /exams/[taskId], verify three sections display (Exam Metadata with all form fields, Processing Status with status badge, progress bar, logs with timestamps, Extracted Data with full question list), verify Retry button visible only for failed status, click Retry, confirm task resets to "pending" status with 0% progress, retry_count increments, pipeline restarts, verify polling updates all sections in real-time

### Implementation for User Story 6

- [ ] T090 [P] [US6] Create ExamMetadata section component in frontend/src/components/sections/ExamMetadata.tsx displaying metadata fields (academic_year, exam_name, subject, duration_minutes, num_versions, notes, file_name as read-only Card)
- [ ] T091 [P] [US6] Create ProcessingStatus section component in frontend/src/components/sections/ProcessingStatus.tsx per contracts/components.md (task, onConfirm, onCancel, onRetry, showLogs, logs props, displays Badge, ProgressBar, log timeline with timestamps, conditional Retry button)
- [ ] T092 [US6] Create Exam Detail page in frontend/src/app/exams/[taskId]/page.tsx wrapping with AuthGuard, fetching task by taskId param from taskStore, displaying three sections (ExamMetadata, ProcessingStatus, QuestionList)
- [ ] T093 [US6] Implement retry logic in taskStore.retryTask action (frontend/src/lib/state/task-store.ts) that resets task.status to 'pending', task.progress to 0, increments task.retry_count, clears task.error, logs retry event, updates task.updated_at timestamp
- [ ] T094 [US6] Integrate retry handler in Exam Detail page that calls taskStore.retryTask(taskId), restarts pipeline simulation from extract stage
- [ ] T095 [US6] Add retry count limit check (max 2 retries) in ProcessingStatus component to disable Retry button when task.retry_count >= 2
- [ ] T096 [US6] Implement real-time polling in Exam Detail page using useTaskPolling hook to update all three sections (metadata, status, questions) every 3 seconds

### Tests for User Story 6

- [ ] T097 [P] [US6] Unit tests for ExamMetadata component in frontend/tests/unit/components/sections/ExamMetadata.test.tsx (test all metadata fields display correctly, formatting)
- [ ] T098 [P] [US6] Unit tests for ProcessingStatus component in frontend/tests/unit/components/sections/ProcessingStatus.test.tsx (test Retry button shows only for failed status, onRetry callback, retry count limit, log display)
- [ ] T099 [US6] Integration test for Exam Detail page in frontend/tests/integration/exam-detail.test.tsx (test three sections render, polling updates status/progress/logs, Retry resets task and restarts pipeline)
- [ ] T100 [US6] Integration test for retry flow in frontend/tests/integration/task-retry.test.tsx (test failed task shows Retry button, clicking Retry increments retry_count, task restarts from pending, max 2 retries enforced)

**Checkpoint**: All user stories (1-6) should now be independently functional - complete UI workflow from homepage → auth → create → preview → monitor → detail → retry works end-to-end

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, performance, and production readiness

- [ ] T101 [P] Add error boundary component in frontend/src/components/ErrorBoundary.tsx to catch React errors and display fallback UI
- [ ] T102 [P] Add loading skeleton components in frontend/src/components/ui/Skeleton.tsx for use in Datatable and page loading states
- [ ] T103 [P] Optimize Datatable performance with React.memo and useMemo for large task lists (20+ tasks)
- [ ] T104 [P] Add transition animations for Modal open/close, page navigation using Tailwind transitions
- [ ] T105 [P] Implement toast notification system in frontend/src/components/ui/Toast.tsx for success/error feedback (task created, retry started, etc.)
- [ ] T106 [P] Add favicon and meta tags in frontend/src/app/layout.tsx for SEO and browser tab branding
- [ ] T107 Add comprehensive JSDoc comments to all components documenting props, usage examples per contracts/components.md
- [ ] T108 [P] Run test coverage report using npm run test:coverage, verify >80% coverage for component library
- [ ] T109 [P] Validate quickstart.md instructions by following setup steps on fresh clone
- [ ] T110 [P] Create component usage examples document in specs/002-ui-mock-mvp/examples.md showing how to compose pages from components
- [ ] T111 Perform manual end-to-end testing of all 6 user stories following quickstart.md user flows
- [ ] T112 [P] Optimize bundle size by analyzing Next.js build output, consider code splitting for Modal, Datatable
- [ ] T113 [P] Add TypeScript strict mode checks, resolve any type errors
- [ ] T114 [P] Add ESLint rules for accessibility (eslint-plugin-jsx-a11y) and fix violations
- [ ] T115 Run production build (npm run build) and verify no build errors or warnings

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5 → P6)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### Bottom-Up Architecture Order (Per FR-048)

**CRITICAL**: Must follow this order within Foundational phase and each user story:

1. **Design Foundations** (T008-T010) → BLOCKS everything
2. **TypeScript Types** (T011-T017) → BLOCKS data flow
3. **State Management** (T018-T020) → BLOCKS user interactions
4. **Mock Data** (T021-T023) → BLOCKS testing
5. **Simulation Logic** (T024-T027) → BLOCKS processing flows
6. **Validation & Utilities** (T028-T030) → BLOCKS forms
7. **Atoms** (Button, Input, Badge, etc.) → BLOCKS molecules
8. **Molecules** (Card, FormField, Modal, etc.) → BLOCKS organisms
9. **Organisms** (Datatable, QuestionList, etc.) → BLOCKS templates
10. **Templates** (Navbar, PageContainer, AuthGuard) → BLOCKS pages
11. **Pages** → Compose from all above

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent but integrates with US1 navbar
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Requires US2 auth flow for protection
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Requires US3 task creation to test, but independently testable with mock task
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - Independent, can test with pre-populated mock tasks
- **User Story 6 (P6)**: Can start after Foundational (Phase 2) - Independent, similar to US5

### Within Each User Story

**Strict Order Within Story**:
1. Atoms BEFORE molecules (e.g., T033 Button before T056 FormField)
2. Molecules BEFORE organisms (e.g., T056 FormField before T058 ExamMetadataForm)
3. Organisms BEFORE pages (e.g., T058 ExamMetadataForm before T059 Create page)
4. Store actions BEFORE page integration (e.g., T060 createTask before T061 pipeline integration)
5. Tests can run in parallel with implementation (TDD) or after (test-after)

### Parallel Opportunities

**Within Setup (Phase 1):**
- T003, T004, T005, T006, T007 can all run in parallel

**Within Foundational (Phase 2):**
- T010 (theme.ts) can run in parallel with T008 (tokens.ts) completion
- T011-T017 (all TypeScript types) can run in parallel
- T021-T023 (all mock data files) can run in parallel
- T026, T027 (OAuth and polling simulation) can run in parallel
- T028-T030 (validation, formatters, constants) can run in parallel
- T031, T032 (testing utilities) can run in parallel

**Across User Stories** (after Foundational complete):
- US1, US2, US3, US4, US5, US6 can all be worked on in parallel by different developers
- Each story is independently testable with mock data

**Within User Story 1:**
- T033 (Button), T034 (Avatar) can run in parallel
- T039 (User Guide page) can run in parallel with T038 (homepage)
- T041, T042, T043 (all tests) can run in parallel

**Within User Story 2:**
- T047 (Navbar update), T048 (auth hydration), T049 (redirect tracking) can run after T045 (login page) in parallel
- T050, T051 (tests) can run in parallel

**Within User Story 3:**
- T052, T053, T054, T055 (all form input atoms) can run in parallel
- T062, T063, T064 (tests) can run in parallel

**Within User Story 4:**
- T066 (Card), T067 (Modal) can run in parallel
- T073, T074, T075 (tests) can run in parallel

**Within User Story 5:**
- T077 (Badge), T078 (ProgressBar) can run in parallel
- T083 (pagination), T084 (Download button) can run in parallel with T082 (polling logic)
- T085, T086, T087, T088 (tests) can run in parallel

**Within User Story 6:**
- T090 (ExamMetadata), T091 (ProcessingStatus) can run in parallel
- T097, T098 (tests) can run in parallel

**Within Polish (Phase 9):**
- T101, T102, T103, T104, T105, T106 can all run in parallel
- T108, T109, T110, T112, T113, T114 can all run in parallel

---

## Parallel Example: Foundational Phase

```bash
# After T008 (tokens.ts) completes, launch in parallel:
T010: Create theme.ts

# Launch all TypeScript types together:
T011: Create User interface in frontend/src/types/user.ts
T012: Create Task types in frontend/src/types/task.ts
T013: Create ExamMetadata in frontend/src/types/task.ts
T014: Create Question types in frontend/src/types/question.ts
T015: Create TaskLog types in frontend/src/types/task-log.ts
T016: Create ExamData in frontend/src/types/exam-data.ts

# Launch all mock data together:
T021: Create mockUser in frontend/src/lib/mock-data/users.ts
T022: Create mockQuestions in frontend/src/lib/mock-data/questions.ts
T023: Create createMockTask in frontend/src/lib/mock-data/tasks.ts
```

---

## Parallel Example: User Story 3

```bash
# Launch all form input atoms together:
T052: Create Input atom in frontend/src/components/ui/Input.tsx
T053: Create Select atom in frontend/src/components/ui/Select.tsx
T054: Create Textarea atom in frontend/src/components/ui/Textarea.tsx
T055: Create Checkbox atom in frontend/src/components/ui/Checkbox.tsx

# After atoms complete, launch all tests for US3 together:
T062: Unit tests for form inputs
T063: Unit tests for FormField
T064: Unit tests for FileUpload
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

**Recommended path for fastest time to value:**

1. ✅ Complete Phase 1: Setup (tasks ready to execute)
2. ✅ Complete Phase 2: Foundational (CRITICAL - enables all stories)
3. ✅ Complete Phase 3: User Story 1 (Homepage & Navigation)
4. **STOP and VALIDATE**: Manually test homepage, navigation, auth-aware UI
5. ✅ Complete Phase 4: User Story 2 (Simulated Authentication)
6. **STOP and VALIDATE**: Test login flow, session persistence
7. ✅ Complete Phase 5: User Story 3 (Create Exam Form)
8. **STOP and VALIDATE**: Test complete flow: homepage → login → create exam → task created
9. **Deploy/Demo MVP** with stories 1-3 functional

**Total MVP tasks**: T001-T065 (65 tasks)

### Full Feature Delivery (All 6 User Stories)

**Complete implementation path:**

1. Complete MVP First (stories 1-3)
2. Add User Story 4 (Preview & Confirmation) → Test independently
3. Add User Story 5 (Task Management & Polling) → Test independently
4. Add User Story 6 (Exam Detail & Retry) → Test independently
5. Complete Phase 9: Polish
6. Deploy/Demo full feature

**Total tasks**: T001-T115 (115 tasks)

### Parallel Team Strategy

**With 3 developers after Foundational phase completes:**

- **Developer A**: User Stories 1-2 (Homepage, Navigation, Auth)
- **Developer B**: User Stories 3-4 (Create Form, Preview)
- **Developer C**: User Stories 5-6 (Task Management, Exam Detail)

All stories integrate seamlessly since they share Foundational components (stores, types, simulation, design tokens).

---

## Summary

- **Total Tasks**: 115
- **MVP Tasks** (US1-US3): 65
- **Parallelizable Tasks**: 52 (marked with [P])
- **User Stories**: 6 (each independently testable)
- **Test Tasks**: 24 (covering atoms, molecules, organisms, pages, hooks, integration flows)
- **Estimated Effort**: 
  - MVP (US1-US3): 3-4 weeks (1 developer) or 1-2 weeks (2-3 developers in parallel)
  - Full Feature (US1-US6): 5-7 weeks (1 developer) or 2-3 weeks (3 developers in parallel)
  - Polish: +1 week

**Critical Path**: Phase 2 Foundational (T008-T032) must complete before ANY user story work begins. Design tokens (T008-T010) block all UI components.

**Testing Coverage**: 24 test tasks ensure >80% coverage per NFR-009 and Constitution Principle IX.

**Architecture**: Strictly follows bottom-up order per FR-048 to ensure reusable, scalable component library.

**Deliverables**: 6 pages, ~40 reusable components, complete mock UI workflow ready for backend integration in future phases.
