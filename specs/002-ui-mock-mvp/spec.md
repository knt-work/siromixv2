# Feature Specification: SiroMix UI MVP (Mock Data Phase)

**Feature Branch**: `002-ui-mock-mvp`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: User description: "SiroMix UI MVP with mock data - implement homepage, login flow, create exam page, preview analysis page, task management with polling, and exam detail page using Visily designs"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Homepage & Core Navigation (Priority: P1)

A first-time visitor lands on the SiroMix homepage which serves as the main entry point to the application. The homepage clearly introduces the product purpose (exam processing and shuffling) and provides prominent call-to-action buttons for three key actions: Log In, Create New Exam, and View User Guide. The navigation bar adapts based on authentication state - showing login CTA when unauthenticated, and displaying a rounded user avatar in the top-right corner after successful login. The homepage establishes the foundation for all other user journeys.

**Why this priority**: The homepage is the first impression and navigation gateway for all features. Without a functional homepage and navigation structure, users cannot access any other functionality. It's the minimal viable entry point that enables all subsequent user stories.

**Independent Test**: Can be fully tested by loading the application root URL, verifying homepage displays with all three CTA buttons (Login, Create New Exam, User Guide), confirming navigation elements are present, and checking that clicking each button navigates to appropriate pages (even if those pages show placeholder content initially).

**Acceptance Scenarios**:

1. **Given** unauthenticated user visits root URL, **When** page loads, **Then** homepage displays with product introduction, Login button, Create New Exam button, and User Guide link
2. **Given** user is on homepage, **When** user is not logged in, **Then** navigation bar shows Login CTA button
3. **Given** user is on homepage, **When** user clicks Login button, **Then** user is redirected to Login page
4. **Given** user is on homepage, **When** user clicks Create New Exam button, **Then** system checks authentication state and redirects accordingly
5. **Given** user is on homepage, **When** user clicks User Guide link, **Then** user is shown User Guide page/content
6. **Given** authenticated user visits homepage, **When** page loads, **Then** navigation bar shows rounded user avatar instead of Login button

---

### User Story 2 - Simulated Authentication Flow (Priority: P2)

A user wants to access authenticated features and clicks Login. The system simulates a Google OAuth flow without actual OAuth integration. After clicking Login, the user sees a simulated OAuth consent screen (or loading indicator), then automatically returns to the application with a mocked successful authentication. The system creates a simulated user session with mock user data (name, email, avatar) and updates the navigation bar to display the user's rounded avatar profile picture. If the user clicked Create New Exam before logging in, they are automatically redirected to the Create New Exam page after successful authentication.

**Why this priority**: Authentication gates all exam creation and management features. A working authentication simulation is essential for testing the authenticated user experience and provides the foundation for user-specific data display. It's independent from exam processing but required before users can create exams.

**Independent Test**: Can be fully tested by clicking Login button, observing simulated OAuth flow completion, verifying user avatar appears in navigation bar, confirming simulated user data is stored in frontend state, and testing that authentication state persists across page navigations within the session.

**Acceptance Scenarios**:

1. **Given** unauthenticated user, **When** user clicks Login button, **Then** system initiates simulated Google OAuth flow with loading or mock consent screen
2. **Given** simulated OAuth in progress, **When** mock authentication completes (after 1-2 seconds), **Then** system creates mock user session with predefined name, email, and avatar
3. **Given** authentication successful, **When** user returns to application, **Then** navigation bar displays rounded user avatar in top-right corner
4. **Given** authenticated user, **When** user navigates between pages, **Then** authentication state persists and avatar remains visible
5. **Given** user clicked Create New Exam before login, **When** authentication completes, **Then** user is automatically redirected to Create New Exam page
6. **Given** authenticated user, **When** user clicks avatar, **Then** system displays user profile dropdown or menu (minimal for MVP)

---

### User Story 3 - Create Exam Form & Submission (Priority: P3)

An authenticated user wants to create a new exam processing task. They navigate to the Create New Exam page and see a form requesting exam metadata: academic year (text/dropdown), exam name (text), subject name (text), duration in minutes (number), number of shuffled versions to generate (number), optional notes (textarea), and file upload for raw exam Word document. After filling all required fields and selecting a file (simulated), the user clicks "Shuffle Exam Now" button. The system validates the form, creates a mock task in frontend state with status "Pending", assigns a unique task ID, and initiates the simulated processing pipeline starting with "extract" and "understand" stages.

