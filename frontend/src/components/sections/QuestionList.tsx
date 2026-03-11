/**
 * QuestionList Component
 * 
 * Displays a list of extracted questions with answer information and confidence levels.
 * Matches the exact design from html/SiroMix - Exam Analysis Result/src/App.tsx
 */

import React from 'react';
import type { Question } from '@/types';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils/cn';

export interface QuestionListProps {
  questions: Question[];
  variant?: 'compact' | 'detailed';
  editable?: boolean;
  onQuestionClick?: (question: Question) => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  variant = 'detailed',
  editable = false,
  onQuestionClick,
}) => {
  // Status color mapping for confidence badges
  const getConfidenceStyles = (confidence?: number) => {
    if (!confidence) return 'bg-[#f3f4f6] text-[#565d6d]';
    
    if (confidence >= 85) {
      return 'bg-[#39a85e]/[0.15] text-[#39a85e]'; // High: green
    } else if (confidence >= 70) {
      return 'bg-[#fcb831]/[0.15] text-[#C98703]'; // Medium: yellow
    } else {
      return 'bg-[#d3595e]/[0.15] text-[#d3595e]'; // Low: red
    }
  };

  const getConfidenceLabel = (confidence?: number) => {
    if (!confidence) return 'N/A';
    return `${Math.round(confidence)}%`;
  };

  if (variant === 'compact') {
    // Compact variant - simple numbered list
    return (
      <ol className="space-y-2">
        {questions.map((question) => (
          <li
            key={question.question_id}
            onClick={() => onQuestionClick?.(question)}
            className={cn(
              'p-3 border border-[#dee1e6] rounded-md',
              onQuestionClick && 'cursor-pointer hover:bg-gray-50 transition-colors'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <span className="text-sm font-medium text-[#171a1f]">
                  {question.question_number}. {question.question_text}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#f3f4f6] border border-[#dee1e6]/50 rounded-md flex items-center justify-center text-[12px] font-semibold shadow-sm">
                  {question.correct_answer}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  // Detailed variant - table-like layout (matches Visily design)
  return (
    <div className="max-w-[768px] mx-auto">
      {/* Table Header */}
      <div className="flex items-center px-4 py-2 border-b-2 border-[#dee1e6]/60 text-[12px] font-semibold text-[#565d6d] uppercase tracking-wider">
        <div className="flex-1">Câu hỏi</div>
        <div className="w-32 text-center">Đáp án đúng</div>
        <div className="w-24 text-right">Độ tự tin</div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-[#dee1e6]/50">
        {questions.length === 0 ? (
          <div className="px-4 py-8 text-center text-[#565d6d]">
            Chưa có câu hỏi nào được trích xuất
          </div>
        ) : (
          questions.map((question) => (
            <div
              key={question.question_id}
              onClick={() => onQuestionClick?.(question)}
              className={cn(
                'flex items-center px-4 py-4 transition-colors',
                onQuestionClick && 'cursor-pointer hover:bg-gray-50'
              )}
            >
              {/* Question Number */}
              <div className="flex-1">
                <div className="text-sm font-medium text-[#171a1f]">
                  Câu hỏi {question.question_number}
                </div>
              </div>

              {/* Correct Answer Badge */}
              <div className="w-32 flex justify-center">
                <div className="w-7 h-7 bg-[#f3f4f6] border border-[#dee1e6]/50 rounded-md flex items-center justify-center text-[12px] font-semibold shadow-sm">
                  {question.correct_answer}
                </div>
              </div>

              {/* Confidence Badge */}
              <div className="w-24 flex justify-end">
                <div
                  className={cn(
                    'px-3 py-0.5 rounded-full text-[12px] font-semibold',
                    getConfidenceStyles(question.confidence)
                  )}
                >
                  {getConfidenceLabel(question.confidence)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
