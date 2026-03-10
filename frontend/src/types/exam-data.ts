/**
 * ExamData Type Definitions
 * 
 * Aggregates completed task data (metadata + questions).
 */

import type { ExamMetadata } from './task';
import type { Question } from './question';

export interface ExamData {
  task_id: string;               // Reference to Task
  metadata: ExamMetadata;        // From Task
  questions: Question[];         // Array of questions
  num_questions: number;         // Count of questions
  created_at: string;            // ISO 8601 timestamp
}

/**
 * Create ExamData from task and questions
 */
export function createExamData(
  taskId: string,
  metadata: ExamMetadata,
  questions: Question[]
): ExamData {
  return {
    task_id: taskId,
    metadata,
    questions,
    num_questions: questions.length,
    created_at: new Date().toISOString(),
  };
}
