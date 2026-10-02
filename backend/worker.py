import json
import logging
import os
import time

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from kafka import KafkaConsumer

from judge.models import Submission
from judge.runner import judge_submission

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("judge.worker")

FINAL = {
    Submission.Verdict.ACCEPTED,
    Submission.Verdict.WRONG_ANSWER,
    Submission.Verdict.TIME_LIMIT,
    Submission.Verdict.RUNTIME_ERROR,
    Submission.Verdict.MEMORY_LIMIT,
}


def main():
    bootstrap = os.getenv("KAFKA_BOOTSTRAP", "kafka:9092")
    topic = os.getenv("KAFKA_TOPIC", "submissions.created")

    consumer = None
    while consumer is None:
        try:
            consumer = KafkaConsumer(
                topic,
                bootstrap_servers=bootstrap,
                group_id="codeforge.judge",
                auto_offset_reset="earliest",
                value_deserializer=lambda b: json.loads(b.decode("utf-8")),
            )
        except Exception as exc:
            logger.warning("Kafka not ready (%s). Retrying...", exc)
            time.sleep(2)

    logger.info("Worker listening on %s", topic)

    for message in consumer:
        submission_id = message.value.get("submission_id")
        logger.info("got ticket submission_id=%s", submission_id)

        try:
            submission = Submission.objects.get(pk=submission_id)
        except Submission.DoesNotExist:
            logger.warning("no row for submission_id=%s", submission_id)
            continue

        if submission.verdict in FINAL:
            logger.info("skip already final submission_id=%s verdict=%s", submission_id, submission.verdict)
            continue

        logger.info("judging submission_id=%s language=%s", submission_id, submission.language)
        judge_submission(submission)


if __name__ == "__main__":
    main()