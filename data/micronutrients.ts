export type MicroGroup = 'mineral' | 'vitamin' | 'fatty_acid';
export type MicroKind = 'reach' | 'ceiling';

export interface MicroDef {
  key: string;
  label: string;
  unit: 'mg' | 'mcg' | 'IU' | 'g';
  rda: number;
  /** Later: add rdaBySex for iron and selected vitamins without changing callers. */
  kind: MicroKind;
  group: MicroGroup;
  colorKey: 'persimmon' | 'teal' | 'violet' | 'orange' | 'blue' | 'pink' | 'pop';
  warning: string;
  precision: number;
  commonlyLow?: boolean;
}

export const MICRONUTRIENTS: MicroDef[] = [
  { key: 'iron', label: 'iron', unit: 'mg', rda: 8, kind: 'reach', group: 'mineral', colorKey: 'persimmon', warning: 'iron is a common gap, especially when red meat or fortified foods are low. Pair plant iron with vitamin C.', precision: 1, commonlyLow: true },
  { key: 'calcium', label: 'calcium', unit: 'mg', rda: 1000, kind: 'reach', group: 'mineral', colorKey: 'teal', warning: 'calcium supports bone and muscle function. Dairy, fortified plant milks, tofu set with calcium, and greens help.', precision: 0, commonlyLow: true },
  { key: 'magnesium', label: 'magnesium', unit: 'mg', rda: 400, kind: 'reach', group: 'mineral', colorKey: 'violet', warning: 'magnesium tends to lag when nuts, seeds, legumes, and whole grains are low.', precision: 0, commonlyLow: true },
  { key: 'potassium', label: 'potassium', unit: 'mg', rda: 3500, kind: 'reach', group: 'mineral', colorKey: 'blue', warning: 'potassium is easiest from potatoes, bananas, beans, lentils, yogurt, and fruit/veg volume.', precision: 0, commonlyLow: true },
  { key: 'sodium', label: 'sodium', unit: 'mg', rda: 2300, kind: 'ceiling', group: 'mineral', colorKey: 'orange', warning: 'sodium is a ceiling target for most people. Packaged foods and restaurant meals add up quickly.', precision: 0 },
  { key: 'zinc', label: 'zinc', unit: 'mg', rda: 11, kind: 'reach', group: 'mineral', colorKey: 'blue', warning: 'zinc is richer and more bioavailable from meat and seafood; legumes, nuts, and seeds help plant-based diets.', precision: 1, commonlyLow: true },
  { key: 'selenium', label: 'selenium', unit: 'mcg', rda: 55, kind: 'reach', group: 'mineral', colorKey: 'teal', warning: 'selenium supports thyroid and antioxidant systems. Eggs, fish, meat, and Brazil nuts are dense sources.', precision: 0 },
  { key: 'iodine', label: 'iodine', unit: 'mcg', rda: 150, kind: 'reach', group: 'mineral', colorKey: 'violet', warning: 'iodine depends heavily on iodized salt and seafood/seaweed intake. Low intake can affect thyroid function.', precision: 0, commonlyLow: true },
  { key: 'phosphorus', label: 'phosphorus', unit: 'mg', rda: 700, kind: 'reach', group: 'mineral', colorKey: 'orange', warning: 'phosphorus is usually covered by protein foods, dairy, legumes, nuts, and grains.', precision: 0 },
  { key: 'copper', label: 'copper', unit: 'mg', rda: 0.9, kind: 'reach', group: 'mineral', colorKey: 'pink', warning: 'copper comes from nuts, seeds, legumes, shellfish, cocoa, and whole grains.', precision: 1 },
  { key: 'manganese', label: 'manganese', unit: 'mg', rda: 2.3, kind: 'reach', group: 'mineral', colorKey: 'pop', warning: 'manganese is common in whole grains, nuts, tea, legumes, and leafy vegetables.', precision: 1 },

  { key: 'vitaminA', label: 'vitamin a', unit: 'mcg', rda: 900, kind: 'reach', group: 'vitamin', colorKey: 'orange', warning: 'Vitamin A comes from liver, dairy, eggs, and orange/dark-green plants as carotenoids.', precision: 0 },
  { key: 'vitaminC', label: 'vitamin c', unit: 'mg', rda: 90, kind: 'reach', group: 'vitamin', colorKey: 'persimmon', warning: 'Vitamin C is easiest from citrus, guava, berries, peppers, broccoli, and potatoes.', precision: 0 },
  { key: 'vitaminD', label: 'vitamin d', unit: 'IU', rda: 600, kind: 'reach', group: 'vitamin', colorKey: 'orange', warning: 'vitamin D deficiency is widespread. Fatty fish, egg yolks, fortified foods, and D3 can help.', precision: 0, commonlyLow: true },
  { key: 'vitaminE', label: 'vitamin e', unit: 'mg', rda: 15, kind: 'reach', group: 'vitamin', colorKey: 'pink', warning: 'Vitamin E tracks with nuts, seeds, vegetable oils, avocado, and leafy greens.', precision: 1 },
  { key: 'vitaminK', label: 'vitamin k', unit: 'mcg', rda: 120, kind: 'reach', group: 'vitamin', colorKey: 'teal', warning: 'Vitamin K is dense in leafy greens and some fermented foods.', precision: 0 },
  { key: 'thiamin', label: 'thiamin (b1)', unit: 'mg', rda: 1.2, kind: 'reach', group: 'vitamin', colorKey: 'blue', warning: 'B1 comes from pork, legumes, whole grains, seeds, and fortified grains.', precision: 1 },
  { key: 'riboflavin', label: 'riboflavin (b2)', unit: 'mg', rda: 1.3, kind: 'reach', group: 'vitamin', colorKey: 'violet', warning: 'B2 is found in dairy, eggs, lean meats, almonds, mushrooms, and fortified foods.', precision: 1 },
  { key: 'niacin', label: 'niacin (b3)', unit: 'mg', rda: 16, kind: 'reach', group: 'vitamin', colorKey: 'pop', warning: 'B3 comes from poultry, fish, peanuts, legumes, and fortified grains.', precision: 0 },
  { key: 'vitaminB6', label: 'vitamin b6', unit: 'mg', rda: 1.7, kind: 'reach', group: 'vitamin', colorKey: 'blue', warning: 'B6 is common in poultry, fish, potatoes, chickpeas, bananas, and fortified foods.', precision: 1 },
  { key: 'folate', label: 'folate (b9)', unit: 'mcg', rda: 400, kind: 'reach', group: 'vitamin', colorKey: 'teal', warning: 'Folate is dense in leafy greens, beans, lentils, citrus, and fortified grains.', precision: 0, commonlyLow: true },
  { key: 'vitaminB12', label: 'vitamin b12', unit: 'mcg', rda: 2.4, kind: 'reach', group: 'vitamin', colorKey: 'violet', warning: 'B12 is mostly animal-sourced. Vegans and many vegetarians should supplement or use fortified foods.', precision: 1, commonlyLow: true },

  { key: 'omega3', label: 'omega-3', unit: 'g', rda: 1.6, kind: 'reach', group: 'fatty_acid', colorKey: 'blue', warning: 'Omega-3 intake is easiest from fatty fish; flax, chia, walnuts, or algae oil help plant-based diets.', precision: 1, commonlyLow: true },
];

