// THE REVEAL - neo-brutalist signature moment
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useProfile } from "@/stores/profile-store";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { useColors } from "@/hooks/useColors";
import { F } from "@/constants/fonts";
import { BRUTAL } from "@/constants/brutal";
import { BrutalButton, BrutalBox } from "@/components/brutal";
import { DUR } from "@/constants/motion";

const GOAL_LABELS: Record<string, string> = {
  fat_loss: "fat loss", recomp: "recomposition", muscle_gain: "muscle gain", maintain: "maintain",
};

export default function Step5() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, result } = useProfile();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const heroFade = useRef(new Animated.Value(0)).current;
  const genericOpacity = useRef(new Animated.Value(0)).current;
  const strikeWidth = useRef(new Animated.Value(0)).current;
  const genericFade = useRef(new Animated.Value(1)).current;
  const realFade = useRef(new Animated.Value(0)).current;
  const underlineWidth = useRef(new Animated.Value(0)).current;
  const subFade = useRef(new Animated.Value(0)).current;
  const gridFade = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;

  const realCalories = result?.macros?.calories ?? 0;
  const genericCalories = Math.round((realCalories / 100) * 118);
  const [displayNum, setDisplayNum] = useState(0);

  useEffect(() => {
    let mounted = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const t = (fn: () => void, ms: number) => { const id = setTimeout(fn, ms); timers.push(id); return id; };

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!mounted) return;
      if (reduced) {
        [heroFade, genericOpacity, genericFade, realFade, subFade, gridFade, ctaFade].forEach((v) => v.setValue(1));
        strikeWidth.setValue(1); underlineWidth.setValue(1); setDisplayNum(realCalories);
        return;
      }
      Animated.timing(heroFade, { toValue: 1, duration: DUR.base, useNativeDriver: true }).start();
      t(() => { if (mounted) Animated.timing(genericOpacity, { toValue: 1, duration: DUR.fast, useNativeDriver: true }).start(); }, 400);
      t(() => { if (mounted) Animated.timing(strikeWidth, { toValue: 1, duration: 220, useNativeDriver: false }).start(); }, 1100);
      t(() => { if (mounted) Animated.timing(genericFade, { toValue: 0.4, duration: DUR.fast, useNativeDriver: true }).start(); }, 1320);
      t(() => {
        if (!mounted) return;
        Animated.timing(realFade, { toValue: 1, duration: DUR.fast, useNativeDriver: true }).start();
        const duration = DUR.reveal; const start = Date.now();
        const tick = () => {
          if (!mounted) return;
          const p = Math.min((Date.now() - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplayNum(Math.round(eased * realCalories));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, 1550);
      t(() => { if (mounted) Animated.timing(underlineWidth, { toValue: 1, duration: 400, useNativeDriver: false }).start(); }, 2400);
      t(() => {
        if (!mounted) return;
        Animated.stagger(100, [
          Animated.timing(subFade, { toValue: 1, duration: DUR.fast, useNativeDriver: true }),
          Animated.timing(gridFade, { toValue: 1, duration: 260, useNativeDriver: true }),
          Animated.timing(ctaFade, { toValue: 1, duration: 260, useNativeDriver: true }),
        ]).start();
      }, 2850);
    });

    return () => {
      mounted = false;
      timers.forEach(clearTimeout);
      [heroFade, genericOpacity, genericFade, realFade, subFade, gridFade, ctaFade,
       strikeWidth, underlineWidth].forEach((v) => v.stopAnimation());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const macros = result?.macros;
  const calories = result?.calories;
  const neatScore = (calories as any)?.neatScore as number | undefined;
  const goalLabel = profile?.goalMode ? GOAL_LABELS[profile.goalMode] : null;

  const goToResults = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Stop all in-flight animations synchronously before navigating.
    // Without this, the native animation thread can fire one more frame
    // after React starts tearing down the view tree, causing addViewAt.
    [heroFade, genericOpacity, genericFade, realFade, subFade, gridFade, ctaFade,
     strikeWidth, underlineWidth].forEach(v => v.stopAnimation());
    // Defer navigation by two native frames so the stop propagates to the
    // native thread before Fabric destroys the view tree.
    storage.set(STORAGE_KEYS.ONBOARDING_JUST_DONE, true);
    requestAnimationFrame(() => requestAnimationFrame(() => router.replace("/(tabs)/results")));
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: topPad + 28, paddingBottom: insets.bottom + 150 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[s.hero, { opacity: heroFade }]}>
          <Text style={[s.heading, { color: colors.foreground }]}>your plan{"\n"}is ready.</Text>
          {goalLabel ? (
            <View style={[s.goalBadge, { backgroundColor: colors.primary, borderColor: colors.foreground }]}>
              <Text style={[s.goalText, { color: colors.primaryForeground }]}>{goalLabel}</Text>
            </View>
          ) : null}
        </Animated.View>

        {/* Reveal */}
        <View style={s.revealBlock}>
          <Animated.View style={[s.genericRow, { opacity: genericOpacity }]}>
            <Text style={[s.revealLabel, { color: colors.mutedForeground }]}>WHAT OTHER APPS TELL YOU</Text>
            <View style={s.strikeContainer}>
              <Animated.Text style={[s.genericNum, { color: colors.mutedForeground, opacity: genericFade }]}>
                {genericCalories.toLocaleString()} kcal
              </Animated.Text>
              <Animated.View style={[s.strikeLine, { backgroundColor: colors.persimmon, width: strikeWidth.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
            </View>
          </Animated.View>

          {/* Real number on the yellow pop block */}
          <Animated.View style={{ opacity: realFade }}>
            <Text style={[s.revealLabel, { color: colors.foreground, marginBottom: 8 }]}>YOUR REAL NUMBER</Text>
            <View style={s.numShadowWrap}>
              <View style={[StyleSheet.absoluteFillObject, { pointerEvents: "none", transform: [{ translateX: BRUTAL.shadow }, { translateY: BRUTAL.shadow }], backgroundColor: colors.foreground, borderRadius: BRUTAL.radius }]} />
              <View style={[s.numBox, { backgroundColor: colors.highlight, borderColor: colors.foreground }]}>
                <Text style={[s.realNum, { color: "#111111" }]}>{displayNum.toLocaleString()}</Text>
                <Text style={[s.realUnit, { color: "#111111" }]}>kcal / day</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.Text style={[s.revealSub, { color: colors.mutedForeground, opacity: subFade }]}>
            built from mifflin-st jeor bmr and your neat score. not a guess.
          </Animated.Text>
        </View>

        {/* Macros */}
        {macros ? (
          <Animated.View style={[s.grid, { opacity: gridFade }]}>
            <Stat label="PROTEIN" value={`${macros.proteinG}g`} sub={`${(macros.proteinG / (profile?.weightKg ?? 70)).toFixed(1)} g/kg`} colors={colors} />
            <Stat label="CARBS" value={`${macros.carbG}g`} sub="per day" colors={colors} />
            <Stat label="FAT" value={`${macros.fatG}g`} sub="per day" colors={colors} />
            <Stat label="FIBER" value={`${macros.fiberG}g`} sub="minimum" colors={colors} />
          </Animated.View>
        ) : null}

        {/* NEAT */}
        {calories ? (
          <Animated.View style={{ opacity: gridFade }}>
            <BrutalBox style={s.neat} offset={4}>
              <View style={{ gap: 3 }}>
                <Text style={[s.neatLabel, { color: colors.mutedForeground }]}>NEAT CATEGORY</Text>
                <Text style={[s.neatValue, { color: colors.foreground }]}>{calories.neatCategory.replace(/_/g, " ")}</Text>
              </View>
              {neatScore !== undefined ? (
                <View style={[s.neatBadge, { backgroundColor: colors.primary, borderColor: colors.foreground }]}>
                  <Text style={[s.neatNum, { color: colors.primaryForeground }]}>{neatScore}</Text>
                  <Text style={[s.neatDen, { color: colors.primaryForeground }]}>/100</Text>
                </View>
              ) : null}
            </BrutalBox>
          </Animated.View>
        ) : null}
      </ScrollView>

      <Animated.View style={[s.footer, { backgroundColor: colors.background, borderTopColor: colors.foreground, paddingBottom: insets.bottom + 18, opacity: ctaFade }]}>
        <BrutalButton
          label="see my plan"
          icon={<Feather name="arrow-right" size={18} color={colors.primaryForeground} />}
          onPress={goToResults}
        />

        {/* Dial-in path: food preferences + goal precision */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            [heroFade, genericOpacity, genericFade, realFade, subFade, gridFade, ctaFade,
             strikeWidth, underlineWidth].forEach(v => v.stopAnimation());
            requestAnimationFrame(() => requestAnimationFrame(() => router.push("/(onboarding)/step6" as any)));
          }}
          style={[s.dialCard, { borderColor: colors.foreground, backgroundColor: colors.card }]}
        >
          <View style={s.dialInner}>
            <View style={[s.dialDot, { backgroundColor: colors.highlight, borderColor: colors.foreground }]} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[s.dialTitle, { color: colors.foreground }]}>dial it in first</Text>
              <Text style={[s.dialSub, { color: colors.mutedForeground }]}>
                food preferences, diet type, goal timeline. 2 min. better food recs.
              </Text>
            </View>
            <Feather name="arrow-right" size={16} color={colors.foreground} />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function Stat({ label, value, sub, colors }: { label: string; value: string; sub: string; colors: ReturnType<typeof useColors> }) {
  return (
    <BrutalBox style={s.statCard} offset={4}>
      <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[s.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[s.statSub, { color: colors.mutedForeground }]}>{sub}</Text>
    </BrutalBox>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1 },
  scroll:      { paddingHorizontal: 24, gap: 24 },
  hero:        { gap: 12 },
  heading:     { fontFamily: F.displayBold, fontSize: 40, fontStyle: "italic", letterSpacing: -1.5, lineHeight: 42 },
  goalBadge:   { alignSelf: "flex-start", borderWidth: BRUTAL.border, paddingHorizontal: 14, paddingVertical: 6, borderRadius: BRUTAL.radius },
  goalText:    { fontFamily: F.bodyBold, fontSize: 13 },

  revealBlock: { gap: 18 },
  revealLabel: { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 1 },
  genericRow:  { gap: 6 },
  strikeContainer: { position: "relative", alignSelf: "flex-start" },
  genericNum:  { fontFamily: F.mono, fontSize: 28 },
  strikeLine:  { position: "absolute", top: "50%", left: 0, height: 3, marginTop: -1.5 },

  numShadowWrap: { position: "relative", alignSelf: "stretch" },
  numBox:      { borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, paddingVertical: 20, paddingHorizontal: 22 },
  realNum:     { fontFamily: F.monoSemi, fontSize: 64, letterSpacing: -2, lineHeight: 68 },
  realUnit:    { fontFamily: F.monoMed, fontSize: 16, marginTop: 2 },
  revealSub:   { fontFamily: F.bodyReg, fontSize: 14, lineHeight: 21 },

  grid:        { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  statCard:    { flex: 1, minWidth: "44%", padding: 14, gap: 3 },
  statLabel:   { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 0.8 },
  statValue:   { fontFamily: F.monoSemi, fontSize: 26 },
  statSub:     { fontFamily: F.bodyReg, fontSize: 11 },

  neat:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  neatLabel:   { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 0.8 },
  neatValue:   { fontFamily: F.bodyBold, fontSize: 16, textTransform: "capitalize" },
  neatBadge:   { flexDirection: "row", alignItems: "baseline", gap: 1, borderWidth: BRUTAL.border, paddingHorizontal: 12, paddingVertical: 7, borderRadius: BRUTAL.radius },
  neatNum:     { fontFamily: F.monoSemi, fontSize: 22 },
  neatDen:     { fontFamily: F.bodyMed, fontSize: 11 },

  footer:      { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 16, borderTopWidth: BRUTAL.border, gap: 12 },
  dialCard:    { borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, padding: 14 },
  dialInner:   { flexDirection: "row", alignItems: "center", gap: 12 },
  dialDot:     { width: 12, height: 12, borderWidth: 2, flexShrink: 0 },
  dialTitle:   { fontFamily: F.bodyBold, fontSize: 15 },
  dialSub:     { fontFamily: F.bodyReg, fontSize: 12, lineHeight: 17 },
});
