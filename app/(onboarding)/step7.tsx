// B2 + B3 - Goal precision + body + health (final Phase B screen)
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useOnboarding } from "@/context/onboarding-context";
import { useProfile } from "@/stores/profile-store";
import { useColors } from "@/hooks/useColors";
import { F } from "@/constants/fonts";
import { BRUTAL } from "@/constants/brutal";
import { BrutalButton, BrutalChip, BrutalInput, BrutalProgress } from "@/components/brutal";
import { Appear } from "@/components/motion/Appear";
import { GoalTimeline } from "@/types";

const TIMELINE_OPTS: { label: string; value: GoalTimeline }[] = [
  { label: "4 weeks", value: "4_weeks" }, { label: "8 weeks", value: "8_weeks" },
  { label: "3 months", value: "3_months" }, { label: "6 months", value: "6_months" },
  { label: "1 year", value: "1_year" }, { label: "no deadline", value: "no_deadline" },
];
const TIMELINE_WEEKS: Record<GoalTimeline, number | null> = {
  "4_weeks": 4, "8_weeks": 8, "3_months": 13, "6_months": 26, "1_year": 52, "no_deadline": null,
};
const HEALTH_CONDITIONS = [
  "bad knees", "lower back pain", "shoulder injury", "wrist pain",
  "heart condition", "herniated disc", "hip impingement", "none",
];

function realityCheck(goal: string, currentKg: number, targetKg: number, timeline: GoalTimeline): { text: string; ok: boolean } | null {
  const diff = Math.abs(targetKg - currentKg);
  const weeks = TIMELINE_WEEKS[timeline];
  if (!weeks || diff < 0.5) return null;
  if (goal === "recomp") return { text: "recomp: the scale may barely move while composition shifts. timeline is hard to pin down here.", ok: true };
  const rate = goal === "fat_loss" ? 0.625 : 0.375;
  const label = goal === "fat_loss" ? "fat loss" : "lean bulk";
  const need = Math.round(diff / rate);
  const months = Math.round(need / 4.33);
  const dur = need > 8 ? `${months} months` : `${need} weeks`;
  const ratio = weeks / need;
  const verdict = ratio >= 1.1 ? "realistic." : ratio >= 0.75 ? "tight, but doable." : "not feasible. move the target or the deadline.";
  return { text: `at a healthy ${label} rate you'd need about ${dur} for ${diff.toFixed(1)} kg. your timeline is ${verdict}`, ok: ratio >= 0.75 };
}

