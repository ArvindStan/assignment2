from django.urls import path

from .views import JobListCreateView, SkillListView, GenerateInterviewView

urlpatterns = [
    path("skills/", SkillListView.as_view()),
    path("jobs/", JobListCreateView.as_view()),
    path(
            "jobs/<int:job_id>/interview/",
            GenerateInterviewView.as_view(),
        ),
]






