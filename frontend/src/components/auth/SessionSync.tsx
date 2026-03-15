'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useAuthStore } from '@/lib/state/auth-store';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/shared/Modal';
import type { User } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/**
 * SessionSync bridges next-auth session state to the Zustand auth store.
 *
 * Responsibilities:
 * - Authenticated session → GET /api/v1/me → authStore.login(user, idToken)
 * - /api/v1/me failure → signOut() + show error modal + console.error
 * - Unauthenticated session + store authenticated → authStore.logout()
 * - staleMockSession flag → toast "session expired" + clearStaleMockFlag()
 *
 * Renders nothing visible except the error modal when needed.
 */
export function SessionSync() {
  const { data: session, status } = useSession();
  const { login, logout, isAuthenticated, staleMockSession, clearStaleMockFlag } = useAuthStore();
  const { showToast } = useToast();
  const [meError, setMeError] = useState(false);

  // Show stale mock session toast once on mount
  useEffect(() => {
    if (staleMockSession) {
      showToast('warning', 'Phiên cũ đã hết hạn — vui lòng đăng nhập lại.');
      clearStaleMockFlag();
    }
  }, [staleMockSession, showToast, clearStaleMockFlag]);

  // Sync next-auth session → Zustand store
  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated' && session?.idToken) {
      // Call backend to get full user profile
      fetch(`${API_BASE_URL}/api/v1/me`, {
        headers: { Authorization: `Bearer ${session.idToken}` },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`/api/v1/me returned ${res.status}`);
          const user: User = await res.json();
          login(user, session.idToken);
        })
        .catch((err) => {
          console.error('[SessionSync] Failed to fetch /api/v1/me:', err);
          setMeError(true);
          signOut({ redirect: false });
        });
    } else if (status === 'unauthenticated' && isAuthenticated) {
      logout();
    }
  }, [status, session, login, logout, isAuthenticated]);

  return (
    <>
      <Modal
        isOpen={meError}
        onClose={() => setMeError(false)}
        title="Lỗi xác thực"
        size="sm"
      >
        <p className="text-sm text-[#565d6d]">
          Không thể lấy thông tin tài khoản từ máy chủ. Vui lòng thử đăng nhập lại.
        </p>
      </Modal>
    </>
  );
}
