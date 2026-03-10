# Data Model: SiroMix UI MVP (Mock Data Phase)

**Feature**: 002-ui-mock-mvp  
**Date**: 2026-03-10  
**Purpose**: Define TypeScript interfaces and state schemas

---

## Core Entities

### 1. User

**Purpose**: Represents authenticated user in mock authentication flow

**TypeScript Interface** (`src/types/user.ts`):
```typescript
export interface User {
  user_id: string;             // Unique identifier
  email: string;               // Email address (from OAuth)
  full_name: string;           // Display name
  avatar_url: string | null;   // Profile picture URL
  role: 'professor';           // Fixed role in mock (future: 'admin', 'reviewer')
  created_at: string;          // ISO 8601 timestamp
}
```

**Validation Rules**:
- `user_id`: Required, non-empty string
- `email`: Required, valid email format
- `full_name`: Required, non-empty string
- `avatar_url`: Optional, valid URL or null
- `role`: Required, must be 'professor'
- `created_at`: Required, ISO 8601 format

**Mock Example**:
```typescript
export const mockUser: User = {
  user_id: 'mock-user-1',
  email: 'john.doe@university.edu',
  full_name: 'John Doe',
  avatar_url: 'https://ui-avatars.com/api/?name=John+Doe',
  role: 'professor',
  created_at: '2026-01-15T10:30:00Z',
};
```

**State Transitions**: None (static in mock phase)

**Relationships**:
- One user can create many Tasks (one-to-many)

---

### 2. Task

**Purpose**: Represents exam processing task with status tracking

**TypeScript Interface** (`src/types/task.ts`):
```typescript
export type TaskStatus = 
  | 'pending'
  | 'extracting'
  | 'understanding'
  | 'awaiting'      // Awaiting confirmation
  | 'shuffling'
  | 'generating'
  | 'completed'
  | 'failed';

export interface ExamMetadata {
  academic_year: string;        // e.g., '2024-2025'
  exam_name: string;            // e.g., 'Midterm Exam'
  subject: string;              // e.g., 'Mathematics'
  duration_minutes: number;     // Exam duration (> 0)
  num_versions: number;         // Number of versions (1-10)
  notes?: string;               // Optional professor notes
}

export interface Task {
  task_id: string;              // Unique identifier
  user_id: string;              // Owner (foreign key to User)
  status: TaskStatus;           // Current processing status
  progress: number;             // Percentage 0-100
  metadata: ExamMetadata;       // Exam information
  file_name: string;            // Original uploaded file name
  file_size: number;            // File size in bytes
  created_at: string;           // ISO 8601 timestamp
  updated_at: string;           // ISO 8601 timestamp
  completed_at: string | null;  // Completion timestamp
  error?: string;               // Error message if failed
  retry_count: number;          // Number of retries (0-2)
}
```

**Validation Rules**:
- `task_id`: Required, unique, UUID format
- `user_id`: Required, must match authenticated user
- `status`: Required, must be valid TaskStatus enum value
- `progress`: Required, integer 0-100
- `metadata.duration_minutes`: Required, integer > 0
- `metadata.num_versions`: Required, integer 1-10
- `file_name`: Required, must end with .doc or .docx
- `file_size`: Required, > 0
- `retry_count`: Required, integer 0-2
- `error`: Optional, only present if status is 'failed'
- `completed_at`: Required if status is 'completed' or 'failed'

**State Transitions** (per FR-017):
```
pending → extracting → understanding → awaiting → shuffling → generating → completed
                                                  ↓
                                               failed
```

**Retry Logic** (FR-022):
- Failed tasks can be retried up to 2 times
- Retry resets status to 'pending', increments retry_count
- Max retry_count is 2, after which retry button is disabled

**Mock Factory** (`lib/mock-data/tasks.ts`):
```typescript
export function createMockTask(metadata: ExamMetadata, userId: string): Task {
  return {
    task_id: crypto.randomUUID(),
    user_id: userId,
    status: 'pending',
    progress: 0,
    metadata,
    file_name: `exam-${Date.now()}.docx`,
    file_size: 1024 * 500, // 500KB
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    retry_count: 0,
  };
}
```

**Relationships**:
- Belongs to one User (many-to-one)
- Has many TaskLogs (one-to-many)
- Has one ExamData when completed (one-to-one)

---

### 3. TaskLog

**Purpose**: Audit trail of task processing events

