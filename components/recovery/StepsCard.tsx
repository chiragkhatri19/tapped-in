import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScoreRing } from './ScoreRing';
import { EvidenceModal } from '@/components/EvidenceModal';
import { getEvidenceById } from '@/data/evidence';
import type { StepEntry } from '@/data/steps-types';
import { STEPS_TARGET } from '@/data/steps-types';
import { formatSteps } from '@/lib/steps-utils';
import { F } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { BrutalButton } from '@/components/brutal';
import { Feather } from '@expo/vector-icons';
import { Pressable } from 'react-native';

interface Props {
  today: StepEntry | null;
  connected: boolean;
  onConnect: () => void;
}

export function StepsCard({ today, connected, onConnect }: Props) {
  const colors = useColors();
  const [showEvidence, setShowEvidence] = useState(false);
  const evidenceCard = getEvidenceById('steps_neat_variable') ?? null;

  const fill = today ? Math.min(today.steps / STEPS_TARGET, 1) : 0;
  const pct = Math.round(fill * 100);

  if (!today && !connected) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyHeader}>
          <Feather name="activity" size={16} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { fontFamily: F.bodySemi, color: colors.mutedForeground }]}>
            steps
          </Text>
        </View>
        <Text style={[styles.emptyText, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
          connect a tracker to see daily steps and improve your calorie formula accuracy
        </Text>
        <View style={styles.bottomRow}>
          <BrutalButton
            label="connect tracker"
            onPress={onConnect}
            variant="secondary"
            height={40}
            style={{ alignSelf: 'flex-start' }}
          />
          <Pressable
            onPress={() => setShowEvidence(true)}
            style={[styles.evidenceBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '15' }]}
          >
            <Feather name="book-open" size={11} color={colors.primary} />
            <Text style={[styles.evidenceBtnText, { fontFamily: F.bodyMed, color: colors.primary }]}>why?</Text>
          </Pressable>
        </View>
        <EvidenceModal card={evidenceCard} visible={showEvidence} onClose={() => setShowEvidence(false)} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={[styles.label, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>steps today</Text>
          <Text style={[styles.steps, { fontFamily: F.mono, color: colors.foreground }]}>
            {today ? formatSteps(today.steps) : '—'}
          </Text>
          <Text style={[styles.goal, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
            goal: {formatSteps(STEPS_TARGET)}
          </Text>
          {today?.distanceM && today.distanceM > 0 && (
            <Text style={[styles.chip, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
              {(today.distanceM / 1000).toFixed(1)} km
            </Text>
          )}
          {today?.activeCalories && today.activeCalories > 0 && (
            <Text style={[styles.chip, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
              {Math.round(today.activeCalories)} active kcal
            </Text>
          )}
          <Pressable
            onPress={() => setShowEvidence(true)}
            style={[styles.evidenceBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '15', marginTop: 6 }]}
          >
            <Feather name="book-open" size={11} color={colors.primary} />
            <Text style={[styles.evidenceBtnText, { fontFamily: F.bodyMed, color: colors.primary }]}>steps + neat</Text>
          </Pressable>
        </View>
        <ScoreRing
          fill={fill}
          color={pct >= 100 ? colors.teal : pct >= 60 ? colors.violet : colors.orange}
          size={72}
          centerLabel={`${pct}%`}
        />
      </View>
      <EvidenceModal card={evidenceCard} visible={showEvidence} onClose={() => setShowEvidence(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  left: { flex: 1, gap: 4 },
  label: { fontSize: 12 },
  steps: { fontSize: 40, letterSpacing: -1.5, lineHeight: 44 },
  goal: { fontSize: 12 },
  chip: { fontSize: 12 },
  evidenceBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  evidenceBtnText: { fontSize: 11 },
  empty: { gap: 10 },
  emptyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 13 },
  emptyText: { fontSize: 13, lineHeight: 19 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
});
