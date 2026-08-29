# Hiring Interview API

A full-stack hiring interview application built with Django REST Framework and React. The application allows recruiters to create jobs with required skills, generate structured technical interviews, provide candidates with tokenized interview links, collect candidate answers, and produce skill-level interview results.

The implementation focuses on a clean, testable backend with a deterministic local AI-service abstraction so that the application can run without external paid AI API credentials.

> **Implementation status:** The core hiring interview workflow is implemented and tested. The remaining incomplete assignment requirements are **browser-based voice recording** and **speech-to-text transcription**. The current candidate workflow accepts text transcripts directly. The planned production solution for these two features is documented below.

---

## Features

### Implemented

* List available skills
* Create jobs with required skills and ratings
* List jobs with their required skills and ratings
* Generate a five-question interview based on job skills
* Prevent duplicate interview generation for the same job
* Generate a unique candidate interview token
* Generate a candidate interview URL
* Expire interview links after 24 hours
* Allow candidates to retrieve their interview questions
* Submit candidate transcript answers
* Validate required answer fields
* Associate answers with interview questions
* Prevent submissions after interview completion
* Automatically complete the interview after all questions are answered
* Automatically score the completed interview
* Store individual skill ratings
* Store overall fit score
* Store interview summary
* Retrieve completed interview results
* Database-level uniqueness constraints
* Explicit interview state management
* Deterministic local AI-service abstraction
* Pydantic structured AI-service outputs
* Automated API tests
* React/Vite frontend for the implemented workflow
* CORS configuration for frontend/backend communication

### Not Yet Implemented

The following two related requirements are not currently implemented:

1. Browser-based candidate voice recording
2. Speech-to-text transcription of recorded answers

The reason is that the current implementation prioritizes a deterministic, fully testable interview workflow without introducing an external speech-processing dependency or requiring microphone/audio infrastructure during development and automated testing.

