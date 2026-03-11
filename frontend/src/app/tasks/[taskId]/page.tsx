/**
 * Exam Detail Page
 * 
 * Phase 8 - T092: Exam Detail View with Retry
 * Displays comprehensive task details with metadata, processing status, and extracted questions.
 * Matches exact design from html/SiroMix - Exam Detail/
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ExamMetadata } from '@/components/sections/ExamMetadata';
import { ProcessingStatus } from '@/components/sections/ProcessingStatus';
import { QuestionList } from '@/components/sections/QuestionList';
import { useTaskStore } from '@/lib/state/task-store';
import type { TaskStatus } from '@/types';

// Processing statuses that require polling
const PROCESSING_STATUSES: TaskStatus[] = [
  'extracting',
  'understanding',
  'shuffling',
  'generating',
];

function ExamDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.taskId as string;
  
  const task = useTaskStore((state) =>
    state.tasks.find((t) => t.task_id === taskId)
  );
  const retryTask = useTaskStore((state) => state.retryTask);
  const getTaskLogs = useTaskStore((state) => state.getTaskLogs);
  
  const [, forceUpdate] = useState(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time polling for processing tasks (T096)
  useEffect(() => {
    if (task && PROCESSING_STATUSES.includes(task.status)) {
      // Poll every 3 seconds
      pollingIntervalRef.current = setInterval(() => {
        forceUpdate((n) => n + 1);
      }, 3000);
    } else {
      // Clear polling if not processing
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [task?.status]);

  // Handle retry with debouncing (T093)
  const [retrying, setRetrying] = useState(false);
  const handleRetry = async () => {
    if (!task || retrying) return;
    
    setRetrying(true);
    try {
      retryTask(taskId);
      // Small delay for UI feedback
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setRetrying(false);
    }
  };

  // Task not found
  if (!task) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9fafb]">
        <div className="text-center">
          <Icon icon="lucide:file-question" className="mx-auto mb-4 h-16 w-16 text-[#565d6d]" />
          <h2 className="mb-2 text-xl font-semibold">Không tìm thấy đề thi</h2>
          <p className="mb-6 text-sm text-[#565d6d]">
            Đề thi với ID {taskId} không tồn tại hoặc đã bị xóa.
          </p>
          <button
            onClick={() => router.push('/tasks')}
            className="rounded-md bg-[#9a94de] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
          >
            Quay về danh sách
          </button>
        </div>
      </div>
    );
  }

  const logs = getTaskLogs(taskId);
  const showRetryButton = task.status === 'failed';

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="border-b border-[#dee1e6] bg-white px-4 py-6 lg:px-[120px]">
        {/* Breadcrumbs */}
        <div className="mb-4 flex items-center gap-2 text-sm">
          <button
            onClick={() => router.push('/tasks')}
            className="text-[#565d6d] transition-colors hover:text-[#9a94de]"
          >
            Tasks
          </button>
          <Icon icon="lucide:chevron-right" className="h-3.5 w-3.5 text-[#9ba0aa]" />
          <span className="font-medium text-[#171a1f]">T-{taskId.slice(-4)}</span>
        </div>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold lg:text-4xl">
            {task.metadata.exam_name} — {task.metadata.subject}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#565d6d]">
            <div className="flex items-center gap-1.5">
              <Icon icon="lucide:calendar" className="h-3.5 w-3.5" />
              <span>Ngày tạo: {new Date(task.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon icon="lucide:clock" className="h-3.5 w-3.5" />
              <span>Cập nhật: {new Date(task.updated_at).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {task.status === 'completed' && (
          <div className="flex flex-wrap gap-3">
            <button className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#dee1e6] bg-white px-4 text-sm font-medium shadow-sm transition-colors hover:bg-[#f3f4f6]">
              <Icon icon="lucide:eye" className="h-4 w-4" />
              Xem Inputs
            </button>
            <button className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#9a94de] px-4 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <Icon icon="lucide:download" className="h-4 w-4" />
              Tải bộ đề đã trộn
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-8 lg:px-[120px]">
        {/* Section 1: Exam Metadata */}
        <ExamMetadata metadata={task.metadata} fileName={`task_${taskId}.pdf`} />

        {/* Section 2: Processing Status */}
        <ProcessingStatus
          task={task}
          logs={logs}
          onRetry={handleRetry}
          showRetryButton={showRetryButton}
        />

        {/* Section 3: Extracted Data (Questions) - TODO: Integrate with backend */}
        {/* Questions will be fetched separately from backend API in Phase 9 */}
      </div>
    </div>
  );
}

export default function ExamDetailPage() {
  return (
    <AuthGuard>
      <ExamDetailPageContent />
    </AuthGuard>
  );
}
