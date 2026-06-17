// Shared WorkoutPlan assembly helpers.
// Both the manual SplitBuilder and the AI hydratePlan() use these so the two
// paths converge on one identical WorkoutPlan shape downstream (10.3).

import { computeFractionalSets, VOLUME_GROUPS, type VolumeGroup, type Exercise } from '@/data/exercises';
import { EVIDENCE_CARDS } from '@/data/evidence';
import type { WorkoutExercise, WorkoutSession, WorkoutPlan } from '@/stores/workout-store';

export type PlanCitation = WorkoutPlan['citations'][number];

function slug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

// -- Citations: real EvidenceCards  plan citation rows ------------------------
export function planCitations(cardIds: string[]): PlanCitation[] {
  const out: PlanCitation[] = [];
  for (let i = 0; i < cardIds.length; i++) {
    const id = cardIds[i];
    const card = EVIDENCE_CARDS.find(c => c.id === id);
    const cit = card?.citations?.[0];
    if (!card || !cit) continue;
    out.push({
      claim: card.claim,
      authors: cit.authors,
      year: cit.year,
      journal: cit.journal,
      doi: cit.doi ?? '',
    });
  }
  return out;
}

// -- Weekly volume: fractional sets per muscle across all sessions (6.3) ------
export function computeWeeklyVolume(
  sessions: WorkoutSession[],
  customExercises: Exercise[] = [],
): WorkoutPlan['weeklyVolumeByMuscle'] {
  const totals: Record<string, number> = {};
  const freq: Record<string, Set<number>> = {};

  sessions.forEach((session, i) => {
    const exercises = session.exercises ?? [];
    for (let j = 0; j < exercises.length; j++) {
      const ex = exercises[j];
      const id = ex.exerciseId ?? slug(ex.name);
      const frac = computeFractionalSets(id, ex.sets ?? 0, customExercises);
      const fracKeys = Object.keys(frac) as VolumeGroup[];
      for (let k = 0; k < fracKeys.length; k++) {
        const g = fracKeys[k];
        totals[g] = (totals[g] ?? 0) + frac[g];
        if (!freq[g]) {
          freq[g] = new Set();
        }
        freq[g].add(i);
      }
    }
  });

  const result: WorkoutPlan['weeklyVolumeByMuscle'] = {};
  for (let i = 0; i < VOLUME_GROUPS.length; i++) {
    const g = VOLUME_GROUPS[i];
    if (!totals[g]) continue;
    result[g] = {
      setsPerWeek: Math.round(totals[g] * 10) / 10,
      frequency: freq[g]?.size ?? 0,
    };
  }
  return result;
}

// -- Progression templates (goal-driven, tied to progressive_overload card) ----
export function progressionRule(goal: string): string {
  if (goal === 'muscle_gain') return 'Add 2.5kg when you hit the top of the rep range on all sets.';
  if (goal === 'fat_loss')    return 'Keep the weight, add reps within the range each week. Hold strength in the deficit.';
  return 'Add reps until you reach the top of the range, then add 2.5kg and reset to the bottom.';
}

export function progressionPlan(goal: string): string {
  const base = 'Progressive overload is the driver: every week, do a little more than last - more reps, more weight, or cleaner reps at 1-2 RIR.';
  if (goal === 'muscle_gain') return `${base} You're in a surplus, so push load when the top of the range feels controlled.`;
  if (goal === 'fat_loss')    return `${base} In a deficit, prioritise holding your numbers - maintaining strength means you're keeping muscle.`;
  return base;
}

// -- Session duration estimate (no model tokens spent on it) -------------------
export function estimateSessionDuration(exercises: WorkoutExercise[]): number {
  // ~working-set time (40s) + rest, plus a flat warm-up allowance.
  const work = exercises.reduce((acc, ex) => acc + (ex.sets ?? 0) * (40 + (ex.restSeconds ?? 90)), 0);
  return Math.max(20, Math.round((work / 60 + 8) / 5) * 5);
}
