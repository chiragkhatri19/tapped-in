import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SleepEntry, SLEEP_TARGET_MIN } from '@/data/sleep-types';
import { averageDurationMin, sleepDebtMin, bedtimeConsistency, formatDuration } from '@/lib/sleep-utils';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { useColors } from '@/hooks/useColors';

const BAR_MAX_HEIGHT = 80;
const DAYS = 7;
const DAY_LABELS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

interface SleepDashboardProps {
  entries: (SleepEntry | null)[];
  onSelectEntry: (dateKey: string, entry: SleepEntry | null) => void;
}

export function SleepDashboard({ entries, onSelectEntry }: SleepDashboardProps) {
  const colors = useColors();

  const maxMin = entries.reduce((max, e) => {
    if (!e) return max;
    return e.durationMin > max ? e.durationMin : max;
  }, SLEEP_TARGET_MIN);

  const avg = averageDurationMin(entries);
  const debt = sleepDebtMin(entries, DAYS, SLEEP_TARGET_MIN);
  const consistency = bedtimeConsistency(entries);

  const today = new Date();
  const dateKeys: string[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dateKeys.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    );
  }

  return (
    <View>
      <Text style={[styles.sectionTitle, { fontFamily: F.displayBold, color: colors.foreground }]}>
        7-day recovery
      </Text>

      <View style={styles.barsRow}>
        {entries.map((entry, idx) => {
          const heightFraction = entry ? Math.min(entry.durationMin / maxMin, 1) : 0;
          const barHeight = Math.max(4, BAR_MAX_HEIGHT * heightFraction);
          const atTarget = entry ? entry.durationMin >= SLEEP_TARGET_MIN : false;
          const dayLabel = DAY_LABELS[new Date(dateKeys[idx]).getDay()];
          const isToday = idx === DAYS - 1;

          return (
            <Pressable key={idx} style={styles.barWrapper} onPress={() => onSelectEntry(dateKeys[idx], entry)}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.targetLine,
                    { bottom: (SLEEP_TARGET_MIN / maxMin) * BAR_MAX_HEIGHT, backgroundColor: colors.mutedForeground },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: atTarget ? colors.violet : entry ? colors.orange : colors.muted,
                      borderColor: colors.foreground,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.dayLabel,
                  { fontFamily: isToday ? F.bodySemi : F.bodyReg, color: isToday ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {dayLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.statsRow}>
        <StatTile label="avg sleep" value={avg > 0 ? formatDuration(avg) : '--'} colors={colors} />
        <StatTile label="sleep debt" value={debt > 0 ? formatDuration(debt) : 'none'} colors={colors} />
        <StatTile label="bedtime" value={consistency.label} isMono={false} colors={colors} />
      </View>
    </View>
  );
}

interface StatTileProps {
  label: string;
  value: string;
  isMono?: boolean;
  colors: ReturnType<typeof useColors>;
}

function StatTile({ label, value, isMono = true, colors }: StatTileProps) {
  return (
    <View style={[styles.statTile, { borderColor: colors.foreground, backgroundColor: colors.background }]}>
      <Text style={[styles.statValue, { fontFamily: isMono ? F.monoSemi : F.bodySemi, color: colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 17, fontStyle: 'italic', letterSpacing: -0.4, marginBottom: 16 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 16 },
  barWrapper: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { width: '100%', height: BAR_MAX_HEIGHT, justifyContent: 'flex-end', position: 'relative' },
  targetLine: { position: 'absolute', left: 0, right: 0, height: 1, opacity: 0.4 },
  bar: { width: '100%', borderWidth: BRUTAL.borderThin, borderRadius: 4 },
  dayLabel: { fontSize: 10, textTransform: 'lowercase' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statTile: { flex: 1, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, padding: 10, gap: 2 },
  statValue: { fontSize: 13, letterSpacing: -0.3 },
  statLabel: { fontSize: 10 },
});