export const MICRO_KEYS = MICRONUTRIENTS.map((m) => m.key);

export type MicroMap = Record<string, number>;

export function createZeroMicros(): MicroMap {
  return Object.fromEntries(MICRO_KEYS.map((key) => [key, 0]));
}

export const ZERO_MICROS: MicroMap = createZeroMicros();

export function normalizeMicros(input?: Record<string, number> | null): MicroMap {
  const out = createZeroMicros();
  if (!input) return out;
  for (const key of MICRO_KEYS) out[key] = Number.isFinite(input[key]) ? input[key] : 0;
  return out;
}

export function sumMicros(maps: Array<Record<string, number> | undefined | null>): MicroMap {
  const out = createZeroMicros();
  for (const map of maps) {
    if (!map) continue;
    for (const key of MICRO_KEYS) out[key] += Number.isFinite(map[key]) ? map[key] : 0;
  }
  return out;
}

export function scaleMicros(per100g: Record<string, number> | undefined, grams: number): MicroMap {
  const f = grams / 100;
  const out = createZeroMicros();
  for (const def of MICRONUTRIENTS) {
    const raw = (per100g?.[def.key] ?? 0) * f;
    const pow = Math.pow(10, def.precision);
    out[def.key] = Math.round(raw * pow) / pow;
  }
  return out;
}

export function legacyMicrosFrom(raw: Record<string, unknown>): MicroMap {
  const direct = raw.micros;
  if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
    return normalizeMicros(direct as Record<string, number>);
  }
  const out = createZeroMicros();
  out.iron = numberFrom(raw.ironMg ?? raw.totalIronMg ?? raw.ironMgPer100g);
  out.calcium = numberFrom(raw.calciumMg ?? raw.totalCalciumMg ?? raw.calciumMgPer100g);
  out.vitaminB12 = numberFrom(raw.b12Mcg ?? raw.totalB12Mcg ?? raw.b12McgPer100g);
  out.vitaminD = numberFrom(raw.vitaminDIu ?? raw.totalVitaminDIu ?? raw.vitaminDIuPer100g);
  out.zinc = numberFrom(raw.zincMg ?? raw.totalZincMg ?? raw.zincMgPer100g);
  return out;
}

function numberFrom(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
