from rest_framework import serializers

from .models import Submission


class SubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ("language", "code")


class SubmissionListSerializer(serializers.ModelSerializer):
    problem_slug = serializers.SlugField(source="problem.slug", read_only=True)

    class Meta:
        model = Submission
        fields = (
            "id",
            "problem_slug",
            "language",
            "verdict",
            "runtime_ms",
            "created_at",
        )


class SubmissionDetailSerializer(serializers.ModelSerializer):
    problem_slug = serializers.SlugField(source="problem.slug", read_only=True)

    class Meta:
        model = Submission
        fields = (
            "id",
            "problem_slug",
            "language",
            "code",
            "verdict",
            "runtime_ms",
            "memory_kb",
            "error_message",
            "created_at",
            "judged_at",
        )