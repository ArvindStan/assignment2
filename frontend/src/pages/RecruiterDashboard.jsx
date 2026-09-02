import { useEffect, useState } from "react";

import {
    getJobs,
    getJobInterviews,
    generateInterview,
} from "../api/client";


function RecruiterDashboard() {
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [interviews, setInterviews] = useState([]);

    const [loadingJobs, setLoadingJobs] = useState(true);
    const [loadingInterviews, setLoadingInterviews] = useState(false);
    const [generating, setGenerating] = useState(false);

    const [error, setError] = useState("");


    useEffect(() => {
        async function loadJobs() {
            try {
                setLoadingJobs(true);
                setError("");

                const data = await getJobs();

                setJobs(data);

                if (data.length > 0) {
                    setSelectedJobId(data[0].id);
                }
            } catch (err) {
                setError(
                    err.message ||
                    "Failed to load jobs."
                );
            } finally {
                setLoadingJobs(false);
            }
        }

        loadJobs();
    }, []);


    useEffect(() => {
        if (!selectedJobId) {
            setInterviews([]);
            return;
        }

        async function loadInterviews() {
            try {
                setLoadingInterviews(true);
                setError("");

                const data =
                    await getJobInterviews(
                        selectedJobId
                    );

                setInterviews(data);
            } catch (err) {
                setError(
                    err.message ||
                    "Failed to load interviews."
                );
            } finally {
                setLoadingInterviews(false);
            }
        }

        loadInterviews();
    }, [selectedJobId]);


    async function handleGenerateInterview() {
        if (!selectedJobId) {
            return;
        }

        try {
            setGenerating(true);
            setError("");

            await generateInterview(
                selectedJobId
            );

            const data =
                await getJobInterviews(
                    selectedJobId
                );

            setInterviews(data);
        } catch (err) {
            setError(
                err.message ||
                "Failed to generate interview."
            );
        } finally {
            setGenerating(false);
        }
    }


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


    const selectedJob = jobs.find(
        (job) => job.id === selectedJobId
    );


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
                    href="/"
                    className="recruiter-home-link"
                >
                    Job Creation
                </a>
            </header>


            <main className="recruiter-container">

                <section className="recruiter-header">
                    <div>
                        <span className="recruiter-eyebrow">
                            RECRUITER WORKSPACE
                        </span>

                        <h1>
                            Interviews
                        </h1>

                        <p>
                            Select a job to view its
                            candidate interviews and
                            current status.
                        </p>
                    </div>
                </section>


                {error && (
                    <div className="recruiter-alert">
                        {error}
                    </div>
                )}


                <div className="recruiter-layout">

                    <aside className="recruiter-jobs-panel">

                        <div className="recruiter-panel-heading">
                            <div>
                                <span className="panel-label">
                                    JOBS
                                </span>

                                <h2>
                                    Open Positions
                                </h2>
                            </div>

                            <span className="job-count">
                                {jobs.length}
                            </span>
                        </div>


                        {loadingJobs ? (
                            <div className="recruiter-loading">
                                Loading jobs...
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="recruiter-empty">
                                <h3>
                                    No jobs yet
                                </h3>

                                <p>
                                    Create a job first
                                    to start generating
                                    interviews.
                                </p>

                                <a
                                    href="/"
                                    className="recruiter-primary-button"
                                >
                                    Create Job
                                </a>
                            </div>
                        ) : (
                            <div className="job-list">

                                {jobs.map((job) => (
                                    <button
                                        key={job.id}
                                        type="button"
                                        className={
                                            `job-list-item ${
                                                selectedJobId === job.id
                                                    ? "selected"
                                                    : ""
                                            }`
                                        }
                                        onClick={() =>
                                            setSelectedJobId(
                                                job.id
                                            )
                                        }
                                    >
                                        <div className="job-list-main">
                                            <strong>
                                                {job.title}
                                            </strong>

                                            <span>
                                                Job #{job.id}
                                            </span>
                                        </div>

                                        <span className="job-arrow">
                                            →
                                        </span>
                                    </button>
                                ))}

                            </div>
                        )}

                    </aside>


                    <section className="recruiter-interviews-panel">

                        {!selectedJob ? (
                            <div className="recruiter-empty large">
                                <h2>
                                    Select a job
                                </h2>

                                <p>
                                    Choose a job from the
                                    left to view its
                                    interviews.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="interviews-heading">

                                    <div>
                                        <span className="panel-label">
                                            SELECTED JOB
                                        </span>

                                        <h2>
                                            {selectedJob.title}
                                        </h2>

                                        <p>
                                            Manage and review
                                            interviews for this
                                            position.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="recruiter-primary-button"
                                        onClick={
                                            handleGenerateInterview
                                        }
                                        disabled={generating}
                                    >
                                        {generating
                                            ? "Generating..."
                                            : "Generate Interview"}
                                    </button>

                                </div>


                                {loadingInterviews ? (
                                    <div className="recruiter-loading">
                                        Loading interviews...
                                    </div>
                                ) : interviews.length === 0 ? (
                                    <div className="recruiter-empty large">

                                        <div className="empty-icon">
                                            ✦
                                        </div>

                                        <h3>
                                            No interviews yet
                                        </h3>

                                        <p>
                                            Generate an AI-powered
                                            interview for this job
                                            to begin.
                                        </p>

                                        <button
                                            type="button"
                                            className="recruiter-primary-button"
                                            onClick={
                                                handleGenerateInterview
                                            }
                                            disabled={generating}
                                        >
                                            {generating
                                                ? "Generating..."
                                                : "Generate First Interview"}
                                        </button>

                                    </div>
                                ) : (
                                    <div className="interview-list">

                                        {interviews.map(
                                            (interview) => (
                                                <article
                                                    key={
                                                        interview.interview_id
                                                    }
                                                    className="interview-card"
                                                >

                                                    <div className="interview-card-top">

                                                        <div>
                                                            <span className="interview-number">
                                                                INTERVIEW
                                                            </span>

                                                            <h3>
                                                                {
                                                                    interview.interview_id
                                                                }
                                                            </h3>
                                                        </div>

                                                        <span
                                                            className={
                                                                `status-badge ${
                                                                    getStatusClass(
                                                                        interview.status
                                                                    )
                                                                }`
                                                            }
                                                        >
                                                            {
                                                                getStatusLabel(
                                                                    interview.status
                                                                )
                                                            }
                                                        </span>

                                                    </div>


                                                    <div className="interview-meta">

                                                        <div>
                                                            <span>
                                                                Created
                                                            </span>

                                                            <strong>
                                                                {formatDate(
                                                                    interview.created_at
                                                                )}
                                                            </strong>
                                                        </div>

                                                        <div>
                                                            <span>
                                                                Expires
                                                            </span>

                                                            <strong>
                                                                {formatDate(
                                                                    interview.expires_at
                                                                )}
                                                            </strong>
                                                        </div>

                                                        <div>
                                                            <span>
                                                                Used
                                                            </span>

                                                            <strong>
                                                                {formatDate(
                                                                    interview.used_at
                                                                )}
                                                            </strong>
                                                        </div>

                                                    </div>


                                                    <div className="interview-card-footer">

                                                        <span className="candidate-token">
                                                            Candidate token:
                                                            <code>
                                                                {
                                                                    interview.token
                                                                }
                                                            </code>
                                                        </span>

                                                        <a
                                                            href={
                                                                `/recruiter/interviews/${interview.interview_id}`
                                                            }
                                                            className="view-interview-link"
                                                        >
                                                            View Details →
                                                        </a>

                                                    </div>

                                                </article>
                                            )
                                        )}

                                    </div>
                                )}

                            </>
                        )}

                    </section>

                </div>

            </main>

        </div>
    );
}


export default RecruiterDashboard;
