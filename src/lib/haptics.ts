/**
 * Haptic feedback utilities for native iOS interactions
 * Provides tactile feedback for button presses and key actions
 */

export const hapticLight = async () => {
  if (window.Capacitor?.isNativePlatform()) {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available
    }
  }
};

export const hapticMedium = async () => {
  if (window.Capacitor?.isNativePlatform()) {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Haptics not available
    }
  }
};

export const hapticHeavy = async () => {
  if (window.Capacitor?.isNativePlatform()) {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      // Haptics not available
    }
  }
};

export const hapticSuccess = async () => {
  if (window.Capacitor?.isNativePlatform()) {
    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      // Haptics not available
    }
  }
};

export const hapticWarning = async () => {
  if (window.Capacitor?.isNativePlatform()) {
    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      await Haptics.notification({ type: NotificationType.Warning });
    } catch {
      // Haptics not available
    }
  }
};

export const hapticError = async () => {
  if (window.Capacitor?.isNativePlatform()) {
    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      await Haptics.notification({ type: NotificationType.Error });
    } catch {
      // Haptics not available
    }
  }
};
