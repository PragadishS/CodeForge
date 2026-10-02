from django.conf import settings
from django.db import models

from problems.models import Problem, TestCase


class Submission(models.Model):
    class Language(models.TextChoices):
        PYTHON = "python", "Python"
        CPP = "cpp", "C++"

    class Verdict(models.TextChoices):
        QUEUED = "queued", "Queued"
        RUNNING = "running", "Running"
        ACCEPTED = "accepted", "Accepted"
        WRONG_ANSWER = "wrong_answer", "Wrong Answer"
        TIME_LIMIT = "time_limit", "Time Limit Exceeded"
        RUNTIME_ERROR = "runtime_error", "Runtime Error"
        MEMORY_LIMIT = "memory_limit", "Memory Limit Exceeded"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    problem = models.ForeignKey(
        Problem,
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    language = models.CharField(max_length=10, choices=Language.choices)
    code = models.TextField()
    verdict = models.CharField(
        max_length=20,
        choices=Verdict.choices,
        default=Verdict.QUEUED,
    )
    runtime_ms = models.PositiveIntegerField(null=True, blank=True)
    memory_kb = models.PositiveIntegerField(null=True, blank=True)
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    judged_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["problem", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user} {self.problem.slug} {self.verdict}"


class SubmissionTestResult(models.Model):
    submission = models.ForeignKey(
        Submission,
        on_delete=models.CASCADE,
        related_name="test_results",
    )
    test_case = models.ForeignKey(
        TestCase,
        on_delete=models.CASCADE,
        related_name="results",
    )
    verdict = models.CharField(max_length=20, choices=Submission.Verdict.choices)
    runtime_ms = models.PositiveIntegerField(null=True, blank=True)
    memory_kb = models.PositiveIntegerField(null=True, blank=True)
    actual_output = models.TextField(blank=True, default="")

    class Meta:
        indexes = [
            models.Index(fields=["submission", "test_case"]),
        ]