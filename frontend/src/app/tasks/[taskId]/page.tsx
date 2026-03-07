/**
 * T068: TaskProgress page.
 * 
 * Task progress page with status, progress bar, stage indicator, log viewer, retry button.
 * T078: Connected to polling with useTaskPolling hook.
 * T079: Connected retry button to retryTask API.
 * T080: Error handling for all API calls.
 * T081: Loading states.
 */

'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useTaskPolling } from '@/hooks/useTaskPolling';
import { retryTask } from '@/lib/api/tasks';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import StageIndicator from '@/components/StageIndicator';
import LogViewer from '@/components/LogViewer';

export default function TaskProgressPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const taskId = params?.taskId as string;

  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  // T078: Connect TaskProgress page to polling
  const { task, loading, error, refetch, startPolling } = useTaskPolling({
    taskId,
    idToken: session?.idToken || null,
    interval: 2500, // 2.5 seconds
    enabled: !!session?.idToken,
  });

  // T079: Connect retry button to retryTask
  const handleRetry = async () => {
    if (!session?.idToken) {
      setRetryError('No authentication token available. Please sign in again.');
      return;
    }

    if (!task) {
      setRetryError('Task not found');
      return;
    }

    setRetrying(true);
    setRetryError(null);

    try {
      await retryTask(taskId, session.idToken);
      // Restart polling to track the retried task
      startPolling();
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : 'Failed to retry task');
    } finally {
      setRetrying(false);
    }
  };

  // T080: Error handling
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to view this task</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error Loading Task</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // T081: Loading states
  if (loading || !task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading task...</p>
        </div>
      </div>
    );
  }

  const canRetry = task.status === 'failed';
  const isActive = task.status === 'queued' || task.status === 'running';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Task Progress</h1>
              <p className="text-sm text-gray-500 mt-1">Task ID: {task.task_id}</p>
            </div>
            <StatusBadge status={task.status} />
          </div>
        </div>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="bg-white rounded-lg shadow p-6">
            <ProgressBar progress={task.progress} />
          </div>

          {/* Stage Indicator */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Stages</h2>
            <StageIndicator currentStage={task.current_stage} status={task.status} />
          </div>

          {/* Error Message */}
          {task.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Task Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{task.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Retry Error */}
          {retryError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{retryError}</p>
            </div>
          )}

          {/* Retry Button */}
          {canRetry && (
            <div className="bg-white rounded-lg shadow p-6">
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {retrying ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Retrying...
                  </span>
                ) : (
                  'Retry Task'
                )}
              </button>
            </div>
          )}

          {/* Active Task Indicator */}
          {isActive && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-blue-800">
                  {task.status === 'queued' ? 'Task queued, waiting to start...' : 'Task is running, updating every 2-3 seconds...'}
                </p>
              </div>
            </div>
          )}

          {/* Logs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Logs</h2>
            <LogViewer logs={task.logs || []} />
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-gray-900">{new Date(task.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-gray-900">{new Date(task.updated_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Current Stage</dt>
                <dd className="mt-1 text-gray-900">{task.current_stage || 'Not started'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Retry Counts</dt>
                <dd className="mt-1 text-gray-900">
                  {Object.entries(task.retry_count_by_stage).length > 0
                    ? Object.entries(task.retry_count_by_stage)
                        .filter(([_, count]) => count > 0)
                        .map(([stage, count]) => `${stage}: ${count}`)
                        .join(', ') || 'None'
                    : 'None'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
