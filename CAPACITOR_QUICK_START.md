# Capacitor Quick Start Guide

> **Get from code to app store in 5 steps**

## Prerequisites Check
- [ ] Node.js 18+ installed
- [ ] For iOS: macOS with Xcode 15+
- [ ] For Android: Android Studio installed
- [ ] Apple Developer Account ($99/year) - for iOS
- [ ] Google Play Console Account ($25 one-time) - for Android

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Generate App Assets
You need app icons and splash screens. Choose one method:

### Option A: Use Capacitor Assets (Recommended)
```bash
# Install tool
npm install -g @capacitor/assets

# Create your master assets:
# - resources/icon.png (1024x1024)
# - resources/splash.png (2732x2732)

# Generate all sizes
npx capacitor-assets generate
```

### Option B: Manual
- Follow `/public/icons/ICON_REQUIREMENTS.md`
- Follow `/public/splash/SPLASH_REQUIREMENTS.md`
- Place generated assets in respective folders

## Step 3: Build Web App
```bash
npm run build
```

## Step 4: Add Native Platforms

### For iOS (macOS only):
```bash
npm run cap:add:ios
npm run cap:sync:ios
npm run cap:open:ios
```

In Xcode:
1. Select your Team (Apple Developer Account)
2. Change Bundle Identifier to `com.chravel.app` (or your unique ID)
3. Update Display Name to `Chravel`
4. Follow `/workspace/IOS_CONFIGURATION_CHECKLIST.md`

### For Android:
```bash
npm run cap:add:android
npm run cap:sync:android
npm run cap:open:android
```

In Android Studio:
1. Update `android/app/build.gradle` - change `applicationId`
2. Follow `/workspace/ANDROID_CONFIGURATION_CHECKLIST.md`
3. Generate signing key (see guide)

## Step 5: Build & Test

### iOS Development Build
```bash
npm run ios:dev
```
- In Xcode: Select your device → Run (⌘R)
- Test on simulator: Select simulator → Run

### Android Development Build
```bash
npm run android:dev
```
- In Android Studio: Select your device → Run (▶)
- Or: `./gradlew installDebug` from `android/` folder

### Production Builds

**iOS Production:**
1. Xcode → Product → Archive
2. Validate Archive
3. Upload to App Store Connect
4. Complete listing in App Store Connect
5. Submit for review

**Android Production:**
```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```
1. Upload AAB to Play Console
2. Complete store listing
3. Submit for review

## Common Commands

```bash
# Development
npm run dev                    # Web dev server
npm run ios:dev               # iOS development build
npm run android:dev           # Android development build

# Building
npm run build                 # Production web build
npm run cap:sync              # Sync web to native (both platforms)
npm run cap:sync:ios          # Sync to iOS only
npm run cap:sync:android      # Sync to Android only

# Opening Native IDEs
npm run cap:open:ios          # Open Xcode
npm run cap:open:android      # Open Android Studio

# Production builds
npm run cap:build:ios         # Build for iOS
npm run cap:build:android     # Build for Android
```

## Project Structure

```
/workspace/
├── src/                      # React app source
├── public/                   # Static assets
│   ├── icons/               # App icons (you need to add these!)
│   ├── splash/              # Splash screens (you need to add these!)
│   └── manifest.json        # PWA manifest (✓ ready)
├── dist/                     # Built web app (after npm run build)
├── ios/                      # iOS project (after cap:add:ios)
│   └── App/
│       ├── App/
│       │   └── Info.plist   # iOS permissions & config
│       └── App.xcworkspace  # Open this in Xcode
├── android/                  # Android project (after cap:add:android)
│   └── app/
│       ├── src/main/
│       │   ├── AndroidManifest.xml  # Android permissions
│       │   └── res/         # Resources (icons, splash, etc)
│       └── build.gradle     # Android build config
├── capacitor.config.ts      # Capacitor configuration (✓ ready)
├── package.json             # Dependencies & scripts (✓ ready)
└── vite.config.ts           # Vite build config (✓ ready)
```

## Configuration Files (Already Set Up ✓)

### ✓ capacitor.config.ts
- App ID: `com.chravel.app` (change if you want unique ID)
- App Name: `Chravel`
- Splash screen settings
- Status bar settings
- Platform-specific configs

### ✓ package.json
- All Capacitor plugins installed
- Build scripts configured
- Dependencies ready

### ✓ manifest.json
- PWA metadata
- App name, description
- Icon references

### ✓ vite.config.ts
- Native build optimizations
- Environment variables
- Chunk splitting

## What You Still Need To Do

### Assets (Required)
- [ ] Create app icon (1024x1024px)
- [ ] Create splash screen (2732x2732px)
- [ ] Generate all icon sizes
- [ ] Take screenshots for stores

### App Store Connect (iOS)
- [ ] Create app listing
- [ ] Upload screenshots
- [ ] Write app description
- [ ] Set up privacy policy
- [ ] Configure pricing

### Google Play Console (Android)
- [ ] Create app listing
- [ ] Upload screenshots
- [ ] Write app description
- [ ] Complete data safety form
- [ ] Set up privacy policy

### Code Signing
**iOS:**
- [ ] Select your team in Xcode
- [ ] Configure signing & capabilities

**Android:**
- [ ] Generate upload keystore
- [ ] Configure `key.properties`
- [ ] Update build.gradle with signing config

## Detailed Guides

For complete step-by-step instructions:
- **Overview:** `/workspace/APP_STORE_DEPLOYMENT_GUIDE.md`
- **iOS Details:** `/workspace/IOS_CONFIGURATION_CHECKLIST.md`
- **Android Details:** `/workspace/ANDROID_CONFIGURATION_CHECKLIST.md`
- **Icon Guide:** `/workspace/public/icons/ICON_REQUIREMENTS.md`
- **Splash Guide:** `/workspace/public/splash/SPLASH_REQUIREMENTS.md`

## Troubleshooting

### "Command not found: cap"
```bash
npm install -g @capacitor/cli
# Or use: npx cap [command]
```

### "Module not found" errors
```bash
npm install
```

### iOS build fails
```bash
cd ios/App
pod install
pod update
```

### Android build fails
```bash
cd android
./gradlew clean
./gradlew build
```

### Environment variables not working
- Check `vite.config.ts` - defaults are set
- For native builds, environment variables are baked in at build time

## Next Steps

1. **Run locally:** `npm run dev`
2. **Generate assets:** Create icons and splash screens
3. **Add iOS:** `npm run cap:add:ios` (macOS only)
4. **Add Android:** `npm run cap:add:android`
5. **Configure native:** Follow checklist for each platform
6. **Build & test:** Test on real devices
7. **Submit:** Upload to App Store Connect / Play Console

## Support

- **Documentation:** See guides in `/workspace/`
- **Capacitor Docs:** https://capacitorjs.com/docs
- **Issues:** Check platform-specific checklists

---

**Ready to ship? Follow the detailed guides for each platform!** 🚀
