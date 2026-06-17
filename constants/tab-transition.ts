// Tab screen transition — same family as the dock pill's motion, a touch faster.
//
// The dock (components/navigation/BrutalDock.tsx) expands its pill with a tight,
// low-bounce spring (DOCK_SPRING). The screen switch uses a slightly stiffer spring
// so it settles a bit quicker, while keeping the same near-critically-damped,
// low-bounce character (damping ratio ~0.95) so the two still feel related.
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

import { DOCK_SPRING } from '@/constants/motion';

const TAB_SWITCH_SPRING = DOCK_SPRING;

export const dockTabTransitionSpec: BottomTabNavigationOptions['transitionSpec'] = {
  animation: 'spring',
  config: TAB_SWITCH_SPRING,
};

// Refined cross-fade with a small directional shift that echoes the dock's
// horizontal pill motion. progress is -1 (tab behind) · 0 (active) · 1 (ahead),
// so screens to the right slide in from the right and vice versa.
export const dockTabSceneInterpolator: BottomTabNavigationOptions['sceneStyleInterpolator'] = ({ current }) => ({
  sceneStyle: {
    opacity: current.progress.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [0, 1, 0],
    }),
    transform: [
      {
        translateX: current.progress.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-16, 0, 16],
        }),
      },
    ],
  },
});
