# 🤖 AI Study Assistant

### An Intelligent Platform for Smarter Learning

AI Study Assistant is a full-stack AI-powered learning platform designed to help students study smarter, organize learning materials, generate quizzes, track academic progress, and interact with an AI study assistant from one platform.

The application combines a modern React frontend, FastAPI backend, SQLite database, JWT authentication, and Google Gemini AI to provide an interactive and student-friendly learning experience.

---

## 🌐 Live Demo

### 🚀 Live Website
https://ai-study-assistent-live.vercel.app/

### ⚙️ Backend API
https://ai-study-assistent-pxoj.onrender.com/

### 📖 API Documentation
https://ai-study-assistent-pxoj.onrender.com/docs

---

## ✨ Features

### 🔐 Authentication
- User registration and login
- Forgot password (reset link sent by email)
- JWT-based authentication
- Protected routes
- User profile management
- Secure password hashing
- User-specific data access

### 🤖 AI Study Assistant
- AI-powered study chat
- Ask questions about academic topics
- Simple and student-friendly explanations
- Context-aware AI responses
- Google Gemini API integration

### 📝 Notes Management
- Create notes
- View saved notes
- Edit notes
- Delete notes
- Organize study content

### 📚 Study Materials
- Upload study materials
- PDF support
- TXT support
- Markdown support
- DOC/DOCX support
- PPT/PPTX support
- File management
- PDF preview and reading support

### 🧠 AI Quiz Generator
- AI-generated quizzes
- Topic-based quiz generation
- Multiple-choice questions
- Interactive quiz attempts
- Automatic score evaluation
- Quiz performance tracking

### 📊 Progress Tracking
- Track quiz scores
- Monitor learning activity
- View academic progress
- Dashboard statistics
- Performance tracking

### 🎬 Learning Media
- Learning video resources
- YouTube integration
- Media management
- Educational content organization

### 📱 Modern UI
- Responsive interface
- Student-friendly dashboard
- Clean navigation
- Protected application pages
- Modern icons and components

---

# 🛠️ Tech Stack

## Frontend

- React
- TypeScript
- Vite
- HTML5
- CSS3
- JavaScript
- React Router
- Lucide Icons

## Backend

- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- Pydantic
- JWT
- bcrypt
- python-dotenv
- pypdf

## Database

- SQLite
- SQLAlchemy ORM

## Artificial Intelligence

- Google Gemini API
- Gemini 2.5 Flash

## Tools

- Git
- GitHub
- VS Code
- Cursor
- npm

## Deployment

- Vercel — Frontend
- Render — Backend

---

# 🏗️ System Architecture

```text
                         ┌─────────────────────┐
                         │    Student / User   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   React Frontend    │
                         │       Vercel        │
                         └──────────┬──────────┘
                                    │
                              REST API
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   FastAPI Backend   │
                         │       Render        │
                         └──────────┬──────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               │                    │                    │
               ▼                    ▼                    ▼
        ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
        │  SQLite DB   │     │  Gemini API  │     │ File Storage │
        │  SQLAlchemy  │     │ AI Services  │     │   Uploads    │
        └──────────────┘     └──────────────┘     └──────────────┘