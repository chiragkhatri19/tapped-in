/**
 * SessionOverview — pre-start screen before the workout begins.
 * Shows: session name, estimated duration, muscle breakdown,
 * full ordered exercise list with planned prescription,
 * any scheduled cardio block, then a single shadowLg "start workout" CTA.
 */

import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { withAlpha } from '@/constants/colors';
import { muscleColor } from '@/constants/muscles';
import { BrutalBox, BrutalButton, BrutalShadow } from '@/components/brutal';
import { SectionLabel } from '@/components/workout/ui';
import { Feather } from '@expo/vector-icons';

interface Exercise {
  name: string;
  muscleGroup: string;
  isCompound: boolean;
  isPriorityLift: boolean;
  sets: number;
  reps: string;
  restSeconds: number;
  plannedRir?: number;
  plannedTempo?: string;
}

interface CardioBlock {
  modality?: string;
  type?: string;
  durationMin: number;
  targetHRbpm: string;
  hrZone?: { label: string; bpmLow: number; bpmHigh: number };
}

interface Props {
  sessionName: string;
  exercises: Exercise[];
  estimatedDurationMin: number;
  musclesFocused: string[];
  cardioBlock: CardioBlock | null;
  topPad: number;
  bottomPad: number;
  onStart: () => void;
  onBack: () => void;
  /** If provided, a swap icon appears per exercise row; calls this with the index. */
  onSwapExercise?: (index: number) => void;
}

