import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'primary' | 'partner' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  onboardingCompleted?: boolean;
  lastPeriodDate?: string;
  cycleLength?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved user
    const savedUser = localStorage.getItem('cycle-companion-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate login - in production, this would call an API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Demo users
    const demoUsers: Record<string, User> = {
      'admin@demo.com': { id: '1', email: 'admin@demo.com', role: 'admin', name: 'Admin User', onboardingCompleted: true },
      'partner@demo.com': { id: '2', email: 'partner@demo.com', role: 'partner', name: 'Partner User', onboardingCompleted: true },
    };

    if (demoUsers[email]) {
      const user = demoUsers[email];
      setUser(user);
      localStorage.setItem('cycle-companion-user', JSON.stringify(user));
      return;
    }

    // Default primary user
    const newUser: User = {
      id: Date.now().toString(),
      email,
      role: 'primary',
      onboardingCompleted: false,
    };
    setUser(newUser);
    localStorage.setItem('cycle-companion-user', JSON.stringify(newUser));
  };

  const signup = async (email: string, password: string, role: UserRole) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const newUser: User = {
      id: Date.now().toString(),
      email,
      role,
      onboardingCompleted: false,
    };
    setUser(newUser);
    localStorage.setItem('cycle-companion-user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cycle-companion-user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('cycle-companion-user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateUser }}>
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
