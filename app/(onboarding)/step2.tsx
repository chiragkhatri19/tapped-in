// Goal + movement / NEAT (merged)
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useOnboarding } from "@/context/onboarding-context";
import { useColors } from "@/hooks/useColors";
import { F } from "@/constants/fonts";
import { BRUTAL } from "@/constants/brutal";
import { BrutalButton, BrutalChip, BrutalProgress } from "@/components/brutal";
import { Appear } from "@/components/motion/Appear";
import { EvidenceModal } from "@/components/EvidenceModal";
import { getEvidenceById } from "@/data/evidence";
import { GoalMode, JobType, EvidenceCard } from "@/types";

const GOALS: {
  value: GoalMode;
  label: string;
  tag: string;
  detail: string;
  evidenceId: string;
}[] = [
  { value: "fat_loss",    label: "fat loss",       tag: "reduce body fat",       detail: "150–200 kcal below maintenance", evidenceId: "goal_fat_loss_why" },
  { value: "recomp",      label: "recomposition",  tag: "lose fat, gain muscle", detail: "eat at maintenance",             evidenceId: "goal_recomp_why" },
  { value: "muscle_gain", label: "muscle gain",    tag: "build muscle",          detail: "150–200 kcal above maintenance", evidenceId: "goal_muscle_gain_why" },
];

const JOB_OPTIONS: { value: JobType; label: string; desc: string }[] = [
  { value: "desk_job",          label: "desk / office",     desc: "mostly seated, barely walking" },
  { value: "light_activity",    label: "light activity",    desc: "some walking, occasional standing" },
  { value: "moderate_activity", label: "moderate activity", desc: "on your feet a fair amount" },
  { value: "heavy_labor",       label: "heavy labour",      desc: "construction, delivery, trades" },
];

const STEPS_OPTIONS = [
  { label: "under 3k", value: 2500 },
  { label: "3k to 5k", value: 4000 },
  { label: "5k to 8k", value: 6500 },
  { label: "8k to 10k", value: 9000 },
  { label: "10k plus", value: 11000 },
];

const SITTING_OPTIONS = [
  { label: "under 4h", value: 3 },
  { label: "4 to 6h",  value: 5 },
  { label: "6 to 8h",  value: 7 },
  { label: "8 to 10h", value: 9 },
  { label: "10h plus", value: 11 },
];

export default function Step2() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { data, setData } = useOnboarding();

  const [goalMode, setGoalMode] = useState<GoalMode | null>(data.goalMode ?? null);
  const [jobType, setJobType] = useState<JobType | null>(data.jobType ?? null);
  const [dailySteps, setDailySteps] = useState(data.dailySteps ?? 4000);
  const [sitting, setSitting] = useState(data.sittingHoursPerDay ?? 7);
  const [activeCard, setActiveCard] = useState<EvidenceCard | null>(null);

  const isValid = goalMode !== null && jobType !== null;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const openWhy = (evidenceId: string) => {
    Haptics.selectionAsync();
    const card = getEvidenceById(evidenceId);
    if (card) setActiveCard(card);
  };

  const next = () => {
    if (!isValid || !goalMode || !jobType) return;
    Haptics.selectionAsync();
    setData({ goalMode, jobType, dailySteps, sittingHoursPerDay: sitting });
    router.push(from === 'profile' ? '/(onboarding)/step3?from=profile' : '/(onboarding)/step3' as never);
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <BrutalProgress step={2} total={3} />

        <Appear index={0}>
          <Text style={[s.heading, { color: colors.foreground }]}>goal & movement.</Text>
          <Text style={[s.sub, { color: colors.mutedForeground }]}>
            what you're after, and how much you move outside the gym.
          </Text>
        </Appear>

        {/* Goal */}
        <Appear index={1}><View style={s.section}>
          <Text style={[s.label, { color: colors.foreground }]}>YOUR GOAL</Text>
          <View style={{ gap: 12 }}>
            {GOALS.map((g) => (
              <GoalRow
                key={g.value}
                goal={g}
                selected={goalMode === g.value}
                onPress={() => { Haptics.selectionAsync(); setGoalMode(g.value); }}
                onWhy={() => openWhy(g.evidenceId)}
                colors={colors}
              />
            ))}
          </View>
        </View></Appear>

        {/* Job activity */}
        <Appear index={2}><View style={s.section}>
          <View style={s.labelRow}>
            <Text style={[s.label, { color: colors.foreground }]}>DAILY JOB ACTIVITY</Text>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); const c = getEvidenceById("neat_matters"); if (c) setActiveCard(c); }}
              style={[s.why, { backgroundColor: colors.highlight, borderColor: colors.foreground }]}
            >
              <Text style={[s.whyText, { color: "#111111" }]}>why?</Text>
            </Pressable>
          </View>
          <View style={{ gap: 12 }}>
            {JOB_OPTIONS.map((opt) => (
              <JobRow
                key={opt.value}
                opt={opt}
                selected={jobType === opt.value}
                onPress={() => { Haptics.selectionAsync(); setJobType(opt.value); }}
                colors={colors}
              />
            ))}
          </View>
        </View></Appear>

        {/* Steps */}
        <Appear index={3}><View style={s.section}>
          <Text style={[s.label, { color: colors.foreground }]}>AVERAGE DAILY STEPS</Text>
          <View style={s.chipRow}>
            {STEPS_OPTIONS.map((o) => (
              <BrutalChip key={o.value} label={o.label} selected={dailySteps === o.value}
                onPress={() => { Haptics.selectionAsync(); setDailySteps(o.value); }} />
            ))}
          </View>
        </View></Appear>

        {/* Sitting */}
        <Appear index={4}><View style={s.section}>
          <Text style={[s.label, { color: colors.foreground }]}>HOURS SITTING PER DAY</Text>
          <View style={s.chipRow}>
            {SITTING_OPTIONS.map((o) => (
              <BrutalChip key={o.value} label={o.label} selected={sitting === o.value}
                onPress={() => { Haptics.selectionAsync(); setSitting(o.value); }} />
            ))}
          </View>
        </View></Appear>
      </ScrollView>

      <View style={[s.footer, { backgroundColor: colors.background, paddingBottom: insets.bottom + 18, borderTopColor: colors.foreground }]}>
        <BrutalButton label="continue" onPress={next} disabled={!isValid} />
      </View>

      <EvidenceModal card={activeCard} visible={activeCard !== null} onClose={() => setActiveCard(null)} />
    </View>
  );
}

