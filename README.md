\# Hiring Interview API



A Django REST API for creating jobs, associating required skills, generating structured technical interviews, collecting candidate answers, and producing skill-level interview scores.



The project is implemented as a backend take-home assignment using Django, Django REST Framework, SQLite, and a deterministic local AI-service abstraction.



\## Features



\* List available skills

\* Create and list jobs with required skills and ratings

\* Generate a five-question interview for a job

\* Prevent duplicate interview generation for the same job

\* Generate a unique candidate interview token

\* Expire interview links after 24 hours

\* Allow candidates to retrieve their interview questions

\* Submit candidate transcript answers

\* Prevent submissions after interview completion

\* Automatically score the interview when all questions are answered

\* Store per-skill ratings

\* Store an overall fit score and summary

\* Retrieve completed interview results

\* Automated API tests



\## Tech Stack



\* Python

\* Django 5.2

\* Django REST Framework

\* SQLite

\* Pydantic

\* django-cors-headers

\* pytest-compatible Django test runner through `manage.py test`



\## Project Structure



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

│   │       └── seed\_skills.py

│   └── migrations/

│

├── skills\_seed.json

├── manage.py

├── requirements.txt

└── .gitignore

```



\## Setup



Create and activate a virtual environment:



```powershell

python -m venv venv

.\\venv\\Scripts\\Activate.ps1

```



Install dependencies:



```powershell

pip install -r requirements.txt

```



Run migrations:



```powershell

python manage.py migrate

```



Seed the available skills:



```powershell

python manage.py seed\_skills

```



Run Django's system check:



```powershell

python manage.py check

```



Start the development server:



```powershell

python manage.py runserver

```



The API will be available at:



```text

http://127.0.0.1:8000/

```



\## API Endpoints



\### List Skills



```http

GET /api/skills/

```



Returns the available skills that can be assigned to a job.



\### Create Job



```http

POST /api/jobs/

```



Example:



```json

{

&#x20;   "title": "Senior Backend Engineer",

&#x20;   "skills": \[

&#x20;       {

&#x20;           "skill\_id": "tl.python",

&#x20;           "required\_rating": 4

&#x20;       },

&#x20;       {

&#x20;           "skill\_id": "tl.postgres",

&#x20;           "required\_rating": 4

&#x20;       },

&#x20;       {

&#x20;           "skill\_id": "kn.apidesign",

&#x20;           "required\_rating": 4

&#x20;       }

&#x20;   ]

}

```



\### List Jobs



```http

GET /api/jobs/

```



Returns jobs together with their required skills and ratings.



\### Generate Interview



```http

POST /api/jobs/{job\_id}/interview/

```



Generates five interview questions based on the job's required skills.



The endpoint returns:



\* Interview ID

\* Candidate token

\* Candidate URL

\* Expiration time

\* Generated questions



If an interview has already been generated for the job, the existing interview is returned instead of generating another one.



\### Candidate Interview



```http

GET /api/interview/{token}/

```



Returns the interview questions available to the candidate.



Interview links are valid for 24 hours and can only be used until the interview is completed.



\### Submit Answer



```http

POST /api/interview/{token}/answer/

```



Example:



```json

{

&#x20;   "question\_id": 6,

&#x20;   "transcript": "I have extensive professional experience building backend services with Python..."

}

```



Answers are stored against the corresponding interview question.



When all questions have been answered, the interview is automatically marked as completed and scoring is performed.



\### Get Interview Result



```http

GET /api/interview/{token}/result/

```



Returns:



\* Interview status

\* Overall fit score

\* Summary

\* Individual skill ratings



Example:



```json

