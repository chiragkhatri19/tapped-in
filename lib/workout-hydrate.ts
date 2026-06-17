/* eslint-disable @typescript-eslint/no-explicit-any -- raw untyped model JSON boundary; validated + DB-filled */
// AI plan: model returns a thin SKELETON (split + sessions of exerciseId+sets+tempo+rir),
// we hydrate the full WorkoutPlan locally from the exercise DB.
// hydratePlan never throws on field-level issues — it fills from DB defaults.
// It only throws if the skeleton has no usable sessions (caller catches → manual fallback).

import {
  EXERCISES, VOLUME_GROUPS, getExerciseById,
  type VolumeGroup,
} from '@/data/exercises';
import {
  computeWeeklyVolume, planCitations, progressionRule, progressionPlan, estimateSessionDuration,
} from '@/lib/workout-plan';
import { buildCardioProgram, type CardioInputs } from '@/lib/cardio-engine';
import type { WorkoutPlan, WorkoutSession, WorkoutExercise, CardioSession } from '@/stores/workout-store';
import { WORKOUT_SKELETON_SCHEMA } from '@/shared/prompts/workout';

const WEEKDAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

// Re-export the shared schema so existing callers importing from here still work.
export { WORKOUT_SKELETON_SCHEMA as SKELETON_SCHEMA };

// -- Compact exercise menu for the prompt (valid ids per muscle) ---------------
export function buildExerciseMenu(allowedEquipment?: Set<string>): string {
  return VOLUME_GROUPS.map(group => {
    const ids = EXERCISES
      .filter(e => e.primaryMuscle === group && (!allowedEquipment || allowedEquipment.has(e.equipment)))
      .map(e => e.id);
    return ids.length > 0 ? `${group}: ${ids.join(', ')}` : null;
  }).filter(Boolean).join('\n');
}

// -- Helpers -------------------------------------------------------------------
function prettify(id: string): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const MUSCLE_KEYWORDS: [string, VolumeGroup][] = [
  ['chest','chest'], ['bench','chest'], ['fly','chest'], ['press_chest','chest'],
  ['back','back'], ['row','back'], ['pulldown','back'], ['pull_up','back'], ['deadlift','back'],
  ['shoulder','shoulders'], ['ohp','shoulders'], ['lateral','shoulders'], ['delt','shoulders'],
  ['bicep','biceps'], ['curl','biceps'],
  ['tricep','triceps'], ['pushdown','triceps'], ['extension','triceps'],
  ['squat','quads'], ['leg_press','quads'], ['lunge','quads'], ['quad','quads'],
  ['hamstring','hamstrings'], ['rdl','hamstrings'], ['leg_curl','hamstrings'],
  ['glute','glutes'], ['hip_thrust','glutes'],
  ['calf','calves'], ['calves','calves'],
  ['ab','core'], ['core','core'], ['plank','core'], ['crunch','core'],
];

function guessMuscle(id: string): VolumeGroup {
  const low = id.toLowerCase();
  for (let i = 0; i < MUSCLE_KEYWORDS.length; i++) {
    const [kw, g] = MUSCLE_KEYWORDS[i];
    if (low.includes(kw)) return g;
  }
  return 'chest';
}

function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : fallback;
  return Math.max(min, Math.min(max, v));
}

function altsForMuscle(muscle: VolumeGroup, excludeId: string): string[] {
  return EXERCISES
    .filter(e => e.primaryMuscle === muscle && e.id !== excludeId)
    .slice(0, 2)
    .map(e => e.name);
}

/** Goal → default RIR. fat_loss/maintain=2, muscle_gain=1, recomp=2. */
function defaultRIR(goal: string): number {
  return goal === 'muscle_gain' ? 1 : 2;
}

/** Goal → default tempo for compound vs isolation. */
function defaultTempo(isCompound: boolean): string {
  return isCompound ? '3-0-1' : '2-1-1';
}

// Build a valid exerciseId set from the menu for validation.
let _menuIds: Set<string> | null = null;
function getMenuIds(): Set<string> {
  if (!_menuIds) _menuIds = new Set(EXERCISES.map(e => e.id));
  return _menuIds;
}

