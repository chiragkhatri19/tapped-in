import { MICRONUTRIENTS, createZeroMicros, type MicroMap } from '@/data/micronutrients';

export interface SupplementDef {
  id: string;
  label: string;
  provides: MicroMap;
}

function provides(values: Partial<Record<string, number>>): MicroMap {
  const out = createZeroMicros();
  for (const [key, value] of Object.entries(values)) out[key] = value ?? 0;
  return out;
}

export const SUPPLEMENTS: SupplementDef[] = [
  { id: 'vitamin_d3_2000', label: 'Vitamin D3 (2000 IU)', provides: provides({ vitaminD: 2000 }) },
  { id: 'omega3_fish_oil', label: 'Omega-3 fish oil', provides: provides({ omega3: 1 }) },
  { id: 'magnesium_glycinate', label: 'Magnesium (200mg)', provides: provides({ magnesium: 200 }) },
  { id: 'b12_1000', label: 'Vitamin B12 (1000mcg)', provides: provides({ vitaminB12: 1000 }) },
  { id: 'zinc_15', label: 'Zinc (15mg)', provides: provides({ zinc: 15 }) },
  { id: 'iron_18', label: 'Iron (18mg)', provides: provides({ iron: 18 }) },
  { id: 'calcium_500', label: 'Calcium (500mg)', provides: provides({ calcium: 500 }) },
  { id: 'iodine_150', label: 'Iodine (150mcg)', provides: provides({ iodine: 150 }) },
  {
    id: 'multivitamin',
    label: 'Multivitamin',
    provides: provides({
      vitaminA: 900, vitaminC: 90, vitaminD: 600, vitaminE: 15, vitaminK: 120,
      thiamin: 1.2, riboflavin: 1.3, niacin: 16, vitaminB6: 1.7, folate: 400, vitaminB12: 2.4,
      zinc: 11, selenium: 55, iodine: 150, copper: 0.9, manganese: 2.3,
    }),
  },
];

export function findSupplement(id: string): SupplementDef | undefined {
  return SUPPLEMENTS.find((s) => s.id === id);
}

export function sumSupplementMicros(ids: string[]): MicroMap {
  const out = createZeroMicros();
  for (const id of ids) {
    const def = findSupplement(id);
    if (!def) continue;
    for (const key of Object.keys(out)) out[key] += def.provides[key] ?? 0;
  }
  return out;
}

export function suggestSupplementsForGaps(micros: MicroMap, limit = 3): SupplementDef[] {
  const lowKeys = MICRONUTRIENTS
    .filter((m) => m.commonlyLow && m.kind === 'reach' && (micros[m.key] ?? 0) / m.rda < 0.6)
    .map((m) => m.key);
  if (lowKeys.length === 0) return [];
  return SUPPLEMENTS
    .filter((s) => lowKeys.some((key) => (s.provides[key] ?? 0) > 0))
    .slice(0, limit);
}
