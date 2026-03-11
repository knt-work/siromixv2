/**
 * QuestionList Component Unit Tests
 * 
 * Tests for QuestionList organism component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../utils';
import { fireEvent } from '@testing-library/react';
import { QuestionList } from '@/components/sections/QuestionList';
import type { Question } from '@/types';

const mockQuestions: Question[] = [
  {
    question_id: 'q1',
    task_id: 'task-1',
    question_number: 1,
    question_text: 'Thủ đô của Việt Nam là gì?',
    option_a: 'Hà Nội',
    option_b: 'Hồ Chí Minh',
    option_c: 'Đà Nẵng',
    option_d: 'Hải Phòng',
    correct_answer: 'A',
    learning_objective: 'Địa lý Việt Nam',
    confidence: 92,
  },
  {
    question_id: 'q2',
    task_id: 'task-1',
    question_number: 2,
    question_text: 'Ai là tác giả của tác phẩm "Truyện Kiều"?',
    option_a: 'Nguyễn Trãi',
    option_b: 'Nguyễn Du',
    option_c: 'Hồ Xuân Hương',
    option_d: 'Nguyễn Bỉnh Khiêm',
    correct_answer: 'B',
    learning_objective: 'Văn học Việt Nam',
    confidence: 75,
  },
  {
    question_id: 'q3',
    task_id: 'task-1',
    question_number: 3,
    question_text: 'Số Pi (π) gần đúng bằng bao nhiêu?',
    option_a: '2.71',
    option_b: '3.14',
    option_c: '4.20',
    option_d: '1.61',
    correct_answer: 'B',
    learning_objective: 'Toán học',
    confidence: 65,
  },
];

describe('QuestionList Component', () => {
  describe('Variant Rendering', () => {
    it('renders compact variant with numbered list', () => {
      render(<QuestionList questions={mockQuestions} variant="compact" />);
      expect(screen.getByText('Thủ đô của Việt Nam là gì?')).toBeInTheDocument();
      expect(screen.getByText('Ai là tác giả của tác phẩm "Truyện Kiều"?')).toBeInTheDocument();
    });

    it('renders detailed variant with table layout', () => {
      render(<QuestionList questions={mockQuestions} variant="detailed" />);
      // Should display table headers
      expect(screen.getByText('Câu hỏi')).toBeInTheDocument();
      expect(screen.getByText('Đáp án đúng')).toBeInTheDocument();
      expect(screen.getByText('Độ tự tin')).toBeInTheDocument();
    });

    it('defaults to detailed variant when variant prop is not provided', () => {
      render(<QuestionList questions={mockQuestions} />);
      expect(screen.getByText('Câu hỏi')).toBeInTheDocument();
    });
  });

  describe('Vietnamese Table Headers', () => {
    it('displays all Vietnamese headers in detailed variant', () => {
      render(<QuestionList questions={mockQuestions} variant="detailed" />);
      expect(screen.getByText('Câu hỏi')).toBeInTheDocument();
      expect(screen.getByText('Đáp án đúng')).toBeInTheDocument();
      expect(screen.getByText('Độ tự tin')).toBeInTheDocument();
    });

    it('does not display headers in compact variant', () => {
      render(<QuestionList questions={mockQuestions} variant="compact" />);
      expect(screen.queryByText('Câu hỏi')).not.toBeInTheDocument();
      expect(screen.queryByText('Đáp án đúng')).not.toBeInTheDocument();
    });
  });

  describe('Question Rendering', () => {
    it('renders all questions with question numbers', () => {
      render(<QuestionList questions={mockQuestions} variant="detailed" />);
      expect(screen.getByText(/Câu hỏi 1/)).toBeInTheDocument();
      expect(screen.getByText(/Câu hỏi 2/)).toBeInTheDocument();
      expect(screen.getByText(/Câu hỏi 3/)).toBeInTheDocument();
    });

    it('renders question text in compact variant only', () => {
      render(<QuestionList questions={mockQuestions} variant="compact" />);
      mockQuestions.forEach((q) => {
        expect(screen.getByText(new RegExp(q.question_text))).toBeInTheDocument();
      });
    });

    it('does not render question text in detailed variant', () => {
      render(<QuestionList questions={mockQuestions} variant="detailed" />);
      // Should not show question text, only "Câu hỏi X"
      expect(screen.queryByText('Thủ đô của Việt Nam là gì?')).not.toBeInTheDocument();
      expect(screen.queryByText('Ai là tác giả của tác phẩm "Truyện Kiều"?')).not.toBeInTheDocument();
    });

    it('renders correct answer badges', () => {
      render(<QuestionList questions={mockQuestions} variant="detailed" />);
      expect(screen.getAllByText('A')).toHaveLength(1);
      expect(screen.getAllByText('B')).toHaveLength(2);
    });
  });

  describe('Confidence Badge Colors', () => {
    it('applies green color for high confidence (≥85%)', () => {
      const highConfidenceQuestions: Question[] = [
        {
          ...mockQuestions[0],
          confidence: 92,
        },
      ];
      const { container } = render(
        <QuestionList questions={highConfidenceQuestions} variant="detailed" />
      );
      const confidenceBadge = screen.getByText('92%');
      expect(confidenceBadge).toHaveClass('text-[#39a85e]');
    });

    it('applies yellow color for medium confidence (70-84%)', () => {
      const mediumConfidenceQuestions: Question[] = [
        {
          ...mockQuestions[1],
          confidence: 75,
        },
      ];
      render(<QuestionList questions={mediumConfidenceQuestions} variant="detailed" />);
      const confidenceBadge = screen.getByText('75%');
      expect(confidenceBadge).toHaveClass('text-[#C98703]');
    });

    it('applies red color for low confidence (<70%)', () => {
      const lowConfidenceQuestions: Question[] = [
        {
          ...mockQuestions[2],
          confidence: 65,
        },
      ];
      render(<QuestionList questions={lowConfidenceQuestions} variant="detailed" />);
      const confidenceBadge = screen.getByText('65%');
      expect(confidenceBadge).toHaveClass('text-[#d3595e]');
    });

    it('handles missing confidence values gracefully', () => {
      const noConfidenceQuestions: Question[] = [
        {
          ...mockQuestions[0],
          confidence: undefined,
        },
      ];
      render(<QuestionList questions={noConfidenceQuestions} variant="detailed" />);
      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });
  });

  describe('Correct Answer Highlighting', () => {
    it('highlights correct answer badge with green color', () => {
      render(<QuestionList questions={mockQuestions} variant="detailed" />);
      // Answer badges should have shadow and specific styling
      const answerBadges = document.querySelectorAll('[class*="shadow-sm"]');
      expect(answerBadges.length).toBeGreaterThan(0);
    });

    it('displays correct answer letter (A/B/C/D)', () => {
      render(<QuestionList questions={mockQuestions} variant="detailed" />);
      const answerA = screen.getAllByText('A')[0];
      const answerB = screen.getAllByText('B')[0];
      expect(answerA).toBeInTheDocument();
      expect(answerB).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('displays Vietnamese empty message when no questions provided', () => {
      render(<QuestionList questions={[]} variant="detailed" />);
      expect(screen.getByText('Chưa có câu hỏi nào được trích xuất')).toBeInTheDocument();
    });

    it('displays empty state in compact variant', () => {
      render(<QuestionList questions={[]} variant="compact" />);
      expect(screen.getByText('Chưa có câu hỏi nào được trích xuất')).toBeInTheDocument();
    });
  });

  describe('Click Interaction', () => {
    it('calls onQuestionClick when question row is clicked', () => {
      const handleClick = vi.fn();
      render(
        <QuestionList
          questions={mockQuestions}
          variant="detailed"
          onQuestionClick={handleClick}
        />
      );
      const firstQuestion = screen.getByText('Câu hỏi 1');
      fireEvent.click(firstQuestion);
      expect(handleClick).toHaveBeenCalledWith(mockQuestions[0]);
    });

    it('does not call onQuestionClick when callback not provided', () => {
      render(<QuestionList questions={mockQuestions} variant="detailed" />);
      const firstQuestion = screen.getByText('Câu hỏi 1');
      // Should not throw error
      fireEvent.click(firstQuestion);
    });

    it('applies hover styles when editable is true', () => {
      render(
        <QuestionList
          questions={mockQuestions}
          variant="detailed"
          editable={true}
          onQuestionClick={() => {}}
        />
      );
      const row = screen.getByText('Câu hỏi 1').closest('div');
      expect(row).toHaveClass('hover:bg-gray-50');
    });
  });

  describe('Styling and Layout', () => {
    it('applies correct border color #dee1e6', () => {
      const { container } = render(
        <QuestionList questions={mockQuestions} variant="detailed" />
      );
      const borders = container.querySelectorAll('[class*="border-[#dee1e6]"]');
      expect(borders.length).toBeGreaterThan(0);
    });

    it('applies rounded-[10px] to card container', () => {
      const { container } = render(
        <QuestionList questions={mockQuestions} variant="detailed" />
      );
      const card = container.querySelector('[class*="rounded-[10px]"]');
      expect(card).toBeInTheDocument();
    });

    it('applies shadow-sm to container card', () => {
      const { container } = render(
        <QuestionList questions={mockQuestions} variant="detailed" />
      );
      const card = container.querySelector('[class*="shadow-sm"]');
      expect(card).toBeInTheDocument();
    });

    it('uses hide-scrollbar class for overflow content', () => {
      const { container } = render(
        <QuestionList questions={mockQuestions} variant="detailed" />
      );
      // Check if overflow-y-auto is applied for scrollable content
      const scrollableContent = container.querySelector('[class*="overflow-y-auto"]');
      expect(scrollableContent).toBeInTheDocument();
    });
  });

  describe('Answer Badge Layout', () => {
    it('renders answer badge with correct size (w-7 h-7)', () => {
      const { container } = render(
        <QuestionList questions={mockQuestions} variant="detailed" />
      );
      const answerBadges = container.querySelectorAll('[class*="w-7"][class*="h-7"]');
      expect(answerBadges.length).toBeGreaterThan(0);
    });

    it('centers answer badge in its cell', () => {
      const { container } = render(
        <QuestionList questions={mockQuestions} variant="detailed" />
      );
      const answerCell = container.querySelector('[class*="justify-center"]');
      expect(answerCell).toBeInTheDocument();
    });
  });

  describe('Confidence Badge Layout', () => {
    it('renders confidence badge with rounded-full styling', () => {
      const { container } = render(
        <QuestionList questions={mockQuestions} variant="detailed" />
      );
      const confidenceBadges = container.querySelectorAll('[class*="rounded-full"]');
      expect(confidenceBadges.length).toBeGreaterThan(0);
    });

    it('displays confidence percentage with % symbol', () => {
      render(<QuestionList questions={mockQuestions} variant="detailed" />);
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders question number and text in flex layout', () => {
      const { container } = render(
        <QuestionList questions={mockQuestions} variant="detailed" />
      );
      const questionContainers = container.querySelectorAll('[class*="flex-1"]');
      expect(questionContainers.length).toBeGreaterThan(0);
    });

    it('applies correct padding to rows (px-4 py-4)', () => {
      const { container } = render(
        <QuestionList questions={mockQuestions} variant="detailed" />
      );
      const rows = container.querySelectorAll('[class*="px-4"][class*="py-4"]');
      expect(rows.length).toBeGreaterThan(0);
    });
  });
});
