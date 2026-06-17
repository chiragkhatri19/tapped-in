/**
 * Shared Gemini workout-generation prompt and structured-output schema.
 * Imported by BOTH the backend (backend/src/lib/gemini.ts) and the
 * mobile app's client-side fallback (app/(tabs)/workout.tsx).
 * Single source of truth — edit here, not in either consumer.
 */

// ---------------------------------------------------------------------------
// Prompt template
// Placeholders: {goal} {sex} {age} {weightKg} {daysPerWeek} {sessionMinutes}
//               {restDaysPerWeek} {experience} {equipment} {splitLengthWeeks}
//               {weakMuscles} {favouriteMuscles} {healthConditions} {exerciseMenu}
// ---------------------------------------------------------------------------
export const WORKOUT_PROMPT = `You are an evidence-based strength coach. Build a complete workout SPLIT for the user.
Choose exercises ONLY by their exerciseId from the MENU below. NEVER invent exercise ids - use only exact ids from the MENU.

USER:
- Goal: {goal} (fat_loss | recomp | muscle_gain | maintain)
- Sex / Age / Weight: {sex}, {age} yrs, {weightKg} kg
- Training days per week: {daysPerWeek}
- Rest days per week: {restDaysPerWeek} (schedule exactly this many "Rest" or "Active Rest" days in weeklySchedule)
- Session duration: {sessionMinutes} minutes (including warm-up)
- Experience level: {experience} (beginner | intermediate | advanced)
- Equipment available: {equipment} (full_gym | dumbbells_only | home_minimal) — ONLY use exercises whose equipment is in the MENU
- Mesocycle / split length: {splitLengthWeeks} weeks
- Weak muscles — PRIORITISE these (train first in their session, aim for upper end of volume range): {weakMuscles}
- Favourite muscles — add 1-2 extra sets: {favouriteMuscles}
- Health limits / conditions (avoid aggravating): {healthConditions}

STRICT RULES — follow all or the output is invalid:
1. FREQUENCY: hit EVERY muscle at least 2x/week when daysPerWeek allows. NEVER produce a 1-muscle-per-day / bro split. If daysPerWeek <= 3 use full body. If daysPerWeek = 4 use upper/lower. If daysPerWeek >= 5 use push/pull/legs.
2. VOLUME: 12-14 working sets per muscle per week is the target. Weak muscles and favourites may go up to 16-18. NEVER exceed 22 sets per muscle per week (junk volume). Do not count warm-up sets. For beginners use 10-12 sets; for advanced 14-18 sets per muscle.
3. ORDER: compounds before isolation in every session. The weak/priority muscle exercises go FIRST in that session when CNS is freshest — this is critical for maximising weak-point development.
4. SETS & REPS per exercise: sets 2-5, a reps range (e.g. "6-10"), restSeconds (compounds 150-180, isolation 60-90). isPriorityLift true ONLY for the first exercise of a session.
5. TEMPO: prescribe a lifting tempo as "eccentric-pause-concentric" (e.g. "3-1-1" = 3s lower, 1s pause, 1s lift). Compounds: "3-0-1". Isolation: "2-1-1". Explosive/speed work: "1-0-X".
6. RIR (reps-in-reserve): fat_loss or maintain = 2. muscle_gain = 1. recomp = 2. Beginners should use RIR 3.
7. weeklySchedule: map every weekday (monday-sunday) to EITHER an exact session name from your sessions array, OR "Rest", OR "Active Rest". Every session name must appear at least once. Schedule EXACTLY {restDaysPerWeek} rest/active-rest days.
8. selectionRationale per session: ONE short sentence explaining why these exercises fit this user's weak/favourite muscles and goal.
9. programmeRationale: 2-3 sentences on the split choice and why it suits the user's inputs.
10. hotTakes: 2-3 short lines, casual Gen-Z English, no emoji, no generic advice.

EXERCISE MENU (exerciseId grouped by muscle — only use these ids):
{exerciseMenu}

Return ONLY a valid JSON object matching this exact shape — no text, no markdown outside the JSON:
{
  "splitName": "string",
  "splitType": "string",
  "programmeRationale": "string",
  "weeklySchedule": {
    "monday": "string", "tuesday": "string", "wednesday": "string",
    "thursday": "string", "friday": "string", "saturday": "string", "sunday": "string"
  },
  "sessions": [
    {
      "name": "string",
      "sessionGoal": "string",
      "selectionRationale": "string",
      "exercises": [
        {
          "exerciseId": "string",
          "sets": 3,
          "reps": "8-12",
          "restSeconds": 120,
          "isPriorityLift": false,
          "tempo": "3-0-1",
          "rir": 2
        }
      ]
    }
  ],
  "hotTakes": ["string", "string"]
}`;

// ---------------------------------------------------------------------------
// Structured-output schema (Gemini API responseSchema format)
// ---------------------------------------------------------------------------
const WEEKDAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

export const WORKOUT_SKELETON_SCHEMA = {
  type: 'OBJECT',
  required: ['splitName', 'sessions', 'weeklySchedule'],
  properties: {
    splitName:          { type: 'STRING' },
    splitType:          { type: 'STRING' },
    programmeRationale: { type: 'STRING' },
    weeklySchedule: {
      type: 'OBJECT',
      properties: Object.fromEntries(WEEKDAYS.map(d => [d, { type: 'STRING' }])),
    },
    sessions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        required: ['name', 'exercises'],
        properties: {
          name:               { type: 'STRING' },
          sessionGoal:        { type: 'STRING' },
          selectionRationale: { type: 'STRING' },
          exercises: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              required: ['exerciseId', 'sets', 'reps', 'restSeconds'],
              properties: {
                exerciseId:    { type: 'STRING' },
                sets:          { type: 'INTEGER' },
                reps:          { type: 'STRING' },
                restSeconds:   { type: 'INTEGER' },
                isPriorityLift:{ type: 'BOOLEAN' },
                tempo:         { type: 'STRING' },
                rir:           { type: 'INTEGER' },
              },
            },
          },
        },
      },
    },
    hotTakes: { type: 'ARRAY', items: { type: 'STRING' } },
  },
} as const;