**TypeScript Interface** (`src/types/task-log.ts`):
```typescript
export type LogLevel = 'INFO' | 'WARNING' | 'ERROR';

export interface TaskLog {
  log_id: string;               // Unique identifier
  task_id: string;              // Parent task (foreign key)
  log_level: LogLevel;          // Severity level
  message: string;              // Log message
  timestamp: string;            // ISO 8601 timestamp
  metadata?: Record<string, any>; // Optional structured data
}
```

**Validation Rules**:
- `log_id`: Required, unique, UUID format
- `task_id`: Required, must reference existing Task
- `log_level`: Required, must be 'INFO', 'WARNING', or 'ERROR'
- `message`: Required, non-empty string
- `timestamp`: Required, ISO 8601 format
- `metadata`: Optional, valid JSON object

**Mock Examples**:
```typescript
export const mockTaskLogs: TaskLog[] = [
  {
    log_id: crypto.randomUUID(),
    task_id: 'task-123',
    log_level: 'INFO',
    message: 'Task created successfully',
    timestamp: '2026-03-10T10:00:00Z',
  },
  {
    log_id: crypto.randomUUID(),
    task_id: 'task-123',
    log_level: 'INFO',
    message: 'Started extracting questions from document',
    timestamp: '2026-03-10T10:00:05Z',
  },
  {
    log_id: crypto.randomUUID(),
    task_id: 'task-123',
    log_level: 'INFO',
    message: 'Extracted 15 questions successfully',
    timestamp: '2026-03-10T10:00:10Z',
    metadata: { question_count: 15 },
  },
];
```

**Relationships**:
- Belongs to one Task (many-to-one)

---

### 4. Question

**Purpose**: Represents individual exam question from processed document

**TypeScript Interface** (`src/types/question.ts`):
```typescript
export type AnswerOption = 'A' | 'B' | 'C' | 'D';

export interface Question {
  question_id: string;          // Unique identifier
  task_id: string;              // Parent task (foreign key)
  question_number: number;      // Display number (1-based)
  question_text: string;        // Question content
  option_a: string;             // Answer option A
  option_b: string;             // Answer option B
  option_c: string;             // Answer option C
  option_d: string;             // Answer option D
  correct_answer: AnswerOption; // Correct option
  learning_objective?: string;  // Optional LO tag
}
```

**Validation Rules**:
- `question_id`: Required, unique, UUID format
- `task_id`: Required, must reference existing Task
- `question_number`: Required, integer > 0
- `question_text`: Required, non-empty string
- `option_a`, `option_b`, `option_c`, `option_d`: Required, non-empty strings
- `correct_answer`: Required, must be 'A', 'B', 'C', or 'D'
- `learning_objective`: Optional, string

**Mock Factory** (`lib/mock-data/questions.ts`):
```typescript
export const mockQuestions: Question[] = [
  {
    question_id: crypto.randomUUID(),
    task_id: 'task-123',
    question_number: 1,
    question_text: 'What is the capital of France?',
    option_a: 'London',
    option_b: 'Berlin',
    option_c: 'Paris',
    option_d: 'Madrid',
    correct_answer: 'C',
    learning_objective: 'Geography: European Capitals',
  },
  // ... 14 more questions
];
```

**Relationships**:
- Belongs to one Task (many-to-one)

---

### 5. ExamData

**Purpose**: Aggregates completed task data (metadata + questions)

**TypeScript Interface** (`src/types/exam-data.ts`):
```typescript
export interface ExamData {
  task_id: string;              // Reference to Task
  metadata: ExamMetadata;       // From Task
  questions: Question[];        // Array of questions
  num_questions: number;        // Count of questions
  created_at: string;           // ISO 8601 timestamp
}
```

**Validation Rules**:
- `task_id`: Required, must reference completed Task
- `metadata`: Required, valid ExamMetadata object
- `questions`: Required, array of 1-50 Question objects
- `num_questions`: Required, must match questions.length
- `created_at`: Required, ISO 8601 format

**Mock Example**:
```typescript
export const mockExamData: ExamData = {
  task_id: 'task-123',
  metadata: {
    academic_year: '2024-2025',
    exam_name: 'Midterm Exam',
    subject: 'Mathematics',
    duration_minutes: 90,
    num_versions: 3,
  },
  questions: mockQuestions, // 15 questions
  num_questions: 15,
  created_at: '2026-03-10T10:10:00Z',
};
```

