import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SleepEntry } from '@/data/sleep-types';
import { SLEEP_TARGET_MIN } from '@/data/sleep-types';
import { sleepDebtMin, formatDuration } from '@/lib/sleep-utils';
import { F } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';

const DAYS = 7;

interface Props {
  recent7: (SleepEntry | null)[];
}

export function SleepDebtCard({ recent7 }: Props) {
  const colors = useColors();
  const debt = sleepDebtMin(recent7, DAYS, SLEEP_TARGET_MIN);
  const validCount = recent7.filter(Boolean).length;

  const debtColor = debt === 0 ? colors.teal : debt < 120 ? colors.orange : colors.foreground;

  return (
    <View style={styles.row}>
      <View style={styles.item}>
        <Text style={[styles.value, { fontFamily: F.monoSemi, color: debtColor }]}>
          {debt > 0 ? formatDuration(debt) : 'none'}
        </Text>
        <Text style={[styles.label, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
          7-day sleep debt
        </Text>
      </View>
      {validCount > 0 && (
        <View style={styles.item}>
          <Text style={[styles.value, { fontFamily: F.monoSemi, color: colors.foreground }]}>
            {validCount}/7
          </Text>
          <Text style={[styles.label, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
            nights logged
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 24 },
  item: { gap: 2 },
  value: { fontSize: 20, letterSpacing: -0.5 },
  label: { fontSize: 11 },
});
