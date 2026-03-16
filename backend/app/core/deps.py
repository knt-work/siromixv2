"""
FastAPI dependencies for request handling.

Provides dependency injection for authentication, database sessions, etc.
"""

import logging
import os

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import GoogleTokenError, extract_bearer_token, verify_google_token
from app.core.database import get_db
from app.core.storage import StorageClient
from app.models.user import User
from app.services.user_service import get_or_create_user

logger = logging.getLogger(__name__)


def _is_dev_bypass_enabled() -> bool:
    """Check if DEV_BYPASS_AUTH is enabled for local development."""
    return os.getenv("DEV_BYPASS_AUTH", "").lower() == "true"


def _parse_mock_token(token: str) -> dict[str, str] | None:
    """
    Parse mock-token-* format for local dev bypass.

    Format: mock-token-{email} or mock-token-{identifier}
    Returns user info dict if valid mock token, None otherwise.
    """
    if not token.startswith("mock-token-"):
        return None
    identifier = token[len("mock-token-"):]
    if not identifier:
        return None
    email = identifier if "@" in identifier else f"{identifier}@dev.example.com"
    return {
        "google_sub": f"dev-{identifier}",
        "email": email,
        "display_name": identifier.split("@")[0] if "@" in identifier else identifier,
    }


async def get_current_user(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency to get authenticated user from request.
    
    Verifies Google ID token from Authorization header and returns User model.
    Creates user record on first login if not exists.
    
    Args:
        authorization: Authorization header with Bearer token
        db: Database session
        
    Returns:
        User: Authenticated user model
        
    Raises:
        HTTPException: 401 if token is missing, invalid, or verification fails
        
    Usage:
        @app.get("/protected")
        async def protected_route(user: User = Depends(get_current_user)):
            return {"user_id": user.user_id}
    """
    # Extract token from header
    token = extract_bearer_token(authorization)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # DEV_BYPASS_AUTH: allow mock-token-* in local dev
    if _is_dev_bypass_enabled() and token.startswith("mock-token-"):
        user_info = _parse_mock_token(token)
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid mock token format. Use: mock-token-{email-or-id}",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        # Verify real Google token
        try:
            user_info = await verify_google_token(token)
        except GoogleTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # Get or create user
    user = await get_or_create_user(
        db=db,
        google_sub=user_info['google_sub'],
        email=user_info['email'],
        display_name=user_info.get('display_name'),
    )

    # Add transient fields from Google token (not stored in DB)
    user.avatar_url = user_info.get('avatar_url')  # type: ignore
    user.role = 'professor'  # type: ignore  # Fixed for MVP

    return user


async def get_current_user_optional(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """
    Optional authentication dependency.
    
    Returns User if valid token provided, None otherwise.
    Does not raise exceptions for missing/invalid tokens.
    
    Args:
        authorization: Authorization header with Bearer token
        db: Database session
        
    Returns:
        User if authenticated, None otherwise
        
    Usage:
        @app.get("/optional-auth")
        async def optional_route(user: Optional[User] = Depends(get_current_user_optional)):
            if user:
                return {"authenticated": True, "user_id": user.user_id}
            return {"authenticated": False}
    """
    try:
        return await get_current_user(authorization, db)
    except HTTPException:
        return None


def get_storage_client() -> StorageClient:
    """
    FastAPI dependency to get object storage client.
    
    Returns a configured StorageClient instance for S3-compatible storage operations.
    
    Returns:
        StorageClient: Configured storage client instance
        
    Usage:
        @app.post("/upload")
        async def upload_file(
            file: UploadFile,
            storage: StorageClient = Depends(get_storage_client)
        ):
            await storage.upload_file(file.file, "path/to/file.docx")
            return {"status": "uploaded"}
    """
    return StorageClient()
