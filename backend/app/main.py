"""
SiroMix V2 Backend - Main FastAPI Application

This is the entry point for the FastAPI application.
Phase 1: Basic app structure (minimal, will be expanded in Phase 2+)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI app
app = FastAPI(
    title="SiroMix V2 API",
    description="SiroMix V2 MVP Foundation - Exam Processing Platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint - health check."""
    return {
        "service": "SiroMix V2 API",
        "version": "0.1.0",
        "status": "running",
        "message": "Phase 1 Setup Complete - Phase 2 Foundational in progress",
    }


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "siromix-backend",
        "version": "0.1.0",
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
