/**
 * T070: StageIndicator component.
 * 
 * Shows 5 stage boxes with current stage highlighted.
 */

import React from 'react';

export type TaskStage = 'extract_docx' | 'ai_understanding' | 'ai_analysis' | 'shuffle' | 'render_docx';

interface StageIndicatorProps {
  currentStage: TaskStage | null;
  status: 'queued' | 'running' | 'completed' | 'failed';
  className?: string;
}

const STAGES: { key: TaskStage; label: string }[] = [
  { key: 'extract_docx', label: 'Extract' },
  { key: 'ai_understanding', label: 'Understand' },
  { key: 'ai_analysis', label: 'Analyze' },
  { key: 'shuffle', label: 'Shuffle' },
  { key: 'render_docx', label: 'Render' },
];

export default function StageIndicator({ currentStage, status, className = '' }: StageIndicatorProps) {
  const getCurrentStageIndex = () => {
    if (!currentStage) return -1;
    return STAGES.findIndex((s) => s.key === currentStage);
  };

  const currentIndex = getCurrentStageIndex();

  const getStageClassName = (index: number) => {
    const baseClasses = 'flex-1 px-3 py-2 text-center text-sm font-medium rounded transition-colors';

    if (status === 'queued') {
      return `${baseClasses} bg-gray-100 text-gray-400`;
    }

    if (status === 'failed') {
      if (index < currentIndex) {
        return `${baseClasses} bg-green-100 text-green-700`;
      } else if (index === currentIndex) {
        return `${baseClasses} bg-red-100 text-red-700 ring-2 ring-red-400`;
      } else {
        return `${baseClasses} bg-gray-100 text-gray-400`;
      }
    }

    if (status === 'completed') {
      return `${baseClasses} bg-green-100 text-green-700`;
    }

    // Running status
    if (index < currentIndex) {
      return `${baseClasses} bg-green-100 text-green-700`;
    } else if (index === currentIndex) {
      return `${baseClasses} bg-blue-100 text-blue-700 ring-2 ring-blue-400 animate-pulse`;
    } else {
      return `${baseClasses} bg-gray-100 text-gray-400`;
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {STAGES.map((stage, index) => (
        <div key={stage.key} className={getStageClassName(index)}>
          {stage.label}
        </div>
      ))}
    </div>
  );
}
