/* Manual split builder - steps A (skeleton) / B (customize) / C (review). 5.4
   Produces a full WorkoutPlan (source:'manual') identical in shape to AI plans.
   Templates are now STRUCTURES (rotation only) — user picks the day count. */

import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput, Modal, Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Feather } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { withAlpha } from '@/constants/colors';
import { muscleColor } from '@/constants/muscles';
import { BrutalBox, BrutalButton } from '@/components/brutal';
import { SectionLabel } from '@/components/workout/ui';
import { EvidenceModal } from '@/components/EvidenceModal';
import VolumeBars from '@/components/workout/VolumeBars';
import ExercisePicker from '@/components/workout/ExercisePicker';
import {
  EXERCISES, VOLUME_GROUPS, getCompoundsByMuscle, getExercisesByMuscle,
  computeFractionalSets, getSimilarExercises, type Exercise, type VolumeGroup,
} from '@/data/exercises';
import { VOLUME_TARGETS, volumeStatus, type MuscleVolume } from '@/lib/workout-analytics';
import {
  computeWeeklyVolume, planCitations, progressionRule, progressionPlan, estimateSessionDuration,
} from '@/lib/workout-plan';
import { EVIDENCE_CARDS } from '@/data/evidence';
import { useWorkoutStore } from '@/stores/workout-store';
import type { WorkoutPlan, WorkoutSession, WorkoutExercise } from '@/stores/workout-store';
import type { EvidenceCard } from '@/types';

// -- Types ---------------------------------------------------------------------
interface BuildExercise {
  exerciseId: string;
  name: string;
  primaryMuscle: VolumeGroup;
  secondaryMuscles: VolumeGroup[];
  isCompound: boolean;
  sets: number;
  reps: string;
  restSeconds: number;
  rir: number;
  cue?: string;
}
interface BuildDay {
  id: string;
  name: string;
  dayOfWeek: string;
  exercises: BuildExercise[];
}

const WEEKDAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const WEEKDAY_ABBR: Record<string,string> = {
  monday:'mon', tuesday:'tue', wednesday:'wed', thursday:'thu', friday:'fri', saturday:'sat', sunday:'sun',
};

// -- Structures ----------------------------------------------------------------
// Each structure defines a rotation of day-types; users pick how many training days.
interface RotationDay { name: string; muscles: VolumeGroup[] }
interface Structure {
  id: string;
  label: string;
  splitType: string;
  suits: string;
  whyCard?: string;
  defaultDays: number;
  rotation: RotationDay[];
}

const STRUCTURES: Structure[] = [
  {
    id: 'full_body', label: 'Full Body', splitType: 'full_body',
    suits: 'every muscle every session. highest frequency, great for busy schedules.',
    whyCard: 'workout_frequency',
    defaultDays: 3,
    rotation: [
      { name: 'Full Body A', muscles: ['quads','chest','back','shoulders'] },
      { name: 'Full Body B', muscles: ['hamstrings','back','chest','core'] },
      { name: 'Full Body C', muscles: ['quads','shoulders','back','core'] },
    ],
  },
  {
    id: 'upper_lower', label: 'Upper / Lower', splitType: 'upper_lower',
    suits: 'each muscle ~2x/week. scales from 2 to 8 days. the most versatile split.',
    whyCard: 'workout_frequency',
    defaultDays: 4,
    rotation: [
      { name: 'Upper', muscles: ['chest','back','shoulders','biceps','triceps'] },
      { name: 'Lower', muscles: ['quads','hamstrings','glutes','calves'] },
    ],
  },
  {
    id: 'ppl', label: 'Push / Pull / Legs', splitType: 'ppl',
    suits: 'high volume, each muscle 2x/week. scales from 3 to 6 days perfectly.',
    whyCard: 'workout_frequency',
    defaultDays: 6,
    rotation: [
      { name: 'Push', muscles: ['chest','shoulders','triceps'] },
      { name: 'Pull', muscles: ['back','biceps'] },
      { name: 'Legs', muscles: ['quads','hamstrings','glutes','calves'] },
    ],
  },
  {
    id: 'blank', label: 'Blank', splitType: 'custom',
    suits: 'start from nothing. full control, build it your way.',
    defaultDays: 3,
    rotation: [],
  },
];

// -- Helpers -------------------------------------------------------------------
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function toBuildExercise(ex: Exercise): BuildExercise {
  return {
    exerciseId: ex.id,
    name: ex.name,
    primaryMuscle: ex.primaryMuscle,
    secondaryMuscles: ex.secondaryMuscles,
    isCompound: ex.category === 'compound',
    sets: 3,
    reps: ex.defaultReps,
    restSeconds: ex.defaultRestSec,
    rir: 2,
    cue: ex.cue,
  };
}

// Seed 2-3 sensible compounds per day from the DB.
function seedDay(muscles: VolumeGroup[]): BuildExercise[] {
  if (muscles.length === 0) return [];
  const picked: BuildExercise[] = [];
  const usedIds = new Set<string>();
  const add = (ex?: Exercise) => {
    if (ex && !usedIds.has(ex.id) && picked.length < 6) { usedIds.add(ex.id); picked.push(toBuildExercise(ex)); }
  };
  if (muscles.length === 1) {
    const m = muscles[0];
    const compounds = getCompoundsByMuscle(m);
    add(compounds[0]); add(compounds[1]);
    const iso = getExercisesByMuscle(m).find(e => e.category === 'isolation');
    add(iso);
  } else {
    for (let i = 0; i < muscles.length; i++) {
      add(getCompoundsByMuscle(muscles[i])[0]);
    }
  }
  return picked;
}