export default function SessionOverview({
  sessionName, exercises, estimatedDurationMin, musclesFocused,
  cardioBlock, topPad, bottomPad, onStart, onBack, onSwapExercise,
}: Props) {
  const colors = useColors();
  const totalSets = exercises.reduce((a, e) => a + (e.sets ?? 0), 0);

  // Pre-calculate cardio display values to prevent Babel optional-chaining/nullish-coalescing transpile crashes inside JSX
  const cardioModality = cardioBlock
    ? (cardioBlock.modality || cardioBlock.type || 'cardio')
    : '';
  const cardioPlanText = cardioBlock
    ? `${cardioBlock.durationMin} min${
        cardioBlock.hrZone
          ? ` · ${cardioBlock.hrZone.label} · ${cardioBlock.hrZone.bpmLow}-${cardioBlock.hrZone.bpmHigh} BPM`
          : ` · ${cardioBlock.targetHRbpm}`
      }`
    : '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[s.header, {
        paddingTop: topPad + 8,
        backgroundColor: colors.card,
        borderBottomWidth: BRUTAL.border,
        borderBottomColor: colors.foreground,
      }]}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[s.headerLabel, { color: colors.mutedForeground }]}>GET READY</Text>
          <Text style={[s.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{sessionName}</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: bottomPad + 140 }}
        showsVerticalScrollIndicator={false}>

        {/* Quick stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'DURATION', val: String(estimatedDurationMin), unit: 'min' },
            { label: 'EXERCISES', val: String(exercises.length), unit: '' },
            { label: 'TOTAL SETS', val: String(totalSets), unit: '' },
          ].map(stat => (
            <BrutalBox key={stat.label} style={{ flex: 1, padding: 12, alignItems: 'center' }} offset={BRUTAL.shadowSm}>
              <Text style={[s.statVal, { color: colors.foreground }]}>{stat.val}</Text>
              {stat.unit ? <Text style={[s.statUnit, { color: colors.mutedForeground }]}>{stat.unit}</Text> : null}
              <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </BrutalBox>
          ))}
        </View>

        {/* Muscles */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 22 }}>
          {musclesFocused.map(m => (
            <View key={m} style={[s.muscleTag, {
              borderColor: colors.foreground,
              backgroundColor: colors.muted,
            }]}>
              <View style={[s.muscleDot, { backgroundColor: muscleColor(m) }]} />
              <Text style={[s.muscleText, { color: colors.foreground }]}>{m}</Text>
            </View>
          ))}
        </View>

        {/* Exercise list */}
        <SectionLabel style={{ marginBottom: 10 }}>EXERCISES</SectionLabel>
        {exercises.map((ex, i) => (
          <View key={i} style={[s.exRow, {
            borderBottomColor: withAlpha(colors.foreground, 0.07),
            borderBottomWidth: i < exercises.length - 1 ? 1 : 0,
          }]}>
            <Text style={[s.exOrder, { color: colors.mutedForeground }]}>{String(i + 1).padStart(2, '0')}</Text>
            <View style={[s.exDot, { backgroundColor: muscleColor(ex.muscleGroup) }]} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={[s.exName, { color: colors.foreground }]} numberOfLines={1}>{ex.name}</Text>
                {ex.isPriorityLift && (
                  <Text style={[s.tagText, { color: colors.orange }]}>· first up</Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
                <Text style={[s.exMeta, { color: colors.mutedForeground }]}>{ex.sets}×{ex.reps}</Text>
                <Text style={[s.exMeta, { color: colors.mutedForeground }]}>·</Text>
                <Text style={[s.exMeta, { color: colors.mutedForeground }]}>{ex.restSeconds}s rest</Text>
                {ex.plannedRir != null && (
                  <>
                    <Text style={[s.exMeta, { color: colors.mutedForeground }]}>·</Text>
                    <Text style={[s.exMeta, { color: colors.violet }]}>RIR {ex.plannedRir}</Text>
                  </>
                )}
              </View>
            </View>
            {onSwapExercise && (
              <Pressable onPress={() => onSwapExercise(i)} hitSlop={10} style={s.swapBtn}>
                <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        ))}

        {/* Cardio block */}
        {cardioBlock ? (
          <View style={{ marginTop: 20 }}>
            <SectionLabel style={{ marginBottom: 10 }}>POST-WORKOUT CARDIO</SectionLabel>
            <View style={[s.cardioCard, {
              borderColor: colors.orange,
              backgroundColor: withAlpha(colors.orange, 0.06),
            }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Feather name="activity" size={14} color={colors.orange} />
                <Text style={[s.cardioModality, { color: colors.orange }]}>
                  {cardioModality}
                </Text>
              </View>
              <Text style={[s.cardioPlan, { color: colors.foreground }]}>
                {cardioPlanText}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Fixed CTA at the bottom */}
      <View style={[s.cta, {
        paddingBottom: bottomPad + 20,
        backgroundColor: colors.background,
        borderTopColor: withAlpha(colors.foreground, 0.08),
      }]}>
        <BrutalShadow offset={BRUTAL.shadowLg} style={{ marginHorizontal: 20 }}>
          <Pressable
            onPress={onStart}
            style={[s.startBtn, { backgroundColor: colors.primary, borderColor: colors.foreground }]}>
            <Text style={[s.startBtnText, { color: colors.primaryForeground }]}>start workout</Text>
            <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
          </Pressable>
        </BrutalShadow>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  headerLabel:  { fontFamily: F.monoSemi, fontSize: 9, letterSpacing: 1.2 },
  headerTitle:  { fontFamily: F.displayBold, fontSize: 22, fontStyle: 'italic', letterSpacing: -0.5 },
  statVal:      { fontFamily: F.monoSemi, fontSize: 22 },
  statUnit:     { fontFamily: F.bodyReg, fontSize: 11, marginTop: 1 },
  statLabel:    { fontFamily: F.monoSemi, fontSize: 8, letterSpacing: 0.8, marginTop: 3 },
  muscleTag:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: BRUTAL.borderThin, borderRadius: BRUTAL.radius, paddingHorizontal: 8, paddingVertical: 4 },
  muscleDot:    { width: 7, height: 7, borderRadius: 4 },
  muscleText:   { fontFamily: F.bodyMed, fontSize: 12 },
  exRow:        { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 8, minHeight: 52 },
  exOrder:      { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 0.5, marginTop: 2, width: 22 },
  exDot:        { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  exName:       { fontFamily: F.bodySemi, fontSize: 14 },
  exMeta:       { fontFamily: F.mono, fontSize: 11 },
  tagText:      { fontFamily: F.monoSemi, fontSize: 10 },
  cardioCard:   { borderWidth: 1.5, borderRadius: BRUTAL.radius, padding: 14 },
  cardioModality:{ fontFamily: F.bodySemi, fontSize: 14 },
  cardioPlan:   { fontFamily: F.mono, fontSize: 12, marginTop: 4 },
  cta:          { borderTopWidth: 1, paddingTop: 14 },
  startBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 58, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radiusLg },
  startBtnText: { fontFamily: F.bodyBold, fontSize: 17 },
  swapBtn:      { padding: 6, marginLeft: 4 },
});
