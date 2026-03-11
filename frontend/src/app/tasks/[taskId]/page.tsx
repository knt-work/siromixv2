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
import { Modal } from '@/components/shared/Modal';
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
  const [showRetryModal, setShowRetryModal] = useState(false);
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

  // Handle retry with confirmation modal (T094)
  const [retrying, setRetrying] = useState(false);
  
  // Show confirmation modal
  const handleRetryClick = () => {
    setShowRetryModal(true);
  };

  // Confirm and execute retry
  const handleConfirmRetry = async () => {
    if (!task || retrying) return;
    
    setShowRetryModal(false);
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} — ${hours}:${minutes}`;
  };

  // Status badge variant based on task status
  const getStatusBadge = () => {
    const statusConfig: Record<TaskStatus, { text: string; bgColor: string; textColor: string; icon?: string }> = {
      'completed': { text: 'Hoàn tất', bgColor: 'bg-[#39a85e]/10', textColor: 'text-[#39a85e]', icon: 'lucide:check-circle' },
      'failed': { text: 'Thất bại', bgColor: 'bg-[#d3595e]/10', textColor: 'text-[#d3595e]', icon: 'lucide:x-circle' },
      'pending': { text: 'Chờ xử lý', bgColor: 'bg-[#565d6d]/10', textColor: 'text-[#565d6d]' },
      'extracting': { text: 'Đang trích xuất', bgColor: 'bg-[#9a94de]/10', textColor: 'text-[#9a94de]' },
      'understanding': { text: 'Đang phân tích', bgColor: 'bg-[#9a94de]/10', textColor: 'text-[#9a94de]' },
      'awaiting': { text: 'Chờ xác nhận', bgColor: 'bg-[#fcb831]/10', textColor: 'text-[#fcb831]' },
      'shuffling': { text: 'Đang trộn đề', bgColor: 'bg-[#9a94de]/10', textColor: 'text-[#9a94de]' },
      'generating': { text: 'Đang tạo file', bgColor: 'bg-[#9a94de]/10', textColor: 'text-[#9a94de]' },
    };
    
    const config = statusConfig[task.status];
    return (
      <div className={`flex items-center gap-2 rounded-full ${config.bgColor} px-3 py-1`}>
        {config.icon && <Icon icon={config.icon} className={`h-3.5 w-3.5 ${config.textColor}`} />}
        <span className={`text-xs font-semibold ${config.textColor}`}>{config.text}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Sticky Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#dee1e6]/40 bg-white">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 lg:px-[120px]">
          <div className="flex items-center gap-8">
            <button onClick={() => router.push('/')} className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-[#9a94de]/10">
                <Icon icon="lucide:layers" className="h-[17px] w-[17px] text-[#9a94de]" />
              </div>
              <span className="text-xl font-bold tracking-tight">SiroMix</span>
            </button>
            <nav className="hidden items-center gap-6 md:flex">
              <button onClick={() => router.push('/')} className="text-sm font-medium text-[#565d6d] hover:text-[#171a1f]">
                Chức năng
              </button>
              <button onClick={() => router.push('/tasks')} className="text-sm font-medium text-[#171a1f]">
                Tasks
              </button>
              <button onClick={() => router.push('/help')} className="text-sm font-medium text-[#565d6d] hover:text-[#171a1f]">
                Hướng dẫn
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="hidden text-sm font-medium md:block">Trieu Kiem</span>
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#9a94de] text-sm font-semibold text-white">
                AM
              </div>
              <Icon icon="lucide:chevron-down" className="h-4 w-4 text-[#565d6d]" />
            </div>
          </div>
        </div>
      </header>

      {/* Page Header with Breadcrumbs */}
      <div className="border-b border-[#dee1e6]/40 bg-white">
        <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-[120px]">
          {/* Breadcrumbs & Actions */}
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              {/* Breadcrumbs */}
              <div className="mb-2 flex items-center gap-2 text-sm">
                <button
                  onClick={() => router.push('/tasks')}
                  className="text-[#565d6d] transition-colors hover:text-[#9a94de]"
                >
                  Tasks
                </button>
                <Icon icon="lucide:chevron-right" className="h-3.5 w-3.5 text-[#565d6d]" />
                <span className="font-medium">T-{taskId.slice(-4)}</span>
              </div>

              {/* Page Title */}
              <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
                {task.metadata.exam_name} — {task.metadata.subject}
              </h1>

              {/* Status & Metadata */}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                {/* Status Badge */}
                {getStatusBadge()}

                {/* Progress Indicator */}
                {task.progress > 0 && (
                  <div className="flex items-center gap-2 rounded-full border border-[#dee1e6]/50 bg-[#f3f4f6]/50 px-3 py-1">
                    <div className={`h-2 w-2 rounded-full ${task.status === 'completed' ? 'bg-[#39a85e]' : task.status === 'failed' ? 'bg-[#d3595e]' : 'bg-[#9a94de]'}`}></div>
                    <span className="text-sm text-[#565d6d]">{task.progress}% tiến trình</span>
                  </div>
                )}

                {/* Created Date */}
                <div className="flex items-center gap-1.5 text-sm text-[#565d6d]">
                  <Icon icon="lucide:calendar" className="h-3.5 w-3.5" />
                  <span>Ngày tạo: {formatDateTime(task.created_at)}</span>
                </div>

                <span className="hidden text-[#565d6d]/30 md:inline">•</span>

                {/* Updated Date */}
                <div className="flex items-center gap-1.5 text-sm text-[#565d6d]">
                  <Icon icon="lucide:clock" className="h-3.5 w-3.5" />
                  <span>Ngày cập nhật: {formatDateTime(task.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {task.status === 'completed' && (
              <div className="flex items-center gap-3">
                <button className="flex h-9 items-center justify-center rounded-md border border-[#dee1e6] bg-white px-4 text-sm font-medium shadow-sm hover:bg-gray-50">
                  Xem Inputs
                </button>
                <button className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#9a94de] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#8b86d1]">
                  <Icon icon="lucide:download" className="h-[18px] w-[18px]" />
                  Tải bộ đề đã trộn
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-[120px]">
        <div className="space-y-6">
          {/* Section 1: Exam Metadata */}
          <ExamMetadata metadata={task.metadata} fileName={`task_${taskId}.pdf`} />

          {/* Section 2: Processing Status */}
          <ProcessingStatus
            task={task}
            logs={logs}
            onRetry={handleRetryClick}
            showRetryButton={showRetryButton}
          />

          {/* Section 3: Extracted Data (Questions) - TODO: Integrate with backend */}
          {/* Questions will be fetched separately from backend API in Phase 9 */}
        </div>

        {/* Bottom Action - Download Button */}
        {task.status === 'completed' && (
          <div className="mt-8 border-t border-[#dee1e6]/40 pt-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#565d6d]">Lưu trữ lúc vô hạn</p>
              <button className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#9a94de] px-6 text-sm font-medium text-white shadow-sm hover:bg-[#8b86d1]">
                <Icon icon="lucide:download" className="h-[18px] w-[18px]" />
                Tải bộ đề đã trộn
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Retry Confirmation Modal (T094) */}
      <Modal
        isOpen={showRetryModal}
        onClose={() => setShowRetryModal(false)}
        title="Xác nhận thử lại"
        size="sm"
        closeOnOverlayClick={true}
        closeOnEsc={true}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowRetryModal(false)}
              className="flex h-9 items-center justify-center rounded-md border border-[#dee1e6] bg-white px-4 text-sm font-medium shadow-sm hover:bg-gray-50"
              disabled={retrying}
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmRetry}
              disabled={retrying}
              className="flex h-9 items-center justify-center gap-2 rounded-md bg-[#9a94de] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#8b86d1] disabled:opacity-50"
            >
              {retrying ? (
                <>
                  <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận'
              )}
            </button>
          </div>
        }
      >
        <div className="py-4">
          <p className="text-sm text-[#565d6d]">
            Bạn có chắc muốn thử lại? Hệ thống sẽ bắt đầu xử lý lại đề thi từ đầu.
          </p>
          {task && task.retry_count !== undefined && (
            <p className="mt-3 text-sm text-[#565d6d]">
              Số lần đã thử lại: <span className="font-medium">{task.retry_count}/2</span>
            </p>
          )}
        </div>
      </Modal>
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
