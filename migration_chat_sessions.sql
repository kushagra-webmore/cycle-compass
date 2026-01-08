-- Migration: Add Chatbot Sessions
-- Description: Add support for multiple chat sessions, AI titles, and soft delete.
-- Date: 2026-01-08

-- ============================================
-- PART 1: Create chatbot_sessions table
-- ============================================

CREATE TABLE IF NOT EXISTS public.chatbot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_user ON public.chatbot_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_updated ON public.chatbot_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_user_active 
  ON public.chatbot_sessions(user_id) WHERE is_deleted = false;

-- Trigger for updated_at
CREATE TRIGGER trg_chatbot_sessions_updated_at
  BEFORE UPDATE ON public.chatbot_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ============================================
-- PART 2: Update chatbot_messages table
-- ============================================

-- Add session_id column
ALTER TABLE public.chatbot_messages
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.chatbot_sessions(id) ON DELETE CASCADE;

-- Create index for session messages
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_session 
  ON public.chatbot_messages(session_id, created_at);

-- ============================================
-- PART 3: Migrate existing messages
-- ============================================

DO $$
DECLARE
  r RECORD;
  new_session_id UUID;
BEGIN
  -- For each user with messages but no session_id
  FOR r IN 
    SELECT DISTINCT user_id 
    FROM public.chatbot_messages 
    WHERE session_id IS NULL
  LOOP
    -- Create a default "Legacy Chat" session
    INSERT INTO public.chatbot_sessions (user_id, title, updated_at)
    VALUES (r.user_id, 'Previous Chat History', NOW())
    RETURNING id INTO new_session_id;

    -- Update their messages
    UPDATE public.chatbot_messages
    SET session_id = new_session_id
    WHERE user_id = r.user_id AND session_id IS NULL;
  END LOOP;
END $$;

-- Now make session_id NOT NULL if desired, or keep nullable for flexibility. 
-- Keeping nullable for safety, but typically should be required.
-- ALTER TABLE public.chatbot_messages ALTER COLUMN session_id SET NOT NULL;

-- ============================================
-- PART 4: RLS Policies for Sessions
-- ============================================

ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;

-- Users see their own non-deleted sessions
CREATE POLICY "Users view own active sessions" ON public.chatbot_sessions
  FOR SELECT
  USING (
    auth.uid() = user_id AND is_deleted = false
  );

-- Users can create own sessions
CREATE POLICY "Users create own sessions" ON public.chatbot_sessions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Users can update own sessions (e.g., title, soft delete)
CREATE POLICY "Users update own sessions" ON public.chatbot_sessions
  FOR UPDATE
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- Admin sees ALL sessions (including deleted)
CREATE POLICY "Admin views all sessions" ON public.chatbot_sessions
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- Admin manages sessions
CREATE POLICY "Admin manages sessions" ON public.chatbot_sessions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- Update Message Policies to ensure they respect session access if needed, 
-- but existing "User manages own messages" is mostly fine. 
-- We might want to ensure user can only insert into their own sessions?
-- For now, relying on user_id check is sufficient.

-- ============================================
-- PART 5: Comments
-- ============================================

COMMENT ON TABLE public.chatbot_sessions IS 'Chat sessions grouping messages';
COMMENT ON COLUMN public.chatbot_sessions.is_deleted IS 'Soft delete flag';
