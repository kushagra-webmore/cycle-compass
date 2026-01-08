-- Session Security Enhancements Migration
-- Description: Add session tracking, last activity, and concurrent session monitoring
-- Date: 2026-01-05

-- ============================================
-- PART 1: User Sessions Table
-- ============================================

-- Create user_sessions table to track active sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity DESC);

-- ============================================
-- PART 2: Add last_activity to users table
-- ============================================

-- Add last_activity column if it doesn't exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ;

-- Create index for last_activity queries
CREATE INDEX IF NOT EXISTS idx_users_last_activity 
ON public.users(last_activity DESC);

-- ============================================
-- PART 3: RLS Policies for user_sessions
-- ============================================

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own sessions (for last_activity)
CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions (logout)
CREATE POLICY "Users can delete own sessions" ON public.user_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admin can view all sessions
CREATE POLICY "Admin views all sessions" ON public.user_sessions
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- Admin can delete any session (force logout)
CREATE POLICY "Admin deletes any session" ON public.user_sessions
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- ============================================
-- PART 4: Function to clean up expired sessions
-- ============================================

-- Function to automatically clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark expired sessions as inactive
  UPDATE public.user_sessions
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
  
  -- Delete sessions older than 30 days
  DELETE FROM public.user_sessions
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- ============================================
-- PART 5: Function to detect concurrent sessions
-- ============================================

-- Function to get active session count for a user
CREATE OR REPLACE FUNCTION get_active_session_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO session_count
  FROM public.user_sessions
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > NOW();
  
  RETURN session_count;
END;
$$;

-- ============================================
-- PART 6: Trigger to update last_activity
-- ============================================

-- Function to update last_activity on session update
CREATE OR REPLACE FUNCTION update_user_last_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user's last_activity when session is updated
  UPDATE public.users
  SET last_activity = NEW.last_activity
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_user_last_activity ON public.user_sessions;
CREATE TRIGGER trigger_update_user_last_activity
  AFTER UPDATE OF last_activity ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_activity();

-- ============================================
-- PART 7: Comments and Documentation
-- ============================================

COMMENT ON TABLE public.user_sessions IS 'Tracks active user sessions for concurrent session monitoring and security';
COMMENT ON COLUMN public.user_sessions.session_token IS 'Unique token identifying this session (could be refresh token hash)';
COMMENT ON COLUMN public.user_sessions.device_info IS 'JSON object with device information (browser, OS, etc.)';
COMMENT ON COLUMN public.user_sessions.last_activity IS 'Timestamp of last user activity in this session';
COMMENT ON COLUMN public.user_sessions.is_active IS 'Whether this session is currently active';
COMMENT ON COLUMN public.users.last_activity IS 'Timestamp of user''s last activity across all sessions';
