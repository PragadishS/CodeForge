from django.contrib import admin

from .models import ActivityDay, Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "total_score", "current_streak", "longest_streak")
    list_filter = ("role",)
    search_fields = ("user__username",)


@admin.register(ActivityDay)
class ActivityDayAdmin(admin.ModelAdmin):
    list_display = ("user", "date", "submissions_count")
    list_filter = ("date",)
    search_fields = ("user__username",)
