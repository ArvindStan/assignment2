\# Technical Decisions



\## 1. Django REST Framework



I used Django REST Framework to expose the application APIs because the assignment requires HTTP endpoints for jobs, skills, interviews, answers, and results.



\## 2. Tokenized Candidate Interview



Candidate interviews use a unique token in the URL instead of requiring authentication. This keeps the candidate experience simple and follows the assignment requirement for a tokenized interview link.



Example:



`/interview/<token>/`



The token is also used when retrieving the interview, submitting answers, and retrieving the final result.



\## 3. LangGraph and LangChain



LangGraph is used as the orchestration layer for question generation and interview scoring. LangChain `RunnableLambda` is used for the executable workflow nodes.



The current implementation uses deterministic local logic so the assignment can run without requiring an external LLM API key.



\## 4. Speech-to-Text Abstraction



Speech-to-text is isolated behind a `SpeechToTextService` class. This keeps the API layer independent from a specific transcription provider and allows Whisper or another provider to be introduced without changing the interview API.



For the current assignment implementation, the service uses a deterministic local stub rather than an external paid transcription API.



\## 5. Audio Storage



Uploaded candidate audio is stored through Django's file storage mechanism using the `Answer.audio` field. The original audio can therefore be retained alongside the generated transcript.



\## 6. Interview Expiration and Single Use



Interview links expire after 24 hours and cannot be reused after the interview is completed.



This prevents an old or completed candidate link from being used again.



\## 7. Exactly Five Questions



The interview-generation service always produces exactly five questions. Questions are generated from the job's required skills, with additional questions generated when fewer than five distinct skills are selected.



\## 8. Deterministic Interview Scoring



The assignment scoring implementation is deterministic and local. Ratings are calculated from the available transcript content and mapped to a 1–5 skill rating.



This avoids requiring an external AI service or API key while keeping the scoring workflow replaceable.



\## 9. React + Vite Frontend



The frontend uses React with Vite. The frontend communicates with Django through a small API client layer in `src/api/client.js`, keeping HTTP communication separate from page components.



\## 10. Error Handling



The frontend API client checks HTTP responses and converts JSON API errors into JavaScript errors so individual pages can display useful error messages.



The backend also validates required fields and returns appropriate HTTP status codes for invalid requests, expired interviews, and already-used interview links.



\## 11. Scope Trade-offs



The priority was to deliver a complete working end-to-end assignment within the available scope:



Job creation → interview generation → tokenized candidate interview → text/audio answer submission → interview completion → scoring → results.



The speech-to-text integration point is intentionally isolated so a production transcription provider such as Whisper can be plugged into the service without changing the rest of the application.



