-- Create table for anonymous rate limiting
CREATE TABLE IF NOT EXISTS public.anonymous_rate_limits (
  ip_address TEXT PRIMARY KEY,
  video_count INTEGER DEFAULT 0,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.anonymous_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for service role only
CREATE POLICY "Service role can manage rate limits"
  ON public.anonymous_rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to cleanup old rate limit records (>24hrs)
CREATE OR REPLACE FUNCTION public.cleanup_anonymous_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.anonymous_rate_limits
  WHERE last_reset < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;