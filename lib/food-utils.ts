import { storage, STORAGE_KEYS } from '@/lib/storage';
import type { CustomFoodItem, SavedMealTemplate } from '@/data/tracker-types';
import { FOODS, type FoodItem } from '@/data/foods';
import { legacyMicrosFrom } from '@/data/micronutrients';
import type { DietType } from '@/types';

// The food catalog ships in the JS bundle (data/foods.ts) so search works on
// every device with zero native/SQLite/FTS5 dependencies. The old SQLite+FTS5
// catalog returned nothing whenever the device's SQLite lacked the fts5 module,
// which is why basic ingredients (rice, chicken) weren't searchable.
const FOODS_BY_ID = new Map<string, FoodItem>(FOODS.map((f) => [f.id, f]));

/** In-memory relevance score for a query against a food. 0 = no match. */
function matchScore(food: FoodItem, q: string): number {
  const name = food.name.toLowerCase();
  if (name === q) return 5;
  if (name.startsWith(q)) return 4;
  // word-boundary prefix (e.g. "rice" matches "Brown Rice")
  if (name.split(/[\s(/-]+/).some((w) => w.startsWith(q))) return 3;
  if (name.includes(q)) return 2;
  if (food.nameHindi && food.nameHindi.includes(q)) return 1;
  return 0;
}

function searchCatalog(query: string, limit: number): FoodItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return FOODS
    .map((f) => ({ f, score: matchScore(f, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.f);
}

function topFoods(n: number): FoodItem[] {
  return FOODS.slice(0, n);
}

function getFoodsByIds(ids: string[]): FoodItem[] {
  return ids.map((id) => FOODS_BY_ID.get(id)).filter((f): f is FoodItem => f !== undefined);
}

/** Catalog lookup by id (custom foods handled by callers). */
export function getFoodById(id: string): FoodItem | undefined {
  return FOODS_BY_ID.get(id);
}

// ── Recently used food IDs ────────────────────────────────

const MAX_RECENT = 12;

function getRecentFoodIds(): string[] {
  try {
    const raw = storage.getString(STORAGE_KEYS.RECENT_FOOD_IDS);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addRecentFoodId(id: string): void {
  try {
    const existing = getRecentFoodIds().filter((i) => i !== id);
    const updated = [id, ...existing].slice(0, MAX_RECENT);
    storage.set(STORAGE_KEYS.RECENT_FOOD_IDS, JSON.stringify(updated));
  } catch {}
}

// ── Custom foods ──────────────────────────────────────────

export function getCustomFoods(): CustomFoodItem[] {
  try {
    const raw = storage.getString(STORAGE_KEYS.CUSTOM_FOODS);
    return raw ? (JSON.parse(raw) as CustomFoodItem[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomFood(food: CustomFoodItem): void {
  try {
    const existing = getCustomFoods().filter((f) => f.id !== food.id);
    storage.set(STORAGE_KEYS.CUSTOM_FOODS, JSON.stringify([food, ...existing]));
  } catch {}
}

// ── Saved meal templates ──────────────────────────────────

export function getSavedMeals(): SavedMealTemplate[] {
  try {
    const raw = storage.getString(STORAGE_KEYS.SAVED_MEALS);
    return raw ? (JSON.parse(raw) as SavedMealTemplate[]) : [];
  } catch {
    return [];
  }
}

export function saveMealTemplate(template: SavedMealTemplate): void {
  try {
    const existing = getSavedMeals().filter((m) => m.id !== template.id);
    storage.set(STORAGE_KEYS.SAVED_MEALS, JSON.stringify([template, ...existing]));
  } catch {}
}

// ── Helpers ───────────────────────────────────────────────

function customToFoodItem(c: CustomFoodItem): FoodItem {
  return {
    id: c.id,
    name: c.name,
    nameHindi: '',
    caloriesPer100g: c.caloriesPer100g,
    proteinPer100g: c.proteinPer100g,
    carbsPer100g: c.carbsPer100g,
    fatPer100g: c.fatPer100g,
    isVeg: true,
    servingUnit: 'g',
    servingGrams: c.servingGrams,
    microsPer100g: legacyMicrosFrom(c as unknown as Record<string, unknown>),
    isCustom: true,
  };
}

function applyDietFilter(foods: FoodItem[], dietType?: DietType): FoodItem[] {
  if (!dietType || dietType === 'non_veg') return foods;
  return foods.filter((f) => {
    if (dietType === 'vegetarian') return f.isVeg || f.id.includes('protein');
    if (dietType === 'eggetarian') return f.isVeg || f.id.includes('egg') || f.id.includes('protein');
    if (dietType === 'vegan') {
      if (!f.isVeg) return false;
      const id = f.id.toLowerCase();
      const isDairy =
        id.includes('paneer') || id.includes('milk') || id.includes('yogurt') ||
        id.includes('dahi') || id.includes('cheese') || id === 'ghee' ||
        id.includes('cream') || id.includes('lassi') || id.includes('chaas') ||
        (id.includes('butter') && !id.includes('peanut') && !id.includes('almond'));
      return !isDairy;
    }
    return true;
  });
}

// ── Search ────────────────────────────────────────────────

/** Search foods by name. Custom foods appear first; catalog searched in-memory. */
export function searchFoods(query: string, limit = 10): FoodItem[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const customMatches = getCustomFoods()
    .map(customToFoodItem)
    .filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.nameHindi && f.nameHindi.includes(q))
    );
  const customIds = new Set(customMatches.map((f) => f.id));
  const catalogResults = searchCatalog(query, limit).filter((f) => !customIds.has(f.id));
  return [...customMatches, ...catalogResults].slice(0, limit);
}

/** Recently used foods (MMKV IDs → catalog lookup), falling back to top catalog items. */
export function getRecentFoods(fallbackCount = 10, dietType?: DietType): FoodItem[] {
  const custom = getCustomFoods().map(customToFoodItem);
  const ids = getRecentFoodIds();

  if (ids.length === 0) {
    const top = applyDietFilter(
      [...custom, ...topFoods(fallbackCount + custom.length)],
      dietType
    );
    return top.slice(0, fallbackCount);
  }

  const catalogIds = ids.filter((id) => !custom.some((c) => c.id === id));
  const catalogItems = getFoodsByIds(catalogIds);
  const customById = new Map(custom.map((c) => [c.id, c]));
  const recent: FoodItem[] = ids
    .map((id) => customById.get(id) ?? catalogItems.find((f) => f.id === id))
    .filter((f): f is FoodItem => f !== undefined);

  if (recent.length < fallbackCount) {
    const recentIds = new Set(recent.map((f) => f.id));
    const filler = applyDietFilter(
      [...custom, ...topFoods(fallbackCount)].filter((f) => !recentIds.has(f.id)),
      dietType
    );
    return [...recent, ...filler].slice(0, fallbackCount);
  }

  return recent.slice(0, fallbackCount);
}
