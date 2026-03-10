# Quickstart: SiroMix UI MVP (Mock Data Phase)

**Feature**: 002-ui-mock-mvp  
**Date**: 2026-03-10  
**Purpose**: Setup and run the frontend UI with mock data

---

## Prerequisites

- **Node.js**: 18.x or higher (check with `node --version`)
- **npm**: 9.x or higher (bundled with Node.js)
- **Git**: Installed and configured
- **VS Code** (recommended): With TypeScript, ESLint, Tailwind CSS extensions

---

## Initial Setup

### 1. Install Dependencies

From the repository root:

```bash
cd frontend
npm install
```

**Expected output:**
```
added 247 packages, and audited 248 packages in 15s
```

**Key dependencies installed:**
- `next@14.x` - Next.js framework with App Router
- `react@18.x`, `react-dom@18.x` - React library
- `typescript@5.x` - TypeScript compiler
- `tailwindcss@3.x` - Utility-first CSS framework
- `zustand@4.x` - State management
- `react-hook-form@7.x` - Form handling
- `zod@3.x` - Schema validation
- `vitest@1.x` - Testing framework
- `@testing-library/react@14.x` - Component testing utilities

---

### 2. Verify Configuration

Check that these config files exist (created in 001-mvp-foundation):

- `frontend/next.config.js` - Next.js configuration
- `frontend/tailwind.config.js` - Tailwind CSS configuration
- `frontend/tsconfig.json` - TypeScript configuration
- `frontend/vitest.config.ts` - Vitest test configuration
- `frontend/postcss.config.js` - PostCSS configuration (for Tailwind)

**Minimal `next.config.js` for MVP:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
```

---

## Running the Application

### Development Server

Start the Next.js development server:

```bash
npm run dev
```

**Expected output:**
```
> frontend@0.1.0 dev
> next dev

   ▲ Next.js 14.1.0
   - Local:        http://localhost:3000
   - Ready in 2.3s
```

**Open in browser**: http://localhost:3000

**Features enabled:**
- ✅ Hot module replacement (HMR) - changes reflect immediately
- ✅ Fast Refresh - component state preserved on edit
- ✅ TypeScript type checking in terminal
- ✅ Tailwind CSS with JIT compilation

---

### Production Build

Build optimized production bundle:

```bash
npm run build
```

Start production server:

```bash
npm start
```

**Note**: Production mode disables HMR and uses optimized bundles. Use for final testing only.

---

## Application Structure

### Pages (Routes)

Next.js 14 App Router uses file-based routing in `src/app/`:

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Homepage with hero and feature overview |
| `/login` | `app/login/page.tsx` | Simulated Google OAuth login (mock) |
| `/create` | `app/create/page.tsx` | Create exam form (protected) |
| `/preview/:id` | `app/preview/[id]/page.tsx` | Preview analysis and confirm (protected) |
| `/tasks` | `app/tasks/page.tsx` | Task list with status table (protected) |
| `/tasks/:id` | `app/tasks/[id]/page.tsx` | Task detail with questions (protected) |

**Protected routes** require authentication - wrapped in `<AuthGuard>` component.

---

### Component Directory

Organized by atomic design (per FR-048):

```
src/components/
├── design-system/        # Design tokens and theme
│   ├── tokens.ts         # Colors, typography, spacing
│   └── theme.ts          # Tailwind theme extension
├── ui/                   # Atoms (basic UI elements)
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Badge.tsx
│   ├── ProgressBar.tsx
│   └── Spinner.tsx
├── shared/               # Molecules (composite components)
│   ├── FormField.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── FileUpload.tsx
│   └── Datatable.tsx
├── sections/             # Organisms (feature-specific)
│   ├── ExamMetadataForm.tsx
│   ├── ProcessingStatus.tsx
│   └── QuestionList.tsx
├── layout/               # Templates (page layouts)
│   ├── Navbar.tsx
│   ├── PageContainer.tsx
│   └── AuthGuard.tsx
└── pages/                # Page-specific components (if needed)
```

---

### State Management

**Zustand stores** in `src/lib/state/`:

```typescript
// Auth store (manages authentication state)
import { useAuthStore } from '@/lib/state/auth-store';

const { user, isAuthenticated, login, logout } = useAuthStore();

// Task store (manages exam tasks)
import { useTaskStore } from '@/lib/state/task-store';

