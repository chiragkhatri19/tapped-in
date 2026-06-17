/**
 * SetRow — one set within an exercise.
 * Features:
 *  - Set badge cycles type: normal → warmup → drop → failure (tap)
 *  - Previous ghost value (tap to autofill)
 *  - kg + reps inputs (autofills from previous set on mount)
 *  - Checkmark to complete (triggers haptic + rest timer)
 *  - Inline optional RPE row (appears after working set is done)
 *  - Swipe left to delete (via react-native-gesture-handler)
 */

import React, { useRef } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, runOnJS,
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { withAlpha } from '@/constants/colors';

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

export interface SetRowData {
  setNumber: number;
  setType: SetType;
  weightKg: string;
  reps: string;
  rpe: number | null;
  completedAt: string | null;
  isPR: boolean;
}

interface Props {
  set: SetRowData;
  exIdx: number;
  setIdx: number;
  prevGhost: string | null;         // e.g. "62×8" from last session
  onTypeChange: (exIdx: number, setIdx: number, type: SetType) => void;
  onWeightChange: (exIdx: number, setIdx: number, v: string) => void;
  onRepsChange: (exIdx: number, setIdx: number, v: string) => void;
  onComplete: (exIdx: number, setIdx: number) => void;
  onRPE: (exIdx: number, setIdx: number, rpe: number) => void;
  onDelete: (exIdx: number, setIdx: number) => void;
  onAutofill: (exIdx: number, setIdx: number) => void;
}

const TYPE_CYCLE: Record<SetType, SetType> = {
  normal: 'warmup',
  warmup: 'drop',
  drop:   'failure',
  failure:'normal',
};

const TYPE_LABEL: Record<SetType, string> = {
  normal: '',      // shown as set number
  warmup: 'W',
  drop:   'D',
  failure:'F',
};

const RPE_LABELS: Record<number, string> = {
  6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
};

