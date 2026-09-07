import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, clearToken, getToken, setToken } from './api';

export interface User {
  id: number;
  full_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('studyhub_user');
    if (!raw) return null;
    try { return JSON.parse(raw) as User; } catch { localStorage.removeItem('studyhub_user'); return null; }
  });
  const [loading, setLoading] = useState(Boolean(getToken()));

  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const me = await api<User>('/api/auth/me');
      setUser(me);
      localStorage.setItem('studyhub_user', JSON.stringify(me));
    } catch {
      clearToken();
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login: async (email, password) => {
      const result = await api<{ access_token: string; token_type: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(result.access_token);
      await refreshUser();
    },
    signup: async (fullName, email, password) => {
      await api<User>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ full_name: fullName, email, password }),
      });
      await (async () => {
        const result = await api<{ access_token: string; token_type: string }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setToken(result.access_token);
        await refreshUser();
      })();
    },
    logout: () => {
      clearToken();
      setUser(null);
    },
    refreshUser,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
