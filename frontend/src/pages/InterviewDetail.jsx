import { useEffect, useState } from "react";

import { getInterviewDetail } from "../api/client";


function InterviewDetail({ interviewId }) {
    const [interview, setInterview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    /*
     * Load recruiter interview details.
     */
    useEffect(() => {
        async function loadInterview() {
            try {
                setLoading(true);
                setError("");

                const data =
                    await getInterviewDetail(
                        interviewId
                    );

                setInterview(data);
            } catch (err) {
                setError(
                    err.message ||
                    "Failed to load interview details."
                );
            } finally {
                setLoading(false);
            }
        }

        if (interviewId) {
            loadInterview();
        }
    }, [interviewId]);


    function formatDate(value) {
        if (!value) {
            return "—";
        }

        return new Date(value).toLocaleString();
    }


    function getStatusClass(status) {
        switch (status) {
            case "completed":
                return "status-completed";

            case "in_progress":
                return "status-in-progress";

            case "not_started":
            default:
                return "status-not-started";
        }
    }


    function getStatusLabel(status) {
        switch (status) {
            case "completed":
                return "Completed";

            case "in_progress":
                return "In Progress";

            case "not_started":
                return "Not Started";

            default:
                return status || "Unknown";
        }
    }


    function getFitScoreClass(score) {
        switch (score) {
            case "High":
                return "fit-high";

            case "Medium":
                return "fit-medium";

            case "Low":
                return "fit-low";

            default:
                return "";
        }
    }


    if (loading) {
        return (
            <div className="recruiter-page">

                <header className="recruiter-topbar">
                    <div>
                        <div className="recruiter-brand">
                            Hiring Interview
                        </div>

                        <div className="recruiter-subtitle">
                            Recruiter Dashboard
                        </div>
                    </div>

                    <a
                        href="/recruiter"
                        className="recruiter-home-link"
                    >
                        ← Back to Interviews
                    </a>
                </header>

                <main className="recruiter-container">
                    <div className="recruiter-state">
                        <div className="state-spinner" />

                        <h2>
                            Loading interview...
                        </h2>

                        <p>
                            Fetching interview questions,
                            answers, and evaluation results.
                        </p>
                    </div>
                </main>

            </div>
        );
    }


    if (error) {
        return (
            <div className="recruiter-page">

                <header className="recruiter-topbar">
                    <div>
                        <div className="recruiter-brand">
                            Hiring Interview
                        </div>

                        <div className="recruiter-subtitle">
                            Recruiter Dashboard
                        </div>
                    </div>

                    <a
                        href="/recruiter"
                        className="recruiter-home-link"
                    >
                        ← Back to Interviews
                    </a>
                </header>

                <main className="recruiter-container">

                    <div className="recruiter-state error-state">

                        <div className="state-icon">
                            !
                        </div>

                        <h2>
                            Unable to load interview
                        </h2>

                        <p>
                            {error}
                        </p>

                        <a
                            href="/recruiter"
                            className="recruiter-primary-button"
                        >
                            Back to Dashboard
                        </a>

                    </div>

                </main>

            </div>
        );
    }


    if (!interview) {
        return null;
    }


    const questions = interview.questions || [];
    const skillScores = interview.skill_scores || [];
    const result = interview.result;


    return (
        <div className="recruiter-page">

            {/* ==========================================
                TOP BAR
            =========================================== */}

            <header className="recruiter-topbar">

                <div>
                    <div className="recruiter-brand">
                        Hiring Interview
                    </div>

                    <div className="recruiter-subtitle">
                        Recruiter Dashboard
                    </div>
                </div>

                <a
                    href="/recruiter"
                    className="recruiter-home-link"
                >
                    ← Back to Interviews
                </a>

            </header>


            <main className="recruiter-container">

                {/* ======================================
                    HEADER
                ======================================= */}

                <section className="detail-header">

                    <div className="detail-header-main">

                        <span className="recruiter-eyebrow">
                            INTERVIEW REVIEW
                        </span>

                        <h1>
                            {interview.job?.title ||
                                "Interview"}
                        </h1>

                        <p className="detail-interview-id">
                            Interview ID:
                            <code>
                                {interview.interview_id}
                            </code>
                        </p>

                    </div>


                    <span
                        className={
                            `status-badge large-status ${
                                getStatusClass(
                                    interview.status
                                )
                            }`
                        }
                    >
                        {getStatusLabel(
                            interview.status
                        )}
                    </span>

                </section>


                {/* ======================================
                    INTERVIEW INFORMATION
                ======================================= */}

                <section className="detail-info-grid">

                    <div className="detail-info-card">
                        <span>
                            Created
                        </span>

                        <strong>
                            {formatDate(
                                interview.created_at
                            )}
                        </strong>
                    </div>


                    <div className="detail-info-card">
                        <span>
                            Expires
                        </span>

                        <strong>
                            {formatDate(
                                interview.expires_at
                            )}
                        </strong>
                    </div>


                    <div className="detail-info-card">
                        <span>
                            Completed / Used
                        </span>

                        <strong>
                            {formatDate(
                                interview.used_at
                            )}
                        </strong>
                    </div>


                    <div className="detail-info-card">
                        <span>
                            Questions
                        </span>

                        <strong>
                            {questions.length}
                        </strong>
                    </div>

                </section>


                {/* ======================================
                    AI RESULT
                ======================================= */}

                {result && (
                    <section className="detail-result-section">

                        <div className="section-heading">

                            <div>
                                <span className="panel-label">
                                    AI EVALUATION
                                </span>

                                <h2>
                                    Overall Result
                                </h2>
                            </div>

                        </div>


                        <div className="detail-result-card">

                            <div
                                className={
                                    `detail-fit-score ${
                                        getFitScoreClass(
                                            result.fit_score
                                        )
                                    }`
                                }
                            >
                                <span>
                                    Overall Fit
                                </span>

                                <strong>
                                    {result.fit_score}
                                </strong>
                            </div>


                            <div className="detail-summary">

                                <span>
                                    AI Summary
                                </span>

                                <p>
                                    {result.summary ||
                                        "No summary available."}
                                </p>

                            </div>

                        </div>

                    </section>
                )}


                {/* ======================================
                    SKILL SCORES
                ======================================= */}

                <section className="detail-section">

                    <div className="section-heading">

                        <div>
                            <span className="panel-label">
                                SKILL EVALUATION
                            </span>

                            <h2>
                                Skill Scores
                            </h2>

                            <p>
                                AI-generated ratings based
                                on the candidate's transcript
                                content.
                            </p>
                        </div>

                    </div>


                    {skillScores.length === 0 ? (
                        <div className="detail-empty">
                            Skill scores are not available
                            yet.
                        </div>
                    ) : (
                        <div className="skill-score-grid">

                            {skillScores.map(
                                (score) => (
                                    <div
                                        key={score.id ||
                                            score.skill_id ||
                                            score.skill}
                                        className="skill-score-card"
                                    >

                                        <div className="skill-score-header">

                                            <div>
                                                <span>
                                                    Skill
                                                </span>

                                                <h3>
                                                    {
                                                        score.skill_name ||
                                                        score.skill?.name ||
                                                        score.skill
                                                    }
                                                </h3>
                                            </div>

                                            <strong>
                                                {score.rating}
                                                <small>
                                                    /5
                                                </small>
                                            </strong>

                                        </div>


                                        <div className="score-bar">

                                            <div
                                                className="score-bar-fill"
                                                style={{
                                                    width: `${
                                                        Math.min(
                                                            5,
                                                            Math.max(
                                                                0,
                                                                Number(
                                                                    score.rating
                                                                ) || 0
                                                            )
                                                        ) * 20
                                                    }%`,
                                                }}
                                            />

                                        </div>

                                    </div>
                                )
                            )}

                        </div>
                    )}

                </section>


                {/* ======================================
                    QUESTIONS + ANSWERS
                ======================================= */}

                <section className="detail-section">

                    <div className="section-heading">

                        <div>
                            <span className="panel-label">
                                CANDIDATE RESPONSES
                            </span>

                            <h2>
                                Questions & Answers
                            </h2>

                            <p>
                                Review the candidate's
                                responses and recorded
                                audio.
                            </p>
                        </div>

                    </div>


                    {questions.length === 0 ? (
                        <div className="detail-empty">
                            No questions are available
                            for this interview.
                        </div>
                    ) : (
                        <div className="detail-question-list">

                            {questions.map(
                                (question, index) => (
                                    <article
                                        key={question.id}
                                        className="detail-question-card"
                                    >

                                        {/* Question */}

                                        <div className="detail-question-header">

                                            <div className="question-number">
                                                {String(
                                                    index + 1
                                                ).padStart(
                                                    2,
                                                    "0"
                                                )}
                                            </div>

                                            <div>

                                                <span className="question-skill">
                                                    {
                                                        question.skill_name ||
                                                        question.skill?.name ||
                                                        "Skill"
                                                    }
                                                </span>

                                                <h3>
                                                    {
                                                        question.question
                                                    }
                                                </h3>

                                            </div>

                                        </div>


                                        {/* Answer */}

                                        <div className="detail-answer">

                                            <span className="answer-label">
                                                CANDIDATE ANSWER
                                            </span>


                                            {!question.answer ? (
                                                <div className="unanswered">

                                                    <span>
                                                        —
                                                    </span>

                                                    <p>
                                                        No answer
                                                        submitted.
                                                    </p>

                                                </div>
                                            ) : (
                                                <>
                                                    <div className="transcript-box">

                                                        <p>
                                                            {
                                                                question
                                                                    .answer
                                                                    .transcript ||
                                                                "No transcript available."
                                                            }
                                                        </p>

                                                    </div>


                                                    {question
                                                        .answer
                                                        .audio_url && (
                                                        <div className="audio-box">

                                                            <div className="audio-header">

                                                                <span>
                                                                    AUDIO RECORDING
                                                                </span>

                                                                <a
                                                                    href={
                                                                        question
                                                                            .answer
                                                                            .audio_url
                                                                    }
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    Open Audio
                                                                </a>

                                                            </div>

                                                            <audio
                                                                controls
                                                                preload="metadata"
                                                                src={
                                                                    question
                                                                        .answer
                                                                        .audio_url
                                                                }
                                                            >
                                                                Your browser does
                                                                not support the
                                                                audio player.
                                                            </audio>

                                                        </div>
                                                    )}

                                                </>
                                            )}

                                        </div>

                                    </article>
                                )
                            )}

                        </div>
                    )}

                </section>


                {/* ======================================
                    FOOTER ACTION
                ======================================= */}

                <div className="detail-footer">

                    <a
                        href="/recruiter"
                        className="recruiter-secondary-button"
                    >
                        ← Back to Interviews
                    </a>

                </div>

            </main>

        </div>
    );
}


export default InterviewDetail;
