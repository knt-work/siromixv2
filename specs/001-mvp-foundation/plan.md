# Implementation Plan: Initialize SiroMix V2 MVP Foundation

**Branch**: `001-mvp-foundation` | **Date**: 2026-02-22 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-mvp-foundation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Initialize SiroMix V2 MVP foundation with monorepo skeleton, Google OAuth authentication, and task-based workflow framework featuring mock pipeline stages (extract_docx → ai_understanding → ai_analysis → shuffle → render_docx). This establishes the architectural foundation and core patterns that all future features will build upon. Technical approach includes Next.js 14+ frontend with NextAuth for OAuth, FastAPI backend with Google token verification, Celery workers for async task processing, PostgreSQL for persistence, and Redis for job queue. The mock pipeline simulates stage processing with progress tracking, structured logging, and retry mechanisms without implementing actual DOCX parsing or AI integration.

## Technical Context

**Language/Version**: Backend: Python 3.11+ | Frontend: TypeScript 5.x (Next.js 14+ with App Router)

**Primary Dependencies**: Backend: FastAPI 0.104+, SQLAlchemy 2.0+, Alembic (migrations), google-auth 2.x (token verification), Celery for workers | Frontend: Next.js 14+, NextAuth.js 4.x, Tailwind CSS 3.x, React 18+ | Shared: Pydantic for schemas

**Storage**: PostgreSQL 15+ (users, tasks, task_logs tables) | Redis 7+ (job queue, optional caching) | Future: S3/MinIO for object storage (planned, not in this feature)

**Testing**: Backend: pytest, pytest-asyncio, httpx (client tests) | Frontend: Vitest, React Testing Library, Playwright (optional E2E)

**Target Platform**: Backend: Linux container (Docker) | Frontend: Node.js container (Docker) | Development: docker-compose on localhost

**Project Type**: Web application (full-stack) with async worker architecture

**Performance Goals**: Task creation: <200ms response time | Task polling: <100ms response time | Mock pipeline: 15-25 seconds total (3-5 seconds per stage) | OAuth flow: <30 seconds end-to-end

**Constraints**: Monorepo structure (not microservices for MVP) | Stateless backend auth (no session storage) | Mock pipeline only (no real DOCX/AI processing) | Single worker instance acceptable for MVP

**Scale/Scope**: MVP: 1-10 concurrent users | 3 database tables (users, tasks, task_logs) | 4 API endpoints (+ 1 optional /me) | 5 mock pipeline stages | 4 frontend views (login, dashboard, task progress, error states)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Principle I (Pipeline-First)**: PASS  
Feature implements 5-stage mock pipeline (extract_docx → ai_understanding → ai_analysis → shuffle → render_docx) with clear stage transitions and status tracking. Foundation for future real pipeline implementation.

✅ **Principle II (AI is a Component, Not the Controller)**: PASS  
No AI in this feature (mock stages only). Architecture prepares for future AI stages without making AI the controller.

✅ **Principle III (Schema-First, Validation-Gated)**: PASS  
Task model with strict status/stage enums. Database schema with constraints. Future: stage output validation (not in MVP mock).

✅ **Principle IV (Non-Text Content is Always Block + Reference)**: N/A for MVP  
No document content processing in this feature. Architecture prepares for future block-based models.

✅ **Principle V (Traceability & Provenance by Design)**: PASS  
TaskLog persists structured logs with stage, level, message, data_json. Timestamps on all state changes. Future: provenance for document blocks.

✅ **Principle VI (Determinism After Normalization)**: N/A for MVP  
No shuffle/variant generation in this feature. Architecture prepares for future deterministic operations.

✅ **Principle VII (Idempotent, Retryable Tasks)**: PASS  
Retry endpoint with controlled retry_count_by_stage. Idempotent design (no side effects on retry of completed/running tasks). Stage isolation for failure handling.

✅ **Principle VIII (Separation of Content vs Rendering)**: N/A for MVP  
No content/template separation needed yet. Architecture prepares for future separation.

✅ **Principle IX (Unit Testing Mandatory)**: PASS  
Tests required for all models, API endpoints, worker logic. Contract tests for API endpoints. Integration tests for auth and task workflow.

**Status**: ✅ **ALL APPLICABLE PRINCIPLES SATISFIED**  
**Complexity Violations**: None

## Project Structure

### Documentation (this feature)

```text
specs/001-mvp-foundation/
├── spec.md              # Feature specification (already created)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api-v1.md        # API contract specifications
├── checklists/
│   └── requirements.md  # Quality validation (already created)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
siromixv2/
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js 14 app router
│   │   │   ├── (auth)/         # Auth route group
│   │   │   │   └── login/
│   │   │   ├── dashboard/
│   │   │   ├── tasks/
│   │   │   │   └── [id]/       # Dynamic task detail
│   │   │   ├── api/
│   │   │   │   └── auth/       # NextAuth routes
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── auth/           # GoogleSignIn, AuthProvider
│   │   │   ├── tasks/          # TaskProgress, TaskLogs, RetryButton
│   │   │   └── ui/             # Shared UI components
│   │   ├── lib/
│   │   │   ├── api-client.ts   # Axios/fetch wrapper with auth
│   │   │   └── types.ts        # TypeScript types
│   │   └── middleware.ts       # Auth middleware
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── next.config.js
│
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── tasks.py    # Task endpoints
│   │   │       ├── users.py    # /me endpoint
│   │   │       └── deps.py     # Dependency injection (auth)
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py         # User model
│   │   │   ├── task.py         # Task model
│   │   │   ├── task_log.py     # TaskLog model
│   │   │   └── enums.py        # Status, Stage, LogLevel enums
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── task.py         # Pydantic schemas
│   │   │   └── user.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # Google token verification
│   │   │   └── task_service.py # Task business logic
│   │   ├── workers/
│   │   │   ├── __init__.py
│   │   │   ├── celery_app.py   # Celery config
│   │   │   ├── tasks.py        # Celery tasks
│   │   │   └── pipeline.py     # Mock pipeline stages
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── session.py      # Database session
│   │   │   └── base.py         # SQLAlchemy base
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py       # Settings/env vars
│   │   │   └── security.py     # Auth helpers
│   │   └── main.py             # FastAPI app
│   ├── alembic/
│   │   ├── versions/
│   │   └── env.py
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── test_models.py
│   │   │   ├── test_auth.py
│   │   │   └── test_pipeline.py
│   │   ├── integration/
│   │   │   ├── test_task_workflow.py
│   │   │   └── test_auth_flow.py
│   │   └── contract/
│   │       └── test_api_endpoints.py
│   ├── requirements.txt
│   ├── pyproject.toml
│   └── alembic.ini
│
├── shared/                      # Optional: shared types/contracts
│   └── api-contracts.json       # OpenAPI spec (optional)
│
├── infra/
│   ├── docker-compose.yml       # Local dev environment
│   ├── docker-compose.prod.yml  # Future: production config
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── worker.Dockerfile
│
├── specs/                       # Feature specifications
│   └── 001-mvp-foundation/      # This feature
│
├── .specify/                    # Speckit framework (already exists)
├── .gitignore
├── README.md
└── LICENSE
```

**Structure Decision**: Full-stack web application with monorepo structure, aligning with constitution's "modular monolith" architecture decision. Backend and frontend are separate directories with independent build/test configurations. Worker runs from backend code (same codebase, different entry point via Celery). Docker Compose orchestrates local development environment with Postgres, Redis, backend API, frontend, and worker services. This structure maintains clear boundaries that enable future service extraction without current microservices overhead.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