**Why this priority**: Exam creation is the core value proposition of SiroMix. This is where users initiate the entire workflow. It's independently testable without the preview/confirmation flow - a user should be able to create a task and see it appear in Task Management even if subsequent stages aren't implemented.

**Independent Test**: Can be fully tested by filling out the Create Exam form with valid data, selecting a mock file, clicking Submit, verifying a task is created in frontend state with correct metadata, confirming task appears in Task Management page with "Extracting" or "Understanding" status, and checking that form validation prevents submission with missing required fields.

**Acceptance Scenarios**:

1. **Given** unauthenticated user, **When** user clicks Create New Exam, **Then** system redirects to Login page
2. **Given** authenticated user, **When** user clicks Create New Exam, **Then** system displays exam creation form with all required fields
3. **Given** user on Create Exam form, **When** user fills all required fields and selects mock file, **Then** "Shuffle Exam Now" button becomes enabled
4. **Given** user on Create Exam form, **When** user submits with missing required fields, **Then** system displays validation errors and prevents submission
5. **Given** user submits valid form, **When** "Shuffle Exam Now" is clicked, **Then** system creates mock task with unique ID, "Pending" status, and user-provided metadata
6. **Given** task created successfully, **When** submission completes, **Then** system simulates "extract" stage processing and updates task status to "Extracting"
7. **Given** extract stage completes, **When** simulation timer elapses (3-5 seconds), **Then** task status updates to "Understanding"

---

### User Story 4 - Exam Analysis Preview & Confirmation (Priority: P4)

After the simulated "extract" and "understand" stages complete, the system pauses the processing pipeline and automatically redirects the user to the Preview Exam Analysis Result page. This page displays the mock extracted exam data: a list of questions with their content, answer options (A/B/C/D), detected correct answer, and total question count. The user reviews this data to verify the extraction was correct. The page includes a prominent "Confirm" button. When clicked, the system resumes the processing pipeline with the "shuffle" and "generate" stages, shows a brief processing modal (simulated progress), and redirects to the Task Management page after 5 seconds.

**Why this priority**: This human-in-the-loop confirmation step is critical to SiroMix's value proposition - users must verify extracted data before proceeding with shuffle/generation. It's independently testable by manually setting a task to "Awaiting Confirmation" status and verifying the preview page displays mock data correctly.

**Independent Test**: Can be fully tested by creating a task, manually updating its status to "Awaiting Confirmation" in frontend state, navigating to the preview page, verifying mock exam data displays (question list, options, correct answers), clicking Confirm button, and observing status change to "Shuffling" followed by modal display.

**Acceptance Scenarios**:

1. **Given** task completes "understand" stage, **When** status changes to "Awaiting Confirmation", **Then** system automatically redirects user to Preview Exam Analysis Result page
2. **Given** user on Preview page, **When** page loads, **Then** system displays list of extracted questions with question text, answer options, and detected correct answer
3. **Given** user reviews preview, **When** page displays, **Then** total question count is shown prominently
4. **Given** user on Preview page, **When** user clicks Confirm button, **Then** task status changes to "Shuffling" and processing resumes
5. **Given** Confirm clicked, **When** shuffle stage starts, **Then** system displays processing modal with progress indicator
6. **Given** processing modal displayed, **When** 5 seconds elapse, **Then** system redirects to Task Management page and closes modal
7. **Given** shuffle completes, **When** simulation timer elapses, **Then** task status updates to "Generating"

---

### User Story 5 - Task Management & Polling (Priority: P5)

An authenticated user wants to monitor the status of their exam processing tasks. They navigate to the Task Management page which displays all created tasks in a paginated datatable. Each row shows task summary information: task ID, exam name, subject, status badge (color-coded: Pending/Extracting/Understanding/Awaiting Confirmation/Shuffling/Generating/Completed/Failed), completion percentage (0-100%), created date, and action buttons. The page implements simulated polling - every 3 seconds, task statuses and progress percentages update automatically to simulate real-time backend processing. When a task reaches 100% completion, a "Download" button appears. Users can click any row to navigate to the detailed Exam Detail page.

**Why this priority**: Task monitoring provides visibility into processing status and is the primary navigation hub for accessing individual task details. It's independently testable without exam creation by pre-populating frontend state with mock tasks at various stages. This enables users to track progress even if creation/preview flows aren't complete.

