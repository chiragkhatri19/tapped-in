/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView, Platform, Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { BrutalBox } from '@/components/brutal';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { useTrackerStore } from '@/stores/tracker-store';
import { useCoachStore } from '@/stores/coach-store';
import { addRecentFoodId, searchFoods } from '@/lib/food-utils';
import {
  type EditableIngredient, type ReviewMeal,
  ingMacros, foodToEditable, buildLoggedMeal, uid, getDefaultMealType,
} from '@/lib/meal-builder';
import {
  type OilEntry, type MealType,
  OIL_DATA, computeOilEntry, MEAL_TYPE_LABELS,
} from '@/data/tracker-types';
import type { FoodItem } from '@/data/foods';

// ─── Local meal state ─────────────────────────────────────────────────────────

interface MealState {
  uid: string;
  mealName: string;
  mealType: MealType;
  isCooked: boolean;
  hasOil: boolean;
  oilType: OilEntry['oilType'];
  oilGrams: string;
  ingredients: EditableIngredient[];
  // ingredient search
  searchQuery: string;
  searchResults: FoodItem[];
  collapsed: boolean;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];
const OIL_TYPES = Object.keys(OIL_DATA) as OilEntry['oilType'][];

function reviewToState(r: ReviewMeal): MealState {
  const hint = r.oilHint;
  return {
    uid:         r.uid,
    mealName:    r.mealName,
    mealType:    r.mealType,
    isCooked:    r.isCooked,
    hasOil:      hint?.likely ?? false,
    oilType:     hint?.oilType ?? 'mustard',
    oilGrams:    hint?.estimatedGrams ? String(Math.round(hint.estimatedGrams)) : '10',
    ingredients: r.ingredients,
    searchQuery:   '',
    searchResults: [],
    collapsed:   false,
  };
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MealReviewScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();

  const addMeal               = useTrackerStore(s => s.addMeal);
  const pending               = useCoachStore(s => s.pendingMealReview);
  const clearPending          = useCoachStore(s => s.clearPendingMealReview);

  const [meals, setMeals]     = useState<MealState[]>([]);
  const [logging, setLogging] = useState(false);

  const topPad    = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Load pending meals once on mount, then clear the store slot
  useEffect(() => {
    if (pending && pending.length > 0) {
      setMeals(pending.map(reviewToState));
      clearPending();
    } else {
      // No data — navigate back
      router.back();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Meal mutators ─────────────────────────────────────────────────────────

  function updateMeal(mUid: string, patch: Partial<MealState>) {
    setMeals(prev => prev.map(m => m.uid === mUid ? { ...m, ...patch } : m));
  }

  function setIngWeight(mUid: string, ingUid: string, val: string) {
    const grams = parseFloat(val);
    setMeals(prev => prev.map(m => {
      if (m.uid !== mUid) return m;
      return {
        ...m,
        ingredients: m.ingredients.map(i =>
          i.uid === ingUid
            ? { ...i, weightGrams: isNaN(grams) || grams <= 0 ? i.weightGrams : grams }
            : i
        ),
      };
    }));
  }

  function removeIngredient(mUid: string, ingUid: string) {
    setMeals(prev => prev.map(m => {
      if (m.uid !== mUid) return m;
      return { ...m, ingredients: m.ingredients.filter(i => i.uid !== ingUid) };
    }));
  }

  function addIngredient(mUid: string, food: FoodItem) {
    const editable = foodToEditable(food, food.servingGrams);
    setMeals(prev => prev.map(m => {
      if (m.uid !== mUid) return m;
      return { ...m, ingredients: [...m.ingredients, editable], searchQuery: '', searchResults: [] };
    }));
    addRecentFoodId(food.id);
  }

  function runSearch(mUid: string, query: string) {
    const results = query.trim() ? searchFoods(query, 6) : [];
    setMeals(prev => prev.map(m =>
      m.uid === mUid ? { ...m, searchQuery: query, searchResults: results } : m
    ));
  }

  // ── Totals ────────────────────────────────────────────────────────────────

  const allTotals = meals.reduce(
    (acc, m) => {
      const ingTotals = m.ingredients.reduce((s, e) => {
        const mac = ingMacros(e);
        return { kcal: s.kcal + mac.kcal, p: s.p + mac.p, c: s.c + mac.c, fat: s.fat + mac.fat };
      }, { kcal: 0, p: 0, c: 0, fat: 0 });
      const oil = (m.isCooked && m.hasOil)
        ? computeOilEntry(m.oilType, parseFloat(m.oilGrams) || 0)
        : null;
      return {
        kcal: acc.kcal + ingTotals.kcal + (oil?.calories ?? 0),
        p:    acc.p    + ingTotals.p,
        c:    acc.c    + ingTotals.c,
        fat:  acc.fat  + ingTotals.fat + (oil?.fatG ?? 0),
      };
    },
    { kcal: 0, p: 0, c: 0, fat: 0 }
  );

  // ── Log ───────────────────────────────────────────────────────────────────

  const handleLog = useCallback(async () => {
    if (logging) return;

    // Check for cooked meals with no oil decision acknowledged
    const cookedNoOil = meals.filter(m => m.isCooked && !m.hasOil);
    if (cookedNoOil.length > 0) {
      const proceed = await new Promise<boolean>(resolve =>
        Alert.alert(
          'no oil logged',
          `${cookedNoOil.length > 1 ? `${cookedNoOil.length} meals are` : '1 meal is'} home-cooked with no oil — that can be 200–400 hidden kcal. are you sure?`,
          [
            { text: 'go back & add oil', style: 'cancel', onPress: () => resolve(false) },
            { text: "yes, no oil",        onPress: () => resolve(true) },
          ]
        )
      );
      if (!proceed) return;
    }

    setLogging(true);
    try {
      for (let i = 0; i < meals.length; i++) {
        const m = meals[i];
        if (m.ingredients.length === 0) continue;
        const oilEntry = (m.isCooked && m.hasOil)
          ? computeOilEntry(m.oilType, parseFloat(m.oilGrams) || 0)
          : null;
        const review: ReviewMeal = {
          uid:         m.uid,
          mealName:    m.mealName || 'meal',
          mealType:    m.mealType,
          isCooked:    m.isCooked,
          ingredients: m.ingredients,
        };
        const logged = buildLoggedMeal(review, oilEntry);
        addMeal(logged);
        // track recently-used foods (skip AI-generated IDs)
        m.ingredients
          .filter(i => !i.foodId.startsWith('ai_'))
          .forEach(i => addRecentFoodId(i.foodId));
      }
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    } finally {
      setLogging(false);
    }
  }, [meals, logging, addMeal, router]);

  if (meals.length === 0) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 10, borderBottomColor: colors.foreground, backgroundColor: colors.background }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
          <Feather name="x" size={20} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>review meals</Text>
          <Text style={[s.headerSub, { color: colors.mutedForeground }]}>
            {meals.length} meal{meals.length !== 1 ? 's' : ''} · edit before logging
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingBottom: bottomPad + 100 }]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={80}
      >
        {meals.map((meal, mIdx) => (
          <MealCard
            key={meal.uid}
            meal={meal}
            mIdx={mIdx}
            colors={colors}
            onUpdate={patch => updateMeal(meal.uid, patch)}
            onSetWeight={(ingUid, val) => setIngWeight(meal.uid, ingUid, val)}
            onRemoveIng={ingUid => removeIngredient(meal.uid, ingUid)}
            onAddIng={food => addIngredient(meal.uid, food)}
            onSearch={q => runSearch(meal.uid, q)}
          />
        ))}
      </KeyboardAwareScrollView>

      {/* Footer */}
      <View style={[s.footer, { paddingBottom: bottomPad + 12, borderTopColor: colors.foreground, backgroundColor: colors.background }]}>
        <View style={s.footerTotals}>
          <Text style={[s.footerKcal, { color: colors.foreground }]}>{Math.round(allTotals.kcal)} kcal</Text>
          <Text style={[s.footerMacros, { color: colors.mutedForeground }]}>
            P:{Math.round(allTotals.p * 10) / 10}g  C:{Math.round(allTotals.c * 10) / 10}g  F:{Math.round(allTotals.fat * 10) / 10}g
          </Text>
        </View>
        <Pressable
          onPress={handleLog}
          disabled={logging}
          style={({ pressed }) => [
            s.logBtn,
            {
              backgroundColor: logging ? colors.muted : colors.primary,
              borderColor:     colors.foreground,
              transform:       pressed ? [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }] : [],
              opacity:         logging ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="check" size={16} color={colors.primaryForeground} />
          <Text style={[s.logBtnTxt, { color: colors.primaryForeground }]}>
            {logging ? 'logging...' : `log ${meals.length === 1 ? 'meal' : `${meals.length} meals`}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── MealCard ─────────────────────────────────────────────────────────────────

interface MealCardProps {
  meal: MealState;
  mIdx: number;
  colors: ReturnType<typeof useColors>;
  onUpdate: (patch: Partial<MealState>) => void;
  onSetWeight: (ingUid: string, val: string) => void;
  onRemoveIng: (ingUid: string) => void;
  onAddIng: (food: FoodItem) => void;
  onSearch: (q: string) => void;
}

function MealCard({ meal, mIdx, colors, onUpdate, onSetWeight, onRemoveIng, onAddIng, onSearch }: MealCardProps) {
  const ingTotals = meal.ingredients.reduce(
    (acc, e) => { const m = ingMacros(e); return { kcal: acc.kcal + m.kcal, p: acc.p + m.p }; },
    { kcal: 0, p: 0 }
  );
  const oilKcal = (meal.isCooked && meal.hasOil)
    ? computeOilEntry(meal.oilType, parseFloat(meal.oilGrams) || 0).calories
    : 0;
  const totalKcal = ingTotals.kcal + oilKcal;

  return (
    <BrutalBox style={{ marginHorizontal: 16, marginTop: mIdx === 0 ? 16 : 12 }} offset={4}>
      {/* Card header */}
      <View style={[s.cardHeader, { borderBottomColor: colors.foreground }]}>
        {/* Meal name */}
        <TextInput
          value={meal.mealName}
          onChangeText={v => onUpdate({ mealName: v })}
          style={[s.mealNameInput, { color: colors.foreground, borderColor: colors.foreground }]}
          placeholder="meal name"
          placeholderTextColor={colors.mutedForeground}
        />
        <Text style={[s.cardKcal, { color: colors.mutedForeground }]}>{totalKcal} kcal</Text>
      </View>

      {/* Meal type + cooked toggle */}
      <View style={[s.metaRow, { borderBottomColor: colors.foreground }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.typeRow}>
          {MEAL_TYPES.map(t => (
            <Pressable
              key={t}
              onPress={() => onUpdate({ mealType: t })}
              style={[
                s.typeChip,
                {
                  borderColor:     meal.mealType === t ? colors.primary : colors.foreground,
                  backgroundColor: meal.mealType === t ? colors.primary : colors.card,
                },
              ]}
            >
              <Text style={[s.typeChipTxt, { color: meal.mealType === t ? colors.primaryForeground : colors.foreground }]}>
                {MEAL_TYPE_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable
          onPress={() => onUpdate({ isCooked: !meal.isCooked })}
          style={[s.cookedToggle, { borderColor: colors.foreground, backgroundColor: meal.isCooked ? colors.violet : colors.card }]}
        >
          <Text style={[s.cookedTxt, { color: meal.isCooked ? '#fff' : colors.foreground }]}>
            {meal.isCooked ? 'home-cooked' : 'ordered'}
          </Text>
        </Pressable>
      </View>

      {/* Ingredients */}
      <View style={s.ingSection}>
        {meal.ingredients.map(ing => {
          const mac = ingMacros(ing);
          return (
            <View key={ing.uid} style={s.ingRow}>
              {ing.needsReview && (
                <Feather name="alert-circle" size={12} color={colors.orange} style={{ marginTop: 2 }} />
              )}
              <Text style={[s.ingName, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>
                {ing.name}
              </Text>
              <TextInput
                value={String(Math.round(ing.weightGrams))}
                onChangeText={v => onSetWeight(ing.uid, v)}
                keyboardType="numeric"
                style={[s.ingGrams, { color: colors.foreground, borderColor: colors.foreground }]}
                selectTextOnFocus
              />
              <Text style={[s.ingUnit, { color: colors.mutedForeground }]}>g</Text>
              <Text style={[s.ingKcal, { color: colors.mutedForeground }]}>{mac.kcal} kcal</Text>
              <Pressable onPress={() => onRemoveIng(ing.uid)} hitSlop={8}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </Pressable>
            </View>
          );
        })}

        {/* Add ingredient search */}
        <View style={[s.searchWrap, { borderColor: colors.foreground }]}>
          <Feather name="search" size={13} color={colors.mutedForeground} />
          <TextInput
            value={meal.searchQuery}
            onChangeText={q => onSearch(q)}
            placeholder="add ingredient..."
            placeholderTextColor={colors.mutedForeground}
            style={[s.searchInput, { color: colors.foreground }]}
          />
          {meal.searchQuery.length > 0 && (
            <Pressable onPress={() => onSearch('')} hitSlop={8}>
              <Feather name="x" size={13} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
        {meal.searchResults.length > 0 && (
          <View style={[s.searchResults, { borderColor: colors.foreground, backgroundColor: colors.card }]}>
            {meal.searchResults.map(food => (
              <Pressable
                key={food.id}
                onPress={() => onAddIng(food)}
                style={[s.searchResult, { borderBottomColor: colors.foreground }]}
              >
                <Text style={[s.searchResultName, { color: colors.foreground }]} numberOfLines={1}>
                  {food.name}
                </Text>
                <Text style={[s.searchResultMeta, { color: colors.mutedForeground }]}>
                  {food.caloriesPer100g} kcal/100g · {food.servingGrams}g serving
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Oil section — only for home-cooked */}
      {meal.isCooked && (
        <View style={[s.oilSection, { borderTopColor: colors.foreground }]}>
          <View style={s.oilHeader}>
            <Feather name="droplet" size={13} color="#FF3DA5" />
            <Text style={[s.oilTitle, { color: colors.foreground }]}>oil / fat</Text>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => onUpdate({ hasOil: !meal.hasOil })}
              style={[s.oilToggle, { borderColor: meal.hasOil ? '#FF3DA5' : colors.foreground, backgroundColor: meal.hasOil ? '#FF3DA5' : colors.card }]}
            >
              <Text style={[s.oilToggleTxt, { color: meal.hasOil ? '#fff' : colors.foreground }]}>
                {meal.hasOil ? 'yes, used oil' : 'no oil'}
              </Text>
            </Pressable>
          </View>
          {meal.hasOil && (
            <>
              {/* Oil type chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.oilTypeRow}>
                {OIL_TYPES.map(type => (
                  <Pressable
                    key={type}
                    onPress={() => onUpdate({ oilType: type })}
                    style={[
                      s.oilTypeChip,
                      {
                        borderColor:     meal.oilType === type ? '#FF3DA5' : colors.foreground,
                        backgroundColor: meal.oilType === type ? '#FF3DA5' : colors.card,
                      },
                    ]}
                  >
                    <Text style={[s.oilTypeChipTxt, { color: meal.oilType === type ? '#fff' : colors.foreground }]}>
                      {OIL_DATA[type].label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              {/* Grams input */}
              <View style={s.oilGramsRow}>
                <Text style={[s.oilGramsLabel, { color: colors.mutedForeground }]}>amount</Text>
                <TextInput
                  value={meal.oilGrams}
                  onChangeText={v => onUpdate({ oilGrams: v })}
                  keyboardType="numeric"
                  style={[s.oilGramsInput, { color: colors.foreground, borderColor: colors.foreground }]}
                  selectTextOnFocus
                />
                <Text style={[s.oilGramsUnit, { color: colors.mutedForeground }]}>g</Text>
                <Text style={[s.oilKcal, { color: '#FF3DA5' }]}>
                  {computeOilEntry(meal.oilType, parseFloat(meal.oilGrams) || 0).calories} kcal
                </Text>
              </View>
              <Text style={[s.oilNote, { color: colors.mutedForeground }]}>
                1 tbsp ~ 14g · pan-frying absorbs 80–95% of applied oil
              </Text>
            </>
          )}
        </View>
      )}
    </BrutalBox>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Header
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: BRUTAL.border },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: F.displayBold, fontSize: 20, fontStyle: 'italic' },
  headerSub:   { fontFamily: F.bodyReg, fontSize: 12, marginTop: 1 },

  // Scroll
  scroll: { paddingBottom: 120 },

  // Card
  cardHeader:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1 },
  mealNameInput: { fontFamily: F.bodyMed, fontSize: 15, flex: 1, borderWidth: 1, borderRadius: BRUTAL.radius, paddingHorizontal: 10, paddingVertical: 6 },
  cardKcal:      { fontFamily: F.monoMed, fontSize: 13 },

  // Meta row
  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  typeRow:  { gap: 6, flexDirection: 'row' },
  typeChip: { borderWidth: BRUTAL.borderThin, borderRadius: BRUTAL.radiusPill, paddingHorizontal: 10, paddingVertical: 5 },
  typeChipTxt: { fontFamily: F.bodyMed, fontSize: 11 },
  cookedToggle: { borderWidth: BRUTAL.borderThin, borderRadius: BRUTAL.radiusPill, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 4 },
  cookedTxt:    { fontFamily: F.bodyMed, fontSize: 11 },

  // Ingredients
  ingSection: { padding: 12, gap: 8 },
  ingRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ingName:    { fontFamily: F.bodyReg, fontSize: 13 },
  ingGrams:   { fontFamily: F.monoMed, fontSize: 13, borderWidth: 1, borderRadius: BRUTAL.radius, paddingHorizontal: 8, paddingVertical: 4, width: 56, textAlign: 'center' },
  ingUnit:    { fontFamily: F.mono, fontSize: 11 },
  ingKcal:    { fontFamily: F.mono, fontSize: 11, minWidth: 52, textAlign: 'right' },

  // Search
  searchWrap:    { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: BRUTAL.radius, paddingHorizontal: 10, paddingVertical: 8 },
  searchInput:   { fontFamily: F.bodyReg, fontSize: 13, flex: 1 },
  searchResults: { borderWidth: 1, borderRadius: BRUTAL.radius, overflow: 'hidden' },
  searchResult:  { padding: 10, borderBottomWidth: 1 },
  searchResultName: { fontFamily: F.bodyMed, fontSize: 13 },
  searchResultMeta: { fontFamily: F.mono, fontSize: 11, marginTop: 2 },

  // Oil
  oilSection:  { padding: 12, gap: 8, borderTopWidth: 1 },
  oilHeader:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  oilTitle:    { fontFamily: F.bodyMed, fontSize: 13 },
  oilToggle:   { borderWidth: BRUTAL.borderThin, borderRadius: BRUTAL.radiusPill, paddingHorizontal: 10, paddingVertical: 5 },
  oilToggleTxt:{ fontFamily: F.bodyMed, fontSize: 11 },
  oilTypeRow:  { gap: 6 },
  oilTypeChip: { borderWidth: BRUTAL.borderThin, borderRadius: BRUTAL.radiusPill, paddingHorizontal: 10, paddingVertical: 5 },
  oilTypeChipTxt: { fontFamily: F.mono, fontSize: 11 },
  oilGramsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  oilGramsLabel:{ fontFamily: F.bodyReg, fontSize: 12 },
  oilGramsInput:{ fontFamily: F.monoMed, fontSize: 14, borderWidth: 1, borderRadius: BRUTAL.radius, paddingHorizontal: 10, paddingVertical: 6, width: 70, textAlign: 'center' },
  oilGramsUnit: { fontFamily: F.mono, fontSize: 12 },
  oilKcal:     { fontFamily: F.monoMed, fontSize: 13, flex: 1, textAlign: 'right' },
  oilNote:     { fontFamily: F.bodyReg, fontSize: 11, lineHeight: 16 },

  // Footer
  footer:       { paddingHorizontal: 16, paddingTop: 14, borderTopWidth: BRUTAL.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerTotals: { flex: 1 },
  footerKcal:   { fontFamily: F.displayBold, fontSize: 22, fontStyle: 'italic' },
  footerMacros: { fontFamily: F.mono, fontSize: 11, marginTop: 2 },
  logBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius,
    paddingHorizontal: 18, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: BRUTAL.shadowSm, height: BRUTAL.shadowSm },
    shadowOpacity: 1, shadowRadius: 0, elevation: BRUTAL.shadowSm,
  },
  logBtnTxt: { fontFamily: F.bodyBold, fontSize: 15 },
});
