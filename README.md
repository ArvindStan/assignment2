# Hiring Interview Application

Full-stack hiring interview application built with Django REST Framework, React/Vite, LangChain, LangGraph, Pydantic, and Ollama.

The application allows recruiters to create jobs, define required skills, generate technical interviews, share candidate interview links, collect text or audio answers, and review AI-generated interview results.

## Implemented

* Create and list jobs with required skills and ratings
* Generate five technical interview questions using a real LLM
* Candidate token-based interview links with 24-hour expiry
* Candidate name capture before starting an interview
* Candidate text answers
* Browser-based audio recording and audio upload
* Local speech-to-text transcription
* Automatic interview completion
* AI-based semantic interview scoring
* Skill-level ratings, overall fit score, and summary
* Recruiter dashboard showing interviews and statuses
* Recruiter interview detail page with transcripts and audio
* Pydantic structured AI outputs
* Automated backend tests

## AI Pipeline

AI functionality is implemented in `interviews/services/ai.py`.

### Question generation

```text
START
  -> Prepare skill context
  -> Generate questions with LLM
  -> Validate structured output
  -> END
```

### Interview scoring

```text
START
  -> Prepare skills and transcripts
  -> Evaluate answers with LLM
  -> Validate structured output
  -> END
```

LangChain handles the LLM integration and LangGraph defines the processing workflows. Pydantic models enforce structured outputs.

The scoring evaluates the content of candidate transcripts, including technical correctness, depth, practical experience, reasoning, and relevance. Transcript length is not used as the scoring mechanism.

Supported providers:

* Ollama — default, local development
* OpenAI — optional

AI configuration is provided through environment variables.

## Setup

### Backend

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt

python manage.py migrate
python manage.py seed_skills
python manage.py runserver
```

### Ollama

Install Ollama and pull the configured model:

```powershell
ollama pull llama3.2:3b
```

Configure `.env`:

```env
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2:3b
OLLAMA_BASE_URL=http://localhost:11434
```

OpenAI can be used instead:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4o-mini
```

API keys are read from environment configuration and are not hardcoded in the application.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

## Testing

Run the backend tests:

```powershell
python manage.py test interviews
```

Current result:

```text
25 tests passing
```

Build the frontend:

```powershell
cd frontend
npm run build
```

## Main API Endpoints

```text
GET  /api/skills/
POST /api/jobs/
GET  /api/jobs/
POST /api/jobs/{job_id}/interview/
GET  /api/jobs/{job_id}/interviews/
GET  /api/interview/{token}/
POST /api/interview/{token}/answer/
GET  /api/interview/{token}/result/
GET  /api/interviews/{interview_id}/
```

## Known Limitations

* Recruiter authentication and authorization are not implemented.
* SQLite is used for development.
* The implementation uses Django REST Framework rather than the FastAPI stack specified in the original assignment.
* PostgreSQL/Alembic are not currently used.

## Project Structure

```text
assignment2/

├── hiring/
├── interviews/
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   ├── tests.py
│   └── services/
│       ├── ai.py
│       └── stt.py
├── frontend/
├── skills_seed.json
├── requirements.txt
├── DECISIONS.md
└── manage.py
```

See `DECISIONS.md` for the main implementation decisions.
