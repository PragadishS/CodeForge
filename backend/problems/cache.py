from django.core.cache import cache

VERSION_KEY = "problems:list:version"
TTL_SECONDS = 60


def list_cache_key(page: str) -> str:
    version = cache.get(VERSION_KEY) or 1
    return f"problems:list:{version}:page:{page}"


def invalidate_problem_list() -> None:
    current = cache.get(VERSION_KEY)
    if current is None:
        cache.set(VERSION_KEY, 2)
    else:
        cache.incr(VERSION_KEY)