{

&#x20;   "interview\_id": "ea6191cb-38bd-4788-bbd0-9c276a15b75b",

&#x20;   "status": "completed",

&#x20;   "fit\_score": "High",

&#x20;   "summary": "The candidate completed the interview.",

&#x20;   "skill\_scores": \[

&#x20;       {

&#x20;           "skill\_id": "tl.python",

&#x20;           "skill": "Python",

&#x20;           "rating": 4

&#x20;       },

&#x20;       {

&#x20;           "skill\_id": "tl.postgres",

&#x20;           "skill": "PostgreSQL",

&#x20;           "rating": 4

&#x20;       },

&#x20;       {

&#x20;           "skill\_id": "kn.apidesign",

&#x20;           "skill": "REST API design",

&#x20;           "rating": 4

&#x20;       }

&#x20;   ]

}

```



\## Interview Flow



```text

Create Job

&#x20;   |

&#x20;   v

Assign Required Skills

&#x20;   |

&#x20;   v

Generate Interview

&#x20;   |

&#x20;   v

Create 5 Questions

&#x20;   |

&#x20;   v

Generate Candidate Token

&#x20;   |

&#x20;   v

Candidate Opens Interview

&#x20;   |

&#x20;   v

Candidate Submits Answers

&#x20;   |

&#x20;   v

All Questions Answered?

&#x20;   |

&#x20;   +---- No ----> Continue Interview

&#x20;   |

&#x20;   +---- Yes

&#x20;           |

&#x20;           v

&#x20;      Score Interview

&#x20;           |

&#x20;           v

&#x20;      Store Skill Scores

&#x20;           |

&#x20;           v

&#x20;      Store Interview Result

```



\## Data Model



\### Skill



Represents a skill available in the system.



Important fields:



\* `skill\_id`

\* `name`

\* `dimension`



\### Job



Represents a job being evaluated.



A job can have multiple skills through the `JobSkill` model.



\### JobSkill



Connects a job to a required skill and stores the required rating.



A unique constraint prevents the same skill from being assigned to the same job more than once.



\### Interview



Represents a generated candidate interview.



Important fields:



\* UUID primary key

\* Job

\* Candidate token

\* Status

\* Expiration timestamp

\* Used timestamp

\* Creation timestamp



\### InterviewQuestion



Stores the questions generated for an interview.



Questions have an explicit order and are associated with the skill they evaluate.



\### Answer



Stores the candidate's transcript for a question.



Each question can have one answer.



\### SkillScore



Stores the rating assigned to a skill for a completed interview.



A unique constraint prevents duplicate skill scores for the same interview.



\### InterviewResult



Stores the overall interview result.



It contains:



\* Fit score

\* Summary

\* Interview reference



\## AI Service



The application separates AI-related behavior into:



```text

interviews/services/ai.py

```



The `AIService` exposes two operations:



```python

generate\_questions(skills)

```



and:



```python

score\_interview(skills, transcripts)

```



The current implementation is deterministic and local so the application can be run and tested without requiring an external paid AI API.



The service uses Pydantic models to define structured outputs for generated questions and interview scores.



This abstraction also makes it possible to replace the local implementation with an actual LLM provider later without changing the API layer.



\## Scoring



The local scoring implementation evaluates transcript length as a deterministic development/testing strategy:



\* 80+ words → rating 5

\* 40–79 words → rating 4

\* 20–39 words → rating 3

\* 1–19 words → rating 2

\* No transcript → rating 1



The average skill rating determines the overall fit:



\* Average >= 4 → `High`

\* Average >= 3 → `Medium`

\* Average < 3 → `Low`



This is intentionally a mock scoring implementation rather than a production-quality candidate evaluation model.



\## Interview Expiration and Single-Use Behavior



Each generated interview expires 24 hours after creation.



Expired interviews return:



```text

410 Gone

```



Once all questions have been answered, the interview receives a `used\_at` timestamp and is marked as completed.



Further answer submissions are rejected.



This prevents a candidate from continuing to modify an already completed interview.



\## Duplicate Interview Generation



Generating an interview for a job multiple times does not create multiple interviews.



The application checks for an existing interview with questions and returns the existing interview instead.



This provides idempotent behavior for repeated generation requests during normal usage.



\## Testing



Run the complete interview application test suite:



```powershell

python manage.py test interviews

