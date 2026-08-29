import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getInterviewResult } from "../api/client";

function InterviewResult() {
const { token } = useParams();


const [result, setResult] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
    async function loadResult() {
        try {
            setLoading(true);
            setError("");

            const data = await getInterviewResult(token);

            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (token) {
        loadResult();
    }
}, [token]);

if (loading) {
    return (
        <div>
            <h2>Loading Results...</h2>
        </div>
    );
}

if (error) {
    return (
        <div>
            <h2>Unable to Load Results</h2>
            <p>{error}</p>

            <Link to={`/interview/${token}`}>
                Back to Interview
            </Link>
        </div>
    );
}

if (!result) {
    return (
        <div>
            <h2>No Results Found</h2>
        </div>
    );
}

return (
    <div>
        <h1>Interview Results</h1>

        <p>
            <strong>Interview ID:</strong>{" "}
            {result.interview_id}
        </p>

        <p>
            <strong>Status:</strong>{" "}
            {result.status}
        </p>

        <hr />

        <h2>Overall Fit</h2>

        <p>
            <strong>{result.fit_score}</strong>
        </p>

        <h2>Summary</h2>

        <p
            style={{
                whiteSpace: "pre-line",
            }}
        >
            {result.summary}
        </p>

        <hr />

        <h2>Skill Scores</h2>

        {result.skill_scores.map((skill) => (
            <div
                key={skill.skill_id}
                style={{
                    border: "1px solid #ccc",
                    padding: "20px",
                    marginBottom: "15px",
                }}
            >
                <h3>{skill.skill}</h3>

                <p>
                    <strong>
                        Skill ID:
                    </strong>{" "}
                    {skill.skill_id}
                </p>

                <p>
                    <strong>
                        Rating:
                    </strong>{" "}
                    {skill.rating}/5
                </p>
            </div>
        ))}

        <Link to="/">
            Create Another Job
        </Link>
    </div>
);


}

export default InterviewResult;
