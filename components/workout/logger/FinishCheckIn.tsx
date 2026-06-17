/**
 * FinishCheckIn — post-workout summary + check-in screen.
 * Called once all exercises are done (or user ends early).
 * Fires haptic.success() on mount.
 */

import React, { useEffect } from 'react';
import {
  View, Text, Pressable, TextInput, ScrollView, Platform,
  KeyboardAvoidingView, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { withAlpha } from '@/constants/colors';
import { BrutalBox, BrutalButton } from '@/components/brutal';
import { SectionLabel, StatTile } from '@/components/workout/ui';
import { haptic } from '@/lib/haptics';

interface CardioBlock {
  modality?: string;
  type?: string;
  durationMin: number;
  targetHRbpm: string;
  hrZone?: { label: string; bpmLow: number; bpmHigh: number };
  evidenceId?: string;
}

interface CheckInState {
  feelingRating: number | null;
  energyLevel: number | null;
  sleepHours: string;
  sessionNotes: string;
  cardioCompleted: boolean | null;
  cardioMinutes: string;
  cardioAvgHR: string;
}

interface Props {
  sessionName: string;
  durationMinutes: number;
  totalSets: number;
  totalVolumeKg: number;
  prsCount: number;
  cardioBlock: CardioBlock | null;
  state: CheckInState;
  onChange: (patch: Partial<CheckInState>) => void;
  onSave: () => void;
  topPad: number;
  bottomPad: number;
}

export default function FinishCheckIn({
  sessionName, durationMinutes, totalSets, totalVolumeKg, prsCount,
  cardioBlock, state, onChange, onSave, topPad, bottomPad,
}: Props) {
  const colors = useColors();

  useEffect(() => {
    haptic.success();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: topPad + 20, paddingBottom: bottomPad + 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Hero */}
          <Text style={[s.hero, { color: colors.foreground }]}>session{'\n'}done.</Text>
          <Text style={[s.sessionName, { color: colors.mutedForeground }]}>{sessionName}</Text>

          {/* Stats grid */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 32 }}>
            <StatTile label="DURATION" value={String(durationMinutes)} unit="min" style={{ flex: 1 }} />
            <StatTile label="SETS" value={String(totalSets)} style={{ flex: 1 }} />
            <StatTile label="VOLUME" value={Math.round(totalVolumeKg).toLocaleString()} unit="kg" style={{ flex: 1 }} />
            {prsCount > 0 && (
              <StatTile label="PRs" value={String(prsCount)} accent={colors.highlight} style={{ flex: 1 }} />
            )}
          </View>

          {/* Check-in */}
          <SectionLabel style={{ marginBottom: 10 }}>HOW DID YOU FEEL?</SectionLabel>

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            {['😞', '😐', '🙂', '😃', '🤩'].map((emoji, index) => {
              const rating = index + 1;
              const sel = state.feelingRating === rating;
              return (
                <Pressable
                  key={rating}
                  onPress={() => onChange({ feelingRating: rating })}
                  style={[s.emojiBtn, {
                    borderColor: sel ? colors.violet : colors.foreground,
                    backgroundColor: sel ? withAlpha(colors.violet, 0.12) : colors.card,
                  }]}>
                  <Text style={{ fontSize: 28 }}>{emoji}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Cardio block */}
          {cardioBlock && (
            <View style={[s.cardioBox, {
              borderColor: colors.foreground,
              borderLeftColor: colors.orange,
              backgroundColor: colors.card,
              marginTop: 12,
              marginBottom: 12,
            }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Feather name="activity" size={14} color={colors.orange} />
                <Text style={[s.cardioTitle, { color: colors.foreground }]}>post-workout cardio</Text>
              </View>
              <Text style={[s.cardioPlan, { color: colors.mutedForeground }]}>
                {cardioBlock.modality ?? cardioBlock.type ?? 'cardio'} · {cardioBlock.durationMin} min
              </Text>
              {cardioBlock.hrZone ? (
                <Text style={[s.cardioHR, { color: colors.orange }]}>
                  target: {cardioBlock.hrZone.label} · {cardioBlock.hrZone.bpmLow}-{cardioBlock.hrZone.bpmHigh} BPM
                </Text>
              ) : (
                <Text style={[s.cardioHR, { color: colors.mutedForeground }]}>target: {cardioBlock.targetHRbpm}</Text>
              )}

              {/* Done / skipped toggle */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 8 }}>
                {([
                  { key: true as boolean, label: 'done', col: colors.teal },
                  { key: false as boolean, label: 'skipped', col: colors.persimmon },
                ] as { key: boolean; label: string; col: string }[]).map(opt => (
                  <Pressable key={String(opt.key)} onPress={() => onChange({ cardioCompleted: opt.key })}
                    style={[s.cardioToggle, {
                      borderColor: state.cardioCompleted === opt.key ? opt.col : colors.foreground,
                      backgroundColor: state.cardioCompleted === opt.key ? withAlpha(opt.col, 0.12) : colors.background,
                    }]}>
                    <Text style={[s.cardioToggleText, { color: state.cardioCompleted === opt.key ? opt.col : colors.foreground }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {state.cardioCompleted && (
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardioFieldLabel, { color: colors.mutedForeground }]}>MINUTES DONE</Text>
                    <TextInput
                      value={state.cardioMinutes}
                      onChangeText={v => onChange({ cardioMinutes: v })}
                      keyboardType="numeric"
                      placeholder="30"
                      placeholderTextColor={withAlpha(colors.mutedForeground, 0.5)}
                      style={[s.cardioInput, { backgroundColor: colors.background, borderColor: colors.foreground, color: colors.foreground }]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardioFieldLabel, { color: colors.mutedForeground }]}>AVG HR (BPM)</Text>
                    <TextInput
                      value={state.cardioAvgHR}
                      onChangeText={v => onChange({ cardioAvgHR: v })}
                      keyboardType="numeric"
                      placeholder="115"
                      placeholderTextColor={withAlpha(colors.mutedForeground, 0.5)}
                      style={[s.cardioInput, { backgroundColor: colors.background, borderColor: colors.foreground, color: colors.foreground }]}
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Save */}
          <BrutalButton
            label="save workout"
            variant="primary"
            height={60}
            style={{ marginTop: 28 }}
            onPress={onSave}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  hero:         { fontFamily: F.displayBold, fontSize: 52, fontStyle: 'italic', letterSpacing: -2, lineHeight: 54 },
  sessionName:  { fontFamily: F.bodyMed, fontSize: 14, marginTop: 4 },
  checkInSub:   { fontFamily: F.bodyReg, fontSize: 13, marginBottom: 16 },
  ratingBtn:    { flex: 1, height: 46, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, alignItems: 'center', justifyContent: 'center' },
  emojiBtn:     { flex: 1, height: 60, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, alignItems: 'center', justifyContent: 'center' },
  ratingBtnText:{ fontFamily: F.monoSemi, fontSize: 16 },
  sleepInput:   { width: 80, height: 48, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, textAlign: 'center', fontFamily: F.mono, fontSize: 18 },
  sleepLabel:   { fontFamily: F.bodyReg, fontSize: 14 },
  cardioBox:    { borderWidth: BRUTAL.border, borderLeftWidth: 4, borderRadius: BRUTAL.radiusLg, padding: 16 },
  cardioTitle:  { fontFamily: F.bodySemi, fontSize: 15 },
  cardioPlan:   { fontFamily: F.bodyMed, fontSize: 13, marginBottom: 2 },
  cardioHR:     { fontFamily: F.mono, fontSize: 12 },
  cardioToggle: { flex: 1, height: 40, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, alignItems: 'center', justifyContent: 'center' },
  cardioToggleText: { fontFamily: F.bodySemi, fontSize: 13 },
  cardioFieldLabel: { fontFamily: F.monoSemi, fontSize: 9, letterSpacing: 0.8, marginBottom: 6 },
  cardioInput:  { height: 44, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, textAlign: 'center', fontFamily: F.mono, fontSize: 16 },
  notesInput:   { borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, padding: 14, fontFamily: F.bodyReg, fontSize: 13, minHeight: 80, textAlignVertical: 'top' },
});
