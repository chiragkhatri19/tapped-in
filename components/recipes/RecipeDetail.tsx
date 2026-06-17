import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { Recipe } from './types';
import {
  R, DIET_DOT_COLORS, METHOD_LABELS, MICRO_TARGETS, EVIDENCE,
} from './types';
import { toggleVote, toggleSave, saveVotes, saveSaved, hasOil } from './helpers';
import { useTrackerStore, getTodayKey } from '@/stores/tracker-store';
import { createZeroMicros } from '@/data/micronutrients';
import type { LoggedMeal, MealType } from '@/data/tracker-types';

interface Props {
  recipe: Recipe;
  votes: Record<string, 'up' | null>;
  saved: string[];
  setVotes: (v: Record<string, 'up' | null>) => void;
  setSaved: (s: string[]) => void;
  onBack: () => void;
}

const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast',    label: 'Breakfast' },
  { value: 'lunch',        label: 'Lunch' },
  { value: 'dinner',       label: 'Dinner' },
  { value: 'snack',        label: 'Snack' },
  { value: 'pre_workout',  label: 'Pre-WO' },
  { value: 'post_workout', label: 'Post-WO' },
];

export default function RecipeDetail({ recipe, votes, saved, setVotes, setSaved, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const addMeal = useTrackerStore(s => s.addMeal);

  const [servings, setServings] = useState(recipe.servings);
  const ratio = servings / recipe.servings;

  const [expandProof, setExpandProof] = useState(false);
  const [expandOil, setExpandOil] = useState(false);
  const [showMealTypePicker, setShowMealTypePicker] = useState(false);
  const [logged, setLogged] = useState(false);

  const isVoted = votes[recipe.id] === 'up';
  const isSaved = saved.includes(recipe.id);
  const displayCount = recipe.upvotes + (isVoted ? 1 : 0);

  function handleVote() {
    const next = toggleVote(recipe.id, votes);
    setVotes(next);
    saveVotes(next);
  }
  function handleSave() {
    const next = toggleSave(recipe.id, saved);
    setSaved(next);
    saveSaved(next);
  }

  function handleLogToday(mealType: MealType) {
    const scaledMacro = (v: number) => Math.round(v * ratio);
    const meal: LoggedMeal = {
      id: `recipe-${recipe.id}-${Date.now()}`,
      name: `${recipe.title}${servings !== recipe.servings ? ` (×${servings})` : ''}`,
      mealType,
      ingredients: recipe.ingredients.map(ing => ({
        foodId: ing.name.toLowerCase().replace(/\s+/g, '_'),
        name: ing.name,
        weightGrams: Math.round(ing.grams * ratio),
        cookingState: 'cooked' as const,
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        micros: createZeroMicros(),
      })),
      loggedAt: new Date().toISOString(),
      dateKey: getTodayKey(),
      isCooked: true,
      totalCalories: scaledMacro(recipe.macrosPerServing.calories),
      totalProteinG: scaledMacro(recipe.macrosPerServing.proteinG),
      totalCarbsG:   scaledMacro(recipe.macrosPerServing.carbsG),
      totalFatG:     scaledMacro(recipe.macrosPerServing.fatG),
      micros: createZeroMicros(),
      logMethod: 'manual',
    };
    addMeal(meal);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowMealTypePicker(false);
    setLogged(true);
  }

  function scaleMacro(val: number) { return Math.round(val * ratio); }
  function scaleMicro(val: number) { return Math.round(val * ratio * 10) / 10; }

  const macros = {
    calories: scaleMacro(recipe.macrosPerServing.calories),
    proteinG: scaleMacro(recipe.macrosPerServing.proteinG),
    carbsG:   scaleMacro(recipe.macrosPerServing.carbsG),
    fatG:     scaleMacro(recipe.macrosPerServing.fatG),
  };
  const micros = {
    ironMg:     scaleMicro(recipe.microsPerServing.ironMg),
    calciumMg:  scaleMicro(recipe.microsPerServing.calciumMg),
    b12Mcg:     scaleMicro(recipe.microsPerServing.b12Mcg),
    vitaminDIu: scaleMicro(recipe.microsPerServing.vitaminDIu),
    zincMg:     scaleMicro(recipe.microsPerServing.zincMg),
  };

  const showOilNote = hasOil(recipe.ingredients);
  const proteinEvidence = EVIDENCE[0];
  const oilEvidence = EVIDENCE[1];

  return (
    <View style={[s.root, { backgroundColor: R.bg }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back header */}
        <View style={[s.backRow, { paddingTop: topPad + 4 }]}>
          <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={R.fg} />
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* Cover image */}
        <View style={s.imageWrap}>
          <Image source={{ uri: recipe.coverImage }} style={s.image} contentFit="cover" />
          <View style={s.scoreBadge}>
            <Ionicons name="star" size={10} color="#fff" />
            <Text style={s.scoreText}>{recipe.aiQualityScore}/10</Text>
          </View>
        </View>

        <View style={s.body}>
          {/* Title + meta */}
          <View style={s.titleRow}>
            <View style={[s.dietDot, { backgroundColor: DIET_DOT_COLORS[recipe.dietType] }]} />
            <Text style={s.title}>{recipe.title}</Text>
          </View>
          <Text style={s.meta}>{recipe.authorLabel} · {recipe.prepTimeMin} min · {METHOD_LABELS[recipe.cookingMethod]}</Text>

          {/* Macro card */}
          <View style={s.macroCard}>
            <Text style={s.cardLabel}>Nutrition per serving</Text>
            <View style={s.macroGrid}>
              <MacroCell label="Calories" value={macros.calories.toString()} unit="kcal" color={R.primary} />
              <MacroCell label="Protein"  value={macros.proteinG.toString()}  unit="g"    color={R.protein} />
              <MacroCell label="Carbs"    value={macros.carbsG.toString()}    unit="g"    color={R.carbs} />
              <MacroCell label="Fat"      value={macros.fatG.toString()}      unit="g"    color={R.fat} />
            </View>
          </View>

          {/* Micro grid */}
          <View style={s.microCard}>
            {(Object.entries(MICRO_TARGETS) as [keyof typeof MICRO_TARGETS, typeof MICRO_TARGETS[keyof typeof MICRO_TARGETS]][]).map(([key, t]) => {
              const val = micros[key];
              const pct = val / t.daily;
              const hit = pct >= 0.3 && val > 0;
              const zero = val === 0;
              return (
                <View key={key} style={s.microCell}>
                  <View style={[s.microDot, { backgroundColor: t.color }]} />
                  <Text style={s.microLabel}>{t.label}</Text>
                  <Text style={[s.microVal, { color: t.color }]}>
                    {zero ? '–' : `${val}${t.unit}`}
                  </Text>
                  {hit && <Text style={s.microStar}>✓</Text>}
                </View>
              );
            })}
          </View>

          {/* AI Quality Score */}
          <View style={s.aiCard}>
            <View style={s.aiHeader}>
              <Ionicons name="sparkles" size={14} color={R.primary} />
              <Text style={s.aiTitle}>AI Quality Score: {recipe.aiQualityScore}/10</Text>
            </View>
            <Text style={s.aiReason}>{recipe.aiQualityReason}</Text>
            <TouchableOpacity style={s.accordionBtn} onPress={() => setExpandProof(p => !p)} activeOpacity={0.7}>
              <Ionicons name="book-outline" size={14} color={R.primary} />
              <Text style={s.accordionBtnText}>Why protein gates exist</Text>
              <Ionicons name={expandProof ? 'chevron-up' : 'chevron-down'} size={14} color={R.muted} />
            </TouchableOpacity>
            {expandProof && (
              <View style={s.evidenceCard}>
                <Text style={s.evidenceClaim}>{proteinEvidence.claim}</Text>
                <Text style={s.evidenceBody}>{proteinEvidence.shortExplanation}</Text>
                <Text style={s.evidenceCitation}>{proteinEvidence.citation}</Text>
              </View>
            )}
          </View>

          {/* Allergens */}
          {recipe.allergens.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Allergens</Text>
              <View style={s.allergenRow}>
                {recipe.allergens.map(a => (
                  <View key={a} style={s.allergenChip}>
                    <Text style={s.allergenText}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Ingredients with serving adjuster */}
          <View style={s.section}>
            <View style={s.ingrHeader}>
              <Text style={s.sectionTitle}>Ingredients</Text>
              <View style={s.servingAdj}>
                <TouchableOpacity
                  style={s.adjBtn}
                  onPress={() => setServings(s => Math.max(1, s - 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={16} color={R.fg} />
                </TouchableOpacity>
                <Text style={s.servingVal}>{servings}</Text>
                <TouchableOpacity
                  style={s.adjBtn}
                  onPress={() => setServings(s => s + 1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color={R.fg} />
                </TouchableOpacity>
              </View>
            </View>
            {recipe.ingredients.map((ing, i) => (
              <View key={i} style={s.ingRow}>
                <Text style={s.ingName}>{ing.name}{ing.notes ? ` (${ing.notes})` : ''}</Text>
                <Text style={s.ingGrams}>{Math.round(ing.grams * ratio)}g</Text>
              </View>
            ))}
          </View>

          {/* Oil note */}
          {showOilNote && (
            <View style={s.oilCard}>
              <View style={s.oilHeader}>
                <View style={[s.oilDot, { backgroundColor: R.protein }]} />
                <Text style={s.oilTitle}>Oil note</Text>
              </View>
              <Text style={s.oilBody}>
                Oil adds hidden calories in Indian cooking. The oil in this recipe is already included in the macros above. fr.
              </Text>
              <TouchableOpacity style={s.accordionBtn} onPress={() => setExpandOil(p => !p)} activeOpacity={0.7}>
                <Ionicons name="book-outline" size={14} color={R.protein} />
                <Text style={[s.accordionBtnText, { color: R.protein }]}>Why we track oil</Text>
                <Ionicons name={expandOil ? 'chevron-up' : 'chevron-down'} size={14} color={R.muted} />
              </TouchableOpacity>
              {expandOil && (
                <View style={s.evidenceCard}>
                  <Text style={s.evidenceClaim}>{oilEvidence.claim}</Text>
                  <Text style={s.evidenceBody}>{oilEvidence.shortExplanation}</Text>
                  <Text style={s.evidenceCitation}>{oilEvidence.citation}</Text>
                </View>
              )}
            </View>
          )}

          {/* Steps */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Instructions</Text>
            {recipe.steps.map((step, i) => (
              <View key={i} style={s.stepRow}>
                <View style={s.stepNum}>
                  <Text style={s.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={s.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={[s.bottomBar, { paddingBottom: bottomPad + 12 }]}>
        {/* Log to today — primary CTA */}
        <TouchableOpacity
          style={[s.logBtn, logged && s.logBtnDone]}
          onPress={() => { if (!logged) { Haptics.selectionAsync(); setShowMealTypePicker(true); } }}
          activeOpacity={0.8}
        >
          <Ionicons name={logged ? 'checkmark-circle' : 'add-circle-outline'} size={18} color="#fff" />
          <Text style={s.logBtnText}>{logged ? 'Logged!' : 'Log to today'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.voteBarBtn, isVoted && s.voteBarBtnActive]}
          onPress={handleVote}
          activeOpacity={0.8}
        >
          <Ionicons name={isVoted ? 'arrow-up-circle' : 'arrow-up-circle-outline'} size={18} color={isVoted ? '#fff' : R.muted} />
          <Text style={[s.voteBarText, isVoted && { color: '#fff' }]}>{displayCount.toLocaleString()}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.saveBarBtn} onPress={handleSave} activeOpacity={0.8}>
          <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={20} color={isSaved ? '#ef4444' : R.fg} />
        </TouchableOpacity>
      </View>

      {/* Meal-type picker overlay */}
      {showMealTypePicker && (
        <TouchableOpacity
          style={s.pickerBackdrop}
          activeOpacity={1}
          onPress={() => setShowMealTypePicker(false)}
        >
          <View style={[s.pickerSheet, { paddingBottom: bottomPad + 16 }]}>
            <Text style={s.pickerTitle}>Log as…</Text>
            {MEAL_TYPE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={s.pickerRow}
                onPress={() => handleLogToday(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={s.pickerRowText}>{opt.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={R.muted} />
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

function MacroCell({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <View style={s.macroCell}>
      <Text style={[s.macroCellVal, { color }]}>{value}</Text>
      <Text style={s.macroCellUnit}>{unit}</Text>
      <Text style={s.macroCellLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: R.bg },
  backRow:        { paddingHorizontal: 16, paddingBottom: 8 },
  backBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText:       { color: R.fg, fontSize: 15, fontWeight: '500' },
  imageWrap:      { position: 'relative' },
  image:          { width: '100%', height: 200 },
  scoreBadge:     { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: R.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  scoreText:      { color: '#fff', fontSize: 11, fontWeight: '700' },
  body:           { padding: 16, gap: 16 },
  titleRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dietDot:        { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  title:          { flex: 1, fontSize: 20, fontWeight: '700', color: R.fg, lineHeight: 26 },
  meta:           { fontSize: 13, color: R.muted, marginTop: -8 },
  macroCard:      { backgroundColor: R.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: R.border },
  cardLabel:      { fontSize: 11, color: R.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  macroGrid:      { flexDirection: 'row', justifyContent: 'space-between' },
  macroCell:      { alignItems: 'center', flex: 1 },
  macroCellVal:   { fontSize: 20, fontWeight: '700' },
  macroCellUnit:  { fontSize: 11, color: R.muted },
  macroCellLabel: { fontSize: 11, color: R.muted, marginTop: 2 },
  microCard:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: R.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: R.border },
  microCell:      { width: '30%', flexGrow: 1, alignItems: 'center', paddingVertical: 8, gap: 3 },
  microDot:       { width: 8, height: 8, borderRadius: 4 },
  microLabel:     { fontSize: 11, color: R.muted },
  microVal:       { fontSize: 14, fontWeight: '700' },
  microStar:      { fontSize: 11, color: '#22c55e' },
  aiCard:         { backgroundColor: R.card, borderRadius: 12, padding: 14, gap: 8, borderWidth: 1, borderColor: R.border },
  aiHeader:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiTitle:        { fontSize: 14, fontWeight: '700', color: R.fg },
  aiReason:       { fontSize: 13, color: R.muted, lineHeight: 19 },
  accordionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  accordionBtnText: { flex: 1, fontSize: 13, color: R.primary, fontWeight: '500' },
  evidenceCard:   { backgroundColor: R.bg, borderRadius: 8, padding: 12, gap: 6, borderWidth: 1, borderColor: R.border },
  evidenceClaim:  { fontSize: 13, fontWeight: '600', color: R.fg },
  evidenceBody:   { fontSize: 12, color: R.muted, lineHeight: 18 },
  evidenceCitation: { fontSize: 11, color: R.primary, fontStyle: 'italic' },
  section:        { gap: 10 },
  sectionTitle:   { fontSize: 15, fontWeight: '700', color: R.fg },
  allergenRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  allergenChip:   { backgroundColor: R.chip, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  allergenText:   { color: R.muted, fontSize: 12 },
  ingrHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  servingAdj:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: R.card, paddingHorizontal: 4, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: R.border },
  adjBtn:         { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: R.chip, borderRadius: 6 },
  servingVal:     { fontSize: 15, fontWeight: '700', color: R.fg, minWidth: 20, textAlign: 'center' },
  ingRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: R.border },
  ingName:        { flex: 1, fontSize: 14, color: R.fg },
  ingGrams:       { fontSize: 14, fontWeight: '600', color: R.muted },
  oilCard:        { backgroundColor: '#1a1000', borderRadius: 12, padding: 14, gap: 8, borderWidth: 1, borderColor: '#3a2200' },
  oilHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  oilDot:         { width: 10, height: 10, borderRadius: 5 },
  oilTitle:       { fontSize: 14, fontWeight: '700', color: R.protein },
  oilBody:        { fontSize: 13, color: R.muted, lineHeight: 19 },
  stepRow:        { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum:        { width: 24, height: 24, borderRadius: 12, backgroundColor: R.primary, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  stepNumText:    { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepText:       { flex: 1, fontSize: 14, color: R.fg, lineHeight: 20 },
  bottomBar:        { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 0, backgroundColor: R.bg, borderTopWidth: 1, borderTopColor: R.border },
  logBtn:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: R.primary, paddingVertical: 13, borderRadius: 10 },
  logBtnDone:       { backgroundColor: '#16a34a' },
  logBtnText:       { color: '#fff', fontWeight: '700', fontSize: 14 },
  voteBarBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: R.chip, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 10 },
  voteBarBtnActive: { backgroundColor: R.primary },
  voteBarText:      { color: R.muted, fontWeight: '600', fontSize: 14 },
  saveBarBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: R.chip, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 10 },
  pickerBackdrop:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickerSheet:      { backgroundColor: R.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 16, paddingHorizontal: 20, gap: 4, borderTopWidth: 1, borderTopColor: R.border },
  pickerTitle:      { fontSize: 13, fontWeight: '700', color: R.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  pickerRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: R.border },
  pickerRowText:    { fontSize: 16, fontWeight: '600', color: R.fg },
});