The missing functionality and the intended production implementation are described in detail in the [Known Limitations and Planned Voice Pipeline](#known-limitations-and-planned-voice-pipeline) section.

---

# Tech Stack

## Backend

* Python
* Django 5.2
* Django REST Framework
* SQLite
* Pydantic
* django-cors-headers

## Frontend

* React
* Vite
* JavaScript

## Testing

* Django test framework
* REST API tests

## AI

The application currently uses a deterministic local AI-service abstraction.

This avoids requiring an external LLM API during development and testing while keeping the AI logic isolated so that a real provider can be introduced later.

---

# Project Structure

```text
assignment2/

├── hiring/
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
│
├── interviews/
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   ├── tests.py
│   ├── services/
│   │   └── ai.py
│   ├── management/
│   │   └── commands/
│   │       └── seed_skills.py
│   └── migrations/
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── skills_seed.json
├── manage.py
├── requirements.txt
└── .gitignore
```

---

# Setup

## Backend

Create and activate a virtual environment:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Run database migrations:

```powershell
python manage.py migrate
```

Seed the available skills:

```powershell
python manage.py seed_skills
```

Run Django's system check:

```powershell
python manage.py check
```

Start the backend server:

```powershell
python manage.py runserver
```

The API will be available at:

```text
http://127.0.0.1:8000/
```

---

## Frontend

Open a second terminal and run:

```powershell
cd frontend
npm install
npm run dev
```

The React/Vite frontend communicates with the Django REST API.

---

# API Endpoints

## 1. List Skills

```http
GET /api/skills/
```

Returns the available skills that can be assigned to a job.

Example response:

```json
[
  {
    "skill_id": "tl.python",
    "name": "Python",
    "dimension": "technical_language"
  }
]
```

---

# 2. Create Job

```http
POST /api/jobs/
```

Creates a job and associates required skills and their expected ratings.

Example request:

```json
{
  "title": "Senior Backend Engineer",
  "skills": [
    {
      "skill_id": "tl.python",
      "required_rating": 4
    },
    {
      "skill_id": "tl.postgres",
      "required_rating": 4
    },
    {
      "skill_id": "kn.apidesign",
      "required_rating": 4
    }
  ]
}
```

Each required skill contains:

* `skill_id`
* `required_rating`

---

# 3. List Jobs

```http
GET /api/jobs/
```

Returns all jobs together with their required skills and ratings.

---

# 4. Generate Interview

```http
POST /api/jobs/{job_id}/interview/
```

Generates a five-question technical interview based on the required skills of the selected job.

The response contains:

* Interview ID
* Candidate token
* Candidate URL
* Expiration timestamp
* Generated questions

Example conceptually:

```json
{
  "interview_id": "ea6191cb-38bd-4788-bbd0-9c276a15b75b",
  "token": "candidate-token",
  "candidate_url": "/api/interview/candidate-token/",
  "expires_at": "2026-08-30T10:00:00Z",
  "questions": [
    {
      "id": 1,
      "question": "Explain how you would design a scalable Python backend.",
      "skill": "Python",
      "order": 1
    }
  ]
}
```

The interview contains five questions.

---

# 5. Duplicate Interview Prevention

Calling:

```http
POST /api/jobs/{job_id}/interview/
```

multiple times for the same job does not generate multiple interviews.

If an interview with generated questions already exists for the job, the existing interview is returned.

This provides idempotent behavior at the API level for repeated interview-generation requests during normal usage.

---

# 6. Candidate Interview

```http
GET /api/interview/{token}/
```

Allows a candidate to retrieve the interview questions using the generated candidate token.

The tokenized interview link is valid for 24 hours.

The interview cannot be used after it has been completed.

Expired interviews return:

```text
410 Gone
```

---

# 7. Submit Candidate Answer

```http
POST /api/interview/{token}/answer/
```

The current implementation accepts a candidate transcript directly.

Example:

```json
{
  "question_id": 6,
  "transcript": "I have extensive professional experience building backend services with Python..."
}
```

The answer is stored against the corresponding interview question.

The API validates the interview token, question, and required answer fields before storing the answer.

---

# 8. Automatic Interview Completion

After the candidate has answered all five questions:

```text
All questions answered
        |
        v
Interview marked completed
        |
        v
AI service scores interview
        |
        v
Skill scores stored
        |
        v
Interview result stored
```

The interview receives a `used_at` timestamp and can no longer accept additional answers.

---

# 9. Get Interview Result

```http
GET /api/interview/{token}/result/
```

Returns the completed interview result.

The result includes:

* Interview status
* Overall fit score
* Summary
* Individual skill ratings

Example:

```json
{
  "interview_id": "ea6191cb-38bd-4788-bbd0-9c276a15b75b",
  "status": "completed",
  "fit_score": "High",
  "summary": "The candidate completed the interview.",
  "skill_scores": [
    {
      "skill_id": "tl.python",
      "skill": "Python",
      "rating": 4
    },
    {
      "skill_id": "tl.postgres",
      "skill": "PostgreSQL",
      "rating": 4
    },
    {
      "skill_id": "kn.apidesign",
      "skill": "REST API design",
      "rating": 4
    }
  ]
}
```

---

# Interview Flow

```text
Recruiter
    |
    v
Create Job
    |
    v
Assign Required Skills + Ratings
    |
    v
Generate Interview
    |
    v
Generate 5 Questions
    |
    v
Generate Candidate Token
    |
    v
Candidate Opens Interview
    |
    v
Candidate Answers Questions
    |
    v
Submit Transcripts
    |
    v
All Questions Answered?
    |
    +---- No ----> Continue Interview
    |
    +---- Yes
            |
            v
       Score Interview
            |
            v
      Store Skill Scores
            |
            v
      Store Interview Result
```

The current candidate answer step uses text transcripts.

Voice recording and automatic speech-to-text are the remaining incomplete pieces.

---

# Data Model

## Skill

Represents a skill available in the system.

Important fields:

* `skill_id`
* `name`
* `dimension`

---

## Job

Represents a job being evaluated.

A job can have multiple required skills through `JobSkill`.

---

## JobSkill

Connects a job to a required skill and stores the required rating.

A database-level unique constraint prevents the same skill from being assigned to the same job more than once.

---

## Interview

Represents a generated candidate interview.

Important fields:

* UUID primary key
* Job
* Candidate token
* Status
* Expiration timestamp
* Used timestamp
* Creation timestamp

---

## InterviewQuestion

Stores the questions generated for an interview.

Each question:

* Belongs to an interview
* Is associated with a skill
* Has an explicit order

A uniqueness constraint prevents duplicate question ordering within the same interview.

---

## Answer

Stores the candidate's transcript for an interview question.

Each interview question can have one answer.

---

## SkillScore

Stores the rating assigned to a skill for a completed interview.

A unique constraint prevents duplicate skill scores for the same interview and skill.

---

## InterviewResult

Stores the overall result of the interview.

It contains:

* Fit score
* Summary
* Interview reference

---

# AI Service

AI-related functionality is isolated in:

```text
interviews/services/ai.py
```

The `AIService` exposes two main operations:

```python
generate_questions(skills)
```

and:

```python
score_interview(skills, transcripts)
```

The current implementation is deterministic and local.

This means:

* No external AI API is required
* No API key is required
* Tests are repeatable
* Development does not depend on network connectivity
* Generated results are predictable

The service uses Pydantic models to define structured outputs.

The API layer does not need to know how the AI implementation works.

This allows the local implementation to be replaced with an actual LLM provider later without changing the API contract.

---

# Scoring

The current local scoring implementation uses transcript length as a deterministic development/testing strategy.

The rating rules are:

| Transcript length | Rating |
| ----------------- | -----: |
| 80+ words         |      5 |
| 40–79 words       |      4 |
| 20–39 words       |      3 |
| 1–19 words        |      2 |
| No transcript     |      1 |

The average skill rating determines the overall fit score:

| Average Rating | Fit Score |
| -------------- | --------- |
| >= 4           | High      |
| >= 3           | Medium    |
| < 3            | Low       |

This is intentionally a mock scoring implementation.

It is not intended to represent a production-quality candidate evaluation system.

A production implementation should evaluate the semantic quality, correctness, relevance, evidence, and depth of the candidate's answers rather than relying on transcript length.

---

# Interview Expiration and Single-Use Behavior

Each generated interview expires 24 hours after creation.

Once the expiration time is reached, the interview cannot be accessed or answered.

Expired interviews return:

```text
410 Gone
```

Once all questions have been answered:

```text
used_at = current timestamp
status = completed
```

Further answer submissions are rejected.

This prevents a candidate from modifying an already completed interview.

---

# Known Limitations and Planned Voice Pipeline

The core hiring workflow is implemented, but two related assignment requirements remain incomplete:

1. Browser-based voice recording
2. Speech-to-text transcription

These are explicitly disclosed here rather than being represented as implemented functionality.

## Why They Were Not Implemented

The current implementation was intentionally kept deterministic and independently testable without introducing an external audio-processing dependency.

Voice recording and transcription introduce additional infrastructure and operational requirements, including:

* Browser microphone permissions
* Audio format handling
* Audio file upload
* Audio storage
* Speech-to-text provider integration
* External API credentials or local speech models
* Network/API failure handling
* Potential asynchronous processing for longer recordings
* Additional testing requirements for audio data

The implemented text-transcript workflow allowed the complete interview lifecycle, scoring logic, token handling, expiration behavior, database relationships, and API tests to be developed and verified independently of those external dependencies.

The missing voice functionality is therefore a clearly identified extension rather than an undocumented gap.

---

## Planned Voice Recording Solution

The React frontend can use the browser's `MediaRecorder` API.

The expected flow would be:

```text
Candidate clicks Start Recording
        |
        v
Browser requests microphone permission
        |
        v
MediaRecorder captures audio
        |
        v
Candidate clicks Stop Recording
        |
        v
Audio Blob created
        |
        v
Upload audio to backend
```

The frontend would send the recorded audio to an endpoint such as:

```http
POST /api/interview/{token}/answer/audio/
```

---

## Planned Speech-to-Text Solution

The backend would process the uploaded audio through a dedicated speech-to-text service.

The architecture could be:

```text
Candidate Audio
      |
      v
Django API
      |
      v
Audio Validation
      |
      v
Temporary/Object Storage
      |
      v
Speech-to-Text Service
      |
      v
Transcript
      |
      v
Answer Model
      |
      v
Interview Scoring
```

A provider such as:

* OpenAI Whisper
* Google Cloud Speech-to-Text
* AWS Transcribe

could be used.

The implementation should isolate the provider behind a dedicated service:

```text
interviews/
└── services/
    ├── ai.py
    └── speech_to_text.py
```

For example, the service interface could expose:

```python
transcribe(audio_file) -> transcript
```

This keeps the rest of the application independent of the selected speech-to-text provider.

---

## Production Audio Considerations

A production implementation should also:

* Validate supported audio formats
* Enforce maximum upload size
* Validate the interview token before accepting audio
* Store audio securely
* Use object storage for larger audio files
* Avoid storing large audio binaries directly in the database
* Delete temporary audio according to a retention policy
* Handle transcription failures and retries
* Process longer recordings asynchronously
* Add rate limiting
* Protect endpoints with appropriate authentication/authorization
* Avoid publicly exposing candidate recordings

---

# Frontend

The project includes a React/Vite frontend.

The implemented frontend workflow supports:

* Creating jobs
* Selecting required skills
* Assigning skill ratings
* Generating interviews
* Displaying generated interview questions
* Candidate interview interaction
* Submitting text answers
* Viewing interview results

The frontend does not currently implement microphone recording or speech-to-text.

Those features are documented as planned extensions above.

---

# Testing

Run the complete interview application test suite:

```powershell
python manage.py test interviews
```

The test suite covers:

* Skill endpoint
* Job creation
* Required skill handling
* Interview generation
* Five-question generation
* Duplicate interview prevention
* Candidate interview retrieval
* Required answer fields
* Answer submission
* Interview completion
* Skill scoring
* Interview result creation
* Prevention of answers after completion
* Result endpoint
* Expired interview handling

Current test result:

```text
Found 12 test(s).

Ran 12 tests

OK
```

> If additional tests are added before submission, update the test count above to match the actual result.

---

# Manual API Verification

The complete backend workflow can be manually verified using PowerShell.

## 1. Create a Job

```powershell
$job = Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/jobs/" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{
    "title": "Senior Backend Engineer",
    "skills": [
      {
        "skill_id": "tl.python",
        "required_rating": 4
      },
      {
        "skill_id": "tl.postgres",
        "required_rating": 4
      },
      {
        "skill_id": "kn.apidesign",
        "required_rating": 4
      }
    ]
  }'
```

---

## 2. Generate the Interview

```powershell
$interview = Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/jobs/$($job.id)/interview/" `
  -Method Post
```

---

## 3. Retrieve the Candidate Interview

```powershell
$candidateInterview = Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/interview/$($interview.token)/" `
  -Method Get
```

---

## 4. Submit an Answer

```powershell
Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/interview/$($interview.token)/answer/" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{
    "question_id": 1,
    "transcript": "I have professional experience building backend services with Python..."
  }'
