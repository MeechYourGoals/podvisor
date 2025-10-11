-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to reset video counts on the 1st of each month at midnight UTC
SELECT cron.schedule(
  'reset-monthly-video-counts',
  '0 0 1 * *', -- At 00:00 on day 1 of every month
  $$
  UPDATE public.user_subscriptions
  SET videos_analyzed_this_month = 0
  WHERE videos_analyzed_this_month > 0;
  $$
);