-- Make profile_id nullable in personalized_insights to support anonymous users
-- This allows personalized insights to be generated without a saved profile
ALTER TABLE personalized_insights 
ALTER COLUMN profile_id DROP NOT NULL;

-- Add index for better query performance on non-null profile_ids
CREATE INDEX IF NOT EXISTS idx_personalized_insights_profile_id_not_null 
ON personalized_insights(profile_id) WHERE profile_id IS NOT NULL;

-- Add comment explaining nullable profile_id
COMMENT ON COLUMN personalized_insights.profile_id IS 
  'Reference to saved profile. NULL for anonymous users or ad-hoc profile descriptions.';