```

Repeat for all five questions.

---

## 5. Retrieve the Result

```powershell
Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/interview/$($interview.token)/result/" `
  -Method Get
```

---

# Design Decisions

## Django REST Framework

Django REST Framework was selected for the backend because it provides a mature and straightforward way to expose REST APIs while integrating naturally with Django's ORM, validation, routing, and testing infrastructure.

---

## Service Layer for AI

AI-related functionality is isolated in:

```text
interviews/services/ai.py
```

rather than being embedded directly inside the views.

This keeps the views focused on:

* Request handling
* Validation
* Database operations
* Response generation

while the service owns:

* Question generation
* Interview scoring

This also makes it easier to replace the deterministic implementation with a real AI provider later.

---

## Deterministic Local AI

A deterministic local implementation was selected for the current version so that:

* The project can run without external credentials
* Automated tests remain deterministic
* Results are reproducible
* Development does not depend on external network services

A real LLM can be introduced behind the same service abstraction later.

---

## UUID-Based Candidate Tokens

Candidate interview links use UUID-based tokens rather than sequential database IDs.

This prevents the candidate URL from directly exposing predictable sequential identifiers.

---

## Database Constraints

Database-level constraints are used for important relationships, including:

* Job + Skill uniqueness
* Interview + Question order uniqueness
* Interview + Skill score uniqueness

This protects data integrity even if application-level validation is bypassed.

---

## Explicit Interview State

The interview follows an explicit state lifecycle:

```text
not_started
     |
     v
