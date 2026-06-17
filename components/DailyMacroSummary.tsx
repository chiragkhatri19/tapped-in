import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { BrutalBox } from '@/components/brutal';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';

interface Props {
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  targetCalories?: number;
  targetProteinG?: number;
  targetCarbsG?: number;
  targetFatG?: number;
}

const DEFAULTS = { targetCalories: 2200, targetProteinG: 160, targetCarbsG: 220, targetFatG: 70 };
const ANIM = { duration: 500, easing: Easing.out(Easing.cubic) };

function MacroBar({ pct, color, colors }: { pct: number; color: string; colors: ReturnType<typeof useColors> }) {
  const progress = useSharedValue(0);
  useEffect(() => { progress.value = withTiming(Math.min(1, pct), ANIM); }, [pct]);
  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` as `${number}%` }));
  return (
    <View style={[s.barBg, { borderColor: colors.foreground, backgroundColor: colors.muted }]}>
      <Animated.View style={[{ height: '100%', backgroundColor: color }, bar]} />
    </View>
  );
}

function MacroCol({ label, current, target, color, colors }: {
  label: string; current: number; target: number; color: string; colors: ReturnType<typeof useColors>;
}) {
  const over = current > target && target > 0;
  return (
    <View style={s.macroCol}>
      <Text style={[s.macroNum, { color: over ? colors.persimmon : colors.foreground }]}>
        {Math.round(current)}<Text style={[s.macroUnit, { color: colors.mutedForeground }]}>g</Text>
      </Text>
      <Text style={[s.macroLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[s.macroTarget, { color: colors.mutedForeground }]}>/ {Math.round(target)}g</Text>
      <View style={{ height: 6 }} />
      <MacroBar pct={target > 0 ? current / target : 0} color={over ? colors.persimmon : color} colors={colors} />
    </View>
  );
}

export default function DailyMacroSummary({
  totalCalories, totalProteinG, totalCarbsG, totalFatG,
  targetCalories, targetProteinG, targetCarbsG, targetFatG,
}: Props) {
  const colors = useColors();
  const tCal  = targetCalories  ?? DEFAULTS.targetCalories;
  const tProt = targetProteinG  ?? DEFAULTS.targetProteinG;
  const tCarb = targetCarbsG    ?? DEFAULTS.targetCarbsG;
  const tFat  = targetFatG      ?? DEFAULTS.targetFatG;

  const over      = totalCalories > tCal;
  const remaining = Math.max(0, tCal - totalCalories);
  const overBy    = Math.round(totalCalories - tCal);
  const calPct    = tCal > 0 ? totalCalories / tCal : 0;

  const calProgress = useSharedValue(0);
  useEffect(() => { calProgress.value = withTiming(Math.min(1, calPct), ANIM); }, [calPct]);
  const calBarStyle = useAnimatedStyle(() => ({ width: `${calProgress.value * 100}%` as `${number}%` }));

  return (
    <BrutalBox style={s.card} offset={BRUTAL.shadowLg}>

      {/* Hero row */}
      <View style={s.heroRow}>
        <View style={s.heroLeft}>
          <Text style={[s.heroNum, { color: over ? colors.persimmon : colors.foreground }]}>
            {Math.round(totalCalories)}
          </Text>
          <Text style={[s.heroUnit, { color: colors.mutedForeground }]}>kcal eaten</Text>
        </View>

        {/* Remaining / over pop badge */}
        <View style={[s.badge,
          over
            ? { backgroundColor: colors.persimmon, borderColor: colors.foreground }
            : { backgroundColor: colors.highlight, borderColor: colors.foreground },
        ]}>
          <Text style={[s.badgeNum, { color: over ? '#FFFFFF' : '#111111' }]}>
            {over ? `+${overBy}` : `${Math.round(remaining)}`}
          </Text>
          <Text style={[s.badgeLabel, { color: over ? '#FFFFFF' : '#111111' }]}>
            {over ? 'over' : 'left'}
          </Text>
        </View>
      </View>

      {/* Calorie progress bar */}
      <View style={[s.calBarBg, { borderColor: colors.foreground, backgroundColor: colors.muted }]}>
        <Animated.View style={[{ height: '100%', backgroundColor: over ? colors.persimmon : colors.primary }, calBarStyle]} />
      </View>
      <Text style={[s.targetLine, { color: colors.mutedForeground }]}>target {tCal} kcal / day</Text>

      <View style={[s.divider, { backgroundColor: colors.foreground }]} />

      {/* Macro columns */}
      <View style={s.macros}>
        <MacroCol label="protein" current={totalProteinG} target={tProt} color={colors.blue}   colors={colors} />
        <View style={[s.colDiv, { backgroundColor: colors.foreground }]} />
        <MacroCol label="carbs"   current={totalCarbsG}  target={tCarb} color={colors.orange} colors={colors} />
        <View style={[s.colDiv, { backgroundColor: colors.foreground }]} />
        <MacroCol label="fat"     current={totalFatG}    target={tFat}  color={colors.pink}   colors={colors} />
      </View>

    </BrutalBox>
  );
}

const s = StyleSheet.create({
  card: { padding: 18, marginHorizontal: 20 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  heroLeft: { gap: 3 },
  heroNum: { fontFamily: F.monoSemi, fontSize: 52, letterSpacing: -2, lineHeight: 54 },
  heroUnit: { fontFamily: F.bodyMed, fontSize: 12 },
  badge: { borderWidth: BRUTAL.border, borderRadius: BRUTAL.radiusPill, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 76 },
  badgeNum: { fontFamily: F.monoSemi, fontSize: 24, letterSpacing: -0.5 },
  badgeLabel: { fontFamily: F.bodyBold, fontSize: 11, marginTop: 1 },
  calBarBg: { height: 14, borderRadius: 2, borderWidth: 2, overflow: 'hidden', marginBottom: 6 },
  targetLine: { fontFamily: F.mono, fontSize: 11, marginBottom: 16 },
  divider: { height: 2, marginBottom: 16 },
  macros: { flexDirection: 'row', alignItems: 'flex-start' },
  macroCol: { flex: 1, alignItems: 'center', gap: 2 },
  colDiv: { width: 2, alignSelf: 'stretch' },
  macroNum: { fontFamily: F.monoSemi, fontSize: 20, letterSpacing: -0.5 },
  macroUnit: { fontFamily: F.mono, fontSize: 12 },
  macroLabel: { fontFamily: F.bodyMed, fontSize: 11 },
  macroTarget: { fontFamily: F.mono, fontSize: 10 },
  barBg: { height: 8, width: '75%', borderRadius: 2, borderWidth: 2, overflow: 'hidden' },
});
