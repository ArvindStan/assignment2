from django.urls import path
from .views import (
    CandidateAnswerView,
    CandidateInterviewView,
    GenerateInterviewView,
    InterviewResultView,
    JobListCreateView,
    SkillListView,
)

# from .views import JobListCreateView, SkillListView, GenerateInterviewView, CandidateAnswerView, CandidateInterviewView, InterviewResultView

urlpatterns = [
    path("skills/", SkillListView.as_view()),
    path("jobs/", JobListCreateView.as_view()),
    path(
            "jobs/<int:job_id>/interview/",
            GenerateInterviewView.as_view(),
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






