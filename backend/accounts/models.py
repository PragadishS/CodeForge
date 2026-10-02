from django.conf import settings
from django.db import models

class Profile(models.Model):
    class Role(models.TextChoices):
        USER = "user", "User"
        MODERATOR = "moderator", "Moderator"
        ADMIN = "admin", "Admin"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile",)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)
    total_score = models.PositiveIntegerField(default=0)
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

class ActivityDay(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="activity_days",
    )
    date = models.DateField()
    submissions_count = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "date"],
                name="uniq_user_activity_day",
            ),
        ]
        ordering = ["-date"]

    def __str__(self):
        return f"{self.user} {self.date} x{self.submissions_count}"