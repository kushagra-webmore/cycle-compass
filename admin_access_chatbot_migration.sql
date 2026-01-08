-- Migration: Admin Access & Chatbot Soft Delete
-- Description: Enhance admin access to all tables and add soft delete functionality for chatbot messages
-- Date: 2026-01-05

-- ============================================
-- PART 1: Add Admin Bypass Policies
-- ============================================

-- Drop existing policies that might conflict (if any)
-- We'll recreate them with admin bypass

-- Users table - Admin full access
DROP POLICY IF EXISTS "Admin manages users" ON public.users;
CREATE POLICY "Admin full access to users" ON public.users
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- Profiles table - Admin full access
DROP POLICY IF EXISTS "Admin manages profiles" ON public.profiles;
CREATE POLICY "Admin full access to profiles" ON public.profiles
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- Cycles table - Admin full access
DROP POLICY IF EXISTS "Admin manages cycles" ON public.cycles;
CREATE POLICY "Admin full access to cycles" ON public.cycles
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- Symptoms table - Admin full access
DROP POLICY IF EXISTS "Admin manages symptoms" ON public.symptoms;
CREATE POLICY "Admin full access to symptoms" ON public.symptoms
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- Journals table - Admin full access
DROP POLICY IF EXISTS "Admin manages journals" ON public.journals;
CREATE POLICY "Admin full access to journals" ON public.journals
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- Pairings table - Admin full access
DROP POLICY IF EXISTS "Admin manages pairings" ON public.pairings;
CREATE POLICY "Admin full access to pairings" ON public.pairings
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- Consent settings table - Admin full access
DROP POLICY IF EXISTS "Admin manages consent" ON public.consent_settings;
CREATE POLICY "Admin full access to consent" ON public.consent_settings
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- AI interactions table - Admin full access
DROP POLICY IF EXISTS "Admin manages AI logs" ON public.ai_interactions;
CREATE POLICY "Admin full access to AI logs" ON public.ai_interactions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- Chatbot messages table - Admin full access
DROP POLICY IF EXISTS "Admin manages chatbot messages" ON public.chatbot_messages;
CREATE POLICY "Admin full access to chatbot messages" ON public.chatbot_messages
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- Audit logs table - Admin full access
DROP POLICY IF EXISTS "Admin manages audit logs" ON public.audit_logs;
CREATE POLICY "Admin full access to audit logs" ON public.audit_logs
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- Myth busting articles table - Admin full access
DROP POLICY IF EXISTS "Admin manages myth busting" ON public.myth_busting_articles;
CREATE POLICY "Admin full access to myth busting" ON public.myth_busting_articles
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- Analytics table - Admin full access
DROP POLICY IF EXISTS "Admin manages analytics" ON public.analytics_daily_snapshots;
CREATE POLICY "Admin full access to analytics" ON public.analytics_daily_snapshots
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- ============================================
-- PART 2: Chatbot Soft Delete Columns
-- ============================================

-- Add is_deleted column to chatbot_messages
ALTER TABLE public.chatbot_messages
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- Add deleted_at column to chatbot_messages
ALTER TABLE public.chatbot_messages
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for faster queries on non-deleted messages
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_user_not_deleted 
ON public.chatbot_messages(user_id, created_at) 
WHERE is_deleted = false;

-- Create index for admin queries (all messages)
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_user_all 
ON public.chatbot_messages(user_id, created_at);

-- ============================================
-- PART 3: Last Login Tracking
-- ============================================

-- Add last_login column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Create index for last_login queries
CREATE INDEX IF NOT EXISTS idx_users_last_login 
ON public.users(last_login DESC);

-- Update RLS policy to allow users to read their own last_login
-- (Already covered by existing "Users can read own row" policy)

-- ============================================
-- PART 4: Update chatbot_messages RLS for soft delete
-- ============================================

-- Update the existing user policy to filter out soft-deleted messages
DROP POLICY IF EXISTS "User manages own chatbot messages" ON public.chatbot_messages;

-- Users can only see their own non-deleted messages
CREATE POLICY "User reads own non-deleted chatbot messages" ON public.chatbot_messages
  FOR SELECT
  USING (
    auth.uid() = user_id AND is_deleted = false
  );

-- Users can insert their own messages
CREATE POLICY "User inserts own chatbot messages" ON public.chatbot_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Users can update their own messages (for soft delete)
CREATE POLICY "User updates own chatbot messages" ON public.chatbot_messages
  FOR UPDATE
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- Note: Admin policy already created above allows admin to see ALL messages including soft-deleted

-- ============================================
-- PART 5: Comments and Documentation
-- ============================================

COMMENT ON COLUMN public.chatbot_messages.is_deleted IS 'Soft delete flag - when true, message is hidden from user but visible to admin';
COMMENT ON COLUMN public.chatbot_messages.deleted_at IS 'Timestamp when user soft-deleted this message';
COMMENT ON COLUMN public.users.last_login IS 'Timestamp of user''s last successful login';