const { tasks, createTask, updateTaskStatus, retryTask } = useTaskStore();
```

**localStorage persistence**: State automatically saved and restored on page refresh.

---

### Mock Data

**Mock data files** in `src/lib/mock-data/`:

- `users.ts` - Mock authenticated user (John Doe)
- `questions.ts` - 15 sample exam questions
- `tasks.ts` - Factory function to create mock tasks

**Using mock data:**
```typescript
import { mockUser } from '@/lib/mock-data/users';
import { mockQuestions } from '@/lib/mock-data/questions';
import { createMockTask } from '@/lib/mock-data/tasks';

// Simulate login
authStore.login(mockUser);

// Create task with mock data
const task = createMockTask({
  academic_year: '2024-2025',
  exam_name: 'Midterm Exam',
  subject: 'Mathematics',
  duration_minutes: 90,
  num_versions: 3,
}, mockUser.user_id);
```

---

## Testing

### Run Unit Tests

Execute all component tests:

```bash
npm run test
```

**Expected output:**
```
 ✓ src/components/ui/Button.test.tsx (3 tests)
 ✓ src/components/ui/Input.test.tsx (4 tests)
 ✓ src/components/shared/FormField.test.tsx (2 tests)

Test Files  3 passed (3)
     Tests  9 passed (9)
  Start at  14:23:15
  Duration  1.42s
