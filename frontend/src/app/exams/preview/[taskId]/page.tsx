/**
 * Exam Preview Page
 * 
 * Displays extracted exam data (questions list) after "understand" stage completes,
 * allows user to review and confirm, then resumes processing pipeline.
 * 
 * Matches exact layout from html/SiroMix - Exam Analysis Result/src/App.tsx
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { QuestionList } from '@/components/sections/QuestionList';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/shared/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useTaskStore } from '@/lib/state/task-store';
import { mockQuestions } from '@/lib/mock-data/questions';
import type { TaskStatus } from '@/types';

interface PreviewPageProps {
  params: {
    taskId: string;
  };
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const router = useRouter();
  const { tasks, updateTaskStatus } = useTaskStore();
  const [task, setTask] = useState<ReturnType<typeof tasks.find>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const foundTask = tasks.find((t) => t.task_id === params.taskId);
    setTask(foundTask);

    // If task not found or not in awaiting state, redirect
    if (!foundTask) {
      router.push('/tasks');
    }
  }, [params.taskId, tasks, router]);

  if (!task) {
    return (
      <AuthGuard redirectTo="/login">
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#565d6d]">Đang tải...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const metadata = task.metadata;
  const questions = mockQuestions.slice(0, 10); // Show first 10 questions
  
  const filteredQuestions = searchQuery
    ? questions.filter((q: typeof mockQuestions[0]) =>
        q.question_text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : questions;

  const handleConfirm = async () => {
    setIsProcessing(true);
    setProcessingStatus('Đề thi đã được tạo thành công!');
    setProgress(100);
    
    // Start pipeline - update task to shuffling status
    updateTaskStatus(params.taskId, 'shuffling', 62);
    
    // Wait 5 seconds before redirecting
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Navigate to tasks page where polling will show continued progress
    router.push('/tasks');
  };

  const handleBack = () => {
    router.push('/tasks');
  };

  return (
    <AuthGuard redirectTo="/login">
      <div className="min-h-screen bg-white flex flex-col font-sans text-[#171a1f]">
        {/* Main Content */}
        <main className="flex-1 w-full max-w-[1152px] mx-auto px-4 pt-24 pb-32">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-[30px] leading-[36px] font-bold tracking-tight mb-2">
              Xem trước kết quả phân tích đề thi
            </h1>
            <p className="text-[#565d6d] text-base">
              Xem trước các câu hỏi đã trích xuất và đáp án được nhận diện trước khi tiếp tục.
            </p>
          </div>

          {/* Summary Card */}
          <div className="bg-white border border-[#dee1e6] rounded-lg shadow-sm p-4 mb-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-[#dee1e6]/60">
            {/* Exam Name */}
            <div className="flex items-center gap-3 px-2 py-2 md:py-0">
              <div className="w-8 h-8 bg-[#9a94de]/[0.1] rounded-md flex items-center justify-center flex-shrink-0">
                <Icon icon="lucide:file-text" className="w-4 h-4 text-[#9a94de]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#565d6d] uppercase tracking-wider">
                  Tên kì thi
                </p>
                <p className="text-sm font-medium">{metadata.exam_name}</p>
              </div>
            </div>

            {/* Subject */}
            <div className="flex items-center gap-3 px-2 md:px-6 py-2 md:py-0">
              <div className="w-8 h-8 bg-[#f3f4f6] rounded-md flex items-center justify-center flex-shrink-0">
                <Icon icon="lucide:book-open" className="w-4 h-4 text-[#565d6d]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#565d6d] uppercase tracking-wider">
                  Môn học
                </p>
                <p className="text-sm font-medium">{metadata.subject}</p>
              </div>
            </div>

            {/* Question Count */}
            <div className="flex items-center gap-3 px-2 md:px-6 py-2 md:py-0">
              <div className="w-8 h-8 bg-[#f3f4f6] rounded-md flex items-center justify-center flex-shrink-0">
                <Icon icon="lucide:list" className="w-4 h-4 text-[#565d6d]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#565d6d] uppercase tracking-wider">
                  Số câu hỏi
                </p>
                <p className="text-sm font-medium">Phát hiện {questions.length} câu hỏi</p>
              </div>
            </div>
          </div>

          {/* Search and Questions */}
          <div className="max-w-[768px] mx-auto">
            {/* Search Input */}
            <div className="relative mb-8">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Icon icon="lucide:search" className="w-4 h-4 text-[#565d6d]" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-white border border-[#dee1e6] rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#9a94de]/20 transition-all"
              />
            </div>

            {/* Question List */}
            <QuestionList questions={filteredQuestions} variant="detailed" />
          </div>
        </main>

        {/* Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#dee1e6] shadow-[0px_-4px_24px_0px_#0000000a] z-40">
          <div className="max-w-[1440px] mx-auto h-20 flex items-center justify-between px-4 lg:px-32">
            <Button
              variant="outline"
              size="md"
              onClick={handleBack}
              leftIcon={<Icon icon="lucide:chevron-left" className="w-4 h-4" />}
            >
              Trở về
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              rightIcon={<Icon icon="lucide:check-circle" className="w-4 h-4" />}
            >
              Xác nhận và tiếp tục
            </Button>
          </div>
        </div>

        {/* Success Modal */}
        <Modal
          isOpen={isProcessing}
          onClose={() => {}} // No manual close during processing
          title="Thành công"
          size="md"
          closeOnEsc={false}
          closeOnOverlayClick={false}
          showCloseButton={false}
        >
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-[#39a85e]/10 flex items-center justify-center">
                <Icon icon="lucide:check-circle" className="w-8 h-8 text-[#39a85e]" />
              </div>
            </div>
            <p className="text-lg font-medium text-[#171a1f]">{processingStatus}</p>
            <p className="text-sm text-[#565d6d]">Đang chuyển hướng đến trang quản lý...</p>
            <ProgressBar value={progress} variant="success" showLabel={false} animated />
          </div>
        </Modal>
      </div>
    </AuthGuard>
  );
}
