# Feature Specification: Real Google OAuth Login

**Feature Branch**: `005-google-oauth-login`
**Created**: 2026-03-15
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign in with Google (Priority: P1)

A teacher visits the SiroMix login page and clicks "Continue with Google". They are redirected to Google's authentication screen, select their Google account, and are returned to SiroMix fully logged in. The navbar immediately shows their real name and Google profile photo.

**Why this priority**: This is the core feature — without real login, no protected feature (exam creation, task management) can be used with real data.

**Independent Test**: Navigate to `/login`, click the button, complete Google's consent screen, and verify the navbar displays the correct real name and avatar.

**Acceptance Scenarios**:

1. **Given** a user is not logged in, **When** they visit `/login` and click "Tiếp tục với Google", **Then** they are redirected to Google's OAuth consent screen.
2. **Given** a user completes Google authentication, **When** they are redirected back to SiroMix, **Then** they land on the homepage (or the page they originally tried to access) in an authenticated state.
3. **Given** a user is authenticated, **When** they look at the navbar, **Then** they see their real full name and their Google profile photo instead of a placeholder or mock avatar.
4. **Given** a user is already logged in, **When** they navigate to `/login`, **Then** they are automatically redirected away without seeing the login form.

---

### User Story 2 - Authenticated API access (Priority: P1)

After signing in with Google, a teacher creates a new exam. The exam creation request reaches the backend with the real Google ID token in the Authorization header, so the backend can verify identity and associate the exam with the correct user account.

**Why this priority**: Without the real token flowing to the backend, the exam upload API returns 401 and no real data is saved. This unblocks the entire exam creation flow.

**Independent Test**: After login, navigate to Create Exam, fill the form, and submit. The Network tab should show `POST /api/v1/exams` returning 201 with a real `exam_id`.

**Acceptance Scenarios**:

1. **Given** a user is logged in with a real Google account, **When** they submit the exam creation form, **Then** the backend accepts the request (HTTP 201) and returns a real `exam_id` and `task_id`.
2. **Given** a user is logged in, **When** the Google ID token expires mid-session, **Then** the application shows a "Please log in again" message and redirects to `/login`.
3. **Given** an unauthenticated request reaches a protected page, **When** the user authenticates, **Then** they are returned to the original page they were trying to access.

---

### User Story 3 - Sign out (Priority: P2)

A logged-in teacher clicks the logout button in the navbar. They are signed out, all stored credentials are cleared, and they are returned to the homepage in an unauthenticated state.

**Why this priority**: Important for shared-computer scenarios and security, but the system is usable without it.

**Independent Test**: Log in, then click logout. Verify the navbar shows the login button and `localStorage['access_token']` is cleared.

**Acceptance Scenarios**:

1. **Given** a user is logged in, **When** they click logout, **Then** the navbar reverts to showing the login button with no user name or avatar.
2. **Given** a user logs out, **When** they navigate to a protected page, **Then** they are redirected to `/login`.
3. **Given** a user logs out, **When** they check browser storage, **Then** no access token or session data persists.

---

### Edge Cases

