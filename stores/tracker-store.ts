/**
 * Tapped In — Tracker Zustand Store
 *
 * Replaces the Context API approach for meal logging state.
 * Uses MMKV via zustandMMKVStorage for synchronous persistence.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage, zustandMMKVStorage, STORAGE_KEYS } from '@/lib/storage';
import type { LoggedMeal, DailyLog, LoggedIngredient } from '@/data/tracker-types';
import { createZeroMicros, legacyMicrosFrom, normalizeMicros, sumMicros, type MicroMap } from '@/data/micronutrients';
import { sumSupplementMicros } from '@/data/supplements';

const LEGACY_TRACKER_KEY = 'tapped_in_tracker_logs_v2';
const PERSIST_VERSION = 2;

// ── Date helpers ──────────────────────────────────────────

export function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDaysKey(baseKey: string, delta: number): string {
  const [y, m, d] = baseKey.split('-').map(Number);
  const next = new Date(y, m - 1, d + delta);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}

function recomputeTotals(
  meals: LoggedMeal[]
): Pick<DailyLog, 'totalCalories' | 'totalProteinG' | 'totalCarbsG' | 'totalFatG' | 'micros'> {
  return meals.reduce(
    (acc, meal) => ({
      totalCalories: acc.totalCalories + meal.totalCalories,
      totalProteinG: acc.totalProteinG + meal.totalProteinG,
      totalCarbsG: acc.totalCarbsG + meal.totalCarbsG,
      totalFatG: acc.totalFatG + meal.totalFatG,
      micros: sumMicros([acc.micros, meal.micros]),
    }),
    { totalCalories: 0, totalProteinG: 0, totalCarbsG: 0, totalFatG: 0, micros: createZeroMicros() }
  );
}

function emptyDailyLog(dateKey: string, waterMl = 0): DailyLog {
  return {
    dateKey,
    meals: [],
    waterMl: Math.max(0, waterMl),
    totalCalories: 0,
    totalProteinG: 0,
    totalCarbsG: 0,
    totalFatG: 0,
    micros: createZeroMicros(),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function migrateIngredient(raw: unknown): LoggedIngredient | null {
  if (!isObject(raw)) return null;
  return {
    foodId: typeof raw.foodId === 'string' ? raw.foodId : 'unknown',
    name: typeof raw.name === 'string' ? raw.name : 'ingredient',
    weightGrams: asNumber(raw.weightGrams),
    cookingState: raw.cookingState === 'raw' ? 'raw' : 'cooked',
    calories: asNumber(raw.calories),
    proteinG: asNumber(raw.proteinG),
    carbsG: asNumber(raw.carbsG),
    fatG: asNumber(raw.fatG),
    micros: legacyMicrosFrom(raw),
  };
}

function migrateMeal(raw: unknown): LoggedMeal | null {
  if (!isObject(raw)) return null;
  const ingredients = Array.isArray(raw.ingredients)
    ? raw.ingredients.map(migrateIngredient).filter((i): i is LoggedIngredient => i !== null)
    : [];
  const micros = normalizeMicros(
    isObject(raw.micros) ? raw.micros as Record<string, number> : sumMicros(ingredients.map((i) => i.micros))
  );
  return {
    id: typeof raw.id === 'string' ? raw.id : `${Date.now()}`,
    name: typeof raw.name === 'string' ? raw.name : 'meal',
    mealType: raw.mealType === 'breakfast' || raw.mealType === 'dinner' || raw.mealType === 'snack' || raw.mealType === 'pre_workout' || raw.mealType === 'post_workout' ? raw.mealType : 'lunch',
    ingredients,
    oilEntry: isObject(raw.oilEntry) ? raw.oilEntry as unknown as LoggedMeal['oilEntry'] : undefined,
    loggedAt: typeof raw.loggedAt === 'string' ? raw.loggedAt : new Date().toISOString(),
    dateKey: typeof raw.dateKey === 'string' ? raw.dateKey : getTodayKey(),
    isCooked: raw.isCooked === true,
    totalCalories: asNumber(raw.totalCalories),
    totalProteinG: asNumber(raw.totalProteinG),
    totalCarbsG: asNumber(raw.totalCarbsG),
    totalFatG: asNumber(raw.totalFatG),
    micros,
    logMethod: raw.logMethod === 'ai_scan' ? 'ai_scan' : 'manual',
  };
}

function migrateDailyLog(raw: unknown, fallbackDateKey: string): DailyLog {
  if (!isObject(raw)) return emptyDailyLog(fallbackDateKey);
  const dateKey = typeof raw.dateKey === 'string' ? raw.dateKey : fallbackDateKey;
  const meals = Array.isArray(raw.meals)
    ? raw.meals.map(migrateMeal).filter((m): m is LoggedMeal => m !== null)
    : [];
  const totals = recomputeTotals(meals);
  return {
    dateKey,
    meals,
    waterMl: asNumber(raw.waterMl),
    ...totals,
  };
}

function migrateDailyLogs(raw: unknown): Record<string, DailyLog> {
  if (!isObject(raw)) return {};
  const out: Record<string, DailyLog> = {};
  for (const [key, value] of Object.entries(raw)) out[key] = migrateDailyLog(value, key);
  return out;
}

/** One-time: move context-era logs into Zustand persist key. */
function migrateLegacyTrackerLogs(): void {
  try {
    const legacyRaw = storage.getString(LEGACY_TRACKER_KEY);
    if (!legacyRaw) return;

    const canonicalRaw = storage.getString(STORAGE_KEYS.TRACKER_LOGS);
    if (canonicalRaw) return;

    const dailyLogs = migrateDailyLogs(JSON.parse(legacyRaw));
    const payload = JSON.stringify({ state: { dailyLogs, viewingKey: getTodayKey(), supplementLog: {} }, version: PERSIST_VERSION });
    storage.set(STORAGE_KEYS.TRACKER_LOGS, payload);
  } catch {
    // ignore corrupt legacy blob
  }
}

