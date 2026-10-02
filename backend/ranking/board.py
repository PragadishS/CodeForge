import os

from django.contrib.auth import get_user_model
import redis

from accounts.models import Profile

GLOBAL_KEY = "leaderboard:global"
TOP_N = 20


def _client():
    return redis.Redis(
        host=os.getenv("REDIS_HOST", "redis"),
        port=int(os.getenv("REDIS_PORT", "6379")),
        db=1,
        decode_responses=True,
    )


def add_points(user_id: int, points: int) -> None:
    if points <= 0:
        return
    _client().zincrby(GLOBAL_KEY, points, str(user_id))


def _rebuild(r) -> None:
    r.delete(GLOBAL_KEY)
    pipe = r.pipeline()
    for profile in Profile.objects.filter(total_score__gt=0).only("user_id", "total_score"):
        pipe.zadd(GLOBAL_KEY, {str(profile.user_id): profile.total_score})
    pipe.execute()


def top_rows(limit: int = TOP_N) -> list[dict]:
    r = _client()
    if r.zcard(GLOBAL_KEY) == 0:
        _rebuild(r)

    raw = r.zrevrange(GLOBAL_KEY, 0, limit - 1, withscores=True)
    user_ids = [int(uid) for uid, _score in raw]
    names = dict(
        get_user_model().objects.filter(pk__in=user_ids).values_list("id", "username")
    )
    return [
        {
            "rank": i,
            "user_id": uid,
            "username": names.get(uid, ""),
            "score": int(score),
        }
        for i, (uid, score) in enumerate(
            ((int(u), s) for u, s in raw),
            start=1,
        )
    ]


def my_row(user_id: int) -> dict:
    r = _client()
    if r.zcard(GLOBAL_KEY) == 0:
        _rebuild(r)

    member = str(user_id)
    raw_rank = r.zrevrank(GLOBAL_KEY, member)
    raw_score = r.zscore(GLOBAL_KEY, member)
    return {
        "user_id": user_id,
        "rank": None if raw_rank is None else raw_rank + 1,
        "score": 0 if raw_score is None else int(raw_score),
    }