from django.urls import path

from .views import (
    CandidateAnswerView,
    CandidateInterviewView,
    GenerateInterviewView,
    InterviewDetailView,
    InterviewResultView,
    JobInterviewListView,
    JobListCreateView,
    SkillListView,
)


urlpatterns = [
    path(
        "skills/",
        SkillListView.as_view(),
    ),
    path(
        "jobs/",
        JobListCreateView.as_view(),
    ),
    path(
        "jobs/<int:job_id>/interview/",
        GenerateInterviewView.as_view(),
    ),
    path(
        "jobs/<int:job_id>/interviews/",
        JobInterviewListView.as_view(),
    ),
    path(
        "interviews/<uuid:interview_id>/",
        InterviewDetailView.as_view(),
    ),
    path(
        "interview/<uuid:token>/",
        CandidateInterviewView.as_view(),
    ),
    path(
        "interview/<uuid:token>/answer/",
        CandidateAnswerView.as_view(),
    ),
    path(
        "interview/<uuid:token>/result/",
        InterviewResultView.as_view(),
    ),
]