// -- Hydrate one skeleton exercise  WorkoutExercise ---------------------------
function hydrateExercise(raw: any, order: number, goal: string): WorkoutExercise | null {
  const rawId: string = (raw?.exerciseId ?? '').toString().trim();
  if (!rawId) return null;

  // Validate: if the model returned an id not in our menu, still try to look it up
  // (it might be close enough via DB lookup), but log a warning in dev.
  const db = getExerciseById(rawId);
  if (!db && !getMenuIds().has(rawId)) {
    if (__DEV__) console.warn('[hydrate] unknown exerciseId from model:', rawId);
  }

  const muscle = db?.primaryMuscle ?? guessMuscle(rawId);
  const isCompound = db ? db.category === 'compound' : false;

  return {
    order,
    exerciseId: db?.id ?? rawId,
    name: db?.name ?? prettify(rawId),
    muscleGroup: muscle,
    muscleGroupSecondary: db?.secondaryMuscles[0] ?? null,
    isCompound,
    isPriorityLift: !!raw?.isPriorityLift,
    sets: clampInt(raw?.sets, 1, 10, 3),
    reps: (raw?.reps ?? db?.defaultReps ?? '8-12').toString(),
    restSeconds: clampInt(raw?.restSeconds, 30, 300, db?.defaultRestSec ?? 90),
    tempo: typeof raw?.tempo === 'string' && raw.tempo.trim() ? raw.tempo.trim() : defaultTempo(isCompound),
    rir: clampInt(raw?.rir, 0, 5, defaultRIR(goal)),
    coachingCue: db?.cue ?? '',
    alternatives: altsForMuscle(muscle, db?.id ?? rawId),
    healthModification: null,
    progressionRule: progressionRule(goal),
  };
}

// -- Schedule helpers ----------------------------------------------------------

const TRAINING_DAY_PRESETS: Record<number, string[]> = {
  2: ['monday', 'thursday'],
  3: ['monday', 'wednesday', 'friday'],
  4: ['monday', 'tuesday', 'thursday', 'friday'],
  5: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  6: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  7: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
};

function normKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function resolveSessionName(val: string, sessionNames: Set<string>, normMap: Map<string, string>): string | null {
  const v = val.trim();
  if (!v) return null;
  if (v === 'Rest' || v === 'Active Rest') return v;
  if (sessionNames.has(v)) return v;
  const nv = normKey(v);
  if (normMap.has(nv)) return normMap.get(nv)!;
  const normEntries = Array.from(normMap.entries());
  for (let i = 0; i < normEntries.length; i++) {
    const [nk, canonical] = normEntries[i];
    if (nv.includes(nk) || nk.includes(nv)) return canonical;
  }
  return null;
}

// -- Main hydration inputs -----------------------------------------------------
export interface HydrateInputs {
  goal: string;
  age?: number;
  doesCardio?: string;
  cardioTypes?: string[];
  daysPerWeek?: number;
}

// -- Schedule builder ----------------------------------------------------------
function buildWeeklySchedule(
  sessions: WorkoutSession[],
  skeleton: any,
  daysPerWeek: number,
): Record<string, string> {
  const sessionNames = new Set(sessions.map(s => s.name));
  const normMap = new Map<string, string>();
  for (const name of Array.from(sessionNames)) normMap.set(normKey(name), name);

  const rawSchedule = (skeleton?.weeklySchedule ?? {}) as Record<string, string>;
  const schedule: Record<string, string> = {};
  for (const day of WEEKDAYS) {
    const resolved = resolveSessionName((rawSchedule[day] ?? '').toString(), sessionNames, normMap);
    schedule[day] = resolved ?? 'Rest';
  }

  const mappedCount = WEEKDAYS.filter(d => sessionNames.has(schedule[d])).length;
  if (daysPerWeek > 0 && mappedCount < Math.max(1, daysPerWeek - 1)) {
    for (const day of WEEKDAYS) schedule[day] = 'Rest';
    const presetDays = TRAINING_DAY_PRESETS[Math.min(daysPerWeek, 7)] ?? TRAINING_DAY_PRESETS[6];
    presetDays.forEach((day, i) => { schedule[day] = sessions[i % sessions.length].name; });
  } else if (daysPerWeek > 0 && mappedCount < daysPerWeek) {
    const restDays = WEEKDAYS.filter(d => !sessionNames.has(schedule[d]));
    const deficit = daysPerWeek - mappedCount;
    for (let i = 0; i < Math.min(deficit, restDays.length); i++) {
      schedule[restDays[i]] = sessions[i % sessions.length].name;
    }
  }
  return schedule;
}

