/**
 * Gemini responseSchema for the coach — shared between mobile (lib/coach/client.ts)
 * and backend (backend/src/routes/coach.ts) so both parse identically.
 */
export const COACH_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  required: ['message', 'isOffTopic'],
  properties: {
    message:      { type: 'STRING' },
    isOffTopic:   { type: 'BOOLEAN' },
    followUpSuggestions: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
    citations: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          claim:   { type: 'STRING' },
          authors: { type: 'STRING' },
          year:    { type: 'INTEGER' },
          journal: { type: 'STRING' },
          doi:     { type: 'STRING' },
        },
      },
    },
    userTranscript: { type: 'STRING' },
    verdict: {
      type: 'OBJECT',
      properties: {
        rating: { type: 'STRING' },
        claim:  { type: 'STRING' },
      },
    },
    actions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        required: ['kind', 'label'],
        properties: {
          kind:  { type: 'STRING' },
          label: { type: 'STRING' },
          route: { type: 'STRING' },
          meal: {
            type: 'OBJECT',
            properties: {
              mealName: { type: 'STRING' },
              mealType: { type: 'STRING' },
              isCooked: { type: 'BOOLEAN' },
              oilHint: {
                type: 'OBJECT',
                properties: {
                  likely:         { type: 'BOOLEAN' },
                  oilType:        { type: 'STRING' },
                  estimatedGrams: { type: 'NUMBER' },
                },
              },
              items: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  required: ['name', 'estimatedWeightGrams', 'caloriesPer100g', 'proteinPer100g', 'carbsPer100g', 'fatPer100g'],
                  properties: {
                    name:                 { type: 'STRING' },
                    estimatedWeightGrams: { type: 'NUMBER' },
                    cookingState:         { type: 'STRING' },
                    caloriesPer100g:      { type: 'NUMBER' },
                    proteinPer100g:       { type: 'NUMBER' },
                    carbsPer100g:         { type: 'NUMBER' },
                    fatPer100g:           { type: 'NUMBER' },
                  },
                },
              },
            },
          },
          meals: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                mealName: { type: 'STRING' },
                mealType: { type: 'STRING' },
                isCooked: { type: 'BOOLEAN' },
                oilHint: {
                  type: 'OBJECT',
                  properties: {
                    likely:         { type: 'BOOLEAN' },
                    oilType:        { type: 'STRING' },
                    estimatedGrams: { type: 'NUMBER' },
                  },
                },
                items: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      name:                 { type: 'STRING' },
                      estimatedWeightGrams: { type: 'NUMBER' },
                      cookingState:         { type: 'STRING' },
                      caloriesPer100g:      { type: 'NUMBER' },
                      proteinPer100g:       { type: 'NUMBER' },
                      carbsPer100g:         { type: 'NUMBER' },
                      fatPer100g:           { type: 'NUMBER' },
                    },
                  },
                },
              },
            },
          },
          inputs: {
            type: 'OBJECT',
            properties: {
              daysPerWeek:       { type: 'INTEGER' },
              sessionMinutes:    { type: 'INTEGER' },
              weakMuscles:       { type: 'ARRAY', items: { type: 'STRING' } },
              favouriteMuscles:  { type: 'ARRAY', items: { type: 'STRING' } },
              healthConditions:  { type: 'ARRAY', items: { type: 'STRING' } },
            },
          },
          sessionName:   { type: 'STRING' },
          planId:        { type: 'STRING' },
          op:            { type: 'STRING' },
          target:        { type: 'STRING' },
          id:            { type: 'STRING' },
          exerciseName:  { type: 'STRING' },
          text:          { type: 'STRING' },
          patch: {
            type: 'OBJECT',
            properties: {
              weightKg:            { type: 'NUMBER' },
              goalMode:            { type: 'STRING' },
              age:                 { type: 'INTEGER' },
              heightCm:            { type: 'NUMBER' },
              trainingDaysPerWeek: { type: 'INTEGER' },
              dailySteps:          { type: 'INTEGER' },
            },
          },
          warningMessage: { type: 'STRING' },
          logType: { type: 'STRING' },
          value:   { type: 'NUMBER' },
          unit:    { type: 'STRING' },
        },
      },
    },
  },
} as const;
