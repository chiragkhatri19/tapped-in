// Shared weekly sets-per-muscle bars. Used by dashboard and manual builder.
// Collapsible when `collapsible={true}` — shows a summary line; tap to expand full bars.

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { VolumeBar } from '@/components/workout/ui';
import type { MuscleVolume } from '@/lib/workout-analytics';

interface Props {
  volumes: MuscleVolume[];
  /** When true the bars are hidden behind a summary line by default; tap to expand. */
  collapsible?: boolean;
  /** Override the default-collapsed state (only used when collapsible=true). */
  defaultExpanded?: boolean;
}

export default function VolumeBars({ volumes, collapsible = false, defaultExpanded = false }: Props) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (collapsible) {
    const dialedCount = volumes.filter(v => v.status === 'dialed').length;
    const total        = volumes.length;
    const hasJunk      = volumes.some(v => v.status === 'junk');
    const summaryColor = hasJunk ? colors.orange : dialedCount >= Math.ceil(total * 0.6) ? colors.teal : colors.mutedForeground;

    return (
      <View>
        <Pressable
          onPress={() => setExpanded(v => !v)}
          style={s.collapseRow}>
          <Text style={[s.summary, { color: summaryColor }]}>
            {dialedCount}/{total} muscles dialed
            {hasJunk ? '  · ⚠ junk volume detected' : ''}
          </Text>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.mutedForeground} />
        </Pressable>
        {expanded && (
          <View style={{ marginTop: 10 }}>
            {volumes.map(vol => <VolumeBar key={vol.group} vol={vol} />)}
          </View>
        )}
      </View>
    );
  }

  return (
    <View>
      {volumes.map(vol => <VolumeBar key={vol.group} vol={vol} />)}
    </View>
  );
}

const s = StyleSheet.create({
  collapseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summary:     { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 0.5 },
});
