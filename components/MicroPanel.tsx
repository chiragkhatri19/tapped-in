import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { BrutalBox } from '@/components/brutal';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { MICRONUTRIENTS, normalizeMicros, type MicroDef, type MicroMap } from '@/data/micronutrients';

interface Props {
  values: MicroMap;
  inset?: boolean;
}

const GROUP_LABELS: Record<MicroDef['group'], string> = {
  mineral: 'minerals',
  vitamin: 'vitamins',
  fatty_acid: 'fatty acids',
};

const GROUPS: MicroDef['group'][] = ['mineral', 'vitamin', 'fatty_acid'];

export default function MicroPanel({ values, inset = true }: Props) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(true);
  const [expandedWarning, setExpandedWarning] = useState<string | null>(null);
  const safeValues = useMemo(() => normalizeMicros(values), [values]);

  const criticalCount = MICRONUTRIENTS.filter((def) => {
    const pct = def.rda > 0 ? (safeValues[def.key] ?? 0) / def.rda : 0;
    return def.kind === 'reach' ? pct < 0.3 : pct > 1;
  }).length;
  const visibleDefs = flaggedOnly
    ? MICRONUTRIENTS.filter((def) => isFlagged(def, safeValues[def.key] ?? 0))
    : MICRONUTRIENTS;

  return (
    <BrutalBox style={[styles.box, inset ? styles.inset : null]} offset={BRUTAL.shadow}>
      <Pressable onPress={() => setExpanded(v => !v)} style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.foreground }]}>micronutrients</Text>
            <View style={[styles.titleStroke, { backgroundColor: colors.highlight }]} />
          </View>
          {criticalCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.persimmon, borderColor: colors.foreground }]}>
              <Text style={styles.badgeText}>{criticalCount} low</Text>
            </View>
          )}
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.foreground} />
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          <View style={styles.filterRow}>
            <Text style={[styles.summary, { color: colors.mutedForeground }]}>
              {criticalCount > 0 ? `${criticalCount} nutrients need attention` : 'no major gaps flagged'}
            </Text>
            <Pressable onPress={() => setFlaggedOnly((v) => !v)} style={[styles.toggle, { borderColor: colors.foreground, backgroundColor: colors.background }]}>
              <Text style={[styles.toggleText, { color: colors.foreground }]}>{flaggedOnly ? 'show all' : 'flagged only'}</Text>
            </Pressable>
          </View>

          {GROUPS.map((group) => {
            const defs = visibleDefs.filter((def) => def.group === group);
            if (defs.length === 0) return null;
            return (
              <View key={group} style={styles.group}>
                <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{GROUP_LABELS[group]}</Text>
                {defs.map((def) => (
                  <MicroRow
                    key={def.key}
                    def={def}
                    value={safeValues[def.key] ?? 0}
                    showingWarning={expandedWarning === def.key}
                    onPress={() => setExpandedWarning(expandedWarning === def.key ? null : def.key)}
                  />
                ))}
              </View>
            );
          })}
          <Text style={[styles.footnote, { color: colors.mutedForeground }]}>tap any row to learn more. supplements count when checked off.</Text>
        </View>
      )}
    </BrutalBox>
  );
}

function isFlagged(def: MicroDef, val: number): boolean {
  const pct = def.rda > 0 ? val / def.rda : 0;
  return def.kind === 'ceiling' ? pct > 1 : pct < 0.6;
}

function MicroRow({ def, value, showingWarning, onPress }: {
  def: MicroDef;
  value: number;
  showingWarning: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const pctRaw = def.rda > 0 ? value / def.rda : 0;
  const pct = Math.min(1, pctRaw);
  const low = def.kind === 'reach' && pctRaw < 0.3;
  const over = def.kind === 'ceiling' && pctRaw > 1;
  const flagged = low || over;
  const rowColor = colors[def.colorKey] ?? colors.primary;
  const targetText = def.kind === 'ceiling' ? `<${def.rda}${def.unit}` : `/${def.rda}${def.unit}`;

  return (
    <View style={styles.microRow}>
      <Pressable onPress={onPress} style={styles.microRowInner}>
        <View style={styles.microLabelWrap}>
          <View style={[styles.dot, { backgroundColor: rowColor, borderColor: colors.foreground }]} />
          <Text style={[styles.microLabel, { color: colors.foreground }]}>{def.label}</Text>
          {flagged && <Ionicons name={over ? 'alert-circle' : 'alert-circle-outline'} size={13} color={colors.persimmon} />}
        </View>
        <View style={styles.microRight}>
          <Text style={[styles.microPct, { color: flagged ? colors.persimmon : colors.mutedForeground }]}>{Math.round(pctRaw * 100)}%</Text>
          <Text style={[styles.microVal, { color: flagged ? colors.persimmon : colors.foreground }]}>{value.toFixed(def.precision)}</Text>
          <Text style={[styles.microTarget, { color: colors.mutedForeground }]}>{targetText}</Text>
        </View>
      </Pressable>
      <View style={[styles.microBarBg, { backgroundColor: colors.background, borderColor: colors.foreground }]}>
        <View style={[styles.microBarFill, { width: `${pct * 100}%` as `${number}%`, backgroundColor: flagged ? colors.persimmon : rowColor }]} />
      </View>
      {showingWarning && (
        <View style={[styles.warningBox, { backgroundColor: colors.background, borderColor: colors.foreground }]}>
          <Text style={[styles.warningText, { color: colors.mutedForeground }]}>{def.warning}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
  inset: { marginHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  titleBlock: { gap: 2 },
  titleStroke: { height: 3, width: 56, borderRadius: 2 },
  title: { fontFamily: F.displayBold, fontSize: 17, fontStyle: 'italic' },
  badge: { borderWidth: 2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BRUTAL.radiusPill },
  badgeText: { fontFamily: F.monoSemi, fontSize: 11, color: '#FFFFFF' },
  body: { paddingHorizontal: 16, paddingBottom: 14 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 },
  summary: { fontFamily: F.bodyReg, fontSize: 12, flex: 1 },
  toggle: { borderWidth: 2, borderRadius: BRUTAL.radius, paddingHorizontal: 8, paddingVertical: 5 },
  toggleText: { fontFamily: F.bodyBold, fontSize: 11 },
  group: { marginTop: 8 },
  groupTitle: { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  microRow: { marginBottom: 12 },
  microRowInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5, gap: 8 },
  microLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  dot: { width: 12, height: 12, borderWidth: 2, borderRadius: BRUTAL.radiusPill },
  microLabel: { fontFamily: F.bodyMed, fontSize: 13 },
  microRight: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  microPct: { fontFamily: F.monoMed, fontSize: 10 },
  microVal: { fontFamily: F.monoSemi, fontSize: 13 },
  microTarget: { fontFamily: F.mono, fontSize: 11 },
  microBarBg: { height: 8, borderRadius: 2, borderWidth: 2, overflow: 'hidden' },
  microBarFill: { height: '100%' },
  warningBox: { marginTop: 6, padding: 10, borderRadius: BRUTAL.radius, borderWidth: 2 },
  warningText: { fontFamily: F.bodyReg, fontSize: 12, lineHeight: 17 },
  footnote: { fontFamily: F.bodyReg, fontSize: 11, marginTop: 4, textAlign: 'center' },
});
