# Tasks: Feature 005 — Real Google OAuth Login

**Feature**: 005 — Real Google OAuth Login  
**Branch**: `005-google-oauth-login`  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)  
**Generated**: 2026-03-15

**Input**: plan.md (tech stack, file structure), spec.md (3 user stories: US1 Sign in P1, US2 Authenticated API P1, US3 Sign out P2), data-model.md (User entity, auth-store state), contracts/ (api-me.md, nextauth-endpoints.md), research.md (7 architectural decisions), quickstart.md (manual test scenarios)

**Tests**: MANDATORY per Constitution Principle IX — included for all user stories.

**Total tasks**: 20 | **By story**: US1: 7, US2: 2, US3: 2 | **Parallel opportunities**: 9

---

## Phase 1: Setup

**Purpose**: Environment configuration — prerequisite for all next-auth integration.

- [X] T001 Create frontend/.env.local with GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_URL (http://localhost:3001), NEXTAUTH_SECRET (random 32 chars), NEXT_PUBLIC_API_URL per quickstart.md step 2

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: next-auth core infrastructure that MUST be complete before any user story can be implemented and tested.

⚠️ CRITICAL: All user story work is blocked until this phase is complete.

- [X] T002 [P] Update idToken type augmentation to remove `| null` (change to `idToken?: string`) in both Session and JWT interfaces in frontend/src/types/next-auth.d.ts
- [X] T003 Create next-auth Google provider route handler with authOptions (GoogleProvider, jwt callback stores account.id_token → token.idToken, session callback exposes session.idToken, pages.signIn='/login'), export { handler as GET, handler as POST } in frontend/src/app/api/auth/[...nextauth]/route.ts
- [X] T004 Create Providers client component wrapping SessionProvider from next-auth/react and rendering <SessionSync /> in frontend/src/app/providers.tsx
- [X] T005 Update root layout to import <Providers> and wrap body children in <Providers> component in frontend/src/app/layout.tsx
- [X] T006 [P] Add staleMockSession: boolean field (default false, not persisted) and clearStaleMockFlag() action to AuthState interface and Zustand store in frontend/src/lib/state/auth-store.ts

**Checkpoint**: next-auth infrastructure ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Sign in with Google (Priority: P1) 🎯 MVP

**Goal**: A teacher clicks "Tiếp tục với Google", completes Google's consent screen, and sees their real full name and Google profile photo in the navbar. Stale mock sessions are automatically cleared.

**Independent Test**: Navigate to `/login`, click the Google button, complete Google's consent screen. Verify: (1) navbar shows real Google name and avatar, (2) `localStorage['access_token']` contains a real JWT (not `mock-token-*`), (3) refreshing the page with a `mock-token-*` in localStorage shows the "Session expired" toast.

### Tests for User Story 1 ✅ (write FIRST — must FAIL before implementation)

- [X] T007 [P] [US1] Write unit tests for auth-store: login() writes access_token, logout() clears it, checkAuth() detects mock-token-* and sets staleMockSession=true, clearStaleMockFlag() resets it in frontend/tests/unit/auth-store.test.ts
- [X] T008 [P] [US1] Write unit tests for login page: renders Google button, button calls signIn('google'), OAuth error shows error modal with console.error in frontend/tests/unit/login-page.test.tsx

### Implementation for User Story 1

- [X] T009 [US1] Update checkAuth() to detect mock-token-* prefix in localStorage['access_token'], call logout(), and set staleMockSession=true in frontend/src/lib/state/auth-store.ts
- [X] T010 [US1] Create SessionSync component: useSession() → on authenticated: call GET /api/v1/me with Bearer token → authStore.login(user, idToken); on /api/v1/me failure: signOut() + show error modal + console.error; if staleMockSession: show "Session expired — please log in again" toast + clearStaleMockFlag() in frontend/src/components/auth/SessionSync.tsx
- [X] T011 [US1] Update login page handleGoogleLogin to call signIn('google', { callbackUrl: redirectPath || '/' }) instead of simulateGoogleOAuth; add error modal state for OAuth errors; combine loading = isLoading || status === 'loading' in frontend/src/app/login/page.tsx
- [X] T012 [P] [US1] Update Navbar avatar to use <Avatar src={user.avatar_url} alt={user.full_name} size="md" /> from frontend/src/components/ui/Avatar.tsx instead of bare <img> tag in frontend/src/components/layout/Navbar.tsx
- [X] T013 [P] [US1] Update AuthGuard to import useSession from next-auth/react and show full-page spinner when status === 'loading', preventing premature redirect before session resolves in frontend/src/components/layout/AuthGuard.tsx

**Checkpoint**: US1 complete — Google sign-in flow works, navbar shows real profile, stale sessions migrate cleanly.

---

## Phase 4: User Story 2 — Authenticated API Access (Priority: P1) 🎯 MVP

**Goal**: After signing in, `POST /api/v1/exams` succeeds with HTTP 201 because the real Google ID token stored in `localStorage['access_token']` is sent as the Authorization Bearer header.

**Independent Test**: Complete US1 sign-in. Navigate to Create Exam, fill the form, submit. Network tab shows `POST /api/v1/exams` → HTTP 201 with real `exam_id` and `task_id`.

### Tests for User Story 2 ✅ (write FIRST — must FAIL before implementation)

- [ ] T014 [P] [US2] Write unit tests for SessionSync: authenticated session with idToken calls /api/v1/me with Bearer header, successful response calls authStore.login(), /api/v1/me failure calls signOut() and shows modal in frontend/tests/unit/SessionSync.test.tsx

### Implementation for User Story 2

- [ ] T015 [US2] Verify exams API client reads localStorage['access_token'] and sends it as Authorization: Bearer header in all requests; add the header if missing in frontend/src/lib/api/exams.ts

**Checkpoint**: US2 complete — real Google ID token flows to all backend API calls, user is registered in DB on first login.

---

## Phase 5: User Story 3 — Sign out (Priority: P2)

**Goal**: A logged-in teacher clicks logout, next-auth session is cleared, `localStorage['access_token']` is removed, and they are redirected to the homepage unauthenticated.

**Independent Test**: Log in with Google. Click the user avatar dropdown → Đăng xuất. Verify: (1) navbar shows login button, (2) `localStorage['access_token']` is gone, (3) navigating to `/exams` redirects to `/login`.

### Tests for User Story 3 ✅ (write FIRST — must FAIL before implementation)

- [ ] T016 [P] [US3] Write unit tests for logout flow: auth-store logout() removes access_token from localStorage, sets isAuthenticated=false, clears user in frontend/tests/unit/auth-store.test.ts

### Implementation for User Story 3

- [ ] T017 [US3] Update root layout handleLogout to call next-auth signOut({ callbackUrl: '/' }) instead of only calling logout() + router.push('/') in frontend/src/app/layout.tsx

**Checkpoint**: All 3 user stories complete — full authentication lifecycle works end-to-end.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and configuration improvements across all stories.

- [ ] T018 [P] Add remotePatterns config for lh3.googleusercontent.com to enable next/image for Google avatar URLs (future-proofing) in frontend/next.config.js
- [ ] T019 Run Vitest test suite (`cd frontend && npm run test`) and verify all new unit tests (T007, T008, T014, T016) pass with no regressions
- [ ] T020 Validate full end-to-end login flow manually per quickstart.md steps 5–8: sign-in, navbar profile, logout, mock migration toast, error handling modal

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Requires T001 (.env.local) for next-auth to function — BLOCKS all user stories
- **US1 (Phase 3)**: Requires all of Phase 2 (T002–T006) to be complete
- **US2 (Phase 4)**: Requires US1 complete (T010 creates SessionSync that T015 extends)
- **US3 (Phase 5)**: Requires US1 + Phase 2 complete (T005 layout wrapping, T004 Providers)
- **Polish (Phase 6)**: Requires all user story phases complete

### User Story Dependencies

- **US1 (P1)**: Independent after Foundational — no dependency on US2 or US3
- **US2 (P1)**: Depends on US1 (SessionSync exists from T010, token in localStorage from T009)
- **US3 (P2)**: Depends on US1 (Providers/layout from T004/T005, logout path from auth-store)

### Within Each User Story

- Tests (T007, T008, T014, T016) written FIRST — must FAIL before implementation begins
- auth-store state (T006) must be done before auth-store logic (T009)
- Providers (T004) before layout wrapping (T005) before SessionSync render (T010)
- SessionSync (T010) before login page (T011) — session context required
- Navbar (T012) and AuthGuard (T013) are independent — parallel within US1

---

## Parallel Execution Examples

### Phase 2: Foundational

```
# Launch together (no inter-dependencies):
T002: Update next-auth.d.ts type augmentation
T006: Add staleMockSession to auth-store

# Then (T003 before T004, T004 before T005):
T003: Create [...nextauth]/route.ts
T004: Create providers.tsx
T005: Update layout.tsx
```

### Phase 3: User Story 1

```
# Launch both test tasks together:
T007: auth-store unit tests
T008: login-page unit tests

# Then implementation (T006 must be done):
T009: Update checkAuth() mock migration   ← depends on T006
T010: Create SessionSync.tsx              ← depends on T004, T009
T011: Update login page                   ← depends on T003 (signIn)

# Launch together (independent files, no order dependency):
T012: Update Navbar Avatar component
T013: Update AuthGuard loading state
```

### Phase 4: User Story 2

```
# T014 test can be written while US1 code is in review:
T014: SessionSync unit tests

# After T014:
T015: Verify exams.ts Authorization header
```

---

## Implementation Strategy

### MVP Scope (US1 + US2 — both P1)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T006)
3. Complete Phase 3: US1 Sign in (T007–T013)
4. **VALIDATE**: Manual test per quickstart.md steps 5–6 — real name in navbar ✓
5. Complete Phase 4: US2 API access (T014–T015)
6. **VALIDATE**: Manual test — `POST /api/v1/exams` returns HTTP 201 ✓
7. Complete Phase 5: US3 Sign out (T016–T017)
8. Complete Phase 6: Polish (T018–T020)

**Minimal Shippable Increment**: Steps 1–6 (US1 + US2) — teachers can sign in with real Google credentials and submit exam creation requests to the backend.
