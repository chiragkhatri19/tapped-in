import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  withRepeat, withSequence, useAnimatedReaction, runOnJS,
  Easing, ReduceMotion, type SharedValue,
} from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { SPRING } from '@/constants/motion';
import { withAlpha } from '@/constants/colors';

const EXPECTED_MS = 20_000;

const STAGES = [
  'reading your profile...',
  'balancing weekly volume...',
  'ordering the lifts...',
  'pulling the studies...',
  'finalising your split...',
];

const STAGE_THRESHOLDS = [0, 0.2, 0.45, 0.65, 0.82];

interface Props {
  complete?: boolean;
  expectedDurationMs?: number;
  onBuildManual?: () => void;
}

export function GeneratingLoader({ complete = false, expectedDurationMs = EXPECTED_MS, onBuildManual }: Props) {
  const colors = useColors();
  const progressSV = useSharedValue(0);
  const shimmerSV = useSharedValue(0);
  const stageFadeSV = useSharedValue(1);
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    progressSV.value = withTiming(0.9, {
      duration: expectedDurationMs,
      easing: Easing.out(Easing.exp),
      reduceMotion: ReduceMotion.System,
    });
    shimmerSV.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.cubic), reduceMotion: ReduceMotion.System }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.cubic), reduceMotion: ReduceMotion.System }),
      ),
      -1,
      true,
    );
  }, []);

  useEffect(() => {
    if (complete) progressSV.value = withSpring(1, SPRING.sheet);
  }, [complete]);

  useAnimatedReaction(
    () => {
      let idx = 0;
      for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
        if (progressSV.value >= STAGE_THRESHOLDS[i]) { idx = i; break; }
      }
      return idx;
    },
    (idx, prev) => {
      if (idx !== prev) {
        stageFadeSV.value = withSequence(
          withTiming(0.35, { duration: 120, reduceMotion: ReduceMotion.System }),
          withTiming(1, { duration: 220, reduceMotion: ReduceMotion.System }),
        );
        runOnJS(setStageIdx)(idx);
      }
    },
  );

  const barFillStyle = useAnimatedStyle(() => ({
    width: `${progressSV.value * 100}%` as `${number}%`,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + shimmerSV.value * 0.28,
    transform: [{ translateX: -36 + shimmerSV.value * 72 }],
  }));

  const stageStyle = useAnimatedStyle(() => ({ opacity: stageFadeSV.value }));

  const fg = colors.foreground;
  const primary = colors.primary;

  return (
    <View style={styles.root}>
      <View style={[styles.accentOrb, { borderColor: fg, backgroundColor: withAlpha(primary, 0.14) }]}>
        <Text style={[styles.orbText, { color: fg }]}>TI</Text>
      </View>

      <Text style={[styles.heading, { color: fg }]}>building your{`\n`}programme.</Text>

      <View style={[styles.progressTrack, { borderColor: fg, backgroundColor: withAlpha(fg, 0.08) }]}>
        <Animated.View style={[styles.progressFill, barFillStyle, { backgroundColor: primary, borderRightWidth: BRUTAL.border, borderRightColor: fg }]}>
          <Animated.View style={[styles.shimmer, shimmerStyle, { backgroundColor: colors.highlight }]} />
        </Animated.View>
      </View>

      <View style={styles.labelRow}>
        <ProgressPct progressSV={progressSV} color={colors.mutedForeground} />
        <Animated.Text style={[styles.stageLabel, stageStyle, { color: colors.mutedForeground }]} numberOfLines={1}>
          {STAGES[stageIdx]}
        </Animated.Text>
      </View>

      {!!onBuildManual && (
        <Pressable onPress={onBuildManual} style={[styles.fallback, { borderColor: withAlpha(fg, 0.25) }]}>
          <Text style={[styles.fallbackText, { color: colors.mutedForeground }]}>build it yourself instead</Text>
        </Pressable>
      )}
    </View>
  );
}

function ProgressPct({ progressSV, color }: { progressSV: SharedValue<number>; color: string }) {
  const [pct, setPct] = useState(0);
  useAnimatedReaction(
    () => Math.round(progressSV.value * 100),
    (v, prev) => { if (v !== prev) runOnJS(setPct)(v); },
  );
  return <Text style={[styles.pct, { color }]}>{pct}%</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 20 },
  accentOrb: { width: 74, height: 74, borderRadius: BRUTAL.radiusLg, borderWidth: BRUTAL.border, alignItems: 'center', justifyContent: 'center' },
  orbText: { fontFamily: F.monoSemi, fontSize: 22, letterSpacing: -1 },
  heading: { fontFamily: F.displayBold, fontSize: 32, letterSpacing: -0.8, textAlign: 'center', lineHeight: 38 },
  progressTrack: { width: '100%', height: 20, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, overflow: 'hidden' },
  progressFill: { height: '100%', overflow: 'hidden' },
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: 34 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  pct: { fontFamily: F.monoSemi, fontSize: 14, minWidth: 40 },
  stageLabel: { fontFamily: F.bodyMed, fontSize: 13, flex: 1 },
  fallback: { marginTop: 8, paddingVertical: 12, paddingHorizontal: 20, borderWidth: BRUTAL.borderThin, borderRadius: BRUTAL.radius },
  fallbackText: { fontFamily: F.bodyMed, fontSize: 13 },
});
