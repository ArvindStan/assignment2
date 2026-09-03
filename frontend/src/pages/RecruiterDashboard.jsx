import { useEffect, useMemo, useState } from "react";

import {
    getJobInterviews,
    getJobs,
} from "../api/client";


function RecruiterDashboard() {
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [interviews, setInterviews] = useState([]);

    const [loadingJobs, setLoadingJobs] = useState(true);
    const [loadingInterviews, setLoadingInterviews] =
        useState(false);

    const [error, setError] = useState("");


    const selectedJob = useMemo(
        () =>
            jobs.find(
                (job) =>
                    String(job.id) ===
                    String(selectedJobId)
            ),
        [jobs, selectedJobId]
    );


    useEffect(() => {
        loadJobs();
    }, []);


    useEffect(() => {
        if (selectedJobId) {
            loadInterviews(selectedJobId);
        } else {
            setInterviews([]);
        }
    }, [selectedJobId]);


    async function loadJobs() {
        try {
            setLoadingJobs(true);
            setError("");

            const data = await getJobs();

            const jobList = Array.isArray(data)
                ? data
                : data.results || data.jobs || [];

            setJobs(jobList);

            if (jobList.length > 0) {
                setSelectedJobId(jobList[0].id);
            }
        } catch (err) {
            setError(
                err.message ||
                    "Failed to load open positions."
            );
        } finally {
            setLoadingJobs(false);
        }
    }


    async function loadInterviews(jobId) {
        try {
            setLoadingInterviews(true);
            setError("");

            const data =
                await getJobInterviews(jobId);

            const interviewList =
                Array.isArray(data)
                    ? data
                    : data.results ||
                      data.interviews ||
                      [];

            setInterviews(interviewList);
        } catch (err) {
            setInterviews([]);

            setError(
                err.message ||
                    "Failed to load interviews."
            );
        } finally {
            setLoadingInterviews(false);
        }
    }


    function formatDate(value) {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString(
            undefined,
            {
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        );
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


    function getJobSkills(job) {
        if (!job) {
            return [];
        }

        if (Array.isArray(job.skills)) {
            return job.skills;
        }

        if (Array.isArray(job.required_skills)) {
            return job.required_skills;
        }

        if (Array.isArray(job.job_skills)) {
            return job.job_skills.map(
                (item) =>
                    item.skill_name ||
                    item.skill?.name ||
                    item.name ||
                    item.skill
            );
        }

        return [];
    }


    function getSkillName(skill) {
        if (typeof skill === "string") {
            return skill;
        }

        return (
            skill?.name ||
            skill?.skill_name ||
            skill?.skill?.name ||
            ""
        );
    }


    function getInterviewFit(interview) {
        return (
            interview.result?.fit_score ||
            interview.fit_score ||
            interview.overall_fit ||
            "—"
        );
    }


    function getFitClass(fit) {
        switch (fit) {
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


    function getCandidateName(interview) {
        return (
            interview.candidate_name?.trim() ||
            "Candidate"
        );
    }


    function getCandidateInitials(interview) {
        const name =
            getCandidateName(interview);

        if (name === "Candidate") {
            return "C";
        }

        const parts = name
            .split(/\s+/)
            .filter(Boolean);

        if (parts.length === 1) {
            return parts[0]
                .charAt(0)
                .toUpperCase();
        }

        return (
            parts[0].charAt(0) +
            parts[parts.length - 1].charAt(0)
        ).toUpperCase();
    }


    const completedCount = interviews.filter(
        (interview) =>
            interview.status === "completed"
    ).length;


    const inProgressCount = interviews.filter(
        (interview) =>
            interview.status === "in_progress"
    ).length;


    const notStartedCount = interviews.filter(
        (interview) =>
            interview.status === "not_started"
    ).length;


    const highFitCount = interviews.filter(
        (interview) =>
            getInterviewFit(interview) === "High"
    ).length;


    if (loadingJobs) {
        return (
            <div className="recruiter-page">

                <header className="recruiter-topbar">

                    <div>
                        <div className="recruiter-brand">
                            Hiring Interview
                        </div>

                        <div className="recruiter-subtitle">
                            Recruiter Workspace
                        </div>
                    </div>

                    <a
                        href="/"
                        className="recruiter-home-link"
                    >
                        Create Position
                    </a>

                </header>


                <main className="recruiter-container">

                    <div className="recruiter-state">

                        <div className="state-spinner" />

                        <h2>
                            Loading recruiter dashboard...
                        </h2>

                        <p>
                            Fetching your open positions
                            and candidate interviews.
                        </p>

                    </div>

                </main>

            </div>
        );
    }


    if (error && jobs.length === 0) {
        return (
            <div className="recruiter-page">

                <header className="recruiter-topbar">

                    <div>
                        <div className="recruiter-brand">
                            Hiring Interview
                        </div>

                        <div className="recruiter-subtitle">
                            Recruiter Workspace
                        </div>
                    </div>

                    <a
                        href="/"
                        className="recruiter-home-link"
                    >
                        Create Position
                    </a>

                </header>


                <main className="recruiter-container">

                    <div className="recruiter-state error-state">

                        <div className="state-icon">
                            !
                        </div>

                        <h2>
                            Unable to load dashboard
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            type="button"
                            className="recruiter-primary-button"
                            onClick={loadJobs}
                        >
                            Try Again
                        </button>

                    </div>

                </main>

            </div>
        );
    }


    return (
        <div className="recruiter-page">

            <header className="recruiter-topbar">

                <div>
                    <div className="recruiter-brand">
                        Hiring Interview
                    </div>

                    <div className="recruiter-subtitle">
                        Recruiter Workspace
                    </div>
                </div>


                <a
                    href="/"
                    className="recruiter-home-link"
                >
                    + Create Position
                </a>

            </header>


            <main className="recruiter-container recruiter-dashboard">

                {/* ------------------------------------------------
                    Page Header
                   ------------------------------------------------ */}

                <section className="dashboard-header">

                    <div>

                        <span className="recruiter-eyebrow">
                            RECRUITER DASHBOARD
                        </span>

                        <h1>
                            Manage your hiring pipeline
                        </h1>

                        <p>
                            Review open positions and evaluate
                            candidates with AI-powered assessments.
                        </p>

                    </div>

                </section>


                {/* ------------------------------------------------
                    KPI Cards
                   ------------------------------------------------ */}

                <section className="dashboard-kpi-grid">

                    <div className="dashboard-kpi">

                        <div className="kpi-icon">
                            ◇
                        </div>

                        <div>
                            <span>
                                Open Positions
                            </span>

                            <strong>
                                {jobs.length}
                            </strong>
                        </div>

                    </div>


                    <div className="dashboard-kpi">

                        <div className="kpi-icon">
                            ◎
                        </div>

                        <div>
                            <span>
                                Total Interviews
                            </span>

                            <strong>
                                {interviews.length}
                            </strong>
                        </div>

                    </div>


                    <div className="dashboard-kpi">

                        <div className="kpi-icon">
                            ✓
                        </div>

                        <div>
                            <span>
                                Completed
                            </span>

                            <strong>
                                {completedCount}
                            </strong>
                        </div>

                    </div>


                    <div className="dashboard-kpi">

                        <div className="kpi-icon">
                            ✦
                        </div>

                        <div>
                            <span>
                                High Fit
                            </span>

                            <strong>
                                {highFitCount}
                            </strong>
                        </div>

                    </div>

                </section>


                {/* ------------------------------------------------
                    Open Positions
                   ------------------------------------------------ */}

                <section className="dashboard-section">

                    <div className="dashboard-section-header">

                        <div>

                            <span className="panel-label">
                                OPEN POSITIONS
                            </span>

                            <h2>
                                Your hiring pipeline
                            </h2>

                            <p>
                                Select a position to review
                                its candidate interviews.
                            </p>

                        </div>

                        <span className="dashboard-section-count">
                            {jobs.length}{" "}
                            {jobs.length === 1
                                ? "position"
                                : "positions"}
                        </span>

                    </div>


                    {jobs.length === 0 ? (
                        <div className="dashboard-empty">

                            <div className="empty-icon">
                                +
                            </div>

                            <h3>
                                No open positions yet
                            </h3>

                            <p>
                                Create your first position
                                to start your hiring pipeline.
                            </p>

                            <a
                                href="/"
                                className="recruiter-primary-button"
                            >
                                Create Position
                            </a>

                        </div>
                    ) : (
                        <div className="position-grid">

                            {jobs.map((job) => {

                                const skills =
                                    getJobSkills(job);

                                const isSelected =
                                    String(job.id) ===
                                    String(selectedJobId);

                                return (
                                    <button
                                        key={job.id}
                                        type="button"
                                        className={
                                            `position-card ${
                                                isSelected
                                                    ? "position-card-selected"
                                                    : ""
                                            }`
                                        }
                                        onClick={() =>
                                            setSelectedJobId(
                                                job.id
                                            )
                                        }
                                    >

                                        <div className="position-card-top">

                                            <div className="position-icon">
                                                {(
                                                    job.title ||
                                                    "J"
                                                )
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <span
                                                className={
                                                    `position-indicator ${
                                                        isSelected
                                                            ? "active"
                                                            : ""
                                                    }`
                                                }
                                            >
                                                {isSelected
                                                    ? "Selected"
                                                    : "Open"}
                                            </span>

                                        </div>


                                        <h3>
                                            {job.title ||
                                                "Untitled Position"}
                                        </h3>


                                        <div className="position-skills">

                                            {skills
                                                .slice(0, 4)
                                                .map(
                                                    (
                                                        skill,
                                                        index
                                                    ) => (
                                                        <span
                                                            key={`${job.id}-${index}`}
                                                        >
                                                            {
                                                                getSkillName(
                                                                    skill
                                                                )
                                                            }
                                                        </span>
                                                    )
                                                )}

                                            {skills.length > 4 && (
                                                <span>
                                                    +
                                                    {skills.length -
                                                        4}
                                                </span>
                                            )}

                                        </div>


                                        <div className="position-card-footer">

                                            <span>
                                                Created{" "}
                                                {formatDate(
                                                    job.created_at
                                                )}
                                            </span>

                                            <span>
                                                View →
                                            </span>

                                        </div>

                                    </button>
                                );
                            })}

                        </div>
                    )}

                </section>


                {/* ------------------------------------------------
                    Selected Position
                   ------------------------------------------------ */}

                {selectedJob && (
                    <section className="selected-position">

                        <div className="selected-position-main">

                            <div className="selected-position-icon">
                                {(
                                    selectedJob.title ||
                                    "J"
                                )
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>


                            <div>

                                <span className="panel-label">
                                    SELECTED POSITION
                                </span>

                                <h2>
                                    {selectedJob.title ||
                                        "Untitled Position"}
                                </h2>

                                <div className="selected-skills">

                                    {getJobSkills(
                                        selectedJob
                                    ).map(
                                        (
                                            skill,
                                            index
                                        ) => (
                                            <span
                                                key={index}
                                            >
                                                {getSkillName(
                                                    skill
                                                )}
                                            </span>
                                        )
                                    )}

                                </div>

                            </div>

                        </div>


                        <div className="selected-position-stats">

                            <div>
                                <span>
                                    Interviews
                                </span>

                                <strong>
                                    {interviews.length}
                                </strong>
                            </div>


                            <div>
                                <span>
                                    Completed
                                </span>

                                <strong>
                                    {completedCount}
                                </strong>
                            </div>


                            <div>
                                <span>
                                    In Progress
                                </span>

                                <strong>
                                    {inProgressCount}
                                </strong>
                            </div>

                        </div>

                    </section>
                )}


                {error && (
                    <div className="recruiter-alert">
                        {error}
                    </div>
                )}


                {/* ------------------------------------------------
                    Candidate Interviews
                   ------------------------------------------------ */}

                <section className="dashboard-section interviews-section">

                    <div className="dashboard-section-header">

                        <div>

                            <span className="panel-label">
                                CANDIDATE INTERVIEWS
                            </span>

                            <h2>
                                Recent assessments
                            </h2>

                            <p>
                                Review candidate progress
                                and AI evaluation results.
                            </p>

                        </div>


                        <div className="interview-summary">

                            <span>
                                {completedCount} completed
                            </span>

                            <span>
                                {inProgressCount} in progress
                            </span>

                            <span>
                                {notStartedCount} pending
                            </span>

                        </div>

                    </div>


                    {loadingInterviews ? (
                        <div className="dashboard-loading">

                            <div className="state-spinner" />

                            <span>
                                Loading candidate
                                interviews...
                            </span>

                        </div>
                    ) : interviews.length === 0 ? (
                        <div className="dashboard-empty interviews-empty">

                            <div className="empty-icon">
                                ◎
                            </div>

                            <h3>
                                No candidate interviews yet
                            </h3>

                            <p>
                                Candidate interviews for this
                                position will appear here once
                                they are created.
                            </p>

                        </div>
                    ) : (
                        <div className="interview-table">

                            <div className="interview-table-header">

                                <span>
                                    CANDIDATE
                                </span>

                                <span>
                                    STATUS
                                </span>

                                <span>
                                    FIT
                                </span>

                                <span>
                                    CREATED
                                </span>

                                <span>
                                    ACTION
                                </span>

                            </div>


                            {interviews.map(
                                (
                                    interview,
                                    index
                                ) => {

                                    const fit =
                                        getInterviewFit(
                                            interview
                                        );

                                    const candidateName =
                                        getCandidateName(
                                            interview
                                        );

                                    return (
                                        <div
                                            key={
                                                interview.interview_id ||
                                                interview.id
                                            }
                                            className="interview-row"
                                        >

                                            <div className="interview-candidate">

                                                <div className="candidate-avatar">
                                                    {candidateName ===
                                                    "Candidate"
                                                        ? String(
                                                              index +
                                                                  1
                                                          ).padStart(
                                                              2,
                                                              "0"
                                                          )
                                                        : getCandidateInitials(
                                                              interview
                                                          )}
                                                </div>

                                                <div>

                                                    <strong>
                                                        {
                                                            candidateName
                                                        }
                                                    </strong>

                                                    <span>
                                                        Interview{" "}
                                                        {String(
                                                            interview
                                                                .interview_id ||
                                                            interview.id ||
                                                            ""
                                                        ).slice(
                                                            0,
                                                            8
                                                        )}
                                                    </span>

                                                </div>

                                            </div>


                                            <div>
                                                <span
                                                    className={
                                                        `status-badge ${
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


                                            <div>

                                                <span
                                                    className={
                                                        `fit-pill ${
                                                            getFitClass(
                                                                fit
                                                            )
                                                        }`
                                                    }
                                                >
                                                    {fit}
                                                </span>

                                            </div>


                                            <div className="interview-created">

                                                <strong>
                                                    {formatDate(
                                                        interview.created_at
                                                    )}
                                                </strong>

                                                <span>
                                                    {interview.used_at
                                                        ? "Completed"
                                                        : "Candidate pending"}
                                                </span>

                                            </div>


                                            <div>

                                                <a
                                                    href={
                                                        `/recruiter/interviews/${
                                                            interview.interview_id ||
                                                            interview.id
                                                        }`
                                                    }
                                                    className="view-assessment-button"
                                                >
                                                    View Assessment
                                                    <span>
                                                        →
                                                    </span>
                                                </a>

                                            </div>

                                        </div>
                                    );
                                }
                            )}

                        </div>
                    )}

                </section>


                <footer className="dashboard-footer">

                    <span>
                        Hiring Interview · Recruiter
                        Workspace
                    </span>

                    <a href="/">
                        Create New Position
                    </a>

                </footer>

            </main>

        </div>
    );
}


export default RecruiterDashboard;