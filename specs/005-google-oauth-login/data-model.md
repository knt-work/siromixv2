# Data Model: Feature 005 — Real Google OAuth Login

**Date**: 2026-03-15
**Branch**: `005-google-oauth-login`

---

## Overview

This feature introduces no new database tables. It wires up the existing `User` model (delivered in Feature 003) to real Google OAuth credentials. The key client-side data structures are updated to carry the real Google ID token and profile.

---

## 1. Backend: User Entity (existing — no schema changes)

**Table**: `users`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | PK, default gen_random_uuid() | Internal app UUID |
| `google_sub` | VARCHAR | UNIQUE, NOT NULL | Immutable Google Subject ID — permanent user key |
| `email` | VARCHAR | NOT NULL | Updated on each login (may change) |
| `display_name` | VARCHAR | NOT NULL | Updated on each login |
| `avatar_url` | VARCHAR | NULLABLE | Google profile photo URL — updated on each login |
| `created_at` | TIMESTAMP | NOT NULL, default now() | First login timestamp |

**Key behaviour**:
- `GET /api/v1/me` uses `google_sub` as the upsert key
- `email` and `display_name` are always refreshed from the current Google profile
- No NEW fields — this feature only wires up the existing schema

---

## 2. Frontend: User Type (existing — no change)

**File**: `frontend/src/types/user.ts`

```typescript
interface User {
  user_id: string;          // Maps to backend `id` (UUID)
  email: string;            // Google email
  full_name: string;        // Google display_name
  avatar_url: string | null; // Google profile photo URL (null if unavailable)
  role: 'professor';        // Fixed for MVP
  created_at: string;       // ISO 8601
}
```

No field additions required.

---

## 3. Frontend: next-auth Session (new type augmentation)

**File**: `frontend/src/types/next-auth.d.ts`

```typescript
declare module 'next-auth' {
  interface Session {
    idToken?: string;          // Google ID token — used for backend API auth
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    idToken?: string;          // Stored in encrypted next-auth JWT cookie
  }
}
```

**Change from current**: Remove `| null` from both `idToken` fields — token is either present (string) or absent (undefined). The `| null` is misleading and causes unnecessary null-checks in SessionSync.

---

## 4. Frontend: Auth Store State (existing — augmented)

**File**: `frontend/src/lib/state/auth-store.ts`

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  redirectPath: string | null;
  staleMockSession: boolean;     // NEW — triggers "Session expired" toast on first render after migration

  login: (user: User, token?: string) => void;
  logout: () => void;
  checkAuth: () => void;
  setRedirectPath: (path: string | null) => void;
  clearStaleMockFlag: () => void;  // NEW — called after toast is shown
}
```

**Persisted fields** (localStorage `auth-state` key): `user`, `isAuthenticated`
**NOT persisted**: `isLoading`, `staleMockSession` (ephemeral flags)

---

## 5. Validation Rules

| Field | Rule |
|-------|------|
| `google_sub` | Must be non-empty string from verified Google token |
| `email` | Must be valid email from verified Google token |
| `display_name` | Non-empty string; truncated to 255 chars if needed |
| `idToken` (client) | Must be present in session before backend API calls |
| Mock token detection | `access_token.startsWith('mock-token-')` → stale session |

---

## 6. Client-Side State Flow

```
Google OAuth consent
       ↓
next-auth /api/auth/callback/google
       ↓
JWT callback: stores account.id_token → token.idToken
       ↓
Session callback: exposes token.idToken → session.idToken
       ↓
SessionSync (useSession):
  status='authenticated' & session.idToken exists
       ↓
  GET /api/v1/me (Authorization: Bearer {idToken})
       ↓
  Backend returns User record (created or fetched)
       ↓
  auth-store.login(user, session.idToken)
       ↓
  localStorage['access_token'] = session.idToken
  localStorage['auth-state'] = { user, isAuthenticated: true }
```

---

## 7. No New Migrations Required

The `users` table was created in Feature 003. This feature:
- Does NOT add columns
- Does NOT change constraints
- Does NOT require a new Alembic migration
