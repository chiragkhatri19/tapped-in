#!/usr/bin/env tsx
import Database from 'better-sqlite3';
import { FOODS } from '../data/foods';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../assets/catalog.db');
export const CATALOG_VERSION = 1;

const db = new Database(OUT);

db.exec(`
  DROP TABLE IF EXISTS foods_fts;
  DROP TABLE IF EXISTS foods;

  CREATE TABLE foods (
    rowid   INTEGER PRIMARY KEY,
    id      TEXT UNIQUE NOT NULL,
    name    TEXT NOT NULL,
    name_hindi          TEXT,
    calories_per_100g   REAL,
    protein_per_100g    REAL,
    carbs_per_100g      REAL,
    fat_per_100g        REAL,
    is_veg              INTEGER,
    serving_unit        TEXT,
    serving_grams       REAL,
    micros_json         TEXT,
    source              TEXT
  );

  CREATE VIRTUAL TABLE foods_fts USING fts5(
    name, name_hindi,
    content='foods', content_rowid='rowid'
  );
`);

const insert = db.prepare<{
  id: string; name: string; nameHindi: string;
  caloriesPer100g: number; proteinPer100g: number;
  carbsPer100g: number; fatPer100g: number;
  isVeg: number; servingUnit: string; servingGrams: number;
  microsJson: string; source: string;
}>(`
  INSERT OR IGNORE INTO foods
    (id, name, name_hindi, calories_per_100g, protein_per_100g,
     carbs_per_100g, fat_per_100g, is_veg, serving_unit, serving_grams,
     micros_json, source)
  VALUES
    (@id, @name, @nameHindi, @caloriesPer100g, @proteinPer100g,
     @carbsPer100g, @fatPer100g, @isVeg, @servingUnit, @servingGrams,
     @microsJson, @source)
`);

const insertAll = db.transaction(() => {
  for (const f of FOODS) {
    insert.run({
      id: f.id,
      name: f.name,
      nameHindi: f.nameHindi ?? '',
      caloriesPer100g: f.caloriesPer100g,
      proteinPer100g: f.proteinPer100g,
      carbsPer100g: f.carbsPer100g,
      fatPer100g: f.fatPer100g,
      isVeg: f.isVeg ? 1 : 0,
      servingUnit: f.servingUnit,
      servingGrams: f.servingGrams,
      microsJson: JSON.stringify(f.microsPer100g ?? {}),
      source: 'curated',
    });
  }
});

insertAll();
db.exec(`INSERT INTO foods_fts(foods_fts) VALUES('rebuild');`);
db.pragma(`user_version = ${CATALOG_VERSION}`);
db.close();

console.log(`✓ assets/catalog.db written (${FOODS.length} foods, version=${CATALOG_VERSION})`);
