/**
 * Shared workout UI primitives.
 * Import from here — not from individual screens — so every workout surface
 * stays visually consistent without copy-pasting styles.
 */

import React from 'react';
import {
  View, Text, StyleSheet, type DimensionValue, type ViewStyle, type StyleProp,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { muscleColor, STATUS_COLOR } from '@/constants/muscles';
import type { MuscleVolume } from '@/lib/workout-analytics';
import type { WorkoutExercise } from '@/stores/workout-store';

type ColorScheme = ReturnType<typeof useColors>;

// ---------------------------------------------------------------------------
// SectionLabel — Geist Mono 600, uppercase, +1 tracking (micro-label style)
// ---------------------------------------------------------------------------
export function SectionLabel({ children, style }: { children: string; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  return (
    <View style={style}>
      <Text style={[sl.text, { color: colors.mutedForeground }]}>{children.toUpperCase()}</Text>
    </View>
  );
}
const sl = StyleSheet.create({
  text: { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 1.2 },
});

// ---------------------------------------------------------------------------
// MuscleDot — colored dot for a muscle group
// ---------------------------------------------------------------------------
function MuscleDot({ group, size = 8 }: { group: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: muscleColor(group) }} />
  );
}

// ---------------------------------------------------------------------------
// MuscleTag — dot + muscle name inline
// ---------------------------------------------------------------------------
function MuscleTag({ group, style }: { group: string; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 5 }, style]}>
      <MuscleDot group={group} size={7} />
      <Text style={[mt.name, { color: colors.foreground }]}>{group}</Text>
    </View>
  );
}
const mt = StyleSheet.create({
  name: { fontFamily: F.bodyMed, fontSize: 12 },
});

