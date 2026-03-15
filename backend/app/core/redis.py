"""
Redis connection setup for caching and Celery broker.
"""

import os
from collections.abc import AsyncGenerator

import redis.asyncio as redis

# Redis URL from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


# Redis client pool
_redis_pool: redis.ConnectionPool | None = None


async def get_redis_pool() -> redis.ConnectionPool:
    """
    Get or create Redis connection pool.
    
    Returns:
        redis.ConnectionPool: Async Redis connection pool
    """
    global _redis_pool

    if _redis_pool is None:
        _redis_pool = redis.ConnectionPool.from_url(
            REDIS_URL,
            decode_responses=True,
            max_connections=10,
        )

    return _redis_pool


async def get_redis() -> AsyncGenerator[redis.Redis, None]:
    """
    Get Redis client for dependency injection.
    
    Usage:
        @app.get("/cached")
        async def cached_route(redis_client: redis.Redis = Depends(get_redis)):
            await redis_client.set("key", "value")
            value = await redis_client.get("key")
            return {"value": value}
    
    Yields:
        redis.Redis: Async Redis client
    """
    pool = await get_redis_pool()
    client = redis.Redis(connection_pool=pool)

    try:
        yield client
    finally:
        await client.aclose()


async def close_redis() -> None:
    """Close Redis connection pool on shutdown."""
    global _redis_pool

    if _redis_pool is not None:
        await _redis_pool.aclose()
        _redis_pool = None