// -- Cardio block injector -----------------------------------------------------
function injectCardioBlocks(
  sessions: WorkoutSession[],
  cardioProgram: ReturnType<typeof buildCardioProgram>,
  weeklySchedule: Record<string, string>,
): void {
  if (!cardioProgram) return;
  for (const cardioSess of cardioProgram.sessions.filter((c: CardioSession) => c.placement === 'post_lift')) {
    const sessionNameOnDay = weeklySchedule[cardioSess.day];
    const session = sessions.find(s => s.name === sessionNameOnDay);
    if (session && !session.cardioBlock) {
      session.cardioBlock = {
        durationMin: cardioSess.durationMin,
        targetHRbpm: `${cardioSess.hrZone.bpmLow}-${cardioSess.hrZone.bpmHigh} BPM`,
        hrZone: cardioSess.hrZone,
        modality: cardioSess.modality,
        type: cardioSess.modality,
        evidenceId: cardioSess.evidenceId,
      };
    }
  }
}

// -- Main: skeleton → full WorkoutPlan ----------------------------------------
export function hydratePlan(skeleton: any, inputs: HydrateInputs): WorkoutPlan {
  const goal = inputs.goal ?? 'recomp';
  const rawSessions: any[] = Array.isArray(skeleton?.sessions) ? skeleton.sessions : [];

  const sessions: WorkoutSession[] = rawSessions.map((sess) => {
    const hydratedRaw: WorkoutExercise[] = (Array.isArray(sess?.exercises) ? sess.exercises : [])
      .map((ex: any, i: number) => hydrateExercise(ex, i + 1, goal))
      .filter((e: WorkoutExercise | null): e is WorkoutExercise => e !== null);

    // Client-side safety sort: priority lifts first, then other compounds, then isolation
    // Preserves Gemini's relative ordering within each tier (stable sort).
    const sortScore = (e: WorkoutExercise) => (e.isPriorityLift ? 2 : 0) + (e.isCompound ? 1 : 0);
    const hydrated = [...hydratedRaw].sort((a, b) => sortScore(b) - sortScore(a))
      .map((e, i) => ({ ...e, order: i + 1 }));

    const muscles: string[] = Array.from(new Set(hydrated.map(e => e.muscleGroup)));
    return {
      name: (sess?.name ?? 'Session').toString(),
      sessionGoal: (sess?.sessionGoal ?? `targets ${muscles.join(', ')}`).toString(),
      estimatedDurationMin: estimateSessionDuration(hydrated),
      musclesFocused: muscles,
      exercises: hydrated,
      cardioBlock: null,
    };
  }).filter(sess => sess.exercises.length > 0);

  if (sessions.length === 0) throw new Error('AI returned an empty plan');

  const weeklySchedule = buildWeeklySchedule(sessions, skeleton, inputs.daysPerWeek ?? 0);

  const cardioProgram = buildCardioProgram({
    age: inputs.age ?? 25,
    goal: goal as CardioInputs['goal'],
    doesCardio: (inputs.doesCardio as CardioInputs['doesCardio']) ?? 'no',
    cardioTypes: inputs.cardioTypes ?? [],
    weeklySchedule,
    daysPerWeek: inputs.daysPerWeek ?? 0,
  });

  injectCardioBlocks(sessions, cardioProgram, weeklySchedule);

  const citationIds = ['workout_volume', 'workout_frequency', 'exercise_order', 'progressive_overload'];
  if (cardioProgram) {
    citationIds.push('post_workout_cardio', 'zone_2_base_building');
    if (cardioProgram.sessions.some((c: CardioSession) => c.evidenceId === 'hiit_epoc')) {
      citationIds.push('hiit_epoc');
    }
  }

  const hotTakes: string[] = Array.isArray(skeleton?.hotTakes) && skeleton.hotTakes.length > 0
    ? skeleton.hotTakes.map((h: any) => h.toString()).slice(0, 4)
    : [
        'this plan only works if you actually log it. be honest.',
        'progressive overload every week — more reps or more weight.',
      ];

  return {
    id: '', isActive: false, createdAt: '',
    source: 'ai',
    splitName: (skeleton?.splitName ?? 'Your Programme').toString(),
    splitType: (skeleton?.splitType ?? 'custom').toString(),
    programmeRationale: (skeleton?.programmeRationale ?? 'an evidence-based split built around your inputs.').toString(),
    weeklySchedule,
    sessions,
    weeklyVolumeByMuscle: computeWeeklyVolume(sessions, []),
    cardioProgram,
    progressionPlan: progressionPlan(goal),
    hotTakes,
    citations: planCitations(citationIds),
  };
}
