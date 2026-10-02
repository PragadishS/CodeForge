import json
import os

from kafka import KafkaProducer

_producer = None


def get_producer():
    global _producer
    if _producer is None:
        _producer = KafkaProducer(
            bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP", "kafka:9092"),
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )
    return _producer


def publish_submission_created(submission_id: int) -> None:
    topic = os.getenv("KAFKA_TOPIC", "submissions.created")
    get_producer().send(topic, {"submission_id": submission_id})
    get_producer().flush()