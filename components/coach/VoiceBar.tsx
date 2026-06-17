/**
 * VoiceBar — compact talk-mode panel.
 *
 * A small neobrutalist card that slides up to sit just above the input bar /
 * dock while the user is in a live voice conversation with the coach. Replaces
 * the old full-screen TalkModeOverlay. Shows an animated equaliser, the live
 * transcript while listening, and the coach's reply while speaking.
 */

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import type { TalkPhase } from '@/hooks/useTalkMode';

interface Props {
  phase: TalkPhase;
  partialTranscript: string;
  lastCoachText: string;
  errorMessage: string;
  onExit: () => void;
}

const BAR_MIN = 5;
const BAR_MAX = 22;

// ── Single animated equaliser bar ────────────────────────────────────────────
function WaveBar({ level, color }: { level: SharedValue<number>; color: string }) {
  const style = useAnimatedStyle(() => ({
    height: BAR_MIN + (BAR_MAX - BAR_MIN) * level.value,
  }));
  return <Animated.View style={[styles.waveBar, { backgroundColor: color }, style]} />;
}

// ── Equaliser — 5 bars whose motion reflects the current phase ────────────────
function Equaliser({ phase, color }: { phase: TalkPhase; color: string }) {
  // Fixed count so hook order stays stable.
  const b0 = useSharedValue(0.3);
  const b1 = useSharedValue(0.3);
  const b2 = useSharedValue(0.3);
  const b3 = useSharedValue(0.3);
  const b4 = useSharedValue(0.3);
  const bars = [b0, b1, b2, b3, b4];

  useEffect(() => {
    bars.forEach((bar, i) => {
      if (phase === 'listening' || phase === 'speaking') {
        // Lively, staggered bounce — the "moving" voice waveform.
        const peak = phase === 'listening' ? 0.55 + (i % 3) * 0.18 : 0.5 + ((i + 1) % 3) * 0.2;
        const dur = 280 + i * 70;
        bar.value = withRepeat(
          withSequence(
            withTiming(peak, { duration: dur, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.18, { duration: dur, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        );
      } else if (phase === 'thinking') {
        // Calm, synchronised pulse.
        bar.value = withRepeat(
          withSequence(
            withTiming(0.55, { duration: 420 + i * 80 }),
            withTiming(0.22, { duration: 420 + i * 80 }),
          ),
          -1,
          true,
        );
      } else {
        bar.value = withTiming(0.25, { duration: 200 });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <View style={styles.equaliser}>
      {bars.map((bar, i) => (
        <WaveBar key={i} level={bar} color={color} />
      ))}
    </View>
  );
}

export function VoiceBar({ phase, partialTranscript, lastCoachText, errorMessage, onExit }: Props) {
  const colors = useColors();

  const accent =
    phase === 'listening' ? colors.primary
    : phase === 'error'   ? colors.persimmon
    : colors.violet;

  // Primary line of text reflects the phase.
  let mainText: string;
  let muted = false;
  if (phase === 'error') {
    mainText = errorMessage || 'voice error';
  } else if (phase === 'thinking') {
    mainText = 'thinking…';
    muted = true;
  } else if (phase === 'speaking') {
    mainText = lastCoachText || 'speaking…';
  } else {
    // listening (or idle)
    mainText = partialTranscript || 'listening… say something';
    muted = partialTranscript === '';
  }

  const statusLabel =
    phase === 'listening' ? 'listening'
    : phase === 'thinking' ? 'thinking'
    : phase === 'speaking' ? 'coach'
    : phase === 'error'   ? 'error'
    : '';

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(160)}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.foreground }]}
    >
      {/* Animated equaliser */}
      <View style={[styles.iconWrap, { borderColor: colors.foreground, backgroundColor: accent + '1A' }]}>
        <Equaliser phase={phase} color={accent} />
      </View>

      {/* Status + live text */}
      <View style={styles.textCol}>
        {statusLabel !== '' && (
          <Text style={[styles.status, { color: accent, fontFamily: F.monoMed }]}>
            {statusLabel}
          </Text>
        )}
        <Text
          style={[
            styles.main,
            { color: muted ? colors.mutedForeground : colors.foreground, fontFamily: F.bodyMed },
          ]}
          numberOfLines={2}
        >
          {mainText}
        </Text>
      </View>

      {/* Stop button */}
      <Pressable
        onPress={onExit}
        hitSlop={10}
        style={({ pressed }) => [
          styles.stopBtn,
          {
            borderColor: colors.foreground,
            backgroundColor: pressed ? colors.persimmon : colors.background,
            transform: pressed ? [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }] : [],
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="stop talking"
      >
        <Feather name="x" size={18} color={colors.foreground} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: BRUTAL.border,
    borderRadius: BRUTAL.radius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 56,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: BRUTAL.radius,
    borderWidth: BRUTAL.borderThin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equaliser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: BAR_MAX,
  },
  waveBar: {
    width: 3.5,
    borderRadius: 2,
  },
  textCol: { flex: 1, gap: 2 },
  status: { fontSize: 10, letterSpacing: 0.4, textTransform: 'lowercase' },
  main: { fontSize: 14, lineHeight: 19 },
  stopBtn: {
    width: 40,
    height: 40,
    borderRadius: BRUTAL.radius,
    borderWidth: BRUTAL.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
