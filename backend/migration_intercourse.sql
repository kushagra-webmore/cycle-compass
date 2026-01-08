-- Migration: Add Intercourse Tracking
-- Description: Add intercourse and protection columns to symptoms table
-- Date: 2026-01-08

ALTER TABLE public.symptoms
ADD COLUMN IF NOT EXISTS intercourse BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS protection_used BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.symptoms.intercourse IS 'Whether sexual intercourse occurred on this date';
COMMENT ON COLUMN public.symptoms.protection_used IS 'Whether protection was used during intercourse';
