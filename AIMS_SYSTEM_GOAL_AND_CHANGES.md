# AIMS System Goal and Implementation Summary

## System Goal

**AIMS (Automated Internship Management System)** is a full-stack application for **Jimma University – Faculty of Computing and Informatics**. The system goal is to:

- Let **students** register, log in, browse internships, apply, mark attendance (manual and camera/AI), and submit weekly reports with optional AI evaluation.
- Let **supervisors**, **company admins**, and **university admins** log in, manage applications, view attendance and reports, and use role-based dashboards.
- Use **JWT authentication** end-to-end, with clear error handling and CORS/static/media configuration so the React frontend and Django backend work together reliably.
- Support **AI features** (face enrollment/verification, report evaluation) with safe fallbacks when services or dependencies are unavailable.

---

## What Was Done

### 1. Authentication

- **Backend**
  - Confirmed `/api/auth/login/`, `/api/auth/register/`, and `/api/auth/register/student/` create users and return JWT tokens.
  - Added a **management command** `python manage.py seed_test_users` to create test users matching the credentials shown on the Login page (e.g. `student123` / `student123`, `admin` / `admin123`).
- **Frontend**
  - **Login**: Distinguishes “invalid credentials” (401) from “server unreachable” and shows backend error messages.
  - **Student registration**: Surfaces backend validation errors (username, email, password, university_id, etc.) in the UI.

### 2. Internships and Organizations

- **Backend**
  - Confirmed organizations and internships URLs and views; fixed missing `serializers` import in `internships/views.py`.
- **Frontend**
  - **api.ts**: Added `organizationsAPI` (e.g. `getActiveInternships`, `getInternshipPost`) and `internshipsAPI` (e.g. `getApplications`, `createApplication`).
  - **BrowseInternships**: Fetches active internships from the API, shows loading/error, and links “Details” and “Apply Now” to the correct routes.
  - **InternshipDetails**: Uses route `id` to fetch one internship and shows title/company; “Apply Now” links to the application form with `postId`.
  - **InternshipApplication**: Reads `postId` from query, loads the post, and submits an application (cover letter) via the API; redirects to My Applications on success.
  - **MyApplications**: Fetches the current user’s applications and displays status (pending/approved/rejected) and links to the posting.

### 3. Attendance

- **Backend**
  - Attendance views and URLs were already in place; no duplicate or broken code remained.
- **Frontend**
  - **api.ts**: Added `attendanceAPI` (`getAttendance`, `createAttendance`, `getStudentSummary`).
  - **AttendanceDashboard**: Loads attendance list from the API and “Mark attendance” creates a record (date, status, verification_method, check_in_time) with error handling.
  - **ManualAttendance**: Form submits date, status (present/late), and notes via `attendanceAPI.createAttendance` with success/error messages.
  - **CameraAttendance**: Already used `aiAPI.verifyFace` for face verification.

### 4. Evaluation and Weekly Reports

- **Backend**
  - **evaluation/urls.py**: Added routes for weekly reports and evaluations (e.g. `weekly-reports/`, `weekly-reports/<int:pk>/`, `weekly-reports/<int:report_id>/evaluate/`, `ai-evaluations/`, `supervisor-evaluations/`, `ai-evaluate/`).
  - **evaluation/views.py**: Uses `serializers` and AI evaluation with fallback; no duplicate view code.
- **Frontend**
  - **api.ts**: Added `evaluationAPI` (`getWeeklyReports`, `getWeeklyReport`, `createWeeklyReport`); `aiAPI.evaluateReport` was already present and points to the correct endpoint.

### 5. AI Services

- **Backend**
  - **ai_services/views.py**: Lazy-loads face verifier and report evaluator; returns **503** with a clear message when the service is unavailable (e.g. missing cv2/numpy or models). Image conversion uses try/except so the app does not crash on invalid input.
- **Frontend**
  - **api.ts**: AI calls (`enrollFace`, `verifyFace`, `evaluateReport`) use the shared **api** instance so the **Bearer token** is sent. Request interceptor clears `Content-Type` for `FormData` so multipart uploads work.

### 6. Configuration and CORS

- **Backend**
  - **AIMS/settings.py**: `CORS_ALLOWED_ORIGINS` includes `localhost:5173` and `127.0.0.1:5173`; `CORS_ALLOW_CREDENTIALS = True`. `STATIC_ROOT`, `MEDIA_URL`, and `MEDIA_ROOT` are set; `urls.py` serves static/media in DEBUG.
- **Frontend**
  - **api.ts**: `API_BASE_URL` can be overridden with `VITE_API_BASE_URL` (see **aims-app/.env.example**).

### 7. UX and Error Messaging

- **Login**: Test-credentials box now states that test accounts are created with `python manage.py seed_test_users`.
- **Login / Registration**: Clear distinction between network errors and validation/401 messages; backend messages are shown where possible.

---

## How to Run the System

1. **Backend (Django)**  
   From project root:
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py seed_test_users
   python manage.py runserver
   ```
   Backend: `http://localhost:8000`

2. **Frontend (Vite/React)**  
   In another terminal:
   ```bash
   cd aims-app
   npm install
   npm run dev
   ```
   Frontend: `http://localhost:5173` (or the port Vite prints).

3. **Use the app**  
   Open the frontend URL, log in with e.g. `student123` / `student123` (after running `seed_test_users`), then use dashboards, browse internships, apply, mark attendance, and submit reports as intended by the system goal above.

---

## Summary

| Area            | System goal                                      | What was done                                                                 |
|-----------------|--------------------------------------------------|-------------------------------------------------------------------------------|
| Auth            | Login/register, JWT, role-based routing          | Seed command, login/register error handling, backend confirmed                |
| Internships     | Browse, view details, apply, my applications    | API helpers, pages wired to backend, apply flow with `postId`                 |
| Attendance      | Manual and camera/AI attendance                  | API helpers, dashboard and manual form submit, camera uses `aiAPI`             |
| Evaluation      | Weekly reports, AI evaluation                   | URLs and API helpers added, frontend ready for report create/evaluate         |
| AI              | Face enroll/verify, report evaluate              | 503 fallbacks, token and FormData fix in frontend                             |
| Config / CORS   | Frontend talks to backend, uploads work          | CORS, static/media, optional `VITE_API_BASE_URL`                              |
| UX              | Clear errors, test accounts documented           | Login/registration messages, seed command noted on Login page                  |

This file summarizes the **system goal** and **what was implemented** so the project can be run and extended consistently.
