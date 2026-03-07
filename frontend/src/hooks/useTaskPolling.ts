/**
 * T076: useTaskPolling hook.
 * 
 * Polling logic with useEffect + setInterval (2-3s), cleanup on unmount, stop when task completed/failed.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
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
  startPolling: () => void;
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const idTokenRef = useRef(idToken);
  const intervalMsRef = useRef(interval);

  // Keep refs in sync
  idTokenRef.current = idToken;
  intervalMsRef.current = interval;

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchTask = useCallback(async () => {
    const token = idTokenRef.current;
    if (!token) {
      setError('No authentication token available');
      setLoading(false);
      return null;
    }

    try {
      const data = await getTask(taskId, token);
      
      if (!isMountedRef.current) return null;
      
      setTask(data);
      setError(null);
      setLoading(false);
      
      // Stop polling if task reached terminal state
      if (data && (data.status === 'completed' || data.status === 'failed')) {
        stopPolling();
      }
      
      return data;
    } catch (err) {
      if (!isMountedRef.current) return null;
      
      setError(err instanceof Error ? err.message : 'Failed to fetch task');
      setLoading(false);
      return null;
    }
  }, [taskId, stopPolling]);

  const startPolling = useCallback(() => {
    // Clear any existing interval first
    stopPolling();
    // Fetch immediately then start interval
    fetchTask();
    intervalRef.current = setInterval(() => {
      fetchTask();
    }, intervalMsRef.current);
  }, [fetchTask, stopPolling]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (!enabled || !idToken) {
      setLoading(false);
      return;
    }

    // Initial fetch and start polling
    startPolling();

    // Cleanup on unmount or when dependencies change
    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [enabled, idToken, taskId, startPolling, stopPolling]);

  return {
    task,
    loading,
    error,
    refetch: fetchTask,
    startPolling,
  };
}
