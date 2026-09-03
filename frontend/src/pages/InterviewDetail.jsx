import { useEffect, useState } from "react";

import { getInterviewDetail } from "../api/client";


function InterviewDetail({ interviewId }) {
    const [interview, setInterview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {
        async function loadInterview() {
            try {
                setLoading(true);
                setError("");

                const data =
                    await getInterviewDetail(interviewId);

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
                return "status-not-started";

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


    function getRatingLabel(rating) {
        const value = Number(rating);

        if (value >= 5) {
            return "Excellent";
        }

        if (value >= 4) {
            return "Strong";
        }

        if (value >= 3) {
            return "Good";
        }

        if (value >= 2) {
            return "Needs Improvement";
        }

        return "Weak";
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


    const answeredQuestions = questions.filter(
        (question) => question.answer
    ).length;


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


            <main className="recruiter-container recruiter-detail-page">

                {/* =========================================
                    ASSESSMENT HEADER
                ========================================== */}

                <section className="detail-hero">

                    <div className="detail-hero-main">

                        <div className="detail-breadcrumb">
                            <a href="/recruiter">
                                Recruiter
                            </a>

                            <span>
                                /
                            </span>

                            <span>
                                Interview Review
                            </span>
                        </div>


                        <span className="recruiter-eyebrow">
                            CANDIDATE ASSESSMENT
                        </span>


                        <h1>
                            {interview.job?.title ||
                                "Interview"}
                        </h1>


                        <div className="detail-id-row">

                            <span>
                                Interview ID
                            </span>

                            <code>
                                {interview.interview_id}
                            </code>

                        </div>

                    </div>


                    <div className="detail-hero-status">

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

                    </div>

                </section>


                {/* =========================================
                    QUICK STATS
                ========================================== */}

                <section className="detail-stats-grid">

                    <div className="detail-stat-card">

                        <span className="detail-stat-icon">
                            ✓
                        </span>

                        <div>
                            <span>
                                Answered
                            </span>

                            <strong>
                                {answeredQuestions}
                                <small>
                                    /{questions.length}
                                </small>
                            </strong>
                        </div>

                    </div>


                    <div className="detail-stat-card">

                        <span className="detail-stat-icon">
                            ✦
                        </span>

                        <div>
                            <span>
                                Skills Evaluated
                            </span>

                            <strong>
                                {skillScores.length}
                            </strong>
                        </div>

                    </div>


                    <div className="detail-stat-card">

                        <span className="detail-stat-icon">
                            ?
                        </span>

                        <div>
                            <span>
                                Questions
                            </span>

                            <strong>
                                {questions.length}
                            </strong>
                        </div>

                    </div>


                    <div className="detail-stat-card">

                        <span className="detail-stat-icon">
                            ●
                        </span>

                        <div>
                            <span>
                                Interview Status
                            </span>

                            <strong className="detail-stat-status">
                                {getStatusLabel(
                                    interview.status
                                )}
                            </strong>
                        </div>

                    </div>

                </section>


                {/* =========================================
                    AI RESULT
                ========================================== */}

                {result && (
                    <section className="detail-section">

                        <div className="section-heading">

                            <div>
                                <span className="panel-label">
                                    AI EVALUATION
                                </span>

                                <h2>
                                    Overall Assessment
                                </h2>

                                <p>
                                    AI-generated assessment
                                    based on the candidate's
                                    interview responses.
                                </p>
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
                                    OVERALL FIT
                                </span>

                                <strong>
                                    {result.fit_score || "—"}
                                </strong>

                                <small>
                                    AI Assessment
                                </small>

                            </div>


                            <div className="detail-summary">

                                <span>
                                    RECRUITER SUMMARY
                                </span>

                                <p>
                                    {result.summary ||
                                        "No summary available."}
                                </p>

                            </div>

                        </div>

                    </section>
                )}


                {/* =========================================
                    INTERVIEW INFORMATION
                ========================================== */}

                <section className="detail-section">

                    <div className="section-heading">

                        <div>
                            <span className="panel-label">
                                INTERVIEW INFORMATION
                            </span>

                            <h2>
                                Interview Timeline
                            </h2>
                        </div>

                    </div>


                    <div className="detail-info-grid">

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
                                Job
                            </span>

                            <strong>
                                {interview.job?.title ||
                                    "—"}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* =========================================
                    SKILL SCORES
                ========================================== */}

                <section className="detail-section">

                    <div className="section-heading">

                        <div>
                            <span className="panel-label">
                                SKILL EVALUATION
                            </span>

                            <h2>
                                Technical Skills
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
                                (score) => {

                                    const rating =
                                        Math.min(
                                            5,
                                            Math.max(
                                                0,
                                                Number(
                                                    score.rating
                                                ) || 0
                                            )
                                        );

                                    return (
                                        <div
                                            key={
                                                score.id ||
                                                score.skill_id ||
                                                score.skill
                                            }
                                            className="skill-score-card"
                                        >

                                            <div className="skill-score-header">

                                                <div>

                                                    <span>
                                                        SKILL
                                                    </span>

                                                    <h3>
                                                        {
                                                            score.skill_name ||
                                                            score.skill?.name ||
                                                            score.skill
                                                        }
                                                    </h3>

                                                </div>


                                                <div className="skill-rating">

                                                    <strong>
                                                        {rating}
                                                    </strong>

                                                    <small>
                                                        /5
                                                    </small>

                                                </div>

                                            </div>


                                            <div className="score-bar">

                                                <div
                                                    className="score-bar-fill"
                                                    style={{
                                                        width:
                                                            `${rating * 20}%`,
                                                    }}
                                                />

                                            </div>


                                            <div className="skill-score-footer">

                                                <span>
                                                    {getRatingLabel(
                                                        rating
                                                    )}
                                                </span>

                                                <span>
                                                    {rating * 20}%
                                                </span>

                                            </div>

                                        </div>
                                    );
                                }
                            )}

                        </div>
                    )}

                </section>


                {/* =========================================
                    QUESTIONS & ANSWERS
                ========================================== */}

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
                                Review each response,
                                transcript, and audio
                                recording.
                            </p>
                        </div>

                        <div className="response-count">
                            {answeredQuestions}
                            <span>
                                /{questions.length} answered
                            </span>
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


                                            <div className="detail-question-content">

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

                                            <div className="answer-label-row">

                                                <span className="answer-label">
                                                    CANDIDATE ANSWER
                                                </span>

                                                {question.answer && (
                                                    <span className="answered-badge">
                                                        Answered
                                                    </span>
                                                )}

                                            </div>


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

                                                        <div className="transcript-header">

                                                            <span>
                                                                TRANSCRIPT
                                                            </span>

                                                        </div>

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

                                                                <div>

                                                                    <span>
                                                                        AUDIO RECORDING
                                                                    </span>

                                                                    <small>
                                                                        Candidate response
                                                                    </small>

                                                                </div>


                                                                <a
                                                                    href={
                                                                        question
                                                                            .answer
                                                                            .audio_url
                                                                    }
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    Open Audio ↗
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
                                                                Your browser
                                                                does not support
                                                                the audio player.
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


                {/* =========================================
                    FOOTER
                ========================================== */}

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