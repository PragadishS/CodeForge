from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def push_verdict(submission) -> None:
    layer = get_channel_layer()
    if layer is None:
        return
    async_to_sync(layer.group_send)(
        f"submission.{submission.id}",
        {
            "type": "verdict.event",
            "id": submission.id,
            "verdict": submission.verdict,
        },
    )


def push_ranks_changed() -> None:
    layer = get_channel_layer()
    if layer is None:
        return
    async_to_sync(layer.group_send)(
        "leaderboard",
        {"type": "ranks.changed"},
    )