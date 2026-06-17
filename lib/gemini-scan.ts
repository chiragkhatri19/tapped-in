/**
 * Gemini Vision meal scan — shared by log-meal (future: trainer chat).
 * Oil/ghee must NOT appear in ingredients; surface in notes/oilWarning only.
 *
 * Routes through backend when a Supabase session exists (Gemini key stays
 * server-side). Falls back to direct API call for dev / pre-auth only.
 */

import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';

export interface GeminiScanIngredient {
  name: string;
  nameHindi?: string | null;
  estimatedWeightGrams: number;
  weightState?: 'raw' | 'cooked';
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export interface GeminiScanResult {
  dishName: string;
  confidence: 'high' | 'medium' | 'low';
  ingredients: GeminiScanIngredient[];
  oilWarning: boolean;
  notes: string;
}

class GeminiScanError extends Error {
  constructor(
    message: string,
    readonly code: 'missing_api_key' | 'api_error' | 'parse_error'
  ) {
    super(message);
    this.name = 'GeminiScanError';
  }
}

export async function scanMealImage(base64: string, isCooked = false): Promise<GeminiScanResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new GeminiScanError(
      'Sign in to use AI scan, or add manually.',
      'missing_api_key'
    );
  }

  try {
    const result = await apiClient.scanMeal(session.access_token, {
      imageBase64: base64,
      mimeType: 'image/jpeg',
      isCooked,
    }) as GeminiScanResult;
    return result;
  } catch (err) {
    if (err instanceof GeminiScanError) throw err;
    throw new GeminiScanError(
      'Scan failed. Try manual entry or retake the photo.',
      'api_error'
    );
  }
}
