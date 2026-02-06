export type UserRole = 'PRIMARY' | 'PARTNER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  onboardingCompleted: boolean;
  name?: string;
  age?: number;
  dateOfBirth?: string;
  phone?: string;
  city?: string;
  timezone?: string;
  lastPeriodDate?: string | null;
  cycleLength?: number | null;
  periodLength?: number | null;
  goal?: 'TRACKING' | 'CONCEIVE' | 'PREGNANCY' | null;
  lastLogin?: string | null;
  lastActivity?: string | null;
  avatarUrl?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
      accessToken?: string;
    }
  }
}
