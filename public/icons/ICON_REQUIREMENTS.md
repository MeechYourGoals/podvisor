# App Icon Requirements

## Required Icon Sizes

### iOS App Icons
Generate these sizes from a 1024x1024px master icon:
- **1024x1024** - App Store (required)
- **180x180** - iPhone App Icon (iOS 14+)
- **167x167** - iPad Pro App Icon
- **152x152** - iPad, iPad mini App Icon
- **120x120** - iPhone App Icon (older devices)
- **87x87** - iPhone Notification Icon
- **80x80** - iPad Spotlight Icon
- **76x76** - iPad App Icon
- **60x60** - iPhone Spotlight Icon
- **58x58** - iPhone Settings Icon
- **40x40** - iPad Spotlight Icon
- **29x29** - iPhone Settings Icon
- **20x20** - iPad Notification Icon

### Android Adaptive Icons
Android requires adaptive icons (foreground + background layers):
- **512x512** - Play Store listing (required)
- **192x192** - xxxhdpi
- **144x144** - xxhdpi  
- **96x96** - xhdpi
- **72x72** - hdpi
- **48x48** - mdpi

### PWA Icons
- **512x512** - PWA Splash & Install
- **384x384** - PWA 
- **192x192** - PWA Minimum
- **180x180** - Apple Touch Icon
- **152x152** - iPad Touch Icon
- **144x144** - Windows Tile
- **128x128** - Chrome Web Store
- **96x96** - Windows Small Tile
- **72x72** - iOS Spotlight
- **32x32** - Favicon
- **16x16** - Browser Tab Icon

## Design Guidelines

### iOS Guidelines
- Use a solid background color (no transparency)
- Fill the entire icon area (no padding)
- Avoid text unless it's part of the brand
- Use simple, recognizable imagery
- Design for both light and dark modes
- iOS automatically adds rounded corners and shadow

### Android Guidelines  
- Use adaptive icon format (foreground + background)
- Foreground: Main icon graphic (transparent PNG)
- Background: Solid color or simple pattern
- Safe zone: Keep important elements in center 66%
- Android applies various shapes (circle, square, rounded square)

### Branding Recommendations
For Chravel specifically:
- Primary color: Indigo (#4f46e5) or Slate (#0f172a)
- Icon style: Modern, minimal, travel-oriented
- Symbol ideas: Stylized compass, location pin with collaboration rings, abstract route/path
- Ensure high contrast for visibility on all backgrounds

## Icon Generation Tools

### Recommended Services
1. **Figma Export Kit** (manual but precise)
2. **App Icon Generator** - https://www.appicon.co
3. **Capacitor Assets** - `npm install -g @capacitor/assets`
4. **Icon Kitchen** - https://icon.kitchen

### Using Capacitor Assets (Recommended)
```bash
# Install globally
npm install -g @capacitor/assets

# Place your 1024x1024px icon as:
# - resources/icon.png (for app icon)
# - resources/splash.png (for splash screen)

# Generate all required assets
npx capacitor-assets generate
```

## Current Status
⚠️ **REQUIRED**: Generate and place icon files in this directory with the following names:
- icon-16x16.png
- icon-32x32.png
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-167x167.png
- icon-180x180.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

These will be automatically used by the PWA manifest and Capacitor will sync them to native projects.
