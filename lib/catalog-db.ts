import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { openDatabaseSync } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { storage } from '@/lib/storage';
import { normalizeMicros } from '@/data/micronutrients';
import type { FoodItem } from '@/data/foods';

const CATALOG_VERSION = 1;
const VERSION_KEY = 'catalog_db_version';

let _db: SQLiteDatabase | null = null;

export async function ensureCatalogReady(): Promise<void> {
  const stored = storage.getNumber(VERSION_KEY) ?? 0;

  if (stored < CATALOG_VERSION) {
    const asset = Asset.fromModule(require('../assets/catalog.db'));
    await asset.downloadAsync();

    const sqliteDir = FileSystem.documentDirectory + 'SQLite/';
    await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
    await FileSystem.copyAsync({
      from: asset.localUri!,
      to: sqliteDir + 'catalog.db',
    });

    storage.set(VERSION_KEY, CATALOG_VERSION);
  }

  if (!_db) {
    _db = openDatabaseSync('catalog.db');
  }
}

function getCatalogDb(): SQLiteDatabase | null {
  if (!_db) {
    try { _db = openDatabaseSync('catalog.db'); } catch { return null; }
  }
  return _db;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToFoodItem(row: any): FoodItem {
  return {
    id: row.id as string,
    name: row.name as string,
    nameHindi: (row.name_hindi as string) ?? '',
    caloriesPer100g: row.calories_per_100g as number,
    proteinPer100g: row.protein_per_100g as number,
    carbsPer100g: row.carbs_per_100g as number,
    fatPer100g: row.fat_per_100g as number,
    isVeg: row.is_veg === 1,
    servingUnit: (row.serving_unit as FoodItem['servingUnit']) ?? 'g',
    servingGrams: row.serving_grams as number,
    microsPer100g: normalizeMicros(
      row.micros_json ? (JSON.parse(row.micros_json as string) as Record<string, number>) : null
    ),
  };
}

function sanitizeFts(query: string): string {
  // Also strip '-' (FTS5 NOT operator) and ':' (column filter) to prevent
  // users from manipulating search behaviour via operator injection.
  const clean = query.replace(/["^*()\[\]{}|\-:]/g, ' ').trim();
  const tokens = clean.split(/\s+/).filter(Boolean);
  if (!tokens.length) return '';
  return tokens.map((t) => `${t}*`).join(' ');
}

export function queryFoodsFts(query: string, limit = 10): FoodItem[] {
  const db = getCatalogDb();
  if (!db) return [];
  const fts = sanitizeFts(query);
  if (!fts) return [];
  try {
    const rows = db.getAllSync(
      `SELECT f.* FROM foods_fts
       JOIN foods f ON f.rowid = foods_fts.rowid
       WHERE foods_fts MATCH ?
       ORDER BY rank LIMIT ?`,
      [fts, limit]
    );
    return rows.map(rowToFoodItem);
  } catch { return []; }
}

export function getFoodsByIds(ids: string[]): FoodItem[] {
  const db = getCatalogDb();
  if (!db || ids.length === 0) return [];
  try {
    const placeholders = ids.map(() => '?').join(',');
    const rows = db.getAllSync(
      `SELECT * FROM foods WHERE id IN (${placeholders})`,
      ids
    );
    const byId = new Map<string, FoodItem>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rows.map((r: any) => [r.id as string, rowToFoodItem(r)])
    );
    return ids.map((id) => byId.get(id)).filter((f): f is FoodItem => f !== undefined);
  } catch { return []; }
}

export function topFoods(n: number): FoodItem[] {
  const db = getCatalogDb();
  if (!db) return [];
  try {
    const rows = db.getAllSync(`SELECT * FROM foods LIMIT ?`, [n]);
    return rows.map(rowToFoodItem);
  } catch { return []; }
}
