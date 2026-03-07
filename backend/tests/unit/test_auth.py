"""
Unit tests for authentication utilities (T026).

Tests verify_google_token with valid, expired, and invalid tokens.
"""

import pytest
from unittest.mock import patch, MagicMock
from google.auth.exceptions import GoogleAuthError

from app.core.auth import (
    verify_google_token,
    extract_bearer_token,
    GoogleTokenError,
    GOOGLE_CLIENT_ID
)


def test_extract_bearer_token_valid():
    """Test extracting valid bearer token from header."""
    token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test.signature"
    header = f"Bearer {token}"
    
    result = extract_bearer_token(header)
    
    assert result == token


def test_extract_bearer_token_missing():
    """Test extraction with missing header."""
    result = extract_bearer_token(None)
    assert result is None


def test_extract_bearer_token_invalid_format():
    """Test extraction with invalid format (no Bearer prefix)."""
    result = extract_bearer_token("InvalidFormat token123")
    assert result is None


def test_extract_bearer_token_empty():
    """Test extraction with empty bearer string."""
    result = extract_bearer_token("Bearer ")
    assert result is None


@pytest.mark.asyncio
async def test_verify_google_token_valid(monkeypatch):
    """Test verifying a valid Google ID token."""
    # Mock the GOOGLE_CLIENT_ID
    monkeypatch.setattr("app.core.auth.GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com")
    
    mock_token = "valid.test.token"
    mock_payload = {
        "sub": "123456789",
        "email": "test@example.com",
        "name": "Test User",
        "aud": "test-client-id.apps.googleusercontent.com",
        "iss": "https://accounts.google.com",
        "exp": 9999999999  # Far future
    }
    
    with patch("app.core.auth.id_token.verify_oauth2_token") as mock_verify:
        mock_verify.return_value = mock_payload
        
        result = await verify_google_token(mock_token)
        
        assert result["google_sub"] == "123456789"
        assert result["email"] == "test@example.com"
        assert result["display_name"] == "Test User"
        mock_verify.assert_called_once()


@pytest.mark.asyncio
async def test_verify_google_token_expired(monkeypatch):
    """Test verifying an expired token."""
    # Mock the GOOGLE_CLIENT_ID
    monkeypatch.setattr("app.core.auth.GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com")
    
    mock_token = "expired.test.token"
    
    with patch("app.core.auth.id_token.verify_oauth2_token") as mock_verify:
        mock_verify.side_effect = GoogleAuthError("Token expired")
        
        with pytest.raises(GoogleTokenError) as exc_info:
            await verify_google_token(mock_token)
        
        assert "Token expired" in str(exc_info.value)


@pytest.mark.asyncio
async def test_verify_google_token_invalid_signature(monkeypatch):
    """Test verifying a token with invalid signature."""
    # Mock the GOOGLE_CLIENT_ID
    monkeypatch.setattr("app.core.auth.GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com")
    
    mock_token = "invalid.signature.token"
    
    with patch("app.core.auth.id_token.verify_oauth2_token") as mock_verify:
        mock_verify.side_effect = GoogleAuthError("Invalid signature")
        
        with pytest.raises(GoogleTokenError) as exc_info:
            await verify_google_token(mock_token)
        
        assert "Invalid" in str(exc_info.value) or "signature" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_verify_google_token_wrong_audience(monkeypatch):
    """Test verifying a token with wrong audience (different client ID)."""
    # Mock the GOOGLE_CLIENT_ID
    monkeypatch.setattr("app.core.auth.GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com")
    
    mock_token = "wrong.audience.token"
    
    with patch("app.core.auth.id_token.verify_oauth2_token") as mock_verify:
        mock_verify.side_effect = GoogleAuthError("Wrong audience")
        
        with pytest.raises(GoogleTokenError):
            await verify_google_token(mock_token)


@pytest.mark.asyncio
async def test_verify_google_token_malformed(monkeypatch):
    """Test verifying a malformed token."""
    # Mock the GOOGLE_CLIENT_ID
    monkeypatch.setattr("app.core.auth.GOOGLE_CLIENT_ID", "test-client-id.apps.googleusercontent.com")
    
    mock_token = "not-a-valid-jwt"
    
    with patch("app.core.auth.id_token.verify_oauth2_token") as mock_verify:
        mock_verify.side_effect = ValueError("Malformed token")
        
        with pytest.raises(GoogleTokenError):
            await verify_google_token(mock_token)


@pytest.mark.asyncio
async def test_verify_google_token_empty():
    """Test verifying an empty token."""
    with pytest.raises(GoogleTokenError):
        await verify_google_token("")


@pytest.mark.asyncio
async def test_verify_google_token_none():
    """Test verifying None token."""
    with pytest.raises(GoogleTokenError):
        await verify_google_token(None)
