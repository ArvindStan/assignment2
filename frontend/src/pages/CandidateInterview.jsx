import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    getInterview,
    startInterview,
    submitAnswer,
    submitAudioAnswer,
} from "../api/client";

import "./CandidateInterview.css";

function CandidateInterview({ token }) {
    const [interview, setInterview] = useState(null);
    const [candidateName, setCandidateName] =
        useState("");
    const [startingInterview, setStartingInterview] =
        useState(false);

    const [answers, setAnswers] = useState({});
    const [audioFiles, setAudioFiles] = useState({});
    const [audioPreviews, setAudioPreviews] = useState({});
    const [submittedQuestions, setSubmittedQuestions] =
        useState(new Set());

    const [loading, setLoading] = useState(true);
    const [submittingQuestion, setSubmittingQuestion] =
        useState(null);
    const [recordingQuestionId, setRecordingQuestionId] =
        useState(null);
    const [recordingTime, setRecordingTime] =
        useState(0);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const mediaRecorderRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);


    useEffect(() => {
        async function loadInterview() {
            try {
                setLoading(true);
                setError("");

                const data =
                    await getInterview(token);

                setInterview(data);

                if (data.candidate_name) {
                    setCandidateName(
                        data.candidate_name
                    );
                }
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


    useEffect(() => {
        return () => {
            stopRecordingCleanup();

            Object.values(audioPreviews).forEach(
                (previewUrl) => {
                    URL.revokeObjectURL(
                        previewUrl
                    );
                }
            );
        };
    }, []);


    const handleCandidateNameChange = (
        event
    ) => {
        setCandidateName(
            event.target.value
        );

        setError("");
        setSuccess("");
    };


    const handleStartInterview = async (
        event
    ) => {
        event.preventDefault();

        const trimmedName =
            candidateName.trim();

        if (!trimmedName) {
            setError(
                "Please enter your full name before starting the interview."
            );
            return;
        }

        if (trimmedName.length > 255) {
            setError(
                "Your name must be 255 characters or fewer."
            );
            return;
        }

        try {
            setStartingInterview(true);
            setError("");
            setSuccess("");

            const data =
                await startInterview(
                    token,
                    trimmedName
                );

            setCandidateName(
                data.candidate_name ||
                    trimmedName
            );

            setInterview(
                (previous) => ({
                    ...previous,
                    ...data,
                    candidate_name:
                        data.candidate_name ||
                        trimmedName,
                })
            );
        } catch (err) {
            setError(
                err.message ||
                    "Unable to start the interview."
            );
        } finally {
            setStartingInterview(false);
        }
    };


    const handleTextChange = (
        questionId,
        value
    ) => {
        setAnswers((previous) => ({
            ...previous,
            [questionId]: value,
        }));

        setSuccess("");
        setError("");
    };


    const handleAudioChange = (
        questionId,
        file
    ) => {
        if (!file) {
            return;
        }

        if (
            audioPreviews[questionId]
        ) {
            URL.revokeObjectURL(
                audioPreviews[questionId]
            );
        }

        const previewUrl =
            URL.createObjectURL(file);

        setAudioFiles((previous) => ({
            ...previous,
            [questionId]: file,
        }));

        setAudioPreviews((previous) => ({
            ...previous,
            [questionId]: previewUrl,
        }));

        setSuccess("");
        setError("");
    };


    function stopRecordingCleanup() {
        if (
            recordingTimerRef.current
        ) {
            clearInterval(
                recordingTimerRef.current
            );

            recordingTimerRef.current = null;
        }

        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !==
                "inactive"
        ) {
            mediaRecorderRef.current.stop();
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current
                .getTracks()
                .forEach((track) => {
                    track.stop();
                });

            mediaStreamRef.current = null;
        }

        mediaRecorderRef.current = null;
    }


    async function startRecording(
        questionId
    ) {
        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {
            setError(
                "Your browser does not support microphone recording."
            );
            return;
        }

        if (
            !window.MediaRecorder
        ) {
            setError(
                "Your browser does not support audio recording."
            );
            return;
        }

        if (
            recordingQuestionId !== null
        ) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            const stream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        audio: true,
                    }
                );

            mediaStreamRef.current =
                stream;

            audioChunksRef.current = [];

            const recorder =
                new MediaRecorder(stream);

            mediaRecorderRef.current =
                recorder;

            recorder.ondataavailable = (
                event
            ) => {
                if (
                    event.data &&
                    event.data.size > 0
                ) {
                    audioChunksRef.current.push(
                        event.data
                    );
                }
            };

            recorder.onstop = () => {
                const audioBlob =
                    new Blob(
                        audioChunksRef.current,
                        {
                            type:
                                recorder.mimeType ||
                                "audio/webm",
                        }
                    );

                const audioFile =
                    new File(
                        [
                            audioBlob,
                        ],
                        `recording-question-${questionId}.webm`,
                        {
                            type:
                                audioBlob.type ||
                                "audio/webm",
                        }
                    );

                if (
                    audioPreviews[
                        questionId
                    ]
                ) {
                    URL.revokeObjectURL(
                        audioPreviews[
                            questionId
                        ]
                    );
                }

                const previewUrl =
                    URL.createObjectURL(
                        audioBlob
                    );

                setAudioFiles(
                    (previous) => ({
                        ...previous,
                        [questionId]:
                            audioFile,
                    })
                );

                setAudioPreviews(
                    (previous) => ({
                        ...previous,
                        [questionId]:
                            previewUrl,
                    })
                );

                setRecordingQuestionId(
                    null
                );

                setRecordingTime(0);

                if (
                    mediaStreamRef.current
                ) {
                    mediaStreamRef.current
                        .getTracks()
                        .forEach(
                            (track) =>
                                track.stop()
                        );

                    mediaStreamRef.current =
                        null;
                }

                mediaRecorderRef.current =
                    null;

                audioChunksRef.current = [];
            };

            recorder.onerror = () => {
                setError(
                    "An error occurred while recording audio."
                );

                stopRecordingCleanup();
                setRecordingQuestionId(
                    null
                );
                setRecordingTime(0);
            };

            recorder.start();

            setRecordingQuestionId(
                questionId
            );

            setRecordingTime(0);

            recordingTimerRef.current =
                setInterval(() => {
                    setRecordingTime(
                        (previous) =>
                            previous + 1
                    );
                }, 1000);
        } catch (err) {
            if (
                err.name ===
                "NotAllowedError"
            ) {
                setError(
                    "Microphone permission was denied. Please allow microphone access and try again."
                );
            } else if (
                err.name ===
                "NotFoundError"
            ) {
                setError(
                    "No microphone was found. Please connect a microphone and try again."
                );
            } else {
                setError(
                    err.message ||
                        "Unable to start audio recording."
                );
            }

            stopRecordingCleanup();
            setRecordingQuestionId(
                null
            );
            setRecordingTime(0);
        }
    }


    function stopRecording() {
        const recorder =
            mediaRecorderRef.current;

        if (
            recorder &&
            recorder.state !==
                "inactive"
        ) {
            recorder.stop();
        }

        if (
            recordingTimerRef.current
        ) {
            clearInterval(
                recordingTimerRef.current
            );

            recordingTimerRef.current =
                null;
        }
    }


    function formatRecordingTime(
        seconds
    ) {
        const minutes =
            Math.floor(seconds / 60);

        const remainingSeconds =
            seconds % 60;

        return `${String(
            minutes
        ).padStart(2, "0")}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    }


    const handleSubmit = async (
        question
    ) => {
        const questionId =
            question.id;

        const transcript =
            answers[questionId]?.trim();

        const audioFile =
            audioFiles[questionId];

        if (
            !transcript &&
            !audioFile
        ) {
            setError(
                `Please provide a text or audio answer for Question ${question.order}.`
            );
            return;
        }

        try {
            setSubmittingQuestion(
                questionId
            );

            setError("");
            setSuccess("");

            let result;

            if (
                audioFile &&
                !transcript
            ) {
                result =
                    await submitAudioAnswer(
                        token,
                        questionId,
                        audioFile
                    );
            } else {
                result =
                    await submitAnswer(
                        token,
                        questionId,
                        transcript
                    );
            }

            setSubmittedQuestions(
                (previous) => {
                    const next =
                        new Set(
                            previous
                        );

                    next.add(
                        questionId
                    );

                    return next;
                }
            );

            if (
                result.status ===
                "completed"
            ) {
                window.location.href =
                    `/interview/${token}/result`;

                return;
            }

            setInterview(
                (previous) => ({
                    ...previous,
                    status:
                        result.status,
                })
            );

            setSuccess(
                `Question ${question.order} submitted successfully.`
            );
        } catch (err) {
            setError(
                err.message ||
                    "Unable to submit your answer."
            );
        } finally {
            setSubmittingQuestion(
                null
            );
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

                        <p>
                            {error}
                        </p>
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


    /*
     * Candidate start screen.
     *
     * Existing interviews created before the
     * candidate-name feature have an empty name,
     * so they will also be asked for their name.
     */
    if (!interview.candidate_name) {
        const totalQuestions =
            interview.questions?.length ||
            0;

        return (
            <div className="candidate-page">
                <CandidateTopbar />

                <main className="candidate-container">
                    <section className="candidate-start-card">

                        <div className="candidate-start-eyebrow">
                            {interview.job_title ||
                                "TECHNICAL ASSESSMENT"}
                        </div>

                        <h1>
                            Before you begin
                        </h1>

                        <p className="candidate-start-description">
                            Please enter your full name
                            before starting the technical
                            interview.
                        </p>

                        <form
                            className="candidate-start-form"
                            onSubmit={
                                handleStartInterview
                            }
                        >
                            <label htmlFor="candidate-name">
                                Full Name
                                <span>*</span>
                            </label>

                            <input
                                id="candidate-name"
                                type="text"
                                value={
                                    candidateName
                                }
                                onChange={
                                    handleCandidateNameChange
                                }
                                placeholder="Enter your full name"
                                maxLength={255}
                                autoComplete="name"
                                autoFocus
                                disabled={
                                    startingInterview
                                }
                            />

                            {error && (
                                <div className="candidate-start-error">
                                    <span>!</span>
                                    {error}
                                </div>
                            )}

                            <div className="candidate-start-info">
                                <div>
                                    <strong>
                                        {totalQuestions}
                                    </strong>

                                    <span>
                                        Questions
                                    </span>
                                </div>

                                <div>
                                    <strong>
                                        Text + Audio
                                    </strong>

                                    <span>
                                        Answer options
                                    </span>
                                </div>

                                <div>
                                    <strong>
                                        AI
                                    </strong>

                                    <span>
                                        Technical evaluation
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="candidate-start-button"
                                disabled={
                                    startingInterview ||
                                    !candidateName.trim()
                                }
                            >
                                {startingInterview
                                    ? "Starting Interview..."
                                    : "Start Interview →"}
                            </button>
                        </form>

                        <p className="candidate-start-secure">
                            🔒 Your responses are securely
                            submitted for evaluation.
                        </p>
                    </section>
                </main>
            </div>
        );
    }


    const totalQuestions =
        interview.questions?.length ||
        0;

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
                            <span>
                                you know.
                            </span>
                        </h1>

                        <p>
                            Welcome,{" "}
                            <strong>
                                {interview.candidate_name}
                            </strong>
                            . Take your time and answer
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
                                CANDIDATE
                            </span>

                            <strong>
                                {interview.candidate_name}
                            </strong>
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
                            <span>
                                STATUS
                            </span>

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

                            <span>
                                {error}
                            </span>
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

                            <span>
                                {success}
                            </span>
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
                            (
                                question,
                                index
                            ) => {
                                const questionId =
                                    question.id;

                                const isSubmitting =
                                    submittingQuestion ===
                                    questionId;

                                const isSubmitted =
                                    submittedQuestions.has(
                                        questionId
                                    );

                                const isRecording =
                                    recordingQuestionId ===
                                    questionId;

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
                                        key={
                                            questionId
                                        }
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
                                                        {
                                                            (
                                                                answers[
                                                                    questionId
                                                                ] ||
                                                                ""
                                                            ).length
                                                        }{" "}
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
                                                        isSubmitted ||
                                                        isRecording
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
                                                <span>
                                                    OR
                                                </span>
                                            </div>


                                            <div className="candidate-audio-answer">

                                                <div className="audio-upload-icon">
                                                    🎙
                                                </div>


                                                <div className="audio-upload-content">
                                                    <strong>
                                                        Audio response
                                                    </strong>

                                                    <p>
                                                        Record your
                                                        answer directly
                                                        from your
                                                        browser or
                                                        upload an
                                                        existing audio
                                                        file.
                                                    </p>


                                                    {isRecording && (
                                                        <div className="recording-status">
                                                            <span className="recording-dot"></span>

                                                            Recording{" "}
                                                            {
                                                                formatRecordingTime(
                                                                    recordingTime
                                                                )
                                                            }
                                                        </div>
                                                    )}


                                                    {hasAudio &&
                                                        !isRecording && (
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


                                                    {audioPreviews[
                                                        questionId
                                                    ] && (
                                                        <audio
                                                            controls
                                                            preload="metadata"
                                                            src={
                                                                audioPreviews[
                                                                    questionId
                                                                ]
                                                            }
                                                        />
                                                    )}
                                                </div>


                                                <div className="audio-actions">

                                                    {!isSubmitted &&
                                                        !isRecording && (
                                                            <button
                                                                type="button"
                                                                className="audio-record-button"
                                                                disabled={
                                                                    isSubmitting ||
                                                                    recordingQuestionId !==
                                                                        null
                                                                }
                                                                onClick={() =>
                                                                    startRecording(
                                                                        questionId
                                                                    )
                                                                }
                                                            >
                                                                ● Start Recording
                                                            </button>
                                                        )}


                                                    {isRecording && (
                                                        <button
                                                            type="button"
                                                            className="audio-stop-button"
                                                            onClick={
                                                                stopRecording
                                                            }
                                                        >
                                                            ■ Stop Recording
                                                        </button>
                                                    )}


                                                    {!isSubmitted &&
                                                        !isRecording && (
                                                            <label
                                                                className={`audio-upload-button ${
                                                                    isSubmitting
                                                                        ? "disabled"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <input
                                                                    type="file"
                                                                    accept="audio/*"
                                                                    disabled={
                                                                        isSubmitting ||
                                                                        isRecording
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
                                                        )}

                                                </div>
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
                                                isSubmitted ||
                                                isRecording
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