in_progress
     |
     v
completed
```

The additional `used_at` timestamp records when the interview became unusable.

This makes interview lifecycle behavior explicit and prevents further modifications after completion.

---

# HTTP Behavior

The API follows standard HTTP semantics for common success and error cases.

Typical responses include:

* `200 OK` — successful retrieval or operation
* `201 Created` — newly created resources
* `400 Bad Request` — invalid input or missing required data
* `404 Not Found` — requested resource does not exist
* `410 Gone` — interview has expired
* Appropriate conflict/state errors when an operation is invalid for the current interview state

---

# Future Improvements

For a production deployment, the following improvements could be added:

* Browser microphone recording
* Speech-to-text transcription
* Real LLM integration
* Semantic AI-based interview scoring
* Authentication and authorization
* PostgreSQL instead of SQLite
* Environment-based configuration for secrets
* Asynchronous/background processing for AI and speech-to-text calls
* Rate limiting
* Structured serializers for more complex API responses
* Stronger transactional handling for multi-step writes
* Production CORS configuration
* Logging and monitoring
* OpenAPI/Swagger documentation
* Secure object storage for candidate audio
* Audio retention and cleanup policies
* Pagination for large skill/job collections
* Containerization
* Production deployment configuration

---

# Implementation Summary

The implemented application supports the core hiring interview lifecycle:

```text
Skills
  |
  v
