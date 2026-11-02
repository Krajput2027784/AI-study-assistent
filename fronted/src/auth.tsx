import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, api, clearToken, getToken, setToken } from './api';

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
    } catch (error) {
      // Only end the session when the server says the token is invalid (401).
      // A network error or a sleeping/cold-starting backend must NOT log the user out.
      if (error instanceof ApiError && error.status === 401) {
        clearToken();
        setUser(null);
      }
    }
  };

  useEffect(() => {
    void refreshUser().finally(() => setLoading(false));
  }, []);

  // api() fires this when the server answers 401 (expired/invalid token).
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('studyhub:unauthorized', onUnauthorized);
    return () => window.removeEventListener('studyhub:unauthorized', onUnauthorized);
  }, []);

  const finishLogin = async (accessToken: string) => {
    setToken(accessToken);
    try {
      const me = await api<User>('/api/auth/me');
      setUser(me);
      localStorage.setItem('studyhub_user', JSON.stringify(me));
    } catch (error) {
      clearToken();
      setUser(null);
      throw error; // surface the real error on the Login/Signup page
    }
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login: async (email, password) => {
      const cleanEmail = email.trim().toLowerCase();
      const result = await api<{ access_token: string; token_type: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      await finishLogin(result.access_token);
    },
    signup: async (fullName, email, password) => {
      const cleanEmail = email.trim().toLowerCase();
      await api<User>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ full_name: fullName.trim(), email: cleanEmail, password }),
      });
      const result = await api<{ access_token: string; token_type: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      await finishLogin(result.access_token);
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
