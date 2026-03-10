/**
 * Login Page
 * 
 * Simulated OAuth login flow with loading state.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/lib/state/auth-store';
import { simulateOAuthLogin } from '@/lib/simulation/oauth';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, redirectPath, setRedirectPath } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const destination = redirectPath || '/';
      setRedirectPath(null);
      router.push(destination);
    }
  }, [isAuthenticated, redirectPath, router, setRedirectPath]);

  // Auto-start OAuth simulation on mount
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      handleOAuthLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOAuthLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate OAuth flow (1-2 second delay)
      const user = await simulateOAuthLogin();
      
      // Update auth store
      login(user);
      
      // Redirect will happen via useEffect above
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setIsLoading(false);
    }
  };

  return (
    <PageContainer maxWidth="sm">
      <div className="flex flex-col items-center justify-center py-12">
        {/* OAuth Simulation Screen */}
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Sign in to SiroMix
            </h1>
            <p className="text-sm text-gray-600">
              Simulated Google OAuth Authentication
            </p>
          </div>

          {isLoading ? (
            <>
              {/* Loading State */}
              <div className="flex flex-col items-center justify-center py-8">
                <Spinner size="xl" variant="primary" label="Authenticating" />
                <p className="mt-4 text-sm text-gray-600">
                  Authenticating with Google...
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  This is a simulated OAuth flow
                </p>
              </div>

              {/* Simulated OAuth Consent */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-gray-300">
                    <span className="text-lg">G</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Google Account</p>
                    <p className="text-xs text-gray-500">john.doe@university.edu</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  SiroMix would like to:
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    View your email address
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    View your basic profile info
                  </li>
                </ul>
              </div>
            </>
          ) : error ? (
            <>
              {/* Error State */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">Authentication Failed</p>
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleOAuthLogin}
                className="w-full bg-primary-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors"
              >
                Try Again
              </button>
            </>
          ) : null}

          {/* Info Note */}
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> This is a mock authentication flow. 
              In production, this would redirect to Google's OAuth consent screen.
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <button
          onClick={() => router.push('/')}
          className="mt-4 text-sm text-gray-600 hover:text-primary-600 transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    </PageContainer>
  );
}
