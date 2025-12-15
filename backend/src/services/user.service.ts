import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase';
import { AuthUser, UserRole } from '../types';
import { HttpError } from '../utils/http-error';

interface UserRow {
  id: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  profiles?: {
    name?: string | null;
    timezone?: string | null;
    onboarding_completed: boolean;
    last_period_date?: string | null;
    cycle_length?: number | null;
  } | null;
}

const mapUserRowToAuthUser = (
  row: UserRow,
  email: string,
): AuthUser => ({
  id: row.id,
  email,
  role: row.role,
  status: row.status,
  onboardingCompleted: Boolean(row.profiles?.onboarding_completed),
  name: row.profiles?.name ?? undefined,
  timezone: row.profiles?.timezone ?? undefined,
  lastPeriodDate: row.profiles?.last_period_date ?? null,
  cycleLength: row.profiles?.cycle_length ?? null,
});

export const getUserWithProfile = async (
  userId: string,
  email: string,
): Promise<AuthUser> => {
  const supabase = getSupabaseClient();
  const { data, error }: PostgrestSingleResponse<UserRow> = await supabase
    .from('users')
    .select(
      'id, role, status, profiles(name, timezone, onboarding_completed, last_period_date, cycle_length)',
    )
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new HttpError(404, 'User record not found', error);
  }

  if (data.status !== 'ACTIVE') {
    throw new HttpError(403, 'User account is not active');
  }

  return mapUserRowToAuthUser(data, email);
};

interface CreateUserRecordArgs {
  id: string;
  role: UserRole;
  name?: string;
  timezone?: string;
}

export const createUserRecord = async ({
  id,
  role,
  name,
  timezone,
}: CreateUserRecordArgs) => {
  const supabase = getSupabaseClient();

  const { error: userError } = await supabase.from('users').insert({
    id,
    role,
    status: 'ACTIVE',
  });

  if (userError) {
    throw new HttpError(400, 'Failed to persist user role', userError);
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    user_id: id,
    name,
    timezone,
    onboarding_completed: false,
  });

  if (profileError) {
    throw new HttpError(400, 'Failed to create user profile', profileError);
  }
};
