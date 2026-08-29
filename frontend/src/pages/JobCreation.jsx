import { useEffect, useMemo, useState } from "react";
import {
    createJob,
    generateInterview,
    getSkills,
} from "../api/client";

const DIMENSION_LABELS = {
    applied_skill: "Applied Skills",
    attribute: "Attributes",
    context: "Context",
    knowledge: "Knowledge",
    responsibility: "Responsibilities",
    tool: "Tools",
};

const DIMENSION_ORDER = [
    "knowledge",
    "applied_skill",
    "tool",
    "responsibility",
    "context",
    "attribute",
];

function JobCreation() {
    const [title, setTitle] = useState("");
    const [skills, setSkills] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState({});
    const [search, setSearch] = useState("");

    const [job, setJob] = useState(null);
    const [interview, setInterview] = useState(null);

    const [loadingSkills, setLoadingSkills] = useState(true);
    const [creatingJob, setCreatingJob] = useState(false);
    const [generatingInterview, setGeneratingInterview] =
        useState(false);

    const [error, setError] = useState("");

    useEffect(() => {
        loadSkills();
    }, []);

    async function loadSkills() {
        try {
            setLoadingSkills(true);
            setError("");

            const data = await getSkills();

            setSkills(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(
                err.message || "Unable to load skills."
            );
        } finally {
            setLoadingSkills(false);
        }
    }

    function toggleSkill(skill) {
        setSelectedSkills((previous) => {
            const updated = {
                ...previous,
            };

            if (updated[skill.skill_id]) {
                delete updated[skill.skill_id];
            } else {
                updated[skill.skill_id] = {
                    skill_id: skill.skill_id,
                    required_rating: 3,
                    name: skill.name,
                    dimension: skill.dimension,
                };
            }

            return updated;
        });
    }

    function changeRating(skillId, rating) {
        setSelectedSkills((previous) => ({
            ...previous,
            [skillId]: {
                ...previous[skillId],
                required_rating: Number(rating),
            },
        }));
    }

    function removeSkill(skillId) {
        setSelectedSkills((previous) => {
            const updated = {
                ...previous,
            };

            delete updated[skillId];

            return updated;
        });
    }

    const selectedList = useMemo(
        () => Object.values(selectedSkills),
        [selectedSkills]
    );

    const filteredSkills = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return skills;
        }

        return skills.filter((skill) =>
            skill.name.toLowerCase().includes(query)
        );
    }, [skills, search]);

    const groupedSkills = useMemo(() => {
        const groups = {};

        filteredSkills.forEach((skill) => {
            if (!groups[skill.dimension]) {
                groups[skill.dimension] = [];
            }

            groups[skill.dimension].push(skill);
        });

        return groups;
    }, [filteredSkills]);

    async function handleCreateJob(event) {
        event.preventDefault();

        setError("");

        const cleanTitle = title.trim();

        if (!cleanTitle) {
            setError("Please enter a job title.");
            return;
        }

        if (selectedList.length === 0) {
            setError(
                "Select at least one required skill."
            );
            return;
        }

        try {
            setCreatingJob(true);

            /*
             * IMPORTANT:
             *
             * Django expects:
             *
             * [
             *   {
             *     "skill_id": "tl.python",
             *     "required_rating": 4
             *   }
             * ]
             *
             * NOT:
             *
             * [
             *   "tl.python",
             *   "tl.django"
             * ]
             */
            const payloadSkills =
                selectedList.map((skill) => ({
                    skill_id: skill.skill_id,
                    required_rating:
                        Number(skill.required_rating),
                }));

            const createdJob = await createJob(
                cleanTitle,
                payloadSkills
            );

            setJob(createdJob);
            setInterview(null);
        } catch (err) {
            console.error(err);

            setError(
                err.message ||
                    "Unable to create the job."
            );
        } finally {
            setCreatingJob(false);
        }
    }

    async function handleGenerateInterview() {
        if (!job?.id) {
            return;
        }

        try {
            setGeneratingInterview(true);
            setError("");

            const generated =
                await generateInterview(job.id);

            setInterview(generated);
        } catch (err) {
            console.error(err);

            setError(
                err.message ||
                    "Unable to generate the interview."
            );
        } finally {
            setGeneratingInterview(false);
        }
    }

    function getCandidateUrl() {
        if (!interview?.token) {
            return "";
        }

        return `${window.location.origin}/interview/${interview.token}`;
    }

    async function copyCandidateLink() {
        const url = getCandidateUrl();

        if (!url) {
            return;
        }

        try {
            await navigator.clipboard.writeText(url);
        } catch (err) {
            console.error(
                "Unable to copy link:",
                err
            );
        }
    }

    function resetForm() {
        setTitle("");
        setSelectedSkills({});
        setJob(null);
        setInterview(null);
        setSearch("");
        setError("");
    }

    return (
        <div className="app-shell">
            <header className="topbar">
                <div className="brand">
                    <div className="brand-mark">
                        H
                    </div>

                    <div>
                        <div className="brand-name">
                            Hiring Platform
                        </div>

                        <div className="brand-subtitle">
                            AI-assisted technical interviews
                        </div>
                    </div>
                </div>

                <div className="topbar-status">
                    <span className="status-dot" />
                    System operational
                </div>
            </header>

            <main className="main-content">
                <section className="hero-section">
                    <div className="eyebrow">
                        RECRUITER WORKSPACE
                    </div>

                    <h1>
                        Build the right
                        <span> interview.</span>
                    </h1>

                    <p className="hero-description">
                        Define the skills your candidate needs,
                        set the expected proficiency, and let
                        the platform generate a focused technical
                        interview.
                    </p>
                </section>

                {error && (
                    <div className="error-banner">
                        <div className="error-icon">
                            !
                        </div>

                        <div>
                            <strong>
                                Something went wrong
                            </strong>

                            <p>{error}</p>
                        </div>
                    </div>
                )}

                {!job && (
                    <form
                        className="workspace"
                        onSubmit={handleCreateJob}
                    >
                        <section className="panel">
                            <div className="panel-header">
                                <div>
                                    <div className="section-kicker">
                                        STEP 01
                                    </div>

                                    <h2>
                                        Create a job
                                    </h2>

                                    <p>
                                        Start with the role you
                                        are hiring for.
                                    </p>
                                </div>

                                <div className="step-number">
                                    01
                                </div>
                            </div>

                            <div className="field">
                                <label htmlFor="job-title">
                                    Job title
                                </label>

                                <input
                                    id="job-title"
                                    type="text"
                                    value={title}
                                    onChange={(event) =>
                                        setTitle(
                                            event.target.value
                                        )
                                    }
                                    placeholder="e.g. Senior Python Developer"
                                    autoComplete="off"
                                />
                            </div>
                        </section>

                        <section className="panel">
                            <div className="panel-header">
                                <div>
                                    <div className="section-kicker">
                                        STEP 02
                                    </div>

                                    <h2>
                                        Define required skills
                                    </h2>

                                    <p>
                                        Select the capabilities
                                        that matter for this role.
                                    </p>
                                </div>

                                <div className="selected-counter">
                                    <strong>
                                        {selectedList.length}
                                    </strong>

                                    <span>
                                        selected
                                    </span>
                                </div>
                            </div>

                            <div className="skill-toolbar">
                                <div className="search-box">
                                    <span>⌕</span>

                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Search skills..."
                                    />
                                </div>
                            </div>

                            {loadingSkills ? (
                                <div className="loading-state">
                                    <div className="spinner" />
                                    Loading skills...
                                </div>
                            ) : (
                                <div className="skill-groups">
                                    {DIMENSION_ORDER.map(
                                        (dimension) => {
                                            const dimensionSkills =
                                                groupedSkills[
                                                    dimension
                                                ];

                                            if (
                                                !dimensionSkills ||
                                                dimensionSkills.length ===
                                                    0
                                            ) {
                                                return null;
                                            }

                                            return (
                                                <div
                                                    className="skill-group"
                                                    key={
                                                        dimension
                                                    }
                                                >
                                                    <div className="dimension-header">
                                                        <span>
                                                            {
                                                                DIMENSION_LABELS[
                                                                    dimension
                                                                ]
                                                            }
                                                        </span>

                                                        <small>
                                                            {
                                                                dimensionSkills.length
                                                            }{" "}
                                                            skills
                                                        </small>
                                                    </div>

                                                    <div className="skill-grid">
                                                        {dimensionSkills.map(
                                                            (
                                                                skill
                                                            ) => {
                                                                const selected =
                                                                    Boolean(
                                                                        selectedSkills[
                                                                            skill.skill_id
                                                                        ]
                                                                    );

                                                                return (
                                                                    <div
                                                                        className={`skill-card ${
                                                                            selected
                                                                                ? "selected"
                                                                                : ""
                                                                        }`}
                                                                        key={
                                                                            skill.skill_id
                                                                        }
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            className="skill-main"
                                                                            onClick={() =>
                                                                                toggleSkill(
                                                                                    skill
                                                                                )
                                                                            }
                                                                        >
                                                                            <span
                                                                                className={`skill-checkbox ${
                                                                                    selected
                                                                                        ? "checked"
                                                                                        : ""
                                                                                }`}
                                                                            >
                                                                                {selected
                                                                                    ? "✓"
                                                                                    : ""}
                                                                            </span>

                                                                            <span className="skill-info">
                                                                                <strong>
                                                                                    {
                                                                                        skill.name
                                                                                    }
                                                                                </strong>

                                                                                <small>
                                                                                    {
                                                                                        skill.skill_id
                                                                                    }
                                                                                </small>
                                                                            </span>
                                                                        </button>

                                                                        {selected && (
                                                                            <div className="rating-control">
                                                                                <span>
                                                                                    Required
                                                                                    level
                                                                                </span>

                                                                                <div className="rating-buttons">
                                                                                    {[1, 2, 3, 4, 5].map(
                                                                                        (
                                                                                            rating
                                                                                        ) => (
                                                                                            <button
                                                                                                type="button"
                                                                                                key={
                                                                                                    rating
                                                                                                }
                                                                                                className={
                                                                                                    selectedSkills[
                                                                                                        skill.skill_id
                                                                                                    ]
                                                                                                        ?.required_rating ===
                                                                                                    rating
                                                                                                        ? "rating active"
                                                                                                        : "rating"
                                                                                                }
                                                                                                onClick={() =>
                                                                                                    changeRating(
                                                                                                        skill.skill_id,
                                                                                                        rating
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    rating
                                                                                                }
                                                                                            </button>
                                                                                        )
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </section>

                        {selectedList.length > 0 && (
                            <section className="panel selected-panel">
                                <div className="panel-header compact">
                                    <div>
                                        <div className="section-kicker">
                                            REQUIREMENTS
                                        </div>

                                        <h2>
                                            Selected skills
                                        </h2>

                                        <p>
                                            Review the expected
                                            proficiency before
                                            creating the job.
                                        </p>
                                    </div>
                                </div>

                                <div className="selected-list">
                                    {selectedList.map(
                                        (skill) => (
                                            <div
                                                className="selected-row"
                                                key={
                                                    skill.skill_id
                                                }
                                            >
                                                <div>
                                                    <strong>
                                                        {
                                                            skill.name
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            DIMENSION_LABELS[
                                                                skill.dimension
                                                            ]
                                                        }
                                                    </span>
                                                </div>

                                                <div className="selected-rating">
                                                    <span>
                                                        Level
                                                    </span>

                                                    <strong>
                                                        {
                                                            skill.required_rating
                                                        }
                                                        /5
                                                    </strong>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="remove-button"
                                                    onClick={() =>
                                                        removeSkill(
                                                            skill.skill_id
                                                        )
                                                    }
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>
                            </section>
                        )}

                        <div className="form-actions">
                            <div className="action-hint">
                                <span>●</span>
                                {selectedList.length} skills
                                configured
                            </div>

                            <button
                                type="submit"
                                className="primary-button"
                                disabled={
                                    creatingJob ||
                                    loadingSkills
                                }
                            >
                                {creatingJob ? (
                                    <>
                                        <span className="button-spinner" />
                                        Creating job...
                                    </>
                                ) : (
                                    <>
                                        Create Job
                                        <span>→</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {job && (
                    <div className="workspace">
                        <section className="success-card">
                            <div className="success-icon">
                                ✓
                            </div>

                            <div className="success-content">
                                <div className="success-label">
                                    JOB CREATED SUCCESSFULLY
                                </div>

                                <h2>
                                    {job.title}
                                </h2>

                                <p>
                                    Your job has been created
                                    and is ready for interview
                                    generation.
                                </p>

                                <div className="job-meta">
                                    <div>
                                        <span>
                                            Job ID
                                        </span>

                                        <strong>
                                            #{job.id}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Skills
                                        </span>

                                        <strong>
                                            {selectedList.length}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Status
                                        </span>

                                        <strong className="active-status">
                                            Active
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {!interview && (
                            <section className="panel interview-launch">
                                <div className="launch-icon">
                                    ✦
                                </div>

                                <div className="launch-content">
                                    <div className="section-kicker">
                                        NEXT STEP
                                    </div>

                                    <h2>
                                        Generate the interview
                                    </h2>

                                    <p>
                                        Create five targeted
                                        questions based on the
                                        required skills and their
                                        proficiency levels.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={
                                        handleGenerateInterview
                                    }
                                    disabled={
                                        generatingInterview
                                    }
                                >
                                    {generatingInterview ? (
                                        <>
                                            <span className="button-spinner" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            Generate Interview
                                            <span>→</span>
                                        </>
                                    )}
                                </button>
                            </section>
                        )}

                        {interview && (
                            <section className="panel">
                                <div className="panel-header">
                                    <div>
                                        <div className="section-kicker success-text">
                                            INTERVIEW READY
                                        </div>

                                        <h2>
                                            Interview generated
                                        </h2>

                                        <p>
                                            Five questions have
                                            been generated and
                                            saved for this job.
                                        </p>
                                    </div>

                                    <div className="interview-badge">
                                        ✓ Ready
                                    </div>
                                </div>

                                <div className="interview-details">
                                    <div>
                                        <span>
                                            Interview ID
                                        </span>

                                        <strong>
                                            {interview.id ||
                                                interview.interview_id ||
                                                "Generated"}
                                        </strong>
                                    </div>

                                    {interview.expires_at && (
                                        <div>
                                            <span>
                                                Expires
                                            </span>

                                            <strong>
                                                {new Date(
                                                    interview.expires_at
                                                ).toLocaleString()}
                                            </strong>
                                        </div>
                                    )}
                                </div>

                                {interview.token && (
                                    <div className="candidate-link-card">
                                        <div>
                                            <div className="section-kicker">
                                                CANDIDATE LINK
                                            </div>

                                            <h3>
                                                Share this interview
                                            </h3>

                                            <p>
                                                Anyone with this
                                                link can access the
                                                candidate interview.
                                            </p>
                                        </div>

                                        <div className="candidate-link">
                                            <input
                                                readOnly
                                                value={getCandidateUrl()}
                                                onFocus={(event) =>
                                                    event.target.select()
                                                }
                                            />

                                            <button
                                                type="button"
                                                onClick={
                                                    copyCandidateLink
                                                }
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="questions">
                                    <div className="questions-heading">
                                        <div>
                                            <div className="section-kicker">
                                                QUESTION SET
                                            </div>

                                            <h3>
                                                Interview questions
                                            </h3>
                                        </div>

                                        <span>
                                            {interview.questions
                                                ?.length || 0}{" "}
                                            questions
                                        </span>
                                    </div>

                                    {interview.questions?.map(
                                        (
                                            question,
                                            index
                                        ) => (
                                            <div
                                                className="question-card"
                                                key={
                                                    question.id ||
                                                    index
                                                }
                                            >
                                                <div className="question-number">
                                                    {String(
                                                        index + 1
                                                    ).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                </div>

                                                <div className="question-content">
                                                    <p>
                                                        {
                                                            question.question
                                                        }
                                                    </p>

                                                    {(question.skill_name ||
                                                        question.skill) && (
                                                        <span className="skill-tag">
                                                            Skill:{" "}
                                                            {question.skill_name ||
                                                                question.skill}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>

                                <div className="bottom-actions">
                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={
                                            resetForm
                                        }
                                    >
                                        Create Another Job
                                    </button>
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>

            <footer className="footer">
                <span>
                    Hiring Platform
                </span>

                <span>
                    •
                </span>

                <span>
                    Interview Intelligence
                </span>
            </footer>
        </div>
    );
}

export default JobCreation;

