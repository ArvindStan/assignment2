from django.urls import path

from .views import JobListCreateView, SkillListView


urlpatterns = [
    path("skills/", SkillListView.as_view()),
    path("jobs/", JobListCreateView.as_view()),
]