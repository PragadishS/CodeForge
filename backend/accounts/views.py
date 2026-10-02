from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from judge.models import Submission
from judge.serializers import SubmissionListSerializer
from ranking.models import UserProblemScore

from .models import ActivityDay
from .serializers import RegisterSerializer, MeSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = MeSerializer(request.user.profile)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HeatmapView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, username):
        user = get_object_or_404(get_user_model(), username=username)
        rows = ActivityDay.objects.filter(user=user).order_by("date")
        return Response(
            {
                "username": user.username,
                "results": [
                    {"date": row.date.isoformat(), "count": row.submissions_count}
                    for row in rows
                ],
            }
        )


class PublicProfileView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, username):
        user = get_object_or_404(get_user_model(), username=username)
        profile = user.profile
        solved = UserProblemScore.objects.filter(
            user=user,
            solved_at__isnull=False,
        ).aggregate(
            easy=Count("id", filter=Q(problem__difficulty="easy")),
            medium=Count("id", filter=Q(problem__difficulty="medium")),
            hard=Count("id", filter=Q(problem__difficulty="hard")),
        )
        return Response(
            {
                "username": user.username,
                "total_score": profile.total_score,
                "current_streak": profile.current_streak,
                "longest_streak": profile.longest_streak,
                "solved": {
                    "easy": solved["easy"] or 0,
                    "medium": solved["medium"] or 0,
                    "hard": solved["hard"] or 0,
                },
            }
        )


class PublicSubmissionListView(generics.ListAPIView):
    serializer_class = SubmissionListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user = get_object_or_404(
            get_user_model(),
            username=self.kwargs["username"],
        )
        return Submission.objects.filter(user=user).select_related("problem")