# AI Study Assistant Backend

Backend API for the existing React Study Assistant UI in `fronted/`.

This service handles student accounts, JWT login, notes, study files, video/audio resources, quizzes, AI chat, and progress. The React app in `../fronted` is wired to these APIs. It sends `Authorization: Bearer <token>` for protected requests. Local development uses port 8000; deployed frontends should set `VITE_API_BASE_URL` to the public backend HTTPS URL.

## 1. Purpose

Give the StudyHub frontend a real Python API with SQLite storage. Passwords are hashed with bcrypt. Session access uses JWT. Gemini (if configured) runs only on this backend so the API key never goes into Vite.

## 2. Project structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, router registration
│   ├── config.py            # Environment settings (added so secrets stay in one place)
│   ├── database.py          # SQLAlchemy engine and table creation
│   ├── models.py            # Database tables
│   ├── schemas.py           # Pydantic request/response models
│   ├── auth.py              # Password hashing and JWT
│   ├── dependencies.py      # Current-user JWT dependency
│   ├── routers/             # HTTP endpoints
│   └── services/            # AI, quiz scoring, PDF helpers
├── uploads/                 # Uploaded files (not stored in SQLite)
│   ├── materials/
│   ├── videos/
│   └── audio/
├── .env.example
├── requirements.txt
└── README.md
```

## 3. Python version

Use **Python 3.11 or newer**.

Check your version:

```powershell
python --version
```

```cmd
python --version
```

## 4. Create a virtual environment

Open a terminal in the `backend` folder.

PowerShell:

```powershell
cd D:\github\AI-study-assistent\AI-study-assistent\backend
python -m venv .venv
```

CMD:

```cmd
cd D:\github\AI-study-assistent\AI-study-assistent\backend
python -m venv .venv
```

## 5. Activate the virtual environment (Windows)

PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks scripts, run this once (as Administrator if needed), then try again:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

CMD:

```cmd
.venv\Scripts\activate.bat
```

## 6. Install requirements

```powershell
pip install -r requirements.txt
```

```cmd
pip install -r requirements.txt
```

## 7. Create `.env`

Copy the example file, then edit values:

PowerShell:

```powershell
Copy-Item .env.example .env
```

CMD:

```cmd
copy .env.example .env
```

Required values:

```
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=change-this-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=43200
GEMINI_API_KEY=
FRONTEND_URL=http://localhost:3000
```

Change `SECRET_KEY` to a long random string before any real use. Never commit `.env`. Never put `GEMINI_API_KEY` in the React/Vite `.env` files.

## 8. Run FastAPI with Uvicorn

Stay in the `backend` folder with the venv active:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

```cmd
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Tables and upload folders are created automatically on startup.

## 9. API documentation

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## 10. Health check

http://127.0.0.1:8000/api/health

Expected JSON includes `"status": "ok"`. `gemini_configured` is `true` only when `GEMINI_API_KEY` is set.

## 11. Authentication testing

1. Open http://127.0.0.1:8000/docs
2. Call `POST /api/auth/signup` with JSON:

```json
{
  "full_name": "Khushi",
  "email": "khushi@example.com",
  "password": "password123"
}
```

3. Call `POST /api/auth/login` with the same email and password.
4. Copy `access_token`.
5. Click **Authorize** in Swagger, type: `Bearer <paste_token>` or paste the token if the UI adds Bearer for you.
6. Call `GET /api/auth/me`.

PowerShell example:

```powershell
$body = '{"full_name":"Khushi","email":"khushi@example.com","password":"password123"}'
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/auth/signup -Method POST -ContentType "application/json" -Body $body

$login = Invoke-RestMethod -Uri http://127.0.0.1:8000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"khushi@example.com","password":"password123"}'
$token = $login.access_token

Invoke-RestMethod -Uri http://127.0.0.1:8000/api/auth/me -Headers @{ Authorization = "Bearer $token" }
```

Protected routes return 401 without a valid token. Notes, files, quizzes, and chat are scoped to the logged-in user.

## 12. File uploads

- Study files: `POST /api/materials/upload` (`multipart/form-data` fields: `title`, optional `description`, `file`)
- Stored under `backend/uploads/materials/`
- Allowed types include PDF, TXT, MD, DOC, DOCX, PPT, PPTX
- Max study file size: 50MB
- Video/audio: `POST /api/media` with `title`, `kind` (`video` or `audio`), optional `description`, optional `duration`, and either `file` or `source_url`
- Videos go to `backend/uploads/videos/` (max 100MB)
- Audio goes to `backend/uploads/audio/` (max 50MB)
- SQLite stores metadata only, not file bytes

## 13. Configure Gemini

1. Create a Gemini API key in Google AI Studio.
2. Put it in `backend/.env` as `GEMINI_API_KEY=your-key`.
3. Restart Uvicorn.

If the key is missing, chat still works with a **mock** reply so you can test the API. The key is read only in `app/services/ai_service.py`.

PDF Q&A: send `material_id` on `POST /api/chat/sessions/{id}/messages`. Text extraction for `.txt`/`.md` works now. PDF extraction works if you later install `pypdf`; otherwise a placeholder string is used.

## 14. Connecting the React frontend later

Do **not** change `fronted/` until you are ready to integrate.

When you do:

- Vite already runs at `http://localhost:3000`
- CORS is enabled for `FRONTEND_URL` (default `http://localhost:3000`)
- Use `http://127.0.0.1:8000` as the API base URL
- After login, store `access_token` and send header `Authorization: Bearer <token>`
- Keep Gemini keys on the backend only

## Implementation notes

- `GET /api/quizzes/{id}` hides `correct_answer` and `explanation`. Those appear after `POST /api/quizzes/{id}/submit`.
- Quiz list summaries do not include questions.
- Average quiz score in progress is a percentage (0–100) across attempts.
- `config.py` is extra compared with the original folder sketch; it keeps environment handling in one module.

## Security reminders

- Do not commit `.env`, `app.db`, or `uploads/`
- Change `SECRET_KEY` in any shared or deployed environment
- APIs never return `password` or `hashed_password`

## Frontend integration
The React app in `../fronted` uses `VITE_API_BASE_URL` when supplied. For local LAN development it can automatically target the same machine on port 8000. Start FastAPI with `--host 0.0.0.0 --port 8000` when testing from a phone/tablet on the same Wi-Fi.
