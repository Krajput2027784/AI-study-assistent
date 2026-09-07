import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MessageSquareText, FileText, BookOpen, BarChart3, BrainCircuit, User, LogOut, Headphones } from 'lucide-react';
import { useAuth } from '../auth';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/chat', label: 'AI Study Assistant', icon: MessageSquareText },
  { path: '/notes', label: 'My Notes', icon: FileText },
  { path: '/materials', label: 'Study Materials', icon: BookOpen },
  { path: '/media', label: 'Videos & Audio', icon: Headphones },
  { path: '/progress', label: 'Progress', icon: BarChart3 },
  { path: '/quiz', label: 'Quiz Generator', icon: BrainCircuit },
  { path: '/profile', label: 'Profile/Settings', icon: User },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <nav className="w-64 bg-white border-r border-gray-200 min-h-screen p-6 flex flex-col">
      <h1 className="text-2xl font-bold text-blue-600 mb-8 flex items-center gap-2"><BrainCircuit size={32}/> StudyHub</h1>
      <div className="mb-6 p-3 rounded-xl bg-blue-50">
        <p className="font-semibold text-gray-900 truncate">{user?.full_name}</p>
        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
      </div>
      <ul className="space-y-2 flex-grow">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return <li key={item.path}><Link to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}><Icon size={20}/>{item.label}</Link></li>;
        })}
      </ul>
      <div className="pt-6 border-t border-gray-200">
        <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg"><LogOut size={20}/>Logout</button>
      </div>
    </nav>
  );
}
