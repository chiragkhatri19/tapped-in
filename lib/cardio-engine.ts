/**
 * Personalized cardio prescription engine.
 *
 * Heart-rate zones derived from Tanaka (2001): maxHR = 208 - 0.7 × age
 * (more accurate than 220 - age for adults). Zones as % of maxHR:
 *   Zone 1 / warm-up:  50-60%
 *   Zone 2 / LISS:     60-70%  ← fat oxidation peak (Achten & Jeukendrup 2003)
 *   Zone 3 / MISS:     70-80%
 *   Zone 4 / HIIT:     80-90%
 *   Zone 5 / peak:     90-95%
 *
 * Programme rules:
 *   fat_loss   → 3-4 sessions/wk. 3× LISS post-lift + 1× optional HIIT on rest day.
 *   recomp     → 2-3 sessions/wk. 2× LISS post-lift + 1× optional MISS standalone.
 *   muscle_gain→ 1-2 sessions/wk if doesCardio !== 'no'. Zone-2 only (heart health).
 *   maintain   → 1-2 sessions/wk if doesCardio !== 'no'. Zone-2 or MISS.
 *
 * LISS sessions are placed post-lift; standalone sessions fill rest days.
 */

import type { CardioProgram, CardioSession } from '@/stores/workout-store';

const WEEKDAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

export interface CardioInputs {
  age: number;
  goal: 'fat_loss' | 'recomp' | 'muscle_gain' | 'maintain';
  doesCardio: 'yes' | 'open' | 'no';
  cardioTypes: string[];
  weeklySchedule: Record<string, string>;   // session name or 'Rest'/'Active Rest'
  daysPerWeek: number;
}

interface HRZone {
  label: string;
  bpmLow: number;
  bpmHigh: number;
}

function computeMaxHR(age: number): number {
  return Math.round(208 - 0.7 * Math.max(10, Math.min(80, age)));
}

function zone(maxHR: number, lowPct: number, highPct: number, label: string): HRZone {
  return {
    label,
    bpmLow:  Math.round(maxHR * lowPct),
    bpmHigh: Math.round(maxHR * highPct),
  };
}

function preferredModality(cardioTypes: string[], goal: string, slot: 'liss' | 'hiit' | 'miss'): string {
  const lower = cardioTypes.map(t => t.toLowerCase());

  if (slot === 'hiit') {
    if (lower.includes('hiit'))        return 'HIIT intervals';
    if (lower.includes('running'))     return 'sprint intervals';
    if (lower.includes('cycling'))     return 'cycling intervals';
    if (lower.includes('rowing'))      return 'rowing intervals';
    if (lower.includes('jump rope'))   return 'jump rope intervals';
    return 'HIIT intervals';
  }

  if (slot === 'miss') {
    if (lower.includes('running'))     return 'running';
    if (lower.includes('cycling'))     return 'cycling';
    if (lower.includes('rowing'))      return 'rowing';
    if (lower.includes('swimming'))    return 'swimming';
    if (lower.includes('stairmaster')) return 'stairmaster';
    return 'cycling';
  }

  // liss
  if (lower.includes('walking'))      return 'incline walk';
  if (lower.includes('cycling'))      return 'cycling';
  if (lower.includes('rowing'))       return 'rowing';
  if (lower.includes('stairmaster'))  return 'stairmaster';
  if (lower.includes('running'))      return 'easy jog';
  if (lower.includes('swimming'))     return 'swimming';
  return 'incline walk';
}

function trainingDays(schedule: Record<string, string>): string[] {
  return WEEKDAYS.filter(d => {
    const v = schedule[d];
    return v && v !== 'Rest' && v !== 'Active Rest';
  });
}

function restDays(schedule: Record<string, string>): string[] {
  return WEEKDAYS.filter(d => !trainingDays(schedule).includes(d));
}

