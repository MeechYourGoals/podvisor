# iOS Configuration Checklist

Quick reference for iOS-specific setup before App Store submission.

## Pre-Deployment Configuration

### 1. Project Identity
- [ ] Bundle Identifier: `com.chravel.app`
- [ ] Display Name: `Chravel`
- [ ] Version: `1.0.0`
- [ ] Build Number: `1` (increment for each submission)
- [ ] Deployment Target: iOS 14.0 or later
- [ ] Devices: iPhone, iPad

### 2. Signing & Capabilities
- [ ] Apple Developer Team selected
- [ ] Automatic signing enabled (or manual certificates configured)
- [ ] Push Notifications capability (if using)
- [ ] Associated Domains (for deep linking): `applinks:chravel.com`
- [ ] Background Modes → Remote notifications (if using push)

### 3. Info.plist Permissions (Required)
Add to `ios/App/App/Info.plist`:

```xml
<!-- Camera -->
<key>NSCameraUsageDescription</key>
<string>Chravel needs camera access to capture trip photos and videos</string>

<!-- Photo Library -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Chravel needs photo library access to save and share trip memories</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Chravel needs permission to save photos to your library</string>

<!-- Location -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Chravel uses your location to provide location-based trip recommendations</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>Chravel uses your location to provide real-time trip updates</string>

<!-- Microphone (if using video/voice) -->
<key>NSMicrophoneUsageDescription</key>
<string>Chravel needs microphone access for voice notes and video recording</string>

<!-- Face ID (if using biometric auth) -->
<key>NSFaceIDUsageDescription</key>
<string>Chravel uses Face ID to securely authenticate your account</string>

<!-- Contacts (if using invite features) -->
<key>NSContactsUsageDescription</key>
<string>Chravel needs contacts access to help you invite trip participants</string>

<!-- Calendar (if syncing events) -->
<key>NSCalendarsUsageDescription</key>
<string>Chravel can sync trip events to your calendar</string>

<!-- App Transport Security -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <!-- Only add exceptions for specific domains if needed -->
</dict>

<!-- URL Schemes -->
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.chravel.app</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>chravel</string>
        </array>
    </dict>
</array>

<!-- User Tracking (ATT) -->
<key>NSUserTrackingUsageDescription</key>
<string>This identifier will be used to deliver personalized travel recommendations</string>
```

### 4. Build Settings
- [ ] Enable Bitcode: No
- [ ] Swift Language Version: Swift 5.0
- [ ] Optimization Level (Release): `-Os` (Fastest, Smallest)
- [ ] Strip Debug Symbols: Yes (Release)
- [ ] Strip Swift Symbols: Yes (Release)

### 5. App Icons
Place in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:
- [ ] 1024x1024 (App Store)
- [ ] 180x180 (iPhone)
- [ ] 167x167 (iPad Pro)
- [ ] 152x152 (iPad)
- [ ] 120x120 (iPhone)
- [ ] 87x87 (Notification)
- [ ] 80x80 (Spotlight)
- [ ] 76x76 (iPad)
- [ ] 60x60 (Spotlight)
- [ ] 58x58 (Settings)
- [ ] 40x40 (Spotlight)
- [ ] 29x29 (Settings)
- [ ] 20x20 (Notification)

