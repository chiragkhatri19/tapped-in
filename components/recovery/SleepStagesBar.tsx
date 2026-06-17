import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EvidenceModal } from '@/components/EvidenceModal';
import { getEvidenceById } from '@/data/evidence';
import type { SleepEntry } from '@/data/sleep-types';
import { hasStages } from '@/lib/sleep-utils';
import { F } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';

interface Props {
  entry: SleepEntry;
}

interface StageRow {
  label: string;
  mins: number;
  color: string;
}

export function SleepStagesBar({ entry }: Props) {
  const colors = useColors();
  const [showEvidence, setShowEvidence] = useState(false);
  const evidenceCard = getEvidenceById('sleep_stages_recovery') ?? null;

  if (!hasStages(entry)) return null;

  const deep = entry.deepMin ?? 0;
  const rem = entry.remMin ?? 0;
  const light = entry.lightMin ?? 0;
  const awake = entry.awakeMin ?? 0;
  const total = deep + rem + light + awake;
  if (total === 0) return null;

  const stages: StageRow[] = [
    { label: 'deep', mins: deep, color: colors.violet },
    { label: 'rem', mins: rem, color: colors.primary },
    { label: 'light', mins: light, color: colors.teal },
    { label: 'awake', mins: awake, color: colors.muted },
  ];

  function fmtMins(m: number): string {
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h === 0) return `${min}m`;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
  }

  return (
    <>
      <View style={styles.header}>
        <Text style={[styles.title, { fontFamily: F.displayBold, color: colors.foreground }]}>
          sleep stages
        </Text>
        <Pressable onPress={() => setShowEvidence(true)} style={[styles.evidenceBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '15' }]}>
          <Feather name="book-open" size={11} color={colors.primary} />
          <Text style={[styles.evidenceBtnText, { fontFamily: F.bodyMed, color: colors.primary }]}>why?</Text>
        </Pressable>
      </View>

      {/* Stacked bar */}
      <View style={styles.barContainer}>
        {stages.filter(s => s.mins > 0).map((stage) => (
          <View
            key={stage.label}
            style={[
              styles.segment,
              { flex: stage.mins / total, backgroundColor: stage.color },
            ]}
          />
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {stages.map((stage) => (
          <View key={stage.label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: stage.color }]} />
            <View>
              <Text style={[styles.legendLabel, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
                {stage.label}
              </Text>
              <Text style={[styles.legendValue, { fontFamily: F.monoSemi, color: colors.foreground }]}>
                {fmtMins(stage.mins)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {entry.restingHeartRate && (
        <Text style={[styles.hrNote, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
          resting HR: <Text style={{ fontFamily: F.monoSemi, color: colors.foreground }}>{entry.restingHeartRate} bpm</Text>
        </Text>
      )}

      <EvidenceModal card={evidenceCard} visible={showEvidence} onClose={() => setShowEvidence(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 15, fontStyle: 'italic', letterSpacing: -0.4 },
  evidenceBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  evidenceBtnText: { fontSize: 11 },
  barContainer: { flexDirection: 'row', height: 18, borderRadius: 6, overflow: 'hidden', marginBottom: 14, gap: 2 },
  segment: { borderRadius: 3 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11 },
  legendValue: { fontSize: 13, letterSpacing: -0.3 },
  hrNote: { fontSize: 12, marginTop: 10 },
});
