import { getSupabaseClient } from '../lib/supabase.js';
import { HttpError } from '../utils/http-error.js';
import { logAuditEvent } from './audit.service.js';
import { adminMythArticleSchema } from '../validators/admin.js';

export const listUsers = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, role, status, created_at, last_login, last_activity, profiles(name, timezone, onboarding_completed)')
    .order('created_at', { ascending: false });

  if (error) {
    throw new HttpError(400, 'Failed to fetch users', error);
  }

  return data ?? [];
};

export const updateUserAccount = async (
  adminUserId: string,
  {
    userId,
    status,
    role,
  }: {
    userId: string;
    status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
    role?: 'PRIMARY' | 'PARTNER' | 'ADMIN';
  },
) => {
  if (!status && !role) {
    throw new HttpError(400, 'Provide at least one field (status or role) to update');
  }

  const supabase = getSupabaseClient();
  const updates: Record<string, unknown> = {};

  if (status) updates.status = status;
  if (role) updates.role = role;

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select('id, role, status')
    .single();

  if (error || !data) {
    throw new HttpError(400, 'Failed to update user', error);
  }

  await logAuditEvent(adminUserId, 'admin.user-update', { userId, ...updates });

  return data;
};

export const deleteUserAccount = async (adminUserId: string, userId: string) => {
  const supabase = getSupabaseClient();
  
  // Use supabase admin auth to delete the user
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    throw new HttpError(400, 'Failed to delete user', error);
  }

  await logAuditEvent(adminUserId, 'admin.user-delete', { userId });
};

export const listPairings = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('pairings')
    .select('id, status, created_at, primary_user_id, partner_user_id, consent_settings(*)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new HttpError(400, 'Failed to fetch pairings', error);
  }

  return data ?? [];
};

export const forceUnpair = async (adminUserId: string, pairingId: string) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('pairings')
    .select('*')
    .eq('id', pairingId)
    .maybeSingle();

  if (error || !data) {
    throw new HttpError(404, 'Pairing not found', error);
  }

  const { error: updateError } = await supabase
    .from('pairings')
    .update({ status: 'REVOKED', partner_user_id: null })
    .eq('id', pairingId);

  if (updateError) {
    throw new HttpError(400, 'Failed to force unpair', updateError);
  }

  await logAuditEvent(adminUserId, 'admin.force-unpair', { pairingId });
};

export const listConsentAuditLogs = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .in('action', ['consent.update', 'consent.create', 'consent.revoke'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new HttpError(400, 'Failed to fetch consent logs', error);
  }

  return data ?? [];
};

export const getAnalyticsOverview = async () => {
  const supabase = getSupabaseClient();

  const { data: snapshot, error: snapshotError } = await supabase
    .from('analytics_daily_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (snapshotError) {
    throw new HttpError(400, 'Failed to fetch analytics snapshot', snapshotError);
  }

  if (snapshot) {
    return snapshot;
  }

  const [{ data: users }, { data: pairings }, { data: interactions }] = await Promise.all([
    supabase.from('users').select('id'),
    supabase.from('pairings').select('id').eq('status', 'ACTIVE'),
    supabase.from('ai_interactions').select('id'),
  ]);

  return {
    snapshot_date: new Date().toISOString().split('T')[0],
    total_users: users?.length ?? 0,
    active_pairings: pairings?.length ?? 0,
    ai_interactions_count: interactions?.length ?? 0,
  };
};

export const listAIInteractions = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('ai_interactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new HttpError(400, 'Failed to fetch AI interactions', error);
  }

  return data ?? [];
};

export const listMythArticles = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('myth_busting_articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new HttpError(400, 'Failed to fetch myth-busting articles', error);
  }

  return data ?? [];
};

export const upsertMythArticle = async (adminUserId: string, payload: unknown) => {
  const parsed = adminMythArticleSchema.parse(payload);
  const supabase = getSupabaseClient();
  const { id, title, content, tags, isPublished } = parsed;

  const { data, error } = await supabase
    .from('myth_busting_articles')
    .upsert({
      id,
      title,
      content,
      tags,
      is_published: isPublished ?? true,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new HttpError(400, 'Failed to upsert myth article', error);
  }

  await logAuditEvent(adminUserId, 'admin.user-update', {
    type: 'myth-article',
    mythArticleId: data.id,
  });

  return data;
};

export const deleteMythArticle = async (adminUserId: string, id: string) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('myth_busting_articles').delete().eq('id', id);

  if (error) {
    throw new HttpError(400, 'Failed to delete myth article', error);
  }

  await logAuditEvent(adminUserId, 'admin.user-update', {
    type: 'myth-article-delete',
    mythArticleId: id,
  });
};

export const impersonateUser = async (adminUserId: string, targetUserId: string) => {
  const supabase = getSupabaseClient();

  // Verify target user exists and get their details
  const { data: targetUser, error: userError } = await supabase
    .from('users')
    .select('id, role, status')
    .eq('id', targetUserId)
    .single();

  if (userError || !targetUser) {
    throw new HttpError(404, 'Target user not found', userError);
  }

  // Get the user's auth data including email
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(targetUserId);

  if (authError || !authUser.user) {
    throw new HttpError(400, 'Failed to get user auth data', authError);
  }

  // Use Supabase admin to create a session for the target user
  // We'll generate a temporary password reset token and exchange it for a session
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: authUser.user.email!,
  });

  if (linkError || !linkData) {
    throw new HttpError(400, 'Failed to generate session link', linkError);
  }

  // Extract the access token and refresh token from the hashed token
  // The hashed_token can be used to create a session
  // We need to verify the OTP to get actual session tokens
  const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink',
  });

  if (sessionError || !sessionData.session) {
    throw new HttpError(400, 'Failed to create impersonation session', sessionError);
  }

  // Log the impersonation event
  await logAuditEvent(adminUserId, 'admin.impersonate-user', {
    targetUserId,
    targetUserEmail: authUser.user.email,
    targetUserRole: targetUser.role,
    timestamp: new Date().toISOString(),
  });

  // Get the full user profile data
  const { getUserWithProfile } = await import('./user.service.js');
  const userProfile = await getUserWithProfile(targetUserId, authUser.user.email!);

  // Return the session and user data
  return {
    session: {
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    },
    user: userProfile,
  };
};

