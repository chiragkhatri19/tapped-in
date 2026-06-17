/**
 * ExerciseLogCard — a single exercise in the scrollable workout list.
 * Contains: header (order, muscle dot, name, swap, notes toggle),
 *           meta line, coaching cue, column headers, set rows, add-set.
 */

import React, { useState } from 'react';
import {
  View, Text, Pressable, TextInput, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { withAlpha } from '@/constants/colors';
import { muscleColor } from '@/constants/muscles';
import { BrutalBox } from '@/components/brutal';
import SetRow, { type SetRowData, type SetType } from './SetRow';

export interface ExerciseCardData {
  exerciseName: string;
  muscleGroup: string;
  isPriorityLift: boolean;
  isCompound: boolean;
  plannedSets: number;
  plannedReps: string;
  plannedRest: number;
  plannedRir?: number;
  plannedTempo?: string;
  coachingCue: string;
  alternatives: string[];
  sets: SetRowData[];
  notes: string;
  isCompleted: boolean;
  wasSwapped?: boolean;
}

interface LastPerf {
  date: string;
  sets: Array<{ weightKg: number; reps: number }>;
}

interface Props {
  exIdx: number;
  exercise: ExerciseCardData;
  lastPerf: LastPerf | null;
  onTypeChange: (exIdx: number, setIdx: number, type: SetType) => void;
  onWeightChange: (exIdx: number, setIdx: number, v: string) => void;
  onRepsChange: (exIdx: number, setIdx: number, v: string) => void;
  onComplete: (exIdx: number, setIdx: number) => void;
  onRPE: (exIdx: number, setIdx: number, rpe: number) => void;
  onDeleteSet: (exIdx: number, setIdx: number) => void;
  onAutofill: (exIdx: number, setIdx: number) => void;
  onAddSet: (exIdx: number) => void;
  onNotesChange: (exIdx: number, notes: string) => void;
  onSwap: (exIdx: number) => void;
  reorderMode?: boolean;
  onMoveUp?: (exIdx: number) => void;
  onMoveDown?: (exIdx: number) => void;
  totalExercises?: number;
}

export default function ExerciseLogCard({
  exIdx, exercise, lastPerf,
  onTypeChange, onWeightChange, onRepsChange, onComplete, onRPE,
  onDeleteSet, onAutofill, onAddSet, onNotesChange, onSwap,
  reorderMode, onMoveUp, onMoveDown, totalExercises,
}: Props) {
  const colors = useColors();
  const [showCue, setShowCue] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const mc = muscleColor(exercise.muscleGroup);
  const completedSets = exercise.sets.filter(s => s.completedAt).length;
  const totalSets = exercise.sets.length;
  const allDone = completedSets === totalSets && totalSets > 0;

  function prevGhostFor(setIdx: number): string | null {
    if (!lastPerf) return null;
    const lpSet = lastPerf.sets[setIdx] ?? lastPerf.sets[lastPerf.sets.length - 1];
    if (!lpSet) return null;
    return `${lpSet.weightKg}×${lpSet.reps}`;
  }

  return (
    <BrutalBox
      style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}
      offset={BRUTAL.shadowSm}
      background={allDone ? withAlpha(colors.teal, 0.04) : undefined}>

      {/* Card header */}
      <View style={[s.header, { borderBottomColor: withAlpha(colors.foreground, 0.08) }]}>
        {/* Left: order + name */}
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            {/* Order number or reorder buttons */}
            {reorderMode ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Pressable
                  disabled={exIdx === 0}
                  onPress={() => onMoveUp?.(exIdx)}
                  style={{ opacity: exIdx === 0 ? 0.3 : 1 }}>
                  <Feather name="chevron-up" size={18} color={colors.foreground} />
                </Pressable>
                <Pressable
                  disabled={totalExercises !== undefined && exIdx === totalExercises - 1}
                  onPress={() => onMoveDown?.(exIdx)}
                  style={{ opacity: totalExercises !== undefined && exIdx === totalExercises - 1 ? 0.3 : 1 }}>
                  <Feather name="chevron-down" size={18} color={colors.foreground} />
                </Pressable>
              </View>
            ) : (
              <Text style={[s.order, { color: exercise.isPriorityLift ? colors.orange : colors.mutedForeground }]}>
                {String(exIdx + 1).padStart(2, '0')}
              </Text>
            )}
            <View style={[s.muscleDot, { backgroundColor: mc }]} />
            {exercise.wasSwapped && (
              <Feather name="refresh-cw" size={11} color={withAlpha(colors.mutedForeground, 0.5)} />
            )}
          </View>
          <Text style={[s.name, { color: colors.foreground }]} numberOfLines={2}>
            {exercise.exerciseName}
          </Text>
          {/* Meta line */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            <Text style={[s.meta, { color: colors.mutedForeground }]}>{exercise.muscleGroup}</Text>
            <Text style={[s.meta, { color: colors.mutedForeground }]}>·</Text>
            <Text style={[s.meta, { color: colors.mutedForeground }]}>{exercise.isCompound ? 'compound' : 'isolation'}</Text>
            <Text style={[s.meta, { color: colors.mutedForeground }]}>·</Text>
            <Text style={[s.meta, { color: colors.foreground }]}>{exercise.plannedSets}×{exercise.plannedReps}</Text>
            <Text style={[s.meta, { color: colors.mutedForeground }]}>·</Text>
            <Text style={[s.meta, { color: colors.mutedForeground }]}>{exercise.plannedRest}s</Text>
            {exercise.plannedRir != null && (
              <>
                <Text style={[s.meta, { color: colors.mutedForeground }]}>·</Text>
                <Text style={[s.meta, { color: colors.violet }]}>RIR {exercise.plannedRir}</Text>
              </>
            )}
            {exercise.plannedTempo ? (
              <>
                <Text style={[s.meta, { color: colors.mutedForeground }]}>·</Text>
                <Text style={[s.meta, { color: colors.mutedForeground }]}>{exercise.plannedTempo}</Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Right: swap + cue + notes */}
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <Pressable onPress={() => onSwap(exIdx)} style={[s.actionBtn, { borderColor: withAlpha(colors.foreground, 0.25) }]}>
            <Feather name="refresh-cw" size={12} color={colors.mutedForeground} />
            <Text style={[s.actionBtnText, { color: colors.mutedForeground }]}>swap</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {exercise.coachingCue ? (
              <Pressable onPress={() => setShowCue(v => !v)}>
                <Feather name="info" size={15} color={showCue ? colors.violet : withAlpha(colors.mutedForeground, 0.5)} />
              </Pressable>
            ) : null}
            <Pressable onPress={() => setShowNotes(v => !v)}>
              <Feather name={exercise.notes ? 'file-text' : 'edit-3'} size={15} color={showNotes || exercise.notes ? colors.violet : withAlpha(colors.mutedForeground, 0.5)} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Coaching cue */}
      {showCue && exercise.coachingCue ? (
        <View style={[s.cue, { borderLeftColor: colors.violet, backgroundColor: withAlpha(colors.violet, 0.05) }]}>
          <Text style={[s.cueText, { color: colors.mutedForeground }]}>{exercise.coachingCue}</Text>
        </View>
      ) : null}

      {/* Last session context */}
      {lastPerf ? (
        <View style={[s.lastSessionBar, { backgroundColor: withAlpha(colors.foreground, 0.03), borderBottomColor: withAlpha(colors.foreground, 0.06) }]}>
          <Text style={[s.lastSessionLabel, { color: withAlpha(colors.mutedForeground, 0.7) }]}>
            last · {lastPerf.date}
          </Text>
          <Text style={[s.lastSessionSets, { color: withAlpha(colors.mutedForeground, 0.7) }]}>
            {lastPerf.sets.slice(0, 3).map(s => `${s.weightKg}×${s.reps}`).join('  ·  ')}
          </Text>
        </View>
      ) : null}

      {/* Set table */}
      <View style={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4 }}>
        {/* Column headers */}
        <View style={[s.colHeaders, { borderBottomColor: withAlpha(colors.foreground, 0.08) }]}>
          <View style={{ width: 30 }} />
          <Text style={[s.colHeader, { width: 44, textAlign: 'center' }]}>PREV</Text>
          <Text style={[s.colHeader, { flex: 1, textAlign: 'center' }]}>KG</Text>
          <Text style={[s.colHeader, { width: 12 }]} />
          <Text style={[s.colHeader, { width: 50, textAlign: 'center' }]}>REPS</Text>
          <View style={{ width: 44 }} />
        </View>

        {exercise.sets.map((set, si) => (
          <SetRow
            key={`${exIdx}-${si}`}
            set={set}
            exIdx={exIdx}
            setIdx={si}
            prevGhost={prevGhostFor(si)}
            onTypeChange={onTypeChange}
            onWeightChange={onWeightChange}
            onRepsChange={onRepsChange}
            onComplete={onComplete}
            onRPE={onRPE}
            onDelete={onDeleteSet}
            onAutofill={onAutofill}
          />
        ))}

        {/* Add set */}
        <Pressable onPress={() => onAddSet(exIdx)} style={s.addSet}>
          <Feather name="plus" size={13} color={colors.violet} />
          <Text style={[s.addSetText, { color: colors.violet }]}>add set</Text>
        </Pressable>
      </View>

      {/* Notes input (expandable) */}
      {showNotes && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
          <TextInput
            value={exercise.notes}
            onChangeText={v => onNotesChange(exIdx, v)}
            multiline
            autoFocus
            placeholder="form notes, how it felt..."
            placeholderTextColor={withAlpha(colors.mutedForeground, 0.5)}
            style={[s.notesInput, { color: colors.foreground, borderColor: withAlpha(colors.foreground, 0.2), backgroundColor: withAlpha(colors.foreground, 0.03) }]}
            onBlur={() => !exercise.notes && setShowNotes(false)}
          />
        </View>
      )}

      {/* Progress bar across bottom of card */}
      <View style={{ height: 3, backgroundColor: colors.muted }}>
        <View style={{
          height: 3,
          backgroundColor: allDone ? colors.teal : colors.violet,
          width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` as `${number}%`,
        }} />
      </View>
    </BrutalBox>
  );
}

const s = StyleSheet.create({
  header:       { flexDirection: 'row', padding: 14, borderBottomWidth: 1 },
  order:        { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 0.5 },
  muscleDot:    { width: 8, height: 8, borderRadius: 4 },
  name:         { fontFamily: F.displayBold, fontSize: 20, letterSpacing: -0.4, lineHeight: 24 },
  meta:         { fontFamily: F.mono, fontSize: 11 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: BRUTAL.radius, paddingHorizontal: 8, paddingVertical: 4 },
  actionBtnText:{ fontFamily: F.bodyMed, fontSize: 11 },
  cue:          { borderLeftWidth: 3, marginHorizontal: 14, marginBottom: 8, padding: 10, borderRadius: BRUTAL.radius },
  cueText:      { fontFamily: F.bodyReg, fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  lastSessionBar:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderBottomWidth: 1 },
  lastSessionLabel:{ fontFamily: F.monoSemi, fontSize: 9, letterSpacing: 0.8 },
  lastSessionSets: { fontFamily: F.mono, fontSize: 11 },
  colHeaders:   { flexDirection: 'row', alignItems: 'center', paddingBottom: 6, borderBottomWidth: 1, gap: 6, marginBottom: 4 },
  colHeader:    { fontFamily: F.monoSemi, fontSize: 9, letterSpacing: 0.8, color: '#9BA3C0' },
  addSet:       { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 10 },
  addSetText:   { fontFamily: F.bodySemi, fontSize: 13 },
  notesInput:   { borderWidth: 1, borderRadius: BRUTAL.radius, padding: 10, fontFamily: F.bodyReg, fontSize: 13, minHeight: 52, textAlignVertical: 'top' },
});
