/**
 * T069: ProgressBar component.
 * 
 * Displays progress 0-100% with animated bar.
 */

import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
}

export default function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        <span className="text-sm font-medium text-gray-700">{clampedProgress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
