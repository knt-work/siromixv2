/**
 * Question Type Definitions
 * 
 * Represents individual exam question from processed document.
 */

export type AnswerOption = 'A' | 'B' | 'C' | 'D';

export interface Question {
  question_id: string;           // Unique identifier
  task_id: string;               // Parent task (foreign key)
  question_number: number;       // Display number (1-based)
  question_text: string;         // Question content
  option_a: string;              // Answer option A
  option_b: string;              // Answer option B
  option_c: string;              // Answer option C
  option_d: string;              // Answer option D
  correct_answer: AnswerOption;  // Correct option
  learning_objective?: string;   // Optional LO tag
  confidence?: number;           // AI confidence level (0-100)
}

/**
 * Get all options as an array
 */
export function getQuestionOptions(question: Question): string[] {
  return [
    question.option_a,
    question.option_b,
    question.option_c,
    question.option_d,
  ];
}

/**
 * Get option letter by index (0-3 -> A-D)
 */
export function getOptionLetter(index: number): AnswerOption {
  const letters: AnswerOption[] = ['A', 'B', 'C', 'D'];
  return letters[index] || 'A';
}

/**
 * Check if answer is correct
 */
export function isCorrectAnswer(question: Question, answer: AnswerOption): boolean {
  return question.correct_answer === answer;
}
