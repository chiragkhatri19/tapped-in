import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScoreRing } from './ScoreRing';
import { EvidenceModal } from '@/components/EvidenceModal';
import { getEvidenceById } from '@/data/evidence';
import type { RecoveryScore } from '@/lib/recovery-engine';
import { recoveryBandColor } from '@/lib/recovery-engine';
import { F } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';

interface Props {
  score: RecoveryScore;
}

export function RecoveryScoreHero({ score }: Props) {
  const colors = useColors();
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const fill = score.score / 100;
  const ringColor = recoveryBandColor(score.band, colors);

  const evidenceCard = evidenceId ? getEvidenceById(evidenceId) ?? null : null;

  return (
    <>
      <View style={styles.row}>
        <ScoreRing
          fill={fill}
          color={ringColor}
          size={88}
          centerLabel={`${score.score}`}
          centerSublabel="/ 100"
        />
        <View style={styles.info}>
          <View style={[styles.bandChip, { backgroundColor: ringColor, borderColor: colors.foreground }]}>
            <Text style={[styles.bandText, { fontFamily: F.bodySemi, color: '#fff' }]}>
              {score.band}
            </Text>
          </View>
          <Text style={[styles.driver, { fontFamily: F.bodyMed, color: colors.foreground }]}>
            {score.driver}
          </Text>
          {score.score > 0 && (
            <View style={styles.evidenceRow}>
              <Pressable
                onPress={() => setEvidenceId(score.hasFullData ? 'sleep_stages_recovery' : 'sleep_duration_target')}
                style={({ pressed }) => [styles.evidenceBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '15', opacity: pressed ? 0.75 : 1 }]}
              >
                <Feather name="book-open" size={11} color={colors.primary} />
                <Text style={[styles.evidenceBtnText, { fontFamily: F.bodyMed, color: colors.primary }]}>
                  why?
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
      {score.score > 0 && score.score < 55 && (
        <Text style={[styles.nudge, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
          {score.components.duration < 0.65
            ? 'aim for 7–9h tonight to boost your score'
            : 'keep a consistent bedtime to improve recovery'}
        </Text>
      )}
      <EvidenceModal
        card={evidenceCard}
        visible={evidenceCard !== null}
        onClose={() => setEvidenceId(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  info: { flex: 1, gap: 6 },
  bandChip: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bandText: { fontSize: 11, letterSpacing: 0.4 },
  driver: { fontSize: 14, lineHeight: 20, letterSpacing: -0.2 },
  evidenceRow: { flexDirection: 'row' },
  evidenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  evidenceBtnText: { fontSize: 11 },
  nudge: { fontSize: 12, lineHeight: 18, marginTop: 8 },
});
