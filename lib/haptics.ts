/**
 * Thin, no-op-safe haptics wrapper.
 * All methods silently do nothing on web or if haptics are unavailable.
 */
import { Platform } from 'react-native';

let Haptics: typeof import('expo-haptics') | null = null;

if (Platform.OS !== 'web') {
  try {
    Haptics = require('expo-haptics');
  } catch {
    // Haptics unavailable
  }
}

export const haptic = {
  /** Light tap — for completing a set */
  light: () => Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  /** Medium tap — for navigation, selections */
  medium: () => Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
  /** Heavy thud — for destructive actions */
  heavy: () => Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}),
  /** Success pattern — for PRs and workout completion */
  success: () => Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  /** Warning pattern — for rest timer ending */
  warning: () => Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
  /** Error pattern — for destructive actions */
  error: () => Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
};
