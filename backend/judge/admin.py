from django.contrib import admin

from .models import Submission, SubmissionTestResult


class SubmissionTestResultInline(admin.TabularInline):
    model = SubmissionTestResult
    extra = 0
    readonly_fields = (
        "test_case",
        "verdict",
        "runtime_ms",
        "memory_kb",
        "actual_output",
    )


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "problem", "language", "verdict", "created_at")
    list_filter = ("verdict", "language")
    search_fields = ("user__username", "problem__slug")
    readonly_fields = (
        "user",
        "problem",
        "language",
        "code",
        "verdict",
        "runtime_ms",
        "memory_kb",
        "error_message",
        "created_at",
        "judged_at",
    )
    inlines = [SubmissionTestResultInline]


@admin.register(SubmissionTestResult)
class SubmissionTestResultAdmin(admin.ModelAdmin):
    list_display = ("submission", "test_case", "verdict")
    list_filter = ("verdict",)