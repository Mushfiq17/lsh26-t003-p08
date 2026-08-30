Team Code: LSH26-T003 
Problem code: P-08
https://lsh26-t003-p08.vercel.app/


### Setup & Run

* Clone the repository and install frontend/backend dependencies.
* Configure Firebase, OpenRouter, and API environment variables.
* Run FastAPI with Uvicorn and the Vite frontend.
* Or use the deployed Render backend and Vercel frontend.

### Requirement Proof

* Deterministic marks, grades, GPA, optional subject, practical, AB, and failure rules implemented.
* Calculation traces, summaries, validation, and edge-case handling included.
* Firebase database and OpenRouter integration implemented.

### Major Decisions

* Rule-based engine for accurate and consistent results.
* FastAPI + Firebase for backend/data storage.
* React/Vite with Vercel + Render for deployment.
* Transparent calculation traces for auditing.

### Limitations

* Requires correct environment variables and service credentials.
* Based on the defined dataset and grading rules.
* AI explanations may be imperfect but do not affect GPA.
* Advanced authentication/role management is limited.
