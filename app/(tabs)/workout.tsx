/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView, Platform, KeyboardAvoidingView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useProfile } from '@/stores/profile-store';
import { useWorkoutStore, migrateLegacyWorkoutData } from '@/stores/workout-store';
import { useCoachStore } from '@/stores/coach-store';
import { useUiStore } from '@/stores/ui-store';
import WorkoutPlanDisplay from '@/components/WorkoutPlanDisplay';
import WorkoutMainDashboard from '@/components/workout/WorkoutMainDashboard';
import SplitBuilder from '@/components/workout/SplitBuilder';
import ActiveWorkoutLogger from '@/components/workout/ActiveWorkoutLogger';
import SessionLogDetail from '@/components/workout/SessionLogDetail';
import WorkoutHistoryScreen from '@/components/workout/WorkoutHistoryScreen';
import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { BrutalBox, BrutalButton, BrutalProgress } from '@/components/brutal';
import { SectionLabel } from '@/components/workout/ui';
import { hydratePlan, buildExerciseMenu } from '@/lib/workout-hydrate';
import { withAlpha } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';
import type { GenerateWorkoutInputs } from '@/shared/types/api';
import { GeneratingLoader } from '@/components/workout/GeneratingLoader';
import { DOCK_SAFE_BOTTOM } from '@/components/navigation/BrutalDock';
import { usePressScale } from '@/components/motion/usePressScale';
import Animated from 'react-native-reanimated';

type ColorScheme = ReturnType<typeof useColors>;

// --- Animated chip component (needs hook = must be a real component) ----------
function MuscleChip({ label, sub, selected, onPress, colors, chipStyle }: {
  label: string; sub: string; selected: boolean;
  onPress: () => void; colors: ColorScheme;
  chipStyle: object;
}) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.96);
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[chipStyle, animatedStyle]}>
        <Text style={{ fontFamily: F.bodySemi, fontSize: 14, color: selected ? colors.primary : colors.foreground }}>{label}</Text>
        <Text style={{ fontFamily: F.bodyReg, fontSize: 11, color: colors.mutedForeground, marginTop: 1 }}>{sub}</Text>
      </Animated.View>
    </Pressable>
  );
}

// --- Constants ----------------------------------------------------------------

const MUSCLES = [
  { key: 'arms',      title: 'Arms',      sub: 'Biceps + triceps' },
  { key: 'legs',      title: 'Legs',      sub: 'Quads, hams, calves' },
  { key: 'chest',     title: 'Chest',     sub: 'Upper & lower pec' },
  { key: 'back',      title: 'Back',      sub: 'Width + thickness' },
  { key: 'shoulders', title: 'Shoulders', sub: 'Front, side, rear delt' },
  { key: 'core',      title: 'Core',      sub: 'Abs + lower back' },
  { key: 'glutes',    title: 'Glutes',    sub: 'Hip thrust focused' },
];

const CARDIO_TYPES = ['Running', 'Cycling', 'Rowing', 'Swimming', 'Walking', 'HIIT', 'Stairmaster', 'Jump rope', 'Other'];
const HEALTH_CONDITIONS = ['Bad knees', 'Lower back pain', 'Shoulder injury', 'Wrist pain', 'Heart condition', 'Herniated disc', 'Hip impingement', 'None of these'];
const SESS_TIMES = [
  { label: '45 min',   minutes: 45 },
  { label: '1 hr',     minutes: 60 },
  { label: '1.5 hrs',  minutes: 90 },
  { label: '2 hrs',    minutes: 120 },
  { label: '2.5 hrs',  minutes: 150 },
  { label: '3 hrs',    minutes: 180 },
];
const GOAL_LABELS: Record<string, string> = {
  fat_loss: 'Fat Loss', recomp: 'Recomp', muscle_gain: 'Muscle Gain', maintain: 'Maintain',
};

type WorkoutView = 'dashboard' | 'builder' | 'intake' | 'generating' | 'plan_preview' | 'plan_detail' | 'active_workout' | 'session_log' | 'history';

// --- Workout generation -------------------------------------------------------

const EQUIPMENT_FILTER: Record<string, Set<string>> = {
  full_gym: new Set(['barbell','dumbbell','machine','cable','bodyweight','kettlebell','band','smith','ez_bar','other']),
  dumbbells_only: new Set(['dumbbell','barbell','bodyweight','kettlebell','band','ez_bar']),
  home_minimal: new Set(['bodyweight','band','dumbbell']),
};

// Plan generation always runs through the authenticated backend, which holds the
// Gemini key server-side and enforces auth + rate limiting. The Gemini key is
// never bundled into the app (an EXPO_PUBLIC_* key is extractable from the APK).
async function generateWorkoutSkeleton(inputs: Record<string, any>): Promise<any> {
  const equipSet = EQUIPMENT_FILTER[inputs.equipment ?? 'full_gym'] ?? EQUIPMENT_FILTER.full_gym;
  const exerciseMenu = buildExerciseMenu(equipSet);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Sign in to generate a workout plan.');
  return apiClient.generateWorkout(session.access_token, { inputs: inputs as GenerateWorkoutInputs, exerciseMenu });
}


