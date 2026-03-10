# Component Contracts: SiroMix UI MVP

**Feature**: 002-ui-mock-mvp  
**Date**: 2026-03-10  
**Purpose**: Define component APIs and prop interfaces

---

## Contract Philosophy

All components follow these principles:
- **Props-based configuration**: No external dependencies, all behavior controlled via props
- **TypeScript interfaces**: All props strictly typed with JSDoc comments
- **Controlled/Uncontrolled support**: Form inputs support both patterns where applicable
- **Accessibility**: ARIA attributes required, keyboard navigation supported
- **Composition over configuration**: Components compose from smaller components

---

## Design System Components

### Tokens (`components/design-system/tokens.ts`)

**Export Signature**:
```typescript
export const colors: {
  primary: Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;
  gray: Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;
  status: {
    pending: string;
    extracting: string;
    understanding: string;
    awaiting: string;
    shuffling: string;
    generating: string;
    completed: string;
    failed: string;
  };
  success: string;
  warning: string;
  error: string;
  info: string;
};

export const typography: {
  fontFamily: {
    sans: string;
    mono: string;
  };
  fontSize: Record<'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl', string>;
  fontWeight: Record<'normal' | 'medium' | 'semibold' | 'bold', number>;
  lineHeight: Record<'tight' | 'normal' | 'relaxed', string>;
};

export const spacing: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl', string>;

export const borderRadius: Record<'sm' | 'md' | 'lg' | 'full', string>;

export const shadows: Record<'sm' | 'md' | 'lg' | 'xl', string>;
```

**Usage Example**:
```typescript
import { colors, spacing } from '@/components/design-system/tokens';

const Button = styled.button`
  background-color: ${colors.primary[500]};
  padding: ${spacing.sm} ${spacing.md};
`;
```

---

## Atomic Components (Atoms)

### Button (`components/ui/Button.tsx`)

**Props Interface**:
```typescript
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}
```

**Contract**:
- **Variants**: Primary (filled), Secondary (subtle), Outline (border), Ghost (minimal), Danger (red)
- **Sizes**: sm (h-8, px-3, text-sm), md (h-10, px-4, text-base), lg (h-12, px-6, text-lg)
- **Loading state**: Displays spinner, disables button, optionally shows loadingText
- **Icons**: Left/right icons rendered with proper spacing, use any ReactNode
- **Accessibility**: Always has aria-label or text content, aria-busy when loading, aria-disabled when disabled
- **Behavior**: Inherits all HTMLButtonElement props (onClick, type, disabled, etc.)

**Usage Example**:
```tsx
<Button 
  variant="primary" 
  size="md" 
  isLoading={isSubmitting}
  loadingText="Creating..."
  leftIcon={<PlusIcon />}
  onClick={handleCreate}
>
  Create Exam
</Button>
```

---

### Input (`components/ui/Input.tsx`)

**Props Interface**:
```typescript
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  hasError?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}
```

**Contract**:
- **Variants**: Default (border), Filled (background), Outlined (thick border)
- **Sizes**: sm (h-8, text-sm), md (h-10, text-base), lg (h-12, text-lg)
- **Error state**: Red border when hasError=true
- **Icons**: Left/right icons rendered inside input container
- **Accessibility**: Requires associated <label> with htmlFor, aria-invalid when hasError
- **Behavior**: Inherits all HTMLInputElement props (value, onChange, type, placeholder, etc.)

**Usage Example**:
```tsx
<Input
  type="text"
  placeholder="Enter exam name"
  hasError={!!errors.examName}
  leftIcon={<DocumentIcon />}
  aria-invalid={!!errors.examName}
  aria-describedby={errors.examName ? 'exam-name-error' : undefined}
  {...register('examName')}
/>
```

---

### Badge (`components/ui/Badge.tsx`)

**Props Interface**:
```typescript
export interface BadgeProps {
  variant: 'pending' | 'extracting' | 'understanding' | 'awaiting' | 'shuffling' | 'generating' | 'completed' | 'failed';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}
```

**Contract**:
- **Variants**: Maps to TaskStatus colors from design tokens
  - pending: gray
  - extracting/understanding: blue
  - awaiting: amber
  - shuffling/generating: purple
  - completed: green
  - failed: red
