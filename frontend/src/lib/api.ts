import { QueryClient } from '@tanstack/react-query';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

const getAccessToken = () => localStorage.getItem('cycle-companion.accessToken');

const setAccessToken = (token: string | null) => {
  if (!token) {
    localStorage.removeItem('cycle-companion.accessToken');
    return;
  }
  localStorage.setItem('cycle-companion.accessToken', token);
};

const setRefreshToken = (token: string | null) => {
  if (!token) {
    localStorage.removeItem('cycle-companion.refreshToken');
    return;
  }
  localStorage.setItem('cycle-companion.refreshToken', token);
};

export const clearSession = () => {
  setAccessToken(null);
  setRefreshToken(null);
};

const refreshSession = async () => {
  const refreshToken = localStorage.getItem('cycle-companion.refreshToken');
  if (!refreshToken) return null;

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearSession();
    return null;
  }

  const data = await response.json();
  setAccessToken(data.session.access_token);
  setRefreshToken(data.session.refresh_token);
  return data;
};

export const apiFetch = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  let accessToken = getAccessToken();

  if (options.auth) {
    if (!accessToken) {
      console.log('apiFetch: No access token found, attempting refresh');
      const refreshed = await refreshSession();
      accessToken = refreshed?.session?.access_token;
    }
    if (accessToken) {
      // console.log('apiFetch: Attaching token', accessToken.substring(0, 10) + '...');
      headers.Authorization = `Bearer ${accessToken}`;
    } else {
      console.warn('apiFetch: Failed to retrieve access token even after refresh attempt');
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && options.auth) {
    const refreshed = await refreshSession();
    if (refreshed?.session?.access_token) {
      return apiFetch<T>(path, options);
    }
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.message ?? 'Unexpected error';
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const saveSession = (accessToken: string, refreshToken: string) => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};

export const queryClient = new QueryClient();
