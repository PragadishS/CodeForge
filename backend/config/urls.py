from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def health(_request):
    return JsonResponse({"status": "ok", "service": "codeforge-api"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/auth/token/", TokenObtainPairView.as_view()),
    path("api/auth/token/refresh/", TokenRefreshView.as_view()),
    path("api/auth/", include("accounts.urls")),
    path("api/problems/", include("problems.urls")),
    path("api/submissions/", include("judge.urls")),
    path("api/leaderboard/", include("ranking.urls")),
    path("api/users/", include("accounts.user_urls")),
]
