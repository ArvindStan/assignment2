const API_BASE_URL = "http://127.0.0.1:8000/api";

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

if (body !== undefined && body !== null) {
    requestHeaders["Content-Type"] = "application/json";
    config.body = JSON.stringify(body);
}

const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    config
);

const contentType = response.headers.get("content-type");

let data;

if (contentType && contentType.includes("application/json")) {
    data = await response.json();
} else {
    data = await response.text();
}

if (!response.ok) {
    const message =
        typeof data === "string"
            ? data
            : data?.error || `Request failed with status ${response.status}`;

    throw new Error(message);
}

return data;


}

// GET /api/skills/
export function getSkills() {
return request("/skills/");
}

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

// POST /api/jobs/:jobId/interview/
export function generateInterview(jobId) {
return request(`/jobs/${jobId}/interview/`, {
method: "POST",
});
}

// GET /api/interview/:token/
export function getInterview(token) {
return request(`/interview/${token}/`);
}

// POST /api/interview/:token/answer/
export function submitAnswer(token, questionId, transcript) {
return request(`/interview/${token}/answer/`, {
method: "POST",
body: {
question_id: questionId,
transcript,
},
});
}

// POST /api/interview/:token/answer/ with audio
export async function submitAudioAnswer(
token,
questionId,
audioFile
) {
const formData = new FormData();


formData.append("question_id", questionId);
formData.append("audio", audioFile);

const response = await fetch(
    `${API_BASE_URL}/interview/${token}/answer/`,
    {
        method: "POST",
        body: formData,
    }
);

const contentType = response.headers.get("content-type");

let data;

if (contentType && contentType.includes("application/json")) {
    data = await response.json();
} else {
    data = await response.text();
}

if (!response.ok) {
    const message =
        typeof data === "string"
            ? data
            : data?.error || `Request failed with status ${response.status}`;

    throw new Error(message);
}

return data;


}

// GET /api/interview/:token/result/
export function getInterviewResult(token) {
return request(`/interview/${token}/result/`);
}
