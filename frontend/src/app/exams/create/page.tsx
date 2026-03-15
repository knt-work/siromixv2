/**
 * Create Exam Page
 * 
 * Protected page for authenticated users to create new exam tasks.
 * Shows form with validation, handles file upload, creates task, and starts pipeline.
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ExamMetadataForm } from '@/components/sections/ExamMetadataForm';
import { useAuthStore } from '@/lib/state/auth-store';
import { useTaskStore } from '@/lib/state/task-store';
import { createExam } from '@/lib/api/exams';
import type { ExamMetadata } from '@/types';

export default function CreateExamPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleFormSubmit = async (data: {
    academicYear: string;
    examName: string;
    subject: string;
    gradeLevel?: string;
    duration: string;
    versions: string;
    notes?: string;
    files: File[];
  }) => {
    if (!user) {
      alert('Vui lòng đăng nhập để tiếp tục');
      router.push('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      const file = data.files[0];
      if (!file) {
        throw new Error('No file uploaded');
      }

      // Read the Google ID token stored by the auth flow
      const accessToken =
        (typeof window !== 'undefined' && window.localStorage.getItem('access_token')) || '';

      // Call the real backend API — maps form fields to API contract names
      const result = await createExam(
        {
          name: data.examName,                             // examName → name
          subject: data.subject,
          academic_year: data.academicYear,
          grade_level: data.gradeLevel || undefined,
          duration_minutes: parseInt(data.duration, 10),
          num_variants: parseInt(data.versions, 10),
          instructions: data.notes || undefined,           // notes → instructions
          file,
        },
        accessToken,
      );

      // Store task metadata locally for the task management UI
      const metadata: ExamMetadata = {
        academic_year: data.academicYear,
        exam_name: data.examName,
        subject: data.subject,
        grade_level: data.gradeLevel,
        duration_minutes: parseInt(data.duration, 10),
        num_versions: parseInt(data.versions, 10),
        notes: data.notes,
      };

      // Create local task entry using IDs returned by the backend
      const { createTask, addTaskLog } = useTaskStore.getState();
      const task = createTask(metadata, file.name, file.size, user.user_id);
      addTaskLog(task.task_id, 'INFO', `Đã tạo bài thi (exam_id: ${result.exam_id}, task_id: ${result.task_id})`);

      setShowSuccess(true);

      // Redirect to task management after brief delay
      setTimeout(() => {
        router.push('/tasks');
      }, 2000);
    } catch (error) {
      console.error('Error creating exam:', error);
      const message =
        error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo bài thi. Vui lòng thử lại.';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard redirectTo="/login">
      <div className="min-h-screen bg-white">
        {/* Success Notification */}
        {showSuccess && (
          <div className="fixed top-4 right-4 z-50 max-w-[493px] rounded-md border border-brand-primary/20 bg-[#F5F4FB] p-4 shadow-md">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary">
                <svg className="h-4 w-4 text-white" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M13.3337 4L6.00033 11.3333L2.66699 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-dark">
                  Đã bắt đầu xử lý đề thi — theo dõi tiến trình trong Quản lý tác vụ
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="mx-auto max-w-[1440px] px-4 lg:px-36 pt-24 pb-12">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-text-dark mb-2">
              Tạo Đề Thi Mới
            </h1>
            <p className="text-base text-text-gray">
              Cung cấp thông tin đề thi và tải lên file Word để bắt đầu xử lý.
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-[10px] border border-border-subtle/60 bg-white shadow-sm p-8">
            <ExamMetadataForm
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmitting}
              submitButtonText="Trộn đề thi ngay"
            />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
