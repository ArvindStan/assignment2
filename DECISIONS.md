# Technical Decisions

## 1. Django REST Framework

I used Django REST Framework to expose the application APIs for jobs, skills, interviews, answers, and results.

The original assignment specified FastAPI. Django/DRF was chosen because it allowed the application to be implemented and tested efficiently while maintaining a clean REST API structure.

## 2. Real AI Pipeline

The interview question generation and scoring use a real LLM rather than deterministic or hardcoded scoring rules.

LangChain handles the LLM integration, LangGraph provides the workflow orchestration, and Pydantic models provide structured outputs.

### Question generation

```text
START
  -> Prepare required skills
  -> Generate questions with LLM
  -> Validate structured response
  -> END
```

### Interview scoring

```text
START
  -> Prepare skills and candidate transcripts
  -> Evaluate transcript content with LLM
  -> Validate structured response
  -> END
```

The scoring evaluates what the candidate actually said, including technical correctness, depth, reasoning, practical experience, and relevance. Transcript length is not used as the scoring mechanism.

Ollama with `llama3.2:3b` is the default local provider. OpenAI can also be configured through environment variables.

## 3. Environment-Based AI Configuration

AI provider and model configuration are loaded from environment variables rather than being hardcoded.

For example:

```env
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2:3b
OLLAMA_BASE_URL=http://localhost:11434
```

or:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4o-mini
```

This allows another developer or reviewer to provide their own API key and model configuration without modifying application code.

## 4. Tokenized Candidate Interview

Candidate interviews use a unique token in the URL instead of requiring candidate authentication.

Example:

```text
/interview/<token>/
```

The token is used to retrieve the interview, submit answers, and retrieve the final result.

This keeps the candidate experience simple while providing a shareable interview link.

## 5. Candidate Name

The candidate enters their full name before starting the interview.

The name is stored with the interview and is available to recruiters on the dashboard and interview detail page.

## 6. Speech-to-Text Abstraction

Speech-to-text is isolated behind a `SpeechToTextService` so the API layer does not depend directly on a specific transcription implementation.

The current implementation performs local speech-to-text processing and stores the resulting transcript with the candidate's answer.

This keeps the transcription component replaceable if a different provider or model is required later.

## 7. Audio Storage

Candidate audio is stored using Django's file storage mechanism through the `Answer.audio` field.

The original audio is retained alongside the generated transcript, allowing recruiters to review both the transcript and the recording.

## 8. Interview Expiration and Completion

Interview links expire after 24 hours.

Completed interviews cannot accept additional answers.

This prevents expired or completed candidate links from being reused.

## 9. Exactly Five Questions

Each generated interview contains exactly five questions.

Questions are generated based on the job's required skills and validated through the structured AI output before being stored.

## 10. Semantic Interview Scoring

Interview scoring is performed by the AI model using the candidate's transcript and the job's required skills.

The scoring considers the substance of the candidate's response rather than relying on simple heuristics such as word count.

The system stores skill-level ratings, an overall fit score, and an AI-generated summary.

## 11. React + Vite Frontend

The frontend uses React with Vite.

HTTP communication with the backend is centralized in `src/api/client.js`, keeping API calls separate from page components.

The candidate workflow includes text answers, browser microphone recording, audio upload, speech-to-text processing, and interview results.

## 12. Recruiter Workflow

The recruiter interface provides:

* Job listing
* Interviews associated with each job
* Interview status
* Candidate information
* Interview detail
* Candidate transcripts
* Candidate audio
* AI-generated evaluation results

This was implemented to cover the recruiter review workflow required by the assignment.

## 13. Error Handling

The frontend API client checks HTTP responses and converts API errors into JavaScript errors so individual pages can display useful error messages.

The backend validates required fields and handles invalid requests, expired interviews, completed interviews, and other invalid states with appropriate HTTP responses.

## 14. Scope Trade-offs

The main priority of the rework was the AI pipeline because it is the core requirement.

The implemented workflow is:

```text
Job creation
    ->
Interview generation
    ->
AI-generated questions
    ->
Tokenized candidate interview
    ->
Text/audio answers
    ->
Speech-to-text
    ->
AI semantic scoring
    ->
Interview results
    ->
Recruiter review
```

The following limitations remain:

* Recruiter authentication and authorization are not implemented.
* SQLite is used for development.
* The implementation uses Django REST Framework instead of the FastAPI stack specified in the original assignment.
* PostgreSQL/Alembic are not currently used.

These are deliberate scope trade-offs and are documented rather than hidden.
