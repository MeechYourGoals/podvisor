# Master Access Setup for Test Email

## Overview
This document explains how to grant full master/pro access to the test email `chrisatown@gmail.com` without requiring payment.

## Migration Created
✅ **File**: `/workspace/supabase/migrations/20251029000000_grant_master_access_test_email.sql`

This migration does three things:
1. **Adds audio tracking columns** to user_subscriptions table (if not already present)
2. **Grants unlimited pro access** to existing users with the test email
3. **Auto-grants master access** when the test email signs up in the future

## What Master Access Includes
- Tier: `pro`
- Profile limit: 999,999 (effectively unlimited)
- YouTube analyses per month: `-1` (unlimited)
- Audio uploads per month: `-1` (unlimited)
- No Stripe customer ID or subscription ID required
- Bypasses all payment checks

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project: https://supabase.com/dashboard/project/wnbybsgjdmguzviivpaj
2. Navigate to **SQL Editor**
3. Copy the contents of `/workspace/supabase/migrations/20251029000000_grant_master_access_test_email.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute

### Option 2: Supabase CLI (If Available)
```bash
# From project root
supabase db push
```

### Option 3: Direct SQL (Quick Test)
If you need immediate access and want to skip the full migration, run this in the SQL Editor:

```sql
-- Quick grant for existing user
UPDATE user_subscriptions
SET 
  tier = 'pro',
  profile_limit = 999999,
  videos_per_month = -1,
  audio_per_month = -1,
  videos_analyzed_this_month = 0,
  audio_uploads_this_month = 0,
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'chrisatown@gmail.com'
);
```

## Verification

After applying the migration, verify it worked:

```sql
-- Check subscription status
SELECT 
  us.*,
  au.email
FROM user_subscriptions us
JOIN auth.users au ON au.id = us.user_id
WHERE au.email = 'chrisatown@gmail.com';
```

You should see:
- `tier`: `pro`
- `videos_per_month`: `-1`
- `audio_per_month`: `-1`
- `profile_limit`: `999999`

## Testing

1. **Sign in** with `chrisatown@gmail.com`
2. **Go to Settings** → Subscription Section
3. You should see:
   - Badge showing "Pro" tier
   - Unlimited (∞) for YouTube and Audio analyses
   - No upgrade prompts
4. **Test features**:
   - Upload multiple audio files (should not hit limits)
   - Analyze multiple YouTube videos (should not hit limits)
   - Create multiple context profiles (should not hit limits)

## How It Works

### For Existing Users
- The migration runs a function that immediately updates the subscription for `chrisatown@gmail.com`
- If the user doesn't exist yet, it logs a notice but doesn't fail

### For New Signups
- A database trigger (`on_test_user_created`) fires after user creation
- It checks if the email matches `chrisatown@gmail.com`
- If yes, it automatically upgrades the subscription to unlimited pro access
- This happens seamlessly during account creation

## Security Notes

⚠️ **This is for testing only**
- The test email is hardcoded in the database functions
- No API endpoints are exposed for this functionality
- It does not affect other users
- It bypasses Stripe entirely (no webhook interference)

## Rollback

If you need to remove master access:

```sql
-- Revert to free tier
UPDATE user_subscriptions
SET 
  tier = 'free',
  profile_limit = 3,
  videos_per_month = 10,
  audio_per_month = 2,
  videos_analyzed_this_month = 0,
  audio_uploads_this_month = 0,
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'chrisatown@gmail.com'
);
```

## Adding More Test Emails

To grant master access to additional test emails, modify the migration:

```sql
-- Update the function to include multiple emails
CREATE OR REPLACE FUNCTION grant_master_access_to_test_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  test_emails TEXT[] := ARRAY['chrisatown@gmail.com', 'another@test.com'];
  test_email TEXT;
  test_user_id UUID;
BEGIN
  FOREACH test_email IN ARRAY test_emails LOOP
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE email = test_email;

    IF test_user_id IS NOT NULL THEN
      UPDATE user_subscriptions
      SET 
        tier = 'pro',
        profile_limit = 999999,
        videos_per_month = -1,
        audio_per_month = -1,
        videos_analyzed_this_month = 0,
        audio_uploads_this_month = 0,
        updated_at = NOW()
      WHERE user_id = test_user_id;

      RAISE NOTICE 'Master access granted to: %', test_email;
    END IF;
  END LOOP;
END;
$$;
```

## Support

If you encounter issues:
1. Check that the migration was applied successfully
2. Verify the user exists in `auth.users`
3. Check the `user_subscriptions` table for the correct values
4. Look for errors in Supabase logs

---

**Status**: ✅ Migration ready to apply
**Created**: 2025-10-29
**Test Email**: chrisatown@gmail.com
