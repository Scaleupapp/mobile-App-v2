import { NativeModules, Platform } from 'react-native';
const { ScreenshotBlocker } = NativeModules;

export const preventScreenshots = () => {
  if (Platform.OS === 'android' && ScreenshotBlocker?.enable) {
    ScreenshotBlocker.enable();
  }
};

export const allowScreenshots = () => {
  if (Platform.OS === 'android' && ScreenshotBlocker?.disable) {
    ScreenshotBlocker.disable();
  }
};

/**
 * Returns a promise that resolves to true/false (overlay permission)
 */
export const isOverlayAllowed = async () => {
  if (Platform.OS !== 'android' || !ScreenshotBlocker?.isOverlayAllowed) return false;
  try {
    const allowed = await ScreenshotBlocker.isOverlayAllowed();
    return Boolean(allowed);
  } catch (e) {
    return false;
  }
};

export const openOverlaySettings = () => {
  if (Platform.OS === 'android' && ScreenshotBlocker?.openOverlaySettings) {
    ScreenshotBlocker.openOverlaySettings();
  }
};
