"""
User service: Business logic for user management.
"""


from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


async def get_or_create_user(
    db: AsyncSession,
    google_sub: str,
    email: str,
    display_name: str | None = None,
) -> User:
    """
    Get existing user by google_sub or create new user.
    
    Args:
        db: Database session
        google_sub: Google subject identifier (unique, immutable)
        email: User's email address
        display_name: User's display name (optional)
        
    Returns:
        User: Existing or newly created user
        
    Note:
        Email and display_name are updated on every call to reflect
        latest values from Google profile.
    """
    # Try to find existing user
    result = await db.execute(
        select(User).where(User.google_sub == google_sub)
    )
    user = result.scalar_one_or_none()

    if user:
        # Update email and display name (may have changed in Google account)
        user.email = email
        if display_name:
            user.display_name = display_name
        await db.commit()
        await db.refresh(user)
        return user

    # Create new user
    user = User(
        google_sub=google_sub,
        email=email,
        display_name=display_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


async def get_user_by_id(
    db: AsyncSession,
    user_id: str,
) -> User | None:
    """
    Get user by user_id.
    
    Args:
        db: Database session
        user_id: UUID of user
        
    Returns:
        User if found, None otherwise
    """
    result = await db.execute(
        select(User).where(User.user_id == user_id)
    )
    return result.scalar_one_or_none()
