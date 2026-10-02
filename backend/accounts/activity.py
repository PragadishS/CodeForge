from django.db import transaction
from django.utils import timezone

from .models import ActivityDay, Profile


def record_submission_activity(user) -> None:
    today = timezone.now().date()

    with transaction.atomic():
        day, _created = ActivityDay.objects.select_for_update().get_or_create(
            user=user,
            date=today,
            defaults={"submissions_count": 0},
        )
        day.submissions_count += 1
        day.save(update_fields=["submissions_count"])

        profile = Profile.objects.select_for_update().get(user=user)
        if profile.last_active_date == today:
            return

        yesterday = today.fromordinal(today.toordinal() - 1)
        if profile.last_active_date == yesterday:
            profile.current_streak += 1
        else:
            profile.current_streak = 1

        if profile.current_streak > profile.longest_streak:
            profile.longest_streak = profile.current_streak
        profile.last_active_date = today
        profile.save(
            update_fields=["current_streak", "longest_streak", "last_active_date"]
        )