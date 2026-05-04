import time
from fastapi import HTTPException, Request, status
import redis.asyncio as redis
from app.core.config import settings

# Initialize Redis client for rate limiting
# We use the same URL as Celery but a different DB index (e.g., DB 1) if possible, 
# or just the same one with a prefix.
redis_url = settings.CELERY_BROKER_URL or "redis://localhost:6379/0"
redis_client = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)

class RateLimiter:
    def __init__(self, requests: int, window: int):
        self.requests = requests
        self.window = window

    async def __call__(self, request: Request):
        # Use client IP as the identifier
        # For production behind proxy, check X-Forwarded-For
        client_ip = request.client.host
        key = f"rate_limit:{request.url.path}:{client_ip}"

        try:
            # Increment the counter
            current = await redis_client.get(key)
            
            if current and int(current) >= self.requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later.",
                )
            
            # Use pipeline for atomicity
            async with redis_client.pipeline() as pipe:
                await pipe.incr(key)
                if not current:
                    await pipe.expire(key, self.window)
                await pipe.execute()
                
        except redis.RedisError as e:
            # Fallback: if Redis is down, allow the request but log the error
            print(f"⚠️ Rate limiter Redis error: {e}")
            return
