-- Create user_default_profiles table
CREATE TABLE public.user_default_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_default_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_default_profiles
CREATE POLICY "Users can view own default profile"
ON public.user_default_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own default profile"
ON public.user_default_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own default profile"
ON public.user_default_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own default profile"
ON public.user_default_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_default_profiles_updated_at
BEFORE UPDATE ON public.user_default_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add profile_used column to videos table
ALTER TABLE public.videos
ADD COLUMN profile_used TEXT;

-- Add profile_used column to insights table
ALTER TABLE public.insights
ADD COLUMN profile_used TEXT;

-- Add profile_used column to personalized_insights table
ALTER TABLE public.personalized_insights
ADD COLUMN profile_used TEXT;

-- Backfill existing data with "default"
UPDATE public.videos SET profile_used = 'default' WHERE profile_used IS NULL;
UPDATE public.insights SET profile_used = 'default' WHERE profile_used IS NULL;
UPDATE public.personalized_insights SET profile_used = 'default' WHERE profile_used IS NULL;