migrateLegacyTrackerLogs();

// ── Store type ────────────────────────────────────────────

interface TrackerState {
  dailyLogs: Record<string, DailyLog>;
  supplementLog: Record<string, string[]>;
  /** UI date navigation — not required in persist */
  viewingKey: string;

  todayKey: () => string;
  todayLog: () => DailyLog | null;
  logForDate: (dateKey: string) => DailyLog | null;
  recentLogs: (days: number) => DailyLog[];
  microsWithSupplements: (dateKey: string) => MicroMap;
  checkedSupplements: (dateKey?: string) => string[];
  setViewingKey: (dateKey: string) => void;

  addMeal: (meal: LoggedMeal) => void;
  deleteMeal: (mealId: string, dateKey?: string) => void;
  clearDay: (dateKey?: string) => void;
  addWater: (ml: number, dateKey?: string) => void;
  setWater: (ml: number, dateKey?: string) => void;
  toggleSupplement: (dateKey: string, id: string) => void;
  /** Log a weight check-in for a specific date */
  logWeight: (weightKg: number, dateKey?: string) => void;
}

// ── Store implementation ──────────────────────────────────

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      dailyLogs: {},
      supplementLog: {},
      viewingKey: getTodayKey(),

      todayKey: () => getTodayKey(),

      todayLog: () => {
        const key = getTodayKey();
        return get().dailyLogs[key] ?? null;
      },

      logForDate: (dateKey: string) => get().dailyLogs[dateKey] ?? null,

      recentLogs: (days: number) => {
        const today = getTodayKey();
        return Array.from({ length: days }, (_, i) => {
          const key = addDaysKey(today, -(days - 1 - i));
          return get().dailyLogs[key] ?? emptyDailyLog(key);
        });
      },

      microsWithSupplements: (dateKey: string) => {
        const foodMicros = get().dailyLogs[dateKey]?.micros ?? createZeroMicros();
        const suppMicros = sumSupplementMicros(get().supplementLog[dateKey] ?? []);
        return sumMicros([foodMicros, suppMicros]);
      },

      checkedSupplements: (dateKey?: string) => get().supplementLog[dateKey ?? getTodayKey()] ?? [],

      setViewingKey: (dateKey: string) => set({ viewingKey: dateKey }),

      // ── Mutations ───────────────────────────────────────

      addMeal: (meal: LoggedMeal) => {
        const key = meal.dateKey;
        const normalizedMeal = migrateMeal(meal) ?? meal;
        set(state => {
          const existingLog = state.dailyLogs[key];
          const existingMeals = existingLog?.meals ?? [];
          const updatedMeals = [...existingMeals, normalizedMeal];
          const totals = recomputeTotals(updatedMeals);
          return {
            dailyLogs: {
              ...state.dailyLogs,
              [key]: {
                dateKey: key,
                meals: updatedMeals,
                waterMl: existingLog?.waterMl ?? 0,
                ...totals,
              },
            },
          };
        });
      },

      deleteMeal: (mealId: string, dateKey?: string) => {
        set(state => {
          const keysToSearch = dateKey ? [dateKey] : Object.keys(state.dailyLogs);
          let changed = false;
          const dailyLogs = { ...state.dailyLogs };
          for (const key of keysToSearch) {
            const existing = dailyLogs[key];
            if (!existing?.meals.some(m => m.id === mealId)) continue;
            const updatedMeals = existing.meals.filter(m => m.id !== mealId);
            dailyLogs[key] = { ...existing, meals: updatedMeals, ...recomputeTotals(updatedMeals) };
            changed = true;
            break;
          }
          return changed ? { dailyLogs } : state;
        });
      },

      clearDay: (dateKey?: string) => {
        const key = dateKey ?? getTodayKey();
        set(state => {
          const { [key]: _removed, ...rest } = state.dailyLogs;
          return { dailyLogs: rest };
        });
      },

      addWater: (ml: number, dateKey?: string) => {
        const key = dateKey ?? getTodayKey();
        set(state => {
          const existing = state.dailyLogs[key];
          const current = existing?.waterMl ?? 0;
          return {
            dailyLogs: {
              ...state.dailyLogs,
              [key]: existing ? { ...existing, waterMl: Math.max(0, current + ml) } : emptyDailyLog(key, ml),
            },
          };
        });
      },

      setWater: (ml: number, dateKey?: string) => {
        const key = dateKey ?? getTodayKey();
        set(state => {
          const existing = state.dailyLogs[key];
          return {
            dailyLogs: {
              ...state.dailyLogs,
              [key]: existing ? { ...existing, waterMl: Math.max(0, ml) } : emptyDailyLog(key, ml),
            },
          };
        });
      },

      toggleSupplement: (dateKey: string, id: string) => {
        set(state => {
          const current = state.supplementLog[dateKey] ?? [];
          const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
          return { supplementLog: { ...state.supplementLog, [dateKey]: next } };
        });
      },

      logWeight: (weightKg: number, dateKey?: string) => {
        const key = dateKey ?? getTodayKey();
        set(state => {
          const existing = state.dailyLogs[key];
          return {
            dailyLogs: {
              ...state.dailyLogs,
              [key]: existing
                ? { ...existing, weightKg }
                : { ...emptyDailyLog(key), weightKg },
            },
          };
        });
      },
    }),
    {
      name: STORAGE_KEYS.TRACKER_LOGS,
      storage: createJSONStorage(() => zustandMMKVStorage),
      version: PERSIST_VERSION,
      migrate: (persistedState: unknown) => {
        if (!isObject(persistedState)) return persistedState;
        return {
          ...persistedState,
          dailyLogs: migrateDailyLogs(persistedState.dailyLogs),
          supplementLog: isObject(persistedState.supplementLog) ? persistedState.supplementLog : {},
          viewingKey: typeof persistedState.viewingKey === 'string' ? persistedState.viewingKey : getTodayKey(),
        };
      },
      partialize: state => ({ dailyLogs: state.dailyLogs, supplementLog: state.supplementLog }),
    }
  )
);

// ── Convenience hooks (use these in components) ───────────

/** Subscribe only to today's calorie total — only re-renders when this changes */
const useTodayCalories = () =>
  useTrackerStore(s => s.todayLog()?.totalCalories ?? 0);

/** Subscribe only to today's meals list */
const useTodayMeals = () =>
  useTrackerStore(s => s.todayLog()?.meals ?? []);

/** Subscribe only to mutations (never causes re-renders from state changes) */
const useTrackerActions = () =>
  useTrackerStore(s => ({
    addMeal: s.addMeal,
    deleteMeal: s.deleteMeal,
    clearDay: s.clearDay,
  }));

/** Daily log for the date currently being viewed on the tracker tab */
export const useViewingDailyLog = () =>
  useTrackerStore(s => s.dailyLogs[s.viewingKey] ?? null);