// --- Main Screen --------------------------------------------------------------
export default function WorkoutScreen() {
  const colors  = useColors();
  const s       = useMemo(() => makeStyles(colors), [colors]);
  const insets  = useSafeAreaInsets();
  const { profile: rawProfile, result } = useProfile();
  const profile = {
    goal:      rawProfile?.goalMode ?? 'recomp',
    weightKg:  rawProfile?.weightKg ?? 70,
    sex:       rawProfile?.sex ?? 'male',
    age:       rawProfile?.age ?? 25,
  };

  const topPad    = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const plans          = useWorkoutStore(s => s.plans);
  const logs           = useWorkoutStore(s => s.logs);
  const storeAddPlan   = useWorkoutStore(s => s.addPlan);
  const storeAddLog    = useWorkoutStore(s => s.addLog);
  const storeDeleteLog = useWorkoutStore(s => s.deleteLog);
  const storeSetActive = useWorkoutStore(s => s.setActivePlan);
  const storeDeletePlan= useWorkoutStore(s => s.deletePlan);
  const storeUpdatePlan= useWorkoutStore(s => s.updatePlan);

  useEffect(() => { migrateLegacyWorkoutData(); }, []);

  const pendingWorkoutAction      = useCoachStore(s => s.pendingWorkoutAction);
  const clearPendingWorkoutAction = useCoachStore(s => s.clearPendingWorkoutAction);

  // Consume pending coach action when this tab gains focus
  useFocusEffect(
    React.useCallback(() => {
      if (!pendingWorkoutAction) return;
      const action = pendingWorkoutAction;
      clearPendingWorkoutAction();

      if (action.kind === 'generate') {
        const inp = action.inputs ?? {};
        if (inp.daysPerWeek)      setDaysPerWeek(inp.daysPerWeek);
        if (inp.sessionMinutes)   setSessionMinutes(inp.sessionMinutes);
        if (inp.weakMuscles)      setWeakMuscles(inp.weakMuscles);
        if (inp.favouriteMuscles) setFavouriteMuscles(inp.favouriteMuscles);
        if (inp.healthConditions) setHealthConditions(inp.healthConditions);
        setStep(inp.daysPerWeek && inp.sessionMinutes ? 2 : 1);
        setView('intake');
        return;
      }

      if (action.kind === 'start') {
        const active = plans.find(p => p.isActive) ?? plans[0] ?? null;
        if (!active) return;
        const session = active.sessions?.find((s: any) => s.name === action.sessionName)
          ?? active.sessions?.[0]
          ?? null;
        if (!session) return;
        setSelectedSession(session);
        setSelectedPlanForSession(active);
        setView('active_workout');
        return;
      }

      if (action.kind === 'edit_plan') {
        const plan = plans.find(p => p.id === action.planId) ?? null;
        if (!plan) return;
        if (action.op === 'swap_exercise') {
          setEditingPlan(plan);
          setView('builder');
        } else {
          setSelectedPlan(plan);
          setView('plan_detail');
        }
        return;
      }

      if (action.kind === 'edit_notes') {
        const plan = plans.find(p => p.isActive) ?? plans[0] ?? null;
        if (!plan) return;
        setSelectedPlan(plan);
        setView('plan_detail');
      }
    }, [pendingWorkoutAction, clearPendingWorkoutAction, plans])
  );

  const [view, setView]                               = useState<WorkoutView>('dashboard');
  const [selectedPlan, setSelectedPlan]               = useState<any>(null);
  const [selectedSession, setSelectedSession]         = useState<any>(null);
  const [selectedPlanForSession, setSelectedPlanForSession] = useState<any>(null);
  const [selectedLog, setSelectedLog]                 = useState<any>(null);
  const [generatedPlan, setGeneratedPlan]             = useState<any>(null);
  const [restoreWorkout, setRestoreWorkout]           = useState<any>(null);
  const [editingPlan, setEditingPlan]                 = useState<any>(null);

  const setDockVisible = useUiStore((s) => s.setDockVisible);

  useEffect(() => {
    setDockVisible(view === 'dashboard');
    return () => setDockVisible(true);
  }, [view, setDockVisible]);

  // Intake state
  const [step, setStep]                         = useState(1); // 1, 2, or 3
  const [daysPerWeek, setDaysPerWeek]           = useState(0);
  const [show7Warn, setShow7Warn]               = useState(false);
  const [sessionMinutes, setSessionMinutes]     = useState(0);
  const [restDaysPerWeek, setRestDaysPerWeek]   = useState(1);
  const [experienceLevel, setExperienceLevel]   = useState<'beginner' | 'intermediate' | 'advanced' | null>(null);
  const [equipmentLevel, setEquipmentLevel]     = useState<'full_gym' | 'dumbbells_only' | 'home_minimal' | null>(null);
  const [splitLengthWeeks, setSplitLengthWeeks] = useState<number | null>(null);
  const [doesCardio, setDoesCardio]             = useState<'yes' | 'open' | 'no' | null>(null);
  const [cardioTypes, setCardioTypes]           = useState<string[]>([]);
  const [weakMuscles, setWeakMuscles]           = useState<string[]>([]);
  const [favouriteMuscles, setFavouriteMuscles] = useState<string[]>([]);
  const [healthConditions, setHealthConditions] = useState<string[]>([]);
  const [healthNotes, setHealthNotes]           = useState('');
  const [genError, setGenError]                 = useState('');
  const [genComplete, setGenComplete]           = useState(false);
  // Speculative prefetch: fired when user enters step 3 (final review)
  const prefetchRef  = useRef<Promise<any> | null>(null);
  const prefetchHash = useRef<string>('');

  // --- Plan management -------------------------------------------------------
  function handleSavePlan(plan: any, setAsActive: boolean) {
    storeAddPlan({ ...plan, id: Date.now().toString(), createdAt: new Date().toISOString(), isActive: setAsActive || plans.length === 0, source: plan.source ?? 'ai' });
    setView('dashboard');
  }

  function handleBuilderSave(plan: any, setActive: boolean) {
    if (editingPlan) {
      storeUpdatePlan(editingPlan.id, { ...plan, id: editingPlan.id, createdAt: editingPlan.createdAt, isActive: editingPlan.isActive, source: 'manual' });
    } else {
      storeAddPlan({ ...plan, id: Date.now().toString(), createdAt: new Date().toISOString(), isActive: setActive || plans.length === 0, source: 'manual' });
    }
    setEditingPlan(null);
    setView('dashboard');
  }

  function handleSaveLog(log: any) {
    if (log.skipped) {
      storeAddLog(log);
      return;
    }

    const today = log.date;
    const duplicate = logs.find((l: any) => l.date === today && !l.skipped);
    if (duplicate) {
      Alert.alert(
        'workout already logged today',
        'You have already completed a workout session today. Would you like to replace it, or save this as a separate session (which will split the volumes to prevent double-counting)?',
        [
          {
            text: 'replace existing',
            onPress: () => {
              storeDeleteLog(duplicate.id);
              storeAddLog(log);
              setSelectedLog(log);
              setView('session_log');
            },
          },
          {
            text: 'keep both (split volume)',
            onPress: () => {
              const updatedDuplicate = {
                ...duplicate,
                totalVolume: Math.round(duplicate.totalVolume / 2),
                exercises: duplicate.exercises.map((ex: any) => ({
                  ...ex,
                  totalVolume: Math.round(ex.totalVolume / 2),
                  sets: ex.sets.map((s: any) => ({
                    ...s,
                    weightKg: Math.round((s.weightKg / 2) * 10) / 10,
                  })),
                })),
              };
              
              const updatedNewLog = {
                ...log,
                totalVolume: Math.round(log.totalVolume / 2),
                exercises: log.exercises.map((ex: any) => ({
                  ...ex,
                  totalVolume: Math.round(ex.totalVolume / 2),
                  sets: ex.sets.map((s: any) => ({
                    ...s,
                    weightKg: Math.round((s.weightKg / 2) * 10) / 10,
                  })),
                })),
              };

              storeDeleteLog(duplicate.id);
              storeAddLog(updatedDuplicate);
              storeAddLog(updatedNewLog);
              setSelectedLog(updatedNewLog);
              setView('session_log');
            },
          },
          {
            text: 'cancel',
            style: 'cancel',
            onPress: () => {
              setView('dashboard');
            }
          }
        ]
      );
    } else {
      storeAddLog(log);
      setSelectedLog(log);
      setView('session_log');
    }
  }

  // Reset genComplete whenever we leave the generating view
  useEffect(() => {
    if (view !== 'generating') setGenComplete(false);
  }, [view]);

  // --- Intake helpers --------------------------------------------------------
  function toggleMuscle(key: string, arr: string[], setArr: (v: string[]) => void) {
    setArr(arr.includes(key) ? arr.filter(k => k !== key) : [...arr, key]);
  }
  function toggleCardioType(t: string) {
    setCardioTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }
  function toggleCondition(c: string) {
    if (c === 'None of these') { setHealthConditions(['None of these']); return; }
    const without = healthConditions.filter(x => x !== 'None of these');
    setHealthConditions(without.includes(c) ? without.filter(x => x !== c) : [...without, c]);
  }

  function buildInputs() {
    return {
      goal: profile.goal, sex: profile.sex, age: profile.age, weightKg: profile.weightKg,
      daysPerWeek, sessionMinutes, restDaysPerWeek,
      experience: experienceLevel ?? 'intermediate',
      equipment: equipmentLevel ?? 'full_gym',
      splitLengthWeeks: splitLengthWeeks ?? 8,
      weakMuscles, favouriteMuscles,
      healthConditions: healthConditions.filter(c => c !== 'None of these'),
    };
  }

  function inputsHash(inputs: Record<string, any>): string {
    return JSON.stringify(inputs);
  }

  // Kick off a speculative prefetch when entering the final review step
  function triggerPrefetch() {
    const inputs = buildInputs();
    const hash = inputsHash(inputs);
    if (prefetchHash.current === hash && prefetchRef.current) return; // already in-flight for same inputs
    prefetchHash.current = hash;
    prefetchRef.current = generateWorkoutSkeleton(inputs).catch(() => null);
  }

  async function handleGenerate() {
    setGenError('');
    setGenComplete(false);
    setView('generating');
    try {
      const inputs = buildInputs();
      const hash = inputsHash(inputs);
      let skeletonPromise: Promise<any>;
      if (prefetchRef.current && prefetchHash.current === hash) {
        skeletonPromise = prefetchRef.current;
      } else {
        skeletonPromise = generateWorkoutSkeleton(inputs);
      }
      prefetchRef.current = null;
      prefetchHash.current = '';
      const skeleton = await skeletonPromise;
      if (!skeleton) throw new Error('Generation failed. Tap generate again.');
      const plan = hydratePlan(skeleton, { goal: profile.goal, age: profile.age, doesCardio: doesCardio || 'no', cardioTypes, daysPerWeek });
      setGenComplete(true);
      // Brief pause so the snap-to-100% spring plays before navigating
      await new Promise(r => setTimeout(r, 500));
      setGeneratedPlan(plan);
      setView('plan_preview');
    } catch (e: any) {
      setGenError(e.message || 'Generation failed. check your API key.');
      setView('intake');
      setStep(2);
    }
  }

  // --- Shared sub-components -------------------------------------------------
  function IntakeHeader() {
    return (
      <View style={s.intakeHeader}>
        <Pressable
          onPress={() => {
            if (step > 1) setStep((v: number) => v - 1);
            else if (plans.length > 0) setView('dashboard');
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={s.backBtn}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <BrutalProgress step={step} total={3} />
        </View>
      </View>
    );
  }

  function MuscleGrid({ selected, onToggle }: { selected: string[]; onToggle: (k: string) => void }) {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {MUSCLES.map(m => {
          const sel = selected.includes(m.key);
          return (
            <MuscleChip
              key={m.key}
              label={m.title}
              sub={m.sub}
              selected={sel}
              onPress={() => onToggle(m.key)}
              colors={colors}
              chipStyle={[s.muscleChip, {
                backgroundColor: sel ? withAlpha(colors.primary, 0.08) : colors.card,
                borderColor: sel ? colors.primary : colors.foreground,
                borderWidth: sel ? BRUTAL.border : BRUTAL.borderThin,
              }]}
            />
          );
        })}
      </View>
    );
  }

  // --- Step 1: basics (days + session time) ----------------------------------
  function renderIntakeStep1() {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.pad, { paddingBottom: bottomPad + 80 }]}>
        {/* Days */}
        <Text style={s.stepTitle}>how many days a week?</Text>
        <Text style={s.stepSub}>be honest. more isn't always better fr</Text>
        <View style={s.dayGrid}>
          {[2, 3, 4, 5, 6, 7].map(d => (
            <Pressable
              key={d}
              onPress={() => {
                setDaysPerWeek(d);
                setShow7Warn(d === 7);
              }}
              style={[s.dayTile, {
                backgroundColor: daysPerWeek === d ? colors.primary : colors.card,
                borderColor: colors.foreground,
              }]}>
              <Text style={{ fontFamily: F.displayBold, fontSize: 28, color: daysPerWeek === d ? colors.primaryForeground : colors.foreground }}>{d}</Text>
            </Pressable>
          ))}
        </View>

        {show7Warn && (
          <View style={[s.infoCard, { borderLeftColor: colors.orange, marginBottom: 16 }]}>
            <Text style={s.infoText}>
              lowkey, 7 days straight piles up fatigue faster than gains. your CNS needs downtime. even elite athletes take rest days.
            </Text>
            <BrutalButton
              label="train 6 days (recommended)"
              variant="primary"
              height={44}
              style={{ marginTop: 10 }}
              onPress={() => { setDaysPerWeek(6); setShow7Warn(false); }}
            />
          </View>
        )}

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: withAlpha(colors.foreground, 0.12), marginVertical: 20 }} />

        {/* Session time */}
        <Text style={s.stepTitle}>how long per session?</Text>
        <Text style={s.stepSub}>including warm-up, workout, and cardio</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {SESS_TIMES.map(t => (
            <Pressable
              key={t.minutes}
              onPress={() => setSessionMinutes(t.minutes)}
              style={[s.timeChip, {
                width: '47%',
                backgroundColor: sessionMinutes === t.minutes ? colors.primary : colors.card,
                borderColor: colors.foreground,
              }]}>
              <Text style={{ fontFamily: F.bodySemi, fontSize: 15, color: sessionMinutes === t.minutes ? colors.primaryForeground : colors.foreground }}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: withAlpha(colors.foreground, 0.12), marginVertical: 20 }} />

        {/* Rest days */}
        <Text style={s.stepTitle}>how many rest days per week?</Text>
        <Text style={s.stepSub}>more rest = better recovery = more muscle. don't skip this.</Text>
        <View style={s.dayGrid}>
          {[0, 1, 2, 3, 4].map(d => (
            <Pressable
              key={d}
              onPress={() => setRestDaysPerWeek(d)}
              style={[s.dayTile, {
                backgroundColor: restDaysPerWeek === d ? colors.primary : colors.card,
                borderColor: colors.foreground,
              }]}>
              <Text style={{ fontFamily: F.displayBold, fontSize: 28, color: restDaysPerWeek === d ? colors.primaryForeground : colors.foreground }}>{d}</Text>
            </Pressable>
          ))}
        </View>
        {restDaysPerWeek === 0 && daysPerWeek >= 5 && (
          <View style={[s.infoCard, { borderLeftColor: colors.orange }]}>
            <Text style={s.infoText}>training every day without rest days significantly increases injury risk. at least 1 rest day is strongly recommended.</Text>
          </View>
        )}
      </ScrollView>
    );
  }

  // --- Step 2: preferences (everything else + generate) ---------------------
  function renderIntakeStep2() {
    const showCardioTypes = doesCardio === 'yes' || doesCardio === 'open';
    const CARDIO_OPTS = [
      { key: 'yes',  title: 'yes, I do cardio',              sub: 'running, cycling, rowing, walking, any of it' },
      { key: 'open', title: "not really, but I'm open to it", sub: "we'll recommend what makes sense for your goal" },
      { key: 'no',   title: 'no cardio, gym only',           sub: 'strictly iron' },
    ];
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.pad, { paddingBottom: bottomPad + 100 }]}>

          <Text style={s.stepTitle}>now, let's customize.</Text>
          <Text style={s.stepSub}>these help us pick the right exercises and volume</Text>

          {/* Experience level */}
          <SectionLabel style={{ marginBottom: 8 }}>TRAINING EXPERIENCE</SectionLabel>
          {([
            { key: 'beginner',     title: 'beginner',      sub: 'under 1 year lifting consistently' },
            { key: 'intermediate', title: 'intermediate',  sub: '1-3 years, know the basics' },
            { key: 'advanced',     title: 'advanced',      sub: '3+ years, track PRs, comfortable with percentages' },
          ] as const).map(opt => (
            <Pressable
              key={opt.key}
              onPress={() => setExperienceLevel(opt.key)}
              style={[s.bigCard, {
                backgroundColor: experienceLevel === opt.key ? withAlpha(colors.primary, 0.08) : colors.card,
                borderColor: colors.foreground,
                borderLeftWidth: experienceLevel === opt.key ? BRUTAL.border : BRUTAL.borderThin,
              }]}>
              <Text style={{ fontFamily: F.bodySemi, fontSize: 15, color: colors.foreground, marginBottom: 2 }}>{opt.title}</Text>
              <Text style={{ fontFamily: F.bodyReg, fontSize: 12, color: colors.mutedForeground }}>{opt.sub}</Text>
            </Pressable>
          ))}

          <View style={[s.divider, { backgroundColor: withAlpha(colors.foreground, 0.12) }]} />

          {/* Equipment */}
          <SectionLabel style={{ marginBottom: 8 }}>EQUIPMENT AVAILABLE</SectionLabel>
          {([
            { key: 'full_gym',       title: 'full gym',        sub: 'barbells, machines, cables, dumbbells. the works' },
            { key: 'dumbbells_only', title: 'dumbbells + basics', sub: 'dumbbells, barbells, bands, bodyweight. no machines or cables' },
            { key: 'home_minimal',   title: 'home / minimal',  sub: 'bodyweight, bands, maybe a few dumbbells' },
          ] as const).map(opt => (
            <Pressable
              key={opt.key}
              onPress={() => setEquipmentLevel(opt.key)}
              style={[s.bigCard, {
                backgroundColor: equipmentLevel === opt.key ? withAlpha(colors.primary, 0.08) : colors.card,
                borderColor: colors.foreground,
                borderLeftWidth: equipmentLevel === opt.key ? BRUTAL.border : BRUTAL.borderThin,
              }]}>
              <Text style={{ fontFamily: F.bodySemi, fontSize: 15, color: colors.foreground, marginBottom: 2 }}>{opt.title}</Text>
              <Text style={{ fontFamily: F.bodyReg, fontSize: 12, color: colors.mutedForeground }}>{opt.sub}</Text>
            </Pressable>
          ))}

          <View style={[s.divider, { backgroundColor: withAlpha(colors.foreground, 0.12) }]} />

          {/* Cardio */}
          <SectionLabel style={{ marginBottom: 10 }}>DO YOU DO CARDIO?</SectionLabel>
          {CARDIO_OPTS.map(opt => (
            <Pressable
              key={opt.key}
              onPress={() => setDoesCardio(opt.key as any)}
              style={[s.bigCard, {
                backgroundColor: doesCardio === opt.key ? withAlpha(colors.primary, 0.08) : colors.card,
                borderColor: colors.foreground,
                borderLeftWidth: doesCardio === opt.key ? BRUTAL.border : BRUTAL.borderThin,
              }]}>
              <Text style={{ fontFamily: F.bodySemi, fontSize: 15, color: colors.foreground, marginBottom: 2 }}>{opt.title}</Text>
              <Text style={{ fontFamily: F.bodyReg, fontSize: 12, color: colors.mutedForeground }}>{opt.sub}</Text>
            </Pressable>
          ))}

          {showCardioTypes && (
            <View style={{ marginTop: 4, marginBottom: 4 }}>
              <Text style={[s.inputLabel, { marginBottom: 8, marginTop: 8 }]}>what kind? (multi-select)</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {CARDIO_TYPES.map(t => (
                  <Pressable
                    key={t}
                    onPress={() => toggleCardioType(t)}
                    style={[s.chip, {
                      backgroundColor: cardioTypes.includes(t) ? colors.primary : colors.card,
                      borderColor: colors.foreground,
                    }]}>
                    <Text style={{ fontFamily: F.bodyMed, fontSize: 13, color: cardioTypes.includes(t) ? colors.primaryForeground : colors.mutedForeground }}>{t}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Weak muscles */}
          <View style={[s.divider, { backgroundColor: withAlpha(colors.foreground, 0.12) }]} />
          <SectionLabel style={{ marginBottom: 8 }}>ANY LAGGING MUSCLES?</SectionLabel>
          <Text style={[s.stepSub, { marginBottom: 12 }]}>we'll hit these first when your CNS is fresh</Text>
          <MuscleGrid selected={weakMuscles} onToggle={k => toggleMuscle(k, weakMuscles, setWeakMuscles)} />
          {weakMuscles.length > 0 && (
            <Pressable onPress={() => setWeakMuscles([])} style={{ marginTop: 10 }}>
              <Text style={{ fontFamily: F.bodyMed, fontSize: 13, color: colors.mutedForeground, textDecorationLine: 'underline' }}>clear</Text>
            </Pressable>
          )}

          {/* Favourite muscles */}
          <View style={[s.divider, { backgroundColor: withAlpha(colors.foreground, 0.12) }]} />
          <SectionLabel style={{ marginBottom: 8 }}>WHAT DO YOU LOVE HITTING?</SectionLabel>
          <Text style={[s.stepSub, { marginBottom: 12 }]}>1–2 bonus sets for these, ngl</Text>
          <MuscleGrid selected={favouriteMuscles} onToggle={k => toggleMuscle(k, favouriteMuscles, setFavouriteMuscles)} />
          {favouriteMuscles.length > 0 && (
            <Pressable onPress={() => setFavouriteMuscles([])} style={{ marginTop: 10 }}>
              <Text style={{ fontFamily: F.bodyMed, fontSize: 13, color: colors.mutedForeground, textDecorationLine: 'underline' }}>clear</Text>
            </Pressable>
          )}

          {/* Health conditions */}
          <View style={[s.divider, { backgroundColor: withAlpha(colors.foreground, 0.12) }]} />
          <SectionLabel style={{ marginBottom: 8 }}>ANY PHYSICAL LIMITATIONS?</SectionLabel>
          <Text style={[s.stepSub, { marginBottom: 12 }]}>we'll modify exercises to work around these</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {HEALTH_CONDITIONS.map(c => (
              <Pressable
                key={c}
                onPress={() => toggleCondition(c)}
                style={[s.chip, {
                  backgroundColor: healthConditions.includes(c) ? colors.primary : colors.card,
                  borderColor: colors.foreground,
                }]}>
                <Text style={{ fontFamily: F.bodyMed, fontSize: 13, color: healthConditions.includes(c) ? colors.primaryForeground : colors.mutedForeground }}>{c}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={healthNotes}
            onChangeText={setHealthNotes}
            placeholder="anything else? (e.g. recovering from ACL, mild scoliosis...)"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[s.textIn, { color: colors.foreground, marginTop: 12 }]}
          />

          {/* Split length */}
          <View style={[s.divider, { backgroundColor: withAlpha(colors.foreground, 0.12) }]} />
          <SectionLabel style={{ marginBottom: 8 }}>HOW LONG IS YOUR MESOCYCLE?</SectionLabel>
          <Text style={[s.stepSub, { marginBottom: 12 }]}>weeks before a deload or program change (optional)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {([4, 6, 8, 12, 16] as const).map(w => (
              <Pressable
                key={w}
                onPress={() => setSplitLengthWeeks(splitLengthWeeks === w ? null : w)}
                style={[s.chip, {
                  backgroundColor: splitLengthWeeks === w ? colors.primary : colors.card,
                  borderColor: colors.foreground,
                }]}>
                <Text style={{ fontFamily: F.bodySemi, fontSize: 14, color: splitLengthWeeks === w ? colors.primaryForeground : colors.mutedForeground }}>
                  {w} weeks
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Medical disclaimer */}
          <View style={[s.infoCard, { borderLeftColor: colors.orange, marginTop: 20 }]}>
            <Text style={{ fontFamily: F.bodySemi, fontSize: 12, color: colors.orange, marginBottom: 4 }}>not medical advice</Text>
            <Text style={{ fontFamily: F.bodyReg, fontSize: 12, color: colors.mutedForeground, lineHeight: 18 }}>
              if you have a serious condition, consult a physio first. we modify exercises based on common adaptations, not clinical assessment.
            </Text>
          </View>

          {/* Error */}
          {!!genError && (
            <View style={[s.infoCard, { borderLeftColor: colors.destructive, marginTop: 12 }]}>
              <Text style={{ fontFamily: F.bodyReg, fontSize: 13, color: colors.destructive, lineHeight: 20 }}>
                {genError}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // --- Step 3: review & generate --------------------------------------------
  function renderIntakeStep3() {
    const summaryItems = [
      { label: 'GOAL', value: profile.goal?.replace('_', ' ') ?? '-' },
      { label: 'DAYS / WEEK', value: daysPerWeek > 0 ? String(daysPerWeek) : '-' },
      { label: 'REST DAYS', value: String(restDaysPerWeek) },
      { label: 'SESSION', value: sessionMinutes > 0 ? `${sessionMinutes} min` : '-' },
      { label: 'EXPERIENCE', value: experienceLevel ?? 'intermediate' },
      { label: 'EQUIPMENT', value: (equipmentLevel ?? 'full_gym').replace('_', ' ') },
      { label: 'MESOCYCLE', value: splitLengthWeeks ? `${splitLengthWeeks} weeks` : '8 weeks (default)' },
    ];
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.pad, { paddingBottom: bottomPad + 80 }]}>
        <Text style={s.stepTitle}>ready to generate.</Text>
        <Text style={[s.stepSub, { marginBottom: 20 }]}>here's what we're working with</Text>
        <BrutalBox style={{ padding: 14 }}>
          {summaryItems.map((item, i) => (
            <View key={item.label} style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              paddingVertical: 10,
              borderBottomWidth: i < summaryItems.length - 1 ? 1 : 0,
              borderBottomColor: withAlpha(colors.foreground, 0.08),
            }}>
              <Text style={{ fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 1, color: colors.mutedForeground }}>{item.label}</Text>
              <Text style={{ fontFamily: F.bodySemi, fontSize: 14, color: colors.foreground, textTransform: 'capitalize' }}>{item.value}</Text>
            </View>
          ))}
        </BrutalBox>
        {weakMuscles.length > 0 && (
          <View style={[s.infoCard, { borderLeftColor: colors.violet, marginTop: 14 }]}>
            <Text style={{ fontFamily: F.bodySemi, fontSize: 12, color: colors.violet, marginBottom: 4 }}>priority muscles</Text>
            <Text style={{ fontFamily: F.bodyReg, fontSize: 13, color: colors.mutedForeground }}>{weakMuscles.join(', ')}</Text>
          </View>
        )}
        {!!genError && (
          <View style={[s.infoCard, { borderLeftColor: colors.destructive, marginTop: 12 }]}>
            <Text style={{ fontFamily: F.bodyReg, fontSize: 13, color: colors.destructive, lineHeight: 20 }}>{genError}</Text>
          </View>
        )}
      </ScrollView>
    );
  }

  // --- View routing ----------------------------------------------------------
  if (view === 'dashboard') {
    return (
      <WorkoutMainDashboard
        plans={plans} logs={logs} topPad={topPad} bottomPad={bottomPad}
        onNewPlan={() => { setStep(1); setView('intake'); }}
        onBuildManual={() => { setEditingPlan(null); setView('builder'); }}
        onStartWorkout={(session, plan) => { setSelectedSession(session); setSelectedPlanForSession(plan); setView('active_workout'); }}
        onViewPlan={(plan) => { setSelectedPlan(plan); setView('plan_detail'); }}
        onViewLog={(log) => { setSelectedLog(log); setView('session_log'); }}
        onViewHistory={() => setView('history')}
        onRestoreWorkout={(workout) => { setRestoreWorkout(workout); setView('active_workout'); }}
        onSetActivePlan={id => storeSetActive(id)}
        onDeletePlan={id => storeDeletePlan(id)}
        onSaveLog={handleSaveLog}
      />
    );
  }

  if (view === 'active_workout') {
    const session = restoreWorkout
      ? (plans.find(p => p.id === restoreWorkout.planId)?.sessions?.find((s: any) => s.name === restoreWorkout.sessionName) ?? { name: restoreWorkout.sessionName, exercises: [] })
      : selectedSession;
    const plan = restoreWorkout ? (plans.find(p => p.id === restoreWorkout.planId) ?? null) : selectedPlanForSession;
    return (
      <ActiveWorkoutLogger
        session={session} plan={plan} initialWorkout={restoreWorkout ?? undefined}
        topPad={topPad} bottomPad={bottomPad}
        onFinish={(log) => { setRestoreWorkout(null); handleSaveLog(log); }}
        onEnd={() => { setRestoreWorkout(null); setView('dashboard'); }}
      />
    );
  }

  if (view === 'session_log') {
    return <SessionLogDetail log={selectedLog} topPad={topPad} bottomPad={bottomPad} onBack={() => setView('dashboard')} />;
  }

  if (view === 'history') {
    return <WorkoutHistoryScreen logs={logs} topPad={topPad} bottomPad={bottomPad} onBack={() => setView('dashboard')} onViewLog={(log) => { setSelectedLog(log); setView('session_log'); }} />;
  }

  if (view === 'plan_detail') {
    return (
      <WorkoutPlanDisplay
        plan={selectedPlan} daysPerWeek={0} sessionMinutes={0}
        goalLabel={GOAL_LABELS[profile.goal] ?? 'Recomp'}
        topPad={topPad} bottomPad={bottomPad} existingPlans={plans}
        onReset={() => setView('dashboard')} onSaved={handleSavePlan}
        onEdit={() => { setEditingPlan(selectedPlan); setView('builder'); }}
      />
    );
  }

  if (view === 'builder') {
    return (
      <SplitBuilder
        existingPlan={editingPlan} topPad={topPad} bottomPad={bottomPad}
        onCancel={() => { setEditingPlan(null); setView('dashboard'); }}
        onSave={handleBuilderSave}
      />
    );
  }

  // --- Generating loader -----------------------------------------------------
  if (view === 'generating') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad + 20 }}>
        <GeneratingLoader
          complete={genComplete}
          expectedDurationMs={22_000}
          onBuildManual={() => { setEditingPlan(null); setView('builder'); }}
        />
      </View>
    );
  }

  if (view === 'plan_preview' && generatedPlan) {
    return (
      <WorkoutPlanDisplay
        plan={generatedPlan} daysPerWeek={daysPerWeek} sessionMinutes={sessionMinutes}
        goalLabel={GOAL_LABELS[profile.goal] ?? 'Recomp'}
        topPad={topPad} bottomPad={bottomPad} existingPlans={plans}
        onReset={() => { setView('intake'); setStep(1); }} onSaved={handleSavePlan}
      />
    );
  }

  // --- Intake form -----------------------------------------------------------
  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: topPad }}>
        <IntakeHeader />
      </View>

      {step === 1 && renderIntakeStep1()}
      {step === 2 && renderIntakeStep2()}
      {step === 3 && renderIntakeStep3()}

      {/* Footer CTA */}
      <View style={[s.footer, { paddingBottom: bottomPad + DOCK_SAFE_BOTTOM, backgroundColor: colors.background, borderTopColor: colors.foreground }]}>
        {step === 1 ? (
          <BrutalButton
            label="next →"
            variant="primary"
            height={56}
            disabled={daysPerWeek === 0 || sessionMinutes === 0}
            onPress={() => setStep(2)}
          />
        ) : step === 2 ? (
          <BrutalButton
            label="next →"
            variant="primary"
            height={56}
            onPress={() => { setStep(3); triggerPrefetch(); }}
          />
        ) : (
          <BrutalButton
            label="generate my workout"
            variant="primary"
            height={60}
            onPress={handleGenerate}
          />
        )}
      </View>
    </View>
  );
}

