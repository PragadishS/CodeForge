import logging

from django.core.cache import cache
from rest_framework import generics, permissions
from rest_framework.response import Response

from ranking.models import UserProblemScore

from .cache import TTL_SECONDS, list_cache_key
from .models import Problem
from .serializers import ProblemDetailSerializer, ProblemListSerializer

logger = logging.getLogger("problems")


class ProblemListView(generics.ListAPIView):
    serializer_class = ProblemListSerializer
    permission_classes = [permissions.AllowAny]
    queryset = (
        Problem.objects.filter(is_published=True)
        .prefetch_related("tags")
        .order_by("-created_at")
    )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        user = self.request.user
        if user.is_authenticated:
            ctx["solved_ids"] = set(
                UserProblemScore.objects.filter(
                    user=user, solved_at__isnull=False
                ).values_list("problem_id", flat=True)
            )
        else:
            ctx["solved_ids"] = set()
        return ctx

    def list(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return super().list(request, *args, **kwargs)

        page = request.query_params.get("page", "1")
        key = list_cache_key(page)
        cached = cache.get(key)
        if cached is not None:
            logger.info("problem list cache hit page=%s", page)
            return Response(cached)

        response = super().list(request, *args, **kwargs)
        cache.set(key, response.data, timeout=TTL_SECONDS)
        logger.info("problem list cache miss page=%s", page)
        return response


class ProblemDetailView(generics.RetrieveAPIView):
    serializer_class = ProblemDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    queryset = Problem.objects.filter(is_published=True).prefetch_related(
        "tags", "test_cases"
    )
