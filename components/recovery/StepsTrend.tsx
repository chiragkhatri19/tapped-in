import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { StepEntry } from '@/data/steps-types';
import { STEPS_TARGET } from '@/data/steps-types';
import { averageSteps, formatSteps } from '@/lib/steps-utils';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { useColors } from '@/hooks/useColors';

const BAR_MAX_HEIGHT = 60;
const DAYS = 7;
const DAY_LABELS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

interface Props {
  entries: (StepEntry | null)[];
}

export function StepsTrend({ entries }: Props) {
  const colors = useColors();

  const maxSteps = entries.reduce((max, e) => {
    if (!e) return max;
    return e.steps > max ? e.steps : max;
  }, STEPS_TARGET);

  const avg = averageSteps(entries);

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
      <Text style={[styles.title, { fontFamily: F.displayBold, color: colors.foreground }]}>
        7-day steps
      </Text>
      <View style={styles.barsRow}>
        {entries.map((entry, idx) => {
          const heightFraction = entry ? Math.min(entry.steps / maxSteps, 1) : 0;
          const barHeight = Math.max(3, BAR_MAX_HEIGHT * heightFraction);
          const atTarget = entry ? entry.steps >= STEPS_TARGET : false;
          const dayLabel = DAY_LABELS[new Date(dateKeys[idx]).getDay()];
          const isToday = idx === DAYS - 1;

          return (
            <View key={idx} style={styles.barWrapper}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.targetLine,
                    { bottom: (STEPS_TARGET / maxSteps) * BAR_MAX_HEIGHT, backgroundColor: colors.mutedForeground },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: atTarget ? colors.teal : entry ? colors.violet : colors.muted,
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
            </View>
          );
        })}
      </View>
      {avg > 0 && (
        <View style={[styles.avgTile, { borderColor: colors.foreground, backgroundColor: colors.background }]}>
          <Text style={[styles.avgValue, { fontFamily: F.monoSemi, color: colors.foreground }]}>
            {formatSteps(avg)}
          </Text>
          <Text style={[styles.avgLabel, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
            7-day avg
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 15, fontStyle: 'italic', letterSpacing: -0.4, marginBottom: 14 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  barWrapper: { flex: 1, alignItems: 'center', gap: 5 },
  barTrack: { width: '100%', height: BAR_MAX_HEIGHT, justifyContent: 'flex-end', position: 'relative' },
  targetLine: { position: 'absolute', left: 0, right: 0, height: 1, opacity: 0.4 },
  bar: { width: '100%', borderWidth: BRUTAL.borderThin, borderRadius: 4 },
  dayLabel: { fontSize: 10, textTransform: 'lowercase' },
  avgTile: { borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, padding: 10, gap: 2, alignSelf: 'flex-start', minWidth: 80 },
  avgValue: { fontSize: 13, letterSpacing: -0.3 },
  avgLabel: { fontSize: 10 },
});
