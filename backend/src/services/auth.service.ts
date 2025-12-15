import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { UserRole } from '../types';
import { HttpError } from '../utils/http-error';
import { createUserRecord, getUserWithProfile } from './user.service';

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

const supabaseService = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, clientOptions);
const supabaseAnon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, clientOptions);

export const signupWithEmail = async (
  email: string,
  password: string,
  role: UserRole,
  name?: string,
  timezone?: string,
) => {
  const { data, error } = await supabaseService.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new HttpError(400, error?.message ?? 'Failed to create auth user', error);
  }

  await createUserRecord({
    id: data.user.id,
    role,
    name,
    timezone,
  });

  const signInResult = await supabaseAnon.auth.signInWithPassword({ email, password });

  if (signInResult.error || !signInResult.data.session || !signInResult.data.user) {
    throw new HttpError(400, 'Failed to create session for new user', signInResult.error);
  }

  const appUser = await getUserWithProfile(data.user.id, email);

  return {
    session: signInResult.data.session,
    user: appUser,
  };
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

  if (error || !data.session || !data.user) {
    throw new HttpError(401, 'Invalid email or password', error);
  }

  const appUser = await getUserWithProfile(data.user.id, email);

  return {
    session: data.session,
    user: appUser,
  };
};

export const refreshSession = async (refreshToken: string) => {
  const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session || !data.user) {
    throw new HttpError(401, 'Invalid refresh token', error);
  }

  const appUser = await getUserWithProfile(data.user.id, data.user.email ?? '');

  return {
    session: data.session,
    user: appUser,
  };
};

export const getUserByAccessToken = async (accessToken: string) => {
  const { data, error } = await supabaseService.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new HttpError(401, 'Invalid access token', error);
  }

  const userEmail = data.user.email ?? '';
  return getUserWithProfile(data.user.id, userEmail);
};

export const signOutUser = async (accessToken: string) => {
  const { error } = await supabaseService.auth.admin.signOut(accessToken);

  if (error) {
    throw new HttpError(400, 'Failed to sign out session', error);
  }
};
