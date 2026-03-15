/**
 * ExamMetadataForm Organism Component
 * 
 * Complete exam creation form with validation using React Hook Form and Zod.
 * Two-column grid layout with Vietnamese labels and error messages.
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/shared/FormField';
import { FileUpload } from '@/components/shared/FileUpload';
import { Button } from '@/components/ui/Button';

// Zod validation schema with Vietnamese error messages
const examMetadataSchema = z.object({
  academicYear: z.string().min(1, 'Vui lòng chọn năm học'),
  examName: z.string().min(1, 'Vui lòng nhập tên kì thi'),
  subject: z.string().min(1, 'Vui lòng nhập môn học'),
  gradeLevel: z.string().max(100, 'Khối/lớp không được vượt quá 100 ký tự').optional(),
  duration: z.string().refine((val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num > 0;
  }, 'Thời gian phải là số dương'),
  versions: z.string().refine((val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num > 0 && num <= 100;
  }, 'Số đề phải từ 1 đến 100'),
  notes: z.string().optional(),
});

type ExamMetadataFormData = z.infer<typeof examMetadataSchema>;

export interface ExamMetadataFormProps {
  onSubmit: (data: ExamMetadataFormData & { files: File[] }) => void;
  defaultValues?: Partial<ExamMetadataFormData>;
  isSubmitting?: boolean;
  submitButtonText?: string;
}

// Academic year options (current and recent years)
const currentYear = new Date().getFullYear();
const academicYearOptions = Array.from({ length: 5 }, (_, i) => {
  const year = currentYear - i;
  return {
    value: `${year}-${year + 1}`,
    label: `${year}-${year + 1}`,
  };
});

export const ExamMetadataForm: React.FC<ExamMetadataFormProps> = ({
  onSubmit,
  defaultValues,
  isSubmitting = false,
  submitButtonText = 'Trộn đề thi ngay',
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExamMetadataFormData>({
    resolver: zodResolver(examMetadataSchema),
    defaultValues,
  });

  const handleFormSubmit = (data: ExamMetadataFormData) => {
    // Validate files
    if (files.length === 0) {
      setFileError('Vui lòng tải lên ít nhất một file');
      return;
    }
    setFileError('');
    
    // Submit with files
    onSubmit({ ...data, files });
  };

  const handleFileChange = (newFiles: File[]) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      setFileError('');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Two-column grid for form fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-8">
        {/* Left column */}
        <div className="space-y-8">
          {/* Academic Year */}
          <FormField
            label="Năm học"
            htmlFor="academicYear"
            required
            error={errors.academicYear?.message}
          >
            <Select
              id="academicYear"
              {...register('academicYear')}
              options={academicYearOptions}
              placeholder="Chọn năm học"
              hasError={!!errors.academicYear}
              fullWidth
            />
          </FormField>

          {/* Grade Level */}
          <FormField
            label="Khối/Lớp"
            htmlFor="gradeLevel"
            error={errors.gradeLevel?.message}
            helperText="Khối hoặc lớp dự thi (không bắt buộc)"
          >
            <Input
              id="gradeLevel"
              {...register('gradeLevel')}
              placeholder="VD: Khối 10, Lớp 11A"
              hasError={!!errors.gradeLevel}
              fullWidth
            />
          </FormField>

          {/* Subject */}
          <FormField
            label="Môn học"
            htmlFor="subject"
            required
            error={errors.subject?.message}
          >
            <Input
              id="subject"
              {...register('subject')}
              placeholder="VD: Toán, Lý, Hóa, Sinh"
              hasError={!!errors.subject}
              fullWidth
            />
          </FormField>

          {/* Versions Count */}
          <FormField
            label="Số lượng mã đề"
            htmlFor="versions"
            required
            error={errors.versions?.message}
            helperText="Số lượng đề thi khác nhau cần tạo"
          >
            <Input
              id="versions"
              {...register('versions')}
              type="number"
              placeholder="VD: 4"
              hasError={!!errors.versions}
              fullWidth
              min="1"
              max="100"
            />
          </FormField>

          {/* Notes */}
          <FormField
            label="Ghi chú"
            htmlFor="notes"
            error={errors.notes?.message}
            helperText="Thông tin bổ sung về đề thi (không bắt buộc)"
          >
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt..."
              rows={6}
              hasError={!!errors.notes}
              fullWidth
            />
          </FormField>
        </div>

        {/* Right column */}
        <div className="space-y-8">
          {/* Exam Name */}
          <FormField
            label="Tên kì thi"
            htmlFor="examName"
            required
            error={errors.examName?.message}
          >
            <Input
              id="examName"
              {...register('examName')}
              placeholder="VD: Kiểm tra học kỳ I - Khối 10"
              hasError={!!errors.examName}
              fullWidth
            />
          </FormField>

          {/* Duration */}
          <FormField
            label="Thời gian thi (phút)"
            htmlFor="duration"
            required
            error={errors.duration?.message}
          >
            <Input
              id="duration"
              {...register('duration')}
              type="number"
              placeholder="VD: 90"
              hasError={!!errors.duration}
              fullWidth
              min="1"
            />
          </FormField>

          {/* File Upload */}
          <FormField
            label="Tải lên file đề thi"
            htmlFor="fileUpload"
            required
            error={fileError}
            helperText="File Word chứa đề thi gốc cần trộn"
          >
            <FileUpload
              onChange={handleFileChange}
              currentFiles={files}
              disabled={isSubmitting}
              error={fileError}
              accept=".doc,.docx"
              maxSize={20 * 1024 * 1024} // 20MB
              multiple
            />
          </FormField>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-4 border-t border-border-subtle/60 pt-8">
        <Button
          type="button"
          variant="secondary"
          size="md"
          disabled={isSubmitting}
        >
          Lưu vào nháp
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          loadingText="Đang xử lý..."
        >
          {submitButtonText}
        </Button>
      </div>
    </form>
  );
};
