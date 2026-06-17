import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const dbSchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'meal_logs',
      columns: [
        { name: 'date_key', type: 'string', isIndexed: true },
        { name: 'meal_type', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'ingredients', type: 'string' },        // JSON
        { name: 'oil_entry', type: 'string', isOptional: true },  // JSON
        { name: 'micros', type: 'string', isOptional: true },     // JSON
        { name: 'is_cooked', type: 'boolean' },
        { name: 'cooked_weight_grams', type: 'number', isOptional: true },
        { name: 'total_calories', type: 'number' },
        { name: 'total_protein_g', type: 'number' },
        { name: 'total_carbs_g', type: 'number' },
        { name: 'total_fat_g', type: 'number' },
        { name: 'log_method', type: 'string' },
        { name: 'logged_at', type: 'number' },          // Unix ms
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'workouts',
      columns: [
        { name: 'date', type: 'string', isIndexed: true },
        { name: 'session_name', type: 'string' },
        { name: 'exercises', type: 'string' },          // JSON
        { name: 'total_sets', type: 'number' },
        { name: 'duration_minutes', type: 'number', isOptional: true },
        { name: 'feeling_rating', type: 'number', isOptional: true },
        { name: 'energy_level', type: 'number', isOptional: true },
        { name: 'sleep_last_night', type: 'number', isOptional: true },
        { name: 'prs_achieved', type: 'string' },       // JSON
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'exercise_prs',
      columns: [
        { name: 'exercise_name', type: 'string', isIndexed: true },
        { name: 'max_weight', type: 'number', isOptional: true },
        { name: 'max_reps', type: 'number', isOptional: true },
        { name: 'estimated_1rm', type: 'number', isOptional: true },
        { name: 'achieved_at', type: 'number' },        // Unix ms
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'workout_plans',
      columns: [
        { name: 'is_active', type: 'boolean' },
        { name: 'split_name', type: 'string' },
        { name: 'source', type: 'string' },
        { name: 'plan_data', type: 'string' },          // JSON
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'sleep_entries',
      columns: [
        { name: 'date_key', type: 'string', isIndexed: true },
        { name: 'bedtime', type: 'number' },            // Unix ms
        { name: 'wake_time', type: 'number' },          // Unix ms
        { name: 'duration_min', type: 'number' },
        { name: 'quality', type: 'number', isOptional: true },
        { name: 'wake_count', type: 'number', isOptional: true },
        { name: 'source', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'hydration_days',
      columns: [
        { name: 'date_key', type: 'string', isIndexed: true },
        { name: 'water_ml', type: 'number' },
        { name: 'weight_kg', type: 'number', isOptional: true },
        { name: 'electrolytes', type: 'string', isOptional: true }, // JSON
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'cardio_logs',
      columns: [
        { name: 'date', type: 'string', isIndexed: true },
        { name: 'modality', type: 'string' },
        { name: 'minutes', type: 'number' },
        { name: 'avg_hr', type: 'number', isOptional: true },
        { name: 'calories', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'streaks',
      columns: [
        { name: 'kind', type: 'string' },
        { name: 'current', type: 'number' },
        { name: 'best', type: 'number' },
        { name: 'last_date', type: 'string', isOptional: true },
        { name: 'ring_state', type: 'string', isOptional: true }, // JSON
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'coach_messages',
      columns: [
        { name: 'role', type: 'string' },
        { name: 'text', type: 'string' },
        { name: 'parsed', type: 'string', isOptional: true },      // JSON
        { name: 'conversation_id', type: 'string', isOptional: true },
        { name: 'timestamp', type: 'number', isIndexed: true },    // Unix ms
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'custom_foods',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'calories_per_100g', type: 'number' },
        { name: 'protein_per_100g', type: 'number' },
        { name: 'carbs_per_100g', type: 'number' },
        { name: 'fat_per_100g', type: 'number' },
        { name: 'micros_per_100g', type: 'string', isOptional: true }, // JSON
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'saved_meals',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'ingredients', type: 'string' },                   // JSON
        { name: 'total_calories', type: 'number', isOptional: true },
        { name: 'total_protein_g', type: 'number', isOptional: true },
        { name: 'total_carbs_g', type: 'number', isOptional: true },
        { name: 'total_fat_g', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