**Independent Test**: Can be fully tested by pre-populating frontend state with 3-5 mock tasks at different stages (Extracting 25%, Shuffling 60%, Completed 100%, Failed), loading Task Management page, verifying datatable displays all tasks with correct status badges and progress, observing automatic status updates every 3 seconds, confirming Download button appears only for completed tasks, and testing row click navigation.

**Acceptance Scenarios**:

1. **Given** authenticated user, **When** user navigates to Task Management page, **Then** system displays paginated datatable with all user's tasks
2. **Given** tasks exist, **When** datatable loads, **Then** each row shows task ID, exam name, subject, status badge, progress percentage, and created date
3. **Given** task is in progress, **When** polling interval triggers (every 3 seconds), **Then** task progress percentage increases and status updates if stage changes
4. **Given** task status is "Completed", **When** row displays, **Then** Download button is visible and enabled
5. **Given** task status is not "Completed", **When** row displays, **Then** Download button is hidden or disabled
6. **Given** multiple tasks exist, **When** table exceeds pagination limit, **Then** system displays pagination controls (10 tasks per page)
7. **Given** user on Task Management page, **When** user clicks a task row, **Then** system navigates to Exam Detail page for that specific task

---

### User Story 6 - Exam Detail View & Retry (Priority: P6)

A user wants to view comprehensive details about a specific exam processing task. They click a task row in Task Management and navigate to the Exam Detail page. This page displays three main sections: (1) Exam Metadata - academic year, exam name, subject, duration, number of versions, notes, uploaded filename, (2) Processing Status - current status badge, progress bar, detailed logs with timestamps, created date, last updated date, and (3) Extracted Data - full list of questions with content, answer options, and correct answers. If the task status is "Failed", a "Retry" button appears. Clicking Retry resets the task progress to 0%, changes status to "Pending", logs a retry event with timestamp, and restarts the simulated processing pipeline from the extract stage.

**Why this priority**: The detail view provides complete visibility into task state and enables error recovery through retry. It's the lowest priority for MVP because tasks can be monitored via Task Management page. However, it's independently testable by navigating directly to a task detail page with a mocked task ID and verifying all sections render correctly.

**Independent Test**: Can be fully tested by creating a mock failed task, navigating to its detail page, verifying all three sections display (metadata, status, extracted data), clicking Retry button, confirming task resets to "Pending" with 0% progress, and observing it progresses through stages again via polling.

**Acceptance Scenarios**:

1. **Given** user clicks task row, **When** navigation occurs, **Then** Exam Detail page loads with task ID in URL
2. **Given** detail page loads, **When** page renders, **Then** Exam Metadata section displays all fields (year, name, subject, duration, versions, notes, filename)
3. **Given** detail page loads, **When** page renders, **Then** Processing Status section shows status badge, progress bar (0-100%), and scrollable log entries with timestamps
4. **Given** detail page loads, **When** page renders, **Then** Extracted Data section displays full question list with options and correct answers
5. **Given** task status is "Failed", **When** page renders, **Then** Retry button is visible in Processing Status section
6. **Given** task status is not "Failed", **When** page renders, **Then** Retry button is hidden
7. **Given** user clicks Retry, **When** button activated, **Then** task resets to "Pending" status, progress becomes 0%, retry event logged with timestamp
8. **Given** retry initiated, **When** reset completes, **Then** simulated processing pipeline restarts from "extract" stage
9. **Given** detail page displayed, **When** polling interval triggers, **Then** status, progress, and logs update automatically

---

### Edge Cases

- What happens when user navigates directly to Create New Exam page while not logged in (should redirect to login then back)?
- What happens when user manually changes URL to access another user's task detail page (should show error or redirect - mock validation)?
- What happens when user refreshes page during simulated processing (should state persist in localStorage/sessionStorage)?
- What happens when user creates 20+ tasks and pagination is needed on Task Management page?
- What happens when simulated file upload fails or file exceeds size limit (mock validation)?
- What happens when form submission occurs with invalid data types (non-numeric duration, negative version count)?
- What happens when user clicks Download button (should trigger mock file download or show placeholder)?
- What happens when user clicks Retry multiple times rapidly (should debounce or disable button during processing)?
- What happens when simulated processing stages take different durations (configurable timing for testing)?
- What happens when user navigates away from preview page without confirming (should task remain in "Awaiting Confirmation" state)?

## Requirements *(mandatory)*

### Functional Requirements

