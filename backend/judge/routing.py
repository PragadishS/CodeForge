from django.urls import path

from .consumers import LeaderboardConsumer, SubmissionConsumer

websocket_urlpatterns = [
    path("ws/submissions/<int:pk>/", SubmissionConsumer.as_asgi()),
    path("ws/leaderboard/", LeaderboardConsumer.as_asgi()),
]
