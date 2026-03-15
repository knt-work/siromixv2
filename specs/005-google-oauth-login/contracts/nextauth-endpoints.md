# API Contract: next-auth OAuth Endpoints

**Feature**: 005 — Real Google OAuth Login  
**Layer**: Frontend internal (next-auth route handlers)  
**Auth**: Managed by next-auth (CSRF token)

---

## Purpose

These endpoints are handled automatically by `next-auth` via the `[...nextauth]` catch-all route. They are **not** called directly by application code — they are invoked by the browser during the OAuth flow.

---

## Endpoints

### `GET /api/auth/signin`
Displays the sign-in page (redirected from `signIn('google')` call).  
In this project: `pages.signIn = '/login'` overrides this — the custom login page is used instead.

### `GET /api/auth/signin/google`
Initiates the Google OAuth consent flow. Triggered by `signIn('google', { callbackUrl })`.

### `GET /api/auth/callback/google`
OAuth callback from Google. Processes the authorization code, exchanges for tokens, runs JWT + session callbacks, sets encrypted session cookie, then redirects to `callbackUrl`.

**This URI must be registered in Google Cloud Console**:
```
http://localhost:3001/api/auth/callback/google    (development)
https://your-domain.com/api/auth/callback/google  (production)
```

### `POST /api/auth/signout`
Signs out the user: clears next-auth session cookie, calls `signOut({ callbackUrl: '/' })`.

### `GET /api/auth/session`
Returns the current session as JSON (used by `useSession()` hook).

### `GET /api/auth/csrf`
Returns CSRF token (used internally by next-auth for POST requests).

---

## next-auth Configuration Contract

**File**: `frontend/src/app/api/auth/[...nextauth]/route.ts`

```typescript
{
  providers: [GoogleProvider({ clientId, clientSecret })],
  callbacks: {
    jwt({ token, account }): if (account?.id_token) token.idToken = account.id_token,
    session({ session, token }): session.idToken = token.idToken,
  },
  pages: {
    signIn: '/login',      // Custom login page
    error: '/login',       // Error redirects back to login page
  }
}
```

**Session Strategy**: `jwt` (default for next-auth — stores session in encrypted cookie, no DB required)

---

## Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud Console | `123...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Secret | `GOCSPX-...` |
| `NEXTAUTH_URL` | Canonical URL of the app | `http://localhost:3001` |
| `NEXTAUTH_SECRET` | Random secret for JWT signing + encryption | `openssl rand -base64 32` output |

---

## Session Cookie

next-auth sets an HTTP-only encrypted cookie named `next-auth.session-token`.  
The decrypted session payload contains: `{ user: { name, email, image }, idToken: string, expires: ISO-string }`.

The `idToken` within the cookie is the raw Google ID token — forwarded to backend API calls via `Authorization: Bearer`.