export default function Step7() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data } = useOnboarding();
  const { profile: savedProfile, saveProfile } = useProfile();

  const [targetWeight, setTargetWeight] = useState(data.targetWeightKg?.toString() ?? "");
  const [timeline, setTimeline] = useState<GoalTimeline | null>(data.goalTimeline ?? null);
  const [bodyFat, setBodyFat] = useState(data.bodyFatPercent?.toString() ?? "");
  const [conditions, setConditions] = useState<string[]>(data.healthConditions ?? []);
  const [notes, setNotes] = useState(data.healthNotes ?? "");
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const targetNum = parseFloat(targetWeight);
  const currentKg = savedProfile?.weightKg ?? 0;
  const goalMode = savedProfile?.goalMode ?? "recomp";

  const check = (!isNaN(targetNum) && targetNum > 0 && timeline && timeline !== "no_deadline")
    ? realityCheck(goalMode, currentKg, targetNum, timeline) : null;

  const toggleCondition = (c: string) => {
    Haptics.selectionAsync();
    if (c === "none") { setConditions(["none"]); return; }
    const without = conditions.filter((x) => x !== "none");
    setConditions(without.includes(c) ? without.filter((x) => x !== c) : [...without, c]);
  };

  const finish = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    if (savedProfile) {
      await saveProfile({
        ...savedProfile,
        targetWeightKg: !isNaN(targetNum) && targetNum > 0 ? targetNum : undefined,
        goalTimeline: timeline ?? undefined,
        bodyFatPercent: bodyFat ? parseFloat(bodyFat) : undefined,
        healthConditions: conditions.length > 0 ? conditions : undefined,
        healthNotes: notes.trim() || undefined,
      });
    }
    setSaving(false);
    router.replace("/(tabs)/results");
  };

  return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.content, { paddingTop: topPad + 20, paddingBottom: insets.bottom + 130 }]}
          showsVerticalScrollIndicator={false}
          bottomOffset={80}
        >
          <BrutalProgress step={2} total={2} />
          <Appear index={0}>
            <Text style={[s.phaseTag, { color: colors.foreground }]}>DIALING IT IN  ·  2 OF 2</Text>
            <Text style={[s.heading, { color: colors.foreground }]}>get precise.</Text>
            <Text style={[s.sub, { color: colors.mutedForeground }]}>all optional. skip anything you want.</Text>
          </Appear>

          <Appear index={1}><View style={s.section}>
            <Text style={[s.label, { color: colors.foreground }]}>TARGET WEIGHT</Text>
            <BrutalInput value={targetWeight} onChangeText={setTargetWeight} keyboardType="decimal-pad"
              placeholder={currentKg ? `${Math.round(currentKg * 0.9)}` : "67"}
              suffix={savedProfile?.unitSystem === "imperial" ? "lbs" : "kg"} />
          </View></Appear>

          <Appear index={2}><View style={s.section}>
            <Text style={[s.label, { color: colors.foreground }]}>BY WHEN?</Text>
            <View style={s.chipRow}>
              {TIMELINE_OPTS.map((o) => (
                <BrutalChip key={o.value} label={o.label} selected={timeline === o.value}
                  onPress={() => { Haptics.selectionAsync(); setTimeline(timeline === o.value ? null : o.value); }} />
              ))}
            </View>
          </View></Appear>

          {check ? (
            <View style={{ position: "relative" }}>
              <View style={[StyleSheet.absoluteFillObject, { pointerEvents: "none", transform: [{ translateX: 4 }, { translateY: 4 }], backgroundColor: colors.foreground, borderRadius: BRUTAL.radius }]} />
              <View style={{ borderWidth: BRUTAL.border, borderColor: colors.foreground, borderRadius: BRUTAL.radius, padding: 12, backgroundColor: check.ok ? colors.highlight : colors.persimmon }}>
                <Text style={{ fontFamily: F.bodySemi, fontSize: 13, lineHeight: 20, color: check.ok ? "#111111" : "#FFFFFF" }}>{check.text}</Text>
              </View>
            </View>
          ) : null}

          <View style={s.section}>
            <Text style={[s.label, { color: colors.foreground }]}>BODY FAT %</Text>
            <Text style={[s.hint, { color: colors.mutedForeground }]}>skip if unknown. we estimate from age and sex. guesses miss by 4 to 7%.</Text>
            <BrutalInput value={bodyFat} onChangeText={setBodyFat} keyboardType="numeric" placeholder="18" suffix="%" />
          </View>

          <View style={s.section}>
            <Text style={[s.label, { color: colors.foreground }]}>ANY LIMITATIONS?</Text>
            <Text style={[s.hint, { color: colors.mutedForeground }]}>we'll work around these in your workouts.</Text>
            <View style={s.chipRow}>
              {HEALTH_CONDITIONS.map((c) => (
                <BrutalChip key={c} label={c} selected={conditions.includes(c)} onPress={() => toggleCondition(c)} />
              ))}
            </View>
          </View>

          <View style={s.section}>
            <Text style={[s.label, { color: colors.foreground }]}>ANYTHING ELSE?</Text>
            <BrutalInput value={notes} onChangeText={setNotes} multiline placeholder="recovering from acl, mild scoliosis, asthma..." />
          </View>

          <View style={{ position: "relative" }}>
            <View style={[StyleSheet.absoluteFillObject, { pointerEvents: "none", transform: [{ translateX: 4 }, { translateY: 4 }], backgroundColor: colors.foreground, borderRadius: BRUTAL.radius }]} />
            <View style={{ borderWidth: BRUTAL.border, borderColor: colors.foreground, borderRadius: BRUTAL.radius, padding: 12, backgroundColor: colors.card }}>
              <Text style={{ fontFamily: F.bodyReg, fontSize: 12, lineHeight: 18, color: colors.mutedForeground }}>
                this isn't a clinical assessment. for serious conditions, see a physiotherapist before starting. we adapt exercises based on common modifications only.
              </Text>
            </View>
          </View>
        </KeyboardAwareScrollView>

        <View style={[s.footer, { backgroundColor: colors.background, borderTopColor: colors.foreground, paddingBottom: insets.bottom + 18 }]}>
          <BrutalButton label="see my plan" onPress={finish} loading={saving} />
          <Pressable onPress={() => router.replace("/(tabs)/results")} style={s.skip}>
            <Text style={[s.skipText, { color: colors.mutedForeground }]}>skip for now</Text>
          </Pressable>
        </View>
      </View>
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
  hint:     { fontFamily: F.bodyReg, fontSize: 12, marginTop: -4, lineHeight: 18 },
  chipRow:  { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  footer:   { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 16, borderTopWidth: BRUTAL.border, gap: 10 },
  skip:     { alignItems: "center", paddingVertical: 2 },
  skipText: { fontFamily: F.bodyMed, fontSize: 13 },
});
