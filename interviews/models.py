from django.db import models
import uuid


# Create your models here.
class Skill(models.Model):
    skill_id = models.CharField(max_length=100, unique=True)
    dimension = models.CharField(max_length=50)
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class Job(models.Model):
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    skills = models.ManyToManyField(
        Skill,
        through="JobSkill",
        related_name="jobs",
    )

    def __str__(self):
        return self.title


class JobSkill(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE)
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    required_rating = models.PositiveSmallIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["job", "skill"],
                name="unique_job_skill",
            )
        ]

    def __str__(self):
        return f"{self.job.title} - {self.skill.name}"


class Interview(models.Model):
    STATUS_CHOICES = [
        ("not_started", "Not Started"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="interviews",
    )

    token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )

    candidate_name = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="not_started",
    )

    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )


class InterviewQuestion(models.Model):
    interview = models.ForeignKey(
        Interview,
        on_delete=models.CASCADE,
        related_name="questions",
    )

    skill = models.ForeignKey(
        Skill,
        on_delete=models.PROTECT,
    )

    question = models.TextField()
    order = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ["order"]
        constraints = [
            models.UniqueConstraint(
                fields=["interview", "order"],
                name="unique_interview_question_order",
            )
        ]


class Answer(models.Model):
    question = models.OneToOneField(
        InterviewQuestion,
        on_delete=models.CASCADE,
        related_name="answer",
    )

    transcript = models.TextField(blank=True)

    audio = models.FileField(
        upload_to="answers/",
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )


class SkillScore(models.Model):
    interview = models.ForeignKey(
        Interview,
        on_delete=models.CASCADE,
        related_name="skill_scores",
    )

    skill = models.ForeignKey(
        Skill,
        on_delete=models.PROTECT,
    )

    rating = models.PositiveSmallIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["interview", "skill"],
                name="unique_interview_skill_score",
            )
        ]


class InterviewResult(models.Model):
    FIT_CHOICES = [
        ("High", "High"),
        ("Medium", "Medium"),
        ("Low", "Low"),
    ]

    interview = models.OneToOneField(
        Interview,
        on_delete=models.CASCADE,
        related_name="result",
    )

    fit_score = models.CharField(
        max_length=10,
        choices=FIT_CHOICES,
    )

    summary = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True,
    )