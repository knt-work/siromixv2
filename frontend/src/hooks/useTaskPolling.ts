/**
 * T076: useTaskPolling hook.
 * 
 * Polling logic with useEffect + setInterval (2-3s), cleanup on unmount, stop when task completed/failed.
 */

import { useEffect, useState, useCallback } from 'react';
import { getTask, TaskWithLogsResponse } from '@/lib/api/tasks';

interface UseTaskPollingOptions {
  taskId: string;
  idToken: string | null;
  interval?: number; // milliseconds (default: 2500)
  enabled?: boolean;
}

interface UseTaskPollingResult {
  task: TaskWithLogsResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTaskPolling({
  taskId,
  idToken,
  interval = 2500,
  enabled = true,
}: UseTaskPollingOptions): UseTaskPollingResult {
  const [task, setTask] = useState<TaskWithLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    if (!idToken) {
      setError('No authentication token available');
      setLoading(false);
      return;
    }

    try {
      const data = await getTask(taskId, idToken);
      setTask(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch task');
    } finally {
      setLoading(false);
    }
  }, [taskId, idToken]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchTask();

    // Stop polling if task is in terminal state
    if (task && (task.status === 'completed' || task.status === 'failed')) {
      return;
    }

    // Set up polling interval
    const pollInterval = setInterval(() => {
      fetchTask();
    }, interval);

    // Cleanup on unmount
    return () => {
      clearInterval(pollInterval);
    };
  }, [enabled, fetchTask, interval, task]);

  return {
    task,
    loading,
    error,
    refetch: fetchTask,
  };
}
