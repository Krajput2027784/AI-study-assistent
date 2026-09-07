import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Notes from './pages/Notes';
import NoteEditor from './pages/NoteEditor';
import Materials from './pages/Materials';
import PDFView from './pages/PDFView';
import Progress from './pages/Progress';
import QuizGenerator from './pages/QuizGenerator';
import Profile from './pages/Profile';
import Media from './pages/Media';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/notes/:id" element={<NoteEditor />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/materials/:id" element={<PDFView />} />
              <Route path="/media" element={<Media />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/quiz" element={<QuizGenerator />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
