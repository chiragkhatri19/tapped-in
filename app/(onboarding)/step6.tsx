// B1 - Food preferences (post-reveal, skippable)
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useOnboarding } from "@/context/onboarding-context";
import { useProfile } from "@/stores/profile-store";
import { useColors } from "@/hooks/useColors";
import { F } from "@/constants/fonts";
import { BRUTAL } from "@/constants/brutal";
import { BrutalButton, BrutalChip, BrutalProgress } from "@/components/brutal";
import { Appear } from "@/components/motion/Appear";
import { BudgetTier, CookingContext, DietType, MeatPreference } from "@/types";
import { SUPPLEMENTS } from "@/data/supplements";

const DIET_OPTIONS: { value: DietType; label: string; desc: string }[] = [
  { value: "vegan",      label: "vegan",          desc: "plant only. needs planning for b12, d3, iron, zinc, omega-3." },
  { value: "vegetarian", label: "vegetarian",     desc: "no meat or seafood. dairy and eggs may be in." },
  { value: "eggetarian", label: "eggetarian",     desc: "eggs give complete amino acids and top-tier bioavailability." },
  { value: "non_veg",    label: "non-vegetarian", desc: "meat gives complete protein plus iron, zinc, b12." },
];

const MEAT_OPTIONS: { value: MeatPreference; label: string }[] = [
  { value: "chicken", label: "chicken" }, { value: "lamb", label: "lamb / mutton" },
  { value: "beef", label: "beef" }, { value: "pork", label: "pork" },
  { value: "fish", label: "fish" }, { value: "seafood", label: "seafood" }, { value: "eggs", label: "eggs" },
];

const COOKING_OPTIONS: { value: CookingContext; label: string; desc: string }[] = [
  { value: "home_cooking", label: "home cooking",     desc: "you prep your own. get exact recipes with weights." },
  { value: "orders_out",   label: "order out mostly", desc: "delivery or restaurants. get smart ordering tips." },
  { value: "mixed",        label: "mix of both",      desc: "depends on the day. get both." },
];

const BUDGET_OPTIONS: { value: BudgetTier; label: string }[] = [
  { value: "no_restriction", label: "no restriction" },
  { value: "budget_conscious", label: "budget-conscious" },
  { value: "supplement_friendly", label: "supplement-friendly" },
];

