"""
SiroMix V2 Backend - Main FastAPI Application

MVP Foundation: Google OAuth authentication, task workflow framework,
mock pipeline execution with progress tracking and retry mechanisms.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import subprocess
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

from app.core.database import close_db, AsyncSessionLocal
from app.core.middleware import ErrorHandlingMiddleware, RequestLoggingMiddleware
from app.api.v1.api import api_router
from app.tasks.celery_app import celery_app
from sqlalchemy import text


# Application metadata
APP_VERSION = "0.1.0"
APP_TITLE = "SiroMix V2 API"
APP_DESCRIPTION = """
SiroMix V2 MVP Foundation - Exam Processing Platform

## Features

- 🔐 **Google OAuth Authentication**: Secure user authentication with Google
- 📋 **Task Workflow**: Asynchronous pipeline processing with progress tracking
- 🔄 **Retry Mechanism**: Automatic retry with per-stage retry counters
- 📊 **Monitoring**: Structured logging with task execution logs
- 🚀 **Mock Pipeline**: 5-stage simulation (extract → understanding → analysis → shuffle → render)

## API Versioning (T086)

**Current Version:** v1 (prefix: `/api/v1`)

The API uses URL-based versioning to ensure backward compatibility.
All endpoints are prefixed with `/api/v1/`.

**Version Policy:**
- Breaking changes require a new version (v2, v3, etc.)
- Non-breaking changes and bug fixes stay in current version
- Deprecated versions will be supported for at least 6 months
- Version deprecation will be announced via API headers and documentation

## Authentication

All protected endpoints require a Google ID token in the Authorization header:
```
Authorization: Bearer <google_id_token>
```

Get your token after signing in with Google on the frontend.
"""


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Handles startup and shutdown events.
    """
    # Startup
    print("[*] Starting SiroMix V2 API...")
    
    # Run database migrations automatically (T095: Quickstart validation)
    try:
        print("[*] Running database migrations...")
        alembic_ini = Path(__file__).parent.parent / "alembic.ini"
        result = subprocess.run(
            ["alembic", "-c", str(alembic_ini), "upgrade", "head"],
            cwd=Path(__file__).parent.parent,
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0:
            print("[+] Database migrations completed successfully")
        else:
            print(f"[!] Migration warning: {result.stderr}")
    except Exception as e:
        print(f"[!] Could not run migrations automatically: {e}")
        print("[!] Run manually: alembic upgrade head")
    
    print("[+] Database models loaded")
    print("[+] Phase 2: Foundational infrastructure ready")
    print("[+] Phase 3: OAuth authentication endpoints active")
    
    yield
    
    # Shutdown
    print("[*] Shutting down SiroMix V2 API...")
    await close_db()
    print("[+] Database connections closed")


# Create FastAPI app
app = FastAPI(
    title=APP_TITLE,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# Configure CORS - Load from environment
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS]  # Remove any whitespace

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,  # Explicit list of allowed origins
    allow_credentials=True,  # Allow cookies and Authorization headers
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# T083: Error handling middleware - Catches unhandled exceptions
app.add_middleware(ErrorHandlingMiddleware)

# T084: Request logging middleware - Logs all API requests with timing
app.add_middleware(RequestLoggingMiddleware)


@app.get("/", tags=["Root"])
async def root():
    """
    API root endpoint - health check and version info.
    """
    return {
        "service": "SiroMix V2 API",
        "version": APP_VERSION,
        "status": "operational - Phase 3: User Story 1 (OAuth)",
        "phase": "Phase 2: Foundational Complete",
        "docs": "/docs",
    }


@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """
    T090: Enhanced health check endpoint for monitoring and load balancers.
    
    Checks:
    - Database connectivity (async SQLAlchemy)
    - Redis connectivity (Celery broker)
    - Overall service status
    
    Returns:
        200 if all systems healthy
        503 if any critical system is down
    """
    from fastapi import status as http_status
    from fastapi.responses import JSONResponse
    
    health_status = {
        "status": "healthy",
        "service": "siromix-backend",
        "version": APP_VERSION,
        "checks": {
            "database": "unknown",
            "redis": "unknown",
        }
    }
    
    # Check database connectivity
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        health_status["checks"]["database"] = "ok"
    except Exception as e:
        health_status["checks"]["database"] = f"error: {str(e)[:50]}"
        health_status["status"] = "unhealthy"
    
    # Check Redis connectivity via Celery
    try:
        # Celery inspect with timeout to avoid hanging
        inspect = celery_app.control.inspect(timeout=1.0)
        stats = inspect.stats()
        if stats:
            health_status["checks"]["redis"] = "ok"
        else:
            # No workers, but broker is reachable
            health_status["checks"]["redis"] = "ok (no workers)"
    except Exception as e:
        health_status["checks"]["redis"] = f"error: {str(e)[:50]}"
        health_status["status"] = "unhealthy"
    
    # Return 503 if unhealthy
    if health_status["status"] == "unhealthy":
        return JSONResponse(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            content=health_status
        )
    
    return health_status


# Include API v1 routes
app.include_router(api_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
