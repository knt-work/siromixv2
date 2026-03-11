/**
 * ProcessingStatus Section Component
 * 
 * Displays processing status with Vietnamese labels, badge, progress bar, logs timeline, and retry button.
 * Part of Phase 8: User Story 6 - Exam Detail View & Retry
 * 
 * @param {ProcessingStatusProps} props - Component props
 * @param {Task} props.task - Task object with status, current_stage, and progress
 * @param {TaskLog[]} props.logs - Array of task log entries for timeline
 * @param {() => void} props.onRetry - Callback when retry button is clicked
 * @param {boolean} props.showRetryButton - Show retry button (only for failed tasks)
 * 
 * @example
 * ```tsx
 * // Task detail page status section
 * <ProcessingStatus
 *   task={task}
 *   logs={task.logs}
 *   onRetry={handleRetry}
 *   showRetryButton={task.status === 'failed'}
 * />
 * ```
 * 
 * @note
 * Vietnamese stage labels:
 * - "Chờ xử lý" - Pending
 * - "Trích xuất" - Extracting
 * - "Đọc hiểu" - Understanding
 * - "Xác nhận" - Awaiting confirmation
 * - "Trộn đề" - Shuffling
 * - "Tạo files" - Generating files
 * - "Hoàn thành" - Completed
 */

'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Task, TaskLog } from '@/types';
import { formatDate } from '@/lib/utils/dates';

export interface ProcessingStatusProps {
  task: Task;
  logs?: TaskLog[];
  onRetry?: () => void;
  showRetryButton?: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  extracting: 'Trích xuất',
  understanding: 'Đọc hiểu',
  awaiting: 'Xác nhận',
  shuffling: 'Trộn đề',
  generating: 'Tạo files',
  completed: 'Hoàn tất',
  failed: 'Lỗi',
};