- **Sizes**: sm (px-2, py-0.5, text-xs), md (px-3, py-1, text-sm), lg (px-4, py-1.5, text-base)
- **Accessibility**: Uses semantic <span> with aria-label describing status
- **Behavior**: Read-only display, no interactions

**Usage Example**:
```tsx
<Badge variant="extracting" size="md" aria-label="Task is extracting questions">
  Extracting
</Badge>
```

---

### ProgressBar (`components/ui/ProgressBar.tsx`)

**Props Interface**:
```typescript
export interface ProgressBarProps {
  value: number;                // 0-100 percentage
  max?: number;                 // Default: 100
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;           // Display percentage text
  label?: string;                // Override default "X%" label
  animated?: boolean;            // Animate fill on value change
}
```

**Contract**:
- **Value**: Number between 0 and max (default 100), clamped automatically
- **Variants**: primary (blue), success (green), warning (amber), error (red)
- **Sizes**: sm (h-2), md (h-4), lg (h-6)
- **Label**: Optional percentage display, can be overridden with custom text
- **Animation**: Smooth transition when value changes (transition-all duration-300)
- **Accessibility**: Uses <progress> element with aria-valuenow, aria-valuemin, aria-valuemax

**Usage Example**:
```tsx
<ProgressBar 
  value={task.progress} 
  variant="primary" 
  size="md" 
  showLabel 
  animated 
  aria-label={`Task progress: ${task.progress}%`}
/>
```

---

### Spinner (`components/ui/Spinner.tsx`)

**Props Interface**:
```typescript
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'white' | 'gray';
  label?: string;                // Accessible label
}
```

**Contract**:
- **Sizes**: sm (w-4 h-4), md (w-6 h-6), lg (w-8 h-8), xl (w-12 h-12)
- **Variants**: primary (blue), white (for dark backgrounds), gray (neutral)
- **Animation**: CSS spin animation (360deg rotate, 1s linear infinite)
- **Accessibility**: role="status", aria-label with label prop or default "Loading"

**Usage Example**:
```tsx
<Spinner size="md" variant="primary" label="Loading tasks..." />
```

---

## Molecular Components (Molecules)

### FormField (`components/shared/FormField.tsx`)

**Props Interface**:
```typescript
export interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;   // Input component
}
```

**Contract**:
- **Composition**: Wraps <label>, input (children), error message, helper text
- **Required indicator**: Shows red asterisk (*) if required=true
- **Error display**: Shows error message in red below input if error is provided
- **Helper text**: Shows gray helper text below input if no error
- **Accessibility**: Associates label with input via htmlFor, error has id="{htmlFor}-error" for aria-describedby

**Usage Example**:
```tsx
<FormField 
  label="Exam Name" 
  htmlFor="exam-name" 
  required 
  error={errors.examName?.message}
  helperText="Enter a descriptive name for the exam"
>
  <Input 
    id="exam-name" 
    hasError={!!errors.examName}
    aria-describedby={errors.examName ? 'exam-name-error' : 'exam-name-helper'}
    {...register('examName')}
  />
</FormField>
```

---

### Card (`components/shared/Card.tsx`)

**Props Interface**:
```typescript
export interface CardProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  header?: React.ReactNode;     // Optional header section
  footer?: React.ReactNode;     // Optional footer section
  onClick?: () => void;         // Interactive card
  className?: string;           // Additional Tailwind classes
}
```

**Contract**:
- **Variants**: default (subtle background), outlined (border), elevated (shadow)
- **Padding**: none (for custom padding), sm (p-4), md (p-6), lg (p-8)
- **Sections**: Optional header/footer with borders, children in middle section
- **Interactive**: If onClick provided, add hover state and cursor-pointer
- **Accessibility**: If interactive, role="button" and keyboard support (Enter/Space)

**Usage Example**:
```tsx
<Card 
  variant="elevated" 
  padding="md"
  header={<h2>Exam Details</h2>}
  footer={<Button>View Full Details</Button>}
>
  <p>Midterm Exam - Mathematics</p>
</Card>
```

---

### Modal (`components/shared/Modal.tsx`)

**Props Interface**:
```typescript
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;     // Optional footer with actions
}
```

