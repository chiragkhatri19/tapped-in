/**
 * Inline meal confirmation card shown inside a coach message when the AI
 * proposes a log_meal or log_meals_batch action.
 *
 * Tapping "Review & Log" → builds the ReviewMeal draft, stores it in
 * coach-store, and navigates to the /meal-review screen.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { useCoachStore } from '@/stores/coach-store';
import { parsedMealsToReview } from '@/lib/coach/meal-draft';
import { ingMacros } from '@/lib/meal-builder';
import { MEAL_TYPE_LABELS } from '@/data/tracker-types';
import type { LogMealAction, LogMealsBatchAction, ParsedMeal } from '@/lib/coach/actions';
import { useState } from 'react';

type MealAction = LogMealAction | LogMealsBatchAction;

function mealList(action: MealAction): ParsedMeal[] {
  return action.kind === 'log_meal' ? [action.meal] : action.meals;
}

interface Props {
  action: MealAction;
}

export default function CoachMealCard({ action }: Props) {
  const colors = useColors();
  const router = useRouter();
  const setPending = useCoachStore(s => s.setPendingMealReview);
  const [loading, setLoading] = useState(false);

  const meals = mealList(action);

  // Quick macro preview — model macros, before DB matching
  const preview = meals.map(m => {
    const totals = m.items.reduce(
      (acc, item) => {
        const f = item.estimatedWeightGrams / 100;
        return {
          kcal: acc.kcal + Math.round(f * item.caloriesPer100g),
          p:    acc.p    + Math.round(f * item.proteinPer100g * 10) / 10,
        };
      },
      { kcal: 0, p: 0 }
    );
    return { name: m.mealName, mealType: m.mealType, items: m.items.length, ...totals };
  });

  const totalKcal = preview.reduce((s, m) => s + m.kcal, 0);
  const totalProt = Math.round(preview.reduce((s, m) => s + m.p, 0) * 10) / 10;

  const handleReview = useCallback(() => {
    setLoading(true);
    // DB matching happens synchronously inside parsedMealsToReview
    const reviewMeals = parsedMealsToReview(meals);
    setPending(reviewMeals);
    setLoading(false);
    router.push('/meal-review');
  }, [meals, setPending, router]);

  return (
    <View style={[s.card, { borderColor: colors.foreground, backgroundColor: colors.background }]}>
      {/* Meal list */}
      {preview.map((m, i) => (
        <View key={i} style={s.mealRow}>
          <View style={[s.mealDot, { backgroundColor: colors.teal }]} />
          <View style={{ flex: 1 }}>
            <Text style={[s.mealName, { color: colors.foreground }]} numberOfLines={1}>
              {m.name}
            </Text>
            <Text style={[s.mealMeta, { color: colors.mutedForeground }]}>
              {MEAL_TYPE_LABELS[m.mealType as keyof typeof MEAL_TYPE_LABELS] ?? m.mealType}
              {' · '}{m.items} item{m.items !== 1 ? 's' : ''}
            </Text>
          </View>
          <Text style={[s.mealKcal, { color: colors.foreground }]}>
            {m.kcal} kcal
          </Text>
        </View>
      ))}

      {/* Totals row */}
      <View style={[s.totalsRow, { borderTopColor: colors.foreground }]}>
        <Text style={[s.totalLabel, { color: colors.mutedForeground }]}>total</Text>
        <Text style={[s.totalVal, { color: colors.foreground }]}>
          {totalKcal} kcal · P: {totalProt}g
        </Text>
      </View>

      {/* Action button */}
      <Pressable
        onPress={handleReview}
        disabled={loading}
        style={({ pressed }) => [
          s.btn,
          {
            backgroundColor: pressed ? colors.teal : colors.card,
            borderColor:     colors.foreground,
            transform:       pressed ? [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }] : [],
          },
        ]}
      >
        {loading
          ? <ActivityIndicator size="small" color={colors.foreground} />
          : (
            <>
              <Feather name="edit-3" size={13} color={colors.foreground} />
              <Text style={[s.btnTxt, { color: colors.foreground }]}>
                review & log{meals.length > 1 ? ` (${meals.length} meals)` : ''}
              </Text>
              <Feather name="arrow-right" size={13} color={colors.mutedForeground} />
            </>
          )}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderWidth: BRUTAL.border,
    borderRadius: BRUTAL.radius,
    padding: 12,
    gap: 8,
    marginTop: 6,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mealDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mealName: {
    fontFamily: F.bodyMed,
    fontSize: 13,
  },
  mealMeta: {
    fontFamily: F.bodyReg,
    fontSize: 11,
    marginTop: 1,
  },
  mealKcal: {
    fontFamily: F.monoMed,
    fontSize: 12,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 2,
  },
  totalLabel: {
    fontFamily: F.mono,
    fontSize: 11,
  },
  totalVal: {
    fontFamily: F.monoMed,
    fontSize: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: BRUTAL.border,
    borderRadius: BRUTAL.radius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: BRUTAL.shadowSm, height: BRUTAL.shadowSm },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: BRUTAL.shadowSm,
  },
  btnTxt: {
    fontFamily: F.bodyMed,
    fontSize: 13,
    flex: 1,
  },
});
