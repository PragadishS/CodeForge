from django.urls import path

from .views import SubmissionDetailView, SubmissionListView

urlpatterns = [
    path("", SubmissionListView.as_view()),
    path("<int:pk>/", SubmissionDetailView.as_view()),
]