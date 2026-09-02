from typing import TypedDict

from django.conf import settings
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field


class GeneratedQuestion(BaseModel):
    skill_id: str = Field(
        description="The skill_id this question evaluates."
    )
    question: str = Field(
        description="A technical interview question for the skill."
    )


class GeneratedQuestions(BaseModel):
    questions: list[GeneratedQuestion] = Field(
        min_length=5,
        max_length=5,
        description="Exactly five generated interview questions.",
    )


class SkillEvaluation(BaseModel):
    skill_id: str = Field(
        description="The skill being evaluated."
    )
    rating: int = Field(
        ge=1,
        le=5,
        description="Candidate rating from 1 to 5.",
    )
    evidence: str = Field(
        description=(
            "Brief explanation based on the candidate's "
            "actual transcript."
        )
    )


class InterviewScore(BaseModel):
    skills: list[SkillEvaluation] = Field(
        description="Evaluation for every required skill."
    )
    fit_score: str = Field(
        description=(
            "Overall candidate fit. Must be High, Medium, or Low."
        )
    )
    summary: str = Field(
        description="Brief overall interview summary."
    )


class QuestionGenerationState(TypedDict, total=False):
    skills: list[dict]
    skills_text: str
    result: GeneratedQuestions | None
    validation_error: str | None


class InterviewScoringState(TypedDict, total=False):
    skills: list[dict]
    skills_text: str
    transcripts: dict[str, str]
    transcripts_text: str
    result: InterviewScore | None
    validation_error: str | None


