from django.urls import path

from .views import HeatmapView, PublicProfileView, PublicSubmissionListView

urlpatterns = [
    path("<str:username>/heatmap/", HeatmapView.as_view()),
    path("<str:username>/submissions/", PublicSubmissionListView.as_view()),
    path("<str:username>/", PublicProfileView.as_view()),
]
