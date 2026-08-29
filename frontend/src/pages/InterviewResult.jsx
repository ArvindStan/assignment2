import { useEffect, useMemo, useState } from "react";
import { getInterviewResult } from "../api/client";

function InterviewResult({ token }) {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadResult() {
            try {
                setLoading(true);
                setError("");

                const data =
                    await getInterviewResult(token);

                setResult(data);
            } catch (err) {
                setError(
                    err.message ||
                        "Unable to load interview results."
                );
            } finally {
                setLoading(false);
            }
        }

        if (token) {
            loadResult();
        } else {
            setLoading(false);
            setError("Invalid interview link.");
        }
    }, [token]);

    const scoreValue = useMemo(() => {
        if (!result?.fit_score) {
            return 0;
        }

        const numeric =
            parseFloat(result.fit_score);

        if (Number.isNaN(numeric)) {
            return 0;
        }

        return Math.min(
            100,
            Math.max(0, numeric)
        );
    }, [result]);

    if (loading) {
        return (
            <div className="result-page">
                <ResultTopbar />

                <main className="result-container">
                    <div className="result-state-card">
                        <div className="result-spinner"></div>

                        <h2>
                            Preparing your results
                        </h2>

                        <p>
                            We're putting together
                            your interview evaluation.
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="result-page">
                <ResultTopbar />

                <main className="result-container">
                    <div className="result-state-card result-error-state">
                        <div className="result-state-icon">
                            !
                        </div>

                        <h2>
                            Unable to load results
                        </h2>

                        <p>{error}</p>

                        <button
                            type="button"
                            className="result-secondary-button"
                            onClick={() => {
                                window.location.href =
                                    `/interview/${token}`;
                            }}
                        >
                            ← Back to Interview
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="result-page">
                <ResultTopbar />

                <main className="result-container">
                    <div className="result-state-card">
                        <div className="result-state-icon">
                            ?
                        </div>

                        <h2>
                            No results found
                        </h2>

                        <p>
                            There are no results
                            available for this
                            interview yet.
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="result-page">
            <ResultTopbar />

            <main className="result-container">
                <section className="result-hero">
                    <div>
                        <div className="result-eyebrow">
                            INTERVIEW COMPLETE
                        </div>

                        <h1>
                            Your interview
                            <span> results.</span>
                        </h1>

                        <p>
                            Thank you for completing
                            the technical assessment.
                            Here's a summary of your
                            evaluation.
                        </p>
                    </div>

                    <div className="result-complete-badge">
                        <span>✓</span>
                        Assessment completed
                    </div>
                </section>

                <section className="result-summary-grid">
                    <div className="result-score-card">
                        <div className="score-card-header">
                            <div>
                                <span>
                                    OVERALL FIT
                                </span>

                                <h2>
                                    Candidate Fit
                                </h2>
                            </div>

                            <div className="score-icon">
                                ★
                            </div>
                        </div>

                        <div className="score-display">
                            <div className="score-circle">
                                <div>
                                    <strong>
                                        {result.fit_score}
                                    </strong>

                                    <span>
                                        / 100
                                    </span>
                                </div>
                            </div>

                            <div className="score-description">
                                <strong>
                                    Overall assessment
                                </strong>

                                <p>
                                    Based on the
                                    candidate's
                                    responses across
                                    the evaluated
                                    skills.
                                </p>
                            </div>
                        </div>

                        <div className="score-progress">
                            <div
                                style={{
                                    width: `${scoreValue}%`,
                                }}
                            ></div>
                        </div>
                    </div>

                    <div className="result-info-card">
                        <div className="result-info-header">
                            <span>
                                INTERVIEW DETAILS
                            </span>

                            <div className="result-live-status">
                                <span></span>
                                COMPLETE
                            </div>
                        </div>

                        <div className="result-info-row">
                            <span>
                                INTERVIEW ID
                            </span>

                            <strong>
                                {result.interview_id}
                            </strong>
                        </div>

                        <div className="result-info-row">
                            <span>STATUS</span>

                            <strong className="result-complete-text">
                                {result.status}
                            </strong>
                        </div>
                    </div>
                </section>

                <section className="result-section">
                    <div className="result-section-heading">
                        <div>
                            <span>
                                EVALUATION SUMMARY
                            </span>

                            <h2>
                                Overall assessment
                            </h2>
                        </div>
                    </div>

                    <div className="result-summary-card">
                        <div className="summary-icon">
                            ✦
                        </div>

                        <div>
                            <h3>
                                Interview feedback
                            </h3>

                            <p>
                                {result.summary}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="result-section">
                    <div className="result-section-heading">
                        <div>
                            <span>
                                SKILL EVALUATION
                            </span>

                            <h2>
                                Performance by skill
                            </h2>
                        </div>

                        <span className="skill-count">
                            {result.skill_scores?.length ||
                                0}{" "}
                            skills evaluated
                        </span>
                    </div>

                    <div className="result-skills-grid">
                        {result.skill_scores?.map(
                            (skill) => {
                                const rating =
                                    Number(
                                        skill.rating
                                    ) || 0;

                                const ratingPercent =
                                    Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            (rating /
                                                5) *
                                                100
                                        )
                                    );

                                return (
                                    <article
                                        className="result-skill-card"
                                        key={
                                            skill.skill_id
                                        }
                                    >
                                        <div className="skill-card-top">
                                            <div className="skill-result-icon">
                                                {skill.skill
                                                    ?.charAt(
                                                        0
                                                    )
                                                    ?.toUpperCase() ||
                                                    "S"}
                                            </div>

                                            <div>
                                                <span>
                                                    SKILL
                                                </span>

                                                <h3>
                                                    {
                                                        skill.skill
                                                    }
                                                </h3>
                                            </div>

                                            <div className="skill-rating">
                                                <strong>
                                                    {
                                                        skill.rating
                                                    }
                                                </strong>

                                                <span>
                                                    /5
                                                </span>
                                            </div>
                                        </div>

                                        <div className="skill-rating-track">
                                            <div
                                                style={{
                                                    width: `${ratingPercent}%`,
                                                }}
                                            ></div>
                                        </div>

                                        <div className="skill-result-footer">
                                            <span>
                                                Skill ID
                                            </span>

                                            <strong>
                                                {
                                                    skill.skill_id
                                                }
                                            </strong>
                                        </div>
                                    </article>
                                );
                            }
                        )}
                    </div>
                </section>

                <section className="result-actions">
                    <div>
                        <strong>
                            Ready for another
                            assessment?
                        </strong>

                        <span>
                            Return to the hiring
                            platform and create a
                            new job.
                        </span>
                    </div>

                    <button
                        type="button"
                        className="result-primary-button"
                        onClick={() => {
                            window.location.href =
                                "/";
                        }}
                    >
                        Create Another Job →
                    </button>
                </section>

                <footer className="result-footer">
                    <span>
                        Hiring Platform · Technical
                        Interview Evaluation
                    </span>

                    <span>
                        Results generated from
                        candidate responses
                    </span>
                </footer>
            </main>
        </div>
    );
}

function ResultTopbar() {
    return (
        <header className="result-topbar">
            <div className="result-brand">
                <div className="result-brand-mark">
                    H
                </div>

                <div>
                    <div className="result-brand-name">
                        Hiring Platform
                    </div>

                    <div className="result-brand-subtitle">
                        Interview Results
                    </div>
                </div>
            </div>

            <div className="result-secure-badge">
                <span>✓</span>
                Evaluation complete
            </div>
        </header>
    );
}

export default InterviewResult;