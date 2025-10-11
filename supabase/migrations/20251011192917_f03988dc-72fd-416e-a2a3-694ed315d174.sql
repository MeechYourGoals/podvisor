-- Phase 1 & 2: Complete Bookmarks, Profiles, Stripe Integration

-- 1. Create junction table for multi-folder bookmark support
CREATE TABLE IF NOT EXISTS public.bookmarked_videos_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookmarked_video_id UUID REFERENCES public.bookmarked_videos(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES public.bookmark_folders(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bookmarked_video_id, folder_id)
);

-- Enable RLS
ALTER TABLE public.bookmarked_videos_folders ENABLE ROW LEVEL SECURITY;

-- RLS policy for junction table
CREATE POLICY "Users can manage own bookmark-folder links"
  ON public.bookmarked_videos_folders FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.bookmarked_videos bv
    WHERE bv.id = bookmarked_video_id AND bv.user_id = auth.uid()
  ));

-- 2. Create Stripe products table
CREATE TABLE IF NOT EXISTS public.stripe_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier subscription_tier NOT NULL UNIQUE,
  stripe_product_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  interval TEXT NOT NULL DEFAULT 'month',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stripe_products ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read Stripe products
CREATE POLICY "Anyone can view stripe products"
  ON public.stripe_products FOR SELECT
  TO authenticated
  USING (true);

-- 3. Extend user_subscriptions for Stripe
ALTER TABLE public.user_subscriptions 
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- 4. Create user_profiles table for extended account details
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();

-- 5. Backfill existing users with profiles
INSERT INTO public.user_profiles (user_id, display_name)
SELECT id, SPLIT_PART(email, '@', 1)
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- 6. Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- 7. Backfill missing subscriptions
INSERT INTO public.user_subscriptions (user_id, tier, profile_limit, videos_per_month, videos_analyzed_this_month)
SELECT id, 'free', 3, 10, 0
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- 8. Create function to increment video count
CREATE OR REPLACE FUNCTION public.increment_video_count(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_subscriptions
  SET videos_analyzed_this_month = videos_analyzed_this_month + 1
  WHERE user_id = p_user_id;
END;
$$;

-- 9. Add index for performance
CREATE INDEX IF NOT EXISTS idx_bookmarked_videos_folders_video 
  ON public.bookmarked_videos_folders(bookmarked_video_id);
CREATE INDEX IF NOT EXISTS idx_bookmarked_videos_folders_folder 
  ON public.bookmarked_videos_folders(folder_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer 
  ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id 
  ON public.user_profiles(user_id);