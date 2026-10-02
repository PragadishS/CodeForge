from django.urls import path

from judge.views import SubmissionCreateView

from .views import ProblemDetailView, ProblemListView

urlpatterns = [
    path("", ProblemListView.as_view()),
    path("<slug:slug>/submissions/", SubmissionCreateView.as_view()),
    path("<slug:slug>/", ProblemDetailView.as_view()),
]