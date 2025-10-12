-- Add expert attribution to insights table
ALTER TABLE insights 
ADD COLUMN IF NOT EXISTS expert_attribution TEXT;

-- Add "For Your Profile" context to personalized insights
ALTER TABLE personalized_insights
ADD COLUMN IF NOT EXISTS for_profile_context TEXT;