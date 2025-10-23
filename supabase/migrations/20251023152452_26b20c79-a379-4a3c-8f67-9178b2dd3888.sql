-- ============================================
-- PHASE 1: FREE TIER OPTIMIZATION
-- New limits: 4 YouTube/month, 2 audio/month, 2 profiles, 2 folders/profile
-- ============================================

-- Add new columns for audio upload tracking
ALTER TABLE user_subscriptions 
  ADD COLUMN IF NOT EXISTS audio_uploads_this_month INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS audio_per_month INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS folders_per_profile INTEGER DEFAULT 2;

-- Update default limits for new free tier users
ALTER TABLE user_subscriptions 
  ALTER COLUMN videos_per_month SET DEFAULT 4,
  ALTER COLUMN profile_limit SET DEFAULT 2;

-- Update existing free tier users to new limits
UPDATE user_subscriptions 
SET 
  videos_per_month = 4,
  profile_limit = 2,
  audio_per_month = 2,
  audio_uploads_this_month = 0,
  folders_per_profile = 2
WHERE tier = 'free';

-- Set unlimited for Pro/Annual tiers (-1 = unlimited)
UPDATE user_subscriptions 
SET 
  audio_per_month = -1,
  folders_per_profile = -1
WHERE tier IN ('pro', 'annual');

-- ============================================
-- PHASE 2: INCREMENT AUDIO COUNT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.increment_audio_count(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Security: Only allow users to update their own audio count
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify another user audio count';
  END IF;
  
  -- Increment the audio uploads counter
  UPDATE public.user_subscriptions
  SET audio_uploads_this_month = COALESCE(audio_uploads_this_month, 0) + 1
  WHERE user_id = p_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.increment_audio_count(uuid) TO authenticated;