#### Homepage & Navigation
- **FR-001**: System MUST display homepage as default landing page with product introduction and three prominent CTAs: Login, Create New Exam, User Guide
- **FR-002**: Navigation bar MUST adapt based on authentication state: show Login button when unauthenticated, show rounded user avatar when authenticated
- **FR-003**: System MUST allow navigation between all pages: Homepage, Login, Create New Exam, Preview Analysis, Task Management, Exam Detail, User Guide
- **FR-004**: Homepage MUST route Create New Exam clicks through authentication check: redirect to login if unauthenticated, redirect to exam form if authenticated

#### Authentication (Simulated)
- **FR-005**: System MUST simulate Google OAuth flow with mock consent/loading screen lasting 1-2 seconds
- **FR-006**: System MUST create mock user session after simulated OAuth completion with predefined data: name, email, avatar URL
- **FR-007**: System MUST persist authentication state across page navigations using frontend state management (localStorage or sessionStorage)
- **FR-008**: System MUST redirect user to originally intended destination after authentication (e.g., Create New Exam if clicked before login)
- **FR-009**: Authenticated navbar MUST display user avatar as clickable element with profile dropdown or menu

#### Create Exam Form
- **FR-010**: Create New Exam form MUST include required fields: academic year (text), exam name (text), subject name (text), duration in minutes (number), number of versions (number)
- **FR-011**: Create New Exam form MUST include optional fields: notes (textarea)
- **FR-012**: Create New Exam form MUST include simulated file upload for Word document with file type validation (.doc, .docx)
- **FR-013**: System MUST validate required fields before allowing form submission and display clear error messages for validation failures
- **FR-014**: System MUST validate numeric fields (duration > 0, versions > 0 and <= 10) before submission
- **FR-015**: System MUST create mock task on successful form submission with unique task ID (UUID or incrementing integer), "Pending" status, 0% progress, current timestamp
- **FR-016**: System MUST store task metadata (all form fields) in frontend state/mock database

#### Simulated Processing Pipeline
- **FR-017**: System MUST simulate five processing stages in sequence: extract, understand, shuffle, generate, with final "Completed" status
- **FR-018**: System MUST pause pipeline after "understand" stage completes and before "shuffle" begins (status becomes "Awaiting Confirmation")
- **FR-019**: System MUST update task progress percentage incrementally during each stage: extract (0-25%), understand (25-50%), shuffle (50-75%), generate (75-100%)
- **FR-020**: System MUST update task status enum during processing: Pending → Extracting → Understanding → Awaiting Confirmation → Shuffling → Generating → Completed
- **FR-021**: System MUST log each stage transition with timestamp, stage name, and status message in task logs
- **FR-022**: System MUST support simulated failure: randomly or manually set tasks to "Failed" status with error message in logs

#### Preview & Confirmation
- **FR-023**: System MUST automatically redirect user to Preview Exam Analysis Result page when task status becomes "Awaiting Confirmation"
- **FR-024**: Preview page MUST display mock extracted exam data: list of questions (minimum 10), each with question text, 4 answer options (A/B/C/D), detected correct answer
- **FR-025**: Preview page MUST display total question count prominently
- **FR-026**: Preview page MUST display "Confirm" button that resumes pipeline (changes status from "Awaiting Confirmation" to "Shuffling")
- **FR-027**: System MUST display processing modal after Confirm clicked, showing progress indicator for shuffle and generate stages
- **FR-028**: System MUST automatically redirect to Task Management page 5 seconds after Confirm clicked and modal displayed

#### Task Management & Polling
- **FR-029**: Task Management page MUST display all tasks created by authenticated user in paginated datatable
- **FR-030**: Datatable MUST show columns: Task ID, Exam Name, Subject, Status (badge), Progress (%), Created Date
- **FR-031**: Datatable MUST support pagination with configurable page size (default 10 tasks per page)
- **FR-032**: System MUST implement simulated polling: update task statuses and progress every 3 seconds automatically
- **FR-033**: Status badges MUST be color-coded: Pending (gray), Extracting/Understanding/Shuffling/Generating (blue/yellow), Completed (green), Failed (red)
- **FR-034**: System MUST display "Download" button for tasks with status "Completed" and hide/disable for other statuses
- **FR-035**: System MUST allow row click to navigate to Exam Detail page with task ID parameter

