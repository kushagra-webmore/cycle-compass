import { env } from '../config/env.js';
import { getSupabaseClient } from '../lib/supabase.js';
import { HttpError } from '../utils/http-error.js';
import { generateInviteToken, generatePairCode, generateQrPlaceholder } from '../utils/token.js';
import { logAuditEvent } from './audit.service.js';

interface CreatePairingResult {
  pairingId: string;
  inviteLink?: string;
  pairCode?: string;
  qrData?: string;
  expiresAt: string;
}

export const createPairingInvite = async (
  primaryUserId: string,
  method: 'LINK' | 'QR' | 'CODE' | 'ALL',
): Promise<CreatePairingResult> => {
  const supabase = getSupabaseClient();

  const token = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + env.PAIRING_TOKEN_EXPIRY_HOURS);

  const insertPayload: Record<string, unknown> = {
    primary_user_id: primaryUserId,
    status: 'PENDING',
    invite_token: token,
    token_expires_at: expiresAt.toISOString(),
  };

  if (method === 'CODE' || method === 'ALL') {
    insertPayload.invite_code = generatePairCode();
  }

  if (method === 'QR' || method === 'ALL') {
    insertPayload.invite_qr = generateQrPlaceholder(token);
  }

  const { data, error } = await supabase
    .from('pairings')
    .insert(insertPayload)
    .select()
    .single();

  if (error || !data) {
    throw new HttpError(400, 'Failed to create pairing invite', error);
  }

  await logAuditEvent(primaryUserId, 'pairing.create', {
    pairingId: data.id,
    method,
  });

  const baseInviteUrl = `${env.CLIENT_APP_URL}/partner-accept`;
  const result: CreatePairingResult = {
    pairingId: data.id,
    expiresAt: expiresAt.toISOString(),
  };

  if (method === 'LINK' || method === 'QR' || method === 'ALL') {
    result.inviteLink = `${baseInviteUrl}?token=${token}`;
  }

  if (method === 'QR' || method === 'ALL') {
    result.qrData = generateQrPlaceholder(token);
  }

  if (method === 'CODE' || method === 'ALL') {
    result.pairCode = data.invite_code;
  }

  return result;
};

const activatePairing = async (pairingId: string, partnerUserId: string) => {
  const supabase = getSupabaseClient();

  const { error: updateError } = await supabase
    .from('pairings')
    .update({
      partner_user_id: partnerUserId,
      status: 'ACTIVE',
      invite_token: null,
      invite_code: null,
      invite_qr: null,
      token_expires_at: null,
    })
    .eq('id', pairingId);

  if (updateError) {
    throw new HttpError(400, 'Failed to accept pairing', updateError);
  }

  const { data: consent, error: consentError } = await supabase
    .from('consent_settings')
    .insert({
      pairing_id: pairingId,
      share_phase: true,
      share_mood_summary: true,
      share_energy_summary: true,
    })
    .select()
    .single();

  if (consentError) {
    throw new HttpError(400, 'Failed to initialize consent settings', consentError);
  }

  return consent;
};

export const acceptPairingInvite = async (userId: string, options: { token?: string; pairCode?: string }) => {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('pairings')
    .select('*')
    .eq('status', 'PENDING');

  if (options.token) {
    query = query.eq('invite_token', options.token);
  } else if (options.pairCode) {
    query = query.eq('invite_code', options.pairCode);
  } else {
    throw new HttpError(400, 'Missing invite token or pairing code');
  }

  const { data: pairing, error } = await query.maybeSingle();

  if (error || !pairing) {
    throw new HttpError(400, 'Invalid or expired invite', error);
  }

  if (pairing.token_expires_at && new Date(pairing.token_expires_at) < new Date()) {
    throw new HttpError(400, 'Invite has expired');
  }

  if (pairing.primary_user_id === userId) {
    throw new HttpError(400, 'You cannot pair with yourself');
  }

  const consent = await activatePairing(pairing.id, userId);

  await logAuditEvent(userId, 'pairing.accept', {
    pairingId: pairing.id,
    method: options.token ? 'TOKEN' : 'CODE',
  });

  return { pairingId: pairing.id, consent };
};

