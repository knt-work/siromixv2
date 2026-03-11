/**
 * StatusBadge Component
 * 
 * Color-coded badges for task status with Vietnamese labels.
 * 
 * @param {StatusBadgeProps} props - Component props
 * @param {TaskStatus} props.status - Task status ('queued' | 'running' | 'completed' | 'failed')
 * @param {string} props.className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * // Display task status in table
 * <StatusBadge status={task.status} />
 * 
 * // Vietnamese labels:
 * // - 'queued': "Chờ xử lý" (gray)
 * // - 'running': "Đang xử lý" (blue)
 * // - 'completed': "Hoàn thành" (green)
 * // - 'failed': "Thất bại" (red)
 * ```
 */

import React from 'react';

export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed';

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; bgColor: string; textColor: string }> = {
  queued: {
    label: 'Queued',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  },
  running: {
    label: 'Running',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  completed: {
    label: 'Completed',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  failed: {
    label: 'Failed',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor} ${className}`}
    >
      {config.label}
    </span>
  );
}