- What happens when the user denies Google's permission screen? → Login page shows a user-friendly error; no partial session is created.
- What happens when Google's servers are unavailable? → A modal error dialog is shown on the login page; the error is logged to the browser console (`console.error`); the user remains unauthenticated.
- What happens when a first-time Google user logs in? → A new user record is created automatically; no extra sign-up step is required.
- What happens when the user's Google account email changes? → The system updates the stored email on the next login using the immutable Google `sub` identifier.
- What happens if the Google profile photo is unavailable? → A fallback avatar (initials-based) is shown.
- What happens when a user who had a mock session (`mock-token-*`) opens the app after real OAuth is deployed? → The mock session is cleared on app load and a "Session expired — please log in again" toast is shown; the user is in an unauthenticated state.
- What happens if the backend `GET /api/v1/me` call fails after Google OAuth succeeds? → The Google OAuth session is signed out, a modal error dialog is shown ("Login failed — please try again"), and `console.error` logs the failure details. The user stays unauthenticated.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a "Continue with Google" button on the login page that initiates the real Google OAuth consent flow.
- **FR-002**: After a successful Google OAuth callback, the system MUST retrieve and store the authenticated user's real name, email, and profile photo URL.
- **FR-003**: The navbar MUST display the authenticated user's real full name and Google profile photo when logged in. If the profile photo is unavailable, a circular fallback avatar MUST be shown using the user's initials: first letter of the first word + first letter of the last word of the display name (e.g. "Trieu Kiem" → "TK"; single-word names use the first letter only).
- **FR-004**: The system MUST make the authenticated user's Google ID token available to backend API calls for identity verification.
- **FR-005**: The system MUST automatically create a new user record on first login using Google's immutable subject identifier as the unique key.
- **FR-006**: The system MUST update the user's name and email in the database on each subsequent login to reflect the latest Google profile.
- **FR-007**: The system MUST redirect users to the page they originally requested after a successful login.
- **FR-008**: Protected pages MUST redirect unauthenticated users to the login page.
- **FR-011**: While the next-auth session status is `loading`, protected pages MUST display a full-page spinner overlay and MUST NOT render page content or trigger a redirect prematurely.
- **FR-012**: On app load, if `localStorage` contains a stale mock session (access token starting with `mock-token-`), the system MUST clear it and display a brief "Session expired — please log in again" toast/banner, then show the app in an unauthenticated state.
- **FR-009**: Logging out MUST clear all session data and access tokens from browser storage.
- **FR-010**: If login fails at any step (user denies consent, network error, or backend registration failure), the system MUST display a modal error dialog on the login page with a clear message, keep the user unauthenticated, and log the error details to the browser console (`console.error`).

### Key Entities

- **User**: A person authenticated via Google. Attributes: immutable Google subject ID, email address, display name, profile photo URL, internal application UUID.
- **Session**: The authenticated state held client-side. Contains the Google ID token (used for backend API calls), user profile data, and expiry. Sessions follow Google's token lifetime.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete the full sign-in flow (click login → Google consent → back to app, fully authenticated) in under 60 seconds.
- **SC-002**: After login, the navbar shows the correct real name and Google avatar within the same page render — no separate loading state.
- **SC-003**: 100% of API calls made by an authenticated user include the real Google ID token, enabling backend authentication to succeed without errors.
- **SC-004**: First-time Google users are automatically registered in the system with no additional sign-up step.
- **SC-005**: After logout, no authentication credentials remain accessible in browser storage.

## Non-Functional Quality Attributes

- **Token Storage (MVP)**: The Google ID token is stored in `localStorage['access_token']`. This is a known XSS risk traded off for simplicity; accepted for MVP scope. A future hardening task may migrate to `httpOnly` cookies.

## Assumptions

- The application is registered as a Web application in Google Cloud Console with the correct authorized redirect URIs.
- The backend already has Google token verification implemented (`verify_google_token()`) — this feature wires up the frontend OAuth flow.
- The existing `User` database model with `google_sub` as unique key is already in place (delivered in Feature 003).
- For local development, a `DEV_BYPASS_AUTH` environment flag on the backend allows testing without a real Google Cloud project.

## Clarifications

### Session 2026-03-15

- Q: What should happen if the backend `GET /api/v1/me` call fails after Google OAuth succeeds? → A: Show error in a modal on the login page ("Login failed — please try again"), stay unauthenticated, and log the error to the browser console (console.error).
- Q: Where should the Google ID token be stored on the client? → A: `localStorage['access_token']` — accepted as MVP tradeoff (known XSS risk, simple to implement); migration to `httpOnly` cookies deferred to a future hardening task.
- Q: What should protected pages show while the next-auth session is still resolving (status = `loading`)? → A: A full-page spinner overlay until authentication status is confirmed.
- Q: How should the app handle a stale mock session (`mock-user-1`) left in `localStorage` when real OAuth is deployed? → A: Clear the mock session on app load and show a brief "Session expired — please log in again" banner/toast; the user must re-authenticate with Google.
- Q: How should the fallback avatar initials be generated? → A: First initial of first word + first initial of last word of display name (e.g. "Trieu Kiem" → "TK"). Single-word names use first initial only.