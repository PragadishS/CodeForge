from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.generics import get_object_or_404

from accounts.activity import record_submission_activity
from problems.models import Problem

from .models import Submission
from .producer import publish_submission_created
from .ratelimit import allow_submit
from .serializers import (
    SubmissionCreateSerializer,
    SubmissionDetailSerializer,
    SubmissionListSerializer,
)


class SubmissionCreateView(generics.CreateAPIView):
    serializer_class = SubmissionCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        problem = get_object_or_404(
            Problem, slug=self.kwargs["slug"], is_published=True
        )
        serializer.save(
            user=self.request.user,
            problem=problem,
            verdict=Submission.Verdict.QUEUED,
        )
        record_submission_activity(self.request.user)
        publish_submission_created(serializer.instance.id)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not allow_submit(request.user.id):
            return Response(
                {"detail": "Too many submissions. Try again in a minute."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        self.perform_create(serializer)
        submission = serializer.instance
        return Response(
            {"id": submission.id, "verdict": submission.verdict},
            status=status.HTTP_202_ACCEPTED,
        )


class SubmissionListView(generics.ListAPIView):
    serializer_class = SubmissionListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Submission.objects.filter(user=self.request.user)


class SubmissionDetailView(generics.RetrieveAPIView):
    serializer_class = SubmissionDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Submission.objects.filter(user=self.request.user)