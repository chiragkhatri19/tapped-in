/**
 * DayCompleteOverlay — brutalist "DAY COMPLETE / streak +1" celebration stamp.
 * Springs in when the 4th ring closes, auto-dismisses after 1.8s.
 * No new dependencies — uses react-native-reanimated (already in the project).
 */

import React, { useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';

interface Props {
  visible: boolean;
  streak: number;
  onDismiss: () => void;
}

// Lightweight confetti shard — a small rotated rectangle
function Shard({ color, top, left, delay }: { color: string; top: number; left: string; delay: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (true) {
      opacity.value = withDelay(delay, withSequence(
        withTiming(1, { duration: 180 }),
        withDelay(800, withTiming(0, { duration: 400 })),
      ));
      translateY.value = withDelay(delay, withTiming(-60, { duration: 900 }));
    }
  });

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { rotate: '45deg' }],
  }));

  return (
    <Animated.View style={[
      { position: 'absolute', top, left: left as unknown as number, width: 10, height: 10, borderRadius: 2, backgroundColor: color },
      style,
    ]} />
  );
}

const SHARDS = [
  { color: '#E8FF00', top: 20, left: '15%', delay: 0 },
  { color: '#00C2A8', top: 10, left: '35%', delay: 80 },
  { color: '#FF7A1A', top: 25, left: '55%', delay: 40 },
  { color: '#7C5CFF', top: 8,  left: '75%', delay: 120 },
  { color: '#FF3DA5', top: 30, left: '88%', delay: 60 },
  { color: '#E8FF00', top: 15, left: '5%',  delay: 100 },
];

export function DayCompleteOverlay({ visible, streak, onDismiss }: Props) {
  const colors = useColors();
  const scale = useSharedValue(0.6);
  const rotate = useSharedValue(-6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      rotate.value = withSpring(0, { damping: 14, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 120 });

      // Auto-dismiss after 1.8s
      const timer = setTimeout(onDismiss, 1800);
      return () => clearTimeout(timer);
    } else {
      scale.value = 0.6;
      rotate.value = -6;
      opacity.value = 0;
    }
  }, [visible]);

  const stampStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onDismiss}>
      <View style={sr.backdrop}>
        {/* Confetti shards */}
        {SHARDS.map((s, i) => (
          <Shard key={i} {...s} />
        ))}

        {/* Stamp card */}
        <Animated.View style={[sr.stamp, {
          backgroundColor: colors.highlight,
          borderColor: colors.foreground,
        }, stampStyle]}>
          <Text style={[sr.mainText, { color: colors.foreground }]}>DAY COMPLETE</Text>
          <View style={[sr.divider, { backgroundColor: colors.foreground }]} />
          <Text style={[sr.streakText, { color: colors.foreground }]}>
            {streak > 0 ? `${streak} day streak` : 'streak starts now'}
          </Text>
          <Text style={[sr.subText, { color: colors.foreground + 'BB' }]}>all 4 rings closed</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const sr = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  stamp: {
    paddingHorizontal: 32,
    paddingVertical: 28,
    borderWidth: BRUTAL.border + 1,
    borderRadius: BRUTAL.radiusLg,
    alignItems: 'center',
    gap: 10,
    minWidth: 260,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 8,
  },
  mainText: {
    fontFamily: F.displayBold,
    fontSize: 28,
    letterSpacing: -0.5,
    fontStyle: 'italic',
  },
  divider: {
    height: 3,
    width: '100%',
    borderRadius: 2,
  },
  streakText: {
    fontFamily: F.monoSemi,
    fontSize: 20,
  },
  subText: {
    fontFamily: F.mono,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
