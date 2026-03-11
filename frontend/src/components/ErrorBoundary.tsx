'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icon } from '@iconify/react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * Catches React errors in component tree and displays Vietnamese fallback UI.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 * 
 * @example With custom fallback
 * ```tsx
 * <ErrorBoundary fallback={<CustomError />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-md border border-[#dee1e6] p-8 text-center">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#fef2f2] flex items-center justify-center">
                <Icon
                  icon="lucide:alert-triangle"
                  className="w-8 h-8 text-[#d3595e]"
                />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-[#1a1d1f] mb-2">
              Đã xảy ra lỗi
            </h2>

            {/* Message */}
            <p className="text-[#6f767e] mb-6">
              Vui lòng tải lại trang hoặc thử lại sau.
            </p>

            {/* Error Details (development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-[#6f767e] hover:text-[#1a1d1f] mb-2">
                  Chi tiết lỗi
                </summary>
                <pre className="text-xs bg-[#f5f6f7] rounded-md p-3 overflow-auto max-h-40 text-[#d3595e]">
                  {this.state.error.toString()}
                  {this.state.error.stack && (
                    <>
                      {'\n\n'}
                      {this.state.error.stack}
                    </>
                  )}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="h-10 px-4 rounded-md border border-[#dee1e6] text-[#1a1d1f] font-medium hover:bg-[#f5f6f7] transition-colors"
              >
                Thử lại
              </button>
              <button
                onClick={this.handleReload}
                className="h-10 px-4 rounded-md bg-[#9a94de] text-white font-medium hover:bg-[#8b84d0] transition-colors flex items-center gap-2"
              >
                <Icon icon="lucide:refresh-cw" className="w-4 h-4" />
                Tải lại trang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
