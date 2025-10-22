# Human Tasks Checklist - Chravel App Store Deployment

> **Simple checklist of what you need to do to deploy Chravel to iOS and Android**

All code is ready. This is your action list.

---

## ☑️ Phase 1: Local Setup (15 minutes)

### Install & Build
- [ ] Run `npm install` to install all dependencies
- [ ] Run `npm run build` to verify web app builds successfully
- [ ] Verify no errors in console output

---

## ☑️ Phase 2: Create App Assets (30-60 minutes)

### Design Master Assets
**App Icon (1024x1024px):**
- [ ] Design or commission app icon
- [ ] Use Chravel brand colors: #0f172a (slate) or #4f46e5 (indigo)
- [ ] Make it simple, recognizable, travel-themed
- [ ] Save as `resources/icon.png`

**Splash Screen (2732x2732px):**
- [ ] Design splash screen (logo + background)
- [ ] Keep logo centered in 40% safe zone
- [ ] Use matching brand colors
- [ ] Save as `resources/splash.png`

### Generate All Icon Sizes
```bash
npm install -g @capacitor/assets
npx capacitor-assets generate
```
- [ ] Run asset generator
- [ ] Verify icons created in `/public/icons/`
- [ ] Verify splash screens created

---

## ☑️ Phase 3: iOS Setup (macOS required, 1-2 hours)

### Prerequisites
- [ ] Have macOS computer
- [ ] Install Xcode 15+ from Mac App Store
- [ ] Install CocoaPods: `sudo gem install cocoapods`
- [ ] Sign up for Apple Developer account ($99/year)
- [ ] Wait for account approval (1-2 days)

### Add iOS Platform
```bash
npm run cap:add:ios
npm run cap:sync:ios
npm run cap:open:ios
```

### Configure in Xcode
- [ ] Select your Apple Developer Team
- [ ] Set Bundle Identifier (keep `com.chravel.app` or change to yours)
- [ ] Set Display Name: `Chravel`
- [ ] Set Version: `1.0.0`
- [ ] Set Build: `1`
- [ ] Enable "Automatically manage signing"

### Add Permissions to Info.plist
- [ ] Open `ios/App/App/Info.plist`
- [ ] Copy all permissions from `IOS_CONFIGURATION_CHECKLIST.md`
- [ ] Save file

### Test on Device
- [ ] Connect iPhone via USB
- [ ] Select your device in Xcode
- [ ] Click Run (⌘R)
- [ ] Test all features work
- [ ] Fix any issues

### Create Archive
- [ ] Select "Any iOS Device" in Xcode
- [ ] Product → Archive
- [ ] Wait for archive to complete
- [ ] Click "Validate App"
- [ ] Fix any validation errors
- [ ] Click "Distribute App" → Upload

---

## ☑️ Phase 4: Android Setup (1-2 hours)

### Prerequisites
- [ ] Install Android Studio (latest)
- [ ] Install Java JDK 17+
- [ ] Configure Android SDK via Android Studio

### Add Android Platform
```bash
npm run cap:add:android
npm run cap:sync:android
npm run cap:open:android
```

### Configure in Android Studio
- [ ] Open `android/app/build.gradle`
- [ ] Update `applicationId` to `com.chravel.app` (or your unique ID)
- [ ] Set `versionCode` to `1`
- [ ] Set `versionName` to `"1.0.0"`
- [ ] Save file

### Generate Signing Key
```bash
cd android/app
keytool -genkey -v -keystore chravel-upload-key.keystore \
  -alias chravel-upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```
- [ ] Run command
- [ ] Enter passwords (SAVE THESE!)
- [ ] Fill in organization details

### Configure Signing
- [ ] Create `android/key.properties` file
- [ ] Add keystore details (see `ANDROID_CONFIGURATION_CHECKLIST.md`)
- [ ] Update `android/app/build.gradle` with signing config
- [ ] Verify `key.properties` is in `.gitignore`

