# AIMS (Attendance & Internship Management System)

This repository contains a **full-stack application** for managing attendance, internships, evaluations, and user workflows. It includes:

- **Backend:** Django + Django REST Framework + Celery
- **Frontend:** React + Vite + TypeScript
- **Data:** MySQL (Docker), Redis (Docker), optional face/AI features

---

## 🚀 Quick Start (Local Development)

### 1) Backend (Django)

1. Open a terminal and activate the venv:
   ```powershell
   cd backend
   .\venv\Scripts\Activate.ps1
   ```

2. Install dependencies (if not already):
   ```powershell
   pip install -r requirements.txt
   ```

3. Run the server:
   ```powershell
   python manage.py runserver
   ```

4. Visit: `http://127.0.0.1:8000`

---

## 🧱 Docker (Recommended for full stack)

This project provides a `docker-compose.yml` to run the backend, frontend, database, and Redis together.

1. From the repo root:
   ```powershell
   docker compose up --build
   ```

2. Frontend is usually available at `http://localhost:5173` and backend at `http://localhost:8000`.

---

## 🧠 AI / Face Recognition (Optional)

Some AI dependencies are purposely commented out in `backend/requirements.txt` (e.g., TensorFlow, PyTorch). Enable them only if you need the AI/face recognition features.

---

## 🗂️ Project Structure (High Level)

- `backend/`: Django project + REST API + Celery tasks
- `aims-app/`: React frontend (Vite)
- `docker-compose.yml`: brings up DB, Redis, backend, frontend

---

## ✅ Notes

- If you run into missing packages, install them inside `backend/venv`.
- Use `backend/manage.py` to run migrations, create users, etc.

---

If you'd like, I can also add a section documenting the main API endpoints, or help you run a specific feature (like biometric attendance or internship workflows).