from typing import List, TypedDict

from langchain_core.runnables import RunnableLambda
from langgraph.graph import END, START, StateGraph
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


class QuestionGenerationState(TypedDict):
    skills: list
    result: GeneratedQuestions


class ScoringState(TypedDict):
    skills: list
    transcripts: dict
    result: InterviewScore


def _generate_questions(data: QuestionGenerationState):
    skills = data["skills"]

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

    return {
        "skills": skills,
        "result": GeneratedQuestions(
            questions=questions[:5]
        ),
    }


def _score_interview(data: ScoringState):
    skills = data["skills"]
    transcripts = data["transcripts"]

    scores = []

    for skill in skills:
        transcript_text = transcripts.get(
            skill.skill_id,
            "",
        ).strip()

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

    average = sum(
        score.rating for score in scores
    ) / len(scores)

    if average >= 4:
        fit_score = "High"
    elif average >= 3:
        fit_score = "Medium"
    else:
        fit_score = "Low"

    return {
        "skills": skills,
        "transcripts": transcripts,
        "result": InterviewScore(
            skills=scores,
            fit_score=fit_score,
            summary=(
                "The candidate completed the interview.\n"
                f"The candidate demonstrated an average skill rating "
                f"of {average:.1f}/5.\n"
                f"Overall fit was assessed as {fit_score}."
            ),
        ),
    }


class AIService:
    """
    AI orchestration layer.

    LangGraph is used to define the workflow while LangChain
    RunnableLambda provides the executable processing nodes.

    The current nodes contain deterministic local logic so the
    assignment can run without an external LLM or API key.
    """

    def __init__(self):
        question_node = RunnableLambda(
            _generate_questions
        )

        question_graph = StateGraph(
            QuestionGenerationState
        )

        question_graph.add_node(
            "generate_questions",
            question_node,
        )

        question_graph.add_edge(
            START,
            "generate_questions",
        )

        question_graph.add_edge(
            "generate_questions",
            END,
        )

        self.question_graph = question_graph.compile()

        scoring_node = RunnableLambda(
            _score_interview
        )

        scoring_graph = StateGraph(
            ScoringState
        )

        scoring_graph.add_node(
            "score_interview",
            scoring_node,
        )

        scoring_graph.add_edge(
            START,
            "score_interview",
        )

        scoring_graph.add_edge(
            "score_interview",
            END,
        )

        self.scoring_graph = scoring_graph.compile()

    def generate_questions(self, skills):
        """
        Generate exactly five questions through the
        LangGraph question-generation workflow.
        """

        result = self.question_graph.invoke({
            "skills": skills,
        })

        return result["result"]

    def score_interview(self, skills, transcripts):
        """
        Score the interview through the LangGraph
        scoring workflow.
        """

        result = self.scoring_graph.invoke({
            "skills": skills,
            "transcripts": transcripts,
        })

        return result["result"]


























# from typing import List

# from pydantic import BaseModel, Field


# class GeneratedQuestion(BaseModel):
#     question: str = Field(description="The interview question")
#     skill_id: str = Field(description="The skill ID being tested")


# class GeneratedQuestions(BaseModel):
#     questions: List[GeneratedQuestion]


# class ScoredSkill(BaseModel):
#     skill_id: str
#     rating: int = Field(ge=1, le=5)
#     evidence: str


# class InterviewScore(BaseModel):
#     skills: List[ScoredSkill]
#     fit_score: str
#     summary: str


# class AIService:

#     def generate_questions(self, skills):
#         """
#         Generate exactly 5 questions.

#         Mock implementation for local development.
#         """

#         questions = []

#         for skill in skills[:5]:
#             questions.append(
#                 GeneratedQuestion(
#                     question=(
#                         f"Can you explain your experience with "
#                         f"{skill.name} and describe a real-world problem "
#                         f"where you used it?"
#                     ),
#                     skill_id=skill.skill_id,
#                 )
#             )

#         index = 0

#         while len(questions) < 5:
#             skill = skills[index % len(skills)]

#             questions.append(
#                 GeneratedQuestion(
#                     question=(
#                         f"Describe a challenging situation involving "
#                         f"{skill.name}. How did you approach and solve it?"
#                     ),
#                     skill_id=skill.skill_id,
#                 )
#             )

#             index += 1

#         return GeneratedQuestions(
#             questions=questions[:5]
#         )

#     def score_interview(self, skills, transcripts):
#         """
#         Score each required skill based on the candidate's transcript.

#         Local deterministic implementation for development/testing.
#         """

#         scores = []

#         for skill in skills:
#             transcript_text = transcripts.get(skill.skill_id, "").strip()

#             if not transcript_text:
#                 rating = 1
#                 evidence = "No transcript was provided."

#             else:
#                 word_count = len(transcript_text.split())

#                 if word_count >= 80:
#                     rating = 5
#                     evidence = (
#                         f"Candidate provided a detailed response demonstrating "
#                         f"experience with {skill.name}."
#                     )
#                 elif word_count >= 40:
#                     rating = 4
#                     evidence = (
#                         f"Candidate provided a relevant response describing "
#                         f"experience with {skill.name}."
#                     )
#                 elif word_count >= 20:
#                     rating = 3
#                     evidence = (
#                         f"Candidate provided a basic response related to "
#                         f"{skill.name}."
#                     )
#                 else:
#                     rating = 2
#                     evidence = (
#                         f"Candidate mentioned {skill.name}, but the response "
#                         f"contained limited supporting detail."
#                     )

#             scores.append(
#                 ScoredSkill(
#                     skill_id=skill.skill_id,
#                     rating=rating,
#                     evidence=evidence,
#                 )
#             )

#         average = sum(score.rating for score in scores) / len(scores)

#         if average >= 4:
#             fit_score = "High"
#         elif average >= 3:
#             fit_score = "Medium"
#         else:
#             fit_score = "Low"

#         return InterviewScore(
#             skills=scores,
#             fit_score=fit_score,
#             summary=(
#                 "The candidate completed the interview.\n"
#                 f"The candidate demonstrated an average skill rating "
#                 f"of {average:.1f}/5.\n"
#                 f"Overall fit was assessed as {fit_score}."
#             ),
#         )