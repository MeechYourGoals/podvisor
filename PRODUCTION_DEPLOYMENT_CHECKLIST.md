# Production Deployment Checklist

This checklist ensures all critical steps are completed before deploying YAYA (Podvisor) to production.

## Pre-Deployment Setup

### 1. Environment Variables Configuration

#### Frontend (Vite) - **REQUIRED**
Set these in your deployment platform (Vercel, Netlify, etc.):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_SUPABASE_PROJECT_ID=your-project-id
```

#### Frontend (Optional but Recommended)
```bash
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

#### Supabase Edge Functions - **REQUIRED**
Set these in Supabase Dashboard → Edge Functions → Secrets:

```bash
# Required for all functions
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Required for analyze-video function
LOVABLE_API_KEY=your-lovable-api-key
PERPLEXITY_API_KEY=your-perplexity-key (optional fallback)

# Required for payment functions
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...
```

---

## Security Checklist

### ✅ Credentials & Keys
- [ ] All hardcoded credentials removed from `vite.config.ts`
- [ ] Environment variables set in deployment platform
- [ ] Supabase service role key is SECRET (never in frontend code)
- [ ] Stripe keys are production keys (not test mode)
- [ ] Sentry DSN configured (optional but recommended)

### ✅ Supabase Security
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Auth policies reviewed and tested
- [ ] Leaked Password Protection enabled in Supabase Auth settings
- [ ] Email templates customized (optional)
- [ ] Rate limiting configured for anonymous users

### ✅ Stripe Configuration
- [ ] Stripe price IDs added to `STRIPE_PRO_PRICE_ID` and `STRIPE_TEAM_PRICE_ID`
- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] Webhook secret set in Supabase Edge Functions
- [ ] Test checkout flow end-to-end

---

## Testing Checklist

### ✅ Core Functionality
- [ ] User signup works
- [ ] User login works
- [ ] Password reset works
- [ ] Anonymous video analysis (3 free) works
- [ ] Authenticated video analysis works
- [ ] Profile creation and editing works
- [ ] Bookmarking videos/insights works
- [ ] Video refresh with different profile works

### ✅ Payment Flow
- [ ] Checkout session creation works
- [ ] Stripe redirect works
- [ ] Subscription activation works
- [ ] Subscription limits enforced correctly
- [ ] Cancellation/downgrade works

### ✅ Mobile Testing
- [ ] Responsive design on mobile browsers
- [ ] Touch interactions work smoothly
- [ ] Forms are mobile-friendly
- [ ] iOS Safari tested
- [ ] Android Chrome tested

### ✅ Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

---

## Performance Checklist

### ✅ Build Optimization
- [ ] Production build completes without errors: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Bundle size is reasonable (check `dist/` folder)
- [ ] Code splitting configured correctly

### ✅ Loading Performance
- [ ] Initial page load < 3 seconds
- [ ] Video analysis completes in reasonable time
- [ ] No memory leaks during navigation

---

## Monitoring & Analytics

### ✅ Error Monitoring
- [ ] Sentry configured (if using)
- [ ] Error boundary tested
- [ ] Console logs reviewed for production

### ✅ Analytics (Optional)
- [ ] Google Analytics / Mixpanel / PostHog configured
- [ ] Key events tracked:
  - Video analysis completed
  - User signup
  - Subscription purchase
  - Profile created

---

## Deployment Steps

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   - Go to Vercel Dashboard
   - Import Git Repository
   - Select your GitHub repo

2. **Configure Build Settings**
   ```
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Set Environment Variables**
   - Add all `VITE_*` variables from `.env.example`
   - Click "Deploy"

4. **Configure Custom Domain** (Optional)
   - Add domain in Vercel settings
   - Update DNS records as instructed

### Option 2: Netlify

1. **Connect Repository**
   - New site from Git
   - Select your repo

2. **Configure Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Set Environment Variables**
   - Site settings → Environment variables
   - Add all `VITE_*` variables

4. **Deploy**

### Option 3: Cloudflare Pages

1. **Connect Repository**
   - Create application
   - Connect to Git

2. **Configure Build**
   ```
   Framework preset: Vite
   Build command: npm run build
   Build output directory: dist
   ```

3. **Set Environment Variables**
   - Settings → Environment variables
   - Add all `VITE_*` variables

---

## Post-Deployment Verification

### ✅ Live Site Checks
- [ ] Homepage loads correctly
- [ ] Auth flow works (signup/login)
- [ ] Can analyze a YouTube video (anonymous)
- [ ] Can analyze a YouTube video (authenticated)
- [ ] Stripe checkout works
- [ ] No console errors in production

### ✅ Supabase Edge Functions
- [ ] Check Edge Function logs for errors
- [ ] Verify function invocations are successful
- [ ] Monitor function latency

### ✅ Monitoring Setup
- [ ] Sentry receiving errors (if configured)
- [ ] Analytics tracking events (if configured)
- [ ] Stripe webhook receiving events

---

## Launch Day Checklist

### ✅ Pre-Launch (1 Hour Before)
- [ ] All environment variables double-checked
- [ ] Test user flow end-to-end one final time
- [ ] Verify Stripe is in LIVE mode (not test)
- [ ] Check Supabase rate limits are adequate
- [ ] Prepare support email/chat

### ✅ Launch
- [ ] Share landing page URL on Reddit/social media
- [ ] Monitor Sentry for errors
- [ ] Monitor Supabase database load
- [ ] Monitor user signups in real-time

### ✅ Post-Launch (24 Hours)
- [ ] Review error logs
- [ ] Check user feedback
- [ ] Monitor server costs
- [ ] Respond to support requests

---

## Common Issues & Solutions

### Build Fails
**Error**: "Missing environment variables"
**Solution**: Add all required `VITE_*` variables to deployment platform

### Videos Not Analyzing
**Error**: "AI gateway error"
**Solution**: Check `LOVABLE_API_KEY` is set correctly in Supabase Edge Function secrets

### Stripe Webhooks Failing
**Error**: "Unknown price ID"
**Solution**: Set `STRIPE_PRO_PRICE_ID` and `STRIPE_TEAM_PRICE_ID` in Supabase secrets

### CORS Errors
**Error**: "Access-Control-Allow-Origin"
**Solution**: CORS is currently open (`*`). For production, update `_shared/cors.ts` with your domain

---

## Rollback Plan

If critical issues occur after deployment:

1. **Immediate**: Revert to previous deployment in platform dashboard
2. **Database**: Supabase data persists, no rollback needed
3. **Edge Functions**: Revert via Supabase CLI if needed
4. **Communication**: Notify users via social media/email

---

## Support Contacts

- **Supabase**: https://supabase.com/dashboard/support
- **Stripe**: https://dashboard.stripe.com/support
- **Sentry**: https://sentry.io/support/
- **Deployment Platform**: Check platform docs

---

## Success Metrics

Track these KPIs after launch:

- Daily Active Users (DAU)
- Video analyses per day
- Conversion rate (free → paid)
- Average session duration
- Error rate (< 1% target)
- API response time (< 2s target)

---

**Last Updated**: 2025-01-XX
**Version**: 1.0
**Status**: Ready for Production ✅
