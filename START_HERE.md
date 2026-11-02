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
ACCESS_TOKEN_EXPIRE_MINUTES=43200
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

The frontend uses `VITE_API_BASE_URL` when provided. If you open the Vite app from another device on the same Wi-Fi/LAN, the app automatically targets the computer hosting the frontend at port 8000. For a deployed frontend + separate backend, set `VITE_API_BASE_URL` to the backend's public HTTPS URL before building.

## Key Features & Production Enhancements

- **Google Gemini 3.6 Flash Integration**: Live conversational AI study assistance and dynamic multiple-choice quiz generation with safe fallback capability.
- **Context-Aware Study Chat**: Chat with Gemini about general academic topics or select any uploaded study material as the direct grounding context.
- **Smart Quiz Generator & Detailed Review**: Generate custom quizzes on any topic, complete and grade quizzes, and inspect question-by-question explanations and correct answers. Includes quiz deletion.
- **AI Note Enhancement**: Write study notes and click "AI Enhance / Study Guide" to have Gemini structure, summarize, and polish revision notes.
- **Study Materials & Document Viewer**: Upload, view, and download PDFs, Markdown, and TXT documents. Ask Gemini questions directly within the document viewer with interactive conversational history.
- **Video & Audio Learning Resources**: Add YouTube embeds or upload local media with range-seeking support and direct streaming.
- **Dashboard & Progress Tracking**: Comprehensive metrics tracking total notes, materials, quizzes taken, quiz averages, and study sessions.
- **Enterprise-Grade Security**: JWT authentication with bcrypt password hashing, CORS protection, and secure file validation.

## Device / responsive setup

- Desktop, tablet, and mobile layouts are supported. On small screens the dashboard sidebar becomes a slide-out menu.
- Local LAN testing: run the backend with `--host 0.0.0.0 --port 8000` and frontend with `npm run dev`. Open the frontend using the host computer's LAN IP from the phone/tablet.
- If Windows Firewall blocks port 8000 or 3000, allow Python/Node on the private network.
- Production: deploy the FastAPI backend on a persistent server and the React frontend on a static host. Set `VITE_API_BASE_URL=https://YOUR-BACKEND-DOMAIN` and `FRONTEND_URL=https://YOUR-FRONTEND-DOMAIN`. Do not use localhost in production.

## Performance changes

- AI requests are asynchronous instead of blocking the FastAPI worker.
- Gemini requests have bounded 20-second timeouts and output limits.
- Chat history sent to Gemini is limited to the latest 12 messages to keep prompts fast.
- Frontend API calls fail with a useful connection/timeout message instead of hanging indefinitely.