**Relationships**:
- Belongs to one Task (one-to-one)
- Contains many Questions (one-to-many)

---

## State Management Schemas

### Auth Store Schema

**Purpose**: Manage authentication state with localStorage persistence

**Store Interface** (`src/lib/state/auth-store.ts`):
```typescript
export interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (user: User) => void;
  logout: () => void;
  checkAuth: () => void;
}
```

**localStorage Schema** (key: `auth-state`):
```json
{
  "state": {
    "user": {
      "user_id": "mock-user-1",
      "email": "john.doe@university.edu",
      "full_name": "John Doe",
      "avatar_url": "https://ui-avatars.com/api/?name=John+Doe",
      "role": "professor",
      "created_at": "2026-01-15T10:30:00Z"
    },
    "isAuthenticated": true,
    "isLoading": false
  },
  "version": 0
}
```

**Persistence Rules**:
- Persist `user` and `isAuthenticated` only
- Do not persist `isLoading` (always starts as false)
- Hydrate on app load via `checkAuth()`
- Clear on logout

---

### Task Store Schema

**Purpose**: Manage task list and current task with localStorage persistence

**Store Interface** (`src/lib/state/task-store.ts`):
```typescript
export interface TaskState {
  // State
  tasks: Task[];
  currentTask: Task | null;

  // Actions
  createTask: (metadata: ExamMetadata, fileName: string, fileSize: number) => Task;
  updateTaskStatus: (taskId: string, status: TaskStatus, progress: number) => void;
  updateTaskError: (taskId: string, error: string) => void;
  retryTask: (taskId: string) => void;
  setCurrentTask: (taskId: string) => void;
  clearCurrentTask: () => void;
  addTaskLog: (taskId: string, log: Omit<TaskLog, 'log_id' | 'task_id' | 'timestamp'>) => void;
}
```

**localStorage Schema** (key: `task-state`):
```json
{
  "state": {
    "tasks": [
      {
        "task_id": "task-123",
        "user_id": "mock-user-1",
        "status": "completed",
        "progress": 100,
        "metadata": { ... },
        "file_name": "exam-123.docx",
        "file_size": 512000,
        "created_at": "2026-03-10T10:00:00Z",
        "updated_at": "2026-03-10T10:10:00Z",
        "completed_at": "2026-03-10T10:10:00Z",
        "retry_count": 0
      }
    ],
    "currentTask": null
  },
  "version": 0
}
```

**Persistence Rules**:
- Persist entire `tasks` array (max 50 tasks to prevent localStorage overflow)
- Do not persist `currentTask` (cleared on page refresh)
- Hydrate on app load
- Prune old tasks if array exceeds 50 items (keep 25 most recent)

---

## Entity Relationships

```
User (1) ─────────────────┐
                           │
                           ├─ (many) Task
                           │            │
                           │            ├─ (many) TaskLog
                           │            │
                           │            └─ (one) ExamData
                           │                      │
                           └──────────────────────┴─ (many) Question
```

**Key Constraints**:
- User.user_id → Task.user_id (foreign key)
- Task.task_id → TaskLog.task_id (foreign key)
- Task.task_id → ExamData.task_id (foreign key)
- Task.task_id → Question.task_id (foreign key)

---

## Database Strategy (Mock Phase)

**Storage**: All data stored in Zustand stores + localStorage (no database in MVP)

**Limitations**:
- Max 50 tasks per user (localStorage quota ~5MB)
- No server-side persistence (data cleared on browser cache clear)
- No multi-device sync (localStorage is per-browser)

**Future Migration Path**:
- Replace Zustand actions with API calls (same interfaces)
- Add backend models matching these TypeScript interfaces
- LocalStorage becomes cache layer, fetched from API on load

---

## Summary

| Entity | Primary Key | Persisted | Relationships |
|--------|-------------|-----------|---------------|
| User | user_id | localStorage (auth-store) | Has many Tasks |
| Task | task_id | localStorage (task-store) | Belongs to User, has many TaskLogs, has one ExamData |
| TaskLog | log_id | In-memory (not persisted) | Belongs to Task |
| Question | question_id | In-memory (embedded in ExamData) | Belongs to Task |
| ExamData | task_id | In-memory (derived from Task) | Belongs to Task, contains Questions |

All interfaces follow Schema-First principle (Principle II), ensuring type safety and clear contracts.
