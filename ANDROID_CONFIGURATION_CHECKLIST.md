# Android Configuration Checklist

Quick reference for Android-specific setup before Google Play Store submission.

## Pre-Deployment Configuration

### 1. App Identity
Edit `android/app/build.gradle`:

```gradle
android {
    namespace "com.chravel.app"
    compileSdk 34
    
    defaultConfig {
        applicationId "com.chravel.app"  // MUST be unique
        minSdk 24  // Android 7.0+ (Nougat)
        targetSdk 34  // Android 14
        versionCode 1  // Increment for EVERY release
        versionName "1.0.0"  // User-facing version
    }
}
```

**Checklist:**
- [ ] applicationId: `com.chravel.app`
- [ ] minSdk: 24 (covers 95%+ of devices)
- [ ] targetSdk: 34 (latest)
- [ ] versionCode: 1 (integer, auto-increment)
- [ ] versionName: "1.0.0" (semantic versioning)

### 2. App Name & Metadata
Edit `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">Chravel</string>
    <string name="title_activity_main">Chravel</string>
    <string name="package_name">com.chravel.app</string>
    <string name="custom_url_scheme">chravel</string>
</resources>
```

### 3. Permissions
Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- REQUIRED Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- OPTIONAL Permissions (add only if needed) -->
    
    <!-- Camera -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
    
    <!-- Photos/Media (Android 13+) -->
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    
    <!-- Legacy Storage (Android 12 and below) -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
                     android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
                     android:maxSdkVersion="28" />
    
    <!-- Location -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />
    
    <!-- Audio -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    
    <!-- Contacts (if using invite features) -->
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    
    <!-- Vibration/Haptics -->
    <uses-permission android:name="android.permission.VIBRATE" />
    
    <!-- Notifications (Android 13+) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <!-- Background Location (if needed) -->
    <!-- <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" /> -->
    
    <application
        android:label="Chravel"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:theme="@style/AppTheme"
        android:allowBackup="false"
        android:supportsRtl="true"
        android:usesCleartextTraffic="false"
        android:requestLegacyExternalStorage="false">
        
        <!-- Main Activity -->
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:label="@string/app_name"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <!-- Deep Links -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https"
                      android:host="chravel.com" />
            </intent-filter>
            
            <!-- Custom URL Scheme -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="chravel" />
            </intent-filter>
        </activity>
        
        <!-- Provider for File Sharing -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>
```

### 4. File Provider Configuration
Create `android/app/src/main/res/xml/file_paths.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths>
    <external-path name="external_files" path="." />
    <cache-path name="cache" path="." />
    <files-path name="files" path="." />
</paths>
```

### 5. ProGuard Rules
Edit `android/app/proguard-rules.pro`:

```proguard
# Capacitor
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * {
    @com.getcapacitor.annotation.PermissionCallback <methods>;
}

# Supabase
-keep class io.supabase.** { *; }
-keep interface io.supabase.** { *; }

# Kotlin
-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**

# Gson
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }
```

### 6. App Icons
Place adaptive icons in:
- `android/app/src/main/res/mipmap-hdpi/`
- `android/app/src/main/res/mipmap-mdpi/`
- `android/app/src/main/res/mipmap-xhdpi/`
- `android/app/src/main/res/mipmap-xxhdpi/`
- `android/app/src/main/res/mipmap-xxxhdpi/`

**Required files per directory:**
- [ ] ic_launcher.png (legacy icon)
- [ ] ic_launcher_round.png (circular icon)
- [ ] ic_launcher_foreground.png (adaptive foreground)
- [ ] ic_launcher_background.png (adaptive background)

**OR** use vector drawables in `drawable/`:
- [ ] ic_launcher_background.xml
- [ ] ic_launcher_foreground.xml

### 7. Splash Screen (Android 12+)
Edit `android/app/src/main/res/values/styles.xml`:

```xml
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
    </style>
    
    <style name="AppTheme.NoActionBarLaunch" parent="AppTheme">
        <item name="android:windowBackground">@drawable/splash</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
        <item name="android:windowIsTranslucent">false</item>
        
        <!-- Android 12+ Splash Screen API -->
        <item name="android:windowSplashScreenBackground">@color/splash_background</item>
        <item name="android:windowSplashScreenAnimatedIcon">@drawable/ic_launcher_foreground</item>
        <item name="android:windowSplashScreenIconBackgroundColor">@color/splash_background</item>
    </style>
