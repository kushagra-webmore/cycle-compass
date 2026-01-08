-- Migration: Add Goal to Profiles
-- Description: Add user goal (tracking, conceive) to profiles table
-- Date: 2026-01-08

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS goal TEXT DEFAULT 'TRACKING';

COMMENT ON COLUMN public.profiles.goal IS 'User goal: TRACKING, CONCEIVE, PREGNANCY';
