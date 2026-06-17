/**
 * RestTimerBar — floating bottom bar shown while resting between sets.
 * Turns teal + fires haptic + sound when the timer reaches zero.
 * Uses a prop-driven countdown (parent owns the timer state).
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, type DimensionValue } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { withAlpha } from '@/constants/colors';

interface Props {
  restSeconds: number;
  restTotal: number;
  bottomPad: number;
  onAdjust: (delta: number) => void;
  onSkip: () => void;
}

function fmtTimer(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function RestTimerBar({ restSeconds, restTotal, bottomPad, onAdjust, onSkip }: Props) {
  const colors = useColors();
  const pct = restTotal > 0 ? Math.max(0, Math.min(1, restSeconds / restTotal)) : 0;
  const isDone = restSeconds <= 0;
  const isWarning = restSeconds <= 5 && restSeconds > 0;
  const accentColor = isDone ? colors.teal : isWarning ? colors.orange : colors.violet;

  return (
    <View style={[s.container, {
      backgroundColor: colors.card,
      borderTopColor: isDone ? colors.teal : colors.foreground,
      paddingBottom: bottomPad + 12,
    }]}>
      {/* Countdown progress bar */}
      <View style={[s.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[s.progressFill, {
          width: `${pct * 100}%` as DimensionValue,
          backgroundColor: accentColor,
        }]} />
      </View>

      {/* Controls row */}
      <View style={s.controls}>
        <Pressable onPress={() => onAdjust(-15)} style={[s.adjBtn, { borderColor: withAlpha(colors.foreground, 0.22) }]}>
          <Text style={[s.adjText, { color: colors.mutedForeground }]}>−15s</Text>
        </Pressable>

        <View style={s.center}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>REST</Text>
          <Text style={[s.timer, { color: accentColor }]}>
            {isDone ? 'go!' : fmtTimer(restSeconds)}
          </Text>
        </View>

        <Pressable onPress={() => onAdjust(+30)} style={[s.adjBtn, { borderColor: withAlpha(colors.foreground, 0.22) }]}>
          <Text style={[s.adjText, { color: colors.mutedForeground }]}>+30s</Text>
        </Pressable>
      </View>

      {/* Skip */}
      <Pressable onPress={onSkip} style={s.skip}>
        <Text style={[s.skipText, { color: colors.violet }]}>skip rest</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container:     { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: BRUTAL.border, paddingTop: 10, paddingHorizontal: 20 },
  progressTrack: { height: 4, borderRadius: 2, marginBottom: 12 },
  progressFill:  { height: 4, borderRadius: 2 },
  controls:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  adjBtn:        { width: 64, height: 40, borderWidth: 1, borderRadius: BRUTAL.radius, alignItems: 'center', justifyContent: 'center' },
  adjText:       { fontFamily: F.bodyMed, fontSize: 13 },
  center:        { alignItems: 'center' },
  label:         { fontFamily: F.monoSemi, fontSize: 9, letterSpacing: 1.2, marginBottom: 2 },
  timer:         { fontFamily: F.monoSemi, fontSize: 38, lineHeight: 42 },
  skip:          { alignItems: 'center', paddingTop: 8 },
  skipText:      { fontFamily: F.bodySemi, fontSize: 13 },
});