export default function Step6() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const isEdit = params.edit === "true";
  const returnTo = params.returnTo as string | undefined;
  const { data, setData } = useOnboarding();
  const { profile: savedProfile, saveProfile } = useProfile();

  const [dietType, setDietType] = useState<DietType | null>(data.dietType ?? savedProfile?.dietType ?? null);
  const [meatPrefs, setMeatPrefs] = useState<MeatPreference[]>(data.meatPreferences ?? savedProfile?.meatPreferences ?? []);
  const [cookingCtx, setCookingCtx] = useState<CookingContext | null>(data.cookingContext ?? savedProfile?.cookingContext ?? null);
  const [budgetTier, setBudgetTier] = useState<BudgetTier | null>(data.budgetTier ?? savedProfile?.budgetTier ?? null);
  const [takesSupplements, setTakesSupplements] = useState<boolean | undefined>(data.takesSupplements ?? savedProfile?.takesSupplements);
  const [supplements, setSupplements] = useState<string[]>(data.supplements ?? savedProfile?.supplements ?? []);
  const [saving, setSaving] = useState(false);

  const needsMeat = dietType === "non_veg";
  const isValid = dietType !== null && (!needsMeat || meatPrefs.length > 0) && cookingCtx !== null && budgetTier !== null;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const toggleMeat = (m: MeatPreference) => {
    Haptics.selectionAsync();
    setMeatPrefs((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };
  const resolveMeat = (): MeatPreference[] =>
    dietType === "non_veg" ? meatPrefs : dietType === "eggetarian" ? ["eggs"] : [];
  const toggleSupplement = (id: string) => {
    Haptics.selectionAsync();
    setSupplements((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const save = async () => {
    if (!isValid || !dietType || !cookingCtx || !budgetTier) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    const supplementPatch = { takesSupplements, supplements: takesSupplements ? supplements : [] };
    if (savedProfile) {
      await saveProfile({ ...savedProfile, dietType, meatPreferences: resolveMeat(), cookingContext: cookingCtx, budgetTier, ...supplementPatch });
    }
    setData({ dietType, meatPreferences: resolveMeat(), cookingContext: cookingCtx, budgetTier, ...supplementPatch });
    setSaving(false);
    if (isEdit) {
      router.replace(returnTo === 'results' ? '/(tabs)/results' : '/(tabs)/index' as any);
    } else {
      router.push("/(onboarding)/step7" as any);
    }
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: topPad + 20, paddingBottom: insets.bottom + 130 }]}
        showsVerticalScrollIndicator={false}
      >
        <BrutalProgress step={1} total={2} />
        <Appear index={0}>
          <Text style={[s.phaseTag, { color: colors.foreground }]}>DIALING IT IN  ·  1 OF 2</Text>
          <Text style={[s.heading, { color: colors.foreground }]}>food preferences.</Text>
          <Text style={[s.sub, { color: colors.mutedForeground }]}>shapes meals and recipes. does not change your calorie target.</Text>
        </Appear>

        <Appear index={1}><View style={s.section}>
          <Text style={[s.label, { color: colors.foreground }]}>WHAT'S YOUR DIET?</Text>
          <View style={{ gap: 14 }}>
            {DIET_OPTIONS.map((o) => (
              <OptionRow key={o.value} label={o.label} desc={o.desc} selected={dietType === o.value}
                onPress={() => { Haptics.selectionAsync(); setDietType(o.value); if (o.value !== "non_veg") setMeatPrefs([]); }}
                colors={colors} />
            ))}
          </View>
        </View></Appear>

        {needsMeat ? (
          <View style={s.section}>
            <Text style={[s.label, { color: colors.foreground }]}>WHICH PROTEINS?</Text>
            <Text style={[s.hint, { color: colors.mutedForeground }]}>pick all that apply</Text>
            <View style={s.chipRow}>
              {MEAT_OPTIONS.map((m) => (
                <BrutalChip key={m.value} label={m.label} selected={meatPrefs.includes(m.value)} onPress={() => toggleMeat(m.value)} />
              ))}
            </View>
            {meatPrefs.length === 0 ? (
              <Text style={[s.hint, { color: colors.persimmon }]}>pick at least one to continue.</Text>
            ) : null}
          </View>
        ) : null}

        <Appear index={2}><View style={s.section}>
          <Text style={[s.label, { color: colors.foreground }]}>HOW DO YOU EAT?</Text>
          <View style={{ gap: 14 }}>
            {COOKING_OPTIONS.map((o) => (
              <OptionRow key={o.value} label={o.label} desc={o.desc} selected={cookingCtx === o.value}
                onPress={() => { Haptics.selectionAsync(); setCookingCtx(o.value); }} colors={colors} />
            ))}
          </View>
        </View></Appear>

        <Appear index={3}><View style={s.section}>
          <Text style={[s.label, { color: colors.foreground }]}>BUDGET APPROACH</Text>
          <View style={s.chipRow}>
            {BUDGET_OPTIONS.map((o) => (
              <BrutalChip key={o.value} label={o.label} selected={budgetTier === o.value}
                onPress={() => { Haptics.selectionAsync(); setBudgetTier(o.value); }} />
            ))}
          </View>
        </View></Appear>

        <Appear index={4}><View style={s.section}>
          <Text style={[s.label, { color: colors.foreground }]}>DO YOU TAKE ANY SUPPLEMENTS?</Text>
          <View style={s.chipRow}>
            <BrutalChip label="yes" selected={takesSupplements === true} onPress={() => { Haptics.selectionAsync(); setTakesSupplements(true); }} />
            <BrutalChip label="no" selected={takesSupplements === false} onPress={() => { Haptics.selectionAsync(); setTakesSupplements(false); setSupplements([]); }} />
          </View>
          {takesSupplements ? (
            <View style={s.chipRow}>
              {SUPPLEMENTS.slice(0, 9).map((supp) => (
                <BrutalChip key={supp.id} label={supp.label} selected={supplements.includes(supp.id)} onPress={() => toggleSupplement(supp.id)} />
              ))}
            </View>
          ) : takesSupplements === false ? (
            <Text style={[s.hint, { color: colors.mutedForeground }]}>most people miss vit D, omega-3, magnesium & B12 from food alone — you can track these daily.</Text>
          ) : null}
        </View></Appear>
      </ScrollView>

      <View style={[s.footer, { backgroundColor: colors.background, borderTopColor: colors.foreground, paddingBottom: insets.bottom + 18 }]}>
        <BrutalButton label="continue" onPress={save} disabled={!isValid} loading={saving} />
        <Pressable onPress={() => {
          if (isEdit) {
            router.replace(returnTo === 'results' ? '/(tabs)/results' : '/(tabs)/index' as any);
          } else {
            router.push("/(onboarding)/step7" as any);
          }
        }} style={s.skip}>
          <Text style={[s.skipText, { color: colors.mutedForeground }]}>skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}

function OptionRow({ label, desc, selected, onPress, colors }: {
  label: string; desc: string; selected: boolean; onPress: () => void; colors: ReturnType<typeof useColors>;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable onPress={onPress} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} style={{ position: "relative" }}>
      <View style={[StyleSheet.absoluteFillObject,
        { pointerEvents: "none", transform: [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }], backgroundColor: pressed ? "transparent" : colors.foreground, borderRadius: BRUTAL.radius }]} />
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 12,
        borderWidth: BRUTAL.border, borderColor: colors.foreground, borderRadius: BRUTAL.radius,
        backgroundColor: selected ? colors.primary : colors.card, padding: 14,
        transform: pressed ? [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }] : [],
      }}>
        <View style={{ flex: 1 }}>
          <Text style={[s.optLabel, { color: selected ? colors.primaryForeground : colors.foreground }]}>{label}</Text>
          <Text style={[s.optDesc, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>{desc}</Text>
        </View>
        {selected ? (
          <View style={[s.check, { backgroundColor: colors.highlight, borderColor: "#111111" }]}>
            <Text style={{ color: "#111111", fontFamily: F.bodyBold, fontSize: 13 }}>x</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1 },
  content:  { paddingHorizontal: 24, gap: 18 },
  phaseTag: { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 1 },
  heading:  { fontFamily: F.displayBold, fontSize: 32, fontStyle: "italic", letterSpacing: -1, marginTop: -8 },
  sub:      { fontFamily: F.bodyReg, fontSize: 14, lineHeight: 21, marginTop: -8 },
  section:  { gap: 10 },
  label:    { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 1 },
  hint:     { fontFamily: F.bodyReg, fontSize: 12, marginTop: -4 },
  optLabel: { fontFamily: F.bodyBold, fontSize: 15 },
  optDesc:  { fontFamily: F.bodyReg, fontSize: 12, marginTop: 2, lineHeight: 17 },
  check:    { width: 24, height: 24, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  chipRow:  { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  footer:   { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 16, borderTopWidth: BRUTAL.border, gap: 10 },
  skip:     { alignItems: "center", paddingVertical: 2 },
  skipText: { fontFamily: F.bodyMed, fontSize: 13 },
});