export const getInviteDetails = async (options: { token?: string; pairCode?: string }) => {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('pairings')
    .select('primary_user_id, status, invite_token, invite_code, token_expires_at')
    .eq('status', 'PENDING');

  if (options.token) {
    query = query.eq('invite_token', options.token);
  } else if (options.pairCode) {
    query = query.eq('invite_code', options.pairCode);
  } else {
    throw new HttpError(400, 'Missing invite token or pairing code');
  }

  const { data: pairing, error } = await query.maybeSingle();

  if (error || !pairing) {
    throw new HttpError(404, 'Invite not found or expired');
  }

  if (pairing.token_expires_at && new Date(pairing.token_expires_at) < new Date()) {
    throw new HttpError(400, 'Invite has expired');
  }

  // Fetch inviter profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('user_id', pairing.primary_user_id)
    .single();

  // Fetch inviter email (requires admin privileges)
  const { data: userData } = await supabase.auth.admin.getUserById(pairing.primary_user_id);

  return {
    inviterName: profile?.name,
    inviterEmail: userData.user?.email,
    expiresAt: pairing.token_expires_at,
  };
};

export const revokePairing = async (userId: string, pairingId: string) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('pairings')
    .select('*')
    .eq('id', pairingId)
    .maybeSingle();

  if (error || !data) {
    throw new HttpError(404, 'Pairing not found', error);
  }

  if (data.primary_user_id !== userId && data.partner_user_id !== userId) {
    throw new HttpError(403, 'You can only revoke your own pairings');
  }

  const { error: updateError } = await supabase
    .from('pairings')
    .update({
      status: 'REVOKED',
      partner_user_id: null,
      consent_settings: null, // Optionally clear consent or keep it? user requested unlink.
    })
    .eq('id', pairingId);

  if (updateError) {
    throw new HttpError(400, 'Failed to revoke pairing', updateError);
  }

  await logAuditEvent(userId, 'pairing.revoke', {
    pairingId,
  });
};

export const getActivePairingForUser = async (userId: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('pairings')
    .select(`
      *,
      consent_settings(*),
      primary:users!primary_user_id(
        profiles(name)
      ),
      partner:users!partner_user_id(
        profiles(name)
      )
    `)
    .or(`primary_user_id.eq.${userId},partner_user_id.eq.${userId}`)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (error) {
    throw new HttpError(400, 'Failed to fetch pairing', error);
  }

  if (!data) return null;

  // Manually fetch names to ensure reliability
  const userIds = [data.primary_user_id, data.partner_user_id].filter(Boolean);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, name')
    .in('user_id', userIds);

  const primaryProfile = profiles?.find(p => p.user_id === data.primary_user_id);
  const partnerProfile = profiles?.find(p => p.user_id === data.partner_user_id);

  // Transform to flat structure and rename properties for clarity
  return {
    ...data,
    primaryUserName: primaryProfile?.name,
    partnerUserName: partnerProfile?.name,
  };
};

export const updateConsentSettings = async (
  primaryUserId: string,
  pairingId: string,
  updates: Record<string, boolean | undefined>,
) => {
  const supabase = getSupabaseClient();

  const { data: pairing, error: pairingError } = await supabase
    .from('pairings')
    .select('*, consent_settings(*)')
    .eq('id', pairingId)
    .maybeSingle();

  if (pairingError || !pairing) {
    throw new HttpError(404, 'Pairing not found', pairingError);
  }

  if (pairing.primary_user_id !== primaryUserId) {
    throw new HttpError(403, 'Only the primary user can update consent');
  }

  const { error: consentError, data: consent } = await supabase
    .from('consent_settings')
    .update({
      share_phase: updates.sharePhase ?? pairing.consent_settings?.share_phase ?? true,
      share_mood_summary: updates.shareMoodSummary ?? pairing.consent_settings?.share_mood_summary ?? true,
      share_energy_summary: updates.shareEnergySummary ?? pairing.consent_settings?.share_energy_summary ?? true,
      share_symptoms: updates.shareSymptoms ?? pairing.consent_settings?.share_symptoms ?? false,
      share_journals: updates.shareJournals ?? pairing.consent_settings?.share_journals ?? false,
    })
    .eq('pairing_id', pairingId)
    .select()
    .single();

  if (consentError) {
    throw new HttpError(400, 'Failed to update consent settings', consentError);
  }

  await logAuditEvent(primaryUserId, 'consent.update', {
    pairingId,
    updates,
  });

  return consent;
};
