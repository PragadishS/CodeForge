import os

import redis

LIMIT = 10
WINDOW_SECONDS = 60


def _client():
    return redis.Redis(
        host=os.getenv("REDIS_HOST", "redis"),
        port=int(os.getenv("REDIS_PORT", "6379")),
        db=1,
        decode_responses=True,
    )


def allow_submit(user_id: int) -> bool:
    key = f"ratelimit:submit:{user_id}"
    r = _client()
    n = r.incr(key)
    if n == 1:
        r.expire(key, WINDOW_SECONDS)
    return n <= LIMIT