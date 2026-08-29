from typing import List

from pydantic import BaseModel, Field


class GeneratedQuestion(BaseModel):
    question: str = Field(description="The interview question")
    skill_id: str = Field(description="The skill ID being tested")


class GeneratedQuestions(BaseModel):
    questions: List[GeneratedQuestion]


class ScoredSkill(BaseModel):
    skill_id: str
    rating: int = Field(ge=1, le=5)
    evidence: str


class InterviewScore(BaseModel):
    skills: List[ScoredSkill]
    fit_score: str
    summary: str


class AIService:

    def generate_questions(self, skills):
        """
        Generate exactly 5 questions.

        Mock implementation for local development.
        """

        questions = []

        for skill in skills[:5]:
            questions.append(
                GeneratedQuestion(
                    question=(
                        f"Can you explain your experience with "
                        f"{skill.name} and describe a real-world problem "
                        f"where you used it?"
                    ),
                    skill_id=skill.skill_id,
                )
            )

        index = 0

        while len(questions) < 5:
            skill = skills[index % len(skills)]

            questions.append(
                GeneratedQuestion(
                    question=(
                        f"Describe a challenging situation involving "
                        f"{skill.name}. How did you approach and solve it?"
                    ),
                    skill_id=skill.skill_id,
                )
            )

            index += 1

        return GeneratedQuestions(
            questions=questions[:5]
        )

    def score_interview(self, skills, transcripts):
        """
        Score each required skill based on the candidate's transcript.

        Local deterministic implementation for development/testing.
        """

        scores = []

        for skill in skills:
            transcript_text = transcripts.get(skill.skill_id, "").strip()

            if not transcript_text:
                rating = 1
                evidence = "No transcript was provided."

            else:
                word_count = len(transcript_text.split())

                if word_count >= 80:
                    rating = 5
                    evidence = (
                        f"Candidate provided a detailed response demonstrating "
                        f"experience with {skill.name}."
                    )
                elif word_count >= 40:
                    rating = 4
                    evidence = (
                        f"Candidate provided a relevant response describing "
                        f"experience with {skill.name}."
                    )
                elif word_count >= 20:
                    rating = 3
                    evidence = (
                        f"Candidate provided a basic response related to "
                        f"{skill.name}."
                    )
                else:
                    rating = 2
                    evidence = (
                        f"Candidate mentioned {skill.name}, but the response "
                        f"contained limited supporting detail."
                    )

            scores.append(
                ScoredSkill(
                    skill_id=skill.skill_id,
                    rating=rating,
                    evidence=evidence,
                )
            )

        average = sum(score.rating for score in scores) / len(scores)

        if average >= 4:
            fit_score = "High"
        elif average >= 3:
            fit_score = "Medium"
        else:
            fit_score = "Low"

        return InterviewScore(
            skills=scores,
            fit_score=fit_score,
            summary=(
                "The candidate completed the interview.\n"
                f"The candidate demonstrated an average skill rating "
                f"of {average:.1f}/5.\n"
                f"Overall fit was assessed as {fit_score}."
            ),
        )