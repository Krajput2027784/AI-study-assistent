import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="md:hidden sticky top-0 z-40 h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Open navigation">
          <Menu size={22} />
        </button>
        <div className="font-bold text-blue-600">StudyHub</div>
        <div className="w-10" />
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />
          <div className="relative w-[min(82vw,18rem)] h-full bg-white shadow-xl">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 z-10 p-2 rounded-lg hover:bg-gray-100" aria-label="Close navigation">
              <X size={20} />
            </button>
            <Sidebar mobile onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-[calc(100vh-3.5rem)] md:min-h-screen">
        <div className="hidden md:block shrink-0"><Sidebar /></div>
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
