# AI Study Assistant — Production Ready SaaS Platform

AI-powered study assistant with a modern React/Vite frontend and a FastAPI/SQLite backend powered by Google Gemini (`gemini-3.6-flash`).

## 1. Backend Setup & Run (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Open `backend/.env` and verify your configuration:
```env
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=your-secure-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=60
GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.6-flash
FRONTEND_URL=http://localhost:3000
```

Start the API:

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

- API Docs: http://127.0.0.1:8000/docs
- Health Check: http://127.0.0.1:8000/api/health

Run automated test suite:
```powershell
python -m unittest discover -s tests -p "test_*.py" -v
```

## 2. Frontend Setup & Run (New Terminal)

```powershell
cd fronted
npm install
npm run lint
npm run build
npm run dev
```

Open: http://localhost:3000

The frontend connects to the backend at `http://127.0.0.1:8000` as configured in `fronted/.env`.

## Key Features & Production Enhancements

- **Google Gemini 3.6 Flash Integration**: Live conversational AI study assistance and dynamic multiple-choice quiz generation with safe fallback capability.
- **Context-Aware Study Chat**: Chat with Gemini about general academic topics or select any uploaded study material as the direct grounding context.
- **Smart Quiz Generator & Detailed Review**: Generate custom quizzes on any topic, complete and grade quizzes, and inspect question-by-question explanations and correct answers. Includes quiz deletion.
- **AI Note Enhancement**: Write study notes and click "AI Enhance / Study Guide" to have Gemini structure, summarize, and polish revision notes.
- **Study Materials & Document Viewer**: Upload, view, and download PDFs, Markdown, and TXT documents. Ask Gemini questions directly within the document viewer with interactive conversational history.
- **Video & Audio Learning Resources**: Add YouTube embeds or upload local media with range-seeking support and direct streaming.
- **Dashboard & Progress Tracking**: Comprehensive metrics tracking total notes, materials, quizzes taken, quiz averages, and study sessions.
- **Enterprise-Grade Security**: JWT authentication with bcrypt password hashing, CORS protection, and secure file validation.
