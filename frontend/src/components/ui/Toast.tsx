'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Icon } from '@iconify/react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * useToast Hook
 * 
 * Access toast notification functions from any component.
 * 
 * @example
 * ```tsx
 * const { showToast } = useToast();
 * 
 * showToast('success', 'Đã tạo đề thi thành công');
 * showToast('error', 'Đã xảy ra lỗi khi tải dữ liệu');
 * ```
 */
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast Provider Component
 * 
 * Wrap your app with this provider to enable toast notifications.
 * 
 * @example
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, type, message, duration };

    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  const getToastConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-[#39a85e]',
          icon: 'lucide:check-circle',
          iconColor: 'text-white',
        };
      case 'error':
        return {
          bg: 'bg-[#d3595e]',
          icon: 'lucide:x-circle',
          iconColor: 'text-white',
        };
      case 'warning':
        return {
          bg: 'bg-[#fcb831]',
          icon: 'lucide:alert-triangle',
          iconColor: 'text-white',
        };
      case 'info':
        return {
          bg: 'bg-[#9a94de]',
          icon: 'lucide:info',
          iconColor: 'text-white',
        };
      default:
        return {
          bg: 'bg-[#9a94de]',
          icon: 'lucide:info',
          iconColor: 'text-white',
        };
    }
  };

  const config = getToastConfig(toast.type);

  return (
    <div
      className={`
        ${config.bg} text-white rounded-xl shadow-lg px-4 py-3
        flex items-start gap-3 min-w-[320px] max-w-md
        pointer-events-auto
        transition-all duration-300
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <Icon icon={config.icon} className={`w-5 h-5 ${config.iconColor}`} />
      </div>

      {/* Message */}
      <div className="flex-1 text-sm font-medium">
        {toast.message}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
        aria-label="Đóng thông báo"
      >
        <Icon icon="lucide:x" className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Common Vietnamese toast messages
 */
export const TOAST_MESSAGES = {
  // Success messages
  EXAM_CREATED: 'Đã tạo đề thi thành công',
  RETRY_SUCCESS: 'Đã thử lại thành công',
  UPLOAD_SUCCESS: 'Đã tải tệp lên thành công',
  SAVE_SUCCESS: 'Đã lưu thành công',

  // Error messages
  LOAD_ERROR: 'Đã xảy ra lỗi khi tải dữ liệu',
  UPLOAD_ERROR: 'Đã xảy ra lỗi khi tải tệp lên',
  VALIDATION_ERROR: 'Vui lòng kiểm tra lại thông tin',
  NETWORK_ERROR: 'Không thể kết nối tới máy chủ',
  
  // Info messages
  PROCESSING: 'Đang xử lý...',
  PLEASE_WAIT: 'Vui lòng đợi...',
  
  // Warning messages
  UNSAVED_CHANGES: 'Bạn có thay đổi chưa được lưu',
  MAX_RETRY_REACHED: 'Đã đạt giới hạn số lần thử lại',
} as const;
