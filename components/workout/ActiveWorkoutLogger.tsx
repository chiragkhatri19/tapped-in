/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/**
 * ActiveWorkoutLogger — thin orchestrator.
 * Phase machine: overview → logging → finish
 * All heavy UI lives in components/workout/logger/*.
 * Props unchanged so app/(tabs)/workout.tsx needs no edits.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  Animated, Platform, Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { withAlpha } from '@/constants/colors';
import { muscleColor } from '@/constants/muscles';
import { EXERCISES, getSimilarExercises } from '@/data/exercises';
import { storageAsyncCompat as AsyncStorage } from '@/lib/storage';
import { haptic } from '@/lib/haptics';
import { playRestComplete } from '@/lib/sound';
import {
  startActiveWorkoutNotification,
  stopActiveWorkoutNotification,
  sendRestTimerCompleteNotification,
} from '@/lib/workout-notifications';

import { useSuccessBurst } from '@/components/motion/SuccessBurst';
import SessionOverview from './logger/SessionOverview';
import ExerciseLogCard, { type ExerciseCardData } from './logger/ExerciseLogCard';
import RestTimerBar from './logger/RestTimerBar';
import SwapSheet, { type SwapOption } from './logger/SwapSheet';
import FinishCheckIn from './logger/FinishCheckIn';
import type { SetType } from './logger/SetRow';
import type { SetRowData } from './logger/SetRow';

// ── Helpers ──────────────────────────────────────────────────────────────────

function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtTimer(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getSwapOptions(exerciseName: string, muscleGroup: string): SwapOption[] {
  const source = EXERCISES.find(e => e.name === exerciseName);
  if (source) {
    return getSimilarExercises(source, 12).map(e => ({
      name: e.name,
      equipment: e.equipment,
      category: e.category,
      cue: e.cue ?? '',
      isSamePattern: e.pattern !== undefined && e.pattern === source.pattern,
    }));
  }
  // Fallback: muscle group filter
  return EXERCISES
    .filter(e => e.primaryMuscle === muscleGroup && e.name !== exerciseName)
    .slice(0, 8)
    .map(e => ({ name: e.name, equipment: e.equipment, category: e.category, cue: e.cue ?? '', isSamePattern: false }));
}

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  session: any;
  plan: any;
  initialWorkout?: any;
  topPad: number;
  bottomPad: number;
  onFinish: (log: any) => void;
  onEnd: () => void;
}

type Phase = 'overview' | 'logging' | 'finish';

// ── Check-in state type ───────────────────────────────────────────────────────

interface CheckInState {
  feelingRating: number | null;
  energyLevel: number | null;
  sleepHours: string;
  sessionNotes: string;
  cardioCompleted: boolean | null;
  cardioMinutes: string;
  cardioAvgHR: string;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ActiveWorkoutLogger({ session, plan, initialWorkout, topPad, bottomPad, onFinish, onEnd }: Props) {
  const colors = useColors();
  const burst = useSuccessBurst();

  // Phase
  const [phase, setPhase] = useState<Phase>(initialWorkout ? 'logging' : 'overview');
  const [reorderMode, setReorderMode] = useState(false);

  // Exercise state (the scrollable list)
  const [exercises, setExercises] = useState<ExerciseCardData[]>([]);

  // Derived stats for top bar
  const totalWorkingSets = exercises.reduce((a, ex) =>
    a + ex.sets.filter(s => s.setType !== 'warmup').length, 0);
  const completedWorkingSets = exercises.reduce((a, ex) =>
    a + ex.sets.filter(s => s.completedAt && s.setType !== 'warmup').length, 0);
  const progressPct = totalWorkingSets > 0 ? completedWorkingSets / totalWorkingSets : 0;

  const [lastPerf, setLastPerf] = useState<Record<string, { date: string; sets: Array<{ weightKg: number; reps: number }> }>>({});

  // Pre-start local exercise overrides (modified in overview phase before workout starts)
  const [localSessionExercises, setLocalSessionExercises] = useState<any[]>(() => session.exercises ?? []);

  // Workout timer (seconds elapsed)
  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const workoutTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(new Date().toISOString());

  // Rest timer (timestamp-based — accurate when backgrounded)
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(0);
  const [restRemaining, setRestRemaining] = useState<number>(0);
  const restFired = useRef(false);
  const restTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // PR banner
  const [prBanner, setPRBanner] = useState<{ name: string; type: string; value: number } | null>(null);
  const prBannerY = useRef(new Animated.Value(-80)).current;

  // Swap sheet
  const [swapExIdx, setSwapExIdx] = useState<number | null>(null);
  const [swapOptions, setSwapOptions] = useState<SwapOption[]>([]);

  // Check-in state
  const [checkIn, setCheckIn] = useState<CheckInState>({
    feelingRating: null, energyLevel: null, sleepHours: '',
    sessionNotes: '', cardioCompleted: null, cardioMinutes: '', cardioAvgHR: '',
  });

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    initExercises();
    loadLastPerformance();
    return () => {
      if (workoutTimer.current) clearInterval(workoutTimer.current);
      if (restTickRef.current) clearInterval(restTickRef.current);
      stopActiveWorkoutNotification();
    };
  }, []);

  useEffect(() => {
    if (phase === 'logging') {
      const seconds = workoutSeconds % 60;
      if (seconds === 0 || workoutSeconds === 1) {
        startActiveWorkoutNotification(session.name, workoutSeconds, completedWorkingSets, totalWorkingSets);
      }
    } else {
      stopActiveWorkoutNotification();
    }
  }, [phase, workoutSeconds, completedWorkingSets, totalWorkingSets, session.name]);

  function startWorkoutTimer() {
    if (workoutTimer.current) return;
    workoutTimer.current = setInterval(() => setWorkoutSeconds(s => s + 1), 1000);
  }

  function initExercises() {
    if (initialWorkout) {
      setExercises(initialWorkout.exercises ?? []);
      setWorkoutSeconds(initialWorkout.elapsedSeconds ?? 0);
      startedAt.current = initialWorkout.startedAt ?? new Date().toISOString();
      startWorkoutTimer();
      return;
    }
    const list: ExerciseCardData[] = (localSessionExercises).map((ex: any) => ({
      exerciseName: ex.name,
      muscleGroup: ex.muscleGroup ?? '',
      isPriorityLift: !!ex.isPriorityLift,
      isCompound: !!ex.isCompound,
      plannedSets: ex.sets ?? 3,
      plannedReps: ex.reps ?? '8-12',
      plannedRest: ex.restSeconds ?? 90,
      plannedRir: ex.rir,
      plannedTempo: ex.tempo,
      coachingCue: ex.coachingCue ?? '',
      alternatives: ex.alternatives ?? [],
      sets: Array.from({ length: ex.sets ?? 3 }, (_: unknown, j: number) => ({
        setNumber: j + 1,
        setType: 'normal' as SetType,
        weightKg: '',
        reps: '',
        rpe: null,
        completedAt: null,
        isPR: false,
      })),
      notes: '',
      isCompleted: false,
    }));
    setExercises(list);
  }

  async function loadLastPerformance() {
    const raw = await AsyncStorage.getItem('tapped_in_workout_logs');
    if (!raw) return;
    const logs: any[] = JSON.parse(raw);
    const perf: typeof lastPerf = {};
    const reversedLogs = [...logs].reverse();
    for (let i = 0; i < reversedLogs.length; i++) {
      const log = reversedLogs[i];
      const exList = log.exercises ?? [];
      for (let j = 0; j < exList.length; j++) {
        const ex = exList[j];
        if (!perf[ex.exerciseName] && ex.sets?.length > 0) {
          perf[ex.exerciseName] = {
            date: log.date,
            sets: ex.sets.filter((s: any) => !s.isWarmup).map((s: any) => ({
              weightKg: s.weightKg ?? 0,
              reps: s.reps ?? 0,
            })),
          };
        }
      }
    }
    setLastPerf(perf);
    // Pre-fill set inputs from previous session
    setExercises(prev => prev.map(ex => {
      const lp = perf[ex.exerciseName];
      if (!lp) return ex;
      return {
        ...ex,
        sets: ex.sets.map((set, i) => {
          const lpSet = lp.sets[i] ?? lp.sets[lp.sets.length - 1];
          return lpSet
            ? { ...set, weightKg: String(lpSet.weightKg || ''), reps: String(lpSet.reps || '') }
            : set;
        }),
      };
    }));
  }

  // ── Rest timer (timestamp-based) ──────────────────────────────────────────

  function startRest(seconds: number) {
    if (restTickRef.current) clearInterval(restTickRef.current);
    const endsAt = Date.now() + seconds * 1000;
    setRestEndsAt(endsAt);
    setRestTotal(seconds);
    setRestRemaining(seconds);
    restFired.current = false;

    restTickRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setRestRemaining(remaining);
      if (remaining <= 0 && !restFired.current) {
        restFired.current = true;
        haptic.warning();
        playRestComplete();
        sendRestTimerCompleteNotification(seconds);
        clearInterval(restTickRef.current!);
        // Keep bar visible for 2s after zero so user sees "go!"
        setTimeout(() => setRestEndsAt(null), 2000);
      }
    }, 500);
  }

  function adjustRest(delta: number) {
    if (!restEndsAt) return;
    const newEndsAt = Math.max(Date.now() + 1000, restEndsAt + delta * 1000);
    setRestEndsAt(newEndsAt);
    setRestTotal(t => Math.max(1, t + delta));
    restFired.current = false;
  }

  function skipRest() {
    if (restTickRef.current) clearInterval(restTickRef.current);
    setRestEndsAt(null);
  }

  // ── PR banner ──────────────────────────────────────────────────────────────

  function showPR(name: string, type: string, value: number) {
    setPRBanner({ name, type, value });
    Animated.spring(prBannerY, { toValue: 0, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.spring(prBannerY, { toValue: -100, useNativeDriver: true }).start(() => setPRBanner(null));
    }, 2500);
  }

  // ── Set mutations ─────────────────────────────────────────────────────────

  function updateSet(exIdx: number, setIdx: number, patch: Partial<SetRowData>) {
    setExercises(prev => prev.map((ex, ei) => ei !== exIdx ? ex : {
      ...ex,
      sets: ex.sets.map((s, si) => si !== setIdx ? s : { ...s, ...patch }),
    }));
  }

  function handleTypeChange(exIdx: number, setIdx: number, type: SetType) {
    updateSet(exIdx, setIdx, { setType: type });
  }

  function handleWeightChange(exIdx: number, setIdx: number, v: string) {
    updateSet(exIdx, setIdx, { weightKg: v });
  }

  function handleRepsChange(exIdx: number, setIdx: number, v: string) {
    updateSet(exIdx, setIdx, { reps: v });
  }

  function handleAutofill(exIdx: number, setIdx: number) {
    const ex = exercises[exIdx];
    const lp = lastPerf[ex.exerciseName];
    if (!lp) return;
    const lpSet = lp.sets[setIdx] ?? lp.sets[lp.sets.length - 1];
    if (!lpSet) return;
    updateSet(exIdx, setIdx, {
      weightKg: String(lpSet.weightKg || ''),
      reps: String(lpSet.reps || ''),
    });
    haptic.light();
  }

  async function handleComplete(exIdx: number, setIdx: number) {
    const ex = exercises[exIdx];
    const set = ex.sets[setIdx];
    const w = parseFloat(set.weightKg);
    const r = parseInt(set.reps, 10);
    if (isNaN(w) || isNaN(r) || r <= 0) {
      // Auto-fill reps if only weight is entered
      if (!isNaN(w) && w > 0 && !set.reps) {
        const plannedReps = parseInt(ex.plannedReps.split('-')[0], 10) || 8;
        updateSet(exIdx, setIdx, { reps: String(plannedReps) });
      }
      return;
    }

    let isPR = false;
    if (set.setType !== 'warmup') {
      const raw = await AsyncStorage.getItem('tapped_in_exercise_prs');
      const allPRs = raw ? JSON.parse(raw) : {};
      const existing = allPRs[ex.exerciseName] ?? {};
      const new1RM = estimate1RM(w, r);
      if (!existing.estimated1RM || new1RM > existing.estimated1RM) {
        isPR = true;
        haptic.success();
        showPR(ex.exerciseName, 'est. 1RM', new1RM);
      } else if (!existing.maxWeight || w > existing.maxWeight) {
        isPR = true;
        haptic.success();
        showPR(ex.exerciseName, 'max weight', w);
      }
      allPRs[ex.exerciseName] = {
        estimated1RM: Math.max(new1RM, existing.estimated1RM ?? 0),
        maxWeight: Math.max(w, existing.maxWeight ?? 0),
        maxReps: Math.max(r, existing.maxReps ?? 0),
        achievedAt: getTodayKey(),
      };
      await AsyncStorage.setItem('tapped_in_exercise_prs', JSON.stringify(allPRs));
    }

    haptic.light();

    const updatedExercises = exercises.map((e, ei) => {
      if (ei !== exIdx) return e;
      const sets = e.sets.map((s, si) => si === setIdx
        ? { ...s, completedAt: new Date().toISOString(), isPR }
        : s
      );
      // carry this set's values into the next set as default if empty
      const nextSet = sets[setIdx + 1];
      if (nextSet && !nextSet.completedAt && !nextSet.weightKg && !nextSet.reps) {
        sets[setIdx + 1] = { ...nextSet, weightKg: set.weightKg, reps: set.reps };
      }
      return { ...e, sets, isCompleted: sets.every(s => s.completedAt !== null) };
    });
    setExercises(updatedExercises);
    await saveActiveWorkout(updatedExercises);
    startRest(ex.plannedRest);
  }

  function handleRPE(exIdx: number, setIdx: number, rpe: number) {
    updateSet(exIdx, setIdx, { rpe });
  }

  function handleDeleteSet(exIdx: number, setIdx: number) {
    setExercises(prev => prev.map((ex, ei) => {
      if (ei !== exIdx) return ex;
      const sets = ex.sets.filter((_, si) => si !== setIdx)
        .map((s, i) => ({ ...s, setNumber: i + 1 }));
      return { ...ex, sets };
    }));
  }

  function handleAddSet(exIdx: number) {
    setExercises(prev => prev.map((ex, ei) => {
      if (ei !== exIdx) return ex;
      const last = ex.sets[ex.sets.length - 1];
      const weightKg = (last && last.weightKg !== undefined && last.weightKg !== null) ? last.weightKg : '';
      const reps = (last && last.reps !== undefined && last.reps !== null) ? last.reps : '';
      return {
        ...ex,
        sets: [...ex.sets, {
          setNumber: ex.sets.length + 1,
          setType: 'normal' as SetType,
          weightKg: weightKg,
          reps: reps,
          rpe: null,
          completedAt: null,
          isPR: false,
        }],
      };
    }));
  }

  function handleNotesChange(exIdx: number, notes: string) {
    setExercises(prev => prev.map((ex, ei) => ei !== exIdx ? ex : { ...ex, notes }));
  }

  function handleMoveUp(exIdx: number) {
    if (exIdx === 0) return;
    setExercises(prev => {
      const next = [...prev];
      const temp = next[exIdx];
      next[exIdx] = next[exIdx - 1];
      next[exIdx - 1] = temp;
      saveActiveWorkout(next);
      return next;
    });
    haptic.light();
  }

  function handleMoveDown(exIdx: number) {
    if (exIdx === exercises.length - 1) return;
    setExercises(prev => {
      const next = [...prev];
      const temp = next[exIdx];
      next[exIdx] = next[exIdx + 1];
      next[exIdx + 1] = temp;
      saveActiveWorkout(next);
      return next;
    });
    haptic.light();
  }

  // ── Swap ──────────────────────────────────────────────────────────────────

  function openSwap(exIdx: number, fromOverview = false) {
    if (fromOverview) {
      const ex = localSessionExercises[exIdx];
      setSwapExIdx(exIdx);
      setSwapOptions(getSwapOptions(ex?.name ?? '', ex?.muscleGroup ?? ''));
    } else {
      const ex = exercises[exIdx];
      setSwapExIdx(exIdx);
      setSwapOptions(getSwapOptions(ex.exerciseName, ex.muscleGroup));
    }
  }

  function handleSwap(name: string) {
    if (swapExIdx === null) return;

    // Pre-start swap (overview phase): update local session exercises only
    if (phase === 'overview') {
      const dbEx = EXERCISES.find(e => e.name === name);
      setLocalSessionExercises(prev => prev.map((ex: any, i: number) => {
        if (i !== swapExIdx) return ex;
        return {
          ...ex,
          name,
          muscleGroup: dbEx?.primaryMuscle ?? ex.muscleGroup,
          isCompound: (dbEx?.category ?? 'isolation') === 'compound',
          reps: dbEx?.defaultReps ?? ex.reps,
          restSeconds: dbEx?.defaultRestSec ?? ex.restSeconds,
          coachingCue: dbEx?.cue ?? '',
        };
      }));
      setSwapExIdx(null);
      haptic.medium();
      return;
    }

    const ex = exercises[swapExIdx];
    const completedCount = ex.sets.filter(s => s.completedAt).length;
    const dbEx = EXERCISES.find(e => e.name === name);
    const remainingSets = Math.max(ex.plannedSets - completedCount, 1);

    const swapped: ExerciseCardData = {
      exerciseName: name,
      muscleGroup: dbEx?.primaryMuscle ?? ex.muscleGroup,
      isPriorityLift: false,
      isCompound: (dbEx?.category ?? 'isolation') === 'compound',
      plannedSets: remainingSets,
      plannedReps: dbEx?.defaultReps ?? ex.plannedReps,
      plannedRest: dbEx?.defaultRestSec ?? ex.plannedRest,
      coachingCue: dbEx?.cue ?? '',
      alternatives: EXERCISES
        .filter(e => e.primaryMuscle === (dbEx?.primaryMuscle ?? ex.muscleGroup) && e.name !== name)
        .slice(0, 2).map(e => e.name),
      sets: Array.from({ length: remainingSets }, (_: unknown, j: number) => ({
        setNumber: j + 1, setType: 'normal' as SetType,
        weightKg: '', reps: '', rpe: null, completedAt: null, isPR: false,
      })),
      notes: '', isCompleted: false, wasSwapped: true,
    };

    setExercises(prev => {
      if (completedCount === 0) {
        return prev.map((e, i) => i === swapExIdx ? swapped : e);
      }
      return [
        ...prev.slice(0, swapExIdx),
        { ...ex, isCompleted: true },
        swapped,
        ...prev.slice(swapExIdx + 1),
      ];
    });
    setSwapExIdx(null);
    haptic.medium();
  }

  // ── Crash recovery persistence ─────────────────────────────────────────────

  async function saveActiveWorkout(exs: ExerciseCardData[]) {
    await AsyncStorage.setItem('tapped_in_active_workout', JSON.stringify({
      id: Date.now().toString(),
      planId: plan?.id ?? null,
      sessionName: session.name,
      date: getTodayKey(),
      startedAt: startedAt.current,
      elapsedSeconds: workoutSeconds,
      currentExerciseIndex: 0,
      exercises: exs,
    }));
  }

  // ── End / finish ──────────────────────────────────────────────────────────

  function handleEndWorkout() {
    Alert.alert('end workout?', undefined, [
      { text: 'keep going', style: 'cancel' },
      {
        text: "save what i've done",
        onPress: () => {
          if (workoutTimer.current) clearInterval(workoutTimer.current);
          if (restTickRef.current) clearInterval(restTickRef.current);
          setRestEndsAt(null);
          AsyncStorage.removeItem('tapped_in_active_workout');
          setPhase('finish');
        },
      },
      {
        text: 'discard workout',
        style: 'destructive',
        onPress: () => {
          if (workoutTimer.current) clearInterval(workoutTimer.current);
          if (restTickRef.current) clearInterval(restTickRef.current);
          AsyncStorage.removeItem('tapped_in_active_workout');
          onEnd();
        },
      },
    ]);
  }

  function handleFinishWorkout() {
    if (workoutTimer.current) clearInterval(workoutTimer.current);
    if (restTickRef.current) clearInterval(restTickRef.current);
    setRestEndsAt(null);
    AsyncStorage.removeItem('tapped_in_active_workout');
    setPhase('finish');
  }

  async function handleSaveWorkout() {
    const completedSets = exercises.flatMap(ex => ex.sets.filter(s => s.completedAt && s.setType !== 'warmup'));
    const totalSets = completedSets.length;
    const totalVolume = completedSets.reduce((a, s) => a + (parseFloat(s.weightKg) || 0) * (parseInt(s.reps) || 0), 0);

    const logExercises = exercises.map(ex => ({
      exerciseName: ex.exerciseName,
      muscleGroup: ex.muscleGroup,
      sets: ex.sets.filter(s => s.completedAt).map(s => ({
        setNumber: s.setNumber,
        isWarmup: s.setType === 'warmup',
        setType: s.setType,
        weightKg: parseFloat(s.weightKg) || 0,
        reps: parseInt(s.reps) || 0,
        rpe: s.rpe,
        isPR: s.isPR,
      })),
      totalVolume: ex.sets.filter(s => s.completedAt && s.setType !== 'warmup')
        .reduce((a, s) => a + (parseFloat(s.weightKg) || 0) * (parseInt(s.reps) || 0), 0),
      notes: ex.notes,
    }));

    const prsAchieved = logExercises.filter(ex => ex.sets.some(s => s.isPR)).map(ex => ex.exerciseName);

    const savedSession = {
      id: Date.now().toString(),
      planId: plan?.id ?? null,
      sessionName: session.name,
      date: getTodayKey(),
      startedAt: startedAt.current,
      completedAt: new Date().toISOString(),
      durationMinutes: Math.round(workoutSeconds / 60),
      exercises: logExercises,
      totalVolume: Math.round(totalVolume),
      totalSets,
      prsAchieved,
      feelingRating: checkIn.feelingRating,
      energyLevel: checkIn.energyLevel,
      sleepLastNight: parseFloat(checkIn.sleepHours) || null,
      notes: checkIn.sessionNotes,
      cardioCompleted: checkIn.cardioCompleted ?? false,
      cardioMinutes: parseFloat(checkIn.cardioMinutes) || null,
      cardioModality: session.cardioBlock?.modality ?? session.cardioBlock?.type ?? null,
      cardioAvgHR: parseFloat(checkIn.cardioAvgHR) || null,
    };

    burst.fire({
      title: prsAchieved.length > 0 ? 'new PR!' : 'session saved.',
      subtitle: prsAchieved.length > 0
        ? `${prsAchieved.length} PR${prsAchieved.length > 1 ? 's' : ''} · ${totalSets} sets · ${Math.round(totalVolume).toLocaleString()} kg`
        : `${totalSets} sets · ${Math.round(totalVolume).toLocaleString()} kg moved`,
      after: () => onFinish(savedSession),
    });
  }

  // ── Phase: overview ───────────────────────────────────────────────────────

  if (phase === 'overview') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SessionOverview
          sessionName={session.name}
          exercises={localSessionExercises.map((ex: any) => ({
            name: ex.name,
            muscleGroup: ex.muscleGroup ?? '',
            isCompound: !!ex.isCompound,
            isPriorityLift: !!ex.isPriorityLift,
            sets: ex.sets ?? 3,
            reps: ex.reps ?? '8-12',
            restSeconds: ex.restSeconds ?? 90,
            plannedRir: ex.rir,
            plannedTempo: ex.tempo,
          }))}
          estimatedDurationMin={session.estimatedDurationMin ?? 60}
          musclesFocused={session.musclesFocused ?? []}
          cardioBlock={session.cardioBlock ?? null}
          topPad={topPad}
          bottomPad={bottomPad}
          onStart={() => {
            startWorkoutTimer();
            setPhase('logging');
          }}
          onBack={onEnd}
          onSwapExercise={(idx) => openSwap(idx, true)}
        />
        {/* SwapSheet available pre-start too */}
        <SwapSheet
          visible={swapExIdx !== null}
          options={swapOptions}
          exerciseName={swapExIdx !== null && swapExIdx < localSessionExercises.length
            ? (localSessionExercises[swapExIdx]?.name ?? '')
            : ''}
          completedSets={0}
          totalSets={localSessionExercises[swapExIdx ?? 0]?.sets ?? 3}
          bottomPad={bottomPad}
          onSwap={handleSwap}
          onClose={() => setSwapExIdx(null)}
        />
      </GestureHandlerRootView>
    );
  }

  // ── Phase: finish ─────────────────────────────────────────────────────────

  if (phase === 'finish') {
    const completedSetsForFinish = exercises.flatMap(ex => ex.sets.filter(s => s.completedAt && s.setType !== 'warmup'));
    const totalSetsForFinish = completedSetsForFinish.length;
    const totalVolForFinish = completedSetsForFinish.reduce((a, s) =>
      a + (parseFloat(s.weightKg) || 0) * (parseInt(s.reps) || 0), 0);
    const prsCount = exercises.reduce((a, ex) => a + ex.sets.filter(s => s.isPR).length, 0);

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <FinishCheckIn
          sessionName={session.name}
          durationMinutes={Math.round(workoutSeconds / 60)}
          totalSets={totalSetsForFinish}
          totalVolumeKg={totalVolForFinish}
          prsCount={prsCount}
          cardioBlock={session.cardioBlock ?? null}
          state={checkIn}
          onChange={patch => setCheckIn(prev => ({ ...prev, ...patch }))}
          onSave={handleSaveWorkout}
          topPad={topPad}
          bottomPad={bottomPad}
        />
        {burst.node}
      </GestureHandlerRootView>
    );
  }

  // ── Phase: logging ────────────────────────────────────────────────────────

  // Pre-calculate swap variables to avoid Babel optional-chaining/nullish-coalescing transpile crashes inside JSX
  const activeSwapEx = swapExIdx !== null ? exercises[swapExIdx] : null;
  const activeSwapExName = activeSwapEx ? activeSwapEx.exerciseName : '';
  const activeSwapCompletedSets = activeSwapEx ? activeSwapEx.sets.filter(s => s.completedAt).length : 0;
  const activeSwapTotalSets = activeSwapEx ? activeSwapEx.sets.length : 0;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>

        {/* PR banner */}
        {prBanner && (
          <Animated.View style={[s.prBanner, {
            backgroundColor: colors.highlight,
            borderBottomColor: colors.foreground,
            transform: [{ translateY: prBannerY }],
          }]}>
            <View style={[s.prDot, { backgroundColor: colors.orange }]} />
            <View>
              <Text style={[s.prName, { color: '#111111' }]}>new PR: {prBanner.name}</Text>
              <Text style={[s.prValue, { color: withAlpha('#111111', 0.7) }]}>{prBanner.type}: {prBanner.value} kg</Text>
            </View>
          </Animated.View>
        )}

        {/* Sticky top bar */}
        <View style={[s.topBar, {
          paddingTop: topPad,
          backgroundColor: colors.card,
          borderBottomColor: colors.foreground,
        }]}>
          <Pressable onPress={handleEndWorkout} hitSlop={12}>
            <Text style={[s.endBtn, { color: colors.persimmon }]}>end</Text>
          </Pressable>
          <View style={s.topCenter}>
            <Text style={[s.topSessionName, { color: colors.foreground }]} numberOfLines={1}>
              {session.name}
            </Text>
            <Text style={[s.topProgress, { color: colors.mutedForeground }]}>
              {completedWorkingSets}/{totalWorkingSets} sets
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => setReorderMode(v => !v)} hitSlop={12}>
              <Feather name="list" size={18} color={reorderMode ? colors.violet : colors.mutedForeground} />
            </Pressable>
            <Text style={[s.topTimer, { color: colors.violet }]}>{fmtTimer(workoutSeconds)}</Text>
          </View>
        </View>

        {/* Progress bar — working sets */}
        <View style={{ height: 3, backgroundColor: colors.muted }}>
          <View style={{
            height: 3,
            backgroundColor: colors.violet,
            width: `${progressPct * 100}%` as `${number}%`,
          }} />
        </View>

        {/* Scrollable exercise list */}
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 16,
            paddingBottom: restEndsAt !== null ? 180 + bottomPad : 20 + bottomPad,
          }}
          showsVerticalScrollIndicator={false}
          bottomOffset={16}>

            {exercises.map((ex, exIdx) => (
              <ExerciseLogCard
                key={`${exIdx}-${ex.exerciseName}`}
                exIdx={exIdx}
                exercise={ex}
                lastPerf={lastPerf[ex.exerciseName] ?? null}
                onTypeChange={handleTypeChange}
                onWeightChange={handleWeightChange}
                onRepsChange={handleRepsChange}
                onComplete={handleComplete}
                onRPE={handleRPE}
                onDeleteSet={handleDeleteSet}
                onAutofill={handleAutofill}
                onAddSet={handleAddSet}
                onNotesChange={handleNotesChange}
                onSwap={openSwap}
                reorderMode={reorderMode}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                totalExercises={exercises.length}
              />
            ))}

            {/* Finish button at end of list */}
            <View style={{ marginTop: 8 }}>
              <Pressable
                onPress={handleFinishWorkout}
                style={[s.finishBtn, {
                  backgroundColor: colors.primary,
                  borderColor: colors.foreground,
                }]}>
                <Text style={[s.finishBtnText, { color: colors.primaryForeground }]}>
                  finish workout
                </Text>
                <Feather name="check" size={18} color={colors.primaryForeground} />
              </Pressable>
            </View>
        </KeyboardAwareScrollView>

        {/* Rest timer bar (floats over list) */}
        {restEndsAt !== null && (
          <RestTimerBar
            restSeconds={restRemaining}
            restTotal={restTotal}
            bottomPad={bottomPad}
            onAdjust={adjustRest}
            onSkip={skipRest}
          />
        )}

        {/* Swap sheet */}
        <SwapSheet
          visible={swapExIdx !== null}
          options={swapOptions}
          exerciseName={activeSwapExName}
          completedSets={activeSwapCompletedSets}
          totalSets={activeSwapTotalSets}
          bottomPad={bottomPad}
          onSwap={handleSwap}
          onClose={() => setSwapExIdx(null)}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  prBanner:     { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99, flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: BRUTAL.border, gap: 12 },
  prDot:        { width: 10, height: 10, borderRadius: 5 },
  prName:       { fontFamily: F.bodySemi, fontSize: 14 },
  prValue:      { fontFamily: F.bodyReg, fontSize: 12 },
  topBar:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: BRUTAL.border },
  endBtn:       { fontFamily: F.bodySemi, fontSize: 13, minWidth: 32 },
  topCenter:    { flex: 1, alignItems: 'center' },
  topSessionName:{ fontFamily: F.bodySemi, fontSize: 14 },
  topProgress:  { fontFamily: F.mono, fontSize: 11, marginTop: 1 },
  topTimer:     { fontFamily: F.monoSemi, fontSize: 18, minWidth: 52, textAlign: 'right' },
  finishBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius },
  finishBtnText:{ fontFamily: F.bodyBold, fontSize: 16 },
});
