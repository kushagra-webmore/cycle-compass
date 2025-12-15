import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiFetch, clearSession, saveSession } from '@/lib/api';

export type UserRole = 'primary' | 'partner' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string | null;
  onboardingCompleted?: boolean;
  lastPeriodDate?: string | null;
  cycleLength?: number | null;
  timezone?: string | null;
}

interface AuthResponse {
  session: {
    access_token: string;
    refresh_token: string;
  };
  user: {
    id: string;
    email: string;
    role: string;
    onboardingCompleted?: boolean;
    name?: string | null;
    timezone?: string | null;
    lastPeriodDate?: string | null;
    cycleLength?: number | null;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'cycle-companion.user';

const mapUserFromResponse = (payload: AuthResponse['user']): User => ({
  id: payload.id,
  email: payload.email,
  role: (payload.role?.toLowerCase() ?? 'primary') as UserRole,
  name: payload.name ?? null,
  onboardingCompleted: payload.onboardingCompleted ?? false,
  lastPeriodDate: payload.lastPeriodDate ?? null,
  cycleLength: payload.cycleLength ?? null,
  timezone: payload.timezone ?? null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistUser = useCallback((next: User | null) => {
    if (!next) {
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      return;
    }

    setUser(next);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const handleAuthSuccess = useCallback((data: AuthResponse) => {
    const mapped = mapUserFromResponse(data.user);
    saveSession(data.session.access_token, data.session.refresh_token);
    persistUser(mapped);
  }, [persistUser]);

  const bootstrap = useCallback(async () => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        persistUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }

    const refreshToken = localStorage.getItem('cycle-companion.refreshToken');
    if (!refreshToken) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiFetch<AuthResponse>('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      handleAuthSuccess(data);
    } catch (error) {
      clearSession();
      persistUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthSuccess, persistUser]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      handleAuthSuccess(data);
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthSuccess]);

  const signup = useCallback(async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const data = await apiFetch<AuthResponse>('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: role.toUpperCase(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      });

      handleAuthSuccess(data);
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthSuccess]);

  const refreshSessionHandler = useCallback(async () => {
    const refreshToken = localStorage.getItem('cycle-companion.refreshToken');
    if (!refreshToken) return;

    try {
      const data = await apiFetch<AuthResponse>('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      handleAuthSuccess(data);
    } catch (error) {
      clearSession();
      persistUser(null);
    }
  }, [handleAuthSuccess, persistUser]);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
        auth: true,
      });
    } catch (error) {
      // ignore logout errors and still clear session locally
    } finally {
      clearSession();
      persistUser(null);
    }
  }, [persistUser]);

  const updateUser = useCallback((updates: Partial<User>) => {
    if (!user) return;
    const next = { ...user, ...updates };
    persistUser(next);
  }, [persistUser, user]);

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    signup,
    logout,
    updateUser,
    refreshSession: refreshSessionHandler,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
