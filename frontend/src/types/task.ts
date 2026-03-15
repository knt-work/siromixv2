/**
 * Task Type Definitions
 * 
 * Represents exam processing task with metadata and status tracking.
 */

export type TaskStatus =
  | 'pending'
  | 'extracting'
  | 'understanding'
  | 'awaiting'       // Awaiting user confirmation
  | 'shuffling'
  | 'generating'
  | 'completed'
  | 'failed';

export interface ExamMetadata {
  academic_year: string;         // e.g., "2024-2025"
  exam_name: string;             // e.g., "Midterm Exam"
  subject: string;               // e.g., "Mathematics"
  grade_level?: string;          // e.g., "Khối 10" (optional)
  duration_minutes: number;      // Exam duration (> 0)
  num_versions: number;          // Number of versions (1-100)
  notes?: string;                // Optional professor notes
}

export interface Task {
  task_id: string;               // Unique identifier (UUID)
  user_id: string;               // Owner (foreign key to User)
  status: TaskStatus;            // Current processing status
  progress: number;              // Percentage 0-100
  metadata: ExamMetadata;        // Exam information
  file_name: string;             // Original uploaded file name
  file_size: number;             // File size in bytes
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
  completed_at: string | null;   // Completion timestamp
  error?: string;                // Error message if failed
  retry_count: number;           // Number of retries (0-2)
}

/**
 * Status progression map for task pipeline
 */
export const TASK_STATUS_PROGRESSION: Record<TaskStatus, TaskStatus | null> = {
  pending: 'extracting',
  extracting: 'understanding',
  understanding: 'awaiting',
  awaiting: 'shuffling',
  shuffling: 'generating',
  generating: 'completed',
  completed: null,  // Terminal state
  failed: null,     // Terminal state
};

/**
 * Progress percentage for each status
 */
export const TASK_PROGRESS_MAP: Record<TaskStatus, number> = {
  pending: 0,
  extracting: 12,
  understanding: 37,
  awaiting: 50,
  shuffling: 62,
  generating: 87,
  completed: 100,
  failed: 0,
};

/**
 * Check if task is in terminal state (completed or failed)
 */
export function isTaskTerminal(status: TaskStatus): boolean {
  return status === 'completed' || status === 'failed';
}

/**
 * Check if task can be retried
 */
export function canRetryTask(task: Task): boolean {
  return task.status === 'failed' && task.retry_count < 2;
}
