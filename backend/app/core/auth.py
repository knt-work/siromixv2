"""
Authentication utilities using Google OAuth tokens.

Verifies Google ID tokens and extracts user information.
"""

import logging
import os

from google.auth.transport import requests
from google.oauth2 import id_token

logger = logging.getLogger(__name__)


def _get_google_client_id() -> str:
    """Read GOOGLE_CLIENT_ID lazily so load_dotenv() has time to run."""
    return os.getenv("GOOGLE_CLIENT_ID", "")


class GoogleTokenError(Exception):
    """Raised when Google token verification fails."""
    pass


async def verify_google_token(token: str) -> dict[str, str]:
    """
    Verify Google ID token and extract user information.
    
    Args:
        token: Google ID token from frontend
        
    Returns:
        Dict with keys: google_sub, email, display_name
        
    Raises:
        GoogleTokenError: If token is invalid, expired, or verification fails
        
    Example:
        user_info = await verify_google_token(id_token)
        # {'google_sub': '1234...', 'email': 'user@example.com', 'display_name': 'John Doe'}
    """
    client_id = _get_google_client_id()
    if not client_id:
        raise GoogleTokenError("GOOGLE_CLIENT_ID not configured")

    if not token:
        raise GoogleTokenError("Token is required")

    try:
        # Verify the token
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            client_id
        )

        token_aud = idinfo.get('aud')

        # Ensure token is for the correct audience
        if token_aud != client_id:
            raise GoogleTokenError("Invalid token audience")

        # Extract user information
        google_sub = idinfo.get('sub')
        email = idinfo.get('email')
        display_name = idinfo.get('name')
        avatar_url = idinfo.get('picture')  # Google profile photo

        if not google_sub:
            raise GoogleTokenError("Token missing subject (sub) claim")

        if not email:
            raise GoogleTokenError("Token missing email claim")

        return {
            'google_sub': google_sub,
            'email': email,
            'display_name': display_name or email.split('@')[0],
            'avatar_url': avatar_url,
        }

    except ValueError as e:
        # Token is invalid or expired
        raise GoogleTokenError(f"Invalid token: {str(e)}")
    except Exception as e:
        raise GoogleTokenError(f"Token verification failed: {str(e)}")


def extract_bearer_token(authorization: str | None) -> str | None:
    """
    Extract bearer token from Authorization header.
    
    Args:
        authorization: Authorization header value (e.g., "Bearer <token>")
        
    Returns:
        Token string if valid Bearer format, None otherwise
        
    Example:
        token = extract_bearer_token("Bearer eyJhbGci...")
        # Returns: "eyJhbGci..."
    """
    if not authorization:
        return None

    parts = authorization.split()

    if len(parts) != 2:
        return None

    scheme, token = parts

    if scheme.lower() != 'bearer':
        return None

    return token
