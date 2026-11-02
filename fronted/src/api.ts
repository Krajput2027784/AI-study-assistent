const configuredApiUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();

function getDefaultApiBaseUrl(): string {
  if (typeof window === 'undefined') return 'http://127.0.0.1:8000';
  const host = window.location.hostname;
  // Same PC development.
  if (host === 'localhost' || host === '127.0.0.1') return 'http://127.0.0.1:8000';
  // When Vite is opened from another device on the same LAN, the backend is
  // normally running on the same machine at port 8000.
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) {
    return `http://${host}:8000`;
  }
  // Production can use a same-origin reverse proxy. For separate frontend /
  // backend deployments, set VITE_API_BASE_URL to the public backend URL.
  return '';
}

export const API_BASE_URL = (configuredApiUrl || getDefaultApiBaseUrl()).replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem('studyhub_token');
}

export function setToken(token: string) {
  localStorage.setItem('studyhub_token', token);
}

export function clearToken() {
  localStorage.removeItem('studyhub_token');
  localStorage.removeItem('studyhub_user');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const isAiRequest = /\/(generate|ai-enhance|messages)(\?|$)/.test(path);
  const timeoutMs = options.body instanceof FormData ? 120000 : isAiRequest ? 60000 : 20000;
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  const signal = options.signal || controller.signal;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, signal });
    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const data = await response.json();
        const detail = data.detail;
        if (typeof detail === 'string') {
          message = detail;
        } else if (Array.isArray(detail)) {
          // FastAPI validation errors (422) come back as a list of objects.
          const parts = detail.map((d: { loc?: unknown[]; msg?: string }) => {
            const field = Array.isArray(d.loc) ? String(d.loc[d.loc.length - 1]) : '';
            const text = d.msg ?? 'Invalid value';
            return field && field !== 'body' ? `${field}: ${text}` : text;
          });
          if (parts.length) message = parts.join('; ');
        }
      } catch {
        // Keep generic message when response is not JSON.
      }
      if (response.status === 401) {
        clearToken();
        window.dispatchEvent(new Event('studyhub:unauthorized'));
      }
      throw new ApiError(message, response.status);
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The server took too long to respond. Please check that the backend is running.');
    }
    if (error instanceof TypeError) {
      throw new Error(`Cannot connect to StudyHub server. API: ${API_BASE_URL || 'same origin'}`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function apiBlob(path: string): Promise<Blob> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error(`File request failed (${response.status})`);
  return response.blob();
}
