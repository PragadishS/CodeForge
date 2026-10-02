import logging

from django.utils import timezone

from ranking.service import record_verdict

from .models import Submission, SubmissionTestResult
from .notify import push_verdict
from .sandbox import ast_violation, cleanup_workdir, compile_cpp, run_binary, run_python

logger = logging.getLogger("judge.worker")


def _same_output(actual: str, expected: str) -> bool:
    return actual.strip() == expected.strip()


def _finish(submission: Submission, verdict: str, error: str = "") -> None:
    submission.verdict = verdict
    submission.error_message = error[:2000]
    submission.judged_at = timezone.now()
    submission.save()
    record_verdict(submission)
    push_verdict(submission)


def judge_submission(submission: Submission) -> None:
    workdir = None

    if submission.language == Submission.Language.PYTHON:
        banned = ast_violation(submission.code)
        if banned:
            _finish(submission, Submission.Verdict.RUNTIME_ERROR, banned)
            logger.info("ast reject submission_id=%s %s", submission.id, banned)
            return

        def run(stdin, time_ms, mem_kb, code=submission.code):
            return run_python(code, stdin, time_ms, mem_kb)

    elif submission.language == Submission.Language.CPP:
        workdir, binary, compile_err = compile_cpp(submission.code)
        if binary is None:
            cleanup_workdir(workdir)
            _finish(submission, Submission.Verdict.RUNTIME_ERROR, compile_err)
            logger.info("cpp compile fail submission_id=%s", submission.id)
            return

        def run(stdin, time_ms, mem_kb, path=binary):
            return run_binary(path, stdin, time_ms, mem_kb)

    else:
        _finish(submission, Submission.Verdict.RUNTIME_ERROR, "unsupported language")
        return

    try:
        submission.verdict = Submission.Verdict.RUNNING
        submission.save(update_fields=["verdict"])
        push_verdict(submission)

        tests = submission.problem.test_cases.order_by("order")
        max_runtime = 0
        final = Submission.Verdict.ACCEPTED
        error = ""

        for test in tests:
            verdict, stdout, err = run(
                test.input_data,
                submission.problem.time_limit_ms,
                submission.problem.memory_limit_kb,
            )
            if verdict == Submission.Verdict.ACCEPTED and not _same_output(
                stdout, test.expected_output
            ):
                verdict = Submission.Verdict.WRONG_ANSWER
                err = "wrong answer"

            SubmissionTestResult.objects.create(
                submission=submission,
                test_case=test,
                verdict=verdict,
                actual_output=stdout[:2000],
            )

            if verdict != Submission.Verdict.ACCEPTED and final == Submission.Verdict.ACCEPTED:
                final = verdict
                error = err

        submission.runtime_ms = max_runtime or None
        _finish(submission, final, error)
        logger.info("judged submission_id=%s verdict=%s", submission.id, final)
    finally:
        cleanup_workdir(workdir)