</resources>
```

Edit `android/app/src/main/res/values/colors.xml`:

```xml
<resources>
    <color name="colorPrimary">#4f46e5</color>
    <color name="colorPrimaryDark">#0f172a</color>
    <color name="colorAccent">#4f46e5</color>
    <color name="splash_background">#0f172a</color>
</resources>
```

### 8. Network Security Config
Create `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    
    <!-- Debug only: Allow localhost -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
</network-security-config>
```

Add to `AndroidManifest.xml`:
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

### 9. Gradle Configuration

Edit `android/build.gradle`:
```gradle
buildscript {
    ext.kotlin_version = '1.9.0'
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.0'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
```

Edit `android/gradle.properties`:
```properties
android.useAndroidX=true
android.enableJetifier=true
android.defaults.buildfeatures.buildconfig=true
android.nonTransitiveRClass=false

# Increase memory for build
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.parallel=true
org.gradle.caching=true
```

### 10. Signing Configuration

Create `android/key.properties` (DO NOT commit):
```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=chravel-upload
storeFile=chravel-upload-key.keystore
```

Edit `android/app/build.gradle`:
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...
    
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
        }
    }
}
```

## Generate Signing Key

### Create Upload Keystore
```bash
cd android/app

# Generate keystore
keytool -genkey -v -keystore chravel-upload-key.keystore \
  -alias chravel-upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# You'll be prompted for:
# - Keystore password (SAVE THIS!)
# - Key password (can be same as keystore)
# - Name, Organization, City, State, Country
```

**CRITICAL:** Store these securely:
- Keystore file: `chravel-upload-key.keystore`
- Keystore password
- Key alias: `chravel-upload`
- Key password

**Add to `.gitignore`:**
```
android/key.properties
android/app/*.keystore
android/app/*.jks
```

## Build Release APK/AAB

### Build App Bundle (AAB) - Recommended
```bash
cd android

# Clean previous builds
./gradlew clean

# Build release bundle
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### Build APK (for testing)
```bash
# Build release APK
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Verify Build
```bash
# Check AAB contents
bundletool build-apks --bundle=app-release.aab --output=app.apks

# Install on connected device
bundletool install-apks --apks=app.apks

# Or install APK directly
adb install app-release.apk
```

## Testing Checklist

### Device Testing
- [ ] Test on Android 7.0 (API 24) - minimum version
- [ ] Test on Android 14 (API 34) - latest
- [ ] Test on Samsung device (One UI)
- [ ] Test on Google Pixel (stock Android)
- [ ] Test on budget device (low specs)
- [ ] Test on tablet (different form factor)

### Functionality Testing
- [ ] App launches correctly
- [ ] Splash screen displays
- [ ] Deep links work (chravel://)
- [ ] Camera works
- [ ] Photo picker works
- [ ] Location permissions work
- [ ] Push notifications work
- [ ] Offline mode works
- [ ] Network changes handled
- [ ] Keyboard resizes content
- [ ] Back button behaves correctly
- [ ] App survives rotation
- [ ] Background/foreground transitions

### Performance Testing
- [ ] Launch time < 3 seconds
- [ ] No ANR (App Not Responding) errors
- [ ] Memory usage < 200MB
- [ ] No memory leaks
- [ ] Battery usage optimized
- [ ] APK/AAB size < 50MB

## Google Play Console Setup

### 1. Create App
1. Go to https://play.google.com/console
2. Click **Create app**
3. Fill in:
   - [ ] App name: `Chravel`
   - [ ] Default language: English (United States)
   - [ ] App or game: App
   - [ ] Free or paid: Free

### 2. Store Listing

**App Details:**
```
App name: Chravel
Short description (80 chars):
AI-powered collaborative travel and event management

Full description (4000 chars):
[See APP_STORE_DEPLOYMENT_GUIDE.md for full description]
```

**Graphics:**
- [ ] App icon: 512x512 PNG
- [ ] Feature graphic: 1024x500 PNG (required)
- [ ] Phone screenshots: 2-8 (1080x1920 or 16:9)
- [ ] Tablet screenshots: 1-8 (optional but recommended)
- [ ] Promo video: YouTube URL (optional)

**Categorization:**
- [ ] App category: Travel & Local
- [ ] Tags: travel, planning, group, collaboration

**Contact Details:**
- [ ] Email: support@chravel.com
- [ ] Phone: Optional
- [ ] Website: https://chravel.com
- [ ] Privacy Policy: https://chravel.com/privacy

### 3. Data Safety

Complete questionnaire:
- [ ] Data collection practices
- [ ] Data sharing with third parties
- [ ] Security practices (encryption)
- [ ] Data deletion policy

### 4. App Content

- [ ] Privacy Policy: https://chravel.com/privacy
- [ ] Ads: Does your app contain ads? No
- [ ] Content rating: Complete questionnaire
- [ ] Target audience: 18+
- [ ] News app: No
- [ ] COVID-19 contact tracing: No
- [ ] Data safety: Complete form

### 5. Select Countries
- [ ] All countries (or select specific territories)
- [ ] Primary country: United States

### 6. Create Release

**Internal Testing Track:**
1. Create internal testing release
2. Upload AAB
3. Add release name: `1.0.0 (Build 1)`
4. Add release notes
5. Save and review
6. Start rollout

**Production Release:**
1. Production → Create new release
2. Upload AAB: `app-release.aab`
3. Release name: `1.0.0 (Build 1)`
4. Release notes:
```
Welcome to Chravel 1.0! 🎉

• Collaborative trip planning
• AI-powered recommendations
• Real-time group chat
• Smart budget tracking
• Interactive maps
• Shared media albums
• Professional logistics tools

Start planning your next adventure!
```
5. Review and roll out

## Common Issues

### Build Failed - Java Version
```bash
# Check Java version
java -version

# Install Java 17
sudo apt install openjdk-17-jdk  # Linux
brew install openjdk@17          # macOS
```

### Build Failed - SDK Not Found
```bash
# Set ANDROID_HOME
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Install SDK
sdkmanager "platforms;android-34" "build-tools;34.0.0"
```

### Gradle Build Error
```bash
cd android
./gradlew clean
./gradlew build --refresh-dependencies
```

### APK Too Large
- Enable ProGuard/R8 minification
- Remove unused resources
- Optimize images (WebP)
- Use App Bundle instead of APK

### App Not Signed
- Verify `key.properties` exists
- Check keystore password
- Ensure keystore file path is correct

### Deep Links Not Working
- Verify AndroidManifest intent-filters
- Add `autoVerify="true"` for app links
- Create `.well-known/assetlinks.json` on domain

## Post-Submission

### Monitor Release
- [ ] Check Play Console for review status
- [ ] Monitor crash reports (Play Console)
- [ ] Track ANR rates (< 0.5% target)
- [ ] Monitor battery usage reports
- [ ] Review user feedback

### Update Strategy
```bash
# Increment version for each release
# android/app/build.gradle:
versionCode 2  // Was 1
versionName "1.0.1"

# Build and upload
./gradlew bundleRelease
```

### Rollout Strategy
- [ ] Start with 10% rollout
- [ ] Monitor for 24 hours
- [ ] Increase to 50% if stable
- [ ] Full rollout after 48 hours

## Final Checklist

- [ ] App name: Chravel
- [ ] Package name: com.chravel.app
- [ ] Version code: 1
- [ ] Version name: 1.0.0
- [ ] Min SDK: 24
- [ ] Target SDK: 34
- [ ] Keystore generated and secured
- [ ] AAB signed and built
- [ ] Tested on multiple devices
- [ ] All permissions justified
- [ ] ProGuard rules configured
- [ ] Store listing complete
- [ ] Screenshots uploaded
- [ ] Privacy policy live
- [ ] Data safety form complete
- [ ] Release notes written

## Resources

- [Android Developer Guide](https://developer.android.com/guide)
- [Play Console Help](https://support.google.com/googleplay/android-developer)
- [Capacitor Android](https://capacitorjs.com/docs/android)
- [Material Design](https://material.io/design)

---

**Ready to submit? Good luck! 🚀**

Review time: 1-3 days
Approval rate: ~98% (with proper configuration)