#### Exam Detail View
- **FR-036**: Exam Detail page MUST display three sections: Exam Metadata, Processing Status, Extracted Data
- **FR-037**: Exam Metadata section MUST show: academic year, exam name, subject, duration, number of versions, notes, uploaded filename
- **FR-038**: Processing Status section MUST show: status badge, progress bar (0-100%), scrollable logs with timestamps, created date, last updated date
- **FR-039**: Extracted Data section MUST show: full list of questions with content, answer options, correct answer highlighting
- **FR-040**: System MUST display "Retry" button in Processing Status section only when task status is "Failed"
- **FR-041**: Retry button MUST reset task to "Pending" status, 0% progress, log retry event with timestamp, and restart pipeline from extract stage
- **FR-042**: System MUST debounce or disable Retry button during active processing to prevent multiple rapid clicks
- **FR-043**: Detail page MUST implement same 3-second polling as Task Management to update status, progress, and logs in real-time

#### Mock Data & State Management
- **FR-044**: System MUST use frontend state management (React Context, Redux, Zustand, or similar) to store: authentication state, user data, task list, individual task details
- **FR-045**: System MUST persist critical state (authentication, task list) using localStorage or sessionStorage to survive page refreshes
- **FR-046**: System MUST provide configurable mock data: mock user "Trieu Kiem" with Vietnamese email (e.g., "trieu.kiem@university.edu") and avatar from Visily assets (./assets/IMG_1.webp), mock exam questions (10-20 questions with options and correct answers in Vietnamese)
- **FR-047**: System MUST simulate random or configurable processing durations per stage (2-10 seconds per stage, configurable for testing)

#### UI Implementation Architecture
- **FR-048**: Implementation planning MUST follow bottom-up order: Design Foundations → Core UI Elements → Shared Components → App Layout → Feature Sections → Pages → Mock Data/State → Integration Layer
- **FR-049**: Design Foundations phase MUST establish design tokens first: primary brand color #9a94de (purple), text colors #171a1f (dark), #565d6d (gray), border color #dee1e6, typography (Inter font family), spacing units, border radius values, shadow definitions, breakpoints derived from Visily designs. All UI text MUST be in Vietnamese matching Visily exports exactly.
- **FR-050**: Core UI Elements phase MUST implement atomic components before composite components: Button, Input, Select, Textarea, Checkbox, Badge, Avatar, Icon components with variants
- **FR-051**: Shared UI Components phase MUST build reusable compound components: Card, Modal, Datatable, Form Field wrappers, Progress Bar, Status Badge, Log Viewer before any page implementation
- **FR-052**: App Layout Structure phase MUST implement navigation shell and routing before feature pages: Navbar (with auth state), Sidebar (if applicable), Page layout container, Route configuration
- **FR-053**: Feature-Level Sections phase MUST implement page sections as standalone components: Exam Metadata Display, Processing Status Display, Question List Display, Task Summary Card
- **FR-054**: Page-Level Implementation phase MUST compose pages from sections and shared components, not create new one-off UI elements
- **FR-055**: Implementation MUST ensure all UI components are reusable, theme-able via design tokens, and documented with usage examples for scalability
- **FR-056**: Visual consistency MUST be enforced: all components use design tokens (no hardcoded colors/spacing), follow naming conventions, maintain consistent API patterns
- **FR-057**: Icon implementation MUST use @iconify/react library for standard icons (search, calendar, download, chevron, etc.) and extract custom SiroMix layered logo as dedicated SVG React component for brand consistency
- **FR-058**: Implementation MUST preserve exact Visily-exported values per page: shadows (e.g., shadow-sm vs custom shadow values), border radius (rounded-md vs rounded-[10px] vs rounded-xl), container padding variations (px-4 lg:px-[144px] vs lg:px-[120px] vs lg:px-36). Each page's styling MUST match its corresponding HTML export file exactly to maintain original design intent.

### Key Entities

- **User (Mock)**: Represents authenticated user. Attributes: user_id (auto-generated), name (mock: "Trieu Kiem"), email (mock: "trieu.kiem@university.edu"), avatar_url (mock image from Visily assets: ./assets/IMG_1.webp), authentication_status (boolean).

- **Task**: Represents exam processing job. Attributes: task_id (UUID or integer), user_id (FK to user), exam_metadata (object: academic_year, exam_name, subject, duration_minutes, num_versions, notes, uploaded_filename), status (enum: Pending/Extracting/Understanding/Awaiting Confirmation/Shuffling/Generating/Completed/Failed), progress (integer 0-100), logs (array of log entries), created_at (timestamp), updated_at (timestamp).

