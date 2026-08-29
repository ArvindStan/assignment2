import { useEffect, useState } from "react";
import {
    getInterview,
    submitAnswer,
    submitAudioAnswer,
} from "../api/client";

function CandidateInterview({ token }) {
    const [interview, setInterview] = useState(null);
    const [answers, setAnswers] = useState({});
    const [audioFiles, setAudioFiles] = useState({});
    const [submittedQuestions, setSubmittedQuestions] = useState(
        new Set()
    );

    const [loading, setLoading] = useState(true);
    const [submittingQuestion, setSubmittingQuestion] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        async function loadInterview() {
            try {
                setLoading(true);
                setError("");

                const data = await getInterview(token);

                setInterview(data);
            } catch (err) {
                setError(
                    err.message ||
                        "Unable to load interview."
                );
            } finally {
                setLoading(false);
            }
        }

        if (token) {
            loadInterview();
        } else {
            setLoading(false);
            setError("Invalid interview link.");
        }
    }, [token]);

    const handleTextChange = (questionId, value) => {
        setAnswers((previous) => ({
            ...previous,
            [questionId]: value,
        }));

        setSuccess("");
        setError("");
    };

    const handleAudioChange = (questionId, file) => {
        if (!file) {
            return;
        }

        setAudioFiles((previous) => ({
            ...previous,
            [questionId]: file,
        }));

        setSuccess("");
        setError("");
    };

    const handleSubmit = async (question) => {
        const questionId = question.id;

        const transcript =
            answers[questionId]?.trim();

        const audioFile =
            audioFiles[questionId];

        if (!transcript && !audioFile) {
            setError(
                `Please provide a text or audio answer for Question ${question.order}.`
            );
            return;
        }

        try {
            setSubmittingQuestion(questionId);
            setError("");
            setSuccess("");

            let result;

            if (audioFile && !transcript) {
                result = await submitAudioAnswer(
                    token,
                    questionId,
                    audioFile
                );
            } else {
                result = await submitAnswer(
                    token,
                    questionId,
                    transcript
                );
            }

            setSubmittedQuestions(
                (previous) => {
                    const next = new Set(previous);
                    next.add(questionId);
                    return next;
                }
            );

            if (result.status === "completed") {
                window.location.href =
                    `/interview/${token}/result`;

                return;
            }

            setInterview((previous) => ({
                ...previous,
                status: result.status,
            }));

            setSuccess(
                `Question ${question.order} submitted successfully.`
            );
        } catch (err) {
            setError(
                err.message ||
                    "Unable to submit your answer."
            );
        } finally {
            setSubmittingQuestion(null);
        }
    };

    if (loading) {
        return (
            <div className="candidate-page">
                <CandidateTopbar />

                <main className="candidate-container">
                    <div className="candidate-state-card">
                        <div className="candidate-spinner"></div>

                        <h2>
                            Loading your interview
                        </h2>

                        <p>
                            Preparing your assessment.
                            Please wait a moment.
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    if (error && !interview) {
        return (
            <div className="candidate-page">
                <CandidateTopbar />

                <main className="candidate-container">
                    <div className="candidate-state-card error-state">
                        <div className="state-icon error">
                            !
                        </div>

                        <h2>
                            Unable to load interview
                        </h2>

                        <p>{error}</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!interview) {
        return (
            <div className="candidate-page">
                <CandidateTopbar />

                <main className="candidate-container">
                    <div className="candidate-state-card error-state">
                        <div className="state-icon error">
                            !
                        </div>

                        <h2>
                            Interview not found
                        </h2>

                        <p>
                            This interview link may be
                            invalid or expired.
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    const totalQuestions =
        interview.questions?.length || 0;

    const answeredCount =
        submittedQuestions.size;

    const progress =
        totalQuestions > 0
            ? Math.round(
                  (answeredCount /
                      totalQuestions) *
                      100
              )
            : 0;

    return (
        <div className="candidate-page">
            <CandidateTopbar />

            <main className="candidate-container">
                <section className="candidate-hero">
                    <div className="candidate-hero-content">
                        <div className="candidate-eyebrow">
                            TECHNICAL ASSESSMENT
                        </div>

                        <h1>
                            Show us what{" "}
                            <span>you know.</span>
                        </h1>

                        <p>
                            Take your time and answer
                            each question clearly.
                            You can provide your
                            response using text or
                            audio.
                        </p>

                        <div className="candidate-highlights">
                            <span>
                                <b>✓</b>
                                Secure submission
                            </span>

                            <span>
                                <b>✓</b>
                                Technical evaluation
                            </span>

                            <span>
                                <b>✓</b>
                                {totalQuestions} questions
                            </span>
                        </div>
                    </div>

                    <div className="candidate-details-card">
                        <div className="details-header">
                            <span>
                                INTERVIEW DETAILS
                            </span>

                            <div className="live-status">
                                <span></span>
                                LIVE
                            </div>
                        </div>

                        <div className="detail-item">
                            <span>
                                INTERVIEW ID
                            </span>

                            <strong>
                                {interview.interview_id}
                            </strong>
                        </div>

                        <div className="detail-item">
                            <span>STATUS</span>

                            <strong className="candidate-status-value">
                                {interview.status}
                            </strong>
                        </div>
                    </div>
                </section>

                <section className="candidate-progress-card">
                    <div className="progress-heading">
                        <div>
                            <span>
                                YOUR PROGRESS
                            </span>

                            <strong>
                                {answeredCount} of{" "}
                                {totalQuestions} answered
                            </strong>
                        </div>

                        <strong className="progress-percent">
                            {progress}%
                        </strong>
                    </div>

                    <div className="candidate-progress-track">
                        <div
                            className="candidate-progress-fill"
                            style={{
                                width: `${progress}%`,
                            }}
                        ></div>
                    </div>

                    <p>
                        Complete each question to
                        finish your interview.
                    </p>
                </section>

                {error && (
                    <div className="candidate-alert candidate-alert-error">
                        <div className="alert-symbol">
                            !
                        </div>

                        <div>
                            <strong>
                                Something went wrong
                            </strong>

                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="candidate-alert candidate-alert-success">
                        <div className="alert-symbol">
                            ✓
                        </div>

                        <div>
                            <strong>
                                Answer submitted
                            </strong>

                            <span>{success}</span>
                        </div>
                    </div>
                )}

                <section className="candidate-questions-section">
                    <div className="candidate-section-heading">
                        <div>
                            <span>
                                INTERVIEW QUESTIONS
                            </span>

                            <h2>
                                Complete your assessment
                            </h2>
                        </div>

                        <strong>
                            {totalQuestions} questions
                        </strong>
                    </div>

                    <div className="candidate-question-list">
                        {interview.questions.map(
                            (question, index) => {
                                const questionId =
                                    question.id;

                                const isSubmitting =
                                    submittingQuestion ===
                                    questionId;

                                const isSubmitted =
                                    submittedQuestions.has(
                                        questionId
                                    );

                                const hasText =
                                    !!answers[
                                        questionId
                                    ]?.trim();

                                const hasAudio =
                                    !!audioFiles[
                                        questionId
                                    ];

                                return (
                                    <article
                                        className={`candidate-question-card ${
                                            isSubmitted
                                                ? "submitted"
                                                : ""
                                        }`}
                                        key={questionId}
                                    >
                                        <div className="candidate-question-header">
                                            <div className="candidate-question-index">
                                                {String(
                                                    index +
                                                        1
                                                ).padStart(
                                                    2,
                                                    "0"
                                                )}
                                            </div>

                                            <div>
                                                <span className="candidate-question-label">
                                                    QUESTION{" "}
                                                    {
                                                        question.order
                                                    }
                                                </span>

                                                {isSubmitted && (
                                                    <span className="question-completed">
                                                        ✓ Submitted
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="candidate-question-body">
                                            <h3>
                                                {
                                                    question.question
                                                }
                                            </h3>

                                            {question.skill && (
                                                <div className="candidate-skill-badge">
                                                    <span>
                                                        SKILL
                                                    </span>

                                                    {
                                                        question.skill
                                                    }
                                                </div>
                                            )}
                                        </div>

                                        <div className="candidate-answer-divider"></div>

                                        <div className="candidate-answer-grid">
                                            <div className="candidate-text-answer">
                                                <div className="answer-heading">
                                                    <div>
                                                        <strong>
                                                            Your answer
                                                        </strong>

                                                        <span>
                                                            Text
                                                            response
                                                        </span>
                                                    </div>

                                                    <span>
                                                        {(
                                                            answers[
                                                                questionId
                                                            ] ||
                                                            ""
                                                        ).length}{" "}
                                                        characters
                                                    </span>
                                                </div>

                                                <textarea
                                                    value={
                                                        answers[
                                                            questionId
                                                        ] ||
                                                        ""
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        handleTextChange(
                                                            questionId,
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="Write your answer here. Explain your reasoning clearly and include relevant examples where possible."
                                                    disabled={
                                                        isSubmitting ||
                                                        isSubmitted
                                                    }
                                                />

                                                <div className="answer-tip">
                                                    <span>
                                                        Recommended:
                                                    </span>{" "}
                                                    provide a
                                                    clear and
                                                    structured
                                                    response.
                                                </div>
                                            </div>

                                            <div className="answer-or">
                                                <span>OR</span>
                                            </div>

                                            <div className="candidate-audio-answer">
                                                <div className="audio-upload-icon">
                                                    🎙
                                                </div>

                                                <div className="audio-upload-content">
                                                    <strong>
                                                        Upload an
                                                        audio
                                                        response
                                                    </strong>

                                                    <p>
                                                        MP3, WAV,
                                                        WebM and
                                                        other
                                                        supported
                                                        audio
                                                        formats
                                                    </p>

                                                    {hasAudio && (
                                                        <div className="selected-audio">
                                                            <span>
                                                                ✓
                                                            </span>

                                                            {
                                                                audioFiles[
                                                                    questionId
                                                                ].name
                                                            }
                                                        </div>
                                                    )}
                                                </div>

                                                <label
                                                    className={`audio-upload-button ${
                                                        isSubmitted
                                                            ? "disabled"
                                                            : ""
                                                    }`}
                                                >
                                                    <input
                                                        type="file"
                                                        accept="audio/*"
                                                        disabled={
                                                            isSubmitting ||
                                                            isSubmitted
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleAudioChange(
                                                                questionId,
                                                                event
                                                                    .target
                                                                    .files?.[0]
                                                            )
                                                        }
                                                    />

                                                    {hasAudio
                                                        ? "Change audio"
                                                        : "Choose audio"}
                                                </label>
                                            </div>
                                        </div>

                                        <button
                                            className={`candidate-submit-button ${
                                                isSubmitted
                                                    ? "completed"
                                                    : ""
                                            }`}
                                            type="button"
                                            disabled={
                                                isSubmitting ||
                                                isSubmitted
                                            }
                                            onClick={() =>
                                                handleSubmit(
                                                    question
                                                )
                                            }
                                        >
                                            {isSubmitted
                                                ? "Question Submitted ✓"
                                                : isSubmitting
                                                ? "Submitting..."
                                                : `Submit Question ${question.order} →`}
                                        </button>
                                    </article>
                                );
                            }
                        )}
                    </div>
                </section>

                <footer className="candidate-footer">
                    <span>
                        Your responses are securely
                        submitted for evaluation.
                    </span>

                    <span>
                        Interview status:{" "}
                        <strong>
                            {interview.status}
                        </strong>
                    </span>
                </footer>
            </main>
        </div>
    );
}

function CandidateTopbar() {
    return (
        <header className="candidate-topbar">
            <div className="candidate-brand">
                <div className="candidate-brand-mark">
                    H
                </div>

                <div>
                    <div className="candidate-brand-name">
                        Hiring Platform
                    </div>

                    <div className="candidate-brand-subtitle">
                        Candidate Interview
                    </div>
                </div>
            </div>

            <div className="candidate-secure-badge">
                <span></span>
                Secure interview
            </div>
        </header>
    );
}

export default CandidateInterview;