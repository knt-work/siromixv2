"""
API v1 router configuration.

Aggregates all v1 endpoints under /api/v1 prefix.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import me


# Create main v1 router
api_router = APIRouter()

# Include endpoint routers
api_router.include_router(me.router, tags=["auth"])

# Future endpoints to include:
# api_router.include_router(tasks.router, tags=["tasks"])
