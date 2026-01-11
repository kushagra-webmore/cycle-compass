import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

// Exporting a service role client for backend usage
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, clientOptions);
