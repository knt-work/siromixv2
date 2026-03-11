/**
 * FormField Molecule Component
 * 
 * Wrapper for form inputs with label, error message, and helper text.
 * Provides consistent spacing and styling for all form fields.
 */

import React from 'react';
import { Icon } from '@iconify/react';

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  error,
  helperText,
  children,
}) => {
  return (
    <div className="space-y-2">
      {/* Label */}
      <label
        htmlFor={htmlFor}
        className={`block text-sm font-medium ${
          error ? 'text-error' : 'text-text-dark'
        }`}
      >
        {label}
        {required && <span className="ml-1 text-error">*</span>}
      </label>

      {/* Input field (passed as children) */}
      {children}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-error">
          <Icon icon="lucide:alert-circle" className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Helper text */}
      {!error && helperText && (
        <p className="text-[12px] text-text-gray">{helperText}</p>
      )}
    </div>
  );
};
