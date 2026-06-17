import { Easing } from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';

export const DUR = { fast: 200, base: 320, slow: 500, reveal: 800 } as const;

export const EASE = {
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.ease),
  standard: Easing.bezier(0.2, 0, 0, 1),
} as const;

export const SPRING = {
  sheet: { damping: 24, stiffness: 240 },
  press: { damping: 18, stiffness: 320 },
} as const;

// Dock pill spring — tight, minimal-bounce. Shared by BrutalDock's pill and the
// tab screen transition (constants/tab-transition.ts) so switching screens settles
// with the exact same pace/feel as the dock. (Reduced mass + high stiffness = ultra snappy).
export const DOCK_SPRING = { stiffness: 600, damping: 42, mass: 0.5 } as const;

export const STAGGER = 60;

export function reduceMotion(): Promise<boolean> {
  return AccessibilityInfo.isReduceMotionEnabled();
}
