import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen grid place-items-center text-gray-500">Loading StudyHub…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
