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
import { simulatePipeline } from '@/lib/simulation/pipeline';
import type { ExamMetadata, TaskStatus } from '@/types';

export default function CreateExamPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createTask, updateTaskStatus, addTaskLog } = useTaskStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleFormSubmit = async (data: {
    academicYear: string;
    examName: string;
    subject: string;
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
      // Map form data to ExamMetadata (snake_case)
      const metadata: ExamMetadata = {
        academic_year: data.academicYear,
        exam_name: data.examName,
        subject: data.subject,
        duration_minutes: parseInt(data.duration, 10),
        num_versions: parseInt(data.versions, 10),
        notes: data.notes,
      };

      // Use first file for task
      const file = data.files[0];
      
      // Create task in store
      const task = createTask(
        metadata,
        file.name,
        file.size,
        user.user_id
      );

      // Add initial log
      addTaskLog(task.task_id, 'INFO', 'Đã tạo nhiệm vụ thành công');

      // Show success notification
      setShowSuccess(true);

      // Start pipeline simulation in background
      simulatePipeline(
        (status: TaskStatus) => {
          updateTaskStatus(task.task_id, status, 0);
          
          // Add status change logs
          const statusMessages: Record<TaskStatus, string> = {
            pending: 'Nhiệm vụ đang chờ xử lý',
            extracting: 'Bắt đầu trích xuất dữ liệu từ file Word',
            understanding: 'Bắt đầu phân tích nội dung câu hỏi',
            awaiting: 'Chờ xác nhận từ người dùng',
            shuffling: 'Bắt đầu xáo trộn câu hỏi',
            generating: 'Bắt đầu tạo file đề thi',
            completed: 'Hoàn thành xử lý đề thi',
            failed: 'Có lỗi xảy ra khi xử lý',
          };
          
          addTaskLog(task.task_id, 'INFO', statusMessages[status]);
        },
        (progress: number) => {
          // Get current task status to update with progress
          const currentTask = useTaskStore.getState().getTaskById(task.task_id);
          if (currentTask) {
            updateTaskStatus(task.task_id, currentTask.status, progress);
          }
        }
      ).catch((error) => {
        console.error('Pipeline simulation error:', error);
        addTaskLog(task.task_id, 'ERROR', error.message || 'Có lỗi xảy ra');
      });

      // Redirect to preview page after brief delay
      setTimeout(() => {
        router.push(`/exams/preview/${task.task_id}`);
      }, 2000);
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Có lỗi xảy ra khi tạo nhiệm vụ. Vui lòng thử lại.');
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
