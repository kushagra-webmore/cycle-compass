import { getSupabaseClient } from '../lib/supabase.js';
import { HttpError } from '../utils/http-error.js';

interface SessionInfo {
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
  };
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create a new session record
 */
export const createSession = async (
  userId: string,
  sessionToken: string,
  sessionInfo: SessionInfo,
  expiresInSeconds: number = 2592000 // 30 days default
) => {
  const supabase = getSupabaseClient();
  
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);
  
  const { data, error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      session_token: sessionToken,
      device_info: sessionInfo.deviceInfo,
      ip_address: sessionInfo.ipAddress,
      user_agent: sessionInfo.userAgent,
      expires_at: expiresAt.toISOString(),
      is_active: true,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Failed to create session record:', error);
    // Don't throw - session tracking is not critical for login
  }
  
  return data;
};

/**
 * Update session activity timestamp
 */
export const updateSessionActivity = async (sessionToken: string) => {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('user_sessions')
    .update({ last_activity: new Date().toISOString() })
    .eq('session_token', sessionToken)
    .eq('is_active', true);
  
  if (error) {
    console.error('Failed to update session activity:', error);
  }
};

/**
 * Get active sessions for a user
 */
export const getActiveSessions = async (userId: string) => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('last_activity', { ascending: false });
  
  if (error) {
    throw new HttpError(400, 'Failed to fetch active sessions', error);
  }
  
  return data ?? [];
};

/**
 * Get active session count for a user
 */
export const getActiveSessionCount = async (userId: string): Promise<number> => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .rpc('get_active_session_count', { p_user_id: userId });
  
  if (error) {
    console.error('Failed to get session count:', error);
    return 0;
  }
  
  return data ?? 0;
};

/**
 * Check if user has exceeded max concurrent sessions
 */
export const checkConcurrentSessions = async (
  userId: string,
  maxSessions: number = 5
): Promise<{ allowed: boolean; currentCount: number; maxAllowed: number }> => {
  const currentCount = await getActiveSessionCount(userId);
  
  return {
    allowed: currentCount < maxSessions,
    currentCount,
    maxAllowed: maxSessions,
  };
};

/**
 * Invalidate a specific session
 */
export const invalidateSession = async (sessionToken: string) => {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('user_sessions')
    .update({ is_active: false })
    .eq('session_token', sessionToken);
  
  if (error) {
    throw new HttpError(400, 'Failed to invalidate session', error);
  }
};

/**
 * Invalidate all sessions for a user (except current)
 */
export const invalidateAllUserSessions = async (
  userId: string,
  exceptSessionToken?: string
) => {
  const supabase = getSupabaseClient();
  
  let query = supabase
    .from('user_sessions')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true);
  
  if (exceptSessionToken) {
    query = query.neq('session_token', exceptSessionToken);
  }
  
  const { error } = await query;
  
  if (error) {
    throw new HttpError(400, 'Failed to invalidate sessions', error);
  }
};

/**
 * Clean up expired sessions (should be run periodically)
 */
export const cleanupExpiredSessions = async () => {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase.rpc('cleanup_expired_sessions');
  
  if (error) {
    console.error('Failed to cleanup expired sessions:', error);
  }
};

/**
 * Get session statistics for admin
 */
export const getSessionStatistics = async () => {
  const supabase = getSupabaseClient();
  
  const { data: activeSessions } = await supabase
    .from('user_sessions')
    .select('user_id', { count: 'exact' })
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString());
  
  const { data: totalSessions } = await supabase
    .from('user_sessions')
    .select('id', { count: 'exact' });
  
  return {
    activeSessionCount: activeSessions?.length ?? 0,
    totalSessionCount: totalSessions?.length ?? 0,
  };
};