/** Build the full CardioProgram for a user. Returns null if no cardio prescribed. */
export function buildCardioProgram(inputs: CardioInputs): CardioProgram | null {
  const { age, goal, doesCardio, cardioTypes, weeklySchedule } = inputs;

  if (doesCardio === 'no') return null;
  // muscle_gain/maintain only get cardio if user is open/yes
  if ((goal === 'muscle_gain' || goal === 'maintain') && doesCardio !== 'yes' && doesCardio !== 'open') return null;

  const maxHR = computeMaxHR(age);
  const lissZone  = zone(maxHR, 0.60, 0.70, 'Zone 2 / LISS');
  const missZone  = zone(maxHR, 0.70, 0.80, 'Zone 3 / Moderate');
  const hiitZone  = zone(maxHR, 0.85, 0.95, 'Zone 4-5 / HIIT');

  const trainDays = trainingDays(weeklySchedule);
  const offDays   = restDays(weeklySchedule);

  const sessions: CardioSession[] = [];

  const lissModality  = preferredModality(cardioTypes, goal, 'liss');
  const hiitModality  = preferredModality(cardioTypes, goal, 'hiit');
  const missModality  = preferredModality(cardioTypes, goal, 'miss');

  if (goal === 'fat_loss') {
    // 3× LISS post-lift (first 3 training days), 1× HIIT on a rest day if available
    const lissTargetDays = trainDays.slice(0, 3);
    for (let i = 0; i < lissTargetDays.length; i++) {
      const day = lissTargetDays[i];
      sessions.push({
        day,
        modality: lissModality,
        durationMin: 25,
        hrZone: lissZone,
        structure: `steady-state — maintain ${lissZone.label} (${lissZone.bpmLow}-${lissZone.bpmHigh} BPM) throughout`,
        placement: 'post_lift',
        rationale: 'glycogen is depleted post-lift — your body runs on fat at zone 2 intensity',
        evidenceId: 'post_workout_cardio',
      });
    }
    // Optional HIIT on first available rest day
    if (offDays.length > 0) {
      sessions.push({
        day: offDays[0],
        modality: hiitModality,
        durationMin: 20,
        hrZone: hiitZone,
        structure: `8 rounds: 20 sec all-out (${hiitZone.bpmLow}-${hiitZone.bpmHigh} BPM), 40 sec active rest. 4 min warm-up + cool-down.`,
        placement: 'standalone',
        rationale: 'EPOC effect elevates metabolism for 12-24 hrs post-session',
        evidenceId: 'hiit_epoc',
      });
    }
  } else if (goal === 'recomp') {
    // 2× LISS post-lift, 1× MISS on a rest day
    const lissTargetDays = trainDays.slice(0, 2);
    for (let i = 0; i < lissTargetDays.length; i++) {
      const day = lissTargetDays[i];
      sessions.push({
        day,
        modality: lissModality,
        durationMin: 20,
        hrZone: lissZone,
        structure: `steady-state — maintain ${lissZone.label} (${lissZone.bpmLow}-${lissZone.bpmHigh} BPM) throughout`,
        placement: 'post_lift',
        rationale: 'post-lift zone 2 preserves muscle while conditioning improves',
        evidenceId: 'zone_2_base_building',
      });
    }
    if (offDays.length > 0) {
      sessions.push({
        day: offDays[0],
        modality: missModality,
        durationMin: 25,
        hrZone: missZone,
        structure: `moderate intensity — stay in ${missZone.label} (${missZone.bpmLow}-${missZone.bpmHigh} BPM)`,
        placement: 'standalone',
        rationale: 'moderate cardio on rest days maintains conditioning without hurting strength gains',
        evidenceId: 'zone_2_base_building',
      });
    }
  } else {
    // muscle_gain or maintain — 1-2 short zone-2 sessions, heart health only
    const targetCount = doesCardio === 'yes' ? 2 : 1;
    // Prefer post-lift sessions; fill from rest days if not enough training days
    const sourceDays = [...trainDays, ...offDays].slice(0, targetCount);
    for (let i = 0; i < sourceDays.length; i++) {
      const day = sourceDays[i];
      const isTraining = trainDays.includes(day);
      sessions.push({
        day,
        modality: lissModality,
        durationMin: 15,
        hrZone: lissZone,
        structure: `easy steady-state — ${lissZone.bpmLow}-${lissZone.bpmHigh} BPM. keep it conversational.`,
        placement: isTraining ? 'post_lift' : 'standalone',
        rationale: 'low-dose zone 2 maintains cardiovascular health without interfering with hypertrophy',
        evidenceId: 'zone_2_base_building',
      });
    }
  }

  if (sessions.length === 0) return null;

  const totalMin = sessions.reduce((s, c) => s + c.durationMin, 0);

  const goalRationale: Record<string, string> = {
    fat_loss:    'zone 2 post-lift depletes glycogen and forces fat oxidation. HIIT adds EPOC-driven calorie burn for 24 hrs.',
    recomp:      'post-lift zone 2 keeps you in fat-burning mode; moderate standalone sessions build aerobic base without killing gains.',
    muscle_gain: 'minimal zone 2 keeps your heart healthy and improves nutrient delivery to muscles — without spiking cortisol.',
    maintain:    'consistent zone 2 maintains cardiovascular fitness and metabolic flexibility.',
  };

  return {
    sessionsPerWeek: sessions.length,
    totalCardioMinPerWeek: totalMin,
    maxHR,
    preferredTypes: cardioTypes.length > 0 ? cardioTypes : [lissModality],
    goalRationale: goalRationale[goal] ?? goalRationale.maintain,
    sessions,
  };
}
