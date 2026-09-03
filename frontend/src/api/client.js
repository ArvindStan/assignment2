const API_BASE_URL = "http://127.0.0.1:8000/api";

/**
 * Generic API request helper.
 *
 * Supports:
 * - JSON requests
 * - JSON responses
 * - text/HTML error responses
 * - multipart FormData requests
 */
async function request(endpoint, options = {}) {
    const {
        method = "GET",
        body,
        headers = {},
    } = options;

    const requestHeaders = {
        ...headers,
    };

    const config = {
        method,
        headers: requestHeaders,
    };

    if (
        body !== undefined &&
        body !== null &&
        !(body instanceof FormData)
    ) {
        requestHeaders["Content-Type"] = "application/json";
        config.body = JSON.stringify(body);
    }

    if (body instanceof FormData) {
        config.body = body;
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        config
    );

    const contentType =
        response.headers.get("content-type") || "";

    let data;

    if (contentType.includes("application/json")) {
        try {
            data = await response.json();
        } catch {
            data = {};
        }
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        const message =
            typeof data === "string"
                ? data
                : data?.error ||
                  data?.detail ||
                  `Request failed with status ${response.status}`;

        throw new Error(message);
    }

    return data;
}


/*
 * Skills
 */
export function getSkills() {
    return request("/skills/");
}


/*
 * Jobs
 */
export function getJobs() {
    return request("/jobs/");
}


export function createJob(title, skills) {
    return request("/jobs/", {
        method: "POST",
        body: {
            title,
            skills,
        },
    });
}


/*
 * Interview generation
 *
 * Kept as an API function for the interview-generation
 * workflow, even though the recruiter dashboard no longer
 * exposes a Generate Interview button.
 */
export function generateInterview(jobId) {
    return request(`/jobs/${jobId}/interview/`, {
        method: "POST",
    });
}


/*
 * Recruiter API
 *
 * Get all interviews belonging to a job.
 */
export function getJobInterviews(jobId) {
    return request(`/jobs/${jobId}/interviews/`);
}


/*
 * Recruiter API
 *
 * Get complete details for one interview.
 *
 * interviewId is the Interview UUID,
 * not the candidate token.
 */
export function getInterviewDetail(interviewId) {
    return request(`/interviews/${interviewId}/`);
}


/*
 * Candidate API
 *
 * Get interview information using the candidate token.
 */
export function getInterview(token) {
    return request(`/interview/${token}/`);
}


/*
 * Candidate API
 *
 * Start an interview by saving the candidate's name.
 */
export function startInterview(token, candidateName) {
    return request(`/interview/${token}/`, {
        method: "POST",
        body: {
            candidate_name: candidateName,
        },
    });
}


/*
 * Candidate API
 *
 * Submit a text transcript answer.
 */
export function submitAnswer(
    token,
    questionId,
    transcript
) {
    return request(`/interview/${token}/answer/`, {
        method: "POST",
        body: {
            question_id: questionId,
            transcript,
        },
    });
}


/*
 * Candidate API
 *
 * Submit an audio answer.
 */
export function submitAudioAnswer(
    token,
    questionId,
    audioFile
) {
    const formData = new FormData();

    formData.append(
        "question_id",
        questionId
    );

    formData.append(
        "audio",
        audioFile
    );

    return request(
        `/interview/${token}/answer/`,
        {
            method: "POST",
            body: formData,
        }
    );
}


/*
 * Candidate API
 *
 * Get completed interview result.
 */
export function getInterviewResult(token) {
    return request(
        `/interview/${token}/result/`
    );
}