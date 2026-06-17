import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BrutalButton } from '@/components/brutal';
import { EvidenceModal } from '@/components/EvidenceModal';
import { EvidenceButton } from '@/components/EvidenceButton';
import { getEvidenceById } from '@/data/evidence';
import type { EvidenceCard } from '@/types';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { useColors } from '@/hooks/useColors';

interface Props {
  onLog: () => void;
  onConnect: () => void;
}

const BULLETS = [
  { text: 'sleep is when muscle is actually built — growth hormone peaks during deep sleep', evidenceId: 'sleep_stages_recovery' },
  { text: 'your real daily steps directly update your calorie formula accuracy', evidenceId: 'steps_neat_variable' },
  { text: 'consistent bedtimes predict health outcomes more than total hours', evidenceId: 'sleep_consistency' },
];

export function EmptyRecovery({ onLog, onConnect }: Props) {
  const colors = useColors();
  const [activeCard, setActiveCard] = useState<EvidenceCard | null>(null);

  return (
    <>
      <View style={[styles.container, { borderColor: colors.foreground, backgroundColor: colors.card }]}>
        <Text style={[styles.headline, { fontFamily: F.displayBold, color: colors.foreground }]}>
          start your recovery story
        </Text>
        <Text style={[styles.sub, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
          log your first night or connect a tracker to unlock your recovery score.
        </Text>

        <View style={styles.bullets}>
          {BULLETS.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: colors.violet }]} />
              <Text style={[styles.bulletText, { fontFamily: F.bodyReg, color: colors.foreground }]}>
                {b.text}
              </Text>
              <EvidenceButton
                label=""
                onPress={() => {
                  const card = getEvidenceById(b.evidenceId);
                  if (card) setActiveCard(card);
                }}
              />
            </View>
          ))}
        </View>

        <View style={styles.ctaRow}>
          <BrutalButton
            label="log last night"
            onPress={onLog}
            variant="primary"
            height={48}
            style={{ flex: 1 }}
          />
          <BrutalButton
            label="connect tracker"
            onPress={onConnect}
            variant="secondary"
            height={48}
            style={{ flex: 1 }}
          />
        </View>
      </View>

      <EvidenceModal
        card={activeCard}
        visible={activeCard !== null}
        onClose={() => setActiveCard(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: BRUTAL.border,
    borderRadius: BRUTAL.radiusLg,
    padding: 22,
    gap: 16,
  },
  headline: { fontSize: 22, fontStyle: 'italic', letterSpacing: -0.6, lineHeight: 28 },
  sub: { fontSize: 14, lineHeight: 20 },
  bullets: { gap: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 19 },
  ctaRow: { flexDirection: 'row', gap: 10 },
});
