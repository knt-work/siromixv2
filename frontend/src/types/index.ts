/**
 * Type Definitions Barrel Export
 * 
 * Central export point for all type definitions.
 */

// User types
export type { User } from './user';
export { isUser } from './user';

// Task types
export type { TaskStatus, ExamMetadata, Task } from './task';
export { 
  TASK_STATUS_PROGRESSION, 
  TASK_PROGRESS_MAP,
  isTaskTerminal,
  canRetryTask,
} from './task';

// Question types
export type { AnswerOption, Question } from './question';
export {
  getQuestionOptions,
  getOptionLetter,
  isCorrectAnswer,
} from './question';

// TaskLog types
export type { LogLevel, TaskLog } from './task-log';
export {
  createTaskLog,
  getLogLevelColor,
} from './task-log';

// ExamData types
export type { ExamData } from './exam-data';
export { createExamData } from './exam-data';
