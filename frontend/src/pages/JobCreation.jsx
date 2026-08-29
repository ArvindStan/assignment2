import { useEffect, useState } from "react";
import { createJob, generateInterview, getSkills } from "../api/client";

function JobCreation({ onJobCreated }) {
const [skills, setSkills] = useState([]);
const [jobTitle, setJobTitle] = useState("");
const [selectedSkills, setSelectedSkills] = useState([]);


const [createdJob, setCreatedJob] = useState(null);
const [interview, setInterview] = useState(null);

const [loadingSkills, setLoadingSkills] = useState(true);
const [creatingJob, setCreatingJob] = useState(false);
const [generatingInterview, setGeneratingInterview] = useState(false);

const [error, setError] = useState("");

useEffect(() => {
    async function loadSkills() {
        try {
            const data = await getSkills();
            setSkills(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingSkills(false);
        }
    }

    loadSkills();
}, []);

const handleSkillChange = (skillId) => {
    setSelectedSkills((current) => {
        const exists = current.some(
            (skill) => skill.skill_id === skillId
        );

        if (exists) {
            return current.filter(
                (skill) => skill.skill_id !== skillId
            );
        }

        return [
            ...current,
            {
                skill_id: skillId,
                required_rating: 4,
            },
        ];
    });
};

const handleRatingChange = (skillId, rating) => {
    setSelectedSkills((current) =>
        current.map((skill) =>
            skill.skill_id === skillId
                ? {
                      ...skill,
                      required_rating: Number(rating),
                  }
                : skill
        )
    );
};

const handleCreateJob = async (event) => {
    event.preventDefault();

    setError("");

    if (!jobTitle.trim()) {
        setError("Job title is required");
        return;
    }

    if (selectedSkills.length === 0) {
        setError("Please select at least one skill");
        return;
    }

    try {
        setCreatingJob(true);

        const data = await createJob(
            jobTitle.trim(),
            selectedSkills
        );

        setCreatedJob(data);

        if (onJobCreated) {
            onJobCreated(data);
        }
    } catch (err) {
        setError(err.message);
    } finally {
        setCreatingJob(false);
    }
};

const handleGenerateInterview = async () => {
    if (!createdJob) {
        return;
    }

    setError("");
    setInterview(null);

    try {
        setGeneratingInterview(true);

        const data = await generateInterview(createdJob.id);

        setInterview(data);
    } catch (err) {
        setError(err.message);
    } finally {
        setGeneratingInterview(false);
    }
};

if (loadingSkills) {
    return <p>Loading skills...</p>;
}

return (
    <div style={{ maxWidth: "900px", margin: "40px auto" }}>
        <h1>Create Job</h1>

        <form onSubmit={handleCreateJob}>
            <div style={{ marginBottom: "20px" }}>
                <label>
                    <strong>Job Title</strong>
                </label>

                <br />

                <input
                    type="text"
                    value={jobTitle}
                    onChange={(event) =>
                        setJobTitle(event.target.value)
                    }
                    placeholder="e.g. Senior Python Developer"
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginTop: "8px",
                    }}
                />
            </div>

            <h2>Select Required Skills</h2>

            <div>
                {skills.map((skill) => {
                    const selected = selectedSkills.find(
                        (item) =>
                            item.skill_id === skill.skill_id
                    );

                    return (
                        <div
                            key={skill.skill_id}
                            style={{
                                marginBottom: "10px",
                                padding: "10px",
                                border: "1px solid #ddd",
                            }}
                        >
                            <label>
                                <input
                                    type="checkbox"
                                    checked={Boolean(selected)}
                                    onChange={() =>
                                        handleSkillChange(
                                            skill.skill_id
                                        )
                                    }
                                />

                                {" "}

                                {skill.name}

                                {" "}
                                <small>
                                    ({skill.dimension})
                                </small>
                            </label>

                            {selected && (
                                <select
                                    value={selected.required_rating}
                                    onChange={(event) =>
                                        handleRatingChange(
                                            skill.skill_id,
                                            event.target.value
                                        )
                                    }
                                    style={{
                                        marginLeft: "15px",
                                    }}
                                >
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                    <option value={4}>4</option>
                                    <option value={5}>5</option>
                                </select>
                            )}
                        </div>
                    );
                })}
            </div>

            {error && (
                <p style={{ color: "red" }}>
                    {error}
                </p>
            )}

            {!createdJob && (
                <button
                    type="submit"
                    disabled={creatingJob}
                    style={{
                        marginTop: "20px",
                        padding: "10px 20px",
                    }}
                >
                    {creatingJob
                        ? "Creating..."
                        : "Create Job"}
                </button>
            )}
        </form>

        {createdJob && (
            <div
                style={{
                    marginTop: "30px",
                    padding: "20px",
                    border: "1px solid green",
                }}
            >
                <h2>Job Created Successfully</h2>

                <p>
                    <strong>Job:</strong>{" "}
                    {createdJob.title}
                </p>

                <p>
                    <strong>Job ID:</strong>{" "}
                    {createdJob.id}
                </p>

                {!interview && (
                    <button
                        onClick={handleGenerateInterview}
                        disabled={generatingInterview}
                        style={{
                            padding: "10px 20px",
                            marginTop: "10px",
                        }}
                    >
                        {generatingInterview
                            ? "Generating..."
                            : "Generate Interview"}
                    </button>
                )}
            </div>
        )}

        {interview && (
            <div style={{ marginTop: "30px" }}>
                <h2>Interview Generated Successfully</h2>

                <p>
                    <strong>Interview ID:</strong>{" "}
                    {interview.interview_id}
                </p>

                <p>
                    <strong>Token:</strong>{" "}
                    {interview.token}
                </p>

                <p>
                    <strong>Expires:</strong>{" "}
                    {new Date(
                        interview.expires_at
                    ).toLocaleString()}
                </p>

                <h3>Questions</h3>

                {interview.questions.map((question) => (
                    <div
                        key={question.order}
                        style={{
                            marginBottom: "15px",
                            padding: "15px",
                            border: "1px solid #ddd",
                        }}
                    >
                        <strong>
                            Question {question.order}
                        </strong>

                        <p>
                            {question.question}
                        </p>

                        <small>
                            Skill: {question.skill}
                        </small>
                    </div>
                ))}
            </div>
        )}
    </div>
);


}

export default JobCreation;
