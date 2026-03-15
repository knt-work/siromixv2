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
    return UserResponse.model_validate(current_user)
