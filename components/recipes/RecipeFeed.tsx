import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Recipe, DietType, MealType } from './types';
import {
  R, SORT_OPTIONS, DIET_FILTERS, MEAL_FILTERS,
  DIET_DOT_COLORS, MEAL_LABELS, METHOD_LABELS,
} from './types';
import { sortRecipes, toggleVote, toggleSave, saveVotes, saveSaved, timeAgo } from './helpers';

interface Props {
  recipes: Recipe[];
  votes: Record<string, 'up' | null>;
  saved: string[];
  setVotes: (v: Record<string, 'up' | null>) => void;
  setSaved: (s: string[]) => void;
  onOpenDetail: (id: string) => void;
  onPostRecipe: () => void;
}

export default function RecipeFeed({ recipes, votes, saved, setVotes, setSaved, onOpenDetail, onPostRecipe }: Props) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [sort, setSort] = useState('hot');
  const [dietFilter, setDietFilter] = useState<DietType[]>([]);
  const [mealFilter, setMealFilter] = useState<MealType[]>([]);

  const displayed = useMemo(() => {
    let list = recipes;
    if (dietFilter.length) list = list.filter(r => dietFilter.includes(r.dietType));
    if (mealFilter.length) list = list.filter(r => mealFilter.includes(r.mealType));
    return sortRecipes(list, sort, votes);
  }, [recipes, sort, dietFilter, mealFilter, votes]);

  function toggleDiet(d: DietType) {
    setDietFilter(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }
  function toggleMeal(m: MealType) {
    setMealFilter(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }

  function handleVote(id: string) {
    const next = toggleVote(id, votes);
    setVotes(next);
    saveVotes(next);
  }
  function handleSave(id: string) {
    const next = toggleSave(id, saved);
    setSaved(next);
    saveSaved(next);
  }

  const displayVotes = (r: Recipe) => r.upvotes + (votes[r.id] === 'up' ? 1 : 0);

  return (
    <ScrollView
      style={[s.container, { paddingTop: topPad }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Recipes</Text>
          <Text style={s.subtitle}>High protein recipes with verified macros.</Text>
        </View>
        <TouchableOpacity style={s.postBtn} onPress={onPostRecipe} activeOpacity={0.8}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={s.postBtnText}>Post Recipe</Text>
        </TouchableOpacity>
      </View>

      {/* Sort chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipRow}>
        {SORT_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[s.chip, sort === opt.key && s.chipActive]}
            onPress={() => setSort(opt.key)}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, sort === opt.key && s.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Diet filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipRow}>
        {DIET_FILTERS.map(f => {
          const on = dietFilter.includes(f.key);
          return (
            <TouchableOpacity
              key={f.key}
              style={[s.chip, on && s.chipActive]}
              onPress={() => toggleDiet(f.key)}
              activeOpacity={0.7}
            >
              <View style={[s.dietDot, { backgroundColor: DIET_DOT_COLORS[f.key] }]} />
              <Text style={[s.chipText, on && s.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Meal filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipRow}>
        {MEAL_FILTERS.map(f => {
          const on = mealFilter.includes(f.key);
          return (
            <TouchableOpacity
              key={f.key}
              style={[s.chip, on && s.chipActive]}
              onPress={() => toggleMeal(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[s.chipText, on && s.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Recipe cards */}
      {displayed.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>No recipes match your filters.</Text>
        </View>
      ) : (
        displayed.map(recipe => (
          <TouchableOpacity key={recipe.id} style={s.card} onPress={() => onOpenDetail(recipe.id)} activeOpacity={0.9}>
            {/* Cover image */}
            <View style={s.imageWrap}>
              <Image source={{ uri: recipe.coverImage }} style={s.image} contentFit="cover" />
              <View style={s.scoreBadge}>
                <Ionicons name="star" size={10} color="#fff" />
                <Text style={s.scoreText}>{recipe.aiQualityScore}/10</Text>
              </View>
            </View>

            <View style={s.cardBody}>
              {/* Title row */}
              <View style={s.titleRow}>
                <View style={[s.dietDotLg, { backgroundColor: DIET_DOT_COLORS[recipe.dietType] }]} />
                <Text style={s.cardTitle} numberOfLines={2}>{recipe.title}</Text>
                <View style={s.mealChip}>
                  <Text style={s.mealChipText}>{MEAL_LABELS[recipe.mealType]}</Text>
                </View>
              </View>

              {/* Meta */}
              <Text style={s.meta}>{recipe.authorLabel} · {recipe.prepTimeMin} min · {METHOD_LABELS[recipe.cookingMethod]}</Text>

              {/* Macro row */}
              <View style={s.macroRow}>
                <MacroPill label="Cal" value={recipe.macrosPerServing.calories.toString()} color={R.primary} />
                <MacroPill label="Protein" value={`${recipe.macrosPerServing.proteinG}g`} color={R.protein} highlight />
                <MacroPill label="Carbs" value={`${recipe.macrosPerServing.carbsG}g`} color={R.carbs} />
                <MacroPill label="Fat" value={`${recipe.macrosPerServing.fatG}g`} color={R.fat} />
              </View>

              {/* Allergens */}
              {recipe.allergens.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={s.allergenRow}>
                    {recipe.allergens.map(a => (
                      <View key={a} style={s.allergenChip}>
                        <Text style={s.allergenText}>{a}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}

              {/* Actions */}
              <View style={s.actions}>
                <TouchableOpacity
                  style={[s.voteBtn, votes[recipe.id] === 'up' && s.voteBtnActive]}
                  onPress={() => handleVote(recipe.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={votes[recipe.id] === 'up' ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
                    size={18}
                    color={votes[recipe.id] === 'up' ? '#fff' : R.muted}
                  />
                  <Text style={[s.voteCount, votes[recipe.id] === 'up' && { color: '#fff' }]}>
                    {displayVotes(recipe).toLocaleString()}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleSave(recipe.id)} activeOpacity={0.7}>
                  <Ionicons
                    name={saved.includes(recipe.id) ? 'heart' : 'heart-outline'}
                    size={22}
                    color={saved.includes(recipe.id) ? '#ef4444' : R.muted}
                  />
                </TouchableOpacity>

                <Text style={s.timeAgo}>{timeAgo(recipe.postedAt)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function MacroPill({ label, value, color, highlight }: { label: string; value: string; color: string; highlight?: boolean }) {
  return (
    <View style={[s.macroPill, highlight && { backgroundColor: color + '22' }]}>
      <Text style={[s.macroVal, { color }]}>{value}</Text>
      <Text style={s.macroLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: R.bg },
  content:      { paddingHorizontal: 16 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 16 },
  title:        { fontSize: 26, fontWeight: '700', color: R.fg, letterSpacing: -0.5 },
  subtitle:     { fontSize: 13, color: R.muted, marginTop: 2 },
  postBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: R.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  postBtnText:  { color: '#fff', fontWeight: '600', fontSize: 13 },
  chipScroll:   { marginBottom: 8 },
  chipRow:      { flexDirection: 'row', gap: 8, paddingRight: 16 },
  chip:         { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: R.chip, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  chipActive:   { backgroundColor: R.primary },
  chipText:     { color: R.fg, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  dietDot:      { width: 7, height: 7, borderRadius: 4 },
  dietDotLg:    { width: 9, height: 9, borderRadius: 5, marginTop: 3 },
  empty:        { alignItems: 'center', paddingVertical: 60 },
  emptyText:    { color: R.muted, fontSize: 15 },
  card:         { backgroundColor: R.card, borderRadius: 14, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: R.border },
  imageWrap:    { position: 'relative' },
  image:        { width: '100%', aspectRatio: 16 / 9 },
  scoreBadge:   { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: R.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  scoreText:    { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardBody:     { padding: 12, gap: 8 },
  titleRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  cardTitle:    { flex: 1, fontSize: 15, fontWeight: '700', color: R.fg, lineHeight: 20 },
  mealChip:     { backgroundColor: R.chip, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  mealChipText: { color: R.muted, fontSize: 11, fontWeight: '500' },
  meta:         { fontSize: 12, color: R.muted },
  macroRow:     { flexDirection: 'row', gap: 6 },
  macroPill:    { flex: 1, alignItems: 'center', backgroundColor: R.chip, paddingVertical: 6, borderRadius: 8 },
  macroVal:     { fontSize: 13, fontWeight: '700' },
  macroLabel:   { fontSize: 10, color: R.muted, marginTop: 1 },
  allergenRow:  { flexDirection: 'row', gap: 6 },
  allergenChip: { backgroundColor: R.chip, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  allergenText: { color: R.muted, fontSize: 11 },
  actions:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  voteBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: R.chip, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  voteBtnActive:{ backgroundColor: R.primary },
  voteCount:    { color: R.muted, fontSize: 13, fontWeight: '600' },
  timeAgo:      { flex: 1, textAlign: 'right', color: R.muted, fontSize: 11 },
});