### 6. Launch Screen
- [ ] Storyboard configured in `LaunchScreen.storyboard`
- [ ] Background color matches brand (#0f172a)
- [ ] Logo centered
- [ ] Supports all device sizes

### 7. CocoaPods Dependencies
Run after any changes:
```bash
cd ios/App
pod install
pod update
```

### 8. Xcode Warnings
- [ ] Zero warnings in Release build
- [ ] Zero analyzer issues
- [ ] Memory leaks resolved

### 9. Testing
- [ ] Test on iPhone SE (smallest screen)
- [ ] Test on iPhone 15 Pro Max (largest)
- [ ] Test on iPad
- [ ] Test on iOS 14.0 (minimum version)
- [ ] Test on latest iOS
- [ ] Test in light and dark mode
- [ ] Test offline functionality
- [ ] Test deep links
- [ ] Test push notifications

### 10. Performance
- [ ] App launches in < 2 seconds
- [ ] No frame drops during scrolling
- [ ] Memory usage < 150MB
- [ ] Battery usage optimized

## Build & Archive

### Build for Simulator
```bash
# From project root
npm run cap:open:ios

# In Xcode: Select simulator → Cmd+R
```

### Build for Device
```bash
# Connect device via USB
# In Xcode: Select your device → Cmd+R
```

### Create Archive
1. In Xcode: Product → Scheme → Edit Scheme
2. Set Run configuration to Release
3. Select "Any iOS Device" as target
4. Product → Archive
5. Wait for archive to complete

### Validate Archive
1. Window → Organizer → Archives
2. Select your archive
3. Click "Validate App"
4. Choose signing options
5. Fix any issues

### Upload to App Store
1. Click "Distribute App"
2. Select "App Store Connect"
3. Choose "Upload"
4. Select signing options
5. Click "Upload"
6. Wait for processing (15-60 min)

## Fastlane Automation (Optional)

### Setup
```bash
# Install fastlane
sudo gem install fastlane

# Initialize
cd ios
fastlane init
```

### Fastfile Example
```ruby
default_platform(:ios)

platform :ios do
  desc "Build and upload to TestFlight"
  lane :beta do
    increment_build_number
    build_app(scheme: "App")
    upload_to_testflight
  end
  
  desc "Submit to App Store"
  lane :release do
    increment_build_number
    build_app(scheme: "App")
    upload_to_app_store
  end
end
```

### Run
```bash
fastlane beta    # TestFlight
fastlane release # App Store
```

## Common Issues

### "Code signing is required"
**Fix:** Select your team in Xcode → Signing & Capabilities

### "No profiles for 'com.chravel.app' were found"
**Fix:** Enable automatic signing or create manual provisioning profile

### "Invalid Bundle Identifier"
**Fix:** Must match App Store Connect, use reverse domain (com.chravel.app)

### "Missing Info.plist key"
**Fix:** Add required permission descriptions to Info.plist

### "App Transport Security has blocked..."
**Fix:** Add domain to ATS exceptions or use HTTPS

### "This app could not be installed..."
**Fix:** Delete old app, clean build folder, rebuild

## App Store Connect Setup

### App Information
- [ ] Name: Chravel
- [ ] Bundle ID: com.chravel.app
- [ ] SKU: chravel-ios-001
- [ ] Primary Language: English (U.S.)
- [ ] Category: Travel
- [ ] Secondary Category: Productivity

### Pricing
- [ ] Free with in-app purchases

### Privacy
- [ ] Privacy Policy URL: https://chravel.com/privacy
- [ ] Privacy practices declared

### Age Rating
- [ ] Complete questionnaire (likely 4+)

### Version Information
- [ ] Screenshots (all device sizes)
- [ ] Description
- [ ] Keywords
- [ ] Support URL
- [ ] Marketing URL
- [ ] Release notes

### TestFlight
- [ ] Internal testing group
- [ ] External testing group
- [ ] Beta App Description
- [ ] Test information
- [ ] Contact email

## Final Checks Before Submit

- [ ] Tested on multiple devices
- [ ] No crashes
- [ ] All features working
- [ ] Offline mode working
- [ ] Performance optimized
- [ ] Privacy policy live
- [ ] Support contact working
- [ ] Screenshots uploaded
- [ ] Description finalized
- [ ] Keywords optimized
- [ ] Build validated
- [ ] Export compliance filled

## Post-Submission

- [ ] Monitor App Store Connect for review status
- [ ] Check email for any rejections
- [ ] Respond to reviews within 24-48 hours
- [ ] Plan update schedule
- [ ] Monitor crash reports
- [ ] Track analytics

---

**Ready to submit? Good luck! 🚀**

Review time: Typically 24-48 hours
Approval rate: ~95% (with proper preparation)
