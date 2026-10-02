from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .board import my_row, top_rows


class LeaderboardView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"period": "global", "results": top_rows()})


class LeaderboardMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(my_row(request.user.id))