// --- Styles -------------------------------------------------------------------
function makeStyles(c: ColorScheme) {
  return StyleSheet.create({
    root:          { flex: 1 },
    intakeHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
    backBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    pad:           { padding: 16 },
    stepTitle:     { fontFamily: F.displayBold, fontSize: 24, fontStyle: 'italic', letterSpacing: -0.5, color: c.foreground, marginBottom: 6 },
    stepSub:       { fontFamily: F.bodyReg, fontSize: 14, color: c.mutedForeground, marginBottom: 16, lineHeight: 21 },
    inputLabel:    { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: c.mutedForeground },
    dayGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
    dayTile:       { width: 72, height: 72, borderRadius: BRUTAL.radius, borderWidth: BRUTAL.borderThin, alignItems: 'center', justifyContent: 'center' },
    infoCard:      { backgroundColor: c.card, borderRadius: BRUTAL.radius, padding: 14, borderWidth: BRUTAL.borderThin, borderColor: c.foreground, borderLeftWidth: BRUTAL.border, marginBottom: 8 },
    infoText:      { fontFamily: F.bodyReg, fontSize: 13, color: c.mutedForeground, lineHeight: 21 },
    chip:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BRUTAL.radius, borderWidth: BRUTAL.borderThin },
    textIn:        { backgroundColor: c.card, borderRadius: BRUTAL.radius, borderWidth: BRUTAL.borderThin, borderColor: c.foreground, paddingHorizontal: 14, paddingVertical: 12, fontFamily: F.bodyReg, fontSize: 14, minHeight: 60 },
    timeChip:      { height: 56, borderRadius: BRUTAL.radius, borderWidth: BRUTAL.borderThin, alignItems: 'center', justifyContent: 'center' },
    bigCard:       { borderRadius: BRUTAL.radius, borderWidth: BRUTAL.borderThin, padding: 14, marginBottom: 10 },
    muscleChip:    { borderRadius: BRUTAL.radius, padding: 12, width: '47%' },
    divider:       { height: 1, marginVertical: 20 },
    footer:        { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: BRUTAL.border },
  });
}
