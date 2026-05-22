## Goal

Make Podvisor look and feel like a polished, native iOS app on phone (so it's indistinguishable inside an Expo WebView wrap for EAS Build), and like a refined, editorial-grade product on web. Keep dark theme + red accent, drop the "AI slop" gradient-mesh glassmorphism in favor of a tighter, premium iOS-dark system.

---

## 1. Design system reset (foundation)

Rewrite `src/index.css` and `tailwind.config.ts` tokens.

**Palette (iOS-dark inspired):**
- `--background`: near-black `0 0% 6%` (iOS Settings dark, not pure black so OLED transitions feel soft)
- `--card` / elevated surface: `0 0% 9%` with subtle border `0 0% 14%`
- `--popover` / sheets: `0 0% 11%`
- `--muted`: `0 0% 12%`, `--muted-foreground`: `0 0% 60%`
- `--border`: `0 0% 16%` (hairlines, not heavy)
- `--primary` (red accent): refine to `0 84% 60%` — slightly desaturated, less "alert-red", more brand
- Light mode: true off-white `0 0% 98%`, ink text `0 0% 9%`, hairline `0 0% 90%`

**Typography:**
- Body: SF Pro fallback stack → `-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, ...` (feels native on iOS WebView, falls back beautifully on web)
- Display: keep Space Grotesk but use sparingly (only hero + section H1)
- Tighter tracking on headings (`tracking-tight`), looser on labels/uppercase chips (`tracking-wide`)
- Define type scale tokens: `text-display`, `text-title-1/2/3`, `text-body`, `text-footnote`, `text-caption` matching iOS HIG

**Radii, spacing, elevation:**
- iOS uses `14px`–`18px` corner radii on cards/sheets → set `--radius: 0.875rem`
- Replace `glass-card` / `glow-primary` / `bg-gradient-mesh` with: hairline borders + subtle inner highlight (1px top white/4%) + `shadow-[0_1px_0_0_hsl(0_0%_100%/0.04)_inset]`
- Remove all `blur-3xl` mesh gradients from `HeroSection`, `Index`, etc.
- One single "brand glow" reserved for primary CTA hover, not ambient

**Motion:**
- Add framer-motion (already on web stack) for: sheet spring transitions, card press-scale (`whileTap={{ scale: 0.98 }}`), list item enter/exit
- Spring: `{ type: 'spring', stiffness: 380, damping: 32 }` (iOS-feel)
- Reduce default transitions from 300ms to 200ms

---

## 2. Mobile shell — iOS-native chrome

**Bottom tab bar** (`src/components/MobileTabBar.tsx`, new):
- 4 tabs: Home (analyze), Library (videos), Folders, Profile
- Fixed bottom, blur backdrop (`backdrop-blur-xl bg-background/80`), hairline top border, safe-area aware (`pb-[env(safe-area-inset-bottom)]`)
- SF Symbols-style icons from lucide (`Home`, `Library`, `FolderOpen`, `User`), 24px, label 10px, active = red
- Only visible `md:hidden`

**Header refactor** (`AppHeader.tsx`):
- Mobile: shrink to 44px, large-title pattern — H1 "Podvisor" appears in scroll area, collapses into compact header on scroll (use `useScroll` from framer-motion)
- Remove hamburger from header on mobile (settings becomes Profile tab)
- Desktop: keep current header but tighten — remove sheet/hamburger, use proper nav links

**Sheets for detail views** (mobile only):
- Use `vaul` Drawer (already installed) for `VideoDetail` on mobile instead of full-screen Dialog — gives the native iOS modal pull-down feel
- Snap points, rounded top corners, grab handle

**Page transitions:**
- Wrap routes in `AnimatePresence` with slide-from-right on push, fade on tab switch

**Safe areas & viewport:**
- Audit all `pb-safe`/`pt-safe` usage; ensure no content sits under tab bar (add `pb-20 md:pb-0` to scroll containers)
- Lock `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` in `index.html`
- Add `apple-mobile-web-app-capable` + `apple-mobile-web-app-status-bar-style=black-translucent` meta tags so it looks correct in Expo WebView and PWA home-screen install

---

## 3. Component-level polish (in-app screens)

**`HeroSection.tsx`:**
- Drop `text-7xl md:text-8xl` brand wordmark — too big, screams "landing page"
- On `/` (in-app), replace hero with a clean iOS-style greeting: "Hi — what do you want to learn from today?" + the analyze form right under it
- Reserve the giant brand hero for `/auth` and marketing sections only

**`AnalysisForm.tsx`:**
- Remove the `border-2` heavy card; use hairline card + slightly elevated surface
- Replace "YAYA" title with a quieter section label or remove entirely (rename submit button to "Analyze")
- Larger 56px-tall input with rounded-2xl (iOS text-field feel), inline submit icon button on the right
- Replace `Collapsible` with iOS-style disclosure row (chevron right, taps to push to profile screen on mobile, expands inline on desktop)
- Quota badge: move into a subtle inline footnote, not floating in the corner

**`VideosTable.tsx` → rename `VideoLibrary.tsx`:**
- Drop the "table" framing entirely. Mobile = swipeable list rows (left-swipe to favorite/delete using `react-swipeable-views` pattern via framer drag), desktop = clean grid of cards
- Each row: 16:9 thumbnail (rounded), title (2-line clamp), source · time, tag chips on second line, chevron-right at end (mobile)
- Search bar becomes sticky pill at top with iOS-style cancel button
- Replace 3-dot dropdown with iOS-style action sheet (vaul Drawer on mobile, dropdown on desktop)

**`VideoDetail.tsx`:**
- Mobile = bottom sheet with grab handle, hero thumbnail at top, insights as iOS-grouped-list sections (rounded section with hairline dividers between rows)
- Desktop = side panel or full route
- "Watch on YouTube" becomes prominent pill button, not buried in menu

**`InsightCard.tsx`:**
- Quieter — remove any colored backgrounds; use border + icon + title row + body. Bookmark icon top-right.

**Settings (`SettingsSidebar`, sections):**
- Restructure as iOS Settings.app: grouped lists with section headers (UPPERCASE 11px muted), rows with leading icon + label + trailing chevron/value
- Each subsection (Profile, Subscription, Bookmarks, etc.) becomes a pushed route on mobile, not stacked accordion

**`PricingCards.tsx` / `PricingSection.tsx`:**
- Reduce visual noise — single Pro card highlighted with thin red border, not gradients or glow
- Editorial: large pricing number, hairline divider, feature list with `Check` icon in muted color, `X` in faint

---

## 4. Marketing/web polish

**Landing layout (anonymous `/`):**
- Tighten hero — smaller wordmark, bigger value-prop headline, single CTA above fold
- Move feature badges into a single row of icon+label tiles
- `ComparisonSection` / `HowItWorks` / `Testimonials`: consistent section rhythm (96px vertical padding, max-w-4xl, section eyebrow + h2 + body pattern)
- Remove `bg-gradient-mesh` everywhere — replace with one subtle radial spot behind hero only
- Footer: add a real footer (links, copyright, social) — landing without footer reads "AI slop"

**Auth page polish:**
- Centered card, max-w-sm, social buttons with brand icons, tighter spacing

---

## 5. Empty / loading / error states

Currently inconsistent.
- One `EmptyState` component (icon, title, body, optional CTA) used in `VideoLibrary`, `BookmarksSection`, `Folders`, etc.
- Skeletons matched to actual row shape (thumbnail + 2 text bars), not generic blocks
- Toast restyle: bottom-center on mobile (iOS-style), top-right on desktop; rounded-2xl, hairline border
- Add global `ErrorBoundary` fallback UI (already exists — restyle it to match)

---

## 6. Expo WebView readiness

- Add `index.html` meta tags listed above
- Disable text-selection on UI chrome (`select-none` on tab bar, headers), allow on content
- Disable iOS tap-highlight: `* { -webkit-tap-highlight-color: transparent; }` (verify already in CSS, add if not)
- Disable iOS bounce on body, allow on scroll containers: `body { overscroll-behavior: none }`
- Disable pull-to-refresh: `html, body { overscroll-behavior-y: contain }`
- 44px minimum tap targets — audit all icon-only buttons (currently many are `h-9` which is 36px → bump to `h-11`)
- Test under viewports: 375×812 (iPhone SE/13 mini), 390×844 (iPhone 14/15), 430×932 (Pro Max)

---

## 7. File-level changes (manifest)

New files:
- `src/components/MobileTabBar.tsx`
- `src/components/EmptyState.tsx`
- `src/components/ui/grouped-list.tsx` (iOS-style grouped row primitive)
- `src/components/marketing/Footer.tsx`

Edited:
- `src/index.css` — token reset, motion vars, scroll/touch behavior
- `tailwind.config.ts` — radii, font stack, type scale, shadows
- `index.html` — viewport + apple meta tags
- `src/App.tsx` — wrap routes in `AnimatePresence`, mount `MobileTabBar`
- `src/components/AppHeader.tsx` — large-title behavior, drop mobile hamburger
- `src/pages/Index.tsx` — split in-app vs marketing rendering, drop mesh gradients
- `src/components/HeroSection.tsx` — contextual greeting vs brand hero
- `src/components/AnalysisForm.tsx`, `AudioUploadForm.tsx` — iOS field style, simplify card
- `src/components/VideosTable.tsx` — restructure as `VideoLibrary` list/grid, swipe actions
- `src/components/VideoDetail.tsx` — vaul sheet on mobile, grouped list for insights
- `src/components/InsightCard.tsx` — restyle
- `src/components/SettingsSidebar.tsx` + all `settings/*Section.tsx` — grouped-list pattern, pushed routes on mobile
- `src/components/marketing/*` — section rhythm, drop gradients, add footer
- `src/components/ui/button.tsx` — remove `hover:shadow-glow` from default, add `whileTap` scale via prop, bump default `h-10`→`h-11`
- `src/components/ui/card.tsx` — hairline border + subtle inset highlight default
- `src/components/ui/toast*.tsx` — placement + restyle
- `src/components/ErrorBoundary.tsx` — match new design

Removed/retired:
- `bg-gradient-mesh` utility (or kept and unused — remove from `tailwind.config.ts`)
- `.glass-card` heavy usage (kept only on specific marketing accents)
- Various ad-hoc `border-2` / `shadow-sm` per-component overrides

---

## 8. Order of execution (one PR, ~6 steps)

1. **Tokens & globals** — rewrite `index.css` + `tailwind.config.ts` + `index.html` meta. Visual baseline shifts everywhere.
2. **Primitives** — `button`, `card`, `toast`, new `grouped-list` + `EmptyState`. App-wide ripple.
3. **Mobile shell** — `MobileTabBar`, `AppHeader` large-title, route transitions, safe-area audit.
4. **In-app screens** — `Index`, `HeroSection`, `AnalysisForm`, `AudioUploadForm`, `VideoLibrary`, `VideoDetail`, `InsightCard`.
5. **Settings as iOS** — sidebar + all sections rebuilt with grouped-list.
6. **Marketing + footer** — landing rhythm, pricing restyle, footer.

After each step: visual smoke-test at 390×844 (iPhone) and 1440 (desktop) via the preview.

---

## What you'll see

- Mobile: hairline-bordered cards on near-black, bottom tab bar with red active state, bottom sheets that spring, large-title that shrinks on scroll, grouped settings — looks like a first-party iOS app inside the Expo WebView wrap
- Desktop: editorial dark theme, generous whitespace, one tasteful red accent, no purple-mesh AI-startup gradient, footer, polished pricing — looks like a real product
- Both: same design tokens, just different chrome