```

### Watch Mode

Run tests in watch mode (re-runs on file changes):

```bash
npm run test:watch
```

### Coverage Report

Generate test coverage report:

```bash
npm run test:coverage
```

**Output**: Coverage report in `frontend/coverage/index.html`

**Target coverage** (per Principle IX):
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

---

## Development Workflow

### Typical Developer Flow

1. **Start dev server**: `npm run dev` (terminal stays open)
2. **Create component**: e.g., `src/components/ui/Button.tsx`
3. **View in browser**: http://localhost:3000 (auto-refreshes on save)
4. **Write test**: `src/components/ui/Button.test.tsx`
5. **Run tests**: `npm run test` (in separate terminal)
6. **Iterate**: Edit component → save → verify in browser and tests

### Design Token Workflow

1. **Extract from Visily**: Open `./html/*` files, inspect CSS variables
2. **Add to tokens.ts**: `src/components/design-system/tokens.ts`
3. **Configure Tailwind**: Update `tailwind.config.js` to use tokens
4. **Use in components**: Reference tokens via Tailwind classes or import tokens directly

**Example token extraction:**
```typescript
// From Visily HTML: <div class="text-primary-500">
// → Extract: primary-500: #3B82F6

// Add to tokens.ts:
export const colors = {
  primary: {
    500: '#3B82F6',
  },
};

// Use in component:
<Button className="bg-primary-500">Click me</Button>
```

---

## User Flows

### 1. Authentication Flow (Mock)

**Steps:**
1. Navigate to http://localhost:3000
2. Click "Sign in with Google" button in Navbar
3. Redirected to `/login` page
4. Click "Continue with Google" (simulates OAuth)
5. localStorage updated with mock user
6. Redirected back to homepage
7. Navbar shows user avatar and name

**State changes:**
```typescript
// Before login
authStore.isAuthenticated === false
authStore.user === null

// After login
authStore.isAuthenticated === true
authStore.user === { user_id: 'mock-user-1', email: 'john.doe@...', ... }
```

---

### 2. Create Exam Flow

**Steps:**
1. Ensure logged in (see Authentication Flow)
2. Click "Create Exam" button on homepage or navigate to `/create`
3. Fill out form:
   - Academic Year: "2024-2025"
   - Exam Name: "Midterm Exam"
   - Subject: "Mathematics"
   - Duration: 90 minutes
   - Number of Versions: 3
   - Notes: (optional)
   - File: Upload .docx file (drag-and-drop or click)
4. Click "Create Exam" button
5. Form validates (inline errors shown if invalid)
6. If valid, task created and added to store
7. Redirected to `/preview/{task_id}` page

**State changes:**
```typescript
// After form submission
taskStore.tasks.push(newTask)
// newTask: { task_id: 'abc123', status: 'pending', progress: 0, ... }
```

---

### 3. Processing Simulation Flow

**Steps:**
1. On `/preview/{task_id}` page, review task metadata
2. Processing starts automatically (status: pending → extracting)
3. Watch progress bar increment (0% → 25% → 50%)
4. Status badge changes: Pending → Extracting → Understanding → Awaiting Confirmation
5. At "Awaiting Confirmation" (50% progress), processing pauses
6. Click "Confirm and Continue" button
7. Processing resumes: Awaiting → Shuffling → Generating → Completed
8. Progress bar reaches 100%
9. Status badge shows "Completed" (green)
10. "View Details" button appears
11. Click "View Details" → redirected to `/tasks/{task_id}` with extracted questions

**Timeline:**
- 0s: pending (0%)
- 5s: extracting (12%)
- 10s: understanding (37%)
- 15s: awaiting confirmation (50%) → **PAUSE** → user clicks Confirm
- 20s: shuffling (62%)
- 25s: generating (87%)
- 30s: completed (100%)

**State changes:**
```typescript
// Polling hook updates task every 3 seconds
useTaskPolling({ taskId, interval: 3000, onComplete: () => {...} })

// Task updates:
task.status: 'pending' → 'extracting' → 'understanding' → 'awaiting' → 'shuffling' → 'generating' → 'completed'
task.progress: 0 → 12 → 37 → 50 → 62 → 87 → 100
```

---

### 4. Retry Failed Task Flow

**Steps:**
1. Navigate to `/tasks` page (task list)
2. Find a failed task (red "Failed" badge)
3. Click on task row → navigate to `/tasks/{task_id}`
4. See error message: "Processing failed at shuffling stage"
5. Click "Retry" button (if retry_count < 2)
6. Task resets: status = 'pending', progress = 0, retry_count += 1
7. Processing simulation starts again (same flow as step 3)

**State changes:**
```typescript
// Before retry
task: { status: 'failed', progress: 62, retry_count: 0, error: 'Processing failed...' }

// After retry
task: { status: 'pending', progress: 0, retry_count: 1, error: undefined }
```

---

## Troubleshooting

### Issue: Port 3000 already in use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution 1**: Kill process on port 3000:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

**Solution 2**: Use different port:
```bash
npm run dev -- -p 3001
```

---

### Issue: TypeScript errors in terminal

**Error:**
```
Type 'string' is not assignable to type 'number'
```

**Solution**: Fix type errors in code. Next.js requires zero TypeScript errors to compile.

**Tip**: Use VS Code TypeScript extension for inline error highlighting.

---

### Issue: Tailwind classes not applying

**Symptoms**: CSS classes not rendering styles in browser.

**Possible causes:**
1. Tailwind not configured in `postcss.config.js`
2. Content paths missing in `tailwind.config.js`
3. `@tailwind` directives missing in `globals.css`

**Solution**: Verify `tailwind.config.js` content paths:
```javascript
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // ...
};
```

And `src/app/globals.css` has:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### Issue: State not persisting on refresh

**Symptoms**: User logged out after page refresh, tasks disappear.

**Cause**: localStorage not being read on app initialization.

**Solution**: Ensure stores call `persist` middleware:
```typescript
// auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user, isAuthenticated: true }),
      // ...
    }),
    { name: 'auth-state' } // localStorage key
  )
);
```

---

### Issue: Tests failing with "Cannot find module"

**Error:**
```
Cannot find module '@/components/ui/Button'
```

**Cause**: Path alias `@/` not configured in Vitest.

**Solution**: Add to `vitest.config.ts`:
```typescript
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ...
});
```

---

## Next Steps

After completing local setup:

1. **Extract design tokens**: Analyze Visily designs in `./html/` and populate `tokens.ts`
2. **Implement atoms**: Build Button, Input, Badge components (see [contracts/components.md](./contracts/components.md))
3. **Write tests**: Test each atom before moving to molecules (per Principle IX)
4. **Build molecules**: FormField, Card, Modal using atoms
5. **Create organisms**: ExamMetadataForm, ProcessingStatus, QuestionList
6. **Implement pages**: Use organisms and templates to build 6 pages (homepage, login, create, preview, tasks, task detail)
7. **Add mock simulation**: Implement timer-based processing pipeline in `lib/simulation/pipeline.ts`
8. **Integrate state**: Connect components to Zustand stores
9. **Test flows**: Manually verify all user flows (auth, create, processing, retry)
10. **Validate acceptance criteria**: Check all ACs in [spec.md](./spec.md) are met

---

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Zustand Docs**: https://docs.pmnd.rs/zustand
- **React Hook Form**: https://react-hook-form.com
- **Zod**: https://zod.dev
- **Vitest**: https://vitest.dev
- **Testing Library**: https://testing-library.com/docs/react-testing-library/intro

---

## Summary

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server (http://localhost:3000) |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |

**Ready to code!** 🚀 Start with design tokens, then build components bottom-up following FR-048.
