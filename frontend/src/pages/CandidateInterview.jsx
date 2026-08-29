import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
getInterview,
submitAnswer,
submitAudioAnswer,
} from "../api/client";

function CandidateInterview() {
const { token } = useParams();
const navigate = useNavigate();


const [interview, setInterview] = useState(null);
const [answers, setAnswers] = useState({});
const [audioFiles, setAudioFiles] = useState({});
const [loading, setLoading] = useState(true);
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState("");

useEffect(() => {
    async function loadInterview() {
        try {
            setLoading(true);
            setError("");

            const data = await getInterview(token);

            setInterview(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (token) {
        loadInterview();
    }
}, [token]);

const handleTextChange = (questionId, value) => {
    setAnswers((previous) => ({
        ...previous,
        [questionId]: value,
    }));
};

const handleAudioChange = (questionId, file) => {
    setAudioFiles((previous) => ({
        ...previous,
        [questionId]: file,
    }));
};

const handleSubmit = async (question) => {
    const questionId = question.id;

    const transcript = answers[questionId]?.trim();
    const audioFile = audioFiles[questionId];

    if (!transcript && !audioFile) {
        setError(
            `Please provide a text or audio answer for Question ${question.order}.`
        );
        return;
    }

    try {
        setSubmitting(true);
        setError("");

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

        if (result.status === "completed") {
            navigate(`/interview/${token}/result`);
            return;
        }

        alert(
            `Answer saved. ${result.answered}/${result.total} questions answered.`
        );

        setInterview((previous) => ({
            ...previous,
            status: result.status,
        }));
    } catch (err) {
        setError(err.message);
    } finally {
        setSubmitting(false);
    }
};

if (loading) {
    return (
        <div>
            <h2>Loading Interview...</h2>
        </div>
    );
}

if (error && !interview) {
    return (
        <div>
            <h2>Unable to Load Interview</h2>
            <p>{error}</p>
        </div>
    );
}

if (!interview) {
    return (
        <div>
            <h2>Interview Not Found</h2>
        </div>
    );
}

return (
    <div>
        <h1>Candidate Interview</h1>

        <p>
            <strong>Interview ID:</strong>{" "}
            {interview.interview_id}
        </p>

        <p>
            <strong>Status:</strong>{" "}
            {interview.status}
        </p>

        {error && (
            <div>
                <p>
                    <strong>Error:</strong>{" "}
                    {error}
                </p>
            </div>
        )}

        {interview.questions.map((question) => (
            <div
                key={question.id}
                style={{
                    border: "1px solid #ccc",
                    padding: "20px",
                    marginBottom: "20px",
                }}
            >
                <h3>
                    Question {question.order}
                </h3>

                <p>
                    {question.question}
                </p>

                <div>
                    <label>
                        <strong>
                            Text Answer
                        </strong>
                    </label>

                    <br />

                    <textarea
                        rows="5"
                        cols="60"
                        value={
                            answers[question.id] || ""
                        }
                        onChange={(event) =>
                            handleTextChange(
                                question.id,
                                event.target.value
                            )
                        }
                        placeholder="Type your answer here..."
                    />
                </div>

                <br />

                <div>
                    <label>
                        <strong>
                            Or upload an audio answer
                        </strong>
                    </label>

                    <br />

                    <input
                        type="file"
                        accept="audio/*"
                        onChange={(event) =>
                            handleAudioChange(
                                question.id,
                                event.target.files[0]
                            )
                        }
                    />
                </div>

                <br />

                <button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                        handleSubmit(question)
                    }
                >
                    {submitting
                        ? "Submitting..."
                        : `Submit Question ${question.order}`}
                </button>
            </div>
        ))}
    </div>
);


}

export default CandidateInterview;
