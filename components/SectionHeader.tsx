import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { F } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';

interface SectionHeaderProps {
  label: string;
  /** Optional right-side element (e.g. a CTA chip or "see all" link) */
  right?: React.ReactNode;
  /** Extra top margin. Default 0. */
  mt?: number;
}

/**
 * Canonical section label — 11px Geist Mono SemiBold, uppercase, +1.2 tracking.
 * Use for every section heading across the app. Never re-implement inline.
 */
export function SectionHeader({ label, right, mt = 0 }: SectionHeaderProps) {
  const colors = useColors();
  return (
    <View style={[styles.row, { marginTop: mt }]}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {label.toUpperCase()}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: F.monoSemi,
    fontSize: 11,
    letterSpacing: 1.2,
  },
});
