# Implementation Plan: Feature 005 — Real Google OAuth Login

**Branch**: `005-google-oauth-login` | **Date**: 2026-03-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-google-oauth-login/spec.md`

## Summary

Replace the simulated Google OAuth login with real Google OAuth using next-auth v4.24.0. The frontend will use next-auth's Google provider to obtain a real Google ID token, which `SessionSync` syncs into the Zustand auth store and `localStorage['access_token']`. The ID token is sent to the existing backend `GET /api/v1/me` endpoint for user registration/retrieval. No backend changes or new DB tables are required.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend) / Python 3.11 (backend)
**Primary Dependencies**: Next.js 14.0.0, next-auth 4.24.0, React 18.2, Zustand, FastAPI, google-auth≥2.0.0
**Storage**: localStorage (`access_token` + `auth-state`), PostgreSQL (user records via existing `users` table)
**Testing**: Vitest 1.x + @testing-library/react 14.x (frontend), pytest (backend — no changes)
**Target Platform**: Web SPA (Next.js 14 App Router), Docker containers
**Project Type**: Web application (full-stack, modular monolith per constitution)
**Performance Goals**: Full login flow < 60 seconds (SC-001); navbar updates same render as redirect (SC-002)
**Constraints**: next-auth v4 (not v5); `localStorage` for token storage (MVP tradeoff, documented); no DB migrations; `DEV_BYPASS_AUTH` pattern for local dev without real Google credentials
**Scale/Scope**: MVP single-tenant; expected < 100 concurrent users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Pipeline-First | ✅ PASS | Auth is a cross-cutting prerequisite, not a pipeline stage — N/A |
| II. AI is a Component | ✅ PASS | No AI used in auth |
| III. Schema-First, Validation-Gated | ✅ PASS | Token verified server-side before any data is returned; User schema unchanged |
| IV. Non-Text Content | ✅ PASS | N/A |
| V. Traceability & Provenance | ✅ PASS | Login events auditable via backend request logs; `google_sub` is immutable identity anchor |
| VI. Determinism After Normalization | ✅ PASS | Token verification is deterministic; session state is deterministic given same Google session |
| VII. Idempotent, Retryable Tasks | ✅ PASS | `GET /api/v1/me` is idempotent (upsert); login/logout are idempotent |
| VIII. Content vs Rendering | ✅ PASS | N/A |
| IX. Unit Testing Mandatory | ✅ PASS | Unit tests required for: initials helper, mock token detection, SessionSync, auth-store mutations, login page interactions |
| Security | ✅ PASS | Backend verifies Google ID token on every protected request; localStorage XSS tradeoff documented |

**Post-Design Re-check**: No violations introduced by data-model or contracts. ✅ All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/005-google-oauth-login/
├── plan.md              ✅ This file
├── research.md          ✅ Phase 0 complete
├── data-model.md        ✅ Phase 1 complete
├── quickstart.md        ✅ Phase 1 complete
├── contracts/
│   ├── api-me.md        ✅ Phase 1 complete
│   └── nextauth-endpoints.md ✅ Phase 1 complete
└── tasks.md             ← Next: /speckit.tasks
```

### Source Code (repository root)

```text
frontend/
├── .env.local                                    ← NEW (env config with placeholders)
└── src/
    ├── app/
    │   ├── api/auth/[...nextauth]/
    │   │   └── route.ts                          ← NEW (next-auth Google provider handler)
    │   ├── providers.tsx                         ← NEW (SessionProvider wrapper)
    │   ├── layout.tsx                            ← MODIFY (wrap children in <Providers>)
    │   └── login/page.tsx                        ← MODIFY (signIn('google') instead of simulateGoogleOAuth)
    ├── components/
    │   ├── auth/
    │   │   └── SessionSync.tsx                   ← NEW (sync next-auth session → Zustand)
    │   └── layout/
    │       ├── AuthGuard.tsx                     ← MODIFY (add next-auth loading check)
    │       └── Navbar.tsx                        ← MODIFY (use Avatar component + real profile)
    ├── lib/state/
    │   └── auth-store.ts                         ← MODIFY (staleMockSession flag + migration)
    └── types/
        └── next-auth.d.ts                        ← MODIFY (remove | null from idToken)

backend/                                          ← NO CHANGES (auth.py + .env already done)

frontend/tests/ (or frontend/src/__tests__/)
    ├── auth-store.test.ts                        ← NEW (unit tests for login/logout/checkAuth/migration)
    ├── SessionSync.test.tsx                      ← NEW (unit tests for session sync logic)
    └── login-page.test.tsx                       ← NEW (unit tests for login page interactions)
```

**Structure Decision**: Web application (frontend + backend). Backend requires no changes beyond what was already applied (`auth.py` DEV_BYPASS_AUTH, `backend/.env`). All implementation is in the frontend.

## Complexity Tracking

No constitution violations. No entries required.