Create Job
  |
  v
Assign Required Skills + Ratings
  |
  v
Generate Interview
  |
  v
Generate 5 Questions
  |
  v
Create Candidate Token
  |
  v
Candidate Opens Interview
  |
  v
Candidate Submits Text Transcripts
  |
  v
All Questions Answered
  |
  v
Automatic Scoring
  |
  v
Skill Scores + Fit Score + Summary
```

### Implementation status

| Requirement                        | Status             |
| ---------------------------------- | ------------------ |
| Skills management                  | ✅ Implemented      |
| Job creation                       | ✅ Implemented      |
| Required skills and ratings        | ✅ Implemented      |
| AI question generation abstraction | ✅ Implemented      |
| Five interview questions           | ✅ Implemented      |
| Candidate token                    | ✅ Implemented      |
| Candidate interview URL            | ✅ Implemented      |
| 24-hour expiration                 | ✅ Implemented      |
| Candidate interview retrieval      | ✅ Implemented      |
| Text transcript submission         | ✅ Implemented      |
| Interview completion               | ✅ Implemented      |
| Skill-level scoring                | ✅ Implemented      |
| Overall fit score                  | ✅ Implemented      |
| Interview summary                  | ✅ Implemented      |
| Result endpoint                    | ✅ Implemented      |
| Duplicate interview prevention     | ✅ Implemented      |
| Database constraints               | ✅ Implemented      |
| Automated API tests                | ✅ Implemented      |
| React/Vite frontend                | ✅ Implemented      |
| Browser voice recording            | ⚠️ Not implemented |
| Speech-to-text transcription       | ⚠️ Not implemented |

The two incomplete items are intentionally disclosed. The current implementation provides a complete text-based interview workflow, while the voice recording and speech-to-text components are designed as the next production extension.