**Contract**:
- **Open state**: Controlled by isOpen prop, onClose callback when closed
- **Sizes**: sm (max-w-md), md (max-w-lg), lg (max-w-2xl), xl (max-w-4xl), full (max-w-full)
- **Close behavior**: Close button (X icon), overlay click (if enabled), Escape key (if enabled)
- **Sections**: Title bar with close button, content (children), optional footer
- **Accessibility**: role="dialog", aria-labelledby with title, focus trap, modal overlay (backdrop)
- **Body scroll lock**: Prevents body scroll when modal is open (overflow-hidden on body)

**Usage Example**:
```tsx
<Modal
  isOpen={isConfirmOpen}
  onClose={() => setConfirmOpen(false)}
  title="Confirm Deletion"
  size="md"
  showCloseButton
  closeOnOverlayClick
  closeOnEsc
  footer={
    <>
      <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
      <Button variant="danger" onClick={handleDelete}>Delete</Button>
    </>
  }
>
  <p>Are you sure you want to delete this task?</p>
</Modal>
```

---

### FileUpload (`components/shared/FileUpload.tsx`)

**Props Interface**:
```typescript
export interface FileUploadProps {
  accept: string;               // File MIME types (e.g., ".doc,.docx")
  maxSize?: number;             // Max file size in bytes
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
  currentFile?: File | null;    // Controlled component
}
```

**Contract**:
- **Accept**: File type filter (passed to input accept attribute)
- **Max size**: Validates file size, shows error if exceeded
- **Change handler**: Called with File object when file selected, null when cleared
- **Error display**: Shows error message below upload area
- **Current file**: Displays selected file name and size, with clear button
- **Drag and drop**: Supports file drop in addition to click to select
- **Accessibility**: Proper label, aria-describedby for errors, keyboard accessible

**Usage Example**:
```tsx
<FileUpload
  accept=".doc,.docx"
  maxSize={5 * 1024 * 1024} // 5MB
  onChange={(file) => setValue('file', file)}
  error={errors.file?.message}
  currentFile={watchedFile}
/>
```

---

## Organism Components (Organisms)

### Datatable (`components/shared/Datatable.tsx`)

**Props Interface**:
```typescript
export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;               // CSS width (e.g., "200px", "20%")
}

export interface DatatableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyState?: React.ReactNode;
  loading?: boolean;
  onRowClick?: (item: T) => void;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    sortBy: keyof T | string;
    sortOrder: 'asc' | 'desc';
    onSortChange: (sortBy: keyof T | string, sortOrder: 'asc' | 'desc') => void;
  };
}
```

**Contract**:
- **Columns**: Array of column definitions with optional custom render function
- **Data**: Array of items to display, typed generically
- **Key extractor**: Function to get unique key from each item (for React key prop)
- **Empty state**: Custom component shown when data is empty
- **Loading state**: Shows skeleton rows when loading=true
- **Row click**: Optional click handler for each row (makes row interactive)
- **Pagination**: Optional pagination controls, shows page numbers and prev/next
- **Sorting**: Optional column sorting, shows sort indicators in headers
- **Accessibility**: Proper table semantics (<table>, <thead>, <tbody>), sortable headers have aria-sort

**Usage Example**:
```tsx
<Datatable
  data={tasks}
  columns={[
    { key: 'file_name', header: 'File Name', sortable: true },
    { key: 'status', header: 'Status', render: (task) => <Badge variant={task.status}>{task.status}</Badge> },
    { key: 'progress', header: 'Progress', render: (task) => <ProgressBar value={task.progress} /> },
    { key: 'created_at', header: 'Created', render: (task) => formatDate(task.created_at) },
  ]}
  keyExtractor={(task) => task.task_id}
  onRowClick={(task) => router.push(`/tasks/${task.task_id}`)}
  pagination={{
    currentPage: page,
    pageSize: 10,
    totalItems: tasks.length,
    onPageChange: setPage,
  }}
  sorting={{
    sortBy: sortColumn,
    sortOrder: sortOrder,
    onSortChange: handleSort,
  }}
  emptyState={<p>No tasks found. Create your first exam!</p>}
/>
```

---

### ExamMetadataForm (`components/sections/ExamMetadataForm.tsx`)

**Props Interface**:
```typescript
export interface ExamMetadataFormProps {
  onSubmit: (data: ExamMetadata & { file: File }) => void | Promise<void>;
  defaultValues?: Partial<ExamMetadata>;
  isSubmitting?: boolean;
  submitButtonText?: string;
}
```