### Add Permissions
- [ ] Open `android/app/src/main/AndroidManifest.xml`
- [ ] Copy all permissions from `ANDROID_CONFIGURATION_CHECKLIST.md`
- [ ] Save file

### Build Release
```bash
cd android
./gradlew bundleRelease
```
- [ ] Run build command
- [ ] Verify AAB created: `android/app/build/outputs/bundle/release/app-release.aab`

### Test on Device
- [ ] Connect Android device via USB
- [ ] Enable Developer Mode on device
- [ ] In Android Studio: Run → Run 'app'
- [ ] Test all features work
- [ ] Fix any issues

---

## ☑️ Phase 5: App Store Connect (iOS, 2-3 hours)

### Create App Listing
- [ ] Go to https://appstoreconnect.apple.com
- [ ] Click "My Apps" → "+" → "New App"
- [ ] Fill in app details:
  - Platform: iOS
  - Name: Chravel
  - Bundle ID: com.chravel.app
  - SKU: chravel-ios-001

### App Information
- [ ] Category: Travel
- [ ] Age Rating: Complete questionnaire
- [ ] Privacy Policy: https://chravel.com/privacy (must be live!)
- [ ] Support URL: https://chravel.com/support

### Screenshots & Media
**Take Screenshots on:**
- [ ] iPhone 15 Pro Max (6.7" - 1290x2796)
- [ ] iPhone 8 Plus (5.5" - 1242x2208)
- [ ] iPad Pro 12.9" (2048x2732)

**Minimum Required:**
- [ ] 2 screenshots per device size
- [ ] Recommended: 6-8 screenshots showing key features

### App Description
- [ ] Write compelling app description (see template in `APP_STORE_DEPLOYMENT_GUIDE.md`)
- [ ] Add keywords for ASO
- [ ] Write "What's New" notes for version 1.0.0

### Submit for Review
- [ ] Select the uploaded build
- [ ] Answer export compliance questions
- [ ] Add advertising identifier info (if applicable)
- [ ] Click "Submit for Review"
- [ ] Wait 24-48 hours for review

---

## ☑️ Phase 6: Play Console (Android, 2-3 hours)

### Create App Listing
- [ ] Go to https://play.google.com/console
- [ ] Pay $25 one-time fee (if first time)
- [ ] Click "Create app"
- [ ] Fill in app details:
  - Name: Chravel
  - Default language: English
  - Free or paid: Free

### Store Listing
- [ ] App name: Chravel
- [ ] Short description (80 chars max)
- [ ] Full description (4000 chars max, see template)
- [ ] App icon: 512x512 PNG
- [ ] Feature graphic: 1024x500 PNG

### Screenshots & Media
**Phone Screenshots:**
- [ ] Minimum 2 screenshots (1080x1920 or 16:9)
- [ ] Recommended: 6-8 screenshots

**Tablet Screenshots (optional):**
- [ ] 7-inch tablet: 1024x1600
- [ ] 10-inch tablet: 1920x1200

### Categorization
- [ ] App category: Travel & Local
- [ ] Tags: travel, planning, collaboration
- [ ] Content rating: Complete questionnaire
- [ ] Target audience: 18+

### Data Safety
- [ ] Complete data safety questionnaire
- [ ] Declare what data you collect
- [ ] Explain how data is used
- [ ] Describe security practices

### Contact Details
- [ ] Email: support@chravel.com
- [ ] Phone: (optional)
- [ ] Website: https://chravel.com
- [ ] Privacy Policy: https://chravel.com/privacy (must be live!)

### Create Release
- [ ] Go to Production → Releases
- [ ] Click "Create new release"
- [ ] Upload `app-release.aab`
- [ ] Add release name: "1.0.0 (Build 1)"
- [ ] Add release notes (see template)
- [ ] Review and publish
- [ ] Wait 1-3 days for review

---

## ☑️ Phase 7: Pre-Submission Verification

### Code Quality
- [ ] No console errors in production build
- [ ] All TypeScript errors resolved
- [ ] All features tested on real devices
- [ ] Offline functionality works
- [ ] Network switching works

### Legal Pages (MUST BE LIVE)
- [ ] Privacy Policy URL accessible: https://chravel.com/privacy
- [ ] Terms of Service URL accessible: https://chravel.com/terms
- [ ] Support email working: support@chravel.com

### Assets Complete
- [ ] All app icons generated
- [ ] All splash screens generated
- [ ] iOS screenshots taken (3 sizes minimum)
- [ ] Android screenshots taken (2 minimum)
- [ ] Feature graphic created (Android)

### Configuration Verified
- [ ] Bundle IDs correct and unique
- [ ] Version numbers set (1.0.0, build 1)
- [ ] Signing configured (both platforms)
- [ ] All permissions documented with descriptions

---

## ☑️ Phase 8: Post-Submission

### Monitor Review Status
- [ ] Check email for approval/rejection
- [ ] Log into App Store Connect daily
- [ ] Log into Play Console daily
- [ ] Respond to any reviewer questions within 24 hours

### If Approved
- [ ] Set app to "Available"
- [ ] Announce launch on social media
- [ ] Monitor crash reports
- [ ] Respond to user reviews
- [ ] Track download numbers

### If Rejected
- [ ] Read rejection reason carefully
- [ ] Fix the specific issue mentioned
- [ ] Update documentation if needed
- [ ] Resubmit with explanation

---

## 📊 Estimated Time Investment

| Task | Time |
|------|------|
| Local setup | 15 min |
| Asset creation | 30-60 min |
| iOS setup | 1-2 hours |
| Android setup | 1-2 hours |
| iOS store listing | 2-3 hours |
| Android store listing | 2-3 hours |
| **Total** | **8-11 hours** |

**Review Times:**
- iOS: 24-48 hours
- Android: 1-3 days

---

## 🆘 If You Get Stuck

### Documentation
- Quick Start: `CAPACITOR_QUICK_START.md`
- iOS Help: `IOS_CONFIGURATION_CHECKLIST.md`
- Android Help: `ANDROID_CONFIGURATION_CHECKLIST.md`
- Full Guide: `APP_STORE_DEPLOYMENT_GUIDE.md`

### Common Issues
1. **Build fails:** Run `npm install` again
2. **Xcode errors:** Clean build folder (⌘⇧K)
3. **Android Gradle errors:** `./gradlew clean`
4. **Signing errors:** Verify passwords and file paths
5. **Permissions denied:** Check Info.plist or AndroidManifest

### Support Resources
- Capacitor Discord: https://discord.gg/UPYYRhtyzp
- Ionic Forum: https://forum.ionicframework.com/
- Stack Overflow: [capacitor] tag

---

## ✅ Final Pre-Submission Checklist

Before clicking "Submit for Review":

**iOS:**
- [ ] Archive validated successfully
- [ ] Build uploaded to App Store Connect
- [ ] All screenshots uploaded
- [ ] Privacy policy URL works
- [ ] Support contact working

**Android:**
- [ ] AAB signed and built
- [ ] Uploaded to Play Console
- [ ] All screenshots uploaded
- [ ] Data safety form complete
- [ ] Privacy policy URL works

**Both:**
- [ ] App descriptions finalized
- [ ] Keywords/tags optimized
- [ ] Release notes written
- [ ] Age rating completed
- [ ] Tested on real devices

---

## 🎉 You're Ready to Launch!

**All code is complete.** Just follow this checklist step-by-step.

**Start now:** 
1. `npm install`
2. Create your app icon and splash screen
3. Follow the phases above

**Questions?** Check the detailed guides in the workspace root.

**Good luck! 🚀**

---

*First deployment: 8-11 hours*  
*Future updates: < 1 hour*
