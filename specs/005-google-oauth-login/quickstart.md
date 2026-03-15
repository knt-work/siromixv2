# Quickstart: Feature 005 — Real Google OAuth Login

**Branch**: `005-google-oauth-login`

---

## Prerequisites

- Docker + Docker Compose running (backend, PostgreSQL, MinIO, Redis)
- Node.js 18+ with `npm`
- A Google Cloud account

---

## Step 1 — Google Cloud Console Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `SiroMix Development`
5. Authorized redirect URIs — add:
   ```
   http://localhost:3001/api/auth/callback/google
   ```
6. Click **Create** → Copy the **Client ID** and **Client Secret**

7. Go to **OAuth consent screen**:
   - Add your test email under **Test users**
   - This is required while the app is in "Testing" mode

---

## Step 2 — Configure Frontend Environment

Create `frontend/.env.local` (copy from the template below):

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Must match the port your Next.js dev server runs on
NEXTAUTH_URL=http://localhost:3001

# Generate with: openssl rand -base64 32  (or any random 32+ char string)
NEXTAUTH_SECRET=replace-with-random-secret

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Step 3 — Verify Backend Configuration

`backend/.env` should already contain:

```env
DEV_BYPASS_AUTH=true   # Allows mock-token-* bypass in local dev
```

> **Note**: With real Google tokens, `DEV_BYPASS_AUTH` is not needed for authentication to work — real tokens pass through `verify_google_token()`. Keep it `true` for testing with mock tokens alongside real tokens.

---

## Step 4 — Start Services

```bash
# Terminal 1: Start backend services
cd infra
docker-compose up -d

# Terminal 2: Start backend API
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 3: Start frontend
cd frontend
npm run dev -- --port 3001
```

---

## Step 5 — Test the Login Flow

1. Navigate to `http://localhost:3001/login`
2. Click **"Tiếp tục với Google"**
3. Complete Google's consent screen (use your test user email)
4. You should be redirected to `/` (homepage)
5. Verify in the browser:
   - Navbar shows your real Google name and profile photo
   - `localStorage['access_token']` contains a real JWT (not `mock-token-*`)
   - Network tab: `GET /api/v1/me` returned 200

---

## Step 6 — Test Logout

1. Click your avatar in the navbar → **Đăng xuất**
2. Verify:
   - Navbar shows the login button
   - `localStorage['access_token']` is cleared
   - Navigating to `/exams` redirects to `/login`

---

## Step 7 — Test Mock Session Migration (FR-012)

To test the stale session migration toast:

1. Open DevTools → Application → Local Storage
2. Manually set `access_token` to `mock-token-test`
3. Refresh the page
4. You should see the "Session expired — please log in again" toast
5. The mock token should be cleared

---

## Step 8 — Test Error Handling (FR-010)

To test the backend failure modal:

1. Stop the backend: `Ctrl+C` in the uvicorn terminal
2. Complete the Google OAuth flow
3. When `SessionSync` tries to call `GET /api/v1/me`, it should fail
4. Verify:
   - A modal appears: "Login failed — please try again"
   - Browser console shows `console.error` with failure details
   - You remain unauthenticated (no name in navbar)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `redirect_uri_mismatch` from Google | Ensure redirect URI in Google Console matches exactly: `http://localhost:3001/api/auth/callback/google` |
| `NEXTAUTH_SECRET` error | Set any non-empty string in `.env.local` |
| Backend returns 401 | Token may not be flowing. Check `Authorization: Bearer` header in Network tab |
| Login loop (redirect → login → redirect) | Check `NEXTAUTH_URL` matches the actual port used |
| Mock token bypass not working | Ensure `DEV_BYPASS_AUTH=true` in `backend/.env` and uvicorn was restarted |
