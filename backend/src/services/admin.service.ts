import { getSupabaseClient } from '../lib/supabase';
import { HttpError } from '../utils/http-error';
import { logAuditEvent } from './audit.service';
import { adminMythArticleSchema } from '../validators/admin';

export const listUsers = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, role, status, created_at, profiles(name, timezone, onboarding_completed)')
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
