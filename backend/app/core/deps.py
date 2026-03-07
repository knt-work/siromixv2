"""
FastAPI dependencies for request handling.

Provides dependency injection for authentication, database sessions, etc.
"""

from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging

from app.core.database import get_db
from app.core.auth import verify_google_token, extract_bearer_token, GoogleTokenError
from app.models.user import User
from app.services.user_service import get_or_create_user


logger = logging.getLogger(__name__)


async def get_current_user(
    authorization: Optional[str] = Header(None),
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
    logger.debug(f"Authorization header: {authorization}")
    
    # Extract token from header
    token = extract_bearer_token(authorization)
    
    logger.debug(f"Extracted token: {token[:50] if token else None}...")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify Google token
    try:
        user_info = await verify_google_token(token)
        logger.debug(f"User info: {user_info}")
    except GoogleTokenError as e:
        logger.debug(f"Token verification failed: {str(e)}")
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
    
    return user


async def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
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
