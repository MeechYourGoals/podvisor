# Splash Screen Requirements

## iOS Splash Screens (Launch Storyboard)

Modern iOS uses a single Launch Storyboard instead of static images. However, you need these assets:

### Required Assets
- **1024x1024** - App icon (automatically used in splash)
- iOS generates splash from icon + background color
- Background color set in capacitor.config.ts: `#0f172a`

### Legacy Launch Images (if needed)
If targeting very old devices, generate these:
- **2732x2732** - iPad Pro 12.9" (3rd gen)
- **2048x2732** - iPad Pro 12.9"
- **1668x2388** - iPad Pro 11"
- **1668x2224** - iPad Pro 10.5"
- **1536x2048** - iPad, iPad mini
- **1242x2688** - iPhone 11 Pro Max, XS Max
- **1125x2436** - iPhone 11 Pro, X, XS
- **828x1792** - iPhone 11, XR
- **1242x2208** - iPhone 8 Plus, 7 Plus, 6s Plus
- **750x1334** - iPhone SE, 8, 7, 6s
- **640x1136** - iPhone SE (1st gen)

## Android Splash Screens

Android uses a combination of splash screen drawable and background color.

### Required Assets (9-patch or regular PNG)
Place in native Android project after `npx cap add android`:
- `android/app/src/main/res/drawable/splash.png` (2732x2732 recommended)
- Or individual densities:
  - `drawable-ldpi/splash.png` (200x320)
  - `drawable-mdpi/splash.png` (320x480)
  - `drawable-hdpi/splash.png` (480x800)
  - `drawable-xhdpi/splash.png` (720x1280)
  - `drawable-xxhdpi/splash.png` (960x1600)
  - `drawable-xxxhdpi/splash.png` (1280x1920)

## Design Guidelines

### Visual Requirements
- **Center focus**: Keep logo/icon in safe center zone (40% of screen)
- **Background**: Solid color matching app theme (#0f172a for Chravel)
- **Logo size**: Icon should be ~25-30% of screen height
- **Simplicity**: Minimal design - just logo and background
- **Consistency**: Match app's visual identity

### Branding for Chravel
```
Background: Slate #0f172a (dark) or White #ffffff (light)
Logo: Chravel icon + wordmark (optional)
Layout: Centered vertically and horizontally
Animation: Fade in (handled by Capacitor config)
Duration: 2000ms (configured in capacitor.config.ts)
```

### Platform-Specific Notes

**iOS:**
- Background color: Set in `capacitor.config.ts` → `plugins.SplashScreen.backgroundColor`
- Icon automatically centered
- Supports light/dark mode variants
- Shows during app initialization only

**Android:**
- Uses `splash.png` from drawable resources
- Background from `capacitor.config.ts` or `styles.xml`
- Android 12+ uses new splash screen API (icon + background)
- Shows on every cold start

## Configuration

Current splash settings in `capacitor.config.ts`:

```typescript
SplashScreen: {
  launchShowDuration: 2000,        // Show for 2 seconds
  launchAutoHide: true,             // Auto-hide after duration
  backgroundColor: '#0f172a',       // Dark slate background
  androidSplashResourceName: 'splash',
  androidScaleType: 'CENTER_CROP',
  showSpinner: false,               // No loading spinner
  iosSpinnerStyle: 'small',
  spinnerColor: '#4f46e5'          // Indigo spinner if enabled
}
```

## Quick Setup with Capacitor Assets

### Step 1: Create Master Asset
Create `resources/splash.png` at 2732x2732px:
- Center your logo in a 1000x1000px safe zone
- Fill background with #0f172a
- Export as PNG

### Step 2: Generate All Sizes
```bash
npm install -g @capacitor/assets
npx capacitor-assets generate --splash resources/splash.png
```

### Step 3: Sync to Native Projects
```bash
npm run cap:sync
```

## Current Status
⚠️ **ACTION REQUIRED**: 
1. Design splash screen (2732x2732px)
2. Place as `resources/splash.png`
3. Run `npx capacitor-assets generate`
4. Commit generated assets to version control

**Note**: iOS will use the app icon + background color as fallback until custom splash is provided.
