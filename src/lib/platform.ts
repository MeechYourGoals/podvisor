/**
 * Platform detection and native capabilities for iOS and Android
 * Provides utilities to detect platform and enable platform-specific features
 */

import { Capacitor } from '@capacitor/core';

/**
 * Platform Types
 */
export type PlatformType = 'ios' | 'android' | 'web';

/**
 * Check if running in native mobile app
 */
export const isNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if running on iOS
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * Check if running on Android  
 */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Check if running in web browser
 */
export const isWeb = (): boolean => {
  return Capacitor.getPlatform() === 'web';
};

/**
 * Get current platform
 */
export const getPlatform = (): PlatformType => {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  return 'web';
};

/**
 * Check if a specific plugin is available
 */
export const isPluginAvailable = (pluginName: string): boolean => {
  return Capacitor.isPluginAvailable(pluginName);
};

/**
 * Platform-specific CSS classes for conditional styling
 */
export const getPlatformClasses = (): string => {
  const classes: string[] = [];
  
  if (isNative()) classes.push('native-app');
  if (isIOS()) classes.push('ios-platform');
  if (isAndroid()) classes.push('android-platform');
  if (isWeb()) classes.push('web-platform');
  
  return classes.join(' ');
};

/**
 * Safe area insets for iOS notch/home indicator
 * Returns CSS env() variables for safe areas
 */
export const getSafeAreaInsets = () => {
  return {
    top: 'env(safe-area-inset-top, 0px)',
    right: 'env(safe-area-inset-right, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    left: 'env(safe-area-inset-left, 0px)',
  };
};

/**
 * Check if device supports biometric authentication
 */
export const supportsBiometrics = async (): Promise<boolean> => {
  if (!isNative()) return false;
  
  try {
    // Note: Install @capacitor-community/biometric if needed
    return false; // Placeholder - implement when biometric plugin added
  } catch {
    return false;
  }
};

/**
 * Check if device supports camera
 */
export const supportsCamera = (): boolean => {
  return isPluginAvailable('Camera');
};

/**
 * Check if device supports geolocation
 */
export const supportsGeolocation = (): boolean => {
  return isPluginAvailable('Geolocation');
};

/**
 * Check if device supports push notifications
 */
export const supportsPushNotifications = (): boolean => {
  return isPluginAvailable('PushNotifications');
};

/**
 * Check if device supports haptic feedback
 */
export const supportsHaptics = (): boolean => {
  return isPluginAvailable('Haptics');
};

/**
 * Get platform-specific share options
 */
export const canShare = async (): Promise<boolean> => {
  if (!isPluginAvailable('Share')) return false;
  
  try {
    const { Share } = await import('@capacitor/share');
    const result = await Share.canShare();
    return result.value;
  } catch {
    return false;
  }
};

/**
 * Platform-specific navigation bar behavior
 */
export const configureNavigationBar = async (color: string = '#0f172a') => {
  if (isAndroid() && isPluginAvailable('StatusBar')) {
    try {
      const { StatusBar } = await import('@capacitor/status-bar');
      await StatusBar.setBackgroundColor({ color });
    } catch (error) {
      console.warn('Failed to configure navigation bar:', error);
    }
  }
};

/**
 * Show/hide status bar
 */
export const setStatusBarVisibility = async (visible: boolean) => {
  if (!isPluginAvailable('StatusBar')) return;
  
  try {
    const { StatusBar } = await import('@capacitor/status-bar');
    if (visible) {
      await StatusBar.show();
    } else {
      await StatusBar.hide();
    }
  } catch (error) {
    console.warn('Failed to set status bar visibility:', error);
  }
};

/**
 * Platform-specific keyboard behavior
 */
export const configureKeyboard = async () => {
  if (!isPluginAvailable('Keyboard')) return;
  
  try {
    const { Keyboard } = await import('@capacitor/keyboard');
    
    // iOS-specific: Scroll to input when keyboard opens
    if (isIOS()) {
      Keyboard.setScroll({ isDisabled: false });
    }
    
    // Android-specific: Resize content when keyboard opens
    if (isAndroid()) {
      Keyboard.setResizeMode({ mode: 'native' });
    }
  } catch (error) {
    console.warn('Failed to configure keyboard:', error);
  }
};

/**
 * Get app version from native build
 */
export const getAppVersion = async (): Promise<string> => {
  if (!isPluginAvailable('App')) return 'web';
  
  try {
    const { App } = await import('@capacitor/app');
    const info = await App.getInfo();
    return info.version;
  } catch {
    return 'unknown';
  }
};

/**
 * Get app build number
 */
export const getBuildNumber = async (): Promise<string> => {
  if (!isPluginAvailable('App')) return 'web';
  
  try {
    const { App } = await import('@capacitor/app');
    const info = await App.getInfo();
    return info.build;
  } catch {
    return 'unknown';
  }
};

/**
 * Check network connectivity status
 */
export const getNetworkStatus = async () => {
  if (!isPluginAvailable('Network')) {
    return { connected: navigator.onLine, connectionType: 'unknown' };
  }
  
  try {
    const { Network } = await import('@capacitor/network');
    return await Network.getStatus();
  } catch {
    return { connected: navigator.onLine, connectionType: 'unknown' };
  }
};

/**
 * Listen to network status changes
 */
export const addNetworkListener = async (
  callback: (status: { connected: boolean; connectionType: string }) => void
) => {
  if (!isPluginAvailable('Network')) {
    window.addEventListener('online', () => callback({ connected: true, connectionType: 'unknown' }));
    window.addEventListener('offline', () => callback({ connected: false, connectionType: 'none' }));
    return;
  }
  
  try {
    const { Network } = await import('@capacitor/network');
    await Network.addListener('networkStatusChange', callback);
  } catch (error) {
    console.warn('Failed to add network listener:', error);
  }
};

/**
 * Platform initialization - call this in App.tsx on mount
 */
export const initializePlatform = async () => {
  console.log('Platform:', getPlatform());
  console.log('Native:', isNative());
  
  if (isNative()) {
    await configureNavigationBar('#0f172a');
    await configureKeyboard();
    
    // Log available plugins for debugging
    console.log('Available plugins:', {
      camera: supportsCamera(),
      geolocation: supportsGeolocation(),
      pushNotifications: supportsPushNotifications(),
      haptics: supportsHaptics(),
    });
  }
  
  // Add platform classes to body for CSS targeting
  document.body.className = `${document.body.className} ${getPlatformClasses()}`.trim();
};

export default {
  isNative,
  isIOS,
  isAndroid,
  isWeb,
  getPlatform,
  getPlatformClasses,
  getSafeAreaInsets,
  supportsCamera,
  supportsGeolocation,
  supportsPushNotifications,
  supportsHaptics,
  canShare,
  getAppVersion,
  getBuildNumber,
  getNetworkStatus,
  addNetworkListener,
  initializePlatform,
};
