-- Check if the profiles table exists and show its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles';

-- Check if the onboarding_completed column exists
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
) AS has_onboarding_column;
