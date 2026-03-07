"""
SiroMix V2 Backend - Main FastAPI Application

MVP Foundation: Google OAuth authentication, task workflow framework,
mock pipeline execution with progress tracking and retry mechanisms.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

from app.core.database import close_db
from app.api.v1.api import api_router


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
    Health check endpoint for monitoring and load balancers.
    """
    return {
        "status": "healthy",
        "service": "siromix-backend",
        "version": APP_VERSION,
    }


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
