# SiroMix V2 - Exam Processing Platform

MVP Foundation for SiroMix V2 exam document processing system.

## 🎯 Current Status

**✅ Phase 1: Setup Complete** (8/8 tasks)
- Monorepo structure created
- Backend Python 3.11+ project initialized (FastAPI, SQLAlchemy, Celery)
- Frontend Next.js 14+ project initialized (TypeScript, Tailwind CSS)
- Docker Compose configuration ready
- Testing frameworks configured
- Linting and formatting configured

**🚧 Phase 2: Foundational** (In Progress - 0/16 tasks)
- Database models (User, Task, TaskLog) - TODO
- Alembic migrations - TODO
- Authentication utilities - TODO
- Pydantic schemas - TODO

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed and running
- Google OAuth credentials (for authentication features)

### 1. Clone & Setup

```bash
# Already done if you're reading this!
cd siromixv2

# Copy environment template
cp .env.example .env

# Edit .env and set at minimum:
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
# - GOOGLE_CLIENT_ID (from Google Cloud Console)
# - GOOGLE_CLIENT_SECRET (from Google Cloud Console)
```

### 2. Start Development Environment

```bash
cd infra
docker compose up --build
```

**Services:**
- 🗄️  PostgreSQL: `localhost:5432`
- 🔴 Redis: `localhost:6379`
- 🐍 Backend API: http://localhost:8000
- 📚 API Docs: http://localhost:8000/docs
- ⚛️  Frontend: http://localhost:3000
- 👷 Worker: Running (placeholder)

### 3. Verify Setup

- **Backend Health**: http://localhost:8000/api/v1/health
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Frontend**: http://localhost:3000 (Shows "Phase 1 Complete" page)

### 4. Stop Services

```bash
# Press Ctrl+C in the terminal, then:
docker compose down
```

## 📁 Project Structure

```
siromixv2/
├── backend/              # FastAPI backend (Python 3.11+)
│   ├── app/              # Application code
│   │   ├── api/          # API routes (empty - Phase 3+)
│   │   ├── core/         # Core utilities (empty - Phase 2)
│   │   ├── models/       # Database models (empty - Phase 2)
│   │   ├── schemas/      # Pydantic schemas (empty - Phase 2)
│   │   ├── services/     # Business logic (empty - Phase 3+)
│   │   ├── tasks/        # Celery tasks (stub - Phase 4)
│   │   └── main.py       # FastAPI app entry point ✅
│   ├── tests/            # Test suite (configured - Phase 3+)
│   │   ├── unit/
│   │   ├── contract/
│   │   └── integration/
│   ├── alembic/          # Database migrations (empty - Phase 2)
│   └── pyproject.toml    # Dependencies ✅
│
├── frontend/             # Next.js 14 frontend (TypeScript)
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   │   ├── layout.tsx    ✅
│   │   │   └── page.tsx      ✅ (placeholder)
│   │   ├── components/   # React components (empty - Phase 6)
│   │   ├── lib/          # Utilities (empty - Phase 3+)
│   │   └── hooks/        # Custom hooks (empty - Phase 5+)
│   ├── tests/            # Test suite (configured - Phase 6)
│   └── package.json      # Dependencies ✅
│
├── infra/                # Infrastructure
│   └── docker-compose.yml     ✅
│
├── specs/                # Feature specifications
│   └── 001-mvp-foundation/
│       ├── spec.md       # Feature specification
│       ├── plan.md       # Implementation plan
│       ├── tasks.md      # Task checklist (100 tasks)
│       ├── data-model.md # Entity definitions
│       ├── contracts/    # API contracts
│       └── quickstart.md # Setup guide
│
├── .specify/             # Speckit workflow metadata
├── .github/              # GitHub Actions, prompts
├── .env.example          # Environment template ✅
├── .gitignore            # Git ignore rules ✅
└── .dockerignore         # Docker ignore rules ✅
```

## 🏗️ Architecture

**Monorepo with:**
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy (async), PostgreSQL
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, NextAuth
- **Task Queue**: Celery + Redis (to be implemented)
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+

**Workflow:**
1. User authenticates via Google OAuth (NextAuth)
2. Frontend sends authenticated requests to Backend
3. Backend verifies Google ID token on each request
4. Task creation enqueues job to Celery
5. Worker processes task through pipeline stages
6. Frontend polls for status updates

## 📝 Implementation Phases

| Phase | Description | Status | Tasks |
|-------|-------------|---------|-------|
| 1 | Setup | ✅ Complete | 8/8 |
| 2 | Foundational | 🚧 Next | 0/16 |
| 3 | User Story 1: OAuth | 📅 Planned | 0/13 |
| 4 | User Story 2: Task Workflow | 📅 Planned | 0/15 |
| 5 | User Story 3: Monitoring/Retry | 📅 Planned | 0/12 |
| 6 | User Story 4: Frontend UI | 📅 Planned | 0/18 |
| 7 | Polish | 📅 Planned | 0/18 |

**Total**: 8/100 tasks complete

## 🧪 Development

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Lint & format
ruff check .
black .

# Type check
mypy app/
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev

# Run tests
npm test

# Lint & format
npm run lint
npm run format

# Type check
npm run type-check
```

## 📚 Documentation

- **Feature Spec**: [specs/001-mvp-foundation/spec.md](specs/001-mvp-foundation/spec.md)
- **Implementation Plan**: [specs/001-mvp-foundation/plan.md](specs/001-mvp-foundation/plan.md)
- **Task List**: [specs/001-mvp-foundation/tasks.md](specs/001-mvp-foundation/tasks.md)
- **Data Model**: [specs/001-mvp-foundation/data-model.md](specs/001-mvp-foundation/data-model.md)
- **API Contracts**: [specs/001-mvp-foundation/contracts/api-v1.md](specs/001-mvp-foundation/contracts/api-v1.md)
- **Quickstart Guide**: [specs/001-mvp-foundation/quickstart.md](specs/001-mvp-foundation/quickstart.md)

## 🔧 Troubleshooting

### Docker Issues

**Port conflicts**:
```bash
# Check what's using port 8000
netstat -ano | findstr :8000

# Change ports in docker-compose.yml if needed
```

**Build failures**:
```bash
# Clean rebuild
docker compose down -v
docker compose build --no-cache
docker compose up
```

### Backend Issues

**Module not found**:
- Make sure you're in the backend directory
- Activate virtual environment
- Run `pip install -e ".[dev]"`

### Frontend Issues

**Dependencies not installed**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 🚀 Next Steps

1. **Continue to Phase 2**: Implement database models, migrations, and auth utilities (16 tasks)
2. **Test Phase 1**: Verify all services start and health checks pass
3. **Review Specifications**: Read through specs/001-mvp-foundation/ to understand the full feature

## 📄 License

Copyright © 2026 SiroMix Team

---

**Last Updated**: February 23, 2026  
**Version**: 0.1.0 (Phase 1 Complete)
