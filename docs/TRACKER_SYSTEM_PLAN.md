# docs/TRACKER_SYSTEM_PLAN.md — Daily Tracker, Logging & Global Food Engine

> Consolidated documentation mapping the core daily logging loops, global database, and advanced tracking configurations.
> **Last updated:** June 2026

---

## 1. Global Food Database Expansion

While the initial prototype relied strictly on Indian datasets (ICMR-NIN IFCT 2017), Tapped In has expanded to address a **global market**. The data engine integrates:

1. **Local Desi Staples** (IFCT 2017): curries, roti, dal variations, dosa, curd.
2. **Global & USDA Staples** (FoodData Central): whole meat cuts, grains, dairy, vegetables, protein powders, supplements.
3. **Regional & International Databases**: regional recipes, packaged brands, and restaurant chains globally.

### FoodItem TypeScript / SQLite Schema
```typescript
interface FoodItem {
  id: string;
  name: string;
  nameHindi?: string;
  aliases: string[];
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sugarPer100g: number;
  saturatedFatPer100g: number;
  sodiumMgPer100g: number;
  potassiumMgPer100g: number;
  ironMgPer100g: number;
  calciumMgPer100g: number;
  magnesiumMgPer100g: number;
  zincMgPer100g: number;
  b12McgPer100g: number;
  vitaminDIuPer100g: number;
  folateMcgPer100g: number;
  omega3MgPer100g: number;
  isVeg: boolean;
  category: string;
  servingUnit: string;      // 'g' or 'ml'
  servingGrams: number;
  densityGPerMl?: number;   // silent ml-to-g conversion for milk, oils, juices
  commonServings: { label: string; grams: number }[];
}
```

---

## 2. Completed Logging Flows

The meal logger is fully built, hardened, and visually optimized under neobrutalism v5 specs:

```
                  +--------------------------------+
                  |           MEAL FEED            |
                  +--------------------------------+
                                   |
                +------------------+------------------+
                |                                     |
                v                                     v
       [ MANUAL 4-STEP ]                       [ AI PHOTO SCAN ]
 1. Name & Meal Type chips              1. Snap plate / Gallery
 2. Debounced search & weights          2. Gemini Vision scanning
 3. Mandatory OilCheckModal             3. Confirm editable draft
 4. Haptic success & Log                4. Mandatory OilCheckModal
                                        5. Haptic success & Log
```

### 2.1 debounced Search & local Caching
* **Search Engine:** Debounces input by $300\text{ms}$. Searches the local SQLite database and pre-compiled TypeScript list. If less than 3 local matches exist, users can tap "Search online" to run an API query against global USDA/OFF datasets.
* **Recent Rings:** Pre-loads the last 30 recently logged foods directly from a lightweight MMKV array on search mount.

### 2.2 Hardened Gemini Vision AI Scanner
* **No-Oil Extraction:** Enforces the rule that Gemini Vision must **never** place oil, ghee, or butter directly in the estimated `ingredients[]`. Gemini reports potential oil parameters in `notes` or `oilWarning`, which forces the local `OilCheckModal` to trigger.
* **Truncation Repair:** The system parses output in JSON-mode with automated string repairs to handle occasional network truncation issues gracefully.

### 2.3 Advanced Features
* **Voice Logging:** Integrates native speech-to-text. The text transcript is parsed using a Fastify endpoint (Gemini text parse) to yield an editable ingredient list draft.
* **Barcode Scanner:** Camera scanning overlay parses EAN-13 barcodes, matching locally before hitting the Open Food Facts API and adding products seamlessly.
* **Carb Cycling:** Supports High, Medium, and Low days (Training vs. Rest targets) mapped to the user profile. Daily targets update automatically based on workout log detections.

---

## 3. Persistent Database Model (Drizzle SQLite)

The flat MMKV JSON logging model is replaced with structured, relational tables inside **Expo SQLite** managed via **Drizzle ORM**:

```typescript
// lib/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const mealLogs = sqliteTable('meal_logs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  mealType: text('meal_type').notNull(), // 'breakfast', 'lunch', ...
  loggedAt: text('logged_at').notNull(), // ISO Timestamp
  dateKey: text('date_key').notNull(),   // 'YYYY-MM-DD'
  isCooked: integer('is_cooked', { mode: 'boolean' }).notNull(),
  cookedWeightGrams: real('cooked_weight_grams'),
  logMethod: text('log_method').notNull(), // 'manual', 'ai_scan', 'voice', 'barcode'
  totalCalories: real('total_calories').notNull(),
  totalProteinG: real('total_protein_g').notNull(),
  totalCarbsG: real('total_carbs_g').notNull(),
  totalFatG: real('total_fat_g').notNull(),
});

export const ingredients = sqliteTable('ingredients', {
  id: text('id').primaryKey(),
  mealId: text('meal_id').references(() => mealLogs.id, { onDelete: 'cascade' }),
  foodId: text('food_id').notNull(),
  name: text('name').notNull(),
  weightGrams: real('weight_grams').notNull(),
  cookingState: text('cooking_state').notNull(), // 'raw', 'cooked'
  calories: real('calories').notNull(),
  proteinG: real('protein_g').notNull(),
  carbsG: real('carbs_g').notNull(),
  fatG: real('fat_g').notNull(),
  fiberG: real('fiber_g').notNull(),
  sodiumMg: real('sodium_mg').notNull(),
});

export const oilEntries = sqliteTable('oil_entries', {
  id: text('id').primaryKey(),
  mealId: text('meal_id').references(() => mealLogs.id, { onDelete: 'cascade' }).unique(),
  oilType: text('oil_type').notNull(), // 'ghee', 'mustard', 'olive', ...
  weightGrams: real('weight_grams').notNull(),
  calories: real('calories').notNull(),
  fatG: real('fat_g').notNull(),
});
```

---

## 4. Micronutrient RDA Targets (ICMR-NIN & Global Standards)

Surfaces in the collapsible `MicroPanel` on the tracker home tab. Sums rolling 7-day averages to highlight chronic deficiencies:

| Nutrient | Male Target | Female Target | Standard |
|---|---|---|---|
| **Iron** | $17\text{ mg}$ | $21\text{ mg}$ | ICMR 2020 |
| **Calcium** | $1000\text{ mg}$ | $1000\text{ mg}$ | ICMR 2020 |
| **B12** | $1\text{ mcg}$ | $1\text{ mcg}$ | ICMR 2020 |
| **Vit D** | $600\text{ IU}$ | $600\text{ IU}$ | ICMR 2020 |
| **Zinc** | $12\text{ mg}$ | $10\text{ mg}$ | ICMR 2020 |
| **Fibre** | $30\text{ g}$ | $25\text{ g}$ | ICMR 2020 |
| **Sodium** | $2000\text{ mg}$ | $2000\text{ mg}$ | ICMR (Upper Limit) |
| **Magnesium** | $340\text{ mg}$ | $310\text{ mg}$ | ICMR 2020 |
| **Potassium** | $3500\text{ mg}$ | $3500\text{ mg}$ | ICMR 2020 |
