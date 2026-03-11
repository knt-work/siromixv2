/**
 * FileUpload Molecule Component
 * 
 * Drag-and-drop file upload with validation and preview.
 * Supports .doc and .docx files up to 20MB with Vietnamese UI.
 */

import React, { useState, useRef } from 'react';
import { Icon } from '@iconify/react';

export interface FileUploadProps {
  onChange: (files: File[]) => void;
  error?: string;
  disabled?: boolean;
  currentFiles?: File[];
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onChange,
  error,
  disabled = false,
  currentFiles = [],
  accept = '.doc,.docx',
  maxSize = 20 * 1024 * 1024, // 20MB default
  multiple = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle file selection
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((file) => {
      // Check file size
      if (file.size > maxSize) {
        alert(`File "${file.name}" quá lớn. Kích thước tối đa: ${formatFileSize(maxSize)}`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      onChange(multiple ? [...currentFiles, ...validFiles] : validFiles);
    }
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Handle click to select files
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  // Remove file from list
  const handleRemoveFile = (index: number) => {
    const newFiles = currentFiles.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          h-40 rounded-md border-2 border-dashed transition-all cursor-pointer
          flex flex-col items-center justify-center gap-3
          ${isDragging ? 'border-brand-primary bg-brand-primary/5' : 'border-border-subtle/80 bg-[#f3f4f6]/10'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand-primary/50'}
          ${error ? 'border-error' : ''}
        `}
      >
        {/* Upload icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10">
          <Icon icon="lucide:upload" className="h-6 w-6 text-brand-primary" />
        </div>

        {/* Upload text */}
        <div className="text-center px-4">
          <p className="text-sm font-medium text-text-dark">
            Kéo và thả file .doc/.docx vào đây, hoặc nhấn vào để tải lên
          </p>
          <p className="text-[12px] text-text-gray mt-1">
            Định dạng được hỗ trợ: .doc, .docx • Tối đa {formatFileSize(maxSize)} mỗi file
          </p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
      </div>

      {/* File list */}
      {currentFiles.length > 0 && (
        <div className="space-y-3">
          {currentFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-md border border-border-subtle/60 bg-white p-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                {/* Drag handle icon */}
                <Icon icon="lucide:grip-vertical" className="h-4 w-4 text-text-gray/50" />

                {/* Document icon */}
                <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-primary/10">
                  <Icon icon="lucide:file-text" className="h-4 w-4 text-brand-primary" />
                </div>

                {/* File info */}
                <div>
                  <p className="text-sm font-medium text-text-dark">{file.name}</p>
                  <p className="text-[12px] text-text-gray">{formatFileSize(file.size)}</p>
                </div>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="p-1 text-text-gray hover:text-error transition-colors"
                disabled={disabled}
              >
                <Icon icon="lucide:x" className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Summary */}
          {currentFiles.length > 1 && (
            <div className="flex items-center justify-between px-1 text-[12px] font-medium text-text-gray">
              <span>Đã chọn {currentFiles.length} files</span>
              <span>
                Tổng cộng: {formatFileSize(currentFiles.reduce((sum, file) => sum + file.size, 0))}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
