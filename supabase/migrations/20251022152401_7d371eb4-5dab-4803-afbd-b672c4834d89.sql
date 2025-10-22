-- Create audio uploads bucket with appropriate constraints
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-uploads',
  'audio-uploads',
  false,
  52428800,
  ARRAY[
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/x-wav',
    'audio/webm',
    'audio/ogg',
    'audio/flac',
    'audio/aac'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Users can upload their own audio files
CREATE POLICY "Users can upload their own audio files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can read their own audio files
CREATE POLICY "Users can read their own audio files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can delete their own audio files
CREATE POLICY "Users can delete their own audio files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add audio-specific fields to videos table
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS audio_source_path TEXT,
ADD COLUMN IF NOT EXISTS audio_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS audio_original_filename TEXT,
ADD COLUMN IF NOT EXISTS is_audio_upload BOOLEAN DEFAULT FALSE;

-- Add comments for clarity
COMMENT ON COLUMN public.videos.audio_source_path IS 'Storage path for uploaded audio files (null for YouTube videos)';
COMMENT ON COLUMN public.videos.is_audio_upload IS 'TRUE if analyzed from audio upload, FALSE if from YouTube';