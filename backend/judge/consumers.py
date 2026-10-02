from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from rest_framework_simplejwt.tokens import AccessToken

from .models import Submission


def _user_id_from_scope(scope):
    qs = parse_qs(scope["query_string"].decode())
    raw = (qs.get("token") or [None])[0]
    if not raw:
        return None
    try:
        return AccessToken(raw)["user_id"]
    except Exception:
        return None


class SubmissionConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.pk = self.scope["url_route"]["kwargs"]["pk"]
        user_id = _user_id_from_scope(self.scope)
        if user_id is None:
            await self.close(code=4401)
            return

        submission = await self._get_submission(self.pk)
        if submission is None or submission.user_id != user_id:
            await self.close(code=4403)
            return

        self.group = f"submission.{self.pk}"
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()
        await self.send_json({"id": submission.id, "verdict": submission.verdict})

    async def disconnect(self, code):
        if hasattr(self, "group"):
            await self.channel_layer.group_discard(self.group, self.channel_name)

    async def verdict_event(self, event):
        await self.send_json({"id": event["id"], "verdict": event["verdict"]})

    @database_sync_to_async
    def _get_submission(self, pk):
        return Submission.objects.filter(pk=pk).first()


class LeaderboardConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        if _user_id_from_scope(self.scope) is None:
            await self.close(code=4401)
            return
        self.group = "leaderboard"
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()
        await self.send_json({"event": "connected"})

    async def disconnect(self, code):
        if hasattr(self, "group"):
            await self.channel_layer.group_discard(self.group, self.channel_name)

    async def ranks_changed(self, event):
        await self.send_json({"event": "ranks_changed"})
