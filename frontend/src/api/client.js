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

    // JSON body
    if (
        body !== undefined &&
        body !== null &&
        !(body instanceof FormData)
    ) {
        requestHeaders["Content-Type"] = "application/json";
        config.body = JSON.stringify(body);
    }

    // FormData body
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
        data = await response.json();
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


// ============================================================
// SKILLS
// ============================================================

// GET /api/skills/
export function getSkills() {
    return request("/skills/");
}


// ============================================================
// JOBS
// ============================================================

// GET /api/jobs/
export function getJobs() {
    return request("/jobs/");
}


// POST /api/jobs/
export function createJob(title, skills) {
    return request("/jobs/", {
        method: "POST",
        body: {
            title,
            skills,
        },
    });
}


// ============================================================
// INTERVIEW GENERATION
// ============================================================

// POST /api/jobs/:jobId/interview/
export function generateInterview(jobId) {
    return request(`/jobs/${jobId}/interview/`, {
        method: "POST",
    });
}


// ============================================================
// CANDIDATE INTERVIEW
// ============================================================

// GET /api/interview/:token/
export function getInterview(token) {
    return request(`/interview/${token}/`);
}


// ============================================================
// TEXT ANSWER
// ============================================================

// POST /api/interview/:token/answer/
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


// ============================================================
// AUDIO ANSWER
// ============================================================

// POST /api/interview/:token/answer/
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


// ============================================================
// RESULTS
// ============================================================

// GET /api/interview/:token/result/
export function getInterviewResult(token) {
    return request(
        `/interview/${token}/result/`
    );
}

