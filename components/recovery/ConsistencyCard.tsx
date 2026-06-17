import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EvidenceModal } from '@/components/EvidenceModal';
import { getEvidenceById } from '@/data/evidence';
import type { SleepEntry } from '@/data/sleep-types';
import { bedtimeConsistency } from '@/lib/sleep-utils';
import { F } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';

interface Props {
  recent7: (SleepEntry | null)[];
}

export function ConsistencyCard({ recent7 }: Props) {
  const colors = useColors();
  const [showEvidence, setShowEvidence] = useState(false);
  const evidenceCard = getEvidenceById('sleep_consistency') ?? null;

  const validCount = recent7.filter(Boolean).length;

  if (validCount < 2) {
    return (
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={[styles.label, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>bedtime consistency</Text>
          <Text style={[styles.value, { fontFamily: F.bodySemi, color: colors.mutedForeground }]}>
            needs 2+ nights
          </Text>
        </View>
        <Pressable onPress={() => setShowEvidence(true)} style={[styles.evidenceBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '15' }]}>
          <Feather name="book-open" size={11} color={colors.primary} />
        </Pressable>
        <EvidenceModal card={evidenceCard} visible={showEvidence} onClose={() => setShowEvidence(false)} />
      </View>
    );
  }

  const consistency = bedtimeConsistency(recent7);
  const labelColor =
    consistency.label === 'rock solid' ? colors.teal
    : consistency.label === 'tight' ? colors.violet
    : consistency.label === 'ok' ? colors.orange
    : colors.mutedForeground;

  return (
    <>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={[styles.label, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>bedtime consistency</Text>
          <Text style={[styles.value, { fontFamily: F.bodySemi, color: labelColor }]}>
            {consistency.label}
          </Text>
          <Text style={[styles.sub, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
            ±{consistency.variminutes} min variance
          </Text>
        </View>
        <Pressable onPress={() => setShowEvidence(true)} style={[styles.evidenceBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '15' }]}>
          <Feather name="book-open" size={11} color={colors.primary} />
          <Text style={[styles.evidenceBtnText, { fontFamily: F.bodyMed, color: colors.primary }]}>why?</Text>
        </Pressable>
      </View>
      <EvidenceModal card={evidenceCard} visible={showEvidence} onClose={() => setShowEvidence(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  left: { flex: 1, gap: 3 },
  label: { fontSize: 12 },
  value: { fontSize: 16, letterSpacing: -0.3 },
  sub: { fontSize: 12 },
  evidenceBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginTop: 2 },
  evidenceBtnText: { fontSize: 11 },
});
