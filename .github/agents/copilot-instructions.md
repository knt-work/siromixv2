# siromixv2 Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-22

## Active Technologies
- TypeScript 5.x with Next.js 14+ (App Router), React 18+ + Next.js 14+, React 18+, TypeScript 5.x, Tailwind CSS 3.x (or alternative CSS-in-JS), state management library (Zustand/Redux/React Context), React Hook Form for forms, date-fns for timestamps (002-ui-mock-mvp)
- Frontend-only: localStorage/sessionStorage for state persistence (authentication state, task list), no backend database in this phase (002-ui-mock-mvp)
- TypeScript 5.x with Next.js 14+ (App Router), React 18+ + Next.js (framework), React (UI), @iconify/react (icons from Visily), Tailwind CSS (styling utility per Visily exports), Zustand or React Context (state management for mock data/auth) (002-ui-mock-mvp)
- localStorage for task persistence, sessionStorage for auth state (no backend/database) (002-ui-mock-mvp)
- Python 3.11+ + SQLAlchemy 2.0+ (asyncio), Alembic 1.12+, Pydantic 2.0+, asyncpg 0.29+ (003-exams-artifacts-model)
- PostgreSQL 15 with asyncpg driver (003-exams-artifacts-model)

- Backend: Python 3.11+ | Frontend: TypeScript 5.x (Next.js 14+ with App Router) + Backend: FastAPI 0.104+, SQLAlchemy 2.0+, Alembic (migrations), google-auth 2.x (token verification), Celery for workers | Frontend: Next.js 14+, NextAuth.js 4.x, Tailwind CSS 3.x, React 18+ | Shared: Pydantic for schemas (001-mvp-foundation)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

cd src; pytest; ruff check .

## Code Style

Backend: Python 3.11+ | Frontend: TypeScript 5.x (Next.js 14+ with App Router): Follow standard conventions

## Recent Changes
- 003-exams-artifacts-model: Added Python 3.11+ + SQLAlchemy 2.0+ (asyncio), Alembic 1.12+, Pydantic 2.0+, asyncpg 0.29+
- 002-ui-mock-mvp: Added TypeScript 5.x with Next.js 14+ (App Router), React 18+ + Next.js (framework), React (UI), @iconify/react (icons from Visily), Tailwind CSS (styling utility per Visily exports), Zustand or React Context (state management for mock data/auth)
- 002-ui-mock-mvp: Added TypeScript 5.x with Next.js 14+ (App Router), React 18+ + Next.js 14+, React 18+, TypeScript 5.x, Tailwind CSS 3.x (or alternative CSS-in-JS), state management library (Zustand/Redux/React Context), React Hook Form for forms, date-fns for timestamps


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
