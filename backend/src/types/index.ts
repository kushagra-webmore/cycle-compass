export type UserRole = 'PRIMARY' | 'PARTNER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  onboardingCompleted: boolean;
  name?: string;
  timezone?: string;
  lastPeriodDate?: string | null;
  cycleLength?: number | null;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
      accessToken?: string;
    }
  }
}
