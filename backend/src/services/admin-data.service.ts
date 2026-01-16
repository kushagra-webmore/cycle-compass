import { getSupabaseClient } from '../lib/supabase.js';
import { HttpError } from '../utils/http-error.js';
import { getChatHistory } from './chatbot.service.js';

/**
 * Get comprehensive user details including all profile data, cycles, symptoms, and journals
 */
export const getAllUserDetails = async (userId: string) => {
  const supabase = getSupabaseClient();
  
  // Fetch user and profile
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, role, status, created_at, last_login, last_activity, profiles(*)')
    .eq('id', userId)
    .single();
  
  if (userError || !user) {
    throw new HttpError(404, 'User not found', userError);
  }
  
  // Fetch cycles
  const { data: cycles } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });
  
  // Fetch symptoms
  const { data: symptoms } = await supabase
    .from('symptoms')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(50);
  
  // Fetch journals
  const { data: journals } = await supabase
    .from('journals')
    .select('id, created_at, mood, tags')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  
  // Fetch active pairing
  const { data: pairing } = await supabase
    .from('pairings')
    .select('*, partner:partner_user_id(id, role, profiles(name)), primary:primary_user_id(id, role, profiles(name))')
    .or(`primary_user_id.eq.${userId},partner_user_id.eq.${userId}`)
    .eq('status', 'ACTIVE')
    .single();

  // Fetch email from auth
  const { data: authData } = await supabase.auth.admin.getUserById(userId);
  const email = authData.user?.email || null;

  // If pairing exists, fetch connected user's email
  let pairingWithEmail = null;
  if (pairing) {
    const connectedUserId = pairing.primary_user_id === userId 
      ? pairing.partner_user_id 
      : pairing.primary_user_id;

    let connectedEmail = null;
    if (connectedUserId) {
      const { data: connectedAuthData } = await supabase.auth.admin.getUserById(connectedUserId);
      connectedEmail = connectedAuthData.user?.email || null;
    }

    pairingWithEmail = {
      ...pairing,
      connected_email: connectedEmail
    };
  }

  return {
    user: { ...user, email },
    cycles: cycles ?? [],
    symptoms: symptoms ?? [],
    journals: journals ?? [],
    pairing: pairingWithEmail ?? null,
  };
};

/**
 * Get user activity log including login history
 */
export const getUserActivityLog = async (userId: string) => {
  const supabase = getSupabaseClient();
  
  // Get audit logs for this user
  const { data: auditLogs, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('actor_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (error) {
    throw new HttpError(400, 'Failed to fetch activity log', error);
  }
  
  // Get user's last login
  const { data: user } = await supabase
    .from('users')
    .select('last_login, created_at')
    .eq('id', userId)
    .single();
  
  return {
    auditLogs: auditLogs ?? [],
    lastLogin: user?.last_login,
    accountCreated: user?.created_at,
  };
};

/**
 * Get chatbot history for a specific user (admin sees ALL messages including soft-deleted)
 */
export const getChatbotHistoryForUser = async (userId: string) => {
  // Use the chatbot service but with admin flag to see all messages
  return getChatHistory(userId, undefined, true, 100);
};

/**
 * Get detailed cycle data for a specific user
 */
export const getUserCycleData = async (userId: string) => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });
  
  if (error) {
    throw new HttpError(400, 'Failed to fetch cycle data', error);
  }
  
  return data ?? [];
};