function GoalRow({
  goal, selected, onPress, onWhy, colors,
}: {
  goal: (typeof GOALS)[number];
  selected: boolean;
  onPress: () => void;
  onWhy: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable onPress={onPress} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} style={{ position: "relative" }}>
      <View style={[StyleSheet.absoluteFillObject,
        { pointerEvents: "none", transform: [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }], backgroundColor: pressed ? "transparent" : colors.foreground, borderRadius: BRUTAL.radius }]} />
      <View style={{
        borderWidth: BRUTAL.border, borderColor: colors.foreground, borderRadius: BRUTAL.radius,
        backgroundColor: selected ? colors.primary : colors.card, padding: 14, gap: 6,
        transform: pressed ? [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }] : [],
      }}>
        <View style={s.topRow}>
          <Text style={[s.goalLabel, { color: selected ? colors.primaryForeground : colors.foreground }]}>{goal.label}</Text>
          <Pressable
            onPress={(e) => { e.stopPropagation(); onWhy(); }}
            hitSlop={6}
            style={[s.whyChip, { borderColor: colors.foreground, backgroundColor: colors.highlight }]}
          >
            <Text style={[s.whyText, { color: "#111111" }]}>why?</Text>
          </Pressable>
        </View>
        <Text style={[s.goalTag, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>
          {goal.tag} · {goal.detail}
        </Text>
      </View>
    </Pressable>
  );
}

function JobRow({
  opt, selected, onPress, colors,
}: {
  opt: { label: string; desc: string };
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable onPress={onPress} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} style={{ position: "relative" }}>
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { pointerEvents: "none", transform: [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }], backgroundColor: pressed ? "transparent" : colors.foreground, borderRadius: BRUTAL.radius },
        ]}
      />
      <View
        style={{
          flexDirection: "row", alignItems: "center", gap: 12,
          borderWidth: BRUTAL.border, borderColor: colors.foreground, borderRadius: BRUTAL.radius,
          backgroundColor: selected ? colors.primary : colors.card, padding: 14,
          transform: pressed ? [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }] : [],
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={[s.jobLabel, { color: selected ? colors.primaryForeground : colors.foreground }]}>{opt.label}</Text>
          <Text style={[s.jobDesc, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>{opt.desc}</Text>
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
  root:      { flex: 1 },
  content:   { paddingHorizontal: 24, gap: 18 },
  heading:   { fontFamily: F.displayBold, fontSize: 32, fontStyle: "italic", letterSpacing: -1 },
  sub:       { fontFamily: F.bodyReg, fontSize: 13, lineHeight: 19, marginTop: -8 },
  section:   { gap: 10 },
  labelRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label:     { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 1 },
  why:       { borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, paddingHorizontal: 10, paddingVertical: 4 },
  whyText:   { fontFamily: F.bodyBold, fontSize: 11 },
  topRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  goalLabel: { fontFamily: F.displayBold, fontSize: 19, fontStyle: "italic" },
  goalTag:   { fontFamily: F.bodyMed, fontSize: 12 },
  whyChip:   { borderWidth: 2, borderRadius: BRUTAL.radius, paddingHorizontal: 10, paddingVertical: 3 },
  jobLabel:  { fontFamily: F.bodyBold, fontSize: 15 },
  jobDesc:   { fontFamily: F.bodyReg, fontSize: 12, marginTop: 2 },
  check:     { width: 24, height: 24, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  chipRow:   { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  footer:    { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 16, borderTopWidth: BRUTAL.border },
});
