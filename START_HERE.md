# AI Study Assistant — Frontend + Backend

This package contains the React/Vite frontend and FastAPI/SQLite backend connected together.

## 1. Backend (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Open `backend/.env` and set a strong `SECRET_KEY`. If you want real Gemini answers, add your `GEMINI_API_KEY` there. Never put that key in the React frontend.

Start the API:

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs
Health: http://127.0.0.1:8000/api/health

## 2. Frontend (new terminal)

```powershell
cd fronted
npm install
Copy-Item .env.example .env
npm run lint
npm run dev
```

Open: http://localhost:3000

The frontend reads `VITE_API_BASE_URL` from `fronted/.env`; the default is `http://127.0.0.1:8000`. Run `npm run lint` before `npm run dev` to catch TypeScript errors.

## Connected features

- Signup/login with JWT
- Protected dashboard and logout
- User profile
- Notes CRUD using SQLite
- Study-material upload/download and PDF viewer
- Ask AI about a material
- AI chat sessions and message history
- AI quiz generation (Gemini when configured, safe fallback otherwise)
- Quiz submission and scoring
- Progress/dashboard statistics
- Video/audio resource management

## Notes

The ZIP intentionally excludes `.env`, `.venv`, `node_modules`, the SQLite database, caches and Git metadata. Run the setup commands above after extracting it.

## 3. Final validation checklist

After installing dependencies, run `npm run lint` and `npm run build` inside `fronted`. Run the backend and open `/docs`. Test signup, login, `/api/auth/me`, notes, material upload, chat, quiz, progress, and dashboard.

Uploaded PDFs/TXT/Markdown files can be previewed and used for material Q&A. DOC/DOCX/PPT/PPTX files are stored and downloadable but are not browser-previewed or text-extracted by the current PDF service.
