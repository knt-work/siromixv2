'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api/client';

interface UserProfile {
  user_id: string;
  google_sub: string;
  email: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const idToken = session?.idToken as string | undefined;
  
  useEffect(() => {
    async function fetchUserProfile() {
      if (status === 'authenticated' && idToken) {
        setLoading(true);
        setError(null);
        try {
          const profile = await apiGet<UserProfile>('/api/v1/me', idToken);
          setUserProfile(profile);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        } finally {
          setLoading(false);
        }
      }
    }
    
    fetchUserProfile();
  }, [status, idToken]);
  
  if (status === 'loading') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <p className="text-xl">Loading...</p>
        </div>
      </main>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">SiroMix V2</h1>
          <p className="text-xl text-gray-600 mb-8">MVP Foundation - Phase 3: Authentication</p>
          
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-6 py-4 rounded-lg mb-8">
            <p className="font-bold mb-2">Sign in to continue</p>
            <p className="text-sm">Use your Google account to access the platform</p>
          </div>
          
          <button
            onClick={() => signIn('google')}
            className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-6 border border-gray-300 rounded-lg shadow flex items-center gap-3 mx-auto transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
          
          <div className="mt-8 text-sm text-gray-500">
            <p>Backend API: <a href="http://localhost:8000/docs" className="text-blue-600 hover:underline" target="_blank">http://localhost:8000/docs</a></p>
          </div>
        </div>
      </main>
    );
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Welcome, {session?.user?.name}!</h1>
        <p className="text-xl text-gray-600 mb-8">SiroMix V2 - MVP Foundation</p>
        
        {loading && (
          <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded mb-4">
            <p>Loading profile...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {userProfile && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-8 text-left">
            <p className="font-bold mb-3">✅ Authentication Successful</p>
            <div className="text-sm space-y-1">
              <p><strong>User ID:</strong> {userProfile.user_id}</p>
              <p><strong>Email:</strong> {userProfile.email}</p>
              <p><strong>Display Name:</strong> {userProfile.display_name}</p>
              <p><strong>Google Sub:</strong> {userProfile.google_sub}</p>
              <p className="text-xs text-green-600 mt-2">Profile fetched from backend API at /api/v1/me</p>
            </div>
          </div>
        )}
        
        <button
          onClick={() => signOut()}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Sign Out
        </button>
        
        <div className="mt-8 text-sm text-gray-500">
          <p className="mb-2">✅ Phase 3: User Story 1 Complete - Google OAuth Authentication</p>
          <p>Backend API: <a href="http://localhost:8000/docs" className="text-blue-600 hover:underline" target="_blank">http://localhost:8000/docs</a></p>
        </div>
      </div>
    </main>
  );
}