export default function SetRow({
  set, exIdx, setIdx, prevGhost,
  onTypeChange, onWeightChange, onRepsChange, onComplete, onRPE, onDelete, onAutofill,
}: Props) {
  const colors = useColors();
  const isDone = set.completedAt !== null;
  const isWarmup = set.setType === 'warmup';
  const isDrop = set.setType === 'drop';
  const isFailure = set.setType === 'failure';
  const swipeRef = useRef<Swipeable>(null);

  const badgeBg = isDone
    ? colors.teal
    : isWarmup  ? colors.orange
    : isDrop    ? colors.violet
    : isFailure ? colors.persimmon
    : 'transparent';

  const badgeBorder = isDone
    ? colors.teal
    : isWarmup  ? colors.orange
    : isDrop    ? colors.violet
    : isFailure ? colors.persimmon
    : withAlpha(colors.foreground, 0.22);

  const badgeTextColor = isDone || isWarmup || isDrop || isFailure
    ? '#FFFFFF'
    : colors.mutedForeground;

  const inputBorder = isDone ? withAlpha(colors.foreground, 0.15) : colors.foreground;
  const inputBg = isDone ? colors.muted : colors.card;

  function renderRightAction() {
    return (
      <Pressable
        onPress={() => { swipeRef.current?.close(); onDelete(exIdx, setIdx); }}
        style={{ width: 72, backgroundColor: colors.persimmon, alignItems: 'center', justifyContent: 'center', borderRadius: BRUTAL.radius, marginLeft: 8 }}>
        <Feather name="trash-2" size={18} color="#FFFFFF" />
      </Pressable>
    );
  }

  return (
    <View>
      <Swipeable
        ref={swipeRef}
        renderRightActions={renderRightAction}
        overshootRight={false}
        enabled={!isDone}
        friction={2}
      >
        <View style={[s.row, { opacity: isDone ? 0.7 : 1 }]}>
          {/* Set badge — tap to cycle type */}
          <Pressable
            onPress={() => !isDone && onTypeChange(exIdx, setIdx, TYPE_CYCLE[set.setType])}
            style={[s.badge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
            {isDone ? (
              <Feather name="check" size={13} color="#FFFFFF" />
            ) : (
              <Text style={[s.badgeText, { color: badgeTextColor }]}>
                {TYPE_LABEL[set.setType] || String(set.setNumber)}
              </Text>
            )}
          </Pressable>

          {/* Previous ghost — tap to autofill */}
          <Pressable
            onPress={() => !isDone && onAutofill(exIdx, setIdx)}
            style={s.prevGhost}>
            <Text style={[s.prevText, { color: withAlpha(colors.mutedForeground, 0.7) }]} numberOfLines={1}>
              {prevGhost ?? '-'}
            </Text>
          </Pressable>

          {/* kg input */}
          <TextInput
            value={set.weightKg}
            onChangeText={v => onWeightChange(exIdx, setIdx, v)}
            keyboardType="decimal-pad"
            placeholder="-"
            placeholderTextColor={withAlpha(colors.mutedForeground, 0.5)}
            editable={!isDone}
            style={[s.kgInput, { backgroundColor: inputBg, borderColor: inputBorder, color: colors.foreground }]}
          />

          <Text style={[s.times, { color: colors.mutedForeground }]}>×</Text>

          {/* reps input */}
          <TextInput
            value={set.reps}
            onChangeText={v => onRepsChange(exIdx, setIdx, v)}
            keyboardType="number-pad"
            placeholder="-"
            placeholderTextColor={withAlpha(colors.mutedForeground, 0.5)}
            editable={!isDone}
            style={[s.repsInput, { backgroundColor: inputBg, borderColor: inputBorder, color: colors.foreground }]}
          />

          {/* Complete / check */}
          <Pressable
            onPress={() => !isDone && onComplete(exIdx, setIdx)}
            disabled={isDone}
            style={[s.checkBtn, {
              borderColor: isDone ? colors.teal : colors.foreground,
              backgroundColor: isDone ? withAlpha(colors.teal, 0.12) : colors.card,
            }]}>
            <Feather name="check" size={17} color={isDone ? colors.teal : colors.mutedForeground} />
          </Pressable>

          {!isDone && (
            <Pressable
              onPress={() => onDelete(exIdx, setIdx)}
              hitSlop={8}
              style={[s.checkBtn, {
                borderColor: colors.persimmon,
                backgroundColor: withAlpha(colors.persimmon, 0.1),
              }]}>
              <Feather name="trash-2" size={15} color={colors.persimmon} />
            </Pressable>
          )}
        </View>
      </Swipeable>

      {/* Inline RPE — appears after working-set completion, non-blocking */}
      {isDone && !isWarmup && set.isPR && (
        <Text style={[s.prLine, { color: colors.highlight }]}>
          NEW PR
        </Text>
      )}
      {isDone && !isWarmup && !set.rpe && (
        <View style={s.rpeRow}>
          <Text style={[s.rpePrompt, { color: withAlpha(colors.mutedForeground, 0.7) }]}>effort?{'\n'}<Text style={s.rpeHint}>6 easy · 10 max</Text></Text>
          {[6, 7, 8, 9, 10].map(n => {
            const col = n <= 7 ? colors.teal : n <= 8 ? colors.orange : colors.persimmon;
            return (
              <Pressable key={n} onPress={() => onRPE(exIdx, setIdx, n)}
                style={[s.rpeChip, { borderColor: col, backgroundColor: withAlpha(col, 0.1) }]}>
                <Text style={[s.rpeChipText, { color: col }]}>{n}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
      {isDone && !isWarmup && set.rpe != null && (
        <Text style={[s.rpeDone, { color: withAlpha(colors.mutedForeground, 0.6) }]}>
          RPE {set.rpe}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5 },
  badge:    { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  badgeText:{ fontFamily: F.monoSemi, fontSize: 11 },
  prevGhost:{ width: 44, alignItems: 'center', justifyContent: 'center', height: 38 },
  prevText: { fontFamily: F.mono, fontSize: 11, textAlign: 'center' },
  kgInput:  { flex: 1, height: 42, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, fontFamily: F.monoSemi, fontSize: 16, textAlign: 'center' },
  times:    { fontFamily: F.monoSemi, fontSize: 14, paddingHorizontal: 2 },
  repsInput:{ width: 50, height: 42, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, fontFamily: F.monoSemi, fontSize: 16, textAlign: 'center' },
  checkBtn: { width: 42, height: 42, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  prLine:   { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 0.8, marginLeft: 42, marginBottom: 2 },
  rpeRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 42, marginBottom: 6 },
  rpePrompt:{ fontFamily: F.mono, fontSize: 10, lineHeight: 14 },
  rpeHint:  { fontFamily: F.mono, fontSize: 9, opacity: 0.6 },
  rpeChip:  { paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderRadius: BRUTAL.radius },
  rpeChipText: { fontFamily: F.monoSemi, fontSize: 11 },
  rpeDone:  { fontFamily: F.mono, fontSize: 10, marginLeft: 42, marginBottom: 4 },
});
