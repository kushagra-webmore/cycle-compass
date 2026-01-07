import { getSupabaseClient } from '../lib/supabase.js';
import { HttpError } from '../utils/http-error.js';
import type { AuthUser, UserRole } from '../types/index.js';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

interface UserRow {
  id: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  last_login?: string | null;
  last_activity?: string | null;
  profiles?: {
    name?: string | null;
    age?: number | null;
    date_of_birth?: string | null;
    phone?: string | null;
    city?: string | null;
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
  age: row.profiles?.age ?? undefined,
  dateOfBirth: row.profiles?.date_of_birth ?? undefined,
  phone: row.profiles?.phone ?? undefined,
  city: row.profiles?.city ?? undefined,
  timezone: row.profiles?.timezone ?? undefined,
  lastPeriodDate: row.profiles?.last_period_date ?? null,
  cycleLength: row.profiles?.cycle_length ?? null,
  lastLogin: row.last_login ?? null,
  lastActivity: row.last_activity ?? null,
});

export const getUserWithProfile = async (
  userId: string,
  email: string,
): Promise<AuthUser> => {
  const supabase = getSupabaseClient();
  const { data, error }: PostgrestSingleResponse<UserRow> = await supabase
    .from('users')
    .select(
      'id, role, status, last_login, last_activity, profiles(name, age, date_of_birth, phone, city, timezone, onboarding_completed, last_period_date, cycle_length)',
    )
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new HttpError(404, 'User record not found', error);
  }

  return mapUserRowToAuthUser(data, email);
};

interface CreateUserRecordArgs {
  id: string;
  role: UserRole;
  name?: string;
  dateOfBirth?: string; // ISO date string
  phone: string;
  city: string;
  timezone?: string;
}

export const createUserRecord = async ({
  id,
  role,
  name,
  dateOfBirth,
  phone,
  city,
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
    date_of_birth: dateOfBirth,
    phone,
    city,
    timezone,
    onboarding_completed: false,
  });

  if (profileError) {
    throw new HttpError(400, 'Failed to create user profile', profileError);
  }
};

interface UpdateProfileArgs {
  name?: string;
  phone?: string;
  city?: string;
  date_of_birth?: string;
  timezone?: string;
  onboarding_completed?: boolean;
  last_period_date?: string | null;
  cycle_length?: number | null;
}

export const updateUserProfile = async (
  userId: string,
  updates: UpdateProfileArgs,
): Promise<AuthUser> => {
  const supabase = getSupabaseClient();
  
  console.log('Updating user profile for user ID:', userId);
  console.log('Raw updates received:', updates);
  
  // Filter out undefined values
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  );
  
  console.log('Clean updates to apply:', cleanUpdates);

  if (Object.keys(cleanUpdates).length === 0) {
    console.log('No updates to apply, fetching current profile');
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    return getUserWithProfile(userId, userData.user?.email ?? '');
  }

  const { error } = await supabase
    .from('profiles')
    .update(cleanUpdates)
    .eq('user_id', userId);

  if (error) {
    console.error('Profile update error:', error);
    throw new HttpError(400, 'Failed to update user profile', error);
  }

  console.log('Profile updated successfully');

  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  return getUserWithProfile(userId, userData.user?.email ?? '');
};

export const getUserById = async (userId: string): Promise<AuthUser> => {
  const supabase = getSupabaseClient();
  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  
  if (!userData.user) {
    throw new HttpError(404, 'User not found');
  }

  return getUserWithProfile(userId, userData.user.email ?? '');
};
