"""
API v1 router configuration.

Aggregates all v1 endpoints under /api/v1 prefix.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import exams, me, tasks

# Create main v1 router
api_router = APIRouter()

# Include endpoint routers
api_router.include_router(me.router, tags=["auth"])
api_router.include_router(tasks.router, tags=["tasks"])
api_router.include_router(exams.router, tags=["exams"])
