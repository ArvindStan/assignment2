from django.shortcuts import render
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Job, JobSkill, Skill
from datetime import timedelta

from django.utils import timezone


from .models import (
    Interview,
    InterviewQuestion,
    Job,
    JobSkill,
)
from .services.ai import AIService


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

class GenerateInterviewView(APIView):

    def post(self, request, job_id):
        job = Job.objects.get(id=job_id)

        job_skills = list(
            JobSkill.objects
            .filter(job=job)
            .select_related("skill")
        )

        if not job_skills:
            return Response(
                {"error": "Job has no skills"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Don't regenerate an interview every time.
        existing = Interview.objects.filter(
            job=job,
            questions__isnull=False,
        ).distinct().first()

        if existing:
            return Response(
                {
                    "interview_id": str(existing.id),
                    "token": str(existing.token),
                    "message": "Interview already generated",
                }
            )

        skills = [job_skill.skill for job_skill in job_skills]

        ai_service = AIService()

        generated = ai_service.generate_questions(skills)

        interview = Interview.objects.create(
            job=job,
            expires_at=timezone.now() + timedelta(hours=24),
        )

        for index, generated_question in enumerate(
            generated.questions,
            start=1,
        ):
            skill = next(
                (
                    skill
                    for skill in skills
                    if skill.skill_id == generated_question.skill_id
                ),
                None,
            )

            if not skill:
                continue

            InterviewQuestion.objects.create(
                interview=interview,
                skill=skill,
                question=generated_question.question,
                order=index,
            )

        return Response(
            {
                "interview_id": str(interview.id),
                "token": str(interview.token),
                "candidate_url": (
                    f"http://localhost:3000/interview/"
                    f"{interview.token}"
                ),
                "expires_at": interview.expires_at,
                "questions": [
                    {
                        "order": question.order,
                        "question": question.question,
                        "skill": question.skill.name,
                        "skill_id": question.skill.skill_id,
                    }
                    for question in interview.questions.all()
                ],
            },
            status=status.HTTP_201_CREATED,
        )
    