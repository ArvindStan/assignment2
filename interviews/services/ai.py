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
    
    # I have used Langchain  and if you want it immersive with ai you can use it with langchain and openai 
    # api key mostly itll be paid one. 

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

        # I created this so you can see how the system behaves when there are fewer than 5 skills.
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
        Mock scoring implementation.

        Real implementation can use LangChain structured output.
        """

        scores = []

        for skill in skills:
            transcript_text = transcripts.get(skill.skill_id, "")

            if transcript_text.strip():
                rating = 4
                evidence = (
                    f"Candidate provided an answer discussing "
                    f"{skill.name}."
                )
            else:
                rating = 1
                evidence = "No transcript was provided."

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
                "The candidate completed the interview."
                "The answers were evaluated against the required skills."
                f"Overall fit was assessed as {fit_score}."
            ),
        )