// ---------------------------------------------------------------------------
// MetaChip — small bordered info chip (goal, days, duration)
// ---------------------------------------------------------------------------
function MetaChip({ label, value, accent }: { label: string; value: string; accent?: string }) {
  const colors = useColors();
  return (
    <View style={[mc.chip, { borderColor: colors.foreground, backgroundColor: colors.card }]}>
      <Text style={[mc.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[mc.value, { color: accent ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}
const mc = StyleSheet.create({
  chip:  { borderWidth: BRUTAL.borderThin, borderRadius: BRUTAL.radius, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  label: { fontFamily: F.monoSemi, fontSize: 9, letterSpacing: 1, marginBottom: 1 },
  value: { fontFamily: F.bodySemi, fontSize: 13 },
});

// ---------------------------------------------------------------------------
// VolumeBar — single muscle row (used by VolumeBars.tsx and builder)
// ---------------------------------------------------------------------------
export function VolumeBar({ vol }: { vol: MuscleVolume }) {
  const colors = useColors();
  const fill = Math.min((vol.setsThisWeek / Math.max(vol.targetMax, 1)) * 100, 100);
  const barColor = STATUS_COLOR[vol.status] ?? colors.teal;
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={vb.row}>
        <View style={vb.labelRow}>
          <View style={[vb.dot, { backgroundColor: muscleColor(vol.group) }]} />
          <Text style={[vb.muscle, { color: colors.foreground }]}>{vol.group}</Text>
        </View>
        <Text style={[vb.sets, { color: vol.status === 'lagging' ? colors.persimmon : colors.mutedForeground }]}>
          {Math.round(vol.setsThisWeek * 10) / 10}
          <Text style={vb.target}> / {vol.targetMin}-{vol.targetMax}</Text>
        </Text>
      </View>
      <View style={[vb.track, { backgroundColor: colors.muted }]}>
        <View style={{ width: `${fill}%` as DimensionValue, height: 5, backgroundColor: barColor, borderRadius: 2 }} />
      </View>
    </View>
  );
}
const vb = StyleSheet.create({
  row:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:      { width: 7, height: 7, borderRadius: 4 },
  muscle:   { fontFamily: F.bodyMed, fontSize: 12 },
  sets:     { fontFamily: F.monoSemi, fontSize: 12 },
  target:   { fontFamily: F.mono, fontSize: 10 },
  track:    { height: 5, borderRadius: 2 },
});

// ---------------------------------------------------------------------------
// WeekStrip — 7-day M–S schedule/completion strip
// ---------------------------------------------------------------------------
type DayStatus = 'done' | 'today' | 'rest' | 'upcoming' | 'skipped';

interface WeekStripDay {
  abbr: string;       // 'M', 'T', 'W', ...
  label: string;      // session name or 'Rest'
  status: DayStatus;
}

export function WeekStrip({ days }: { days: WeekStripDay[] }) {
  const colors = useColors();
  return (
    <View style={ws.row}>
      {days.map((d, i) => {
        const isDone     = d.status === 'done';
        const isToday    = d.status === 'today';
        const isRest     = d.status === 'rest';
        const isSkipped  = d.status === 'skipped';
        const bg =
          isDone    ? colors.teal :
          isToday   ? colors.primary :
          isSkipped ? colors.persimmon :
          isRest    ? colors.muted : colors.card;
        const fg =
          isDone || isToday ? '#FFFFFF' :
          isSkipped ? '#FFFFFF' :
          colors.foreground;
        return (
          <View key={i} style={ws.dayCol}>
            <View style={[ws.dot, { backgroundColor: bg, borderColor: colors.foreground, borderWidth: isToday ? BRUTAL.border : BRUTAL.borderThin }]}>
              <Text style={[ws.abbr, { color: fg, fontFamily: isToday ? F.bodyBold : F.bodySemi }]}>{d.abbr}</Text>
            </View>
            <Text style={[ws.label, { color: colors.mutedForeground }]} numberOfLines={1}>{isRest ? 'rest' : d.label.slice(0, 4).toLowerCase()}</Text>
          </View>
        );
      })}
    </View>
  );
}
const ws = StyleSheet.create({
  row:    { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', flex: 1, gap: 4 },
  dot:    { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  abbr:   { fontSize: 13 },
  label:  { fontFamily: F.mono, fontSize: 9, letterSpacing: 0.5 },
});

export type { WeekStripDay };

// ---------------------------------------------------------------------------
// ExerciseRow — compact exercise display (preview + manual builder)
// ---------------------------------------------------------------------------
interface ExerciseRowProps {
  exercise: WorkoutExercise;
  index?: number;
  showRIR?: boolean;
  showTempo?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ExerciseRow({ exercise: ex, index, showRIR = true, showTempo = true, style }: ExerciseRowProps) {
  const colors = useColors();
  return (
    <View style={[er.row, style]}>
      <View style={er.left}>
        <View style={er.orderRow}>
          {index !== undefined && (
            <Text style={[er.order, { color: colors.mutedForeground }]}>{String(index + 1).padStart(2, '0')}</Text>
          )}
          {ex.isPriorityLift && (
            <View style={[er.priorityDot, { backgroundColor: colors.orange }]} />
          )}
        </View>
        <Text style={[er.name, { color: colors.foreground }]} numberOfLines={1}>{ex.name}</Text>
        <View style={er.meta}>
          <MuscleDot group={ex.muscleGroup} size={6} />
          <Text style={[er.metaText, { color: colors.mutedForeground }]}>
            {ex.muscleGroup} · {ex.isCompound ? 'compound' : 'isolation'}
          </Text>
        </View>
      </View>
      <View style={er.right}>
        <Text style={[er.prescription, { color: colors.foreground }]}>
          {ex.sets}×{ex.reps}
        </Text>
        <View style={er.tags}>
          <Text style={[er.tag, { color: colors.mutedForeground }]}>{Math.floor(ex.restSeconds / 60)}:{String(ex.restSeconds % 60).padStart(2,'0')}s</Text>
          {showTempo && <Text style={[er.tag, { color: colors.mutedForeground }]}>{ex.tempo}</Text>}
          {showRIR && <Text style={[er.tag, { color: colors.mutedForeground }]}>RIR {ex.rir}</Text>}
        </View>
      </View>
    </View>
  );
}
const er = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 10, gap: 8 },
  left:       { flex: 1, gap: 2 },
  orderRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  order:      { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 1 },
  priorityDot:{ width: 6, height: 6, borderRadius: 3 },
  name:       { fontFamily: F.bodySemi, fontSize: 14 },
  meta:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:   { fontFamily: F.bodyReg, fontSize: 11 },
  right:      { alignItems: 'flex-end', gap: 4 },
  prescription:{ fontFamily: F.monoSemi, fontSize: 14 },
  tags:       { flexDirection: 'row', gap: 6 },
  tag:        { fontFamily: F.mono, fontSize: 10 },
});

// ---------------------------------------------------------------------------
// StatTile — a single stat in a 2 or 3-col grid
// ---------------------------------------------------------------------------
export function StatTile({
  label, value, unit, accent, style,
}: {
  label: string;
  value: string | number;
  unit?: string;
  accent?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  return (
    <View style={[st.tile, { backgroundColor: colors.card, borderColor: colors.foreground }, style]}>
      <Text style={[st.label, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
        <Text style={[st.value, { color: accent ?? colors.foreground }]}>{value}</Text>
        {unit && <Text style={[st.unit, { color: colors.mutedForeground }]}>{unit}</Text>}
      </View>
    </View>
  );
}
const st = StyleSheet.create({
  tile:  { borderWidth: BRUTAL.borderThin, borderRadius: BRUTAL.radius, padding: 14, flex: 1, minWidth: 90 },
  label: { fontFamily: F.monoSemi, fontSize: 9, letterSpacing: 1.2, marginBottom: 6 },
  value: { fontFamily: F.monoSemi, fontSize: 24 },
  unit:  { fontFamily: F.bodyReg, fontSize: 12 },
});

// ---------------------------------------------------------------------------
// makeWeekStripDays — helper to build WeekStripDay[] from a plan's schedule
// ---------------------------------------------------------------------------
const WEEKDAY_ABBR = ['M','T','W','T','F','S','S'];
const WEEKDAY_KEYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const TODAY_IDX = (() => {
  const d = new Date().getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
})();

export function makeWeekStripDays(
  weeklySchedule: Record<string, string>,
  completedSessionNames?: Set<string>,
  skippedSessionNames?: Set<string>,
): WeekStripDay[] {
  return WEEKDAY_KEYS.map((key, i) => {
    const label = weeklySchedule[key] ?? 'Rest';
    const isRest = label === 'Rest' || label === 'Active Rest';
    let status: DayStatus = 'upcoming';
    if (isRest) {
      status = 'rest';
    } else if (i === TODAY_IDX) {
      status = 'today';
    } else if (i < TODAY_IDX) {
      if (skippedSessionNames?.has(label)) status = 'skipped';
      else if (completedSessionNames?.has(label)) status = 'done';
      else status = 'upcoming';
    }
    return { abbr: WEEKDAY_ABBR[i], label, status };
  });
}
