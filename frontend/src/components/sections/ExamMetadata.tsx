/**
 * ExamMetadata Section Component
 * 
 * Displays exam metadata in a read-only card format with Vietnamese labels.
 * Part of Phase 8: User Story 6 - Exam Detail View & Retry
 */

'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import type { ExamMetadata as ExamMetadataType } from '@/types';

export interface ExamMetadataProps {
  metadata: ExamMetadataType;
  fileName?: string;
}

export const ExamMetadata: React.FC<ExamMetadataProps> = ({
  metadata,
  fileName,
}) => {
  return (
    <section className="rounded-xl border border-[#dee1e6] bg-white shadow-sm">
      {/* Section Header */}
      <div className="border-b border-[#dee1e6]/40 px-6 py-4">
        <h2 className="text-lg font-semibold">Thông tin kì thi</h2>
      </div>

      {/* Metadata Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 gap-y-6 md:grid-cols-2">
          {/* Academic Year */}
          <div>
            <p className="mb-1 text-[12px] font-medium uppercase tracking-wider text-[#565d6d]">
              NĂM HỌC
            </p>
            <p className="text-sm font-medium">{metadata.academic_year}</p>
          </div>

          {/* Exam Name */}
          <div>
            <p className="mb-1 text-[12px] font-medium uppercase tracking-wider text-[#565d6d]">
              TÊN KÌ THI
            </p>
            <p className="text-sm font-medium">{metadata.exam_name}</p>
          </div>

          {/* Subject */}
          <div>
            <p className="mb-1 text-[12px] font-medium uppercase tracking-wider text-[#565d6d]">
              MÔN HỌC
            </p>
            <p className="text-sm font-medium">{metadata.subject}</p>
          </div>

          {/* Duration */}
          <div>
            <p className="mb-1 text-[12px] font-medium uppercase tracking-wider text-[#565d6d]">
              THỜI GIAN LÀM BÀI
            </p>
            <p className="text-sm font-medium">{metadata.duration_minutes} phút</p>
          </div>

          {/* Num Versions */}
          <div>
            <p className="mb-1 text-[12px] font-medium uppercase tracking-wider text-[#565d6d]">
              SỐ LƯỢNG MÃ ĐỀ
            </p>
            <p className="text-sm font-medium">{metadata.num_versions}</p>
          </div>

          {/* Original File */}
          {fileName && (
            <div>
              <p className="mb-1 text-[12px] font-medium uppercase tracking-wider text-[#565d6d]">
                CÁC FILE ĐƯỢC TẢI LÊN
              </p>
              <div className="inline-flex items-center gap-2 rounded-md border border-[#dee1e6]/50 bg-[#f3f4f6]/20 px-3 py-2">
                <Icon icon="lucide:file-text" className="h-4 w-4 text-[#9a94de]" />
                <span className="text-sm font-medium">{fileName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Notes Section */}
        {metadata.notes && (
          <div className="mt-6">
            <p className="mb-2 text-[12px] font-medium uppercase tracking-wider text-[#565d6d]">
              GHI CHÚ
            </p>
            <div className="rounded-md border border-[#dee1e6]/30 bg-[#fafafb] p-3">
              <p className="text-sm leading-relaxed">{metadata.notes}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
