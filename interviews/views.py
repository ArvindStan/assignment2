from django.shortcuts import render
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Job, JobSkill, Skill


class SkillListView(APIView):
    def get(self, request):
        skills = Skill.objects.all().order_by("dimension", "name")

        return Response([
            {
                "id": skill.id,
                "skill_id": skill.skill_id,
                "name": skill.name,
                "dimension": skill.dimension,
            }
            for skill in skills
        ])


class JobListCreateView(APIView):
    def get(self, request):
        jobs = Job.objects.all().order_by("-created_at")

        return Response([
            {
                "id": job.id,
                "title": job.title,
                "skills": [
                    {
                        "skill_id": js.skill.skill_id,
                        "name": js.skill.name,
                        "dimension": js.skill.dimension,
                        "required_rating": js.required_rating,
                    }
                    for js in JobSkill.objects.filter(job=job).select_related("skill")
                ],
            }
            for job in jobs
        ])

    def post(self, request):
        title = request.data.get("title")
        skills = request.data.get("skills", [])

        if not title:
            return Response(
                {"error": "title is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not skills:
            return Response(
                {"error": "at least one skill is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        job = Job.objects.create(title=title)

        for item in skills:
            skill = get_object_or_404(
                Skill,
                skill_id=item["skill_id"],
            )

            rating = int(item["required_rating"])

            if rating < 1 or rating > 5:
                return Response(
                    {"error": "required_rating must be between 1 and 5"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            JobSkill.objects.create(
                job=job,
                skill=skill,
                required_rating=rating,
            )

        return Response(
            {
                "id": job.id,
                "title": job.title,
                "message": "Job created successfully",
            },
            status=status.HTTP_201_CREATED,
        )