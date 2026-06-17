import { Model } from '@nozbe/watermelondb';

// ── Helper: typed raw-field accessors ──────────────────────────────────────
// WatermelonDB stores all values as string|number|boolean in SQLite.
// Without decorators we access via _getRaw / _setRaw inside write transactions.

export class Meal extends Model {
  static table = 'meal_logs';
  get dateKey(): string { return this._getRaw('date_key') as string; }
  get mealType(): string { return this._getRaw('meal_type') as string; }
  get name(): string { return this._getRaw('name') as string; }
  get ingredients(): string { return this._getRaw('ingredients') as string; }
  get oilEntry(): string | null { return (this._getRaw('oil_entry') as string) ?? null; }
  get micros(): string | null { return (this._getRaw('micros') as string) ?? null; }
  get isCooked(): boolean { return !!this._getRaw('is_cooked'); }
  get cookedWeightGrams(): number | null { return (this._getRaw('cooked_weight_grams') as number) ?? null; }
  get totalCalories(): number { return this._getRaw('total_calories') as number; }
  get totalProteinG(): number { return this._getRaw('total_protein_g') as number; }
  get totalCarbsG(): number { return this._getRaw('total_carbs_g') as number; }
  get totalFatG(): number { return this._getRaw('total_fat_g') as number; }
  get logMethod(): string { return this._getRaw('log_method') as string; }
  get loggedAt(): number { return this._getRaw('logged_at') as number; }
}

export class Workout extends Model {
  static table = 'workouts';
  get date(): string { return this._getRaw('date') as string; }
  get sessionName(): string { return this._getRaw('session_name') as string; }
  get exercises(): string { return this._getRaw('exercises') as string; }
  get totalSets(): number { return this._getRaw('total_sets') as number; }
  get durationMinutes(): number | null { return (this._getRaw('duration_minutes') as number) ?? null; }
  get feelingRating(): number | null { return (this._getRaw('feeling_rating') as number) ?? null; }
  get energyLevel(): number | null { return (this._getRaw('energy_level') as number) ?? null; }
  get prsAchieved(): string { return this._getRaw('prs_achieved') as string; }
  get notes(): string | null { return (this._getRaw('notes') as string) ?? null; }
}

export class ExercisePR extends Model {
  static table = 'exercise_prs';
  get exerciseName(): string { return this._getRaw('exercise_name') as string; }
  get maxWeight(): number | null { return (this._getRaw('max_weight') as number) ?? null; }
  get maxReps(): number | null { return (this._getRaw('max_reps') as number) ?? null; }
  get estimated1rm(): number | null { return (this._getRaw('estimated_1rm') as number) ?? null; }
  get achievedAt(): number { return this._getRaw('achieved_at') as number; }
}

export class WorkoutPlan extends Model {
  static table = 'workout_plans';
  get isActive(): boolean { return !!this._getRaw('is_active'); }
  get splitName(): string { return this._getRaw('split_name') as string; }
  get source(): string { return this._getRaw('source') as string; }
  get planData(): string { return this._getRaw('plan_data') as string; }
}

export class SleepEntry extends Model {
  static table = 'sleep_entries';
  get dateKey(): string { return this._getRaw('date_key') as string; }
  get bedtime(): number { return this._getRaw('bedtime') as number; }
  get wakeTime(): number { return this._getRaw('wake_time') as number; }
  get durationMin(): number { return this._getRaw('duration_min') as number; }
  get quality(): number | null { return (this._getRaw('quality') as number) ?? null; }
  get wakeCount(): number | null { return (this._getRaw('wake_count') as number) ?? null; }
  get source(): string { return this._getRaw('source') as string; }
  get notes(): string | null { return (this._getRaw('notes') as string) ?? null; }
}

export class HydrationDay extends Model {
  static table = 'hydration_days';
  get dateKey(): string { return this._getRaw('date_key') as string; }
  get waterMl(): number { return this._getRaw('water_ml') as number; }
  get weightKg(): number | null { return (this._getRaw('weight_kg') as number) ?? null; }
  get electrolytes(): string | null { return (this._getRaw('electrolytes') as string) ?? null; }
}

export class CardioLog extends Model {
  static table = 'cardio_logs';
  get date(): string { return this._getRaw('date') as string; }
  get modality(): string { return this._getRaw('modality') as string; }
  get minutes(): number { return this._getRaw('minutes') as number; }
  get avgHr(): number | null { return (this._getRaw('avg_hr') as number) ?? null; }
  get calories(): number | null { return (this._getRaw('calories') as number) ?? null; }
  get notes(): string | null { return (this._getRaw('notes') as string) ?? null; }
}

export class Streak extends Model {
  static table = 'streaks';
  get kind(): string { return this._getRaw('kind') as string; }
  get current(): number { return this._getRaw('current') as number; }
  get best(): number { return this._getRaw('best') as number; }
  get lastDate(): string | null { return (this._getRaw('last_date') as string) ?? null; }
  get ringState(): string | null { return (this._getRaw('ring_state') as string) ?? null; }
}

export class CoachMessage extends Model {
  static table = 'coach_messages';
  get role(): string { return this._getRaw('role') as string; }
  get text(): string { return this._getRaw('text') as string; }
  get parsed(): string | null { return (this._getRaw('parsed') as string) ?? null; }
  get conversationId(): string | null { return (this._getRaw('conversation_id') as string) ?? null; }
  get timestamp(): number { return this._getRaw('timestamp') as number; }
}

export class CustomFood extends Model {
  static table = 'custom_foods';
  get name(): string { return this._getRaw('name') as string; }
  get caloriesPer100g(): number { return this._getRaw('calories_per_100g') as number; }
  get proteinPer100g(): number { return this._getRaw('protein_per_100g') as number; }
  get carbsPer100g(): number { return this._getRaw('carbs_per_100g') as number; }
  get fatPer100g(): number { return this._getRaw('fat_per_100g') as number; }
  get microsPer100g(): string | null { return (this._getRaw('micros_per_100g') as string) ?? null; }
}

export class SavedMeal extends Model {
  static table = 'saved_meals';
  get name(): string { return this._getRaw('name') as string; }
  get ingredients(): string { return this._getRaw('ingredients') as string; }
  get totalCalories(): number | null { return (this._getRaw('total_calories') as number) ?? null; }
  get totalProteinG(): number | null { return (this._getRaw('total_protein_g') as number) ?? null; }
  get totalCarbsG(): number | null { return (this._getRaw('total_carbs_g') as number) ?? null; }
  get totalFatG(): number | null { return (this._getRaw('total_fat_g') as number) ?? null; }
}

export const ALL_MODELS = [
  Meal,
  Workout,
  ExercisePR,
  WorkoutPlan,
  SleepEntry,
  HydrationDay,
  CardioLog,
  Streak,
  CoachMessage,
  CustomFood,
  SavedMeal,
];
