import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiFetch, clearSession, saveSession } from '@/lib/api';

export type UserRole = 'primary' | 'partner' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string | null;
  age?: number | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  city?: string | null;
  status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  onboardingCompleted?: boolean;
  lastPeriodDate?: string | null;
  cycleLength?: number | null;
  timezone?: string | null;
  lastLogin?: string | null;
  lastActivity?: string | null;
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
    age?: number | null;
    dateOfBirth?: string | null;
    phone?: string | null;
    city?: string | null;
    timezone?: string | null;
    lastPeriodDate?: string | null;
    cycleLength?: number | null;
    lastLogin?: string | null;
    lastActivity?: string | null;
  };
}

export interface AuthError extends Error {
  code?: string;
  status?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse['user']>;
  signup: (email: string, password: string, role: UserRole, details: {
    name: string;
    dateOfBirth: string;
    phone: string;
    city: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<User>;
  refreshSession: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'cycle-companion.user';

const mapUserFromResponse = (payload: AuthResponse['user']): User => ({
  id: payload.id,
  email: payload.email,
  role: (payload.role?.toLowerCase() ?? 'primary') as UserRole,
  name: payload.name ?? null,
  age: payload.age ?? null,
  dateOfBirth: payload.dateOfBirth ?? null,
  phone: payload.phone ?? null,
  city: payload.city ?? null,
  onboardingCompleted: payload.onboardingCompleted ?? false,
  lastPeriodDate: payload.lastPeriodDate ?? null,
  cycleLength: payload.cycleLength ?? null,
  timezone: payload.timezone ?? null,
  lastLogin: payload.lastLogin ?? null,
  lastActivity: payload.lastActivity ?? null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persistUser = useCallback((next: User | null) => {
    console.log('Persisting user:', next ? { 
      id: next.id, 
      email: next.email,
      onboardingCompleted: next.onboardingCompleted 
    } : 'null');
    
    if (!next) {
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      return;
    }

    // Ensure we're not setting a stale user
    const now = new Date().toISOString();
    const userWithTimestamp = {
      ...next,
      _lastUpdated: now
    };
    
    setUser(userWithTimestamp);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userWithTimestamp));
    console.log('User persisted successfully');
  }, []);

  const handleAuthSuccess = useCallback(async (data: AuthResponse) => {
    console.log('Auth success, user data:', {
      id: data.user.id,
      email: data.user.email,
      onboardingCompleted: data.user.onboardingCompleted,
      hasLastPeriodDate: !!data.user.lastPeriodDate,
      hasCycleLength: data.user.cycleLength !== undefined
    });
    
    const mapped = mapUserFromResponse(data.user);
    saveSession(data.session.access_token, data.session.refresh_token);
    
    // Update user state first
    setUser(mapped);
    
    // Then persist to local storage
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mapped));
    
    console.log('Auth state updated with user:', {
      id: mapped.id,
      onboardingCompleted: mapped.onboardingCompleted,
      lastPeriodDate: mapped.lastPeriodDate,
      cycleLength: mapped.cycleLength
    });
    
    return mapped;
  }, []);

  const bootstrap = useCallback(async () => {
    console.log('Bootstrapping auth...');
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    
    // If we have a stored user, use it for initial render to prevent flash of auth state
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Found stored user:', { 
          id: parsedUser.id, 
          email: parsedUser.email,
          onboardingCompleted: parsedUser.onboardingCompleted 
        });
        persistUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }

    const refreshToken = localStorage.getItem('cycle-companion.refreshToken');
    if (!refreshToken) {
      console.log('No refresh token found, user is not authenticated');
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Refreshing session...');
      const data = await apiFetch<AuthResponse>('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      console.log('Session refreshed, user data:', { 
        id: data.user.id, 
        email: data.user.email,
        onboardingCompleted: data.user.onboardingCompleted 
      });
      
      handleAuthSuccess(data);
    } catch (error) {
      console.error('Error refreshing session:', error);
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
    try {
      if (password.length < 8) {
        throw { message: 'Password must be at least 8 characters long', code: 'password-too-short' };
      }

      console.log('Attempting login for:', email);
      const data = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('Login successful, handling auth success');
      await handleAuthSuccess(data);
      setError(null);
      
      // Force a re-render to ensure RoleBasedRedirect runs with the new user state
      return data.user;
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage = error.message || 'Invalid email or password. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [handleAuthSuccess]);

  const signup = useCallback(async (
    email: string, 
    password: string, 
    role: UserRole,
    details: { name: string; dateOfBirth: string; phone: string; city: string; }
  ) => {
    setIsLoading(true);
    try {
      const data = await apiFetch<AuthResponse>('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          role: role.toUpperCase(),
          name: details.name,
          dateOfBirth: details.dateOfBirth,
          phone: details.phone,
          city: details.city,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone 
        }),
      });

      handleAuthSuccess(data);
    } catch (error: any) {
      console.error('Signup failed:', error);
      setError(
        error?.code === 'password-too-short'
          ? 'Password must be at least 8 characters long'
          : 'Invalid email or password. Please try again.'
      );
      throw error;
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

  const updateUser = useCallback(async (updates: Partial<User>): Promise<User> => {
    if (!user) throw new Error('No user is currently logged in');
    
    try {
      // Prepare the updates for the backend
      const backendUpdates = {
        ...updates,
        // Map frontend field names to backend field names if needed
        onboardingCompleted: updates.onboardingCompleted,
        lastPeriodDate: updates.lastPeriodDate,
        cycleLength: updates.cycleLength,
      };
      
      console.log('Sending user updates to backend:', backendUpdates);
      
      // Update the backend
      const updatedUser = await apiFetch<AuthResponse['user']>('/users/me', {
        method: 'PATCH',
        auth: true,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendUpdates),
      });
      
      console.log('Received updated user from backend:', updatedUser);
      
      // Update local state with the server response
      const next = mapUserFromResponse(updatedUser);
      persistUser(next);
      return next; // Return the updated user data
    } catch (error) {
      console.error('Failed to update user:', error);
      // Still update local state as a fallback
      const next = { ...user, ...updates };
      persistUser(next);
      return next;
    }
  }, [persistUser, user]);

  const clearError = useCallback(() => setError(null), []);

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    signup,
    logout,
    updateUser,
    refreshSession: refreshSessionHandler,
    clearError,
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
