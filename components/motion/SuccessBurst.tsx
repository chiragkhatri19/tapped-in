/**
 * SuccessBurst — reusable brutalist "completion" celebration overlay.
 *
 * One component for every log / submit / finish moment in the app: a backdrop
 * fades in, a circular badge springs in with a popping checkmark, confetti
 * shards burst outward and fall, and a display-italic title + mono subtitle
 * stamp in. Fires haptic.success() on show, auto-dismisses, then calls onDone
 * (use the `after` callback in useSuccessBurst to navigate once it's finished).
 *
 * No new dependencies — react-native-reanimated + expo-haptics are already in
 * the project. Mirrors the look of DayCompleteOverlay so celebrations feel
 * consistent across the app.
 */

import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Modal, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { haptic } from '@/lib/haptics';

const CONFETTI_COLORS = ['#E8FF00', '#00C2A8', '#FF7A1A', '#7C5CFF', '#FF3DA5', '#22D3EE'];

// Deterministic confetti spread — shards radiate from the badge centre, spin,
// and fall under "gravity". Generated once at module scope so it's stable.
const SHARDS = Array.from({ length: 14 }).map((_, i) => {
  const angle = (Math.PI * 2 * i) / 14 + (i % 2 === 0 ? 0.18 : -0.12);
  const dist = 120 + (i % 4) * 26;
  return {
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    dx: Math.cos(angle) * dist,
    dy: Math.sin(angle) * dist - 40, // bias upward so they arc before falling
    rot: (i % 2 === 0 ? 1 : -1) * (240 + i * 30),
    size: i % 3 === 0 ? 12 : 8,
    delay: (i % 5) * 35,
    round: i % 3 === 0,
  };
});

function Shard({
  color, dx, dy, rot, size, delay, round, reduce,
}: (typeof SHARDS)[number] & { reduce: boolean }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 120 }),
      withDelay(520, withTiming(0, { duration: 360 })),
    ));
    progress.value = withDelay(delay, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: dx * progress.value },
      // arc up first, then gravity pulls down past the apex
      { translateY: dy * progress.value + 160 * progress.value * progress.value },
      { rotate: `${rot * progress.value}deg` },
      { scale: 0.6 + progress.value * 0.6 },
    ],
  }));

  if (reduce) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginTop: -size / 2,
          marginLeft: -size / 2,
          width: size,
          height: size,
          borderRadius: round ? size / 2 : 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export interface SuccessBurstProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  /** Called once the celebration has fully played; navigate/reset from here. */
  onDone: () => void;
  /** How long the overlay stays up before onDone fires (ms). */
  duration?: number;
  /** Override the centre glyph (defaults to a checkmark). */
  icon?: React.ReactNode;
}

export function SuccessBurst({
  visible, title = 'logged.', subtitle, onDone, duration = 1350, icon,
}: SuccessBurstProps) {
  const colors = useColors();
  const [reduce, setReduce] = useState(false);

  const backdrop = useSharedValue(0);
  const badgeScale = useSharedValue(0.4);
  const checkScale = useSharedValue(0);
  const textShift = useSharedValue(14);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then(r => { if (!cancelled) setReduce(r); });

    haptic.success();

    backdrop.value = withTiming(1, { duration: 160 });
    badgeScale.value = withSpring(1, { damping: 11, stiffness: 190 });
    checkScale.value = withDelay(120, withSequence(
      withSpring(1.25, { damping: 8, stiffness: 240 }),
      withSpring(1, { damping: 12, stiffness: 220 }),
    ));
    textOpacity.value = withDelay(180, withTiming(1, { duration: 260 }));
    textShift.value = withDelay(180, withSpring(0, { damping: 14, stiffness: 200 }));

    const timer = setTimeout(onDone, duration);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [visible]);

  // Reset for the next time it opens.
  useEffect(() => {
    if (!visible) {
      backdrop.value = 0;
      badgeScale.value = 0.4;
      checkScale.value = 0;
      textShift.value = 14;
      textOpacity.value = 0;
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badgeScale.value }] }));
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textShift.value }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onDone} statusBarTranslucent>
      <Animated.View style={[sr.backdrop, backdropStyle]}>
        <View style={sr.stage}>
          {/* Badge + confetti share a centred frame so shards burst from the badge core */}
          <View style={sr.badgeWrap}>
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {SHARDS.map((s, i) => <Shard key={i} {...s} reduce={reduce} />)}
            </View>
            <Animated.View style={[sr.badge, { backgroundColor: colors.highlight, borderColor: colors.foreground }, badgeStyle]}>
              <Animated.View style={checkStyle}>
                {icon ?? <Ionicons name="checkmark-sharp" size={52} color={colors.foreground} />}
              </Animated.View>
            </Animated.View>
          </View>

          {/* Title + subtitle */}
          <Animated.View style={[sr.textWrap, textStyle]}>
            <Text style={[sr.title, { color: '#FFFFFF' }]}>{title}</Text>
            {subtitle ? <Text style={[sr.subtitle, { color: '#FFFFFFCC' }]}>{subtitle}</Text> : null}
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

/**
 * useSuccessBurst — ergonomic wrapper. Drop `node` into your screen's tree once,
 * then call `fire({ title, subtitle, after })`. `after` runs when the
 * celebration finishes (e.g. router.back()).
 */
export function useSuccessBurst() {
  const [state, setState] = useState<{
    visible: boolean; title?: string; subtitle?: string; after?: () => void; duration?: number;
  }>({ visible: false });

  const fire = (opts: { title?: string; subtitle?: string; after?: () => void; duration?: number }) =>
    setState({ visible: true, ...opts });

  const node = (
    <SuccessBurst
      visible={state.visible}
      title={state.title}
      subtitle={state.subtitle}
      duration={state.duration}
      onDone={() => {
        setState(s => ({ ...s, visible: false }));
        state.after?.();
      }}
    />
  );

  return { fire, node, visible: state.visible };
}

const sr = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrap: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: BRUTAL.border + 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 0,
    elevation: 8,
  },
  textWrap: {
    marginTop: 26,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: F.displayBold,
    fontSize: 34,
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: F.mono,
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
