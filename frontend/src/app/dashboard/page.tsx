/**
 * T067: Dashboard page.
 * 
 * Dashboard with "Create Task" button and task list placeholder.
 * T077: Connected to createTask API.
 */

'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createTask } from '@/lib/api/tasks';

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);

  // T077: Connect Dashboard to createTask
  const handleCreateTask = async () => {
    if (!session?.idToken) {
      setError('No authentication token available. Please sign in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const task = await createTask(session.idToken, {
        simulate_failure_stage: simulateFailure ? 'ai_understanding' : null,
      });

      // Navigate to TaskProgress page
      router.push(`/tasks/${task.task_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome, {session?.user?.name}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Task</h2>
          <p className="text-gray-600 mb-6">
            Start a new document processing task. The task will go through 5 stages: extraction, understanding, analysis, shuffling, and rendering.
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Simulate failure at &quot;Understanding&quot; stage (for testing retry)
              </span>
            </label>
          </div>

          <button
            onClick={handleCreateTask}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              'Create Task'
            )}
          </button>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Tasks</h2>
          <p className="text-gray-500 text-sm">Task list coming soon...</p>
        </div>
      </div>
    </div>
  );
}
