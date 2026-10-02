from django.contrib import admin

from .models import UserProblemScore


@admin.register(UserProblemScore)
class UserProblemScoreAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "problem",
        "wrong_attempts",
        "points_awarded",
        "solved_at",
    )
    list_filter = ("problem",)
    search_fields = ("user__username", "problem__slug")
    raw_id_fields = ("user", "problem", "first_ac")