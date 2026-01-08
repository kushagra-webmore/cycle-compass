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
    goal?: 'TRACKING' | 'CONCEIVE' | 'PREGNANCY' | null;
  } | {
    name?: string | null;
    age?: number | null;
    date_of_birth?: string | null;
    phone?: string | null;
    city?: string | null;
    timezone?: string | null;
    onboarding_completed: boolean;
    last_period_date?: string | null;
    cycle_length?: number | null;
    goal?: 'TRACKING' | 'CONCEIVE' | 'PREGNANCY' | null;
  }[] | null;
}

const mapUserRowToAuthUser = (
  row: UserRow,
  email: string,
): AuthUser => {
  const profileData = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  
  return {
    id: row.id,
    email,
    role: row.role,
    status: row.status,
    onboardingCompleted: Boolean(profileData?.onboarding_completed),
    name: profileData?.name ?? undefined,
    age: profileData?.age ?? undefined,
    dateOfBirth: profileData?.date_of_birth ?? undefined,
    phone: profileData?.phone ?? undefined,
    city: profileData?.city ?? undefined,
    timezone: profileData?.timezone ?? undefined,
    lastPeriodDate: profileData?.last_period_date ?? null,
    cycleLength: profileData?.cycle_length ?? null,
    goal: profileData?.goal ?? 'TRACKING',
    lastLogin: row.last_login ?? null,
    lastActivity: row.last_activity ?? null,
  };
};

export const getUserWithProfile = async (
  userId: string,
  email: string,
): Promise<AuthUser> => {
  const supabase = getSupabaseClient();
  const { data, error }: PostgrestSingleResponse<UserRow> = await supabase
    .from('users')
    .select(
      'id, role, status, last_login, last_activity, profiles(name, age, date_of_birth, phone, city, timezone, onboarding_completed, last_period_date, cycle_length, goal)',
    )
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new HttpError(404, 'User record not found', error);
  }

  console.log('DEBUG: getUserWithProfile raw data:', JSON.stringify(data, null, 2));

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
    goal: 'TRACKING',
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
  goal?: 'TRACKING' | 'CONCEIVE' | 'PREGNANCY' | null;
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

  // Calculate age if date_of_birth is present
  if (cleanUpdates.date_of_birth) {
    const dob = new Date(cleanUpdates.date_of_birth as string);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    // @ts-ignore - age is not in UpdateProfileArgs but valid for DB
    cleanUpdates.age = age;
  }

  if (Object.keys(cleanUpdates).length === 0) {
    console.log('No updates to apply, fetching current profile');
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    return getUserWithProfile(userId, userData.user?.email ?? '');
  }

  // Use upsert instead of update to handle missing profiles for legacy/partner users
  const { error } = await supabase
    .from('profiles')
    .upsert(
      { 
        user_id: userId, 
        ...cleanUpdates,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('Profile update/upsert error:', error);
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
