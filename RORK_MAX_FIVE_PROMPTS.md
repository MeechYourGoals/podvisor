# Rork Max: 5-Prompt SwiftUI Clone Specification

**App Name:** Podvisor (YAYA - Your AI YouTube Advisor)  
**Purpose:** AI-powered YouTube video and audio analysis platform with personalized insights  
**Target:** One-to-one feature parity with this React/TypeScript web app, rebuilt as native SwiftUI iOS

> **Note on Rork Max:** Rork Max lets you prompt iOS apps in natural language and generates Swift/SwiftUI code. With a 5-prompt trial, these prompts are designed to be comprehensive and self-contained. Adjust prompt syntax if Rork Max uses a different format (e.g., structured sections, code blocks, or templates). The prompts assume Rork Max can reference Supabase, call Edge Functions, and build full SwiftUI views.

---

## Architecture Summary (Reference for Prompts)

| Layer | Tech |
|-------|------|
| **Auth** | Supabase Auth (email/password, password reset) |
| **Backend** | Supabase (PostgreSQL, Edge Functions, Storage) |
| **AI** | Edge function `analyze-video` returns 10 universal + 10 personalized insights |
| **Design** | Dark mode default, red primary (#FF3333 / hsl 0 100% 50%), Space Grotesk-style typography, glass cards, gradient mesh |

---

## Prompt 1: Foundation, Auth & Design System

```
Build a SwiftUI iOS app called "Podvisor" with the following:

## Design System
- **Colors**: Primary red (hsl 0 100% 50%), dark mode default. Background ~8% lightness, card ~12%, muted ~16%. Use semantic colors: primary, secondary, muted, destructive.
- **Typography**: SF Pro for body, bold display font for "Podvisor" branding. Rounded corners (1rem / 16pt).
- **Components**: Cards with subtle borders, glass-style blur where appropriate, gradient mesh background (radial gradients: warm orange, cyan, pink at low opacity).
- **Safe areas**: Respect safeAreaInset for notch and home indicator.

## Navigation
- Tab-based or single main screen with hamburger menu opening a sheet for Settings.
- Sticky header with "Podvisor" logo (red) and "AI Content Analysis" subtitle. Hamburger opens Settings sheet.

## Authentication (Supabase)
- **Sign In**: Email + password. "Forgot password?" link.
- **Sign Up**: Email + password. Validation: min 8 chars, at least one uppercase, one lowercase, one number.
- **Password Reset**: Email field, "Send Reset Link" button.
- Use Supabase Swift SDK. Store session. If authenticated, show main app; else show auth screen.
- Auth screen: Centered card with tabs (Sign In | Sign Up | Reset). Sparkles icon, "YAYA" or "Podvisor" branding.

## Project Structure
- Use SwiftUI + Combine. Separate AuthView, MainView, SettingsView.
- Environment object or singleton for AuthState (user, loading, signIn, signUp, requestPasswordReset).
- No backend logic yet—just auth and shell. Prepare for: AnalysisFormView, VideosListView, VideoDetailView.
```

---

## Prompt 2: Analysis Flow, Video List & YouTube Integration

```
Extend the Podvisor SwiftUI app with:

## Analysis Form (Main Screen)
- Card with title "YAYA - Your AI YouTube Advisor", subtitle "Paste any YouTube URL to extract expert insights".
- TextField for YouTube URL. Validate: must contain youtube.com or youtu.be.
- "Use sample" button that pre-fills: https://www.youtube.com/watch?v=xguam0TKMw8 and triggers analysis.
- "Analyze Video" button. On tap: call Supabase Edge Function `analyze-video` with body `{ "videoUrl": "<url>" }`.
- Show loading state (spinner + "Analyzing..."). On success: store videoId, navigate to VideoDetail or refresh list.
- Anonymous support: allow 3 free analyses without sign-in (store in UserDefaults). Show badge "X/3 free".

## Videos List (Below Analysis Form)
- List of analyzed videos. Each row: thumbnail (img.youtube.com/vi/{video_id}/hqdefault.jpg), title, "X ago" date.
- Search bar to filter by title.
- "Favorites" toggle: show only favorited videos.
- Tap row → open VideoDetail sheet.
- Pull-to-refresh.
- Empty state: "No videos analyzed yet. Try analyzing a video above."
- For anonymous: show "Try Podvisor - No Signup Required" with badges "3 free analyses", "No credit card".

## Video Detail Sheet (Bottom sheet, ~90% height)
- Header: video title, badges (profile used, source).
- Tabs: "All Insights (N)" | "For You (M)".
- "All Insights" tab: list of insight cards (see InsightCard spec below).
- "For You" tab: personalized insights or empty state "Create a profile to unlock personalized insights."
- Actions: Refresh (re-analyze with profile), Watch (open YouTube URL), Bookmark, Export (JSON/CSV/Markdown).
- Loading skeletons while fetching.

## Insight Card
- Category badge (strategy, execution, mindset, technical, etc.) with color coding.
- Insight text. Impact X/10, Actionability X/10 pills.
- Copy and Bookmark buttons.
- Personalized insights: green left border, "For You" context label, action items list.

## Data Models
- Video: id, title, youtube_url, video_id, analyzed_at, profile_used, speakers, tags, is_favorite.
- Insight: id, insight_text, category, impact_score, actionability_score.
- PersonalizedInsight: id, insight_text, relevance_score, action_items, for_profile_context.

## Supabase
- Fetch videos from `videos` table, insights from `insights`, personalized from `personalized_insights`.
- Real-time subscription on `videos` for live updates.
```

---

## Prompt 3: Profiles, 10 Universal + 10 Personalized Insights, AI Logic

```
Extend Podvisor with Context Profiles and full insight logic:

## User Context Profiles
- Table: user_context_profiles (profile_name, category, role_description, experience_level, goals, challenges).
- Categories: business, sports, health_fitness, technology, personal_development, finance, entertainment, education, general.
- Experience: beginner, intermediate, advanced, expert.
- ProfileQuickSwitcher in header: dropdown to select profile or "Default/Global".
- Settings > Profile tab: create/edit profiles, set default. Profile form: name, category, role, experience, goals, challenges.

## Analysis with Profile
- When analyzing: pass `profileId` to `analyze-video` if user has selected a profile.
- For anonymous: optional text field "Tell us about yourself for personalized insights" → pass as `anonymousProfile` string.
- AI returns: 10 universal insights + 10 personalized insights (when profile provided).

## Insight Display
- Universal insights: ordered by impact_score desc. Show category, impact/actionability, expert_attribution if present.
- Personalized insights: relevance_score, for_profile_context, action_items as numbered list.
- Category colors: strategy=blue, execution=green, mindset=red, technical=orange, nutrition=pink, training=red.

## Refresh Analysis
- In VideoDetail: "Refresh" button. Dropdown to pick profile, then re-call analyze-video with existingVideoId, profileId, isRefresh: true.
- Update insights in place after refresh.

## Welcome Dialog
- On first login: optional welcome sheet explaining profiles and personalized insights.

## Subscription Awareness
- Free: 3 profiles, 10 videos/month. Pro: 10 profiles, unlimited audio.
- Show usage: "X/10 used" or "X/3 free" where relevant.
```

---

## Prompt 4: Bookmarks, Folders, Export & Settings

```
Extend Podvisor with full bookmarks and settings:

## Bookmark Folders
- Table: bookmark_folders (folder_name, description, color, sort_order, profile_id).
- Default folder "Saved Items" created on signup.
- Create folder: name, optional description, color picker. Associate with current profile or "Global".
- Folders ordered by sort_order. Show badge: "X videos", "Y insights".

## Bookmark Videos & Insights
- bookmarked_videos: user_id, video_id, folder_id. Many-to-many with folders via bookmarked_videos_folders.
- bookmarked_insights: user_id, insight_id, folder_id.
- BookmarkDialog: when bookmarking video/insight, show folder list with checkboxes. "Create New Folder" inline. Save to selected folders.

## Bookmarks Panel (Sheet)
- Tabs: Folders | Videos | Insights.
- Folders tab: list folders, create, delete (except Saved Items), export folder as Markdown.
- Videos tab: list bookmarked videos with thumbnail, title, notes. Tap to view, remove bookmark.
- Insights tab: list bookmarked insights with category, text, impact. Remove bookmark.
- Filter by profile (ProfileQuickSwitcher).

## Export
- Single video: JSON, CSV, or Markdown via Edge Function `export-video`.
- Folder: generate Markdown client-side with videos + insights, download/share.

## Settings Sidebar
- Tabs: Profile | Saved | Plan | Account.
- Profile: Default profile, Saved profiles (CRUD).
- Saved: Opens BookmarksPanel or inline bookmarks management.
- Plan: Subscription tier, upgrade CTA.
- Account: Display name, avatar, sign out, change password.

## Haptic Feedback
- Use UIImpactFeedbackGenerator for button taps (light), success (medium), errors (heavy).
- Use UINotificationFeedbackGenerator for success/warning/error toasts.
```

---

## Prompt 5: Polish, Sorting, Audio Upload, Deck Upload & iOS Native Features

```
Final Podvisor polish and iOS-native features:

## Sorting Options
- **Videos list**: Add sort picker: "Date (newest)" | "Date (oldest)" | "Title A–Z" | "Title Z–A".
- **Bookmarks (Videos/Insights)**: Same options. Persist preference in UserDefaults.
- **Folders**: Keep sort_order; allow drag-to-reorder and persist.

## Audio Upload
- File picker for audio (MP3, M4A, WAV, WebM, OGG, FLAC, AAC). Max 50MB.
- Upload to Supabase Storage `audio-uploads` or send base64 for anonymous.
- Call `analyze-video` with `audioUpload: { filename, storagePath or audioBase64 }`.
- Pro/Annual: unlimited. Free: 2/month. Anonymous: 1 free.
- Show badge "X/2 used" or "1/1 free" for anonymous.

## Deck Upload (Optional Enhancement)
- If time permits: allow PDF upload (pitch deck). Send to analyze-video or separate function for "startup-specific" insights.
- Otherwise: document as future enhancement.

## iOS Native Features
- **Haptics**: Light impact on list row tap, medium on bookmark, success on analysis complete, error on failure.
- **Widget**: Simple WidgetKit widget showing "Recent insights" or "Analyze count" for home screen. Optional.
- **Share Extension**: Share YouTube URLs from Safari/YouTube app into Podvisor.
- **App Icon & Launch Screen**: Podvisor branding, red accent.
- **Dark/Light**: Support both; default dark. Use system appearance or in-app toggle.

## Design Polish
- Skeleton loaders for lists and detail.
- Toast/snackbar for success/error (e.g., "Bookmarked!", "Analysis failed").
- Empty states with illustrations or icons.
- Accessibility: VoiceOver labels, Dynamic Type support, minimum touch targets 44pt.

## Edge Cases
- Offline: show cached data, queue analysis for retry.
- Rate limit / payment errors: show clear message with upgrade CTA.
- Invalid URL: validate before calling API, show inline error.
```

---

## Quick Reference: Key Specs

| Feature | Spec |
|--------|------|
| **10 Universal Insights** | AI extracts exactly 10. Categories: strategy, execution, mindset, technical, etc. Impact + Actionability 1–10. |
| **10 Personalized Insights** | When profile provided. Relevance score, action_items array, for_profile_context. |
| **Folders** | sort_order, profile_id (null = global), color, description. |
| **Bookmark to Folder** | Videos: many-to-many. Insights: single folder. |
| **Export** | Video: JSON/CSV/MD via API. Folder: Markdown client-side. |
| **Sort** | Videos/Bookmarks: date asc/desc, title A–Z/Z–A. Folders: sort_order. |
| **Anonymous** | 3 YouTube, 1 audio. SessionStorage/UserDefaults. |
| **Subscription** | Free: 3 profiles, 10 videos, 2 audio. Pro: 10 profiles, unlimited. |

---

## Supabase Configuration (For Reference)

- **Auth**: Email provider enabled. Leaked password protection recommended.
- **Tables**: videos, insights, personalized_insights, user_context_profiles, bookmark_folders, bookmarked_videos, bookmarked_insights, bookmarked_videos_folders, user_subscriptions.
- **Edge Functions**: analyze-video, export-video.
- **Storage**: audio-uploads bucket (private, 50MB, audio MIME types).

---

## Execution Order

1. **Prompt 1** → Auth + shell. Run, verify login/signup.
2. **Prompt 2** → Analysis + list + detail. Run, verify YouTube analysis.
3. **Prompt 3** → Profiles + insights logic. Run, verify 10+10 insights.
4. **Prompt 4** → Bookmarks + settings. Run, verify folder CRUD, export.
5. **Prompt 5** → Sorting, audio, haptics, widgets. Run, verify full parity.

After all five, you should have a SwiftUI clone with one-to-one feature parity. Use additional Rork Max credits for refinement (animations, edge cases, App Store assets).
