import React, { useState } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { F } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';

interface SleepScienceCardProps {
  onPress?: () => void;
}

const CITATION = {
  title: 'Sleep and muscle recovery: endocrinological and molecular basis for a new and promising hypothesis',
  authors: 'Dattilo M, Antunes HK, Medeiros A, et al.',
  year: 2011,
  journal: 'Medical Hypotheses',
  doi: '10.1016/j.mehy.2011.01.018',
};

export function SleepScienceCard({ onPress }: SleepScienceCardProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  const handlePress = () => {
    setExpanded((v) => !v);
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: colors.teal, borderColor: colors.foreground }]}>
          <Text style={[styles.badgeText, { fontFamily: F.bodySemi, color: '#111111' }]}>HIGH</Text>
        </View>
        <Text style={[styles.category, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
          recovery
        </Text>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.mutedForeground}
          style={{ marginLeft: 'auto' }}
        />
      </View>

      <Text style={[styles.claim, { fontFamily: F.bodyBold, color: colors.foreground }]}>
        sleep is when muscle is actually built
      </Text>

      <Text style={[styles.explanation, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
        during deep sleep, the body releases growth hormone and testosterone at their daily peak,
        driving protein synthesis and tissue repair. cut sleep short and you cut recovery short.
      </Text>

      {expanded && (
        <View style={[styles.citationBox, { borderColor: colors.muted, backgroundColor: colors.muted }]}>
          <Text style={[styles.citationTitle, { fontFamily: F.bodySemi, color: colors.foreground }]}>
            {CITATION.title}
          </Text>
          <Text style={[styles.citationMeta, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
            {CITATION.authors} ({CITATION.year})
          </Text>
          <Text style={[styles.citationMeta, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
            {CITATION.journal} · doi:{CITATION.doi}
          </Text>
        </View>
      )}

      {!expanded && (
        <Text style={[styles.tapHint, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
          tap to read citation
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  badge: { borderWidth: 2, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontSize: 10, letterSpacing: 0.5 },
  category: { fontSize: 12, textTransform: 'lowercase' },
  claim: { fontSize: 15, lineHeight: 22, marginBottom: 8, letterSpacing: -0.2 },
  explanation: { fontSize: 13, lineHeight: 20, marginBottom: 10 },
  citationBox: { borderRadius: 8, borderWidth: 1, padding: 12, gap: 4, marginBottom: 4 },
  citationTitle: { fontSize: 12, lineHeight: 18 },
  citationMeta: { fontSize: 11, lineHeight: 16 },
  tapHint: { fontSize: 11 },
});
