from datetime import timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

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


class InterviewAPITestCase(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.python = Skill.objects.create(
            skill_id="tl.python",
            dimension="technical",
            name="Python",
        )

        self.postgres = Skill.objects.create(
            skill_id="tl.postgres",
            dimension="technical",
            name="PostgreSQL",
        )

        self.api_design = Skill.objects.create(
            skill_id="kn.apidesign",
            dimension="knowledge",
            name="REST API design",
        )

        self.job = Job.objects.create(
            title="Senior Python Developer",
        )

        JobSkill.objects.create(
            job=self.job,
            skill=self.python,
            required_rating=4,
        )

        JobSkill.objects.create(
            job=self.job,
            skill=self.postgres,
            required_rating=4,
        )

        JobSkill.objects.create(
            job=self.job,
            skill=self.api_design,
            required_rating=4,
        )

    def test_ai_service_generates_structured_questions(self):
        service = AIService()

        result = service.generate_questions(
            [
                self.python,
                self.postgres,
                self.api_design,
            ]
        )

        self.assertEqual(len(result.questions), 5)

        for question in result.questions:
            self.assertTrue(question.question)
            self.assertTrue(question.skill_id)

    def test_ai_service_returns_structured_interview_score(self):
        service = AIService()

        result = service.score_interview(
            skills=[
                self.python,
                self.postgres,
                self.api_design,
            ],
            transcripts={
                "tl.python": (
                    "I have extensive professional experience "
                    "building backend services with Python."
                ),
                "tl.postgres": (
                    "I have worked with PostgreSQL databases "
                    "and designed production queries."
                ),
                "kn.apidesign": (
                    "I have designed REST APIs for several "
                    "backend applications."
                ),
            },
        )

        self.assertEqual(len(result.skills), 3)

        self.assertIn(
            result.fit_score,
            ["High", "Medium", "Low"],
        )

        for skill_score in result.skills:
            self.assertGreaterEqual(
                skill_score.rating,
                1,
            )

            self.assertLessEqual(
                skill_score.rating,
                5,
            )

            self.assertTrue(
                skill_score.evidence
            )

    def test_skills_endpoint(self):
        response = self.client.get(
            "/api/skills/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            len(response.data),
            3,
        )

    def test_create_job(self):
        response = self.client.post(
            "/api/jobs/",
            {
                "title": "Backend Developer",
                "skills": [
                    {
                        "skill_id": "tl.python",
                        "required_rating": 4,
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        self.assertEqual(
            response.data["title"],
            "Backend Developer",
        )

        job = Job.objects.get(
            id=response.data["id"]
        )

        self.assertEqual(
            job.skills.count(),
            1,
        )

    def test_generate_interview_creates_five_questions(self):
        response = self.client.post(
            f"/api/jobs/{self.job.id}/interview/"
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        interview_id = response.data[
            "interview_id"
        ]

        interview = Interview.objects.get(
            id=interview_id
        )

        self.assertEqual(
            interview.questions.count(),
            5,
        )

        self.assertEqual(
            interview.status,
            "not_started",
        )

        orders = list(
            interview.questions.values_list(
                "order",
                flat=True,
            )
        )

        self.assertEqual(
            orders,
            [1, 2, 3, 4, 5],
        )

    def test_generate_interview_does_not_duplicate(self):
        first_response = self.client.post(
            f"/api/jobs/{self.job.id}/interview/"
        )

        second_response = self.client.post(
            f"/api/jobs/{self.job.id}/interview/"
        )

        self.assertEqual(
            first_response.status_code,
            201,
        )

        self.assertEqual(
            second_response.status_code,
            200,
        )

        self.assertEqual(
            first_response.data["interview_id"],
            second_response.data["interview_id"],
        )

        self.assertEqual(
            Interview.objects.filter(
                job=self.job
            ).count(),
            1,
        )

    def test_candidate_can_get_interview(self):
        response = self.client.post(
            f"/api/jobs/{self.job.id}/interview/"
        )

        token = response.data["token"]

        response = self.client.get(
            f"/api/interview/{token}/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["status"],
            "not_started",
        )

        self.assertEqual(
            len(response.data["questions"]),
            5,
        )

    def test_candidate_can_submit_answer(self):
        response = self.client.post(
            f"/api/jobs/{self.job.id}/interview/"
        )

        token = response.data["token"]

        interview = Interview.objects.get(
            id=response.data["interview_id"]
        )

        question = interview.questions.first()

        response = self.client.post(
            f"/api/interview/{token}/answer/",
            {
                "question_id": question.id,
                "transcript": (
                    "I have extensive Python experience."
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["status"],
            "in_progress",
        )

        self.assertEqual(
            response.data["answered"],
            1,
        )

        self.assertEqual(
            response.data["total"],
            5,
        )

        self.assertEqual(
            Answer.objects.filter(
                question=question
            ).count(),
            1,
        )

    def test_candidate_can_submit_audio_answer(self):
        response = self.client.post(
            f"/api/jobs/{self.job.id}/interview/"
        )

        token = response.data["token"]

        interview = Interview.objects.get(
            id=response.data["interview_id"]
        )

        question = interview.questions.first()

        audio = SimpleUploadedFile(
            "answer.webm",
            b"fake audio content",
            content_type="audio/webm",
        )

        response = self.client.post(
            f"/api/interview/{token}/answer/",
            {
                "question_id": question.id,
                "audio": audio,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        answer = Answer.objects.get(
            question=question
        )

        self.assertTrue(
            answer.audio
        )

        self.assertTrue(
            answer.transcript
        )

        self.assertIn(
            "Audio response received successfully",
            answer.transcript,
        )

    def test_answer_requires_question_id(self):
        response = self.client.post(
            "/api/interview/"
            "00000000-0000-0000-0000-000000000000/"
            "answer/",
            {
                "transcript": "Some answer",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_answer_requires_transcript_or_audio(self):
        response = self.client.post(
            f"/api/jobs/{self.job.id}/interview/"
        )

        token = response.data["token"]

        interview = Interview.objects.get(
            id=response.data["interview_id"]
        )

        question = interview.questions.first()

        response = self.client.post(
            f"/api/interview/{token}/answer/",
            {
                "question_id": question.id,
                "transcript": "",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertEqual(
            response.data["error"],
            "transcript or audio is required",
        )

    def test_completing_interview_creates_scores_and_result(self):
        response = self.client.post(
            f"/api/jobs/{self.job.id}/interview/"
        )

        token = response.data["token"]

        interview = Interview.objects.get(
            id=response.data["interview_id"]
        )

        questions = list(
            interview.questions.order_by("order")
        )

        for question in questions:
            response = self.client.post(
                f"/api/interview/{token}/answer/",
                {
                    "question_id": question.id,
                    "transcript": (
                        "I have professional experience "
                        f"with {question.skill.name}."
                    ),
                },
                format="json",
            )

            self.assertEqual(
                response.status_code,
                200,
            )

        interview.refresh_from_db()

        self.assertEqual(
            interview.status,
            "completed",
        )

        self.assertIsNotNone(
            interview.used_at
        )

        self.assertEqual(
            Answer.objects.filter(
                question__interview=interview
            ).count(),
            5,
        )

        self.assertEqual(
            SkillScore.objects.filter(
                interview=interview
            ).count(),
            3,
        )

        self.assertTrue(
            InterviewResult.objects.filter(
                interview=interview
            ).exists()
        )

    def test_completed_interview_cannot_accept_more_answers(self):
        response = self.client.post(
            f"/api/jobs/{self.job.id}/interview/"
        )

        token = response.data["token"]

        interview = Interview.objects.get(
            id=response.data["interview_id"]
        )

        for question in interview.questions.all():
            self.client.post(
                f"/api/interview/{token}/answer/",
                {
                    "question_id": question.id,
                    "transcript": "My answer",
                },
                format="json",
            )

        last_question = interview.questions.last()

        response = self.client.post(
            f"/api/interview/{token}/answer/",
            {
                "question_id": last_question.id,
                "transcript": "Another answer",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            410,
        )

        self.assertEqual(
            response.data["error"],
            "Interview link has already been used",
        )

    def test_result_endpoint_returns_completed_result(self):
        response = self.client.post(
            f"/api/jobs/{self.job.id}/interview/"
        )

        token = response.data["token"]

        interview = Interview.objects.get(
            id=response.data["interview_id"]
        )

        for question in interview.questions.all():
            self.client.post(
                f"/api/interview/{token}/answer/",
                {
                    "question_id": question.id,
                    "transcript": "I have relevant experience.",
                },
                format="json",
            )

        response = self.client.get(
            f"/api/interview/{token}/result/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["status"],
            "completed",
        )

        self.assertIn(
            response.data["fit_score"],
            ["High", "Medium", "Low"],
        )

        self.assertEqual(
            len(response.data["skill_scores"]),
            3,
        )

    def test_expired_interview_is_rejected(self):
        interview = Interview.objects.create(
            job=self.job,
            expires_at=timezone.now()
            - timedelta(hours=1),
        )

        response = self.client.get(
            f"/api/interview/{interview.token}/"
        )

        self.assertEqual(
            response.status_code,
            410,
        )

        self.assertEqual(
            response.data["error"],
            "Interview link has expired",
        )

