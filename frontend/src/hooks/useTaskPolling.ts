/**
 * useTaskPolling Hook
 * 
 * Polls a specific task for updates at a regular interval.
 * Automatically stops polling when task reaches a terminal state (completed/failed).
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useTaskStore } from '@/lib/state/task-store';
import type { Task, TaskStatus } from '@/types';

export interface UseTaskPollingOptions {
  taskId: string;
  interval?: number;              // Default: 3000ms
  enabled?: boolean;              // Default: true
  onComplete?: (task: Task) => void;
  onError?: (task: Task) => void;
}

export interface UseTaskPollingResult {
  task: Task | undefined;
  isPolling: boolean;
  stopPolling: () => void;
}

// Processing statuses that require polling
const PROCESSING_STATUSES: TaskStatus[] = [
  'extracting',
  'understanding',
  'shuffling',
  'generating',
];

// Terminal statuses that stop polling
const TERMINAL_STATUSES: TaskStatus[] = ['completed', 'failed'];

export function useTaskPolling({
  taskId,
  interval = 3000,
  enabled = true,
  onComplete,
  onError,
}: UseTaskPollingOptions): UseTaskPollingResult {
  const getTaskById = useTaskStore((state) => state.getTaskById);
  const [task, setTask] = useState<Task | undefined>(() => getTaskById(taskId));
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevTaskRef = useRef<Task | undefined>(task);

  // Stop polling function
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsPolling(false);
    }
  }, []);

  // Poll function
  const poll = useCallback(() => {
    const currentTask = getTaskById(taskId);
    
    // Update task if data changed (avoid unnecessary re-renders)
    if (JSON.stringify(currentTask) !== JSON.stringify(prevTaskRef.current)) {
      setTask(currentTask);
      prevTaskRef.current = currentTask;

      // Check for terminal states
      if (currentTask) {
        if (currentTask.status === 'completed' && onComplete) {
          onComplete(currentTask);
          stopPolling();
        } else if (currentTask.status === 'failed' && onError) {
          onError(currentTask);
          stopPolling();
        } else if (TERMINAL_STATUSES.includes(currentTask.status)) {
          // Stop polling even without callbacks
          stopPolling();
        }
      }
    }
  }, [taskId, getTaskById, onComplete, onError, stopPolling]);

  // Start/stop polling based on enabled flag and task status
  useEffect(() => {
    if (!enabled) {
      stopPolling();
      return;
    }

    const currentTask = getTaskById(taskId);

    // Don't poll if task doesn't exist
    if (!currentTask) {
      stopPolling();
      return;
    }

    // Don't poll if task is in terminal state
    if (TERMINAL_STATUSES.includes(currentTask.status)) {
      stopPolling();
      return;
    }

    // Start polling for pending or processing tasks
    if (currentTask.status === 'pending' || PROCESSING_STATUSES.includes(currentTask.status)) {
      setIsPolling(true);
      intervalRef.current = setInterval(poll, interval);

      // Poll immediately on mount
      poll();
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      stopPolling();
    };
  }, [taskId, interval, enabled, poll, stopPolling, getTaskById]);

  return {
    task,
    isPolling,
    stopPolling,
  };
}