class AIService:
    """
    Real AI service using OpenAI, LangChain, LangGraph,
    and Pydantic structured output.

    Question generation graph:
        START
          -> prepare_question_context
          -> generate_questions
          -> validate_questions
          -> END

    Interview scoring graph:
        START
          -> prepare_scoring_context
          -> evaluate_transcripts
          -> validate_scores
          -> END
    """

    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError(
                "OPENAI_API_KEY is not configured. "
                "Add it to your .env file."
            )

        self.llm = ChatOpenAI(
            model=settings.OPENAI_MODEL,
            api_key=settings.OPENAI_API_KEY,
            temperature=0.3,
        )

        self.question_graph = (
            self._build_question_generation_graph()
        )

        self.scoring_graph = (
            self._build_interview_scoring_graph()
        )

    # ------------------------------------------------------------------
    # Question generation graph
    # ------------------------------------------------------------------

    def _build_question_generation_graph(self):
        graph = StateGraph(QuestionGenerationState)

        graph.add_node(
            "prepare_question_context",
            self._prepare_question_context,
        )

        graph.add_node(
            "generate_questions",
            self._generate_questions_node,
        )

        graph.add_node(
            "validate_questions",
            self._validate_questions_node,
        )

        graph.add_edge(
            START,
            "prepare_question_context",
        )

        graph.add_edge(
            "prepare_question_context",
            "generate_questions",
        )

        graph.add_edge(
            "generate_questions",
            "validate_questions",
        )

        graph.add_edge(
            "validate_questions",
            END,
        )

        return graph.compile()

    def _prepare_question_context(
        self,
        state: QuestionGenerationState,
    ):
        skills_text = "\n".join(
            [
                (
                    f"- skill_id: {skill['skill_id']}\n"
                    f"  name: {skill['name']}\n"
                    f"  dimension: {skill['dimension']}"
                )
                for skill in state["skills"]
            ]
        )

        return {
            "skills_text": skills_text,
            "validation_error": None,
        }

    def _generate_questions_node(
        self,
        state: QuestionGenerationState,
    ):
        structured_llm = self.llm.with_structured_output(
            GeneratedQuestions
        )

        system_message = SystemMessage(
            content=(
                "You are an expert technical interviewer. "
                "Generate exactly five high-quality technical "
                "interview questions.\n\n"
                "Rules:\n"
                "1. Questions must be relevant to the provided skills.\n"
                "2. Questions should assess practical knowledge, "
                "reasoning, and real-world experience.\n"
                "3. Do not generate generic HR questions.\n"
                "4. Every question must reference one of the provided "
                "skill_id values.\n"
                "5. Use the exact skill_id values provided.\n"
                "6. Return exactly five questions.\n"
                "7. Distribute questions across the skills as fairly "
                "as possible."
            )
        )

        human_message = HumanMessage(
            content=(
                "Generate five interview questions for these skills:\n\n"
                f"{state['skills_text']}"
            )
        )

        result = structured_llm.invoke(
            [
                system_message,
                human_message,
            ]
        )

        return {
            "result": result,
        }

    def _validate_questions_node(
        self,
        state: QuestionGenerationState,
    ):
        generated = state.get("result")

        if not generated:
            raise ValueError(
                "AI failed to generate interview questions."
            )

        valid_skill_ids = {
            skill["skill_id"]
            for skill in state["skills"]
        }

        invalid_questions = [
            question
            for question in generated.questions
            if question.skill_id not in valid_skill_ids
        ]

        if invalid_questions:
            raise ValueError(
                "AI generated a question for an unknown skill."
            )

        if len(generated.questions) != 5:
            raise ValueError(
                "AI must generate exactly five questions."
            )

        return {
            "validation_error": None,
        }

    # ------------------------------------------------------------------
    # Interview scoring graph
    # ------------------------------------------------------------------

    def _build_interview_scoring_graph(self):
        graph = StateGraph(InterviewScoringState)

        graph.add_node(
            "prepare_scoring_context",
            self._prepare_scoring_context,
        )

        graph.add_node(
            "evaluate_transcripts",
            self._score_interview_node,
        )

        graph.add_node(
            "validate_scores",
            self._validate_scores_node,
        )

        graph.add_edge(
            START,
            "prepare_scoring_context",
        )

        graph.add_edge(
            "prepare_scoring_context",
            "evaluate_transcripts",
        )

        graph.add_edge(
            "evaluate_transcripts",
            "validate_scores",
        )

        graph.add_edge(
            "validate_scores",
            END,
        )

        return graph.compile()

    def _prepare_scoring_context(
        self,
        state: InterviewScoringState,
    ):
        skills_text = "\n".join(
            [
                (
                    f"- skill_id: {skill['skill_id']}\n"
                    f"  name: {skill['name']}\n"
                    f"  dimension: {skill['dimension']}"
                )
                for skill in state["skills"]
            ]
        )

        transcripts_text = "\n\n".join(
            [
                (
                    f"Skill ID: {skill_id}\n"
                    f"Candidate transcript:\n{transcript}"
                )
                for skill_id, transcript in state[
                    "transcripts"
                ].items()
            ]
        )

        return {
            "skills_text": skills_text,
            "transcripts_text": transcripts_text,
            "validation_error": None,
        }

    def _score_interview_node(
        self,
        state: InterviewScoringState,
    ):
        structured_llm = self.llm.with_structured_output(
            InterviewScore
        )

        system_message = SystemMessage(
            content=(
                "You are an expert technical interviewer evaluating "
                "candidate interview transcripts.\n\n"
                "Evaluate the semantic quality and technical correctness "
                "of the candidate's answers.\n\n"
                "Do NOT score based on transcript length or word count.\n"
                "Score based on:\n"
                "- Technical correctness\n"
                "- Depth of understanding\n"
                "- Practical experience\n"
                "- Quality of reasoning\n"
                "- Relevance to the required skill\n\n"
                "For every required skill, return a rating from 1 to 5:\n"
                "1 = Very weak or no demonstrated understanding\n"
                "2 = Basic understanding with significant gaps\n"
                "3 = Adequate working knowledge\n"
                "4 = Strong practical understanding\n"
                "5 = Expert-level understanding\n\n"
                "Fit score must be exactly one of: High, Medium, Low.\n"
                "Provide evidence based only on the candidate transcripts."
            )
        )

        human_message = HumanMessage(
            content=(
                "Required skills:\n\n"
                f"{state['skills_text']}\n\n"
                "Candidate transcripts:\n\n"
                f"{state['transcripts_text']}\n\n"
                "Evaluate every required skill, even if the candidate "
                "provided weak or missing evidence."
            )
        )

        result = structured_llm.invoke(
            [
                system_message,
                human_message,
            ]
        )

        return {
            "result": result,
        }

    def _validate_scores_node(
        self,
        state: InterviewScoringState,
    ):
        score = state.get("result")

        if not score:
            raise ValueError(
                "AI failed to score the interview."
            )

        valid_skill_ids = {
            skill["skill_id"]
            for skill in state["skills"]
        }

        returned_skill_ids = {
            skill_score.skill_id
            for skill_score in score.skills
        }

        unknown_skill_ids = (
            returned_skill_ids - valid_skill_ids
        )

        if unknown_skill_ids:
            raise ValueError(
                "AI returned scores for unknown skills."
            )

        missing_skill_ids = (
            valid_skill_ids - returned_skill_ids
        )

        if missing_skill_ids:
            raise ValueError(
                "AI did not score every required skill."
            )

        if score.fit_score not in {
            "High",
            "Medium",
            "Low",
        }:
            raise ValueError(
                "AI returned an invalid fit score."
            )

        return {
            "validation_error": None,
        }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate_questions(self, skills):
        skill_data = [
            {
                "skill_id": skill.skill_id,
                "name": skill.name,
                "dimension": skill.dimension,
            }
            for skill in skills
        ]

        result = self.question_graph.invoke(
            {
                "skills": skill_data,
                "result": None,
                "validation_error": None,
            }
        )

        generated = result.get("result")

        if not generated:
            raise ValueError(
                "AI failed to generate interview questions."
            )

        return generated

    def score_interview(self, skills, transcripts):
        skill_data = [
            {
                "skill_id": skill.skill_id,
                "name": skill.name,
                "dimension": skill.dimension,
            }
            for skill in skills
        ]

        result = self.scoring_graph.invoke(
            {
                "skills": skill_data,
                "transcripts": transcripts,
                "result": None,
                "validation_error": None,
            }
        )

        score = result.get("result")

        if not score:
            raise ValueError(
                "AI failed to score the interview."
            )

        return score