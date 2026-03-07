/**
 * T072: StatusBadge component.
 * 
 * Color-coded badges for task status (queued/running/completed/failed).
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
