import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

let client: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (!client) {
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return client;
};

export const getSupabaseAnonClient = () =>
  createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