// Build N days from a structure by cycling its rotation.
function buildDaysFromStructure(structure: Structure, count: number): BuildDay[] {
  if (structure.rotation.length === 0) {
    return Array.from({ length: count }, (_, i) => ({
      id: uid(), name: `Day ${i + 1}`, dayOfWeek: WEEKDAYS[i % 7], exercises: [],
    }));
  }
  const rot = structure.rotation;
  const cycles = Math.ceil(count / rot.length);
  const needSuffix = cycles > 1;
  const CYCLE_LETTERS = ['A','B','C','D','E','F','G','H'];
  return Array.from({ length: count }, (_, i) => {
    const template = rot[i % rot.length];
    const cycleIdx = Math.floor(i / rot.length);
    const name = needSuffix
      ? `${template.name} ${CYCLE_LETTERS[cycleIdx] ?? cycleIdx + 1}`
      : template.name;
    return {
      id: uid(), name, dayOfWeek: WEEKDAYS[i % 7], exercises: seedDay(template.muscles),
    };
  });
}

function nextFreeWeekday(used: string[]): string {
  return WEEKDAYS.find(d => !used.includes(d)) ?? 'monday';
}

// -- Live volume from build state ---------------------------------------------
function buildVolumes(days: BuildDay[], custom: Exercise[]): MuscleVolume[] {
  const totals: Record<string, number> = {};
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    for (let j = 0; j < day.exercises.length; j++) {
      const ex = day.exercises[j];
      const frac = computeFractionalSets(ex.exerciseId, ex.sets, custom);
      const fracKeys = Object.keys(frac) as VolumeGroup[];
      for (let k = 0; k < fracKeys.length; k++) {
        const g = fracKeys[k];
        totals[g] = (totals[g] ?? 0) + frac[g];
      }
    }
  }
  return VOLUME_GROUPS.map(g => {
    const [min, max] = VOLUME_TARGETS[g];
    const sets = totals[g] ?? 0;
    return { group: g, setsThisWeek: Math.round(sets * 10) / 10, targetMin: min, targetMax: max, status: volumeStatus(sets, [min, max]) };
  });
}

// -- Props --------------------------------------------------------------------
interface Props {
  existingPlan?: WorkoutPlan | null;
  topPad: number;
  bottomPad: number;
  onCancel: () => void;
  onSave: (plan: WorkoutPlan, setActive: boolean) => void;
}

// -- Prefill from an existing plan (edit mode) --------------------------------
function planToDays(plan: WorkoutPlan): BuildDay[] {
  const dayByName: Record<string, string> = {};
  const entries = Object.entries(plan.weeklySchedule ?? {});
  for (let i = 0; i < entries.length; i++) {
    const [dow, name] = entries[i];
    if (name && name !== 'Rest' && name !== 'Active Rest') dayByName[name] = dow;
  }
  return (plan.sessions ?? []).map((sess) => ({
    id: uid(),
    name: sess.name,
    dayOfWeek: dayByName[sess.name] ?? nextFreeWeekday(Object.values(dayByName)),
    exercises: (sess.exercises ?? []).map(ex => {
      const db = EXERCISES.find(e => e.id === ex.exerciseId || e.name === ex.name);
      return {
        exerciseId: ex.exerciseId ?? db?.id ?? ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        name: ex.name,
        primaryMuscle: (db?.primaryMuscle ?? (ex.muscleGroup as VolumeGroup) ?? 'chest'),
        secondaryMuscles: db?.secondaryMuscles ?? [],
        isCompound: ex.isCompound ?? db?.category === 'compound',
        sets: ex.sets ?? 3,
        reps: ex.reps ?? '8-12',
        restSeconds: ex.restSeconds ?? 90,
        rir: 2,
        cue: ex.coachingCue || db?.cue,
      };
    }),
  }));
}

