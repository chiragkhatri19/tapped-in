export type DietType = 'veg' | 'non_veg' | 'eggetarian';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
export type CookingMethod = 'air_fryer' | 'stovetop' | 'oven' | 'no_cook' | 'microwave';

export interface Recipe {
  id: string;
  title: string;
  coverImage: string;
  description: string;
  dietType: DietType;
  mealType: MealType;
  cookingMethod: CookingMethod;
  prepTimeMin: number;
  servings: number;
  allergens: string[];
  ingredients: { name: string; grams: number; notes?: string }[];
  steps: string[];
  macrosPerServing: { calories: number; proteinG: number; carbsG: number; fatG: number };
  microsPerServing: { ironMg: number; calciumMg: number; b12Mcg: number; vitaminDIu: number; zincMg: number };
  aiQualityScore: number;
  aiQualityReason: string;
  upvotes: number;
  postedAt: string;
  authorLabel: string;
}

const DIET_LABELS: Record<DietType, string> = {
  veg: 'Veg',
  non_veg: 'Non-Veg',
  eggetarian: 'Eggetarian',
};

export const DIET_DOT_COLORS: Record<DietType, string> = {
  veg: '#22c55e',
  non_veg: '#ef4444',
  eggetarian: '#eab308',
};

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  pre_workout: 'Pre WO',
  post_workout: 'Post WO',
};

export const METHOD_LABELS: Record<CookingMethod, string> = {
  air_fryer: 'Air Fryer',
  stovetop: 'Stovetop',
  oven: 'Oven',
  no_cook: 'No Cook',
  microwave: 'Microwave',
};

export const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: 'hot',     label: 'Hot' },
  { key: 'top',     label: 'Top' },
  { key: 'new',     label: 'New' },
  { key: 'protein', label: 'Most Protein' },
  { key: 'lowcal',  label: 'Lowest Cal' },
];

export const DIET_FILTERS: { key: DietType; label: string }[] = [
  { key: 'veg',        label: 'Veg' },
  { key: 'eggetarian', label: 'Eggetarian' },
  { key: 'non_veg',    label: 'Non-Veg' },
];

export const MEAL_FILTERS: { key: MealType; label: string }[] = [
  { key: 'breakfast',    label: 'Breakfast' },
  { key: 'lunch',        label: 'Lunch' },
  { key: 'dinner',       label: 'Dinner' },
  { key: 'snack',        label: 'Snack' },
  { key: 'pre_workout',  label: 'Pre WO' },
  { key: 'post_workout', label: 'Post WO' },
];

export const ALLERGENS = ['dairy', 'eggs', 'gluten', 'soy', 'nuts', 'fish', 'shellfish', 'sesame'] as const;

export const MICRO_TARGETS = {
  ironMg:     { daily: 8,    unit: 'mg',  label: 'Iron',    color: '#ef4444' },
  calciumMg:  { daily: 1000, unit: 'mg',  label: 'Calcium', color: '#22c55e' },
  b12Mcg:     { daily: 2.4,  unit: 'mcg', label: 'B12',     color: '#a78bfa' },
  vitaminDIu: { daily: 600,  unit: 'IU',  label: 'Vit D',   color: '#fbbf24' },
  zincMg:     { daily: 11,   unit: 'mg',  label: 'Zinc',    color: '#60a5fa' },
};

export const EVIDENCE = [
  {
    id: 'protein_minimum',
    claim: 'Recipes need ≥20g protein per serving to support muscle protein synthesis',
    shortExplanation: 'Studies show 20–40g protein per meal maximally stimulates MPS. Meals below 20g offer suboptimal anabolic response.',
    citation: 'Moore DR et al., Am J Clin Nutr 2009',
  },
  {
    id: 'oil_hidden',
    claim: 'Oil is the #1 hidden calorie source in Indian home cooking',
    shortExplanation: 'ICMR data shows Indian households use 15–20ml oil per person per meal. At 884 kcal/100g, this adds 133–177 kcal that most apps never capture.',
    citation: 'ICMR, 1998',
  },
];

export const R = {
  bg:       '#09090b',
  card:     '#18181b',
  border:   '#27272a',
  fg:       '#fafafa',
  muted:    '#a1a1aa',
  primary:  '#6366f1',
  protein:  '#f97316',
  carbs:    '#3b82f6',
  fat:      '#eab308',
  success:  '#22c55e',
  warning:  '#eab308',
  danger:   '#ef4444',
  chip:     '#27272a',
  chipText: '#fafafa',
};
