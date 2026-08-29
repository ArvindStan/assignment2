from datetime import timedelta

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Answer,
    Interview,
    InterviewQuestion,
    InterviewResult,
    Job,
    JobSkill,
    Skill,
    SkillScore,
)
from .services.ai import AIService
from .services.stt import SpeechToTextService


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
                    for js in JobSkill.objects.filter(
                        job=job
                    ).select_related("skill")
                ],
            }
            for job in jobs
        ])

    @transaction.atomic
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

            try:
                rating = int(item["required_rating"])
            except (TypeError, ValueError):
                return Response(
                    {"error": "required_rating must be an integer"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if rating < 1 or rating > 5:
                return Response(
                    {
                        "error": (
                            "required_rating must be between 1 and 5"
                        )
                    },
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
        job = get_object_or_404(Job, id=job_id)

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
        existing = (
            Interview.objects
            .filter(
                job=job,
                questions__isnull=False,
            )
            .distinct()
            .first()
        )

        if existing:
            return Response(
                {
                    "interview_id": str(existing.id),
                    "token": str(existing.token),
                    "message": "Interview already generated",
                }
            )

        skills = [
            job_skill.skill
            for job_skill in job_skills
        ]

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


class CandidateInterviewView(APIView):
    def get(self, request, token):
        interview = get_object_or_404(
            Interview.objects.prefetch_related(
                "questions__skill"
            ),
            token=token,
        )

        if interview.expires_at <= timezone.now():
            return Response(
                {"error": "Interview link has expired"},
                status=status.HTTP_410_GONE,
            )

        if interview.used_at is not None:
            return Response(
                {"error": "Interview link has already been used"},
                status=status.HTTP_410_GONE,
            )

        return Response({
            "interview_id": str(interview.id),
            "status": interview.status,
            "questions": [
                {
                    "id": question.id,
                    "order": question.order,
                    "question": question.question,
                }
                for question in interview.questions.all()
            ],
        })


class CandidateAnswerView(APIView):
    def post(self, request, token):
        interview = get_object_or_404(
            Interview,
            token=token,
        )

        if interview.expires_at <= timezone.now():
            return Response(
                {"error": "Interview link has expired"},
                status=status.HTTP_410_GONE,
            )

        if interview.used_at is not None:
            return Response(
                {"error": "Interview link has already been used"},
                status=status.HTTP_410_GONE,
            )

        question_id = request.data.get("question_id")

        if not question_id:
            return Response(
                {"error": "question_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        audio_file = request.FILES.get("audio")

        transcript = request.data.get(
            "transcript",
            "",
        ).strip()

        # If the candidate uploaded audio without providing
        # a transcript, convert the audio to text.
        if not transcript and audio_file:
            try:
                transcript = SpeechToTextService().transcribe(
                    audio_file
                )
            except ValueError as exc:
                return Response(
                    {"error": str(exc)},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Support both typed answers and audio answers,
        # but require at least one.
        if not transcript:
            return Response(
                {
                    "error": (
                        "transcript or audio is required"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        question = get_object_or_404(
            InterviewQuestion,
            id=question_id,
            interview=interview,
        )

        answer, _ = Answer.objects.update_or_create(
            question=question,
            defaults={
                "transcript": transcript,
            },
        )

        # Store the original audio file when supplied.
        if audio_file:
            answer.audio = audio_file
            answer.save(update_fields=["audio"])

        interview.status = "in_progress"
        interview.save(update_fields=["status"])

        total_questions = interview.questions.count()

        answered_questions = Answer.objects.filter(
            question__interview=interview
        ).count()

        if answered_questions >= total_questions:
            interview.status = "completed"
            interview.used_at = timezone.now()

            interview.save(
                update_fields=[
                    "status",
                    "used_at",
                ]
            )

            job_skills = list(
                JobSkill.objects
                .filter(job=interview.job)
                .select_related("skill")
            )

            skills = [
                job_skill.skill
                for job_skill in job_skills
            ]

            transcripts = {}

            answers = (
                Answer.objects
                .filter(question__interview=interview)
                .select_related("question__skill")
            )

            for answer in answers:
                transcripts[
                    answer.question.skill.skill_id
                ] = answer.transcript

            ai_service = AIService()

            score = ai_service.score_interview(
                skills=skills,
                transcripts=transcripts,
            )

            for skill_score in score.skills:
                skill = next(
                    (
                        skill
                        for skill in skills
                        if skill.skill_id == skill_score.skill_id
                    ),
                    None,
                )

                if skill:
                    SkillScore.objects.update_or_create(
                        interview=interview,
                        skill=skill,
                        defaults={
                            "rating": skill_score.rating,
                        },
                    )

            InterviewResult.objects.update_or_create(
                interview=interview,
                defaults={
                    "fit_score": score.fit_score,
                    "summary": score.summary,
                },
            )

        return Response({
            "message": "Answer saved",
            "status": interview.status,
            "answered": answered_questions,
            "total": total_questions,
        })


class InterviewResultView(APIView):
    def get(self, request, token):
        interview = get_object_or_404(
            Interview,
            token=token,
        )

        if interview.status != "completed":
            return Response(
                {"error": "Interview is not completed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = get_object_or_404(
            InterviewResult,
            interview=interview,
        )

        skill_scores = (
            SkillScore.objects
            .filter(interview=interview)
            .select_related("skill")
        )

        return Response({
            "interview_id": str(interview.id),
            "status": interview.status,
            "fit_score": result.fit_score,
            "summary": result.summary,
            "skill_scores": [
                {
                    "skill_id": skill_score.skill.skill_id,
                    "skill": skill_score.skill.name,
                    "rating": skill_score.rating,
                }
                for skill_score in skill_scores
            ],
        })