// =============================================================================
export default function SplitBuilder({ existingPlan, topPad, bottomPad, onCancel, onSave }: Props) {
  const colors = useColors();
  const customExercises = useWorkoutStore(s => s.customExercises);
  const addCustomExercise = useWorkoutStore(s => s.addCustomExercise);
  const hasPlans = useWorkoutStore(s => s.plans.length > 0);

  const editing = !!existingPlan;
  const [step, setStep] = useState<'skeleton' | 'customize' | 'review'>(editing ? 'customize' : 'skeleton');
  const [splitType, setSplitType] = useState<string>(existingPlan?.splitType ?? 'custom');
  const [splitName, setSplitName] = useState<string>(existingPlan?.splitName ?? '');
  const [days, setDays] = useState<BuildDay[]>(editing && existingPlan ? planToDays(existingPlan) : []);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [startAlignment, setStartAlignment] = useState<'today' | 'tomorrow' | 'monday' | 'already_started'>('today');
  const [startedDayOffset, setStartedDayOffset] = useState<number>(0);

  // Structure selection state (skeleton step only)
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null);
  const [targetDays, setTargetDays] = useState<number>(0);
  const [currentStructureId, setCurrentStructureId] = useState<string>(existingPlan?.splitType ?? 'custom');

  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<{ dayId: string; index: number } | null>(null);
  const [evidence, setEvidence] = useState<EvidenceCard | null>(null);

  // init active day when entering customize
  React.useEffect(() => {
    if (step === 'customize' && !activeDayId && days.length > 0) setActiveDayId(days[0].id);
  }, [step, days, activeDayId]);

  const activeDay = days.find(d => d.id === activeDayId) ?? null;
  const volumes = useMemo(() => buildVolumes(days, customExercises), [days, customExercises]);
  const junkMuscles = volumes.filter(v => v.status === 'junk');

  function openEvidence(id: string) {
    const card = EVIDENCE_CARDS.find(c => c.id === id);
    if (card) setEvidence(card);
  }

  // -- Step A: confirm structure + day count ----------------------------------
  function confirmStructure() {
    if (!selectedStructure) return;
    const count = targetDays || selectedStructure.defaultDays;
    const newDays = buildDaysFromStructure(selectedStructure, count);
    setSplitType(selectedStructure.splitType);
    setSplitName(selectedStructure.id === 'blank' ? '' : selectedStructure.label);
    setCurrentStructureId(selectedStructure.id);
    setDays(newDays);
    setActiveDayId(newDays[0]?.id ?? null);
    setStep('customize');
  }

  // -- Day mutations ----------------------------------------------------------
  function patchDay(dayId: string, patch: Partial<BuildDay>) {
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, ...patch } : d));
  }
  function addDay() {
    const used = days.map(d => d.dayOfWeek);
    const nd: BuildDay = { id: uid(), name: `Day ${days.length + 1}`, dayOfWeek: nextFreeWeekday(used), exercises: [] };
    setDays(prev => [...prev, nd]);
    setActiveDayId(nd.id);
  }
  function performDuplicate(day: BuildDay, createVariation: boolean) {
    const used = days.map(d => d.dayOfWeek);
    const newId = uid();
    const exercises = day.exercises.map(e => {
      if (!createVariation) return { ...e };
      const dbEx = EXERCISES.find(ex => ex.id === e.exerciseId);
      if (!dbEx) return { ...e };
      const similar = getSimilarExercises(dbEx, 4);
      if (similar.length === 0) return { ...e };
      const picked = similar[Math.floor(Math.random() * similar.length)];
      return {
        ...e,
        exerciseId: picked.id,
        name: picked.name,
        primaryMuscle: picked.primaryMuscle,
        secondaryMuscles: picked.secondaryMuscles,
        isCompound: picked.category === 'compound',
        cue: picked.cue,
      };
    });

    const nd: BuildDay = {
      id: newId,
      name: day.name + (createVariation ? ' (var)' : ' (copy)'),
      dayOfWeek: nextFreeWeekday(used),
      exercises,
    };
    setDays(prev => [...prev, nd]);
    setActiveDayId(newId);
  }

  function duplicateDay(dayId: string) {
    const day = days.find(d => d.id === dayId);
    if (!day) return;
    Alert.alert(
      "Duplicate Day",
      "Do you want to create an exact copy of the exercises, or create a variation with similar exercises?",
      [
        { text: "Exact Copy", onPress: () => performDuplicate(day, false) },
        { text: "Create Variation", onPress: () => performDuplicate(day, true) },
        { text: "Cancel", style: "cancel" }
      ]
    );
  }
  function extendSplit() {
    const structure = STRUCTURES.find(s => s.id === currentStructureId);
    if (!structure || structure.rotation.length === 0) { addDay(); return; }
    const nextTemplate = structure.rotation[days.length % structure.rotation.length];
    const baseName = nextTemplate.name;
    const existing = days.filter(d => d.name === baseName || d.name.startsWith(baseName + ' ')).length;
    const name = existing === 0 ? baseName : `${baseName} ${existing + 1}`;
    const newId = uid();
    const used = days.map(d => d.dayOfWeek);
    setDays(prev => [...prev, {
      id: newId, name, dayOfWeek: nextFreeWeekday(used), exercises: seedDay(nextTemplate.muscles),
    }]);
    setActiveDayId(newId);
  }
  function removeDay(dayId: string) {
    setDays(prev => {
      const remaining = prev.filter(d => d.id !== dayId);
      if (activeDayId === dayId) setActiveDayId(remaining[0]?.id ?? null);
      return remaining;
    });
  }
  function cycleWeekday(dayId: string) {
    const day = days.find(d => d.id === dayId);
    if (!day) return;
    const taken = days.filter(d => d.id !== dayId).map(d => d.dayOfWeek);
    const start = WEEKDAYS.indexOf(day.dayOfWeek);
    for (let i = 1; i <= 7; i++) {
      const cand = WEEKDAYS[(start + i) % 7];
      if (!taken.includes(cand)) { patchDay(dayId, { dayOfWeek: cand }); return; }
    }
  }

  // -- Exercise mutations -----------------------------------------------------
  function addExerciseToDay(dayId: string, ex: Exercise) {
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, exercises: [...d.exercises, toBuildExercise(ex)] } : d));
  }
  function patchExercise(dayId: string, index: number, patch: Partial<BuildExercise>) {
    setDays(prev => prev.map(d => {
      if (d.id !== dayId) return d;
      const exercises = d.exercises.map((e, i) => i === index ? { ...e, ...patch } : e);
      return { ...d, exercises };
    }));
  }
  function removeExercise(dayId: string, index: number) {
    setDays(prev => prev.map(d => d.id === dayId ? { ...d, exercises: d.exercises.filter((_, i) => i !== index) } : d));
  }
  function moveExercise(dayId: string, index: number, dir: -1 | 1) {
    setDays(prev => prev.map(d => {
      if (d.id !== dayId) return d;
      const next = [...d.exercises];
      const j = index + dir;
      if (j < 0 || j >= next.length) return d;
      [next[index], next[j]] = [next[j], next[index]];
      return { ...d, exercises: next };
    }));
  }

  // -- Save → build WorkoutPlan -----------------------------------------------
  function buildPlan(): WorkoutPlan | null {
    const sessionDays = days.filter(d => d.exercises.length > 0);
    if (sessionDays.length === 0) return null;

    const sessions: WorkoutSession[] = sessionDays.map(day => {
      const exercises: WorkoutExercise[] = day.exercises.map((ex, i) => ({
        order: i + 1,
        exerciseId: ex.exerciseId,
        name: ex.name,
        muscleGroup: ex.primaryMuscle,
        muscleGroupSecondary: ex.secondaryMuscles[0] ?? null,
        isCompound: ex.isCompound,
        isPriorityLift: i === 0,
        sets: ex.sets,
        reps: ex.reps,
        restSeconds: ex.restSeconds,
        tempo: '2-0-2',
        rir: ex.rir,
        coachingCue: ex.cue ?? '',
        alternatives: [],
        healthModification: null,
        progressionRule: progressionRule('recomp'),
      }));
      const muscles = Array.from(new Set(day.exercises.map(e => e.primaryMuscle)));
      return {
        name: day.name,
        sessionGoal: `targets ${muscles.join(', ')}`,
        estimatedDurationMin: estimateSessionDuration(exercises),
        musclesFocused: muscles,
        exercises,
        cardioBlock: null,
      };
    });

    const weeklySchedule: Record<string, string> = {};
    for (let i = 0; i < WEEKDAYS.length; i++) weeklySchedule[WEEKDAYS[i]] = 'Rest';

    const jsDay = new Date().getDay();
    const todayIdx = [6, 0, 1, 2, 3, 4, 5][jsDay]; // Sunday=0 -> 6, Monday=1 -> 0, etc.

    let startWeekdayIdx = todayIdx;
    if (startAlignment === 'tomorrow') {
      startWeekdayIdx = (todayIdx + 1) % 7;
    } else if (startAlignment === 'monday') {
      startWeekdayIdx = 0;
    } else if (startAlignment === 'already_started') {
      startWeekdayIdx = (todayIdx - startedDayOffset + 35) % 7;
    }

    for (let i = 0; i < sessionDays.length; i++) {
      const dow = WEEKDAYS[(startWeekdayIdx + i) % 7];
      weeklySchedule[dow] = sessionDays[i].name;
      sessionDays[i].dayOfWeek = dow;
    }

    return {
      id: '', isActive: false, createdAt: '',
      source: 'manual',
      splitName: splitName.trim() || 'My Split',
      splitType,
      programmeRationale: 'a split you built yourself, balanced against the evidence-based volume targets.',
      weeklySchedule,
      sessions,
      weeklyVolumeByMuscle: computeWeeklyVolume(sessions, customExercises),
      cardioProgram: null,
      progressionPlan: progressionPlan('recomp'),
      hotTakes: [
        'you built this, so you have no excuse not to run it.',
        'progressive overload every week or it is just cardio with extra steps.',
      ],
      citations: planCitations(['workout_volume', 'workout_frequency', 'exercise_order']),
    };
  }

  function handleSave() {
    const plan = buildPlan();
    if (!plan) return;
    onSave(plan, !hasPlans || editing);
  }

  const totalDaysWithWork = days.filter(d => d.exercises.length > 0).length;

  // Rotation preview text for skeleton step
  const rotationPreview = selectedStructure && targetDays > 0 && selectedStructure.rotation.length > 0
    ? buildDaysFromStructure(selectedStructure, targetDays).map(d => d.name).join(' · ')
    : null;

  // -- Render ------------------------------------------------------------------
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EvidenceModal card={evidence} visible={!!evidence} onClose={() => setEvidence(null)} />

      {activeDay && (
        <ExercisePicker
          visible={pickerOpen}
          customExercises={customExercises}
          initialMuscle={null}
          onClose={() => setPickerOpen(false)}
          onPick={(ex) => addExerciseToDay(activeDay.id, ex)}
          onAddCustom={(ex) => addCustomExercise(ex)}
        />
      )}

      {editingExercise && (() => {
        const day = days.find(d => d.id === editingExercise.dayId);
        const ex = day?.exercises[editingExercise.index];
        if (!ex) return null;
        return (
          <ExerciseEditor
            ex={ex}
            onClose={() => setEditingExercise(null)}
            onChange={(patch) => patchExercise(editingExercise.dayId, editingExercise.index, patch)}
            onRest={() => openEvidence('rest_intervals')}
            onRir={() => openEvidence('proximity_to_failure')}
          />
        );
      })()}

      {/* Header */}
      <View style={[t.header, {
        paddingTop: topPad + 12,
        borderBottomColor: withAlpha(colors.foreground, 0.09),
        backgroundColor: colors.background,
      }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Pressable onPress={onCancel} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather name="chevron-left" size={20} color={colors.foreground} />
            <Text style={[t.back, { color: colors.mutedForeground }]}>cancel</Text>
          </Pressable>
          <View style={[t.stepTagPill, { borderColor: withAlpha(colors.foreground, 0.25), backgroundColor: colors.muted }]}>
            <Text style={[t.stepTag, { color: colors.foreground }]}>
              {step === 'skeleton' ? 'pick a split' : step === 'customize' ? 'customize' : 'review'}
            </Text>
          </View>
        </View>
        <Text style={[t.title, { color: colors.foreground, fontSize: step === 'skeleton' ? 28 : 22 }]}>
          {editing ? 'edit split.' : 'build your split.'}
        </Text>

        {/* Day navigator — shown in header for customize step, replaces the broken pill tabs */}
        {step === 'customize' && activeDay && (() => {
          const idx = days.findIndex(d => d.id === activeDayId);
          return (
            <View style={[t.dayNav, { borderTopColor: withAlpha(colors.foreground, 0.1) }]}>
              {/* Prev */}
              <Pressable
                onPress={() => idx > 0 && setActiveDayId(days[idx - 1].id)}
                hitSlop={12}
                style={{ opacity: idx === 0 ? 0.25 : 1 }}>
                <Feather name="chevron-left" size={22} color={colors.foreground} />
              </Pressable>

              {/* Day name + index */}
              <Pressable onPress={() => setRenaming(true)} style={t.dayNavCenter}>
                <Text style={[t.dayNavName, { color: colors.foreground }]} numberOfLines={1}>
                  {activeDay.name}
                </Text>
                <Text style={[t.dayNavMeta, { color: colors.mutedForeground }]}>
                  {idx + 1} / {days.length}
                </Text>
              </Pressable>

              {/* Next */}
              <Pressable
                onPress={() => idx < days.length - 1 && setActiveDayId(days[idx + 1].id)}
                hitSlop={12}
                style={{ opacity: idx === days.length - 1 ? 0.25 : 1 }}>
                <Feather name="chevron-right" size={22} color={colors.foreground} />
              </Pressable>

              {/* Add day */}
              <Pressable onPress={addDay} hitSlop={10}
                style={[t.dayNavBtn, { borderColor: colors.foreground }]}>
                <Feather name="plus" size={15} color={colors.foreground} />
              </Pressable>

              {/* Extend split */}
              {currentStructureId !== 'custom' && (
                <Pressable onPress={extendSplit} hitSlop={10}
                  style={[t.dayNavBtn, { borderColor: withAlpha(colors.foreground, 0.35) }]}>
                  <Feather name="repeat" size={14} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>
          );
        })()}
      </View>

      {/* ── STEP: SKELETON ────────────────────────────────────────────────── */}
      {step === 'skeleton' && (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 100, gap: 10 }}>
            {/* Structure cards */}
            {STRUCTURES.map(struct => {
              const isSelected = selectedStructure?.id === struct.id;
              return (
                <Pressable key={struct.id} onPress={() => {
                  setSelectedStructure(struct);
                  setTargetDays(struct.defaultDays);
                }}>
                  <BrutalBox style={{
                    padding: 16,
                    borderColor: isSelected ? colors.primary : colors.foreground,
                    borderWidth: isSelected ? 3 : BRUTAL.border,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={[t.skName, { color: isSelected ? colors.primary : colors.foreground }]}>{struct.label}</Text>
                      {isSelected && (
                        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                          <Feather name="check" size={11} color={colors.primaryForeground} />
                        </View>
                      )}
                    </View>
                    <Text style={[t.skSuits, { color: colors.mutedForeground }]}>{struct.suits}</Text>
                    {struct.rotation.length > 0 && (
                      <Text style={[t.skDays, { color: colors.mutedForeground }]}>
                        {struct.rotation.map(r => r.name).join(' · ')}
                      </Text>
                    )}
                    {struct.whyCard && (
                      <Pressable onPress={() => openEvidence(struct.whyCard!)}
                        style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: colors.highlight, borderColor: colors.foreground, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontFamily: F.bodyBold, fontSize: 11, color: '#111111' }}>Why?</Text>
                      </Pressable>
                    )}
                  </BrutalBox>
                </Pressable>
              );
            })}

            {/* Day count picker — visible once a structure is selected */}
            {selectedStructure && (
              <View style={{ marginTop: 6 }}>
                <View style={[t.divider, { backgroundColor: withAlpha(colors.foreground, 0.12) }]} />
                <SectionLabel style={{ marginBottom: 8, marginTop: 14 }}>HOW MANY DAYS?</SectionLabel>
                {selectedStructure.rotation.length > 0 && (
                  <Text style={[t.skSuits, { color: colors.mutedForeground, marginBottom: 10 }]}>
                    the {selectedStructure.label} pattern repeats across all training days
                  </Text>
                )}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {(selectedStructure.id === 'blank' ? [1,2,3,4,5,6,7,8] : [3,4,5,6,7,8]).map(d => (
                    <Pressable key={d} onPress={() => setTargetDays(d)}
                      style={[t.dayTile, {
                        backgroundColor: targetDays === d ? colors.primary : colors.card,
                        borderColor: targetDays === d ? colors.primary : colors.foreground,
                      }]}>
                      <Text style={[t.dayTileNum, { color: targetDays === d ? colors.primaryForeground : colors.foreground }]}>{d}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Rotation preview */}
                {rotationPreview && (
                  <View style={[t.rotPreview, { backgroundColor: withAlpha(colors.primary, 0.06), borderColor: withAlpha(colors.primary, 0.3) }]}>
                    <Text style={[t.rotPreviewText, { color: colors.mutedForeground }]}>{rotationPreview}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={[t.footer, { paddingBottom: bottomPad + 12, backgroundColor: colors.background, borderTopColor: withAlpha(colors.foreground, 0.13) }]}>
            <BrutalButton
              label="continue →"
              variant="primary"
              height={52}
              disabled={!selectedStructure || (selectedStructure.id !== 'blank' ? targetDays === 0 : targetDays === 0)}
              onPress={confirmStructure}
            />
          </View>
        </View>
      )}

      {/* ── STEP: CUSTOMIZE ───────────────────────────────────────────────── */}
      {step === 'customize' && (
        <View style={{ flex: 1 }}>
          <KeyboardAwareScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad + 180 }} keyboardShouldPersistTaps="handled" bottomOffset={16}>
            {activeDay && (
              <>
                {/* Day actions row: weekday chip + rename + duplicate + delete */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 14 }}>
                  {renaming ? (
                    <TextInput
                      value={activeDay.name}
                      onChangeText={(v) => patchDay(activeDay.id, { name: v })}
                      onBlur={() => setRenaming(false)}
                      autoFocus
                      style={[t.nameInput, { flex: 1, color: colors.foreground, borderColor: colors.foreground, backgroundColor: colors.card }]}
                    />
                  ) : (
                    <>
                      <Pressable onPress={() => cycleWeekday(activeDay.id)}
                        style={[t.weekdayChip, { borderColor: colors.foreground }]}>
                        <Text style={[t.weekdayText, { color: colors.foreground }]}>{WEEKDAY_ABBR[activeDay.dayOfWeek]}</Text>
                      </Pressable>
                      <Pressable onPress={() => setRenaming(true)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Feather name="edit-2" size={14} color={colors.mutedForeground} />
                        <Text style={[t.weekdayText, { color: colors.mutedForeground }]}>rename</Text>
                      </Pressable>
                      <View style={{ flex: 1 }} />
                      <Pressable onPress={() => duplicateDay(activeDay.id)} hitSlop={8}>
                        <Feather name="copy" size={15} color={colors.mutedForeground} />
                      </Pressable>
                      {days.length > 1 && (
                        <Pressable onPress={() => removeDay(activeDay.id)} hitSlop={8}>
                          <Feather name="trash-2" size={16} color={colors.persimmon} />
                        </Pressable>
                      )}
                    </>
                  )}
                </View>

                {/* Exercises */}
                {activeDay.exercises.length === 0 ? (
                  <Text style={[t.emptyDay, { color: colors.mutedForeground }]}>
                    no lifts yet. add your first one below.
                  </Text>
                ) : activeDay.exercises.map((ex, i) => (
                  <BrutalBox key={`${ex.exerciseId}_${i}`} style={{ padding: 12, marginBottom: 10 }} offset={4}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: muscleColor(ex.primaryMuscle), marginTop: 5, marginRight: 9 }} />
                      <Pressable style={{ flex: 1 }} onPress={() => setEditingExercise({ dayId: activeDay.id, index: i })}>
                        <Text style={[t.exName, { color: colors.foreground }]}>{ex.name}</Text>
                        <Text style={[t.exMeta, { color: colors.mutedForeground }]}>
                          {ex.sets} x {ex.reps} · {ex.restSeconds}s rest · {ex.rir} RIR
                        </Text>
                      </Pressable>
                      <View style={{ alignItems: 'center', gap: 2 }}>
                        <Pressable onPress={() => moveExercise(activeDay.id, i, -1)} hitSlop={6} disabled={i === 0}>
                          <Feather name="chevron-up" size={16} color={i === 0 ? colors.muted : colors.mutedForeground} />
                        </Pressable>
                        <Pressable onPress={() => moveExercise(activeDay.id, i, 1)} hitSlop={6} disabled={i === activeDay.exercises.length - 1}>
                          <Feather name="chevron-down" size={16} color={i === activeDay.exercises.length - 1 ? colors.muted : colors.mutedForeground} />
                        </Pressable>
                      </View>
                      <Pressable onPress={() => removeExercise(activeDay.id, i)} hitSlop={6} style={{ marginLeft: 10, marginTop: 1 }}>
                        <Feather name="x" size={16} color={colors.persimmon} />
                      </Pressable>
                    </View>
                  </BrutalBox>
                ))}

                <BrutalButton label="+ add exercise" variant="secondary" height={48}
                  style={{ marginTop: 4 }} onPress={() => setPickerOpen(true)} />
              </>
            )}

            {/* Junk volume live warning */}
            {junkMuscles.length > 0 && (
              <View style={[t.junkBanner, { borderLeftColor: colors.orange, backgroundColor: withAlpha(colors.orange, 0.06) }]}>
                <Feather name="alert-triangle" size={13} color={colors.orange} style={{ marginRight: 8, marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[t.junkTitle, { color: colors.orange }]}>overtraining risk</Text>
                  <Text style={[t.junkText, { color: colors.mutedForeground }]}>
                    {junkMuscles.map(v => v.group).join(', ')} {junkMuscles.length === 1 ? 'is' : 'are'} above 22 sets. junk volume. recovery caps gains; consider trimming.
                  </Text>
                </View>
              </View>
            )}

            {/* Live volume feedback — collapsible */}
            <BrutalBox style={{ padding: 14, marginTop: 14, paddingBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <SectionLabel>WEEKLY SETS · LIVE</SectionLabel>
              </View>
              <VolumeBars volumes={volumes} collapsible defaultExpanded={false} />
              <Pressable onPress={() => openEvidence('workout_volume')}
                style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: colors.highlight, borderColor: colors.foreground, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontFamily: F.bodyBold, fontSize: 11, color: '#111111' }}>Why?</Text>
              </Pressable>
            </BrutalBox>
          </KeyboardAwareScrollView>

          {/* Footer */}
          <View style={[t.footer, { paddingBottom: bottomPad + 12, backgroundColor: colors.background, borderTopColor: withAlpha(colors.foreground, 0.13) }]}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {!editing && (
                <BrutalButton label="back" variant="secondary" height={52} style={{ flex: 1 }}
                  onPress={() => setStep('skeleton')} />
              )}
              <BrutalButton label="review & save" variant="primary" height={52} style={{ flex: editing ? 1 : 2 }}
                disabled={totalDaysWithWork === 0} onPress={() => setStep('review')} />
            </View>
          </View>
        </View>
      )}

      {/* ── STEP: REVIEW ──────────────────────────────────────────────────── */}
      {step === 'review' && (
        <View style={{ flex: 1 }}>
          <KeyboardAwareScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 120 }} keyboardShouldPersistTaps="handled" bottomOffset={16}>
            <Text style={[t.label, { color: colors.mutedForeground }]}>SPLIT NAME</Text>
            <TextInput
              value={splitName}
              onChangeText={setSplitName}
              placeholder="name your split"
              placeholderTextColor={colors.mutedForeground}
              style={[t.nameInputFull, { color: colors.foreground, borderColor: colors.foreground, backgroundColor: colors.card }]}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 18 }}>
              <BrutalBox style={{ flex: 1, padding: 12, alignItems: 'center' }} offset={4}>
                <Text style={[t.statNum, { color: colors.foreground }]}>{totalDaysWithWork}</Text>
                <Text style={[t.statLabel, { color: colors.mutedForeground }]}>days/week</Text>
              </BrutalBox>
              <BrutalBox style={{ flex: 1, padding: 12, alignItems: 'center' }} offset={4}>
                <Text style={[t.statNum, { color: colors.foreground }]}>
                  {days.reduce((a, d) => a + d.exercises.reduce((b, e) => b + e.sets, 0), 0)}
                </Text>
                <Text style={[t.statLabel, { color: colors.mutedForeground }]}>total sets</Text>
              </BrutalBox>
            </View>

            <Text style={[t.label, { color: colors.mutedForeground, marginBottom: 10 }]}>WEEKLY VOLUME</Text>
            <BrutalBox style={{ padding: 14 }}>
              <VolumeBars volumes={volumes} />
            </BrutalBox>

            <Text style={[t.label, { color: colors.mutedForeground, marginTop: 16, marginBottom: 10 }]}>START CALENDAR ALIGNMENT</Text>
            <BrutalBox style={{ padding: 14, gap: 10 }}>
              <Text style={{ fontFamily: F.bodyBold, fontSize: 13, color: colors.foreground }}>
                When do you want to start this split?
              </Text>
              <View style={{ gap: 8, marginTop: 4 }}>
                {[
                  { id: 'today', label: `Today (${new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()})` },
                  { id: 'tomorrow', label: 'Tomorrow' },
                  { id: 'monday', label: 'Monday (default)' },
                  { id: 'already_started', label: 'Already started (somewhere in the middle)' },
                ].map(opt => {
                  const selected = startAlignment === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setStartAlignment(opt.id as any)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        padding: 10,
                        borderWidth: 1.5,
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? withAlpha(colors.primary, 0.05) : colors.card,
                        borderRadius: BRUTAL.radius,
                      }}
                    >
                      <View style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        borderWidth: 1.5,
                        borderColor: selected ? colors.primary : colors.mutedForeground,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {selected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />}
                      </View>
                      <Text style={{ fontFamily: selected ? F.bodyBold : F.bodyReg, fontSize: 13, color: colors.foreground }}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {startAlignment === 'already_started' && (
                <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.muted, borderRadius: BRUTAL.radius, borderWidth: 1, borderColor: colors.foreground }}>
                  <Text style={{ fontFamily: F.bodyBold, fontSize: 12, color: colors.foreground, marginBottom: 6 }}>
                    Which day of your split is today?
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {Array.from({ length: Math.max(1, totalDaysWithWork) }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const selected = startedDayOffset === idx;
                      return (
                        <Pressable
                          key={idx}
                          onPress={() => setStartedDayOffset(idx)}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: BRUTAL.radius,
                            borderWidth: 1.5,
                            borderColor: selected ? colors.primary : colors.foreground,
                            backgroundColor: selected ? colors.primary : colors.card,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ fontFamily: F.monoSemi, fontSize: 13, color: selected ? colors.primaryForeground : colors.foreground }}>
                            {dayNum}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </BrutalBox>

            {/* Reality checks */}
            {volumes.filter(v => v.setsThisWeek > 0 && (v.setsThisWeek < 8 || v.setsThisWeek > 22)).map(v => (
              <View key={v.group} style={[t.realityRow, { borderLeftColor: colors.persimmon }]}>
                <Text style={[t.realityText, { color: colors.mutedForeground }]}>
                  {v.group} is at {Math.round(v.setsThisWeek * 10) / 10} sets. {v.setsThisWeek < 8
                    ? `that's under the ${v.targetMin}-${v.targetMax} range for growth.`
                    : `that's likely junk volume above 22.`}
                </Text>
              </View>
            ))}
          </KeyboardAwareScrollView>

          <View style={[t.footer, { paddingBottom: bottomPad + 12, backgroundColor: colors.background, borderTopColor: withAlpha(colors.foreground, 0.13) }]}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <BrutalButton label="back" variant="secondary" height={52} style={{ flex: 1 }}
                onPress={() => setStep('customize')} />
              <BrutalButton label={editing ? 'save changes' : 'save split'} variant="primary" height={52} style={{ flex: 2 }}
                onPress={handleSave} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// -- Exercise editor sheet -----------------------------------------------------
function ExerciseEditor({ ex, onClose, onChange, onRest, onRir }: {
  ex: BuildExercise;
  onClose: () => void;
  onChange: (patch: Partial<BuildExercise>) => void;
  onRest: () => void;
  onRir: () => void;
}) {
  const colors = useColors();
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={t.backdrop} onPress={onClose} />
      <View style={[t.sheet, { backgroundColor: colors.background, borderTopColor: colors.foreground }]}>
        <View style={[t.handle, { backgroundColor: colors.foreground }]} />
        <Text style={[t.editTitle, { color: colors.foreground }]}>{ex.name}</Text>

        <Stepper label="sets"
          onDec={() => onChange({ sets: Math.max(1, ex.sets - 1) })}
          onInc={() => onChange({ sets: Math.min(10, ex.sets + 1) })}
          display={String(ex.sets)} colors={colors} />

        <View style={t.editRow}>
          <Text style={[t.editLabel, { color: colors.foreground }]}>reps</Text>
          <TextInput value={ex.reps} onChangeText={(v) => onChange({ reps: v })}
            style={[t.repsInput, { color: colors.foreground, borderColor: colors.foreground, backgroundColor: colors.card }]} />
        </View>

        <Stepper label="rest"
          onDec={() => onChange({ restSeconds: Math.max(30, ex.restSeconds - 15) })}
          onInc={() => onChange({ restSeconds: Math.min(300, ex.restSeconds + 15) })}
          display={`${ex.restSeconds}s`} colors={colors} why onWhy={onRest} />

        <View style={t.editRow}>
          <Pressable onPress={onRir} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[t.editLabel, { color: colors.foreground }]}>target RIR</Text>
            <Feather name="info" size={13} color={colors.mutedForeground} />
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[0, 1, 2, 3, 4].map(n => (
              <Pressable key={n} onPress={() => onChange({ rir: n })}
                style={[t.rirBtn, {
                  borderColor: colors.foreground,
                  backgroundColor: ex.rir === n ? colors.primary : colors.card,
                }]}>
                <Text style={[t.rirText, { color: ex.rir === n ? colors.primaryForeground : colors.foreground }]}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={[t.editLabel, { color: colors.foreground, marginBottom: 6 }]}>cue (optional)</Text>
          <TextInput value={ex.cue ?? ''} onChangeText={(v) => onChange({ cue: v })}
            placeholder="one-line form reminder" placeholderTextColor={colors.mutedForeground}
            style={[t.cueInput, { color: colors.foreground, borderColor: colors.foreground, backgroundColor: colors.card }]} />
        </View>

        <BrutalButton label="done" variant="primary" height={50} style={{ marginTop: 18 }} onPress={onClose} />
      </View>
    </Modal>
  );
}

function Stepper({ label, display, onDec, onInc, colors, why, onWhy }: {
  label: string; display: string;
  onDec: () => void; onInc: () => void; colors: ReturnType<typeof useColors>; why?: boolean; onWhy?: () => void;
}) {
  return (
    <View style={t.editRow}>
      <Pressable onPress={why ? onWhy : undefined} disabled={!why}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={[t.editLabel, { color: colors.foreground }]}>{label}</Text>
        {why && <Feather name="info" size={13} color={colors.mutedForeground} />}
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Pressable onPress={onDec} style={[t.stepBtn, { borderColor: colors.foreground }]}>
          <Feather name="minus" size={16} color={colors.foreground} />
        </Pressable>
        <Text style={[t.stepVal, { color: colors.foreground }]}>{display}</Text>
        <Pressable onPress={onInc} style={[t.stepBtn, { borderColor: colors.foreground }]}>
          <Feather name="plus" size={16} color={colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}

const t = StyleSheet.create({
  header:       { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  back:         { fontFamily: F.bodyMed, fontSize: 14 },
  stepTagPill:  { borderRadius: BRUTAL.radius, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 5 },
  stepTag:      { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 0.8 },
  title:        { fontFamily: F.displayBold, fontStyle: 'italic', letterSpacing: -0.8 },
  divider:      { height: 1, marginBottom: 4 },

  skName:      { fontFamily: F.bodyBold, fontSize: 17 },
  skDays:      { fontFamily: F.mono, fontSize: 11, marginTop: 4, letterSpacing: 0.3 },
  skSuits:     { fontFamily: F.bodyReg, fontSize: 13, lineHeight: 19 },
  whyChip:     { alignSelf: 'flex-start', borderWidth: 2, borderRadius: BRUTAL.radius, paddingHorizontal: 8, paddingVertical: 4 },
  whyChipText: { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 0.5 },

  dayTile:     { width: 64, height: 64, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dayTileNum:  { fontFamily: F.monoSemi, fontSize: 24, includeFontPadding: false, textAlignVertical: 'center' },
  rotPreview:  { marginTop: 12, borderWidth: 1, borderRadius: BRUTAL.radius, padding: 12 },
  rotPreviewText: { fontFamily: F.mono, fontSize: 11, lineHeight: 18 },

  dayNav:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 12, borderTopWidth: 1 },
  dayNavCenter:{ flex: 1, alignItems: 'center', gap: 1 },
  dayNavName:  { fontFamily: F.bodySemi, fontSize: 15 },
  dayNavMeta:  { fontFamily: F.mono, fontSize: 11 },
  dayNavBtn:   { width: 32, height: 32, borderWidth: 2, borderRadius: BRUTAL.radius, alignItems: 'center', justifyContent: 'center' },

  dayName:     { fontFamily: F.displaySemi, fontSize: 20 },
  nameInput:   { flex: 1, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, paddingHorizontal: 12, height: 44, fontFamily: F.bodySemi, fontSize: 16 },
  weekdayChip: { borderWidth: 2, borderRadius: BRUTAL.radius, paddingHorizontal: 10, paddingVertical: 5 },
  weekdayText: { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 0.5 },

  emptyDay:    { fontFamily: F.bodyReg, fontSize: 14, fontStyle: 'italic', textAlign: 'center', paddingVertical: 24 },
  exName:      { fontFamily: F.bodySemi, fontSize: 14 },
  exMeta:      { fontFamily: F.mono, fontSize: 12, marginTop: 3 },

  junkBanner:  { flexDirection: 'row', alignItems: 'flex-start', borderLeftWidth: 3, borderRadius: BRUTAL.radius, padding: 12, marginTop: 14 },
  junkTitle:   { fontFamily: F.bodySemi, fontSize: 13, marginBottom: 3 },
  junkText:    { fontFamily: F.bodyReg, fontSize: 12, lineHeight: 18 },

  footer:      { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },

  label:       { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 1.2, marginBottom: 6 },
  nameInputFull: { borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, paddingHorizontal: 14, height: 52, fontFamily: F.bodySemi, fontSize: 17 },
  statNum:     { fontFamily: F.monoSemi, fontSize: 26 },
  statLabel:   { fontFamily: F.bodyReg, fontSize: 12, marginTop: 2 },
  realityRow:  { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 8, marginTop: 12 },
  realityText: { fontFamily: F.bodyReg, fontSize: 13, lineHeight: 19 },

  // editor sheet
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:       { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: BRUTAL.border, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
  handle:      { width: 44, height: 5, alignSelf: 'center', marginBottom: 14 },
  editTitle:   { fontFamily: F.bodyBold, fontSize: 18, marginBottom: 16 },
  editRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  editLabel:   { fontFamily: F.bodySemi, fontSize: 15 },
  stepBtn:     { width: 34, height: 34, borderWidth: 2, borderRadius: BRUTAL.radius, alignItems: 'center', justifyContent: 'center' },
  stepVal:     { fontFamily: F.monoSemi, fontSize: 16, minWidth: 44, textAlign: 'center' },
  repsInput:   { borderWidth: 2, borderRadius: BRUTAL.radius, paddingHorizontal: 12, height: 40, minWidth: 90, textAlign: 'center', fontFamily: F.mono, fontSize: 15 },
  rirBtn:      { width: 36, height: 36, borderWidth: 2, borderRadius: BRUTAL.radius, alignItems: 'center', justifyContent: 'center' },
  rirText:     { fontFamily: F.monoSemi, fontSize: 14 },
  cueInput:    { borderWidth: 2, borderRadius: BRUTAL.radius, paddingHorizontal: 12, minHeight: 44, fontFamily: F.bodyReg, fontSize: 14, paddingTop: 12 },
});