```



The current test suite covers:



\* Skill endpoint

\* Job creation

\* Interview generation

\* Five-question generation

\* Duplicate interview prevention

\* Candidate interview retrieval

\* Answer submission

\* Required fields

\* Interview completion

\* Skill scoring

\* Interview result creation

\* Prevention of answers after completion

\* Result endpoint

\* Expired interview handling



Current result:



```text

Found 12 test(s).



Ran 12 tests



OK

```



\## Manual API Verification



Example PowerShell flow:



\### 1. Create a job



```powershell

$job = Invoke-RestMethod `

&#x20;   -Uri "http://127.0.0.1:8000/api/jobs/" `

&#x20;   -Method Post `

&#x20;   -ContentType "application/json" `

&#x20;   -Body '{

&#x20;       "title": "Senior Backend Engineer",

&#x20;       "skills": \[

&#x20;           {

&#x20;               "skill\_id": "tl.python",

&#x20;               "required\_rating": 4

&#x20;           },

&#x20;           {

&#x20;               "skill\_id": "tl.postgres",

&#x20;               "required\_rating": 4

&#x20;           },

&#x20;           {

&#x20;               "skill\_id": "kn.apidesign",

&#x20;               "required\_rating": 4

&#x20;           }

&#x20;       ]

&#x20;   }'

```



\### 2. Generate the interview



```powershell

$interview = Invoke-RestMethod `

&#x20;   -Uri "http://127.0.0.1:8000/api/jobs/$($job.id)/interview/" `

&#x20;   -Method Post

```



\### 3. Retrieve the candidate interview



```powershell

$candidateInterview = Invoke-RestMethod `

&#x20;   -Uri "http://127.0.0.1:8000/api/interview/$($interview.token)/" `

&#x20;   -Method Get

```



\### 4. Submit answers



```powershell

Invoke-RestMethod `

&#x20;   -Uri "http://127.0.0.1:8000/api/interview/$($interview.token)/answer/" `

&#x20;   -Method Post `

&#x20;   -ContentType "application/json" `

&#x20;   -Body '{

&#x20;       "question\_id": 1,

&#x20;       "transcript": "I have professional experience building backend services..."

&#x20;   }'

```



Repeat for all five questions.



\### 5. Retrieve the result



```powershell

Invoke-RestMethod `

&#x20;   -Uri "http://127.0.0.1:8000/api/interview/$($interview.token)/result/" `

&#x20;   -Method Get

```



\## Design Decisions



\### Django REST Framework



Django REST Framework was used to expose the backend functionality through HTTP APIs while keeping the API layer straightforward and testable.



\### Service Layer for AI



AI functionality is isolated in `interviews/services/ai.py` rather than placing scoring and question-generation logic directly inside views.



This keeps the API layer responsible for HTTP/request orchestration while the service handles interview-generation and scoring behavior.



\### UUID Tokens



Candidate interview links use UUID tokens instead of exposing sequential IDs.



\### Database Constraints



The application uses database-level uniqueness constraints for:



\* Job + Skill

\* Interview + Question order

\* Interview + Skill score



This protects data integrity beyond application-level validation.



\### Explicit Interview State



The interview status transitions through:



```text

not\_started

&#x20;   ↓

in\_progress

&#x20;   ↓

completed

```



The `used\_at` timestamp additionally records when the candidate's interview became unusable.



\## Future Improvements



For a production deployment, the following could be added:



\* Authentication and authorization for recruiter/admin endpoints

\* PostgreSQL instead of SQLite

\* Environment-based configuration for secrets

\* Real LLM integration

\* Async/background processing for AI calls

\* Rate limiting

\* Structured serializers instead of manually constructed response dictionaries

\* Better validation and transactional handling for multi-step writes

\* Production CORS configuration

\* Logging and monitoring

\* API documentation using OpenAPI/Swagger

\* Candidate audio upload and speech-to-text processing

\* More sophisticated AI-based scoring using transcript content and evidence

\* Pagination for large skill/job collections

\* Containerization and production deployment configuration



