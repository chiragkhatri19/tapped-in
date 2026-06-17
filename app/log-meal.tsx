import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Platform, ScrollView, Animated, Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

import { useColors } from '@/hooks/useColors';
import { BrutalButton, BrutalBox, BrutalChip } from '@/components/brutal';
import { HeaderMenuButton } from '@/components/navigation/HeaderMenuButton';
import { useSuccessBurst } from '@/components/motion/SuccessBurst';
import { BRUTAL } from '@/constants/brutal';
import { F } from '@/constants/fonts';
import { useTrackerStore, getTodayKey } from '@/stores/tracker-store';
import { useProfile } from '@/stores/profile-store';
import { GeminiScanIngredient, scanMealImage } from '@/lib/gemini-scan';
import { FoodItem } from '@/data/foods';
import {
  LoggedMeal, LoggedIngredient, OilEntry, MealType, MEAL_TYPE_LABELS,
  OIL_DATA, computeOilEntry, SavedMealTemplate, SavedMealIngredient,
} from '@/data/tracker-types';
import {
  searchFoods, getRecentFoods, addRecentFoodId,
  saveCustomFood, getSavedMeals, saveMealTemplate,
} from '@/lib/food-utils';
import { createZeroMicros, legacyMicrosFrom, sumMicros } from '@/data/micronutrients';
import { z } from 'zod';

const OIL_COLOR = '#FF3DA5';

// Zod schema for FoodItem received via deep-link — prevents injection of bogus macro values
const ScannedFoodSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(200),
  caloriesPer100g: z.number().min(0).max(2000),
  proteinPer100g: z.number().min(0).max(900),
  carbsPer100g: z.number().min(0).max(900),
  fatPer100g: z.number().min(0).max(900),
  servingGrams: z.number().min(1).max(2000),
  servingUnit: z.string().max(20).optional(),
  nameHindi: z.string().max(200).optional(),
  brand: z.string().max(200).optional(),
});

// Countable serving units — show a stepper instead of raw grams input
import {
  type EditableIngredient,
  uid, getDefaultMealType, ingMacros, toLoggedIngredient, foodToEditable,
} from '@/lib/meal-builder';

const COUNTABLE_UNITS: FoodItem['servingUnit'][] = ['egg', 'roti', 'idli', 'dosa', 'banana', 'apple', 'slice', 'scoop', 'piece'];
const UNIT_LABELS: Partial<Record<FoodItem['servingUnit'], { s: string; p: string }>> = {
  egg:    { s: 'egg',    p: 'eggs'    },
  roti:   { s: 'roti',  p: 'roti'    },
  idli:   { s: 'idli',  p: 'idli'    },
  dosa:   { s: 'dosa',  p: 'dosa'    },
  banana: { s: 'banana',p: 'bananas' },
  apple:  { s: 'apple', p: 'apples'  },
  slice:  { s: 'slice', p: 'slices'  },
  scoop:  { s: 'scoop', p: 'scoops'  },
  piece:  { s: 'piece', p: 'pieces'  },
  cup:    { s: 'cup',   p: 'cups'    },
  tbsp:   { s: 'tbsp',  p: 'tbsp'   },
};
const GRAM_PRESETS = [25, 50, 100, 150, 200, 300];

type Step =
  | 'classify' | 'how_to_log'
  | 'ai_capture' | 'ai_scanning' | 'ai_review' | 'ai_refine'
  | 'manual_log' | 'oil_check' | 'review'
  | 'create_custom_food' | 'saved_meals_list';

