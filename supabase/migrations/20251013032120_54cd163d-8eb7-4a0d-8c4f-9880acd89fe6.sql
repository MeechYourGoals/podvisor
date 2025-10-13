-- Fix 1: Secure increment_video_count function with authorization check
CREATE OR REPLACE FUNCTION public.increment_video_count(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- CRITICAL: Verify caller owns this user_id to prevent privilege escalation
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify another user''s video count';
  END IF;
  
  UPDATE public.user_subscriptions
  SET videos_analyzed_this_month = videos_analyzed_this_month + 1
  WHERE user_id = p_user_id;
END;
$$;

-- Fix 2: Make user_id columns NOT NULL to prevent RLS bypass
-- First, ensure all existing records have user_id set (clean up any orphaned records)
DELETE FROM bookmark_folders WHERE user_id IS NULL;
DELETE FROM bookmarked_insights WHERE user_id IS NULL;
DELETE FROM bookmarked_videos WHERE user_id IS NULL;
DELETE FROM user_context_profiles WHERE user_id IS NULL;
DELETE FROM videos WHERE user_id IS NULL;

-- Now enforce NOT NULL constraint
ALTER TABLE bookmark_folders 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE bookmarked_insights 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE bookmarked_videos 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE user_context_profiles 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE videos 
ALTER COLUMN user_id SET NOT NULL;