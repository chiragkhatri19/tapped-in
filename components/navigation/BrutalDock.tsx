import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { DOCK_SPRING } from '@/constants/motion';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useUiStore } from '@/stores/ui-store';
import { useWorkoutStore } from '@/stores/workout-store';

// Exported so screens can pad their content below the dock
export const DOCK_HEIGHT = 58;
export const DOCK_BOTTOM_MARGIN = 10;
// Total space screens should reserve at the bottom
export const DOCK_SAFE_BOTTOM = DOCK_HEIGHT + DOCK_BOTTOM_MARGIN + 8;

const ICON_W = 44;
const PILL_W = 90;
// Tight spring — expands pill with minimal bounce. Shared with the tab screen
// transition (constants/tab-transition.ts) so the dock and screen switch share a pace.
const PILL_SPRING = DOCK_SPRING;

type TabDef = {
  name: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accentKey: keyof ReturnType<typeof useColors>;
};

const TABS: TabDef[] = [
  { name: 'results',  label: 'home',    icon: 'home-outline',     accentKey: 'primary' },
  { name: 'index',    label: 'tracker', icon: 'flame-outline',    accentKey: 'primary' },
  { name: 'sleep',    label: 'recovery', icon: 'moon-outline',     accentKey: 'violet' },
  { name: 'workout',  label: 'workout', icon: 'barbell-outline',  accentKey: 'orange' },
  { name: 'trainer',  label: 'coach',   icon: 'sparkles-outline', accentKey: 'violet' },
];

const HIDDEN_ROUTES = new Set(['evidence', 'recipes']);

interface DockProps extends BottomTabBarProps {
  maybeShowPaywall?: () => void;
}

function DockTab({
  tab, isFocused, onPress, onPressIn, onPressOut,
}: {
  tab: TabDef;
  isFocused: boolean;
  onPress: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
}) {
  const colors = useColors();
  const widthSV = useSharedValue(isFocused ? PILL_W : ICON_W);
  const scaleSV = useSharedValue(isFocused ? 1.15 : 1);

  useEffect(() => {
    widthSV.value = withSpring(isFocused ? PILL_W : ICON_W, PILL_SPRING);
    scaleSV.value = withSpring(isFocused ? 1.15 : 1, PILL_SPRING);
  }, [isFocused]);

  const animStyle = useAnimatedStyle(() => ({
    width: widthSV.value,
    transform: [{ scale: scaleSV.value }],
  }));

  const accent = colors[tab.accentKey] as string;
  const pillBg = isFocused ? accent : 'transparent';
  const pillBorderColor = isFocused ? colors.foreground : 'transparent';
  // Active tab: white always contrasts against every accent (cobalt, violet, orange).
  // Inactive tabs: always muted gray.
  const pillContentColor = isFocused ? '#FFFFFF' : colors.mutedForeground;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={tab.label}
    >
      <Animated.View
        style={[
          styles.tabPill,
          animStyle,
          {
            backgroundColor: pillBg,
            borderWidth: BRUTAL.borderThin,
            borderColor: pillBorderColor,
          },
        ]}
      >
        <Ionicons
          name={tab.icon}
          size={18}
          color={pillContentColor}
        />
        {isFocused && (
          <Text
            style={[
              styles.tabLabel,
              { color: pillContentColor },
            ]}
            numberOfLines={1}
          >
            {tab.label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function BrutalDock({ state, descriptors, navigation, maybeShowPaywall }: DockProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const isDockVisible = useUiStore((s) => s.isDockVisible);
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const showDock = isDockVisible && activeWorkout === null;

  const translateY = useSharedValue(0);
  const hoverScale = useSharedValue(1);
  const hoverTranslateY = useSharedValue(0);

  useEffect(() => {
    if (showDock) {
      translateY.value = withSpring(0, {
        stiffness: 300,
        damping: 11, // Bouncy overshoot / jiggle when expanding/entering
        mass: 0.6,
      });
    } else {
      translateY.value = withSpring(120, {
        stiffness: 220,
        damping: 20, // Clean and smooth exit when hiding
        mass: 0.8,
      });
    }
  }, [showDock]);

  const shadowOpacity = useSharedValue(0.18);
  const shadowRadius = useSharedValue(22);

  const handlePressIn = () => {
    hoverScale.value = withSpring(1.03, { stiffness: 450, damping: 18 });
    hoverTranslateY.value = withSpring(-5, { stiffness: 450, damping: 18 });
    shadowOpacity.value = withSpring(0.38, { stiffness: 300, damping: 15 });
    shadowRadius.value = withSpring(36, { stiffness: 300, damping: 15 });
  };

  const handlePressOut = () => {
    hoverScale.value = withSpring(1, { stiffness: 350, damping: 15 });
    hoverTranslateY.value = withSpring(0, { stiffness: 350, damping: 15 });
    shadowOpacity.value = withSpring(0.18, { stiffness: 250, damping: 18 });
    shadowRadius.value = withSpring(22, { stiffness: 250, damping: 18 });
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value + hoverTranslateY.value },
      { scale: hoverScale.value },
    ],
    shadowOpacity: shadowOpacity.value,
    shadowRadius: shadowRadius.value,
  }));

  const visibleRoutes = state.routes.filter(r => !HIDDEN_ROUTES.has(r.name));

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.outerWrapper,
        { bottom: insets.bottom + DOCK_BOTTOM_MARGIN },
        animStyle,
        // Base shadow (animated props will override these at runtime)
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.18,
          shadowRadius: 22,
          elevation: 14,
        },
      ]}
    >
      <View style={[styles.dock, { backgroundColor: colors.card, borderColor: colors.foreground }]}>
        {visibleRoutes.map((route) => {
          const isFocused = state.routes[state.index]?.name === route.name;
          const tab = TABS.find(t => t.name === route.name);
          if (!tab) return null;

          const handlePress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (Platform.OS !== 'web') Haptics.selectionAsync();
            if (!isFocused && !event.defaultPrevented) {
              if (route.name !== 'results' && maybeShowPaywall) maybeShowPaywall();
              navigation.navigate(route.name);
            }
          };

          return (
            <DockTab
              key={route.key}
              tab={tab}
              isFocused={isFocused}
              onPress={handlePress}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: 44,
    right: 44,
    height: DOCK_HEIGHT,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: DOCK_HEIGHT,
    borderWidth: BRUTAL.borderThin,
    borderRadius: 100,
    paddingHorizontal: 8,
    gap: 6,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    // Concentric rounding: dock outer radius is ~29px at its height (58px → 100 clamps to 29).
    // Pill sits 10px inset from dock edge, so inner pill needs ~19px to match curvature perfectly.
    borderRadius: 19,
    gap: 6,
    paddingHorizontal: 10,
  },
  tabLabel: {
    fontFamily: F.bodySemi,
    fontSize: 11,
    letterSpacing: 0.1,
  },
});
