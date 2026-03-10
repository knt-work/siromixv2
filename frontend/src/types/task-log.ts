/**
 * TaskLog Type Definitions
 * 
 * Represents audit trail of task processing events.
 */

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR';

export interface TaskLog {
  log_id: string;                    // Unique identifier
  task_id: string;                   // Parent task (foreign key)
  log_level: LogLevel;               // Severity level
  message: string;                   // Log message
  timestamp: string;                 // ISO 8601 timestamp
  metadata?: Record<string, unknown>; // Optional structured data
}

/**
 * Create a new task log entry
 */
export function createTaskLog(
  taskId: string,
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>
): TaskLog {
  return {
    log_id: crypto.randomUUID(),
    task_id: taskId,
    log_level: level,
    message,
    timestamp: new Date().toISOString(),
    metadata,
  };
}

/**
 * Get color for log level
 */
export function getLogLevelColor(level: LogLevel): string {
  switch (level) {
    case 'INFO':
      return 'text-gray-700';
    case 'WARNING':
      return 'text-yellow-600';
    case 'ERROR':
      return 'text-red-600';
    default:
      return 'text-gray-700';
  }
}
