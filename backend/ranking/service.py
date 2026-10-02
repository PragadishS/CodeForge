from django.db import transaction
from django.utils import timezone

from accounts.models import Profile
from judge.models import Submission
from judge.notify import push_ranks_changed

from .board import add_points
from .models import UserProblemScore

BASE_POINTS = {
    "easy": 10,
    "medium": 25,
    "hard": 50,
}

FAILED = {
    Submission.Verdict.WRONG_ANSWER,
    Submission.Verdict.TIME_LIMIT,
    Submission.Verdict.RUNTIME_ERROR,
    Submission.Verdict.MEMORY_LIMIT,
}


def _points_for(problem, wrong_attempts: int) -> int:
    base = BASE_POINTS.get(problem.difficulty, 10)
    return max(base - (2 * wrong_attempts), 1)


def record_verdict(submission: Submission) -> None:
    if submission.verdict not in FAILED and submission.verdict != Submission.Verdict.ACCEPTED:
        return

    with transaction.atomic():
        score, _created = UserProblemScore.objects.select_for_update().get_or_create(
            user=submission.user,
            problem=submission.problem,
        )

        if score.solved_at is not None:
            return

        if submission.verdict in FAILED:
            score.wrong_attempts += 1
            score.save(update_fields=["wrong_attempts"])
            return

        awarded = _points_for(submission.problem, score.wrong_attempts)
        score.points_awarded = awarded
        score.solved_at = timezone.now()
        score.first_ac = submission
        score.save()

        profile = Profile.objects.select_for_update().get(user=submission.user)
        profile.total_score += awarded
        profile.save(update_fields=["total_score"])
        add_points(submission.user_id, awarded)
        push_ranks_changed()