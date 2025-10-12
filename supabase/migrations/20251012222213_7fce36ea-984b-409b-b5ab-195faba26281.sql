-- Add profile_id to bookmark_folders (nullable for global folders)
ALTER TABLE bookmark_folders 
ADD COLUMN profile_id UUID REFERENCES user_context_profiles(id) ON DELETE SET NULL;

-- Add index for faster filtering
CREATE INDEX idx_bookmark_folders_profile_id ON bookmark_folders(profile_id);

-- Update existing Pro/Annual subscriptions to 10 profile limit
UPDATE user_subscriptions 
SET profile_limit = 10 
WHERE tier IN ('pro', 'annual');

-- Add comment for clarity
COMMENT ON COLUMN bookmark_folders.profile_id IS 'NULL = Global folder visible across all profiles. Non-null = Profile-specific folder.';

-- Update RLS policies for profile-aware filtering
DROP POLICY IF EXISTS "Users can view own folders" ON bookmark_folders;

CREATE POLICY "Users can view own folders"
ON bookmark_folders FOR SELECT
USING (
  auth.uid() = user_id 
  AND (
    profile_id IS NULL  -- Global folders
    OR profile_id IN (  -- Profile-specific folders user owns
      SELECT id FROM user_context_profiles WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can insert own folders" ON bookmark_folders;

CREATE POLICY "Users can insert own folders"
ON bookmark_folders FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    profile_id IS NULL
    OR profile_id IN (
      SELECT id FROM user_context_profiles WHERE user_id = auth.uid()
    )
  )
);