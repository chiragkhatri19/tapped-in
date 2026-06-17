import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScoreRing } from './ScoreRing';
import type { SleepEntry } from '@/data/sleep-types';
import { SLEEP_TARGET_MIN } from '@/data/sleep-types';
import { formatClock, formatDuration } from '@/lib/sleep-utils';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { useColors } from '@/hooks/useColors';
import { BrutalButton } from '@/components/brutal';

interface Props {
  lastNight: SleepEntry | null;
  onEdit: (entry?: SleepEntry) => void;
  onLog: () => void;
}

export function SleepSummaryCard({ lastNight, onEdit, onLog }: Props) {
  const colors = useColors();
  const fill = lastNight ? Math.min(lastNight.durationMin / SLEEP_TARGET_MIN, 1) : 0;

  if (!lastNight) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
          no sleep logged for last night
        </Text>
        <BrutalButton
          label="log last night"
          onPress={onLog}
          variant="primary"
          height={44}
          style={{ alignSelf: 'flex-start' }}
        />
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={[styles.duration, { fontFamily: F.mono, color: colors.foreground }]}>
          {formatDuration(lastNight.durationMin)}
        </Text>
        <Text style={[styles.times, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
          {formatClock(lastNight.bedtime)} → {formatClock(lastNight.wakeTime)}
        </Text>
        {lastNight.quality != null && (
          <View style={styles.qualityRow}>
            {([1, 2, 3, 4, 5] as const).map((i) => (
              <View
                key={i}
                style={[
                  styles.qualityDot,
                  {
                    backgroundColor: i <= (lastNight.quality ?? 0) ? colors.violet : colors.muted,
                    borderColor: colors.foreground,
                  },
                ]}
              />
            ))}
          </View>
        )}
        {lastNight.source !== 'manual' && (
          <Text style={[styles.source, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
            via {lastNight.source === 'health_connect' ? 'health connect' : lastNight.source}
          </Text>
        )}
        <Pressable
          onPress={() => onEdit(lastNight)}
          style={[styles.editBtn, { borderColor: colors.foreground }]}
        >
          <Text style={{ fontFamily: F.bodyMed, fontSize: 11, color: colors.mutedForeground }}>edit</Text>
        </Pressable>
      </View>
      <ScoreRing fill={fill} color={colors.violet} size={72} centerLabel={`${Math.round(fill * 100)}%`} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  left: { flex: 1, gap: 5 },
  duration: { fontSize: 44, letterSpacing: -1.5, lineHeight: 48 },
  times: { fontSize: 13, lineHeight: 18 },
  qualityRow: { flexDirection: 'row', gap: 5, marginTop: 2 },
  qualityDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  source: { fontSize: 11, marginTop: 2 },
  editBtn: {
    alignSelf: 'flex-start',
    borderWidth: BRUTAL.borderThin,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  empty: { gap: 12 },
  emptyText: { fontSize: 14, lineHeight: 20 },
});
