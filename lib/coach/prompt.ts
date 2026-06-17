/**
 * Coach context assembly + prompt builder.
 * Reads from LIVE stores (useWorkoutStore, useTrackerStore, useProfile).
 * This is a pure function — no hooks — so it can be called from the component.
 */

import { COACH_PROMPT_TEMPLATE, COACH_EVIDENCE_SHORTLIST, COACH_STATIC_INSTRUCTION } from '@/shared/prompts/coach';

export { COACH_STATIC_INSTRUCTION };
import type { WorkoutPlan, WorkoutLog, ExercisePR } from '@/stores/workout-store';
import type { UserProfile, FullResult } from '@/types';

// ─── Context shape ────────────────────────────────────────────────────────────

export interface CoachContext {
  goalMode: string;
  weightKg: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  todayDate: string;
  todayMeals: Array<{
    name: string;
    mealType: string;
    totalCalories: number;
    totalProteinG: number;
    hasOil: boolean;
    isCooked: boolean;
  }>;
  todayTotals: { calories: number; proteinG: number; carbsG: number; fatG: number };
  todayRemaining: { calories: number; proteinG: number };
  daysLoggedLast7: number;
  avg7DayCalories: number | null;
  avg7DayProtein: number | null;
  hasWorkoutPlan: boolean;
  splitName: string | null;
  todaySession: string | null;
  totalSessions: number;
  recentWorkouts: Array<{
    date: string;
    sessionName: string;
    totalSets: number;
    durationMinutes: number;
    prsAchieved: string[];
  }>;
  exercisePRs: Record<string, ExercisePR>;
  // Phase 2 — cross-app context
  lastWorkoutFeeling: {
    sessionName: string;
    date: string;
    feelingRating: number | null;
    energyLevel: number | null;
    sleepLastNight: number | null;
    notes: string;
    avgRpe: number | null;
  } | null;
  micros: {
    ironMg: number;
    calciumMg: number;
    b12Mcg: number;
    vitaminDIu: number;
    zincMg: number;
    waterMl: number;
    waterTargetMl: number;
  };
  dietType: string | null;
  meatPreferences: string[];
  cookingContext: string | null;
  budgetTier: string | null;
  experience: string;
  neatCategory: string;
  deficitSurplus: number;
  weeklyVolumeByMuscle: Record<string, { setsPerWeek: number; frequency: number }>;
  cookedMealsWithoutOil: number;
  cookedMealsCount: number;
  plans: Array<{ id: string; name: string; isActive: boolean; sessionNames: string[] }>;
  // Readiness — injected in trainer.tsx from useCompleteness
  tappedInScore?: number;
  ringsClosed?: number;
  totalRings?: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Sub-assemblers ───────────────────────────────────────────────────────────

type DailyLogSlice = {
  meals?: Array<{ name: string; mealType: string; totalCalories: number; totalProteinG: number; oilEntry?: unknown; isCooked?: boolean }>;
  totalCalories?: number; totalProteinG?: number; totalCarbsG?: number; totalFatG?: number;
  micros?: Record<string, number>;
  waterMl?: number;
};

function assembleNutritionCtx(
  dailyLogs: Record<string, DailyLogSlice> | null | undefined,
  profile: UserProfile | null,
  result: FullResult | null,
  today: string,
) {
  const todayLog = dailyLogs?.[today] ?? null;
  const todayMeals = (todayLog?.meals ?? []).map(m => ({
    name: m?.name ?? 'meal', mealType: m?.mealType ?? 'snack',
    totalCalories: m?.totalCalories ?? 0, totalProteinG: m?.totalProteinG ?? 0,
    hasOil: !!m?.oilEntry, isCooked: m?.isCooked ?? false,
  }));
  const todayTotals = {
    calories: todayLog?.totalCalories ?? 0, proteinG: todayLog?.totalProteinG ?? 0,
    carbsG: todayLog?.totalCarbsG ?? 0, fatG: todayLog?.totalFatG ?? 0,
  };
  const targetCalories = result?.calories?.targetCalories ?? 2200;
  const targetProteinG = result?.macros?.proteinG ?? 160;
  const targetCarbsG   = result?.macros?.carbG    ?? 220;
  const targetFatG     = result?.macros?.fatG     ?? 70;

  const last7: Array<{ calories: number; proteinG: number }> = [];
  if (dailyLogs) {
    for (let i = 1; i <= 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const log = dailyLogs[key];
      if (log && (log.meals?.length ?? 0) > 0) last7.push({ calories: log.totalCalories ?? 0, proteinG: log.totalProteinG ?? 0 });
    }
  }
  const avg = <T>(arr: T[], fn: (x: T) => number) => arr.length > 0 ? Math.round(arr.reduce((s, x) => s + fn(x), 0) / arr.length) : null;

  const waterTargetMl = result?.hydrationMl ?? Math.round((profile?.weightKg ?? 70) * 38);
  const microMap = todayLog?.micros ?? {};
  const micros = {
    ironMg:     Math.round((microMap.iron ?? 0) * 10) / 10,
    calciumMg:  Math.round(microMap.calcium ?? 0),
    b12Mcg:     Math.round((microMap.vitaminB12 ?? 0) * 10) / 10,
    vitaminDIu: Math.round(microMap.vitaminD ?? 0),
    zincMg:     Math.round((microMap.zinc ?? 0) * 10) / 10,
    waterMl:    todayLog?.waterMl ?? 0,
    waterTargetMl,
  };

  return {
    todayMeals, todayTotals, targetCalories, targetProteinG, targetCarbsG, targetFatG,
    todayRemaining: { calories: targetCalories - todayTotals.calories, proteinG: targetProteinG - todayTotals.proteinG },
    daysLoggedLast7: last7.length,
    avg7DayCalories: avg(last7, x => x.calories),
    avg7DayProtein:  avg(last7, x => x.proteinG),
    micros,
    cookedMealsCount:       todayMeals.filter(m => m.isCooked).length,
    cookedMealsWithoutOil:  todayMeals.filter(m => m.isCooked && !m.hasOil).length,
  };
}

function assembleWorkoutCtx(
  activePlan: WorkoutPlan | null,
  recentLogs: WorkoutLog[] | null | undefined,
  exercisePRs: Record<string, ExercisePR> | null | undefined,
  allPlans: WorkoutPlan[] | null | undefined,
) {
  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todaySessionName = activePlan?.weeklySchedule?.[dayOfWeek] ?? null;
  const todaySession = (todaySessionName === 'Rest' || todaySessionName === 'Active Rest') ? null : todaySessionName;

  const logsArr = recentLogs ?? [];
  const lastLog = logsArr[0] ?? null;
  let lastWorkoutFeeling: CoachContext['lastWorkoutFeeling'] = null;
  if (lastLog) {
    const rpeValues = (lastLog.exercises ?? []).flatMap(ex => (ex?.sets ?? []).map(s => s?.rpe)).filter((r): r is number => r !== null && r !== undefined);
    const avgRpe = rpeValues.length > 0 ? Math.round(rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length * 10) / 10 : null;
    lastWorkoutFeeling = {
      sessionName: lastLog.sessionName ?? '', date: lastLog.date ?? '',
      feelingRating: lastLog.feelingRating ?? null, energyLevel: lastLog.energyLevel ?? null,
      sleepLastNight: lastLog.sleepLastNight ?? null, notes: lastLog.notes ?? '', avgRpe,
    };
  }

  return {
    hasWorkoutPlan:  !!activePlan,
    splitName:       activePlan?.splitName ?? null,
    todaySession,
    totalSessions:   activePlan?.sessions?.length ?? 0,
    recentWorkouts:  logsArr.slice(0, 3).map(w => ({ date: w.date ?? '', sessionName: w.sessionName ?? '', totalSets: w.totalSets ?? 0, durationMinutes: w.durationMinutes ?? 0, prsAchieved: w.prsAchieved ?? [] })),
    exercisePRs: exercisePRs ?? {},
    lastWorkoutFeeling,
    weeklyVolumeByMuscle: activePlan?.weeklyVolumeByMuscle ?? {},
    plans: (allPlans ?? []).filter(Boolean).map(p => ({ id: p.id, name: p.splitName ?? 'unnamed plan', isActive: p.isActive ?? false, sessionNames: (p.sessions ?? []).map((s: { name: string }) => s?.name ?? '') })),
  };
}

// ─── Main assembler (orchestrates sub-assemblers) ─────────────────────────────

export function assembleCoachContext(
  dailyLogs: Record<string, DailyLogSlice>,
  profile: UserProfile | null,
  result: FullResult | null,
  activePlan: WorkoutPlan | null,
  recentLogs: WorkoutLog[],
  exercisePRs: Record<string, ExercisePR>,
  allPlans: WorkoutPlan[],
): CoachContext {
  const today = getTodayKey();
  const nutrition = assembleNutritionCtx(dailyLogs, profile, result, today);
  const workout   = assembleWorkoutCtx(activePlan, recentLogs, exercisePRs, allPlans);

  return {
    goalMode:        profile?.goalMode   ?? 'recomp',
    weightKg:        profile?.weightKg  ?? 70,
    todayDate:       today,
    dietType:        profile?.dietType  ?? null,
    meatPreferences: profile?.meatPreferences ?? [],
    cookingContext:  profile?.cookingContext  ?? null,
    budgetTier:      profile?.budgetTier     ?? null,
    experience:      profile?.experience     ?? 'beginner',
    neatCategory:    result?.calories?.neatCategory ?? 'moderate',
    deficitSurplus:  result?.calories?.deficit ?? 0,
    ...nutrition,
    ...workout,
  };
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildCoachPrompt(ctx: CoachContext): string {
  const consistency =
    ctx.daysLoggedLast7 >= 6 ? 'excellent — nearly every day' :
    ctx.daysLoggedLast7 >= 4 ? 'decent, a few gaps' :
    ctx.daysLoggedLast7 >= 2 ? 'inconsistent' :
    'barely any data this week';

  const mealsStr = ctx.todayMeals.length === 0
    ? '  nothing logged yet today'
    : ctx.todayMeals
        .map(m => `  ${m.mealType}: ${m.name} — ${m.totalCalories} kcal, P:${m.totalProteinG}g${m.hasOil ? ', oil tracked' : ''}`)
        .join('\n');

  const workoutsStr = ctx.recentWorkouts.length === 0
    ? '  no recent sessions'
    : ctx.recentWorkouts
        .map(w => {
          const prs = w.prsAchieved.length > 0 ? ` | PRs: ${w.prsAchieved.join(', ')}` : '';
          return `  ${w.date}: ${w.sessionName} — ${w.totalSets} sets, ${w.durationMinutes}min${prs}`;
        })
        .join('\n');

  const prStr = Object.entries(ctx.exercisePRs).length === 0
    ? '  none on record'
    : Object.entries(ctx.exercisePRs)
        .slice(0, 6)
        .map(([name, pr]) => `  ${name}: ${pr.maxWeight}kg × ${pr.maxReps}reps (est. 1RM: ${pr.estimated1RM}kg)`)
        .join('\n');

  const lf = ctx.lastWorkoutFeeling;
  const feelingStr = lf
    ? [
        `${lf.sessionName} (${lf.date})`,
        lf.feelingRating    !== null ? `feeling=${lf.feelingRating}/5`     : null,
        lf.energyLevel      !== null ? `energy=${lf.energyLevel}/5`        : null,
        lf.sleepLastNight   !== null ? `sleep=${lf.sleepLastNight}h`       : null,
        lf.avgRpe           !== null ? `avg_rpe=${lf.avgRpe}`              : null,
        lf.notes ? `notes="${lf.notes}"` : null,
      ].filter(Boolean).join(' | ')
    : 'no sessions logged yet';

  const m = ctx.micros;
  const microsStr = `iron=${m.ironMg}mg/8mg | ca=${m.calciumMg}mg/1000mg | b12=${m.b12Mcg}mcg/2.4mcg | vitD=${m.vitaminDIu}IU/600IU | zinc=${m.zincMg}mg/11mg | water=${m.waterMl}ml/${m.waterTargetMl}ml`;

  const meatStr = ctx.meatPreferences.length > 0 ? ctx.meatPreferences.join(', ') : 'none';
  const dietStr = `diet=${ctx.dietType ?? 'unset'} | meats=[${meatStr}] | cooking=${ctx.cookingContext ?? 'unset'} | budget=${ctx.budgetTier ?? 'unset'}`;

  const deficitSign = ctx.deficitSurplus > 0 ? '+' : '';
  const profilePlusStr = `experience=${ctx.experience} | neat=${ctx.neatCategory} | deficit_surplus=${deficitSign}${ctx.deficitSurplus}kcal/d`;

  const oilStr = ctx.cookedMealsCount > 0
    ? `${ctx.cookedMealsCount - ctx.cookedMealsWithoutOil}/${ctx.cookedMealsCount} cooked meals tracked oil`
    : 'no cooked meals today';

  const volEntries = Object.entries(ctx.weeklyVolumeByMuscle);
  const volStr = volEntries.length > 0
    ? volEntries.slice(0, 8).map(([muscle, v]) => `${muscle}=${v.setsPerWeek}sets`).join(', ')
    : 'no plan data';

  const plansStr = ctx.plans.length === 0
    ? '  none'
    : ctx.plans
        .map(p => `  id=${p.id} name="${p.name}"${p.isActive ? ' [active]' : ''} sessions=[${p.sessionNames.join(', ')}]`)
        .join('\n');

  const readinessStr = ctx.tappedInScore !== undefined
    ? `tapped_in_score=${ctx.tappedInScore}/100 | rings_closed=${ctx.ringsClosed ?? 0}/${ctx.totalRings ?? 4}`
    : 'not computed yet';

  const contextBlock = `PROFILE: goal=${ctx.goalMode} | ${ctx.weightKg}kg | ${profilePlusStr}
TARGETS: ${ctx.targetCalories} kcal | P:${ctx.targetProteinG}g | C:${ctx.targetCarbsG}g | F:${ctx.targetFatG}g
READINESS: ${readinessStr}
TODAY (${ctx.todayDate}):
  eaten: ${ctx.todayTotals.calories} kcal | P:${ctx.todayTotals.proteinG}g
  remaining: ${ctx.todayRemaining.calories} kcal | P:${ctx.todayRemaining.proteinG}g protein still needed
MEALS TODAY:
${mealsStr}
LAST 7 DAYS: ${ctx.daysLoggedLast7}/7 days logged | avg ${ctx.avg7DayCalories ?? '?'} kcal | avg P:${ctx.avg7DayProtein ?? '?'}g | ${consistency}
DIET PREFS: ${dietStr}
OIL CHECK: ${oilStr}
MICROS TODAY: ${microsStr}
WORKOUT PLAN: ${ctx.hasWorkoutPlan ? `${ctx.splitName}, ${ctx.totalSessions} sessions/week` : 'none set up yet'}
TODAY'S SESSION: ${ctx.todaySession ?? 'rest day / no session scheduled'}
LAST WORKOUT FEEL: ${feelingStr}
WEEKLY VOLUME: ${volStr}
RECENT WORKOUTS:
${workoutsStr}
PERSONAL RECORDS:
${prStr}
YOUR PLANS:
${plansStr}`;

  return COACH_PROMPT_TEMPLATE
    .replace('{evidenceShortlist}', COACH_EVIDENCE_SHORTLIST)
    .replace('{contextBlock}', contextBlock);
}

// ─── Split builders for Phase-4 systemInstruction caching ────────────────────

function buildContextBlock(ctx: CoachContext): string {
  const consistency =
    ctx.daysLoggedLast7 >= 6 ? 'excellent — nearly every day' :
    ctx.daysLoggedLast7 >= 4 ? 'decent, a few gaps' :
    ctx.daysLoggedLast7 >= 2 ? 'inconsistent' :
    'barely any data this week';

  const mealsStr = ctx.todayMeals.length === 0
    ? '  nothing logged yet today'
    : ctx.todayMeals
        .map(m => `  ${m.mealType}: ${m.name} — ${m.totalCalories} kcal, P:${m.totalProteinG}g${m.hasOil ? ', oil tracked' : ''}`)
        .join('\n');

  const workoutsStr = ctx.recentWorkouts.length === 0
    ? '  no recent sessions'
    : ctx.recentWorkouts
        .map(w => {
          const prs = w.prsAchieved.length > 0 ? ` | PRs: ${w.prsAchieved.join(', ')}` : '';
          return `  ${w.date}: ${w.sessionName} — ${w.totalSets} sets, ${w.durationMinutes}min${prs}`;
        })
        .join('\n');

  const prStr = Object.entries(ctx.exercisePRs).length === 0
    ? '  none on record'
    : Object.entries(ctx.exercisePRs)
        .slice(0, 6)
        .map(([name, pr]) => `  ${name}: ${pr.maxWeight}kg × ${pr.maxReps}reps (est. 1RM: ${pr.estimated1RM}kg)`)
        .join('\n');

  const lf = ctx.lastWorkoutFeeling;
  const feelingStr = lf
    ? [
        `${lf.sessionName} (${lf.date})`,
        lf.feelingRating    !== null ? `feeling=${lf.feelingRating}/5`  : null,
        lf.energyLevel      !== null ? `energy=${lf.energyLevel}/5`     : null,
        lf.sleepLastNight   !== null ? `sleep=${lf.sleepLastNight}h`    : null,
        lf.avgRpe           !== null ? `avg_rpe=${lf.avgRpe}`           : null,
        lf.notes ? `notes="${lf.notes}"` : null,
      ].filter(Boolean).join(' | ')
    : 'no sessions logged yet';

  const m = ctx.micros;
  const microsStr = `iron=${m.ironMg}mg/8mg | ca=${m.calciumMg}mg/1000mg | b12=${m.b12Mcg}mcg/2.4mcg | vitD=${m.vitaminDIu}IU/600IU | zinc=${m.zincMg}mg/11mg | water=${m.waterMl}ml/${m.waterTargetMl}ml`;

  const meatStr = ctx.meatPreferences.length > 0 ? ctx.meatPreferences.join(', ') : 'none';
  const dietStr = `diet=${ctx.dietType ?? 'unset'} | meats=[${meatStr}] | cooking=${ctx.cookingContext ?? 'unset'} | budget=${ctx.budgetTier ?? 'unset'}`;

  const deficitSign = ctx.deficitSurplus > 0 ? '+' : '';
  const profilePlusStr = `experience=${ctx.experience} | neat=${ctx.neatCategory} | deficit_surplus=${deficitSign}${ctx.deficitSurplus}kcal/d`;

  const oilStr = ctx.cookedMealsCount > 0
    ? `${ctx.cookedMealsCount - ctx.cookedMealsWithoutOil}/${ctx.cookedMealsCount} cooked meals tracked oil`
    : 'no cooked meals today';

  const volEntries = Object.entries(ctx.weeklyVolumeByMuscle);
  const volStr = volEntries.length > 0
    ? volEntries.slice(0, 8).map(([muscle, v]) => `${muscle}=${v.setsPerWeek}sets`).join(', ')
    : 'no plan data';

  const plansStr = ctx.plans.length === 0
    ? '  none'
    : ctx.plans
        .map(p => `  id=${p.id} name="${p.name}"${p.isActive ? ' [active]' : ''} sessions=[${p.sessionNames.join(', ')}]`)
        .join('\n');

  return `PROFILE: goal=${ctx.goalMode} | ${ctx.weightKg}kg | ${profilePlusStr}
TARGETS: ${ctx.targetCalories} kcal | P:${ctx.targetProteinG}g | C:${ctx.targetCarbsG}g | F:${ctx.targetFatG}g
TODAY (${ctx.todayDate}):
  eaten: ${ctx.todayTotals.calories} kcal | P:${ctx.todayTotals.proteinG}g
  remaining: ${ctx.todayRemaining.calories} kcal | P:${ctx.todayRemaining.proteinG}g protein still needed
MEALS TODAY:
${mealsStr}
LAST 7 DAYS: ${ctx.daysLoggedLast7}/7 days logged | avg ${ctx.avg7DayCalories ?? '?'} kcal | avg P:${ctx.avg7DayProtein ?? '?'}g | ${consistency}
DIET PREFS: ${dietStr}
OIL CHECK: ${oilStr}
MICROS TODAY: ${microsStr}
WORKOUT PLAN: ${ctx.hasWorkoutPlan ? `${ctx.splitName}, ${ctx.totalSessions} sessions/week` : 'none set up yet'}
TODAY'S SESSION: ${ctx.todaySession ?? 'rest day / no session scheduled'}
LAST WORKOUT FEEL: ${feelingStr}
WEEKLY VOLUME: ${volStr}
RECENT WORKOUTS:
${workoutsStr}
PERSONAL RECORDS:
${prStr}
YOUR PLANS:
${plansStr}`;
}

/** Returns only the volatile user-data block. Pair with COACH_STATIC_INSTRUCTION. */
export function buildDynamicContext(ctx: CoachContext): string {
  return `USER DATA:\n${buildContextBlock(ctx)}`;
}