type MealCategory = 'home_cooked' | 'packed' | 'cheat';

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LogMealScreen() {
  const colors   = useColors();
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const addMeal  = useTrackerStore(s => s.addMeal);
  const { profile } = useProfile();

  const burst = useSuccessBurst();

  const params = useLocalSearchParams<{ scannedFood?: string; openCustomFood?: string }>();

  const ACCENT       = colors.primary;
  const ACCENT_BG    = colors.accent;
  const topPad       = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad    = Platform.OS === 'web' ? 34 : insets.bottom;

  // ── Nav ──────────────────────────────────────────────────────────────────────
  const [step, setStep]       = useState<Step>('manual_log');
  const [history, setHistory] = useState<Step[]>([]);
  function goTo(s: Step) { setHistory(h => [...h, step]); setStep(s); }
  function goBack() {
    const prev = history[history.length - 1];
    if (!prev) { router.back(); return; }
    setHistory(h => h.slice(0, -1));
    setStep(prev);
  }

  // ── Meal metadata ─────────────────────────────────────────────────────────────
  const [mealCategory, setMealCategory] = useState<MealCategory | null>(null);
  const [mealType,     setMealType]     = useState<MealType>(getDefaultMealType());
  const [mealName,     setMealName]     = useState('');
  const isCooked = mealCategory === 'home_cooked';

  // ── Ingredient list ───────────────────────────────────────────────────────────
  const [ingredients, setIngredients] = useState<EditableIngredient[]>([]);
  const totals = ingredients.reduce(
    (a, e) => { const m = ingMacros(e); return { kcal: a.kcal+m.kcal, p: a.p+m.p, c: a.c+m.c, fat: a.fat+m.fat }; },
    { kcal: 0, p: 0, c: 0, fat: 0 }
  );

  // ── Manual log: food selector & editor ───────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState('');
  const [selectedFood,  setSelectedFood]  = useState<FoodItem | null>(null);
  const [editorGrams,   setEditorGrams]   = useState('');
  const [editorCount,   setEditorCount]   = useState(1);
  const [focusId,       setFocusId]       = useState<string | null>(null);

  function selectFood(food: FoodItem) {
    setSelectedFood(food);
    setEditorCount(1);
    setEditorGrams(String(food.servingGrams));
    setSearchQuery('');
  }

  useEffect(() => {
    if (params.scannedFood) {
      try {
        const parsed = ScannedFoodSchema.parse(JSON.parse(params.scannedFood));
        selectFood(parsed as unknown as FoodItem);
      } catch { /* malformed or invalid param — ignore */ }
    }
    if (params.openCustomFood === '1') {
      setStep('create_custom_food');
    }
  // run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function adjustCount(delta: number) {
    if (!selectedFood) return;
    const next = Math.max(1, editorCount + delta);
    setEditorCount(next);
    setEditorGrams(String(Math.round(selectedFood.servingGrams * next)));
  }

  function handleAddIngredient() {
    if (!selectedFood) return;
    const grams = parseFloat(editorGrams) || 0;
    if (grams <= 0) return;
    addRecentFoodId(selectedFood.id);
    setIngredients(prev => [...prev, foodToEditable(selectedFood, grams)]);
    setSelectedFood(null);
    setEditorGrams('');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  // ── AI scan ───────────────────────────────────────────────────────────────────
  const [capturedUri,     setCapturedUri]     = useState<string | null>(null);
  const [capturedBase64,  setCapturedBase64]  = useState<string | null>(null);
  const [scanStatus,      setScanStatus]      = useState<'idle' | 'running' | 'error'>('idle');
  const [scanError,       setScanError]       = useState('');
  const [geminiDishName,  setGeminiDishName]  = useState('');
  const [geminiConf,      setGeminiConf]      = useState<'high' | 'medium' | 'low'>('high');
  const [geminiOilWarn,   setGeminiOilWarn]   = useState(false);
  const [geminiNotes,     setGeminiNotes]     = useState('');
  const scanStarted = useRef(false);

  // AI refine: track per-ingredient weight strings for inline editing
  const [refineInputs, setRefineInputs] = useState<Record<string, string>>({});
  useEffect(() => {
    if (step === 'ai_refine') {
      const m: Record<string, string> = {};
      ingredients.forEach(i => { m[i.uid] = String(i.weightGrams); });
      setRefineInputs(m);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (step === 'ai_scanning') {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])).start();
    } else { pulseAnim.setValue(0); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step !== 'ai_scanning' || scanStarted.current) return;
    scanStarted.current = true;
    (async () => {
      setScanStatus('running');
      try {
        const result = await scanMealImage(capturedBase64!, isCooked);
        const name = result.dishName || '';
        setGeminiDishName(name); setMealName(name);
        setGeminiConf(result.confidence || 'medium');
        setGeminiOilWarn(!!result.oilWarning);
        setGeminiNotes(result.notes || '');
        const mapped: EditableIngredient[] = (result.ingredients || []).map((ing: GeminiScanIngredient) => {
          let cal = ing.caloriesPer100g || 0;
          let p   = ing.proteinPer100g || 0;
          let c   = ing.carbsPer100g || 0;
          let fat = ing.fatPer100g || 0;
          let micros = createZeroMicros();
          let foodId = `ai_${uid()}`;
          // The model sometimes returns ingredient names with no macros. Fill them
          // from the embedded food catalog so calories always show up.
          if (cal <= 0) {
            const match = searchFoods(ing.name, 1)[0];
            if (match) {
              cal = match.caloriesPer100g; p = match.proteinPer100g;
              c = match.carbsPer100g; fat = match.fatPer100g;
              micros = match.microsPer100g; foodId = match.id;
            }
          }
          // Last resort: derive calories from macros (Atwater factors).
          if (cal <= 0 && (p > 0 || c > 0 || fat > 0)) cal = Math.round(p * 4 + c * 4 + fat * 9);
          return {
            uid: uid(), foodId, name: ing.name, nameHindi: ing.nameHindi || '',
            weightGrams: ing.estimatedWeightGrams || 100,
            caloriesPer100g: cal, proteinPer100g: p, carbsPer100g: c, fatPer100g: fat,
            microsPer100g: micros,
          };
        });
        setIngredients(mapped);
        setScanStatus('idle');
        setStep('ai_review');
      } catch (e: unknown) {
        setScanError(e instanceof Error ? e.message : 'Scan failed — switch to manual.');
        setScanStatus('error');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Oil ───────────────────────────────────────────────────────────────────────
  const [oilEntry,         setOilEntry]        = useState<OilEntry | null>(null);
  const [oilYes,           setOilYes]          = useState(false);
  const [selectedOilType,  setSelectedOilType] = useState<OilEntry['oilType']>('mustard');
  const [oilGrams,         setOilGrams]        = useState('');

  // ── Custom food form ──────────────────────────────────────────────────────────
  const [cfName,     setCfName]     = useState('');
  const [cfCalories, setCfCalories] = useState('');
  const [cfProtein,  setCfProtein]  = useState('');
  const [cfCarbs,    setCfCarbs]    = useState('');
  const [cfFat,      setCfFat]      = useState('');
  const [cfServing,  setCfServing]  = useState('100');

  // ── Image picker ──────────────────────────────────────────────────────────────
  async function pickImage(useCamera: boolean) {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const fn = useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const res = await fn({ mediaTypes: 'images', quality: 0.7, base64: true, allowsEditing: false });
    if (!res.canceled && res.assets[0]) {
      setCapturedUri(res.assets[0].uri);
      setCapturedBase64(res.assets[0].base64 ?? null);
    }
  }

  // ── Log ───────────────────────────────────────────────────────────────────────
  async function handleLog() {
    const logged = ingredients.map(toLoggedIngredient);
    const oil = oilYes && parseFloat(oilGrams) > 0
      ? computeOilEntry(selectedOilType, parseFloat(oilGrams))
      : oilEntry;
    const meal: LoggedMeal = {
      id: uid(),
      name: mealName.trim() || MEAL_TYPE_LABELS[mealType],
      mealType, ingredients: logged,
      ...(oil ? { oilEntry: oil } : {}),
      loggedAt: new Date().toISOString(),
      dateKey: getTodayKey(),
      isCooked,
      totalCalories:  totals.kcal + (oil?.calories ?? 0),
      totalProteinG:  totals.p,
      totalCarbsG:    totals.c,
      totalFatG:      totals.fat + (oil?.fatG ?? 0),
      micros:         sumMicros(logged.map((i) => i.micros)),
      logMethod: capturedUri ? 'ai_scan' : 'manual',
    };
    await addMeal(meal);
    burst.fire({
      title: 'meal logged.',
      subtitle: `${meal.totalCalories} kcal · P ${Math.round(meal.totalProteinG)}g`,
      after: () => router.back(),
    });
  }

  function handleSaveTemplate() {
    if (ingredients.length === 0) return;
    const ings: SavedMealIngredient[] = ingredients.map(e => ({
      foodId: e.foodId, name: e.name, weightGrams: e.weightGrams, cookingState: 'cooked' as const,
      caloriesPer100g: e.caloriesPer100g, proteinPer100g: e.proteinPer100g,
      carbsPer100g: e.carbsPer100g, fatPer100g: e.fatPer100g,
      microsPer100g: e.microsPer100g,
    }));
    saveMealTemplate({
      id: uid(),
      name: mealName.trim() || MEAL_TYPE_LABELS[mealType],
      ingredients: ings,
      totalCalories: totals.kcal, totalProteinG: totals.p,
      totalCarbsG: totals.c, totalFatG: totals.fat,
      createdAt: new Date().toISOString(),
    });
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function resetForNextMeal() {
    setIngredients([]);
    setOilEntry(null);
    setOilYes(false);
    setOilGrams('');
    setMealName('');
    setMealCategory(null);
    setCapturedUri(null);
    setCapturedBase64(null);
    setSelectedFood(null);
    setSearchQuery('');
    setRefineInputs({});
    setHistory([]);
    setStep('classify');
  }

  async function handleLogAndAnother() {
    const logged = ingredients.map(toLoggedIngredient);
    const oil = oilYes && parseFloat(oilGrams) > 0
      ? computeOilEntry(selectedOilType, parseFloat(oilGrams))
      : oilEntry;
    const meal: LoggedMeal = {
      id: uid(),
      name: mealName.trim() || MEAL_TYPE_LABELS[mealType],
      mealType, ingredients: logged,
      ...(oil ? { oilEntry: oil } : {}),
      loggedAt: new Date().toISOString(),
      dateKey: getTodayKey(),
      isCooked,
      totalCalories:  totals.kcal + (oil?.calories ?? 0),
      totalProteinG:  totals.p,
      totalCarbsG:    totals.c,
      totalFatG:      totals.fat + (oil?.fatG ?? 0),
      micros:         sumMicros(logged.map((i) => i.micros)),
      logMethod: capturedUri ? 'ai_scan' : 'manual',
    };
    await addMeal(meal);
    burst.fire({
      title: 'logged. next?',
      subtitle: `${meal.totalCalories} kcal added`,
      after: () => resetForNextMeal(),
    });
  }

  // ── Shared UI helpers ─────────────────────────────────────────────────────────
  const fg  = { color: colors.foreground };
  const mut = { color: colors.mutedForeground };

  function Header({ title, canGoBack = true }: { title?: string; canGoBack?: boolean }) {
    return (
      <View style={[s.header, { paddingTop: topPad + 8, borderBottomColor: colors.foreground, backgroundColor: colors.background }]}>
        {canGoBack
          ? <TouchableOpacity onPress={goBack} hitSlop={{ top:8,bottom:8,left:8,right:8 }} style={s.hBtn}>
              <Ionicons name="arrow-back" size={20} color={colors.foreground} />
            </TouchableOpacity>
          : <View style={s.hBtn} />}
        {title
          ? <Text style={[s.hTitle, { color: colors.foreground }]}>{title}</Text>
          : <View style={{ flex: 1 }} />}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <HeaderMenuButton />
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top:8,bottom:8,left:8,right:8 }} style={s.hBtn}>
            <Ionicons name="close" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function CTA({ label, onPress, disabled, color: _bg, outline: _outline }: {
    label: string; onPress: () => void; disabled?: boolean; color?: string; outline?: boolean;
  }) {
    return (
      <BrutalButton label={label} onPress={onPress} disabled={disabled} style={{ marginTop: 12 }} />
    );
  }

  function CTASecondary({ label, onPress }: { label: string; onPress: () => void }) {
    return (
      <TouchableOpacity onPress={onPress}
        style={[s.ctaSecondary, { borderColor: colors.foreground, backgroundColor: colors.card }]}>
        <Text style={[s.ctaSecondaryTxt, { color: colors.foreground }]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  function TotalBanner() {
    if (ingredients.length === 0) return null;
    return (
      <BrutalBox style={s.totalBanner} offset={4}>
        <Text style={[s.totalKcal, { color: colors.foreground }]}>{totals.kcal} kcal</Text>
        <Text style={[s.totalMacros, { color: colors.mutedForeground }]}>P {totals.p}g · C {totals.c}g · F {totals.fat}g</Text>
        <Text style={{ fontFamily: F.mono, fontSize: 11, color: colors.mutedForeground }}>
          {ingredients.length} item{ingredients.length !== 1 ? 's' : ''}
        </Text>
      </BrutalBox>
    );
  }

  function MacroPillRow({ kcal, p, c, fat, large }: { kcal: number; p: number; c: number; fat: number; large?: boolean }) {
    const numSz = large ? 16 : 13;
    const kcalSz = large ? 24 : 16;
    return (
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Text style={{ fontFamily: F.monoSemi, fontSize: kcalSz, color: colors.foreground }}>{kcal} kcal</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {([['P', p, colors.blue], ['C', c, colors.orange], ['F', fat, colors.pink]] as [string, number, string][]).map(([l, v, clr]) => (
            <View key={l} style={[s.macroPill, { borderColor: colors.foreground, backgroundColor: colors.background }]}>
              <View style={[s.macroPillDot, { backgroundColor: clr }]} />
              <Text style={{ fontFamily: F.bodyBold, fontSize: 10, color: colors.foreground }}>{l}</Text>
              <Text style={{ fontFamily: F.monoSemi, fontSize: numSz, color: colors.foreground }}>{v}g</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // ── Step: Classify ────────────────────────────────────────────────────────────
  function renderClassify() {
    const items: { key: MealCategory; tag: string; title: string; sub: string }[] = [
      { key: 'home_cooked', tag: 'home', title: 'home cooked', sub: 'made at home. oil tracking applies.' },
      { key: 'packed',      tag: 'out',  title: 'restaurant / ordered', sub: 'eating out or bought ready to eat.' },
      { key: 'cheat',       tag: 'yolo', title: 'cheat meal', sub: 'a treat. be realistic and log it all.' },
    ];
    return (
      <>
        <Header canGoBack={false} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.pad}>
          <Text style={[s.stepTitle, { color: colors.foreground }]}>what kind of meal?</Text>
          <View style={{ gap: 12 }}>
            {items.map(item => {
              const active = mealCategory === item.key;
              return (
                <TouchableOpacity key={item.key}
                  onPress={() => { setMealCategory(item.key); goTo('how_to_log'); }}
                  activeOpacity={0.85}>
                  <BrutalBox
                    style={[s.optCard, active && { backgroundColor: ACCENT_BG }]}
                    offset={active ? 5 : 3}
                  >
                    <View style={[s.optTag, { backgroundColor: active ? colors.primary : colors.muted, borderColor: colors.foreground }]}>
                      <Text style={[s.optTagTxt, { color: active ? colors.primaryForeground : colors.foreground }]}>{item.tag}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.optTitle, { color: colors.foreground }]}>{item.title}</Text>
                      <Text style={[s.optSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
                    </View>
                    {active && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                  </BrutalBox>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </>
    );
  }

  // ── Step: How to log ──────────────────────────────────────────────────────────
  function renderHowToLog() {
    const hasSaved = getSavedMeals().length > 0;
    return (
      <>
        <Header title="how to log it?" />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.pad}>
          <View style={{ gap: 12 }}>
            <TouchableOpacity onPress={() => goTo('ai_capture')} activeOpacity={0.85}>
              <BrutalBox style={[s.optCard, { backgroundColor: ACCENT_BG }]} offset={5}>
                <View style={[s.optTag, { backgroundColor: colors.primary, borderColor: colors.foreground }]}>
                  <Text style={[s.optTagTxt, { color: colors.primaryForeground }]}>fastest</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.optTitle, { color: colors.foreground }]}>AI scan</Text>
                  <Text style={[s.optSub, { color: colors.mutedForeground }]}>photo. Gemini identifies every ingredient.</Text>
                </View>
              </BrutalBox>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => goTo('manual_log')} activeOpacity={0.85}>
              <BrutalBox style={s.optCard} offset={3}>
                <View style={[s.optTag, { backgroundColor: colors.muted, borderColor: colors.foreground }]}>
                  <Text style={[s.optTagTxt, { color: colors.foreground }]}>manual</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.optTitle, { color: colors.foreground }]}>search and add</Text>
                  <Text style={[s.optSub, { color: colors.mutedForeground }]}>search the food database and add each ingredient.</Text>
                </View>
              </BrutalBox>
            </TouchableOpacity>

            {hasSaved && (
              <TouchableOpacity onPress={() => goTo('saved_meals_list')} activeOpacity={0.85}>
                <BrutalBox style={s.optCard} offset={3}>
                  <View style={[s.optTag, { backgroundColor: colors.muted, borderColor: colors.foreground }]}>
                    <Text style={[s.optTagTxt, { color: colors.foreground }]}>saved</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.optTitle, { color: colors.foreground }]}>saved meals</Text>
                    <Text style={[s.optSub, { color: colors.mutedForeground }]}>re-log a meal you've logged before.</Text>
                  </View>
                </BrutalBox>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </>
    );
  }

  // ── Step: AI Capture ─────────────────────────────────────────────────────────
  function renderAICapture() {
    return (
      <>
        <Header title="AI Scan" />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.pad}>
          <Text style={[{ fontSize: 18, fontWeight: '700', marginBottom: 4 }, fg]}>Take or upload a photo</Text>
          <Text style={[{ fontSize: 13, marginBottom: 20 }, mut]}>Overhead angle = better results</Text>
          {[
            { icon: 'camera-outline', label: 'Take a photo', camera: true },
            { icon: 'images-outline', label: 'Choose from gallery', camera: false },
          ].map(btn => (
            <TouchableOpacity key={btn.label} onPress={() => pickImage(btn.camera)}
              style={[s.photoBtn, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 10 }]}>
              <Ionicons name={btn.icon as React.ComponentProps<typeof Ionicons>["name"]} size={20} color={colors.foreground} />
              <Text style={[{ fontSize: 15, fontWeight: '500', marginLeft: 8 }, fg]}>{btn.label}</Text>
            </TouchableOpacity>
          ))}
          {capturedUri && (
            <View style={{ marginTop: 16 }}>
              <Image source={{ uri: capturedUri }} style={s.previewImg} resizeMode="cover" />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={[{ fontSize: 13 }, mut]}>Looks good?</Text>
                <TouchableOpacity onPress={() => { setCapturedUri(null); setCapturedBase64(null); }}>
                  <Text style={{ fontSize: 13, color: ACCENT }}>Retake</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
        <View style={[s.footer, { paddingBottom: bottomPad + 12, borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <CTA label="Scan this meal →" onPress={() => { scanStarted.current = false; goTo('ai_scanning'); }} disabled={!capturedUri} />
        </View>
      </>
    );
  }

  // ── Step: AI Scanning ─────────────────────────────────────────────────────────
  function renderAIScanning() {
    if (scanStatus === 'error') {
      return (
        <>
          <Header title="AI Scan" />
          <View style={[s.pad, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="close-circle-outline" size={44} color={colors.destructive} />
            <Text style={[{ fontSize: 17, fontWeight: '600', marginTop: 12, textAlign: 'center' }, fg]}>Scan failed</Text>
            <Text style={[{ fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 20 }, mut]}>{scanError}</Text>
            <CTASecondary label="try again" onPress={() => { scanStarted.current = false; setScanStatus('idle'); goTo('ai_capture'); }} />
            <CTA label="Switch to manual →" onPress={() => { setIngredients([]); goTo('manual_log'); }} />
          </View>
        </>
      );
    }
    return (
      <>
        <Header title="AI Scan" canGoBack={false} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {capturedUri && (
            <View style={{ width: '100%', position: 'relative', marginBottom: 28 }}>
              <Image source={{ uri: capturedUri }} style={[s.previewImg, { opacity: 0.4 }]} resizeMode="cover" />
              <View style={StyleSheet.absoluteFillObject}>
                {[0, 1, 2].map(i => (
                  <Animated.View key={i} style={[s.pulseRing, {
                    borderColor: ACCENT,
                    transform: [{ scale: pulseAnim.interpolate({ inputRange: [0,1], outputRange: [0.8+i*0.3, 1.6+i*0.4] }) }],
                    opacity:    pulseAnim.interpolate({ inputRange: [0,1], outputRange: [0.7-i*0.2, 0] }),
                  }]} />
                ))}
              </View>
            </View>
          )}
          <Text style={[{ fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 6 }, fg]}>Gemini is analysing your meal...</Text>
          <Text style={[{ fontSize: 13, textAlign: 'center' }, mut]}>ingredients · macros · micros</Text>
        </View>
      </>
    );
  }

  // ── Step: AI Review ───────────────────────────────────────────────────────────
  function renderAIReview() {
    const confColor = { high: '#00C2A8', medium: '#FF7A1A', low: '#FF3B2F' }[geminiConf];
    const confLabel = { high: 'High confidence', medium: 'Medium — check weights', low: 'Low — verify carefully' }[geminiConf];
    return (
      <>
        <Header title="AI Scan" />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.pad, { paddingBottom: bottomPad + 100 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Text style={[{ fontSize: 20, fontWeight: '700', flex: 1 }, fg]}>{geminiDishName || 'Dish identified'}</Text>
            <View style={[s.pill, { backgroundColor: confColor + '20' }]}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: confColor }}>{confLabel}</Text>
            </View>
          </View>
          {geminiOilWarn && (
            <View style={[s.oilBanner, { backgroundColor: colors.card, borderColor: OIL_COLOR }]}>
              <Text style={{ fontSize: 13, color: OIL_COLOR }}>🫗 Oil not included — you'll log it next</Text>
            </View>
          )}
          {geminiNotes ? (
            <View style={[s.noteBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[{ fontSize: 13, lineHeight: 20 }, mut]}>{geminiNotes}</Text>
            </View>
          ) : null}
          <View style={[s.decisionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[{ fontSize: 14, lineHeight: 20 }, mut]}>You'll be able to adjust ingredient weights on the next screen.</Text>
          </View>
          <CTA label="Edit & confirm ingredients →" onPress={() => goTo('ai_refine')} />
          <CTASecondary label="data is off. redo manually." onPress={() => { setIngredients([]); goTo('manual_log'); }} />
        </ScrollView>
      </>
    );
  }

  // ── Step: AI Refine ───────────────────────────────────────────────────────────
  function renderAIRefine() {
    function commitRefineWeights() {
      setIngredients(prev => prev.map(i => ({
        ...i,
        weightGrams: parseFloat(refineInputs[i.uid] || '0') || i.weightGrams,
      })));
    }

    // If a food is selected from the "add missing" search, show editor
    if (selectedFood) {
      const grams = parseFloat(editorGrams) || 0;
      const isCountable = COUNTABLE_UNITS.includes(selectedFood.servingUnit);
      const unitL = UNIT_LABELS[selectedFood.servingUnit];
      return (
        <>
          <Header title="Add Ingredient" />
          <KeyboardAwareScrollView style={{ flex: 1 }} contentContainerStyle={[s.pad, { paddingBottom: bottomPad + 100 }]} bottomOffset={80}>
              <TouchableOpacity onPress={() => setSelectedFood(null)} style={s.backToSearch}>
                <Ionicons name="arrow-back" size={14} color={ACCENT} />
                <Text style={{ fontSize: 13, color: ACCENT, marginLeft: 4 }}>back to search</Text>
              </TouchableOpacity>
              <Text style={[{ fontSize: 18, fontWeight: '700', marginBottom: 2 }, fg]}>{selectedFood.name}</Text>
              {selectedFood.nameHindi ? <Text style={[{ fontSize: 13, marginBottom: 4 }, mut]}>{selectedFood.nameHindi}</Text> : null}
              <Text style={[{ fontSize: 12, marginBottom: 20 }, mut]}>{selectedFood.caloriesPer100g} kcal / 100g</Text>
              {isCountable && unitL ? (
                <View style={[s.editorBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[s.boxLabel, mut]}>Serving size</Text>
                  <View style={s.stepper}>
                    <TouchableOpacity onPress={() => adjustCount(-1)} style={[s.stepBtn, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="remove" size={18} color={colors.foreground} />
                    </TouchableOpacity>
                    <View style={s.stepVal}>
                      <Text style={[{ fontSize: 22, fontWeight: '700' }, fg]}>{editorCount}</Text>
                      <Text style={[{ fontSize: 12 }, mut]}>{editorCount === 1 ? unitL.s : unitL.p}</Text>
                    </View>
                    <TouchableOpacity onPress={() => adjustCount(1)} style={[s.stepBtn, { backgroundColor: ACCENT }]}>
                      <Ionicons name="add" size={18} color={colors.primaryForeground} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[{ fontSize: 12, textAlign: 'center', marginTop: 8 }, mut]}>= {editorGrams}g</Text>
                </View>
              ) : null}
              <View style={[s.editorBox, { backgroundColor: colors.card, borderColor: colors.border, marginTop: isCountable ? 12 : 0 }]}>
                {isCountable && <Text style={[s.boxLabel, mut]}>Or enter grams directly</Text>}
                <View style={s.gramRow}>
                  <TextInput
                    value={editorGrams} onChangeText={setEditorGrams}
                    keyboardType="decimal-pad" placeholder="0"
                    placeholderTextColor={colors.mutedForeground}
                    onFocus={() => setFocusId('eg')} onBlur={() => setFocusId(null)}
                    style={[s.gramInput, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: focusId === 'eg' ? ACCENT : colors.border }]}
                  />
                  <Text style={[{ fontSize: 16 }, mut]}>{selectedFood.servingUnit === 'ml' ? 'ml' : 'g'}</Text>
                </View>
                {!isCountable && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 10 }}>
                    {GRAM_PRESETS.map(p => (
                      <TouchableOpacity key={p} onPress={() => setEditorGrams(String(p))}
                        style={[s.presetChip, { backgroundColor: editorGrams === String(p) ? ACCENT : colors.secondary, borderColor: editorGrams === String(p) ? ACCENT : colors.border }]}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: editorGrams === String(p) ? colors.primaryForeground : colors.mutedForeground }}>{p}g</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
              {grams > 0 && (
                <View style={[s.livePreview, { backgroundColor: colors.card, borderColor: colors.foreground }]}>
                  <MacroPillRow
                    kcal={Math.round((grams/100) * selectedFood.caloriesPer100g)}
                    p={Math.round((grams/100) * selectedFood.proteinPer100g * 10)/10}
                    c={Math.round((grams/100) * selectedFood.carbsPer100g * 10)/10}
                    fat={Math.round((grams/100) * selectedFood.fatPer100g * 10)/10}
                  />
                </View>
              )}
          </KeyboardAwareScrollView>
          <View style={[s.footer, { paddingBottom: bottomPad + 12, borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <CTA label="+ Add to meal" onPress={handleAddIngredient} disabled={grams <= 0} />
          </View>
        </>
      );
    }

    return (
      <>
        <Header title="Edit Ingredients" />
        <KeyboardAwareScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={[s.pad, { paddingBottom: bottomPad + 120 }]} bottomOffset={80}>
            <Text style={[{ fontSize: 13, marginBottom: 16 }, mut]}>Edit weights below. All values are per the weight you enter.</Text>

            {/* Meal name */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.chipRow, { marginBottom: 16 }]}>
              {(['breakfast','lunch','dinner','snack','pre_workout','post_workout'] as MealType[]).map(t => (
                <TouchableOpacity key={t} onPress={() => setMealType(t)}
                  style={[s.chip, { backgroundColor: mealType === t ? ACCENT : colors.card, borderColor: mealType === t ? ACCENT : colors.border }]}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: mealType === t ? colors.primaryForeground : colors.mutedForeground }}>{MEAL_TYPE_LABELS[t]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Ingredient cards with editable weights */}
            {ingredients.map(ing => {
              const gStr = refineInputs[ing.uid] ?? String(ing.weightGrams);
              const g = parseFloat(gStr) || 0;
              const f = g / 100;
              const kcal = Math.round(f * ing.caloriesPer100g);
              const p = Math.round(f * ing.proteinPer100g * 10)/10;
              const c = Math.round(f * ing.carbsPer100g * 10)/10;
              const fat = Math.round(f * ing.fatPer100g * 10)/10;
              return (
                <View key={ing.uid} style={[s.ingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[{ fontSize: 14, fontWeight: '600' }, fg]}>{ing.name}</Text>
                      {g > 0 && <Text style={[{ fontSize: 12, marginTop: 3 }, mut]}>≈ {kcal} kcal · P:{p}g C:{c}g F:{fat}g</Text>}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TextInput
                        value={gStr}
                        onChangeText={v => setRefineInputs(prev => ({ ...prev, [ing.uid]: v }))}
                        keyboardType="decimal-pad"
                        onFocus={() => setFocusId(ing.uid)} onBlur={() => setFocusId(null)}
                        style={[s.refineInput, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: focusId === ing.uid ? ACCENT : colors.border }]}
                      />
                      <Text style={[{ fontSize: 12 }, mut]}>g</Text>
                      <TouchableOpacity onPress={() => setIngredients(prev => prev.filter(i => i.uid !== ing.uid))}
                        hitSlop={{ top:6,bottom:6,left:6,right:6 }}>
                        <Ionicons name="close" size={16} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Search to add missing */}
            <View style={[s.searchBar, { backgroundColor: colors.secondary, borderColor: focusId === 'search' ? ACCENT : colors.border, marginTop: 16 }]}>
              <Ionicons name="add-circle-outline" size={15} color={colors.mutedForeground} />
              <TextInput
                value={searchQuery} onChangeText={setSearchQuery}
                placeholder="Add missing ingredient..."
                placeholderTextColor={colors.mutedForeground}
                onFocus={() => setFocusId('search')} onBlur={() => setFocusId(null)}
                style={[s.searchInput, fg]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
            {searchQuery.length > 0 && (
              <View style={[s.foodList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {searchFoods(searchQuery, 8).map((food, i, arr) => (
                  <TouchableOpacity key={food.id} onPress={() => selectFood(food)}
                    style={[s.foodRow, { borderBottomColor: colors.border, borderBottomWidth: i < arr.length-1 ? 1 : 0 }]}>
                    <Text style={[{ fontSize: 14, fontWeight: '500', flex: 1 }, fg]}>{food.name}</Text>
                    <Text style={[{ fontSize: 12 }, mut]}>{food.caloriesPer100g} kcal/100g</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TotalBanner />
        </KeyboardAwareScrollView>
        <View style={[s.footer, { paddingBottom: bottomPad + 12, borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <CTA label="Next →" onPress={() => { commitRefineWeights(); goTo(isCooked ? 'oil_check' : 'review'); }} disabled={ingredients.length === 0} />
        </View>
      </>
    );
  }

  // ── Step: Manual Log (combined name + search + editor + list) ─────────────────
  function renderManualLog() {
    const TYPES: MealType[] = ['breakfast','lunch','dinner','snack','pre_workout','post_workout'];
    const displayedFoods = searchQuery.length > 0 ? searchFoods(searchQuery, 12) : getRecentFoods(12, profile?.dietType);
    const grams = parseFloat(editorGrams) || 0;
    const isCountable = selectedFood ? COUNTABLE_UNITS.includes(selectedFood.servingUnit) : false;
    const unitL = selectedFood ? UNIT_LABELS[selectedFood.servingUnit] : null;

    // ── Ingredient editor pane ────────────────────────────────────────────────
    if (selectedFood) {
      return (
        <>
          <Header title="Add Ingredient" />
          <KeyboardAwareScrollView style={{ flex: 1 }} contentContainerStyle={[s.pad, { paddingBottom: bottomPad + 100 }]} bottomOffset={80}>
              <TouchableOpacity onPress={() => setSelectedFood(null)} style={s.backToSearch}>
                <Ionicons name="arrow-back" size={14} color={ACCENT} />
                <Text style={{ fontSize: 13, color: ACCENT, marginLeft: 4 }}>back to search</Text>
              </TouchableOpacity>

              <Text style={[s.editorFoodName, fg]}>{selectedFood.name}</Text>
              {selectedFood.nameHindi ? <Text style={[{ fontSize: 13, marginBottom: 4 }, mut]}>{selectedFood.nameHindi}</Text> : null}
              <Text style={[{ fontSize: 12, marginBottom: 20 }, mut]}>{selectedFood.caloriesPer100g} kcal per 100g · {selectedFood.proteinPer100g}g protein</Text>

              {/* Countable stepper */}
              {isCountable && unitL ? (
                <View style={[s.editorBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[s.boxLabel, mut]}>Serving size</Text>
                  <View style={s.stepper}>
                    <TouchableOpacity onPress={() => adjustCount(-1)} style={[s.stepBtn, { backgroundColor: editorCount <= 1 ? colors.secondary : colors.secondary }]}>
                      <Ionicons name="remove" size={20} color={editorCount <= 1 ? colors.mutedForeground : colors.foreground} />
                    </TouchableOpacity>
                    <View style={s.stepVal}>
                      <Text style={[{ fontSize: 30, fontWeight: '700' }, fg]}>{editorCount}</Text>
                      <Text style={[{ fontSize: 13 }, mut]}>{editorCount === 1 ? unitL.s : unitL.p}</Text>
                    </View>
                    <TouchableOpacity onPress={() => adjustCount(1)} style={[s.stepBtn, { backgroundColor: ACCENT }]}>
                      <Ionicons name="add" size={20} color={colors.primaryForeground} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[{ fontSize: 12, textAlign: 'center', marginTop: 8 }, mut]}>= {editorGrams}g</Text>
                </View>
              ) : null}

              {/* Gram input */}
              <View style={[s.editorBox, { backgroundColor: colors.card, borderColor: colors.border, marginTop: isCountable ? 12 : 0 }]}>
                {isCountable
                  ? <Text style={[s.boxLabel, mut]}>Or enter grams directly</Text>
                  : <Text style={[s.boxLabel, mut]}>How much? (grams)</Text>}
                <View style={s.gramRow}>
                  <TextInput
                    autoFocus={!isCountable}
                    value={editorGrams} onChangeText={setEditorGrams}
                    keyboardType="decimal-pad" placeholder="0"
                    placeholderTextColor={colors.mutedForeground}
                    onFocus={() => setFocusId('eg')} onBlur={() => setFocusId(null)}
                    style={[s.gramInput, {
                      color: colors.foreground,
                      backgroundColor: colors.secondary,
                      borderColor: focusId === 'eg' ? ACCENT : colors.border,
                    }]}
                  />
                  <Text style={[{ fontSize: 18, fontWeight: '500', marginLeft: 4 }, mut]}>
                    {selectedFood.servingUnit === 'ml' ? 'ml' : 'g'}
                  </Text>
                </View>
                {!isCountable && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 12 }}>
                    {GRAM_PRESETS.map(p => (
                      <TouchableOpacity key={p} onPress={() => setEditorGrams(String(p))}
                        style={[s.presetChip, {
                          backgroundColor: editorGrams === String(p) ? ACCENT : colors.secondary,
                          borderColor: editorGrams === String(p) ? ACCENT : colors.border,
                        }]}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: editorGrams === String(p) ? colors.primaryForeground : colors.mutedForeground }}>{p}g</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Live macro preview */}
              {grams > 0 && (
                <View style={[s.livePreview, { backgroundColor: colors.card, borderColor: colors.foreground }]}>
                  <MacroPillRow
                    large
                    kcal={Math.round((grams/100) * selectedFood.caloriesPer100g)}
                    p={Math.round((grams/100) * selectedFood.proteinPer100g * 10)/10}
                    c={Math.round((grams/100) * selectedFood.carbsPer100g * 10)/10}
                    fat={Math.round((grams/100) * selectedFood.fatPer100g * 10)/10}
                  />
                </View>
              )}
          </KeyboardAwareScrollView>
          <View style={[s.footer, { paddingBottom: bottomPad + 12, borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <CTA label="+ Add to meal" onPress={handleAddIngredient} disabled={grams <= 0} />
          </View>
        </>
      );
    }

    // ── Browse/search pane ────────────────────────────────────────────────────
    return (
      <>
        <Header title="Add Ingredients" />
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.pad, { paddingBottom: bottomPad + 120 }]}
          bottomOffset={80}
        >
            {/* Meal name */}
            <TextInput
              value={mealName} onChangeText={setMealName}
              placeholder="Meal name (optional)"
              placeholderTextColor={colors.mutedForeground}
              onFocus={() => setFocusId('mn')} onBlur={() => setFocusId(null)}
              style={[s.mealNameInput, {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: focusId === 'mn' ? ACCENT : colors.border,
              }]}
            />

            {/* Meal type chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.chipRow, { marginBottom: 18 }]}>
              {TYPES.map(t => (
                <TouchableOpacity key={t} onPress={() => setMealType(t)}
                  style={[s.chip, { backgroundColor: mealType === t ? ACCENT : colors.card, borderColor: mealType === t ? ACCENT : colors.border }]}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: mealType === t ? colors.primaryForeground : colors.mutedForeground }}>{MEAL_TYPE_LABELS[t]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Quick Actions */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <TouchableOpacity onPress={() => goTo('ai_capture')} style={{ flex: 1 }} activeOpacity={0.85}>
                <BrutalBox style={{ padding: 12, alignItems: 'center', justifyContent: 'center' }} radius={RADIUS} offset={3}>
                  <Text style={{ fontFamily: F.bodyBold, fontSize: 13, color: colors.foreground }}>📸 Scan with AI</Text>
                </BrutalBox>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => goTo('saved_meals_list')} style={{ flex: 1 }} activeOpacity={0.85}>
                <BrutalBox style={{ padding: 12, alignItems: 'center', justifyContent: 'center' }} radius={RADIUS} offset={3}>
                  <Text style={{ fontFamily: F.bodyBold, fontSize: 13, color: colors.foreground }}>⭐ Saved meals</Text>
                </BrutalBox>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => router.push('/scan-barcode' as never)} style={{ marginBottom: 14 }} activeOpacity={0.85}>
              <BrutalBox style={{ padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }} radius={RADIUS} offset={3}>
                <Ionicons name="barcode-outline" size={16} color={colors.foreground} />
                <Text style={{ fontFamily: F.bodyBold, fontSize: 13, color: colors.foreground }}>Scan barcode</Text>
              </BrutalBox>
            </TouchableOpacity>

            {/* Search */}
            <View style={[s.searchBar, { backgroundColor: colors.secondary, borderColor: focusId === 'search' ? ACCENT : colors.border }]}>
              <Ionicons name="search" size={15} color={colors.mutedForeground} />
              <TextInput
                value={searchQuery} onChangeText={setSearchQuery}
                placeholder="Search foods..."
                placeholderTextColor={colors.mutedForeground}
                onFocus={() => setFocusId('search')} onBlur={() => setFocusId(null)}
                style={[s.searchInput, fg]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            {/* Food results */}
            <View style={[s.foodList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {searchQuery.length === 0 && (
                <Text style={[s.listHead, mut]}>RECENTLY USED</Text>
              )}
              {displayedFoods.length > 0
                ? displayedFoods.map((food, i) => (
                  <TouchableOpacity key={food.id + i} onPress={() => selectFood(food)}
                    style={[s.foodRow, { borderBottomColor: colors.border, borderBottomWidth: i < displayedFoods.length - 1 ? 1 : 0 }]}
                    activeOpacity={0.7}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[{ fontSize: 14, fontWeight: '500' }, fg]}>{food.name}</Text>
                        {food.isCustom && (
                          <View style={[s.customBadge, { backgroundColor: colors.highlight }]}>
                            <Text style={{ fontSize: 9, fontWeight: '700', color: ACCENT }}>CUSTOM</Text>
                          </View>
                        )}
                        {!food.isVeg && <View style={s.nonVegDot} />}
                      </View>
                      {food.nameHindi ? <Text style={[{ fontSize: 11, marginTop: 1 }, mut]}>{food.nameHindi}</Text> : null}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[{ fontSize: 13, fontWeight: '500' }, mut]}>{food.caloriesPer100g} kcal</Text>
                      <Text style={[{ fontSize: 10 }, mut]}>per 100g</Text>
                    </View>
                  </TouchableOpacity>
                ))
                : (
                  <View style={{ padding: 16 }}>
                    <Text style={[{ fontSize: 13 }, mut]}>No results for "{searchQuery}"</Text>
                    <TouchableOpacity onPress={() => goTo('create_custom_food')} style={{ marginTop: 10 }}>
                      <Text style={{ fontSize: 13, color: ACCENT }}>+ Add "{searchQuery}" as custom food →</Text>
                    </TouchableOpacity>
                  </View>
                )
              }
            </View>

            {/* Added ingredients */}
            {ingredients.length > 0 && (
              <>
                <View style={s.divRow}>
                  <Text style={[s.divLabel, mut]}>ADDED TO MEAL</Text>
                  <Text style={[{ fontSize: 11 }, mut]}>{ingredients.length} item{ingredients.length !== 1 ? 's' : ''}</Text>
                </View>
                {ingredients.map((ing, idx) => {
                  const m = ingMacros(ing);
                  return (
                    <View key={ing.uid} style={[s.ingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={[{ fontSize: 14, fontWeight: '500' }, fg]}>{ing.name}</Text>
                          <Text style={[{ fontSize: 11, marginTop: 2 }, mut]}>
                            {ing.weightGrams}g · P:{m.p}g · C:{m.c}g · F:{m.fat}g
                          </Text>
                        </View>
                        <Text style={[{ fontSize: 14, fontWeight: '600', marginRight: 10, color: ACCENT }]}>{m.kcal}</Text>
                        <Text style={[{ fontSize: 11, marginRight: 10 }, mut]}>kcal</Text>
                        <TouchableOpacity onPress={() => setIngredients(prev => prev.filter((_, i) => i !== idx))}
                          hitSlop={{ top:6,bottom:6,left:6,right:6 }}>
                          <Ionicons name="close" size={16} color={colors.mutedForeground} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
                <TotalBanner />
              </>
            )}

            <TouchableOpacity onPress={() => goTo('create_custom_food')} style={s.customFoodLink}>
              <Ionicons name="add-circle-outline" size={14} color={colors.mutedForeground} />
              <Text style={[{ fontSize: 13, marginLeft: 5 }, mut]}>Add a custom food to my database →</Text>
            </TouchableOpacity>
        </KeyboardAwareScrollView>

        <View style={[s.footer, { paddingBottom: bottomPad + 12, borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <CTA label={`Done — Log ${totals.kcal} kcal`} onPress={handleLog} disabled={ingredients.length === 0} />
          {ingredients.length > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 }}>
              <TouchableOpacity onPress={() => goTo('review')} style={{ paddingVertical: 10 }}>
                <Text style={{ fontSize: 12, fontFamily: F.bodyMed, color: colors.mutedForeground }}>Review or add oil →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogAndAnother} style={{ paddingVertical: 10 }}>
                <Text style={{ fontSize: 12, fontFamily: F.bodyMed, color: colors.primary }}>Log & add another →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </>
    );
  }

  // ── Step: Oil Check ───────────────────────────────────────────────────────────
  function renderOilCheck() {
    const oilG = parseFloat(oilGrams) || 0;
    const oilD = OIL_DATA[selectedOilType];
    const previewKcal = oilG > 0 ? Math.round((oilG / 100) * oilD.caloriesPer100g) : 0;
    const OIL_TYPES: OilEntry['oilType'][] = ['mustard','sunflower','ghee','coconut','olive','butter','other'];
    return (
      <>
        <Header title="oil check" canGoBack={false} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.pad, { paddingBottom: bottomPad + 100 }]}>
          <BrutalBox style={[s.oilHero, { backgroundColor: colors.card }]} offset={5}>
            <Text style={[s.oilHeroTitle, { color: OIL_COLOR }]}>did you cook with oil?</Text>
            <Text style={[s.oilHeroSub, { color: colors.mutedForeground }]}>
              the #1 missed calorie source in home cooking. 1 tbsp = ~124 kcal. be honest.
            </Text>
          </BrutalBox>

          <TouchableOpacity onPress={() => setOilYes(true)} style={{ marginTop: 16, marginBottom: oilYes ? 20 : 10 }}>
            <BrutalBox style={[s.oilYesCard, oilYes && { backgroundColor: OIL_COLOR }]} offset={5}>
              <Text style={[s.oilYesTxt, { color: oilYes ? '#FFFFFF' : OIL_COLOR }]}>yes, I used oil</Text>
            </BrutalBox>
          </TouchableOpacity>

          {oilYes && (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4, marginBottom: 16 }}>
                {OIL_TYPES.map(t => (
                  <TouchableOpacity key={t} onPress={() => setSelectedOilType(t)}
                    style={[s.chip, { backgroundColor: selectedOilType === t ? OIL_COLOR : colors.card, borderColor: selectedOilType === t ? OIL_COLOR : colors.border }]}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: selectedOilType === t ? '#fff' : colors.mutedForeground }}>{OIL_DATA[t].label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={{ alignItems: 'center', marginBottom: 8 }}>
                <TextInput
                  value={oilGrams} onChangeText={setOilGrams}
                  keyboardType="decimal-pad" placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  onFocus={() => setFocusId('oil')} onBlur={() => setFocusId(null)}
                  style={[s.gramInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: OIL_COLOR, fontSize: 32, width: 110, height: 72 }]}
                />
                <Text style={[{ fontSize: 13, marginTop: 4 }, mut]}>g</Text>
                <Text style={[{ fontSize: 11, marginTop: 4 }, mut]}>1 tsp ≈ 4.5g · 1 tbsp ≈ 14g · 2 tbsp ≈ 28g</Text>
              </View>

              {oilG > 0 && (
                <Text style={{ fontSize: 14, fontWeight: '600', color: OIL_COLOR, textAlign: 'center', marginBottom: 16 }}>
                  That adds ~{previewKcal} kcal and {Math.round((oilG/100)*oilD.fatPer100g*10)/10}g fat
                </Text>
              )}
              <CTA label="Add oil & continue →" color={OIL_COLOR}
                onPress={() => { setOilEntry(computeOilEntry(selectedOilType, oilG)); goTo('review'); }}
                disabled={oilG <= 0} />
            </>
          )}

          <CTASecondary label="no oil used" onPress={() => { setOilEntry(null); goTo('review'); }} />
        </ScrollView>
      </>
    );
  }

  // ── Step: Review ──────────────────────────────────────────────────────────────
  function renderReview() {
    const finalKcal = totals.kcal + (oilEntry?.calories ?? 0);
    const finalFat  = totals.fat  + (oilEntry?.fatG   ?? 0);
    const CAT_LABELS: Record<MealCategory, string> = { home_cooked: 'Home cooked', packed: 'Restaurant', cheat: 'Cheat' };
    return (
      <>
        <Header title="Review" />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.pad, { paddingBottom: bottomPad + 130 }]}>
          <Text style={[{ fontSize: 22, fontWeight: '700', marginBottom: 4 }, fg]}>{mealName || MEAL_TYPE_LABELS[mealType]}</Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            <View style={[s.pill, { backgroundColor: ACCENT_BG }]}>
              <Text style={{ fontSize: 11, color: ACCENT }}>{MEAL_TYPE_LABELS[mealType]}</Text>
            </View>
            {mealCategory && (
              <View style={[s.pill, { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border }]}>
                <Text style={[{ fontSize: 11 }, mut]}>{CAT_LABELS[mealCategory]}</Text>
              </View>
            )}
            {capturedUri && (
              <View style={[s.pill, { backgroundColor: ACCENT_BG }]}>
                <Text style={{ fontSize: 11, color: ACCENT }}>AI Scan</Text>
              </View>
            )}
          </View>

          {/* Big macro summary */}
          <View style={[s.reviewMacroCard, { backgroundColor: colors.highlight, borderColor: colors.foreground }]}>
            <MacroPillRow large kcal={finalKcal} p={totals.p} c={totals.c} fat={finalFat} />
            {totals.p >= 30 && (
              <Text style={{ fontSize: 11, color: '#00C2A8', marginTop: 10, textAlign: 'center' }}>Solid protein hit</Text>
            )}
          </View>

          {/* Ingredient breakdown */}
          <Text style={[s.divLabel, { ...mut, marginTop: 20, marginBottom: 8 }]}>INGREDIENTS</Text>
          {ingredients.map(ing => {
            const m = ingMacros(ing);
            return (
              <View key={ing.uid} style={[s.reviewRow, { borderBottomColor: colors.border }]}>
                <Text style={[{ fontSize: 13, flex: 1 }, fg]}>{ing.name}</Text>
                <Text style={[{ fontSize: 12 }, mut]}>{ing.weightGrams}g</Text>
                <Text style={[{ fontSize: 12, fontWeight: '600', marginLeft: 12 }, fg]}>{m.kcal} kcal</Text>
              </View>
            );
          })}
          {oilEntry && (
            <View style={[s.reviewRow, { borderBottomColor: OIL_COLOR, borderLeftWidth: 3, borderLeftColor: OIL_COLOR, paddingLeft: 10 }]}>
              <Text style={{ fontSize: 13, flex: 1, color: OIL_COLOR }}>{OIL_DATA[oilEntry.oilType].label}</Text>
              <Text style={{ fontSize: 12, color: OIL_COLOR }}>{oilEntry.weightGrams}g</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', marginLeft: 12, color: OIL_COLOR }}>{oilEntry.calories} kcal</Text>
            </View>
          )}
        </ScrollView>

        <View style={[s.footer, { paddingBottom: bottomPad + 12, borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <CTA label={`Log this meal — ${finalKcal} kcal`} onPress={handleLog} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 }}>
            <TouchableOpacity onPress={handleSaveTemplate} style={{ paddingVertical: 12 }}>
              <Text style={[{ fontSize: 13 }, mut]}>Save as template →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogAndAnother} style={{ paddingVertical: 12 }}>
              <Text style={{ fontSize: 13, fontFamily: F.bodyMed, color: colors.primary }}>Log & add another →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  // ── Step: Create Custom Food ──────────────────────────────────────────────────
  function renderCreateCustomFood() {
    const clamp = (v: string, min: number, max: number) => Math.min(max, Math.max(min, parseFloat(v) || 0));
    const calories = clamp(cfCalories, 0, 2000);
    const canSave = cfName.trim().length >= 1 && calories > 0;

    function handleSave() {
      saveCustomFood({
        id: 'custom_' + uid(),
        name: cfName.trim().slice(0, 200),
        caloriesPer100g:  calories,
        proteinPer100g:   clamp(cfProtein, 0, 900),
        carbsPer100g:     clamp(cfCarbs,   0, 900),
        fatPer100g:       clamp(cfFat,     0, 900),
        microsPer100g: createZeroMicros(),
        servingGrams: clamp(cfServing, 1, 2000) || 100,
        createdAt: new Date().toISOString(),
      });
      setCfName(''); setCfCalories(''); setCfProtein(''); setCfCarbs(''); setCfFat(''); setCfServing('100');
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      goBack();
    }

    const fields: { label: string; val: string; set: (v: string) => void; id: string }[] = [
      { label: 'Calories / 100g *', val: cfCalories, set: setCfCalories, id: 'cf_k' },
      { label: 'Protein (g) / 100g', val: cfProtein, set: setCfProtein, id: 'cf_p' },
      { label: 'Carbs (g) / 100g',  val: cfCarbs,   set: setCfCarbs,   id: 'cf_c' },
      { label: 'Fat (g) / 100g',    val: cfFat,     set: setCfFat,     id: 'cf_f' },
    ];

    return (
      <>
        <Header title="Custom Food" />
        <KeyboardAwareScrollView style={{ flex: 1 }} contentContainerStyle={[s.pad, { paddingBottom: bottomPad + 100 }]} bottomOffset={80}>
            <Text style={[s.stepTitle, fg]}>Add to My Foods</Text>
            <Text style={[{ fontSize: 13, marginBottom: 16 }, mut]}>Enter values per 100g from the nutrition label on the packaging.</Text>

            <Text style={[s.cfLabel, mut]}>Food name *</Text>
            <TextInput
              autoFocus value={cfName} onChangeText={setCfName}
              placeholder="e.g. Brand X Protein Bar"
              placeholderTextColor={colors.mutedForeground}
              onFocus={() => setFocusId('cf_n')} onBlur={() => setFocusId(null)}
              style={[s.mealNameInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: focusId === 'cf_n' ? ACCENT : colors.border, marginBottom: 16 }]}
            />

            <View style={s.cfGrid}>
              {fields.map(f => (
                <View key={f.id} style={s.cfCell}>
                  <Text style={[s.cfLabel, mut]}>{f.label}</Text>
                  <TextInput
                    value={f.val} onChangeText={f.set}
                    keyboardType="decimal-pad" placeholder="0"
                    placeholderTextColor={colors.mutedForeground}
                    onFocus={() => setFocusId(f.id)} onBlur={() => setFocusId(null)}
                    style={[s.cfInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: focusId === f.id ? ACCENT : colors.border }]}
                  />
                </View>
              ))}
            </View>

            <Text style={[s.cfLabel, { marginTop: 14 }, mut]}>Default serving (g)</Text>
            <TextInput
              value={cfServing} onChangeText={setCfServing}
              keyboardType="decimal-pad" placeholder="100"
              placeholderTextColor={colors.mutedForeground}
              onFocus={() => setFocusId('cf_s')} onBlur={() => setFocusId(null)}
              style={[s.mealNameInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: focusId === 'cf_s' ? ACCENT : colors.border }]}
            />
        </KeyboardAwareScrollView>
        <View style={[s.footer, { paddingBottom: bottomPad + 12, borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <CTA label="Save to My Foods" onPress={handleSave} disabled={!canSave} />
        </View>
      </>
    );
  }

  // ── Step: Saved Meals List ────────────────────────────────────────────────────
  function renderSavedMealsList() {
    const templates = getSavedMeals();

    function loadTemplate(t: SavedMealTemplate) {
      setMealName(t.name);
      setIngredients(t.ingredients.map(i => ({
        uid: uid(), foodId: i.foodId, name: i.name, nameHindi: '',
        weightGrams: i.weightGrams,
        caloriesPer100g: i.caloriesPer100g, proteinPer100g: i.proteinPer100g,
        carbsPer100g: i.carbsPer100g, fatPer100g: i.fatPer100g,
        microsPer100g: i.microsPer100g ?? legacyMicrosFrom(i as unknown as Record<string, unknown>),
      })));
      goTo(isCooked ? 'oil_check' : 'review');
    }

    return (
      <>
        <Header title="Saved Meals" />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.pad, { paddingBottom: bottomPad + 40 }]}>
          <Text style={[s.stepTitle, fg]}>Pick a template</Text>
          {templates.map(t => (
            <TouchableOpacity key={t.id} onPress={() => loadTemplate(t)}
              style={[s.optCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.75}>
              <View style={{ flex: 1 }}>
                <Text style={[{ fontSize: 15, fontWeight: '600', marginBottom: 6 }, fg]}>{t.name}</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Text style={[{ fontSize: 13, fontWeight: '600', color: ACCENT }]}>{t.totalCalories} kcal</Text>
                  <Text style={[{ fontSize: 12 }, mut]}>P:{t.totalProteinG}g · C:{t.totalCarbsG}g · F:{t.totalFatG}g</Text>
                </View>
                <Text style={[{ fontSize: 11, marginTop: 4 }, mut]}>{t.ingredients.length} ingredients</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
          {templates.length === 0 && (
            <Text style={[{ fontSize: 13, textAlign: 'center', marginTop: 40, lineHeight: 20 }, mut]}>
              No saved meals yet.{'\n'}Log a meal and tap "Save as template" in the review screen.
            </Text>
          )}
        </ScrollView>
      </>
    );
  }

  // ── Root render ───────────────────────────────────────────────────────────────
  const stepMap: Record<Step, () => React.ReactNode> = {
    classify:          renderClassify,
    how_to_log:        renderHowToLog,
    ai_capture:        renderAICapture,
    ai_scanning:       renderAIScanning,
    ai_review:         renderAIReview,
    ai_refine:         renderAIRefine,
    manual_log:        renderManualLog,
    oil_check:         renderOilCheck,
    review:            renderReview,
    create_custom_food: renderCreateCustomFood,
    saved_meals_list:  renderSavedMealsList,
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {stepMap[step]()}
      {burst.node}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const RADIUS = BRUTAL.radius;
const BORDER = BRUTAL.border;

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: BORDER },
  hBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  hTitle: { flex: 1, textAlign: 'center', fontFamily: F.displayBold, fontSize: 18, fontStyle: 'italic', letterSpacing: -0.5 },
  pad:    { padding: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: BORDER },
  stepTitle: { fontFamily: F.displayBold, fontSize: 26, fontStyle: 'italic', letterSpacing: -0.5, marginBottom: 20 },

  // CTAs
  ctaSecondary: { height: 52, borderRadius: RADIUS, borderWidth: BORDER, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  ctaSecondaryTxt: { fontFamily: F.bodyBold, fontSize: 14 },

  // Option cards (classify / how_to_log)
  optCard: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  optTag: { borderWidth: 2, borderRadius: RADIUS, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  optTagTxt: { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 0.5 },
  optTitle: { fontFamily: F.bodyBold, fontSize: 15, marginBottom: 3 },
  optSub:   { fontFamily: F.bodyReg,  fontSize: 13, lineHeight: 18 },

  // Total banner
  totalBanner: { padding: 16, alignItems: 'center', marginTop: 16, gap: 4 },
  totalKcal:   { fontFamily: F.monoSemi, fontSize: 26, letterSpacing: -0.5 },
  totalMacros: { fontFamily: F.mono, fontSize: 12 },

  // Macro pills in preview
  macroPill: { borderWidth: 2, borderRadius: RADIUS, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center', gap: 2 },
  macroPillDot: { width: 8, height: 8, marginBottom: 2 },

  // Meal name input
  mealNameInput: { height: 52, borderRadius: RADIUS, borderWidth: BORDER, paddingHorizontal: 16, fontFamily: F.bodyMed, fontSize: 15, marginBottom: 14 },

  // Chips row
  chipRow: { gap: 8, paddingBottom: 4 },
  chip:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS, borderWidth: BORDER },

  // Search
  searchBar:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: RADIUS, borderWidth: BORDER, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  searchInput: { flex: 1, fontFamily: F.bodyReg, fontSize: 14 },

  // Food list
  foodList: { borderRadius: RADIUS, borderWidth: BORDER, overflow: 'hidden', marginBottom: 8 },
  listHead: { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 1, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4 },
  foodRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  customBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS },
  nonVegDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B2F' },

  // Added ingredient cards
  ingCard: { borderRadius: RADIUS, borderWidth: BORDER, padding: 12, marginBottom: 8 },

  // Section divider
  divRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 8 },
  divLabel: { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 1 },

  // Custom food link
  customFoodLink: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },

  // Editor (ingredient add panel)
  backToSearch:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  editorFoodName: { fontFamily: F.displayBold, fontSize: 24, fontStyle: 'italic', letterSpacing: -0.5, marginBottom: 2 },
  editorBox:      { borderRadius: RADIUS, borderWidth: BORDER, padding: 16 },
  boxLabel:       { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 0.8, marginBottom: 12 },

  // Stepper
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  stepBtn: { width: 48, height: 48, borderRadius: RADIUS, borderWidth: BORDER, alignItems: 'center', justifyContent: 'center' },
  stepVal: { alignItems: 'center', minWidth: 80 },

  // Gram input
  gramRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  gramInput: { width: 120, height: 68, textAlign: 'center', fontFamily: F.monoSemi, fontSize: 36, borderRadius: RADIUS, borderWidth: BORDER },

  // Preset gram chips
  presetChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS, borderWidth: BORDER },

  // Live macro preview
  livePreview: { borderRadius: RADIUS, borderWidth: BORDER, padding: 20, alignItems: 'center', marginTop: 14 },

  // AI refine
  refineInput: { width: 72, height: 40, textAlign: 'center', fontFamily: F.monoSemi, fontSize: 18, borderRadius: RADIUS, borderWidth: BORDER },

  // AI steps
  photoBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: RADIUS, borderWidth: BORDER },
  previewImg: { width: '100%', height: 180, borderRadius: RADIUS },
  pulseRing:  { position: 'absolute', top: '35%', left: '40%', width: 40, height: 40, borderRadius: 20, borderWidth: 2 },
  oilBanner:  { borderWidth: BORDER, borderRadius: RADIUS, padding: 12, marginBottom: 12 },
  noteBanner: { borderWidth: BORDER, borderRadius: RADIUS, padding: 12, marginBottom: 12 },
  decisionBox:{ borderWidth: BORDER, borderRadius: RADIUS, padding: 14, marginBottom: 16 },

  // Oil check
  oilHero:      { padding: 20, gap: 8 },
  oilHeroTitle: { fontFamily: F.displayBold, fontSize: 22, fontStyle: 'italic', letterSpacing: -0.5 },
  oilHeroSub:   { fontFamily: F.bodyReg, fontSize: 13, lineHeight: 19 },
  oilYesCard:   { padding: 18, alignItems: 'center' },
  oilYesTxt:    { fontFamily: F.bodyBold, fontSize: 16 },
  oilIcon:      { width: 56, height: 56, borderRadius: RADIUS, borderWidth: BORDER, alignItems: 'center', justifyContent: 'center' },

  // Review
  reviewMacroCard: { borderWidth: BORDER, borderRadius: RADIUS, padding: 24, alignItems: 'center', marginBottom: 4 },
  reviewRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: BORDER },

  // Custom food form
  cfGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cfCell:  { width: '47%' },
  cfInput: { height: 52, borderRadius: RADIUS, borderWidth: BORDER, paddingHorizontal: 12, fontFamily: F.monoSemi, fontSize: 18, textAlign: 'center' },
  cfLabel: { fontFamily: F.monoSemi, fontSize: 11, marginBottom: 5, letterSpacing: 0.5 },
  pill:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS },
});
