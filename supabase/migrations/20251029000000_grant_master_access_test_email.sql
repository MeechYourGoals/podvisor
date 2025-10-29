-- Grant master access to test email chrisatown@gmail.com
-- This migration ensures the test account has full pro access without needing payment

-- Create or replace function to grant master access to specific test emails
CREATE OR REPLACE FUNCTION grant_master_access_to_test_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  test_email TEXT := 'chrisatown@gmail.com';
  test_user_id UUID;
BEGIN
  -- Get user ID for test email
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email = test_email;

  -- Only proceed if user exists
  IF test_user_id IS NOT NULL THEN
    -- Update subscription to master/pro tier with unlimited access
    UPDATE user_subscriptions
    SET 
      tier = 'pro',
      profile_limit = 999999,  -- Effectively unlimited
      videos_per_month = -1,   -- -1 indicates unlimited
      audio_per_month = -1,    -- Unlimited audio uploads
      videos_analyzed_this_month = 0,
      audio_uploads_this_month = 0,
      updated_at = NOW()
    WHERE user_id = test_user_id;

    RAISE NOTICE 'Master access granted to test email: %', test_email;
  ELSE
    RAISE NOTICE 'Test user not found yet: %', test_email;
  END IF;
END;
$$;

-- Add audio_per_month and audio_uploads_this_month columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_subscriptions' 
    AND column_name = 'audio_per_month'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN audio_per_month INTEGER DEFAULT 2;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_subscriptions' 
    AND column_name = 'audio_uploads_this_month'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN audio_uploads_this_month INTEGER DEFAULT 0;
  END IF;
END $$;

-- Grant access to existing test user if they exist
SELECT grant_master_access_to_test_emails();

-- Create trigger to auto-grant master access when test email signs up
CREATE OR REPLACE FUNCTION auto_grant_master_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the test email
  IF NEW.email = 'chrisatown@gmail.com' THEN
    -- Update subscription record (created by create_user_subscription trigger)
    -- We need to wait a moment for that trigger to complete, so we update in a deferred way
    UPDATE user_subscriptions
    SET 
      tier = 'pro',
      profile_limit = 999999,
      videos_per_month = -1,
      audio_per_month = -1,
      videos_analyzed_this_month = 0,
      audio_uploads_this_month = 0,
      updated_at = NOW()
    WHERE user_id = NEW.id;

    RAISE NOTICE 'Auto-granted master access to test email: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_test_user_created ON auth.users;
CREATE TRIGGER on_test_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_grant_master_access();

-- Add comment for documentation
COMMENT ON FUNCTION grant_master_access_to_test_emails() IS 
  'Grants unlimited pro access to test email chrisatown@gmail.com for development and testing purposes';

COMMENT ON FUNCTION auto_grant_master_access() IS 
  'Automatically grants master access when test email creates an account';
