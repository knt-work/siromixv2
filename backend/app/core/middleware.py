"""
Middleware for error handling and request/response logging (T083-T084).

Provides:
- Comprehensive exception handling with consistent JSON error responses
- Request/response logging with duration and status code tracking
"""

import logging
import time
from collections.abc import Callable

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    T083: Catches all unhandled exceptions and returns consistent JSON error format.
    
    Handles:
    - SQLAlchemy database errors → 500 with generic message (don't expose DB details)
    - Validation errors → 422 with details
    - Generic exceptions → 500 with sanitized message
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
        except SQLAlchemyError as e:
            # Database errors - don't expose internal details
            logger.error(f"Database error on {request.method} {request.url.path}: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "A database error occurred. Please try again later."}
            )
        except ValueError as e:
            # Validation errors
            logger.warning(f"Validation error on {request.method} {request.url.path}: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={"detail": str(e)}
            )
        except Exception as e:
            # Catch-all for unexpected errors
            logger.exception(f"Unexpected error on {request.method} {request.url.path}: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "An unexpected error occurred. Please try again later."}
            )


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    T084: Logs all API requests with method, path, duration, and status code.
    
    Format: [METHOD] /path - 200 - 45ms
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip logging for health check endpoint to avoid spam
        if request.url.path == "/api/v1/health":
            return await call_next(request)

        start_time = time.time()

        # Log request
        logger.info(f"→ {request.method} {request.url.path}")

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration_ms = int((time.time() - start_time) * 1000)

        # Log response
        logger.info(
            f"← {request.method} {request.url.path} - {response.status_code} - {duration_ms}ms"
        )

        # Add custom header with processing time
        response.headers["X-Process-Time"] = f"{duration_ms}ms"

        return response
