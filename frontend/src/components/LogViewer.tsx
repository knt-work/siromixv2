/**
 * T071: LogViewer component.
 * 
 * Scrollable list of logs with level badges (info/warning/error).
 */

import React from 'react';
import type { TaskLog } from '@/types/task-log';

interface LogViewerProps {
  logs: TaskLog[];
  className?: string;
}

const LOG_LEVEL_CONFIG = {
  DEBUG: {
    label: 'DEBUG',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
  },
  INFO: {
    label: 'INFO',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
  },
  WARNING: {
    label: 'WARN',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
  },
  ERROR: {
    label: 'ERROR',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
  },
} as const;

export default function LogViewer({ logs, className = '' }: LogViewerProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (logs.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-500">No logs yet</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto ${className}`}>
      <div className="space-y-2">
        {logs.map((log) => {
          const config = LOG_LEVEL_CONFIG[log.log_level] ?? LOG_LEVEL_CONFIG.INFO;

          return (
            <div key={log.log_id} className="bg-white rounded p-3 shadow-sm">
              <div className="flex items-start gap-3">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.textColor}`}
                >
                  {config.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-900">{log.message}</span>
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <pre className="mt-1 text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                  <span className="text-xs text-gray-400">{formatTimestamp(log.timestamp)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
