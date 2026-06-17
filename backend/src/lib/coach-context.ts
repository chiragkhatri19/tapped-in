/**
 * Server-side coach context validation and rendering.
 *
 * The client sends a structured CoachContextDTO (validated here).
 * The server renders it into the dynamic context string that goes to Gemini.
 * The system instruction is NEVER accepted from the client — it lives here.
 */

import { z } from 'zod';
import { COACH_STATIC_INSTRUCTION } from '@shared/prompts/coach';

export { COACH_STATIC_INSTRUCTION };

// ── Zod schema (strict — every string has a max, every number has bounds) ────

const CoachMealSchema = z.object({
  name:           z.string().max(100),
  mealType:       z.string().max(20),
  totalCalories:  z.number().min(0).max(5000),
  totalProteinG:  z.number().min(0).max(500),
  hasOil:         z.boolean(),
  isCooked:       z.boolean(),
});

const CoachWorkoutSchema = z.object({
  date:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sessionName:     z.string().max(100),
  totalSets:       z.number().int().min(0).max(300),
  durationMinutes: z.number().min(0).max(360),
  prsAchieved:     z.array(z.string().max(60)).max(20),
});

const CoachPRSchema = z.object({
  maxWeight:    z.number().min(0).max(600),
  maxReps:      z.number().int().min(0).max(200),
  estimated1RM: z.number().min(0).max(800),
});

const LastWorkoutFeelingSchema = z.object({
  sessionName:   z.string().max(100),
  date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  feelingRating: z.number().int().min(1).max(5).nullable(),
  energyLevel:   z.number().int().min(1).max(5).nullable(),
  sleepLastNight:z.number().min(0).max(24).nullable(),
  avgRpe:        z.number().min(0).max(10).nullable(),
  notes:         z.string().max(500),
});

const PlanSchema = z.object({
  id:           z.string().max(100),
  name:         z.string().max(100),
  isActive:     z.boolean(),
  sessionNames: z.array(z.string().max(60)).max(7),
});

export const CoachContextSchema = z.object({
  goalMode:      z.enum(['fat_loss', 'recomp', 'muscle_gain', 'maintain']),
  weightKg:      z.number().min(20).max(300),

  targetCalories: z.number().min(500).max(8000),
  targetProteinG: z.number().min(0).max(600),
  targetCarbsG:   z.number().min(0).max(1200),
  targetFatG:     z.number().min(0).max(500),

  todayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

  todayMeals:   z.array(CoachMealSchema).max(30),
  todayTotals:  z.object({
    calories: z.number().min(0).max(15000),
    proteinG: z.number().min(0).max(1000),
    carbsG:   z.number().min(0).max(2000),
    fatG:     z.number().min(0).max(1000),
  }),
  todayRemaining: z.object({
    calories: z.number(),
    proteinG: z.number(),
  }),

  daysLoggedLast7:  z.number().int().min(0).max(7),
  avg7DayCalories:  z.number().min(0).max(15000).nullable(),
  avg7DayProtein:   z.number().min(0).max(1000).nullable(),

  hasWorkoutPlan:  z.boolean(),
  splitName:       z.string().max(100).nullable(),
  todaySession:    z.string().max(100).nullable(),
  totalSessions:   z.number().int().min(0).max(14),

  recentWorkouts:  z.array(CoachWorkoutSchema).max(5),
  exercisePRs:     z.record(z.string().max(100), CoachPRSchema).refine(
    (obj) => Object.keys(obj).length <= 60,
    'Too many PRs',
  ),
  lastWorkoutFeeling: LastWorkoutFeelingSchema.nullable(),

  micros: z.object({
    ironMg:      z.number().min(0).max(200),
    calciumMg:   z.number().min(0).max(6000),
    b12Mcg:      z.number().min(0).max(200),
    vitaminDIu:  z.number().min(0).max(20000),
    zincMg:      z.number().min(0).max(200),
    waterMl:     z.number().min(0).max(15000),
    waterTargetMl: z.number().min(0).max(15000),
  }),

  dietType:        z.string().max(30).nullable(),
  meatPreferences: z.array(z.string().max(30)).max(10),
  cookingContext:  z.string().max(100).nullable(),
  budgetTier:      z.string().max(30).nullable(),
  experience:      z.enum(['beginner', 'intermediate', 'advanced']),
  neatCategory:    z.string().max(30),
  deficitSurplus:  z.number().min(-3000).max(3000),

  weeklyVolumeByMuscle: z.record(
    z.string().max(50),
    z.object({
      setsPerWeek: z.number().int().min(0).max(200),
      frequency:   z.number().int().min(0).max(7),
    }),
  ).refine((obj) => Object.keys(obj).length <= 30, 'Too many muscle groups'),

  cookedMealsWithoutOil: z.number().int().min(0).max(30),
  cookedMealsCount:      z.number().int().min(0).max(30),

  plans: z.array(PlanSchema).max(10),
});

export type CoachContextDTO = z.infer<typeof CoachContextSchema>;

// ── Server-side dynamic context renderer ──────────────────────────────────────
// Mirrors lib/coach/prompt.ts buildDynamicContext — same output format,
// validated input means no arbitrary strings can reach Gemini.

export function renderDynamicContext(ctx: CoachContextDTO): string {
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

  const prEntries = Object.entries(ctx.exercisePRs);
  const prStr = prEntries.length === 0
    ? '  none on record'
    : prEntries
        .slice(0, 6)
        .map(([name, pr]) => `  ${name}: ${pr.maxWeight}kg × ${pr.maxReps}reps (est. 1RM: ${pr.estimated1RM}kg)`)
        .join('\n');

  const lf = ctx.lastWorkoutFeeling;
  const feelingStr = lf
    ? [
        `${lf.sessionName} (${lf.date})`,
        lf.feelingRating  !== null ? `feeling=${lf.feelingRating}/5`  : null,
        lf.energyLevel    !== null ? `energy=${lf.energyLevel}/5`     : null,
        lf.sleepLastNight !== null ? `sleep=${lf.sleepLastNight}h`    : null,
        lf.avgRpe         !== null ? `avg_rpe=${lf.avgRpe}`           : null,
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

  const block = `PROFILE: goal=${ctx.goalMode} | ${ctx.weightKg}kg | ${profilePlusStr}
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

  return `USER DATA:\n${block}`;
}
