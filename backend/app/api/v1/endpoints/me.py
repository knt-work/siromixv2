"""
/me endpoint: Get current authenticated user.
"""

from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """
    Get current authenticated user's profile.
    
    Returns user information extracted from Google ID token.
    Creates user record on first login if not exists.
    
    Args:
        current_user: Authenticated user from token verification
        
    Returns:
        UserResponse: User profile data
        
    Raises:
        401: If token is missing, invalid, or expired
    """
    # Map User model to UserResponse (display_name → full_name)
    return UserResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        full_name=current_user.display_name or current_user.email.split('@')[0],
        avatar_url=getattr(current_user, 'avatar_url', None),
        role=getattr(current_user, 'role', 'professor'),
        created_at=current_user.created_at,
    )
