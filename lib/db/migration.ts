/**
 * One-time migration: MMKV Zustand blobs → WatermelonDB.
 * Guarded by MMKV flag `watermelon_migration_done`.
 * Safe to call on every app start — exits immediately if already done.
 */

import { storage, STORAGE_KEYS } from '@/lib/storage';
import { getDatabase } from './index';

const MIGRATION_FLAG = 'watermelon_migration_done';

function parseZustandBlob<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { state?: T };
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

function nowMs(): number {
  return Date.now();
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // Fallback for environments where crypto.randomUUID isn't available
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function runMigrationIfNeeded(): Promise<void> {
  if (storage.getBoolean(MIGRATION_FLAG)) return;

  const db = getDatabase();

  try {
    await db.write(async () => {
      const mealsCol = db.get('meal_logs');
      const workoutsCol = db.get('workouts');
      const prsCol = db.get('exercise_prs');
      const plansCol = db.get('workout_plans');
      const sleepCol = db.get('sleep_entries');
      const customFoodsCol = db.get('custom_foods');
      const savedMealsCol = db.get('saved_meals');

      const now = nowMs();
      const ops: ReturnType<typeof mealsCol.prepareCreate>[] = [];

      // ── Meals ────────────────────────────────────────────────────────────
      const trackerState = parseZustandBlob<{ dailyLogs?: Record<string, unknown> }>(
        storage.getString(STORAGE_KEYS.TRACKER_LOGS)
      );
      const dailyLogs = trackerState?.dailyLogs ?? {};

      for (const [, log] of Object.entries(dailyLogs)) {
        const daily = log as { meals?: unknown[]; dateKey?: string };
        const meals = Array.isArray(daily.meals) ? daily.meals : [];
        for (const m of meals as Array<Record<string, unknown>>) {
          ops.push(
            mealsCol.prepareCreate((record) => {
              record._raw.id = (m.id as string) || uuid();
              record._setRaw('date_key', (m.dateKey as string) || daily.dateKey || '');
              record._setRaw('meal_type', (m.mealType as string) || 'snack');
              record._setRaw('name', (m.name as string) || '');
              record._setRaw('ingredients', JSON.stringify(m.ingredients ?? []));
              record._setRaw('oil_entry', m.oilEntry ? JSON.stringify(m.oilEntry) : null);
              record._setRaw('micros', m.micros ? JSON.stringify(m.micros) : null);
              record._setRaw('is_cooked', m.isCooked ? 1 : 0);
              record._setRaw('cooked_weight_grams', (m.cookedWeightGrams as number) ?? null);
              record._setRaw('total_calories', (m.totalCalories as number) || 0);
              record._setRaw('total_protein_g', (m.totalProteinG as number) || 0);
              record._setRaw('total_carbs_g', (m.totalCarbsG as number) || 0);
              record._setRaw('total_fat_g', (m.totalFatG as number) || 0);
              record._setRaw('log_method', (m.logMethod as string) || 'manual');
              record._setRaw('logged_at', m.loggedAt ? new Date(m.loggedAt as string).getTime() : now);
              record._setRaw('created_at', now);
              record._setRaw('updated_at', now);
            })
          );
        }
      }

      // ── Workout logs ─────────────────────────────────────────────────────
      const workoutState = parseZustandBlob<{ logs?: unknown[] }>(
        storage.getString(STORAGE_KEYS.WORKOUT_LOGS)
      );
      for (const w of (workoutState?.logs ?? []) as Array<Record<string, unknown>>) {
        ops.push(
          workoutsCol.prepareCreate((record) => {
            record._raw.id = (w.id as string) || uuid();
            record._setRaw('date', (w.date as string) || '');
            record._setRaw('session_name', (w.sessionName as string) || '');
            record._setRaw('exercises', JSON.stringify(w.exercises ?? []));
            record._setRaw('total_sets', (w.totalSets as number) || 0);
            record._setRaw('duration_minutes', (w.durationMinutes as number) ?? null);
            record._setRaw('feeling_rating', (w.feelingRating as number) ?? null);
            record._setRaw('energy_level', (w.energyLevel as number) ?? null);
            record._setRaw('sleep_last_night', (w.sleepLastNight as number) ?? null);
            record._setRaw('prs_achieved', JSON.stringify(w.prsAchieved ?? []));
            record._setRaw('notes', (w.notes as string) ?? null);
            record._setRaw('created_at', now);
            record._setRaw('updated_at', now);
          })
        );
      }

      // ── Exercise PRs ─────────────────────────────────────────────────────
      const prState = parseZustandBlob<{ prs?: Record<string, unknown> }>(
        storage.getString(STORAGE_KEYS.EXERCISE_PRS)
      );
      for (const [exercise, pr] of Object.entries(prState?.prs ?? {})) {
        const p = pr as Record<string, unknown>;
        ops.push(
          prsCol.prepareCreate((record) => {
            record._raw.id = uuid();
            record._setRaw('exercise_name', exercise);
            record._setRaw('max_weight', (p.maxWeight as number) ?? null);
            record._setRaw('max_reps', (p.maxReps as number) ?? null);
            record._setRaw('estimated_1rm', (p.estimated1rm as number) ?? null);
            record._setRaw('achieved_at', p.achievedAt ? new Date(p.achievedAt as string).getTime() : now);
            record._setRaw('created_at', now);
            record._setRaw('updated_at', now);
          })
        );
      }

      // ── Workout plans ────────────────────────────────────────────────────
      const planState = parseZustandBlob<{ plans?: unknown[]; activePlanId?: string }>(
        storage.getString(STORAGE_KEYS.WORKOUT_PLANS)
      );
      for (const plan of (planState?.plans ?? []) as Array<Record<string, unknown>>) {
        const isActive = plan.id === planState?.activePlanId;
        ops.push(
          plansCol.prepareCreate((record) => {
            record._raw.id = (plan.id as string) || uuid();
            record._setRaw('is_active', isActive ? 1 : 0);
            record._setRaw('split_name', (plan.splitName as string) || '');
            record._setRaw('source', 'ai_generated');
            record._setRaw('plan_data', JSON.stringify(plan));
            record._setRaw('created_at', now);
            record._setRaw('updated_at', now);
          })
        );
      }

      // ── Sleep logs ───────────────────────────────────────────────────────
      const sleepState = parseZustandBlob<{ entries?: Record<string, unknown> }>(
        storage.getString(STORAGE_KEYS.SLEEP_LOGS)
      );
      for (const [dateKey, entry] of Object.entries(sleepState?.entries ?? {})) {
        const s = entry as Record<string, unknown>;
        ops.push(
          sleepCol.prepareCreate((record) => {
            record._raw.id = uuid();
            record._setRaw('date_key', dateKey);
            record._setRaw('bedtime', s.bedtime ? new Date(s.bedtime as string).getTime() : now);
            record._setRaw('wake_time', s.wakeTime ? new Date(s.wakeTime as string).getTime() : now);
            record._setRaw('duration_min', (s.durationMin as number) || 0);
            record._setRaw('quality', (s.quality as number) ?? null);
            record._setRaw('wake_count', (s.wakeCount as number) ?? null);
            record._setRaw('source', (s.source as string) || 'manual');
            record._setRaw('notes', (s.notes as string) ?? null);
            record._setRaw('created_at', now);
            record._setRaw('updated_at', now);
          })
        );
      }

      // ── Custom foods ─────────────────────────────────────────────────────
      const customFoodState = parseZustandBlob<{ foods?: unknown[] }>(
        storage.getString(STORAGE_KEYS.CUSTOM_FOODS)
      );
      for (const f of (customFoodState?.foods ?? []) as Array<Record<string, unknown>>) {
        ops.push(
          customFoodsCol.prepareCreate((record) => {
            record._raw.id = (f.id as string) || uuid();
            record._setRaw('name', (f.name as string) || '');
            record._setRaw('calories_per_100g', (f.caloriesPer100g as number) || 0);
            record._setRaw('protein_per_100g', (f.proteinPer100g as number) || 0);
            record._setRaw('carbs_per_100g', (f.carbsPer100g as number) || 0);
            record._setRaw('fat_per_100g', (f.fatPer100g as number) || 0);
            record._setRaw('micros_per_100g', f.microsPer100g ? JSON.stringify(f.microsPer100g) : null);
            record._setRaw('created_at', f.createdAt ? new Date(f.createdAt as string).getTime() : now);
            record._setRaw('updated_at', now);
          })
        );
      }

      // ── Saved meals ──────────────────────────────────────────────────────
      const savedMealState = parseZustandBlob<{ meals?: unknown[] }>(
        storage.getString(STORAGE_KEYS.SAVED_MEALS)
      );
      for (const sm of (savedMealState?.meals ?? []) as Array<Record<string, unknown>>) {
        ops.push(
          savedMealsCol.prepareCreate((record) => {
            record._raw.id = (sm.id as string) || uuid();
            record._setRaw('name', (sm.name as string) || '');
            record._setRaw('ingredients', JSON.stringify(sm.ingredients ?? []));
            record._setRaw('total_calories', (sm.totalCalories as number) ?? null);
            record._setRaw('total_protein_g', (sm.totalProteinG as number) ?? null);
            record._setRaw('total_carbs_g', (sm.totalCarbsG as number) ?? null);
            record._setRaw('total_fat_g', (sm.totalFatG as number) ?? null);
            record._setRaw('created_at', sm.createdAt ? new Date(sm.createdAt as string).getTime() : now);
            record._setRaw('updated_at', now);
          })
        );
      }

      if (ops.length > 0) {
        await db.batch(...ops);
      }
    });

    storage.set(MIGRATION_FLAG, true);
    console.log('[WatermelonDB] migration complete');
  } catch (err) {
    console.error('[WatermelonDB] migration failed:', err);
    // Don't set flag — will retry on next launch
  }
}
