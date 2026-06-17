import type { UserProfile } from '@/types';

// IOM/EFSA Adequate Intake floors and ceilings for *drinking* water
// (after ~20% food-water credit is applied)
// Sources: IOM DRI 2004; EFSA Journal 2010;8(3):1459
const HYDRATION_FLOOR_ML: Record<'male' | 'female', number> = {
  male: 2000,
  female: 1600,
};
const HYDRATION_CEILING_ML: Record<'male' | 'female', number> = {
  male: 3700,
  female: 2700,
};

export interface HydrationTarget {
  targetDrinkMl: number;
  baseMl: number;
  activityMl: number;
  heatMl: number;
  foodCreditMl: number;
}

export interface ElectrolyteTargets {
  sodiumMg: number;
  potassiumMg: number;
  magnesiumMg: number;
}

interface HydrationContext {
  trainingHoursToday?: number;
  hotClimate?: boolean;
}

/**
 * Computes the daily drinking-water target from the IOM/EFSA weight-scaled formula.
 *
 * Formula:
 *   baseMl      = weightKg × 32          (mid of 30–35 mL/kg, EFSA 2010)
 *   activityMl  = trainingHoursToday × 600   (DGE Sports Nutrition 2020)
 *   heatMl      = hotClimate ? 500 : 0
 *   foodCredit  = baseMl × 0.20          (~20% water from food, EFSA 2010)
 *   target      = clamp(baseMl + activityMl + heatMl − foodCredit, floor, ceiling)
 */
export function computeHydrationTarget(
  profile: Pick<UserProfile, 'weightKg' | 'sex'>,
  context: HydrationContext = {}
): HydrationTarget {
  const { trainingHoursToday = 0, hotClimate = false } = context;

  const baseMl = profile.weightKg * 32;
  const activityMl = trainingHoursToday * 600;
  const heatMl = hotClimate ? 500 : 0;
  const foodCreditMl = baseMl * 0.2;

  const raw = baseMl + activityMl + heatMl - foodCreditMl;

  const floor = HYDRATION_FLOOR_ML[profile.sex];
  const ceiling = HYDRATION_CEILING_ML[profile.sex];

  const targetDrinkMl = Math.round(Math.min(Math.max(raw, floor), ceiling));

  return {
    targetDrinkMl,
    baseMl: Math.round(baseMl),
    activityMl: Math.round(activityMl),
    heatMl,
    foodCreditMl: Math.round(foodCreditMl),
  };
}

/** Convert millilitres to glasses (fractional). */
export function mlToGlasses(ml: number, glassSizeMl = 250): number {
  return ml / glassSizeMl;
}

/** Convert glasses to millilitres. */
export function glassesToMl(glasses: number, glassSizeMl = 250): number {
  return glasses * glassSizeMl;
}

/**
 * Daily electrolyte targets derived from NAM/IOM Dietary Reference Intakes.
 * Sodium AI: 1500 mg (NAM 2019)
 * Potassium AI: 3400 mg men / 2600 mg women (NAM 2019)
 * Magnesium RDA: ~410 mg men / ~315 mg women (NAM 1997 midpoints)
 */
export function computeElectrolyteTargets(
  profile: Pick<UserProfile, 'sex'>
): ElectrolyteTargets {
  return {
    sodiumMg: 1500,
    potassiumMg: profile.sex === 'male' ? 3400 : 2600,
    magnesiumMg: profile.sex === 'male' ? 410 : 315,
  };
}
