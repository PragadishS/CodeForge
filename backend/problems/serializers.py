from rest_framework import serializers

from .models import Problem, Tag, TestCase


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("name", "slug")


class SampleTestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCase
        fields = ("order", "input_data", "expected_output")


class ProblemListSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    solved = serializers.SerializerMethodField()

    class Meta:
        model = Problem
        fields = ("title", "slug", "difficulty", "tags", "solved")

    def get_solved(self, obj):
        return obj.id in self.context.get("solved_ids", set())


class ProblemDetailSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    samples = serializers.SerializerMethodField()

    class Meta:
        model = Problem
        fields = (
            "title",
            "slug",
            "description",
            "constraints",
            "difficulty",
            "time_limit_ms",
            "memory_limit_kb",
            "tags",
            "samples",
        )

    def get_samples(self, obj):
        qs = obj.test_cases.filter(is_hidden=False).order_by("order")
        return SampleTestCaseSerializer(qs, many=True).data