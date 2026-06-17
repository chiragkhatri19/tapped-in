import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Platform, Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Recipe, DietType, MealType, CookingMethod } from './types';
import { R, ALLERGENS, METHOD_LABELS, EVIDENCE } from './types';
import { computeQualityScore, computeQualityReason } from './helpers';

interface Props {
  onCancel: () => void;
  onSubmit: (recipe: Recipe) => void;
}

const DIET_OPTS: { key: DietType; label: string }[] = [
  { key: 'veg', label: 'Veg' },
  { key: 'eggetarian', label: 'Eggetarian' },
  { key: 'non_veg', label: 'Non-Veg' },
];
const MEAL_OPTS: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' }, { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },       { key: 'snack', label: 'Snack' },
  { key: 'pre_workout', label: 'Pre WO' },  { key: 'post_workout', label: 'Post WO' },
];
const METHOD_OPTS: { key: CookingMethod; label: string }[] = [
  { key: 'air_fryer', label: 'Air Fryer' }, { key: 'stovetop', label: 'Stovetop' },
  { key: 'oven', label: 'Oven' },            { key: 'no_cook', label: 'No Cook' },
  { key: 'microwave', label: 'Microwave' },
];

export default function SubmitRecipe({ onCancel, onSubmit }: Props) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [step, setStep] = useState(1);
  const TOTAL = 8;

  // Step 1
  const [coverUri, setCoverUri] = useState<string | null>(null);
  // Step 2
  const [name, setName]        = useState('');
  const [desc, setDesc]        = useState('');
  const [author, setAuthor]    = useState('');
  // Step 3
  const [diet, setDiet]        = useState<DietType | null>(null);
  const [meal, setMeal]        = useState<MealType | null>(null);
  const [method, setMethod]    = useState<CookingMethod | null>(null);
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('');
  // Step 4
  const [allergens, setAllergens] = useState<string[]>([]);
  // Step 5
  const [ingredients, setIngredients] = useState<{ name: string; grams: string; notes: string }[]>([]);
  // Step 6
  const [steps, setSteps]      = useState<string[]>([]);
  // Step 7
  const [cal, setCal]          = useState('');
  const [protein, setProtein]  = useState('');
  const [carbs, setCarbs]      = useState('');
  const [fat, setFat]          = useState('');
  const [ironMg, setIronMg]    = useState('');
  const [calciumMg, setCalciumMg] = useState('');
  const [b12Mcg, setB12Mcg]   = useState('');
  const [vitDIu, setVitDIu]   = useState('');
  const [zincMg, setZincMg]   = useState('');
  const [expandProteinEvidence, setExpandProteinEvidence] = useState(false);

  const proteinNum = parseFloat(protein) || 0;
  const proteinOk  = proteinNum >= 20;

  async function pickImage() {
    if (Platform.OS === 'web') {
      // Web: use input file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setCoverUri(url);
        }
      };
      input.click();
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload a cover image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
    }
  }

  function canAdvance(): boolean {
    switch (step) {
      case 1: return !!coverUri;
      case 2: return name.trim().length > 0;
      case 3: return !!diet && !!meal && !!method && prepTime.trim().length > 0 && servings.trim().length > 0;
      case 7: return proteinOk && cal.trim().length > 0 && carbs.trim().length > 0 && fat.trim().length > 0;
      default: return true;
    }
  }

  function handleNext() {
    if (step < TOTAL) setStep(s => s + 1);
  }
  function handleBack() {
    if (step > 1) setStep(s => s - 1);
    else onCancel();
  }

  function handlePublish() {
    const macros = {
      calories: parseFloat(cal) || 0,
      proteinG: proteinNum,
      carbsG:   parseFloat(carbs) || 0,
      fatG:     parseFloat(fat) || 0,
    };
    const micros = {
      ironMg:     parseFloat(ironMg) || 0,
      calciumMg:  parseFloat(calciumMg) || 0,
      b12Mcg:     parseFloat(b12Mcg) || 0,
      vitaminDIu: parseFloat(vitDIu) || 0,
      zincMg:     parseFloat(zincMg) || 0,
    };
    const prepTimeMin = parseFloat(prepTime) || 0;
    const recipe: Recipe = {
      id:             Date.now().toString(),
      title:          name.trim(),
      coverImage:     coverUri!,
      description:    desc.trim(),
      dietType:       diet!,
      mealType:       meal!,
      cookingMethod:  method!,
      prepTimeMin,
      servings:       parseFloat(servings) || 1,
      allergens,
      ingredients:    ingredients.map(i => ({ name: i.name, grams: parseFloat(i.grams) || 0, notes: i.notes || undefined })),
      steps:          steps.filter(s => s.trim().length > 0),
      macrosPerServing: macros,
      microsPerServing: micros,
      aiQualityScore:   computeQualityScore(macros, micros, prepTimeMin),
      aiQualityReason:  computeQualityReason(macros, micros, prepTimeMin),
      upvotes:    0,
      postedAt:   new Date().toISOString(),
      authorLabel: author.trim() || 'Anonymous',
    };
    onSubmit(recipe);
  }

  const progressPct = ((step - 1) / (TOTAL - 1)) * 100;

  const macrosForReview = {
    calories: parseFloat(cal) || 0, proteinG: proteinNum,
    carbsG: parseFloat(carbs) || 0, fatG: parseFloat(fat) || 0,
  };
  const microsForReview = {
    ironMg: parseFloat(ironMg) || 0, calciumMg: parseFloat(calciumMg) || 0,
    b12Mcg: parseFloat(b12Mcg) || 0, vitaminDIu: parseFloat(vitDIu) || 0, zincMg: parseFloat(zincMg) || 0,
  };
  const previewScore = computeQualityScore(macrosForReview, microsForReview, parseFloat(prepTime) || 0);
  const previewReason = computeQualityReason(macrosForReview, microsForReview, parseFloat(prepTime) || 0);

  return (
    <View style={[s.root, { paddingTop: topPad }]}>
      {/* Progress header */}
      <View style={s.progressHeader}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={R.fg} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.stepLabel}>Step {step} of {TOTAL}</Text>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${progressPct}%` as `${number}%` }]} />
          </View>
        </View>
      </View>

      <KeyboardAwareScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bottomOffset={80}>

        {/* ── Step 1: Cover Photo ── */}
        {step === 1 && (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Cover Photo</Text>
            <Text style={s.stepSub}>A good image makes people click. Required.</Text>
            <TouchableOpacity style={s.uploadArea} onPress={pickImage} activeOpacity={0.8}>
              {coverUri ? (
                <Image source={{ uri: coverUri }} style={s.preview} contentFit="cover" />
              ) : (
                <View style={s.uploadPlaceholder}>
                  <Ionicons name="camera-outline" size={40} color={R.muted} />
                  <Text style={s.uploadText}>Tap to upload photo</Text>
                  <Text style={s.uploadSub}>JPG, PNG or WebP</Text>
                </View>
              )}
            </TouchableOpacity>
            {coverUri && (
              <TouchableOpacity style={s.changePhoto} onPress={pickImage} activeOpacity={0.7}>
                <Text style={s.changePhotoText}>Change photo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Step 2: Basic Info ── */}
        {step === 2 && (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Basic Info</Text>
            <Field label="Recipe name *" maxLength={60}>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. High-Protein Paneer Bhurji"
                placeholderTextColor={R.muted}
                maxLength={60}
              />
            </Field>
            <Field label="Description (1–3 sentences)" maxLength={200}>
              <TextInput
                style={[s.input, s.textarea]}
                value={desc}
                onChangeText={setDesc}
                placeholder="What makes this recipe worth posting?"
                placeholderTextColor={R.muted}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </Field>
            <Field label="Your display name">
              <TextInput
                style={s.input}
                value={author}
                onChangeText={setAuthor}
                placeholder="e.g. Rohan M."
                placeholderTextColor={R.muted}
              />
            </Field>
          </View>
        )}

        {/* ── Step 3: Classification ── */}
        {step === 3 && (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Classification</Text>
            <Text style={s.fieldLabel}>Diet type</Text>
            <View style={s.chipRow}>
              {DIET_OPTS.map(o => (
                <TouchableOpacity key={o.key} style={[s.optChip, diet === o.key && s.optChipActive]} onPress={() => setDiet(o.key)} activeOpacity={0.7}>
                  <Text style={[s.optChipText, diet === o.key && s.optChipTextActive]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.fieldLabel}>Meal type</Text>
            <View style={s.chipRow}>
              {MEAL_OPTS.map(o => (
                <TouchableOpacity key={o.key} style={[s.optChip, meal === o.key && s.optChipActive]} onPress={() => setMeal(o.key)} activeOpacity={0.7}>
                  <Text style={[s.optChipText, meal === o.key && s.optChipTextActive]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.fieldLabel}>Cooking method</Text>
            <View style={s.chipRow}>
              {METHOD_OPTS.map(o => (
                <TouchableOpacity key={o.key} style={[s.optChip, method === o.key && s.optChipActive]} onPress={() => setMethod(o.key)} activeOpacity={0.7}>
                  <Text style={[s.optChipText, method === o.key && s.optChipTextActive]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Prep time (min)</Text>
                <TextInput style={s.input} value={prepTime} onChangeText={setPrepTime} placeholder="15" placeholderTextColor={R.muted} inputMode="decimal" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Servings</Text>
                <TextInput style={s.input} value={servings} onChangeText={setServings} placeholder="2" placeholderTextColor={R.muted} inputMode="decimal" />
              </View>
            </View>
          </View>
        )}

        {/* ── Step 4: Allergens ── */}
        {step === 4 && (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Allergens</Text>
            <Text style={s.stepSub}>Select all that apply — optional.</Text>
            <View style={s.chipRow}>
              {ALLERGENS.map(a => {
                const on = allergens.includes(a);
                return (
                  <TouchableOpacity
                    key={a}
                    style={[s.optChip, on && s.optChipActive]}
                    onPress={() => setAllergens(prev => on ? prev.filter(x => x !== a) : [...prev, a])}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.optChipText, on && s.optChipTextActive]}>{a}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Step 5: Ingredients ── */}
        {step === 5 && (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Ingredients</Text>
            {ingredients.map((ing, i) => (
              <View key={i} style={s.ingInputRow}>
                <TextInput
                  style={[s.input, { flex: 2 }]}
                  value={ing.name}
                  onChangeText={v => setIngredients(prev => prev.map((x, j) => j === i ? { ...x, name: v } : x))}
                  placeholder="Name"
                  placeholderTextColor={R.muted}
                />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={ing.grams}
                  onChangeText={v => setIngredients(prev => prev.map((x, j) => j === i ? { ...x, grams: v } : x))}
                  placeholder="g"
                  placeholderTextColor={R.muted}
                  inputMode="decimal"
                />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={ing.notes}
                  onChangeText={v => setIngredients(prev => prev.map((x, j) => j === i ? { ...x, notes: v } : x))}
                  placeholder="Notes"
                  placeholderTextColor={R.muted}
                />
                <TouchableOpacity onPress={() => setIngredients(prev => prev.filter((_, j) => j !== i))} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={22} color={R.muted} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => setIngredients(prev => [...prev, { name: '', grams: '', notes: '' }])}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color={R.primary} />
              <Text style={s.addBtnText}>Add Ingredient</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 6: Instructions ── */}
        {step === 6 && (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Instructions</Text>
            {steps.map((step_text, i) => (
              <View key={i} style={s.stepInputRow}>
                <View style={s.stepNumBadge}>
                  <Text style={s.stepNumText}>{i + 1}</Text>
                </View>
                <TextInput
                  style={[s.input, s.textarea, { flex: 1 }]}
                  value={step_text}
                  onChangeText={v => setSteps(prev => prev.map((x, j) => j === i ? v : x))}
                  placeholder={`Step ${i + 1}`}
                  placeholderTextColor={R.muted}
                  multiline
                  numberOfLines={2}
                />
                <TouchableOpacity onPress={() => setSteps(prev => prev.filter((_, j) => j !== i))} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={22} color={R.muted} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => setSteps(prev => [...prev, ''])}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color={R.primary} />
              <Text style={s.addBtnText}>Add Step</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 7: Macros ── */}
        {step === 7 && (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Macros per Serving</Text>
            <Text style={s.stepSub}>Your calculation. All numbers are per serving.</Text>
            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Calories *</Text>
                <TextInput style={s.input} value={cal} onChangeText={setCal} placeholder="310" placeholderTextColor={R.muted} inputMode="decimal" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Protein (g) *</Text>
                <TextInput style={[s.input, !proteinOk && protein.length > 0 ? s.inputWarn : undefined]} value={protein} onChangeText={setProtein} placeholder="22" placeholderTextColor={R.muted} inputMode="decimal" />
              </View>
            </View>
            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Carbs (g) *</Text>
                <TextInput style={s.input} value={carbs} onChangeText={setCarbs} placeholder="8" placeholderTextColor={R.muted} inputMode="decimal" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Fat (g) *</Text>
                <TextInput style={s.input} value={fat} onChangeText={setFat} placeholder="22" placeholderTextColor={R.muted} inputMode="decimal" />
              </View>
            </View>

            {/* Protein gate */}
            {protein.length > 0 && (
              <View style={[s.gateBox, proteinOk ? s.gateOk : s.gateWarn]}>
                <Ionicons name={proteinOk ? 'checkmark-circle' : 'warning'} size={16} color={proteinOk ? R.success : R.warning} />
                <Text style={[s.gateText, { color: proteinOk ? R.success : R.warning }]}>
                  {proteinOk ? `Protein per serving: ${proteinNum}g — good to go` : `Needs ≥20g protein per serving (currently ${proteinNum}g)`}
                </Text>
              </View>
            )}
            {!proteinOk && protein.length > 0 && (
              <View>
                <TouchableOpacity style={s.accordionBtn} onPress={() => setExpandProteinEvidence(p => !p)} activeOpacity={0.7}>
                  <Ionicons name="book-outline" size={13} color={R.primary} />
                  <Text style={s.accordionBtnText}>Why 20g?</Text>
                  <Ionicons name={expandProteinEvidence ? 'chevron-up' : 'chevron-down'} size={13} color={R.muted} />
                </TouchableOpacity>
                {expandProteinEvidence && (
                  <View style={s.evidenceCard}>
                    <Text style={s.evidenceClaim}>{EVIDENCE[0].claim}</Text>
                    <Text style={s.evidenceBody}>{EVIDENCE[0].shortExplanation}</Text>
                  </View>
                )}
              </View>
            )}

            <Text style={[s.fieldLabel, { marginTop: 8 }]}>Micros (optional — affects AI Quality Score)</Text>
            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Iron (mg)</Text>
                <TextInput style={s.input} value={ironMg} onChangeText={setIronMg} placeholder="0" placeholderTextColor={R.muted} inputMode="decimal" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Calcium (mg)</Text>
                <TextInput style={s.input} value={calciumMg} onChangeText={setCalciumMg} placeholder="0" placeholderTextColor={R.muted} inputMode="decimal" />
              </View>
            </View>
            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>B12 (mcg)</Text>
                <TextInput style={s.input} value={b12Mcg} onChangeText={setB12Mcg} placeholder="0" placeholderTextColor={R.muted} inputMode="decimal" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Vit D (IU)</Text>
                <TextInput style={s.input} value={vitDIu} onChangeText={setVitDIu} placeholder="0" placeholderTextColor={R.muted} inputMode="decimal" />
              </View>
            </View>
            <View style={{ width: '49%' }}>
              <Text style={s.fieldLabel}>Zinc (mg)</Text>
              <TextInput style={s.input} value={zincMg} onChangeText={setZincMg} placeholder="0" placeholderTextColor={R.muted} inputMode="decimal" />
            </View>
          </View>
        )}

        {/* ── Step 8: Review ── */}
        {step === 8 && (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Review & Publish</Text>
            {coverUri && (
              <Image source={{ uri: coverUri }} style={s.reviewImage} contentFit="cover" />
            )}
            <View style={s.reviewMeta}>
              <Text style={s.reviewTitle}>{name}</Text>
              <Text style={s.reviewSubMeta}>{author || 'Anonymous'} · {prepTime} min · {method ? METHOD_LABELS[method] : ''}</Text>
            </View>
            <View style={s.macroCardReview}>
              <Text style={s.cardLabel}>Nutrition per serving</Text>
              <View style={s.reviewMacroRow}>
                <ReviewMacro label="Cal" value={cal} color={R.primary} />
                <ReviewMacro label="Protein" value={`${protein}g`} color={R.protein} />
                <ReviewMacro label="Carbs" value={`${carbs}g`} color={R.carbs} />
                <ReviewMacro label="Fat" value={`${fat}g`} color={R.fat} />
              </View>
            </View>
            <View style={s.aiCard}>
              <View style={s.aiHeader}>
                <Ionicons name="sparkles" size={14} color={R.primary} />
                <Text style={s.aiTitle}>AI Quality Score: {previewScore}/10</Text>
              </View>
              <Text style={s.aiReason}>{previewReason}</Text>
            </View>
            <TouchableOpacity style={s.publishBtn} onPress={handlePublish} activeOpacity={0.85}>
              <Ionicons name="rocket-outline" size={18} color="#fff" />
              <Text style={s.publishBtnText}>Publish Recipe</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: bottomPad + 80 }} />
      </KeyboardAwareScrollView>

      {/* Nav buttons */}
      {step < 8 && (
        <View style={[s.navBar, { paddingBottom: bottomPad + 12 }]}>
          <TouchableOpacity style={s.navBack} onPress={handleBack} activeOpacity={0.8}>
            <Text style={s.navBackText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.navNext, !canAdvance() && s.navNextDisabled]}
            onPress={handleNext}
            disabled={!canAdvance()}
            activeOpacity={0.85}
          >
            <Text style={s.navNextText}>{step === TOTAL - 1 ? 'Review' : 'Next'}</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function Field({ label, maxLength, children }: { label: string; maxLength?: number; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.fieldLabel}>{label}{maxLength ? ` (${maxLength} chars max)` : ''}</Text>
      {children}
    </View>
  );
}

function ReviewMacro({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={[s.reviewMacroVal, { color }]}>{value}</Text>
      <Text style={s.reviewMacroLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: R.bg },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  backBtn:        { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: R.card, borderRadius: 10, borderWidth: 1, borderColor: R.border },
  stepLabel:      { fontSize: 12, color: R.muted, marginBottom: 4 },
  progressBar:    { height: 4, backgroundColor: R.card, borderRadius: 2 },
  progressFill:   { height: 4, backgroundColor: R.primary, borderRadius: 2 },
  scroll:         { paddingHorizontal: 16 },
  stepContent:    { gap: 14 },
  stepTitle:      { fontSize: 22, fontWeight: '700', color: R.fg },
  stepSub:        { fontSize: 13, color: R.muted, marginTop: -8 },
  fieldLabel:     { fontSize: 12, color: R.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 },
  input:          { backgroundColor: R.card, borderWidth: 1, borderColor: R.border, borderRadius: 10, padding: 12, color: R.fg, fontSize: 14 },
  inputWarn:      { borderColor: R.warning },
  textarea:       { minHeight: 72, textAlignVertical: 'top' },
  uploadArea:     { borderWidth: 2, borderColor: R.border, borderStyle: 'dashed', borderRadius: 14, overflow: 'hidden', minHeight: 200, alignItems: 'center', justifyContent: 'center' },
  uploadPlaceholder: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  uploadText:     { fontSize: 16, color: R.muted, fontWeight: '600' },
  uploadSub:      { fontSize: 12, color: R.muted },
  preview:        { width: '100%', height: 220 },
  changePhoto:    { alignSelf: 'center' },
  changePhotoText: { color: R.primary, fontSize: 14, fontWeight: '500' },
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  optChip:        { backgroundColor: R.chip, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  optChipActive:  { backgroundColor: R.primary },
  optChipText:    { color: R.fg, fontSize: 13, fontWeight: '500' },
  optChipTextActive: { color: '#fff' },
  twoCol:         { flexDirection: 'row', gap: 10 },
  gateBox:        { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8 },
  gateOk:         { backgroundColor: '#052e1a' },
  gateWarn:       { backgroundColor: '#1a1200' },
  gateText:       { flex: 1, fontSize: 13, fontWeight: '500' },
  accordionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  accordionBtnText: { flex: 1, fontSize: 13, color: R.primary, fontWeight: '500' },
  evidenceCard:   { backgroundColor: R.card, borderRadius: 8, padding: 12, gap: 6, borderWidth: 1, borderColor: R.border },
  evidenceClaim:  { fontSize: 13, fontWeight: '600', color: R.fg },
  evidenceBody:   { fontSize: 12, color: R.muted, lineHeight: 18 },
  ingInputRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addBtn:         { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: R.primary, borderRadius: 10, paddingVertical: 10, justifyContent: 'center' },
  addBtnText:     { color: R.primary, fontWeight: '600', fontSize: 14 },
  stepInputRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNumBadge:   { width: 26, height: 26, borderRadius: 13, backgroundColor: R.primary, alignItems: 'center', justifyContent: 'center', marginTop: 12, flexShrink: 0 },
  stepNumText:    { color: '#fff', fontSize: 12, fontWeight: '700' },
  navBar:         { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: R.border, backgroundColor: R.bg },
  navBack:        { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: R.card, alignItems: 'center', borderWidth: 1, borderColor: R.border },
  navBackText:    { color: R.fg, fontWeight: '600', fontSize: 15 },
  navNext:        { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: R.primary },
  navNextDisabled: { opacity: 0.4 },
  navNextText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
  reviewImage:    { width: '100%', height: 180, borderRadius: 12 },
  reviewMeta:     { gap: 4 },
  reviewTitle:    { fontSize: 18, fontWeight: '700', color: R.fg },
  reviewSubMeta:  { fontSize: 13, color: R.muted },
  macroCardReview: { backgroundColor: R.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: R.border, gap: 10 },
  cardLabel:      { fontSize: 11, color: R.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  reviewMacroRow: { flexDirection: 'row' },
  reviewMacroVal: { fontSize: 18, fontWeight: '700' },
  reviewMacroLabel: { fontSize: 11, color: R.muted },
  aiCard:         { backgroundColor: R.card, borderRadius: 12, padding: 14, gap: 8, borderWidth: 1, borderColor: R.border },
  aiHeader:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiTitle:        { fontSize: 14, fontWeight: '700', color: R.fg },
  aiReason:       { fontSize: 13, color: R.muted, lineHeight: 19 },
  publishBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: R.success, paddingVertical: 15, borderRadius: 12 },
  publishBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
