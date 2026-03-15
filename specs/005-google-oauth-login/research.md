# Research: Feature 005 — Real Google OAuth Login

**Date**: 2026-03-15
**Branch**: `005-google-oauth-login`

---

## Decision Log

### 1. SessionProvider Architecture

**Decision**: Create a separate `app/providers.tsx` client component to wrap `SessionProvider`. Do NOT place SessionProvider directly inside the root layout, even though layout.tsx currently has `'use client'`.

**Rationale**: next-auth v4 documentation explicitly states that `<SessionProvider />` requires a client component and cannot be put inside the root server layout. The current layout.tsx is a `'use client'` page-level component that also renders Navbar — it should remain focused on that concern. A dedicated `Providers.tsx` cleanly separates session hydration from layout rendering and follows next-auth v4 App Router conventions.

**Alternatives considered**:
- Keep layout.tsx 'use client' and put SessionProvider directly in it — rejected because it couples layout with session management and violates single-responsibility.
- Use next-auth v5 — rejected because package.json pins next-auth 4.24.0 and upgrading is out of scope.

---

### 2. next-auth Route Handler Export Pattern

**Decision**: Use explicit GET/POST handler exports for `app/api/auth/[...nextauth]/route.ts`.

```typescript
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**Rationale**: Next.js 14 App Router requires named HTTP method exports. `NextAuth()` returns a handler that supports both GET (redirects, callback display) and POST (sign in, sign out, CSRF token) — both must be exported.

**Alternatives considered**:
- Default export — not supported by App Router route handlers.
- Separate GET/POST logic — unnecessary; NextAuth wraps both.

---

### 3. Google ID Token Flow (JWT → Session)

**Decision**: Capture `account.id_token` in the JWT callback and expose it as `session.idToken`.

```typescript
callbacks: {
  async jwt({ token, account }) {
    if (account?.id_token) token.idToken = account.id_token;
    return token;
  },
  async session({ session, token }) {
    session.idToken = token.idToken as string;
    return session;
  },
}
```

**Rationale**: Google's OAuth2 provider returns the raw JWT ID token in `account.id_token` only on the initial sign-in callback. It must be persisted into the next-auth JWT (encrypted server-side cookie) during that first callback, then forwarded to session so client components (SessionSync) can read it.

**Alternatives considered**:
- Using `account.access_token` for backend verification — rejected because backend `verify_google_token()` expects a Google ID token (JWT with `sub`, `email`, etc.), not a scope-limited access token.
- Re-fetching ID token from Google on each request — too complex, not needed for MVP.

---

### 4. Avatar Fallback for Initials

**Decision**: Use the existing `<Avatar>` component — it already extracts initials from the `alt` prop when `src` is null or fails to load. No custom implementation needed.

```tsx
<Avatar src={user.avatar_url} alt={user.full_name} size="md" />
```

**Rationale**: The Avatar component at `frontend/src/components/ui/Avatar.tsx` already implements initials extraction (first two characters from split name) and renders with the primary brand color background. Reusing it avoids duplication.

**Alternatives considered**:
- Custom initials component — rejected; existing Avatar already handles it.
- `next/image` for the Google avatar — deferred; next/image requires `remotePatterns` config for `lh3.googleusercontent.com`. The existing `<img>` in Navbar is sufficient for MVP. Can be upgraded post-MVP.

---

### 5. Error Surface for Login Failures

**Decision**:
- **Modal error** (`<Modal>` component): Used when `GET /api/v1/me` fails after Google OAuth succeeds (FR-010). The user is still in the Google session but unregistered in the backend — a modal with "Login failed — please try again" + error detail is the correct pattern.
- **Toast notification** (`useToast()` hook): Used for stale mock session notification (FR-012). It's a transient informational message, not a blocking action.

**Rationale**: The existing Modal and Toast components in the design system are fully accessible and already styled to brand guidelines. Reusing them is consistent with Principle VIII and avoids new primitives.

---

### 6. Mock Session Migration Strategy

**Decision**: Detect stale mock sessions in `auth-store.ts` `checkAuth()` by checking if `localStorage['access_token']` starts with `mock-token-`. If detected: clear the stored user, clear the token, and set a flag that triggers the toast on next render.

**Implementation detail**:
- Add `staleMockSession: boolean` to auth store state
- In `checkAuth()`: if `access_token.startsWith('mock-token-')` → call `logout()` and set `staleMockSession = true`
- In `Providers.tsx` or root via `SessionSync`: if `staleMockSession` → show toast, reset flag

**Rationale**: This is a one-time migration path. Detection at app load (`checkAuth()`) ensures it fires before any protected route renders. The flag prevents the toast from showing on every page navigation.

---

### 7. Backend — No Changes Required

**Decision**: Backend `verify_google_token()` in `auth.py` already handles real Google ID tokens and has `DEV_BYPASS_AUTH` for local dev. No backend changes needed for this feature.

**What's confirmed done**:
- `DEV_BYPASS_AUTH=true` in `backend/.env`
- Mock token bypass in `auth.py`
- `GET /api/v1/me` endpoint already registers/returns user

---

### 8. AuthGuard Enhancement for next-auth Loading State

**Decision**: Update `AuthGuard.tsx` to check next-auth `useSession()` status in addition to Zustand `isLoading`. When `status === 'loading'`, show the full-page spinner. Zustand's `isLoading` alone is insufficient because it doesn't know about next-auth's session resolution.

**Rationale**: FR-011 requires that protected pages show a full-page spinner while session resolves. The current AuthGuard uses only Zustand's isLoading which is set synchronously on mount — it doesn't track next-auth's async status check.

---

## Resolved NEEDS CLARIFICATION Items

| Item | Resolution |
|------|-----------|
| SessionProvider placement | Separate `Providers.tsx` client component |
| route.ts export syntax | `export { handler as GET, handler as POST }` |
| id_token JWT chain | `account.id_token → token.idToken → session.idToken` |
| Avatar initials | Existing `<Avatar>` component handles it |
| Toast vs Modal | Modal for backend failures, Toast for session migration |
| Mock session migration | Detect `mock-token-*` prefix in `checkAuth()` |
| next/image vs img tag | Keep `<img>` for MVP, configure remotePatterns post-MVP |
