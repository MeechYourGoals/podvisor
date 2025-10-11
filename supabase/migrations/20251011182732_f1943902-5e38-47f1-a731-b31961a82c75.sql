-- Create all base tables (fixing reserved keyword issue)
CREATE TYPE profile_category AS ENUM (
  'business',
  'sports',
  'health_fitness',
  'technology',
  'personal_development',
  'finance',
  'entertainment',
  'education',
  'general'
);

-- Content sources table
CREATE TABLE content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('youtube', 'podcast', 'article')),
  source_url TEXT NOT NULL UNIQUE,
  source_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Experts table
CREATE TABLE experts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credentials TEXT,
  domain profile_category,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id UUID REFERENCES content_sources(id),
  expert_id UUID REFERENCES experts(id),
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  video_id TEXT NOT NULL,
  thumbnail_url TEXT,
  analyzed_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insights table (universal insights)
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  category profile_category NOT NULL,
  insight_text TEXT NOT NULL,
  impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
  actionability_score INTEGER CHECK (actionability_score >= 1 AND actionability_score <= 10),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User context profiles table (renamed current_role to role_description)
CREATE TABLE user_context_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL,
  category profile_category NOT NULL,
  role_description TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  goals TEXT NOT NULL,
  challenges TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, profile_name)
);

-- Personalized insights table
CREATE TABLE personalized_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES user_context_profiles(id) ON DELETE CASCADE,
  insight_text TEXT NOT NULL,
  action_items TEXT[],
  relevance_score INTEGER CHECK (relevance_score >= 1 AND relevance_score <= 10),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bookmark folders table
CREATE TABLE bookmark_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, folder_name)
);

-- Bookmarked videos table
CREATE TABLE bookmarked_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES bookmark_folders(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Bookmarked insights table
CREATE TABLE bookmarked_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_id UUID REFERENCES insights(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES bookmark_folders(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, insight_id)
);

-- Enable RLS on all tables
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_context_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarked_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarked_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own videos" ON videos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own videos" ON videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own videos" ON videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own videos" ON videos FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view insights for own videos" ON insights FOR SELECT USING (
  EXISTS (SELECT 1 FROM videos WHERE videos.id = insights.video_id AND videos.user_id = auth.uid())
);

CREATE POLICY "Users can view own profiles" ON user_context_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profiles" ON user_context_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profiles" ON user_context_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profiles" ON user_context_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view personalized insights for own videos" ON personalized_insights FOR SELECT USING (
  EXISTS (SELECT 1 FROM videos WHERE videos.id = personalized_insights.video_id AND videos.user_id = auth.uid())
);

CREATE POLICY "Users can view own folders" ON bookmark_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own folders" ON bookmark_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON bookmark_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON bookmark_folders FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bookmarked videos" ON bookmarked_videos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookmarked videos" ON bookmarked_videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookmarked videos" ON bookmarked_videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarked videos" ON bookmarked_videos FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bookmarked insights" ON bookmarked_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookmarked insights" ON bookmarked_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookmarked insights" ON bookmarked_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarked insights" ON bookmarked_insights FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_analyzed_at ON videos(analyzed_at DESC);
CREATE INDEX idx_insights_video_id ON insights(video_id);
CREATE INDEX idx_personalized_insights_video_id ON personalized_insights(video_id);
CREATE INDEX idx_personalized_insights_profile_id ON personalized_insights(profile_id);
CREATE INDEX idx_user_context_profiles_user_id ON user_context_profiles(user_id);
CREATE INDEX idx_bookmark_folders_user_id ON bookmark_folders(user_id);
CREATE INDEX idx_bookmarked_videos_user_id ON bookmarked_videos(user_id);
CREATE INDEX idx_bookmarked_insights_user_id ON bookmarked_insights(user_id);

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_context_profiles_updated_at BEFORE UPDATE ON user_context_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookmark_folders_updated_at BEFORE UPDATE ON bookmark_folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION create_default_bookmark_folder()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO bookmark_folders (user_id, folder_name, description, color, sort_order)
  VALUES (NEW.id, 'Saved Items', 'Your default bookmark folder', '#6366f1', 0)
  ON CONFLICT (user_id, folder_name) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_folder AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION create_default_bookmark_folder();

-- Subscription tier system
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'team');

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier subscription_tier DEFAULT 'free',
  profile_limit INTEGER DEFAULT 3,
  videos_per_month INTEGER DEFAULT 10,
  videos_analyzed_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscription" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own subscription" ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION create_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, tier, profile_limit, videos_per_month)
  VALUES (NEW.id, 'free', 3, 10)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_subscription AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION create_user_subscription();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE videos;
ALTER PUBLICATION supabase_realtime ADD TABLE insights;
ALTER PUBLICATION supabase_realtime ADD TABLE personalized_insights;
ALTER PUBLICATION supabase_realtime ADD TABLE bookmark_folders;
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarked_videos;
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarked_insights;