const STAGES = [
  { key: 'extracting', label: 'Trích xuất' },
  { key: 'understanding', label: 'Đọc hiểu' },
  { key: 'awaiting', label: 'Xác nhận' },
  { key: 'shuffling', label: 'Trộn đề' },
  { key: 'generating', label: 'Tạo files' },
];

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  task,
  logs = [],
  onRetry,
  showRetryButton = false,
}) => {
  const isProcessing = ['extracting', 'understanding', 'shuffling', 'generating'].includes(task.status);
  const isCompleted = task.status === 'completed';
  const isFailed = task.status === 'failed';
  const isPending = task.status === 'pending';
  
  // Determine which stage is currently active
  const getCurrentStageIndex = () => {
    const stageIndex = STAGES.findIndex(s => s.key === task.status);
    return stageIndex !== -1 ? stageIndex : (isCompleted ? STAGES.length : -1);
  };

  const currentStageIndex = getCurrentStageIndex();
  const maxRetries = 2;
  const canRetry = isFailed && (task.retry_count || 0) < maxRetries;

  return (
    <section className="rounded-xl border border-[#dee1e6] bg-white shadow-sm">
      {/* Section Header with Status */}
      <div className="flex flex-col items-center border-b border-[#dee1e6]/40 py-6">
        <h2 className="text-lg font-semibold">Chi tiết tiến trình</h2>
        <div className="mt-2">
          <Badge variant={task.status as BadgeVariant} size="md" />
        </div>
        {task.progress > 0 && task.progress < 100 && (
          <div className="mt-2 rounded-full bg-[#9a94de]/10 px-3 py-0.5">
            <span className="text-[12px] font-semibold text-[#9a94de]">
              {task.progress}% Hoàn tất
            </span>
          </div>
        )}
        {isCompleted && (
          <div className="mt-2 rounded-full bg-[#39a85e]/10 px-3 py-0.5">
            <span className="text-[12px] font-semibold text-[#39a85e]">
              100% Hoàn tất
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Stage Stepper */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-4 md:gap-0">
          {STAGES.map((stage, index) => {
            const isActive = index === currentStageIndex;
            const isCompleteStage = index < currentStageIndex || isCompleted;
            
            return (
              <React.Fragment key={stage.key}>
                {/* Stage Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isCompleteStage || isCompleted
                        ? 'bg-[#39a85e]'
                        : isActive
                        ? 'bg-[#9a94de]'
                        : 'bg-[#dee1e6]'
                    }`}
                  >
                    {isCompleteStage || isCompleted ? (
                      <Icon icon="lucide:check" className="h-4 w-4 text-white" />
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span className="mt-2 text-[12px] font-medium">{stage.label}</span>
                </div>

                {/* Connector Line */}
                {index < STAGES.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 w-16 rounded-full md:mx-4 ${
                      index < currentStageIndex || isCompleted
                        ? 'bg-[#39a85e]'
                        : 'bg-[#dee1e6]'
                    }`}
                  ></div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Status Banner */}
        {isCompleted && (
          <div className="flex items-center justify-between rounded-xl border border-[#39a85e]/20 bg-[#39a85e]/5 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#39a85e]/10">
                <Icon icon="lucide:check-circle" className="h-5 w-5 text-[#39a85e]" />
              </div>
              <div>
                <p className="text-sm font-semibold">Tạo và trộn đề hoàn tất</p>
                <p className="text-sm text-[#565d6d]">
                  Tất cả {task.metadata.num_versions} mã đề đã được tạo và định dạng thành công. Sẵn sàng để tải xuống.
                </p>
              </div>
            </div>
            {task.completed_at && (
              <div className="hidden items-center gap-1.5 text-[12px] font-medium text-[#565d6d] md:flex">
                <Icon icon="lucide:clock" className="h-3.5 w-3.5" />
                <span>Kết thúc lúc {formatDate(task.completed_at, 'HH:mm')}</span>
              </div>
            )}
          </div>
        )}

        {isFailed && (
          <div className="flex items-center justify-between rounded-xl border border-[#d3595e]/20 bg-[#d3595e]/5 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d3595e]/10">
                <Icon icon="lucide:alert-circle" className="h-5 w-5 text-[#d3595e]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#d3595e]">Đã xảy ra lỗi</p>
                <p className="text-sm text-[#565d6d]">
                  {task.error || 'Quá trình xử lý đề thi gặp lỗi. Vui lòng thử lại.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="rounded-xl border border-[#9a94de]/20 bg-[#9a94de]/5 p-4">
            <ProgressBar value={task.progress} variant="primary" size="md" showLabel />
            <p className="mt-2 text-sm text-[#565d6d]">
              Đang xử lý: {STAGE_LABELS[task.status] || task.status}
            </p>
          </div>
        )}

        {/* Retry Button */}
        {showRetryButton && isFailed && (
          <div className="mt-4">
            {canRetry ? (
              <button
                onClick={onRetry}
                className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#9a94de] px-4 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
              >
                <Icon icon="lucide:rotate-cw" className="h-4 w-4" />
                Thử lại
              </button>
            ) : (
              <div className="rounded-md border border-[#dee1e6] bg-[#f3f4f6] px-4 py-2">
                <p className="text-sm text-[#565d6d]">
                  Đã hết lượt thử lại (tối đa {maxRetries} lần)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Logs Section */}
        {logs.length > 0 && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:file-text" className="h-3.5 w-3.5 text-[#565d6d]" />
                <span className="text-sm font-medium">Logs & Lịch sử</span>
              </div>
              <span className="text-[12px] text-[#565d6d]">
                {logs.length} log{logs.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="log-container custom-scrollbar max-h-[300px] overflow-y-auto rounded-md border border-[#dee1e6] bg-[#fafafb] p-4 font-mono text-sm leading-relaxed">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-4">
                  <span className="text-[#171a1f]/40">
                    [{formatDate(log.timestamp, 'HH:mm:ss')}]
                  </span>
                  <span className={log.log_level === 'ERROR' ? 'text-[#d3595e]' : ''}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata Rows */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="mb-1 text-[12px] font-medium uppercase tracking-wider text-[#565d6d]">
              NGÀY TẠO
            </p>
            <div className="flex items-center gap-1.5 text-sm">
              <Icon icon="lucide:calendar" className="h-3.5 w-3.5 text-[#565d6d]" />
              <span>{formatDate(task.created_at, 'dd/MM/yyyy — HH:mm')}</span>
            </div>
          </div>

          <div>
            <p className="mb-1 text-[12px] font-medium uppercase tracking-wider text-[#565d6d]">
              CẬP NHẬT LẦN CUỐI
            </p>
            <div className="flex items-center gap-1.5 text-sm">
              <Icon icon="lucide:clock" className="h-3.5 w-3.5 text-[#565d6d]" />
              <span>{formatDate(task.updated_at, 'dd/MM/yyyy — HH:mm')}</span>
            </div>
          </div>

          {task.retry_count && task.retry_count > 0 && (
            <div>
              <p className="mb-1 text-[12px] font-medium uppercase tracking-wider text-[#565d6d]">
                SỐ LẦN THỬ LẠI
              </p>
              <span className="text-sm font-medium">{task.retry_count} / {maxRetries}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
