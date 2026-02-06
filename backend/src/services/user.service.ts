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
    period_length?: number | null;
    goal?: 'TRACKING' | 'CONCEIVE' | 'PREGNANCY' | null;
    avatar_url?: string | null;
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
    period_length?: number | null;
    goal?: 'TRACKING' | 'CONCEIVE' | 'PREGNANCY' | null;
    avatar_url?: string | null;
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
    periodLength: profileData?.period_length ?? null,
    goal: profileData?.goal ?? 'TRACKING',
    lastLogin: row.last_login ?? null,
    lastActivity: row.last_activity ?? null,
    avatarUrl: profileData?.avatar_url ?? null,
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
      'id, role, status, last_login, last_activity, profiles(name, age, date_of_birth, phone, city, timezone, onboarding_completed, last_period_date, cycle_length, period_length, goal, avatar_url)',
    )
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new HttpError(404, 'User record not found', error);
  }

  console.log('DEBUG: getUserWithProfile raw data:', JSON.stringify(data, null, 2));

  return mapUserRowToAuthUser(data, email);
};

// Helper function to calculate age
const calculateAge = (dateOfBirth: string | Date): number => {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

interface CreateUserRecordArgs {
  id: string;
  role: UserRole;
  name?: string;
  dateOfBirth?: string; // ISO date string
  phone: string;
  city: string;
  timezone?: string;
  periodLength?: number;
}

export const createUserRecord = async ({
  id,
  role,
  name,
  dateOfBirth,
  phone,
  city,
  timezone,
  periodLength
}: CreateUserRecordArgs) => {
  const supabase = getSupabaseClient();

  const { error: userError } = await supabase.from('users').insert({
    id,
    role,
    status: 'ACTIVE',
  });

  if (userError) {
    console.error('Error creating user record:', userError);
    throw new HttpError(400, 'Failed to persist user role', userError);
  }

  // Calculate age if dateOfBirth is provided
  let age: number | undefined;
  if (dateOfBirth) {
    age = calculateAge(dateOfBirth);
  }

  // Use upsert to handle cases where a trigger might have already created a profile
  const { error: profileError } = await supabase.from('profiles').upsert({
    user_id: id,
    name,
    date_of_birth: dateOfBirth,
    age, // Include calculated age
    phone,
    city,
    timezone,
    period_length: periodLength ?? 5,
    onboarding_completed: false,
    goal: 'TRACKING',
  }, {
    onConflict: 'user_id'
  });

  if (profileError) {
    console.error('Error creating user profile:', profileError);
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
  period_length?: number | null;
  goal?: 'TRACKING' | 'CONCEIVE' | 'PREGNANCY' | null;
  avatar_url?: string | null;
}

export const updateUserProfile = async (
  userId: string,
  updates: UpdateProfileArgs,
): Promise<AuthUser> => {
  const supabase = getSupabaseClient();
  
  console.log('Updating user profile for user ID:', userId);
  console.log('Raw updates received:', updates);
  
  // Get user role to validate updates
  const { data: userRoleData } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  // Filter out undefined values
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  );
  
  // Remove goal field if user is not primary
  if (userRoleData?.role !== 'primary' && 'goal' in cleanUpdates) {
    console.log('Removing goal update for non-primary user');
    delete cleanUpdates.goal;
  }
  
  console.log('Clean updates to apply:', cleanUpdates);

  // Calculate age if date_of_birth is present
  if (cleanUpdates.date_of_birth) {
    const age = calculateAge(cleanUpdates.date_of_birth as string);
    // @ts-ignore - age is not in UpdateProfileArgs but valid for DB
    cleanUpdates.age = age;
  }

  if (Object.keys(cleanUpdates).length === 0) {
    console.log('No updates to apply, fetching current profile');
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    return getUserWithProfile(userId, userData.user?.email ?? '');
  }

  // Use update instead of upsert to avoid constraint violations on partial updates
  // Since we know the user exists and upload works, update is safer for partial patches.
  const { error } = await supabase
    .from('profiles')
    .update(
      { 
        ...cleanUpdates,
        updated_at: new Date().toISOString()
      }
    )
    .eq('user_id', userId);

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

interface UploadAvatarArgs {
  userId: string;
  fileBuffer: Buffer;
  mimeType: string;
}

export const uploadUserAvatar = async ({
  userId,
  fileBuffer,
  mimeType
}: UploadAvatarArgs): Promise<string> => {
  const supabase = getSupabaseClient();
  
  // 1. Upload to Supabase Storage
  const fileName = `${userId}-${Date.now()}.jpg`; // standardized extension or use mime-types
  
  // Remove old avatar if exists (optional logic, skipping for MVP complexity)

  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('avatars')
    .upload(fileName, fileBuffer, {
      contentType: mimeType,
      upsert: true
    });

  if (uploadError) {
    console.error('Avatar upload error:', uploadError);
    throw new HttpError(500, 'Failed to upload avatar image', uploadError);
  }

  // 2. Get Public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(fileName);

  // 3. Update Profile with new URL
  if (!publicUrl) {
     throw new HttpError(500, 'Failed to generate public URL for avatar');
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (updateError) {
    console.error('Profile avatar update error:', updateError);
    throw new HttpError(500, 'Failed to link avatar to user profile', updateError);
  }

  return publicUrl;
};