**Contract**:
- **Submit handler**: Called with form data (metadata + file), supports async
- **Default values**: Pre-populate form fields (useful for edit mode)
- **Submitting state**: Disables form and shows loading on submit button
- **Validation**: Uses createExamSchema (Zod), shows inline errors via FormField
- **Fields**: Academic year, exam name, subject, duration, num versions, notes, file upload
- **File upload**: Validates .doc/.docx only, max 5MB
- **Accessibility**: All fields have labels, errors associated via aria-describedby

**Usage Example**:
```tsx
<ExamMetadataForm
  onSubmit={async (data) => {
    const task = taskStore.createTask(data, data.file.name, data.file.size);
    await simulateProcessing(task.task_id);
  }}
  isSubmitting={isCreating}
  submitButtonText="Create Exam"
/>
```

---

### ProcessingStatus (`components/sections/ProcessingStatus.tsx`)

**Props Interface**:
```typescript
export interface ProcessingStatusProps {
  task: Task;
  onConfirm?: () => void;       // Called when user confirms at "awaiting" stage
  onCancel?: () => void;        // Called when user cancels task
  onRetry?: () => void;         // Called when user retries failed task
  showLogs?: boolean;           // Show TaskLog timeline
  logs?: TaskLog[];             // Optional logs to display
}
```

**Contract**:
- **Task display**: Shows current status badge, progress bar, metadata
- **Confirmation**: Shows "Confirm" button when status is "awaiting", calls onConfirm
- **Retry**: Shows "Retry" button when status is "failed" and retry_count < 2, calls onRetry
- **Cancel**: Shows "Cancel" button when status is not "completed" or "failed", calls onCancel
- **Logs**: Optional expandable section showing TaskLog timeline with timestamps
- **Real-time**: Updates reactive to task prop changes (polling updates task in store)
- **Accessibility**: Status announced via aria-live region when it changes

**Usage Example**:
```tsx
<ProcessingStatus
  task={currentTask}
  onConfirm={() => taskStore.confirmProcessing(currentTask.task_id)}
  onRetry={() => taskStore.retryTask(currentTask.task_id)}
  showLogs
  logs={taskLogs}
/>
```

---

### QuestionList (`components/sections/QuestionList.tsx`)

**Props Interface**:
```typescript
export interface QuestionListProps {
  questions: Question[];
  variant?: 'compact' | 'detailed';
  editable?: boolean;           // Future: inline editing
  onQuestionClick?: (question: Question) => void;
}
```

**Contract**:
- **Variants**: 
  - compact: Show question number, text snippet, correct answer badge
  - detailed: Show full question, all 4 options, correct answer highlight, learning objective
- **Question click**: Optional handler for clickable questions
- **Editable**: Future prop for inline editing (not implemented in MVP)
- **Display**: Numbered list (1-based), formatted options (A, B, C, D)
- **Accessibility**: Semantic list (<ol>), questions have role="listitem"

**Usage Example**:
```tsx
<QuestionList
  questions={examData.questions}
  variant="detailed"
  onQuestionClick={(q) => console.log('Clicked:', q.question_text)}
/>
```

---

## Layout Components (Templates)

### Navbar (`components/layout/Navbar.tsx`)

**Props Interface**:
```typescript
export interface NavbarProps {
  user: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
}
```

**Contract**:
- **Branding**: Logo and "SiroMix" text on left
- **Navigation**: Links to Home, Tasks (visible only when authenticated)
- **Auth display**: 
  - Not authenticated: "Sign in with Google" button, calls onLogin
  - Authenticated: User avatar + name, dropdown with Logout, calls onLogout
- **Sticky**: Fixed to top of viewport (sticky top-0 z-50)
- **Accessibility**: Nav landmarks, proper link semantics

**Usage Example**:
```tsx
<Navbar
  user={authStore.user}
  onLogin={() => authStore.login(mockUser)}
  onLogout={() => authStore.logout()}
/>
```

---

### PageContainer (`components/layout/PageContainer.tsx`)

**Props Interface**:
```typescript
export interface PageContainerProps {
  title?: string;               // Page title (H1)
  subtitle?: string;            // Optional subtitle
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;    // Header actions (e.g., buttons)
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}
```

