from django.urls import path

from .views import LeaderboardMeView, LeaderboardView

urlpatterns = [
    path("me/", LeaderboardMeView.as_view()),
    path("", LeaderboardView.as_view()),
]
