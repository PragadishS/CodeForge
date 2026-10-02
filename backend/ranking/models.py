from django.conf import settings
from django.db import models

from problems.models import Problem


class UserProblemScore(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="problem_scores",
    )
    problem = models.ForeignKey(
        Problem,
        on_delete=models.CASCADE,
        related_name="user_scores",
    )
    wrong_attempts = models.PositiveIntegerField(default=0)
    points_awarded = models.PositiveIntegerField(default=0)
    solved_at = models.DateTimeField(null=True, blank=True)
    first_ac = models.ForeignKey(
        "judge.Submission",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "problem"],
                name="uniq_user_problem_score",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "problem"]),
        ]

    def __str__(self):
        return f"{self.user} {self.problem.slug} {self.points_awarded}"