**Contract**:
- **Layout**: Centered container with max-width constraint, responsive padding
- **Header**: Optional title, subtitle, breadcrumbs, action buttons
- **Max width**: Container constraint (sm=640px, md=768px, lg=1024px, xl=1280px, 2xl=1536px, full=100%)
- **Spacing**: Consistent vertical spacing between sections
- **Accessibility**: H1 for title, breadcrumb nav with aria-label

**Usage Example**:
```tsx
<PageContainer
  title="My Exams"
  subtitle="View and manage your exam processing tasks"
  breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Tasks' },
  ]}
  actions={<Button onClick={() => router.push('/create')}>Create Exam</Button>}
  maxWidth="2xl"
>
  <Datatable data={tasks} columns={columns} />
</PageContainer>
```

---

### AuthGuard (`components/layout/AuthGuard.tsx`)

**Props Interface**:
```typescript
export interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;   // Shown when not authenticated
  redirectTo?: string;          // Redirect instead of showing fallback
}
```

**Contract**:
- **Authentication check**: Reads auth state from authStore
- **Behavior**:
  - If authenticated: Render children
  - If not authenticated and fallback provided: Render fallback
  - If not authenticated and redirectTo provided: Redirect to that path
  - If not authenticated and neither provided: Redirect to home
- **Loading state**: Shows spinner while checking auth (isLoading)
- **SSR safe**: Only checks auth on client side (useEffect)

**Usage Example**:
```tsx
<AuthGuard fallback={<p>Please sign in to access this page.</p>}>
  <CreateExamPage />
</AuthGuard>
```

---

## Hooks

### useTaskPolling (`hooks/useTaskPolling.ts`)

**API Signature**:
```typescript
export interface UseTaskPollingOptions {
  taskId: string;
  interval?: number;            // Milliseconds (default: 3000)
  enabled?: boolean;            // Start/stop polling
  onComplete?: (task: Task) => void;
  onError?: (task: Task) => void;
}

export function useTaskPolling(options: UseTaskPollingOptions): {
  task: Task | null;
  isPolling: boolean;
  stopPolling: () => void;
}
```

**Contract**:
- **Polling**: Checks task status every `interval` ms (default 3s)
- **Auto-stop**: Stops when task status is "completed" or "failed"
- **Callbacks**: Calls onComplete/onError when task reaches terminal states
- **Enabled control**: Can start/stop polling via `enabled` option
- **Cleanup**: Automatically cleans up interval on unmount or when enabled=false

**Usage Example**:
```tsx
const { task, isPolling } = useTaskPolling({
  taskId: taskId,
  interval: 3000,
  enabled: true,
  onComplete: (task) => {
    toast.success('Exam processed successfully!');
    router.push(`/tasks/${task.task_id}`);
  },
  onError: (task) => {
    toast.error(task.error || 'Processing failed');
  },
});
```

---

## Summary

| Component | Type | Key Props | Purpose |
|-----------|------|-----------|---------|
| Button | Atom | variant, size, isLoading | Primary interaction element |
| Input | Atom | hasError, leftIcon | Text input with validation |
| Badge | Atom | variant (status) | Status display |
| ProgressBar | Atom | value, animated | Task progress visualization |
| FormField | Molecule | label, error, helperText | Form field wrapper with label/error |
| Card | Molecule | variant, header, footer | Content container |
| Modal | Molecule | isOpen, onClose, title | Dialog overlay |
| FileUpload | Molecule | accept, onChange, maxSize | Drag-and-drop file selector |
| Datatable | Organism | data, columns, pagination | Sortable/paginated table |
| ExamMetadataForm | Organism | onSubmit, validation | Create exam form |
| ProcessingStatus | Organism | task, onConfirm, onRetry | Task status display with actions |
| QuestionList | Organism | questions, variant | Display extracted questions |
| Navbar | Template | user, onLogin, onLogout | App header with auth |
| PageContainer | Template | title, breadcrumbs, actions | Page layout wrapper |
| AuthGuard | Template | children, fallback, redirectTo | Protected route wrapper |

All contracts enforce **Schema-First** (Principle II) via TypeScript interfaces and support **Unit Testing** (Principle IX) through predictable, props-based APIs.