- **ExamData (Mock)**: Represents extracted exam content. Attributes: exam_id (matches task_id), questions (array of Question objects), total_question_count (integer).

- **Question (Mock)**: Represents individual exam question. Attributes: question_id (integer or string), question_text (string), options (array of 4 strings: A, B, C, D), correct_answer (string: A/B/C/D), question_order (integer for sorting).

- **TaskLog**: Represents processing log entry. Attributes: log_id (auto-increment), task_id (FK to task), timestamp (datetime), stage (enum: extract/understand/shuffle/generate), level (enum: info/warning/error), message (text description).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can navigate from homepage to all six main pages (Homepage, Login, Create Exam, Preview, Task Management, Detail) within 3 clicks or less
- **SC-002**: User can complete simulated authentication flow from clicking Login to seeing avatar in navbar within 5 seconds
- **SC-003**: User can fill Create Exam form and submit successfully within 2 minutes without confusion or validation errors (for valid data)
- **SC-004**: User can observe task progress updating from 0% to 100% through all five stages within 60 seconds (based on configurable mock timings)
- **SC-005**: Task Management page displays all created tasks with correct status badges and progress percentages, verified through visual inspection
- **SC-006**: Preview page correctly displays all mock question data (10+ questions with options and correct answers) in readable format
- **SC-007**: User can confirm analysis and observe automatic redirect to Task Management within 10 seconds of clicking Confirm
- **SC-008**: Simulated polling updates task status and progress on Task Management page every 3 seconds without manual refresh, verified through console logs or visual observation
- **SC-009**: User can retry a failed task and observe it restart from 0% through all stages again, verified by status and log changes
- **SC-010**: Download button appears only for completed tasks and is hidden for in-progress or failed tasks, verified through UI state inspection
- **SC-011**: Authentication state persists across page refreshes without requiring re-login, verified by reloading page and checking navbar avatar
- **SC-012**: All form validation errors display clear, user-friendly messages that guide users to correct input mistakes

## Assumptions *(optional)*

