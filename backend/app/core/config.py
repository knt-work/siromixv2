"""
Application configuration settings.

Centralizes environment variable access and configuration management.
"""

import os
from typing import Optional


class StorageConfig:
    """Storage configuration for S3-compatible object storage."""
    
    BUCKET_NAME: str = os.getenv("STORAGE_BUCKET_NAME", "siromix-exams")
    ENDPOINT_URL: Optional[str] = os.getenv("STORAGE_ENDPOINT_URL")
    ACCESS_KEY_ID: Optional[str] = os.getenv("STORAGE_ACCESS_KEY_ID")
    SECRET_ACCESS_KEY: Optional[str] = os.getenv("STORAGE_SECRET_ACCESS_KEY")
    REGION: str = os.getenv("STORAGE_REGION", "us-east-1")
    
    @classmethod
    def is_configured(cls) -> bool:
        """Check if storage is properly configured."""
        return bool(
            cls.BUCKET_NAME 
            and cls.ACCESS_KEY_ID 
            and cls.SECRET_ACCESS_KEY
        )


class DatabaseConfig:
    """Database configuration."""
    
    URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://siromix:siromix_dev_password@localhost:5432/siromix_v2"
    )
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"


class RedisConfig:
    """Redis configuration for Celery and caching."""
    
    URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")


class AuthConfig:
    """Authentication configuration."""
    
    GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID")
    NEXTAUTH_SECRET: Optional[str] = os.getenv("NEXTAUTH_SECRET")
    
    @classmethod
    def is_configured(cls) -> bool:
        """Check if authentication is properly configured."""
        return bool(cls.GOOGLE_CLIENT_ID)


class Settings:
    """Application settings."""
    
    storage = StorageConfig
    database = DatabaseConfig
    redis = RedisConfig
    auth = AuthConfig
    
    # Application metadata
    APP_NAME: str = "SiroMix V2"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"


# Global settings instance
settings = Settings()
