-- Fix security linter warnings

-- Add RLS policies for content_sources and experts (read-only for all authenticated users)
CREATE POLICY "Anyone can view content sources" ON content_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view experts" ON experts FOR SELECT TO authenticated USING (true);

-- Fix function search_path issues
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION create_default_bookmark_folder()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO bookmark_folders (user_id, folder_name, description, color, sort_order)
  VALUES (NEW.id, 'Saved Items', 'Your default bookmark folder', '#6366f1', 0)
  ON CONFLICT (user_id, folder_name) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION create_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, tier, profile_limit, videos_per_month)
  VALUES (NEW.id, 'free', 3, 10)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;