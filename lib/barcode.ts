import { openDatabaseSync } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { normalizeMicros } from '@/data/micronutrients';
import type { FoodItem } from '@/data/foods';
import { OFF_USER_AGENT } from '@/constants/app-meta';

let _cacheDb: SQLiteDatabase | null = null;

function getCacheDb(): SQLiteDatabase {
  if (!_cacheDb) {
    _cacheDb = openDatabaseSync('barcode_cache.db');
    _cacheDb.execSync(`
      CREATE TABLE IF NOT EXISTS barcode_products (
        barcode         TEXT PRIMARY KEY,
        name            TEXT,
        brand           TEXT,
        calories_per_100g REAL,
        protein_per_100g  REAL,
        carbs_per_100g    REAL,
        fat_per_100g      REAL,
        serving_grams     REAL,
        micros_json       TEXT,
        fetched_at        INTEGER
      )
    `);
  }
  return _cacheDb;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cacheRowToFoodItem(row: any): FoodItem {
  const brand = row.brand ? ` (${row.brand})` : '';
  return {
    id: `off_${row.barcode as string}`,
    name: `${row.name as string}${brand}`,
    nameHindi: '',
    caloriesPer100g: (row.calories_per_100g as number) ?? 0,
    proteinPer100g: (row.protein_per_100g as number) ?? 0,
    carbsPer100g: (row.carbs_per_100g as number) ?? 0,
    fatPer100g: (row.fat_per_100g as number) ?? 0,
    isVeg: true,
    servingUnit: 'g',
    servingGrams: (row.serving_grams as number) ?? 100,
    microsPer100g: normalizeMicros(
      row.micros_json ? (JSON.parse(row.micros_json as string) as Record<string, number>) : null
    ),
  };
}

function fromCache(code: string): FoodItem | null {
  try {
    const rows = getCacheDb().getAllSync(
      `SELECT * FROM barcode_products WHERE barcode = ?`,
      [code]
    );
    return rows.length > 0 ? cacheRowToFoodItem(rows[0]) : null;
  } catch { return null; }
}

function insertCache(code: string, food: FoodItem): void {
  try {
    getCacheDb().runSync(
      `INSERT OR REPLACE INTO barcode_products
       (barcode, name, brand, calories_per_100g, protein_per_100g,
        carbs_per_100g, fat_per_100g, serving_grams, micros_json, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        food.name,
        '',
        food.caloriesPer100g,
        food.proteinPer100g,
        food.carbsPer100g,
        food.fatPer100g,
        food.servingGrams,
        JSON.stringify(food.microsPer100g),
        Date.now(),
      ]
    );
  } catch { /* cache write failure is non-fatal */ }
}

async function fetchFromOFF(code: string): Promise<FoodItem | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json`,
      { headers: { 'User-Agent': OFF_USER_AGENT } }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, unknown>;
    if (json.status !== 1) return null;
    const product = (json.product ?? {}) as Record<string, unknown>;
    const nutriments = (product.nutriments ?? {}) as Record<string, unknown>;

    const name = (product.product_name as string) || 'Unknown product';
    const brand = (product.brands as string) || '';
    let calories = Number(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0);
    const protein = Number(nutriments['proteins_100g'] ?? 0);
    const carbs = Number(nutriments['carbohydrates_100g'] ?? 0);
    const fat = Number(nutriments['fat_100g'] ?? 0);
    const serving = Number(product.serving_quantity ?? 100);

    // Many products list macros but no kcal (or only kJ). Derive kcal from
    // macros via Atwater factors so the product never shows up with 0 calories.
    if (!(calories > 0)) {
      const kj = Number(nutriments['energy-kj_100g'] ?? nutriments['energy_100g'] ?? 0);
      if (kj > 0) calories = Math.round(kj / 4.184);
      else if (protein > 0 || carbs > 0 || fat > 0) calories = Math.round(protein * 4 + carbs * 4 + fat * 9);
    }

    const food: FoodItem = {
      id: `off_${code}`,
      name: brand ? `${name} (${brand})` : name,
      nameHindi: '',
      caloriesPer100g: calories,
      proteinPer100g: protein,
      carbsPer100g: carbs,
      fatPer100g: fat,
      isVeg: true,
      servingUnit: 'g',
      servingGrams: serving > 0 ? serving : 100,
      microsPer100g: normalizeMicros(null),
    };

    insertCache(code, food);
    return food;
  } catch { return null; }
}

/** Look up a barcode: cache first, then Open Food Facts. Returns null on miss or offline. */
export async function lookupBarcode(code: string): Promise<FoodItem | null> {
  return fromCache(code) ?? fetchFromOFF(code);
}
