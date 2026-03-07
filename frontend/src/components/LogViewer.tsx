/**
 * T071: LogViewer component.
 * 
 * Scrollable list of logs with level badges (info/warning/error).
 */

import React from 'react';
import type { TaskLog } from '@/lib/api/tasks';

interface LogViewerProps {
  logs: TaskLog[];
  className?: string;
}

const LOG_LEVEL_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  debug: {
    label: 'DEBUG',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
  },
  info: {
    label: 'INFO',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
  },
  warning: {
    label: 'WARN',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
  },
  error: {
    label: 'ERROR',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
  },
};

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
          const config = LOG_LEVEL_CONFIG[log.level] || LOG_LEVEL_CONFIG.info;

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
                    {log.stage && (
                      <span className="text-xs text-gray-500">
                        [{log.stage}]
                      </span>
                    )}
                  </div>
                  {log.data_json && Object.keys(log.data_json).length > 0 && (
                    <pre className="mt-1 text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(log.data_json, null, 2)}
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