- Frontend framework will be Next.js (React) with TypeScript (consistent with existing 001-mvp-foundation feature)
- Visily exported HTML from `./html/` directory serves as exact design specification - implementation must convert HTML/CSS/React files from Visily into reusable React components while preserving exact styling values (shadows, border radius, padding) per page as shown in exports
- **Implementation follows bottom-up approach**: design tokens and atomic components built first, then composed into pages (not page-first development)
- **Planning phase will structure implementation in 9 phases**: (1) Design Foundations (tokens), (2) Core UI Elements (atoms), (3) Shared Components (molecules), (4) App Layout, (5) Feature Sections (organisms), (6) Pages (templates), (7) Mock Data/State, (8) Interactions, (9) Integration Layer
- Design system will be created from Visily designs through token extraction (brand color #9a94de, text colors #171a1f/#565d6d, border #dee1e6, Inter font, etc.) with page-specific styling preserved exactly as exported
- Mock OAuth does not require Google API credentials or real OAuth2 configuration
- File upload simulation uses HTML file input with client-side validation only (no actual file processing or server upload)
- Simulated processing stages use JavaScript timers (setTimeout/setInterval) with configurable durations (default 5 seconds per stage)
- Mock exam data will be hardcoded in frontend source or loaded from a local JSON file (10-20 sample questions)
- State persistence using localStorage is acceptable for MVP (no backend session management)
- Simulated polling does not make real HTTP requests (purely frontend state updates based on timers)
- Task data is stored in frontend state only (no real database or API calls in this phase)
- Download functionality can be mocked with alert/console message or downloading a placeholder PDF/text file
- User Guide page can be a simple static content page or link to external documentation
- Avatar images sourced from Visily assets folder (./assets/IMG_1.webp for Trieu Kiem user)
- No responsive mobile design required for MVP (desktop-first, minimum 1024px viewport width)
- All UI text and content must be in Vietnamese matching Visily exports exactly (no internationalization or English fallbacks)
- Browser support: modern browsers only (Chrome, Firefox, Safari, Edge - last 2 versions)

## Non-Functional Requirements *(optional)*

- **NFR-001**: UI components must be reusable and modular to facilitate future backend integration
- **NFR-002**: Mock data models and interfaces must match expected backend API schemas for seamless future integration
- **NFR-003**: Form validation must provide immediate feedback (inline validation) without page refresh
- **NFR-004**: All simulated async operations (OAuth, processing stages, polling) must display loading states to provide user feedback
- **NFR-005**: Code must follow React best practices: functional components with hooks, TypeScript for type safety, consistent component structure
- **NFR-006**: Polling intervals must be configurable (default 3 seconds) for testing different update frequencies
- **NFR-007**: Mock processing stage durations must be configurable for testing rapid completion or slower scenarios
- **NFR-008**: UI must follow consistent design system derived from Visily exports (colors, typography, spacing, component styles)
- **NFR-009**: Navigation must use client-side routing (Next.js App Router or React Router) without full page reloads
- **NFR-010**: State management solution must centralize mock data and provide clear API for future backend service integration layer
- **NFR-011**: Design tokens must be centralized in a single source of truth (e.g., theme.ts, tokens.ts) and used consistently across all components
- **NFR-012**: Component library must follow atomic design principles: atoms (Button, Input) → molecules (FormField) → organisms (ExamForm) → templates (PageLayout) → pages
- **NFR-013**: All components must be self-contained with co-located styles, accept props for customization, and avoid tight coupling to parent components
- **NFR-014**: Implementation plan must explicitly prevent "page-first" development that creates one-off UI patterns instead of reusable components
- **NFR-015**: Code reviews must verify new UI elements reuse existing components before allowing introduction of new base components

## Out of Scope *(optional)*

This feature explicitly excludes:

- Real Google OAuth integration with OAuth2 flow, token management, or Google API credentials
- Backend API implementation, server-side processing, or database integration
- Actual Word document parsing, extraction, or AI-powered understanding
- Real shuffle algorithm implementation or exam variant generation logic
- Actual DOCX file rendering or output generation
- User account creation, profile management, or password reset flows
- Multi-user support or user-specific data isolation (single mock user acceptable)
- Real-time WebSocket connections for live updates (timers sufficient for mock)
- Advanced error handling or retry policies beyond basic simulated failure
- Accessibility compliance (WCAG) beyond basic HTML semantics
- Performance optimization, bundle size reduction, or production deployment configuration
- Comprehensive test coverage (unit tests, integration tests, E2E tests) - basic manual testing acceptable
- Analytics, logging, or monitoring integration
- Email notifications or webhook triggers
- Admin panel or user management interfaces
- Rate limiting, quota management, or usage tracking
- Multi-tenancy or organization features
- Dark mode or theme customization
- Advanced datatable features (sorting, filtering, search) beyond basic pagination
- Export features beyond simulated download button
- Collaborative editing or multi-user concurrent access
- Offline support or Progressive Web App (PWA) capabilities

## Clarifications

### Session 2026-03-10

- Q: What is the primary brand color for SiroMix? → A: Purple brand: #9a94de (primary), #171a1f (text-dark), #565d6d (text-gray), #dee1e6 (borders) — extracted from Visily. Layout must follow all HTML folder designs per page.
- Q: What language should the UI use? → A: Vietnamese — Use Vietnamese for all UI text, buttons, labels, messages matching Visily exports exactly. The implementation must convert HTML/CSS/React files from Visily into a proper design system based on what exists in the html/ directory.
- Q: Which mock user should the application use? → A: Use Visily user: "Trieu Kiem", Vietnamese email (e.g., "trieu.kiem@university.edu"), avatar from Visily assets (./assets/IMG_1.webp).
- Q: How should icons be implemented? → A: Use @iconify/react library for standard icons (search, calendar, download, etc.) + extract only custom SiroMix layered logo as dedicated SVG component for brand consistency.
- Q: Should the design system normalize inconsistent values or preserve each page's unique styling? → A: Preserve exact Visily values per page — Keep all exported values exactly as designed (shadows, border radius, container padding variations). Follow each page's Visily export precisely to maintain design intent.
- **Note**: html/ folder structure confirmed — Each subdirectory represents one application page with complete design export: "SiroMix - Homepage" → Homepage, "SiroMix - Login Screen" → Login page, "SiroMix- Create New Exam" → Create exam form, "SiroMix - Task Management" → Task list view, "SiroMix - Exam Detail" → Task detail view, "SiroMix - Exam Analysis Result" → Preview analysis page. Total: 6 page designs mapping to 6 user stories (US1-US6).
