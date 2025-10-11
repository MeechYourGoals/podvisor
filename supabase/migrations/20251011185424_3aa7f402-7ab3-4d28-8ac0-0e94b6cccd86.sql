-- Add new columns to videos table for enhanced metadata
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS speakers JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_videos_tags ON videos USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_videos_is_favorite ON videos(is_favorite) WHERE is_favorite = true;

-- Add comment to explain speakers structure
COMMENT ON COLUMN videos.speakers IS 'Array of speaker objects: [{"name": "Speaker Name", "role": "interviewee|host|panelist|guest"}]';