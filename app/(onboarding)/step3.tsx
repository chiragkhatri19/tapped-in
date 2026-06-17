// Training (saves profile, routes to the reveal)
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
import { EvidenceModal } from "@/components/EvidenceModal";
import { getEvidenceById } from "@/data/evidence";
import { TrainingExperience, EvidenceCard } from "@/types";

const EXPERIENCE: { value: TrainingExperience; label: string; desc: string }[] = [
  { value: "beginner",     label: "beginner",     desc: "under 1 year of consistent training" },
  { value: "intermediate", label: "intermediate", desc: "1 to 3 years of regular lifting" },
  { value: "advanced",     label: "advanced",     desc: "3 years plus, structured and progressive" },
];

const TRAINING_DAYS = [0, 1, 2, 3, 4, 5, 6];
const CARDIO_DAYS = [0, 1, 2, 3, 4, 5];
const DURATION_OPTS = [
  { label: "20 min", value: 20 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
  { label: "90 min", value: 90 },
];

export default function Step3() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { data, setData } = useOnboarding();
  const { saveProfile } = useProfile();

  const [experience, setExperience] = useState<TrainingExperience | null>(data.experience ?? null);
  const [trainingDays, setTrainingDays] = useState(data.trainingDaysPerWeek ?? 3);
  const [cardioFreq, setCardioFreq] = useState(data.cardioFrequency ?? 0);
  const [cardioDur, setCardioDur] = useState(data.cardioDurationMin ?? 30);
  const [activeCard, setActiveCard] = useState<EvidenceCard | null>(null);
  const [saving, setSaving] = useState(false);

  const isValid = experience !== null;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const buildPlan = async () => {
    if (!isValid || !experience) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    const { age, sex, heightCm, weightKg, bodyFatPercent, dailySteps, sittingHoursPerDay, jobType, goalMode, unitSystem } = data;

    if (age != null && sex != null && heightCm != null && weightKg != null &&
        dailySteps != null && sittingHoursPerDay != null && jobType != null && goalMode != null) {
      await saveProfile({
        age, sex, heightCm, weightKg, bodyFatPercent,
        experience,
        trainingDaysPerWeek: trainingDays,
        cardioFrequency: cardioFreq,
        cardioDurationMin: cardioFreq > 0 ? cardioDur : 0,
        dailySteps, sittingHoursPerDay, jobType, goalMode, unitSystem,
      });
    }

    setData({
      experience,
      trainingDaysPerWeek: trainingDays,
      cardioFrequency: cardioFreq,
      cardioDurationMin: cardioFreq > 0 ? cardioDur : 0,
    });
    setSaving(false);
    router.replace(from === 'profile' ? '/(tabs)/profile' : '/(onboarding)/step5' as never);
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <BrutalProgress step={3} total={3} />

        <Appear index={0}>
          <Text style={[s.heading, { color: colors.foreground }]}>how do you train?</Text>
          <Text style={[s.sub, { color: colors.mutedForeground }]}>sets your protein target and activity level.</Text>
        </Appear>

        {/* Experience */}
        <Appear index={1}><View style={s.section}>
          <View style={s.labelRow}>
            <Text style={[s.label, { color: colors.foreground }]}>TRAINING EXPERIENCE</Text>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); const c = getEvidenceById("protein_high"); if (c) setActiveCard(c); }}
              style={[s.why, { backgroundColor: colors.highlight, borderColor: colors.foreground }]}
            >
              <Text style={[s.whyText, { color: "#111111" }]}>why?</Text>
            </Pressable>
          </View>
          <View style={{ gap: 14 }}>
            {EXPERIENCE.map((opt) => (
              <ExpRow key={opt.value} opt={opt} selected={experience === opt.value}
                onPress={() => { Haptics.selectionAsync(); setExperience(opt.value); }} colors={colors} />
            ))}
          </View>
        </View></Appear>

        {/* Training days */}
        <Appear index={2}><View style={s.section}>
          <Text style={[s.label, { color: colors.foreground }]}>RESISTANCE DAYS / WEEK</Text>
          <Text style={[s.hint, { color: colors.mutedForeground }]}>gym sessions only. not cardio or walks.</Text>
          <View style={s.gridRow}>
            {TRAINING_DAYS.map((d) => (
              <DayTile key={d} n={d} selected={trainingDays === d}
                onPress={() => { Haptics.selectionAsync(); setTrainingDays(d); }} colors={colors} />
            ))}
          </View>
        </View></Appear>

        {/* Cardio */}
        <Appear index={3}><View style={s.section}>
          <Text style={[s.label, { color: colors.foreground }]}>CARDIO SESSIONS / WEEK</Text>
          <View style={s.gridRow}>
            {CARDIO_DAYS.map((d) => (
              <DayTile key={d} n={d} label={d === 0 ? "0" : `${d}`} selected={cardioFreq === d}
                onPress={() => { Haptics.selectionAsync(); setCardioFreq(d); }} colors={colors} />
            ))}
          </View>
        </View></Appear>

        {cardioFreq > 0 ? (
          <View style={s.section}>
            <Text style={[s.label, { color: colors.foreground }]}>AVG CARDIO LENGTH</Text>
            <View style={s.chipRow}>
              {DURATION_OPTS.map((o) => (
                <BrutalChip key={o.value} label={o.label} selected={cardioDur === o.value}
                  onPress={() => { Haptics.selectionAsync(); setCardioDur(o.value); }} />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[s.footer, { backgroundColor: colors.background, paddingBottom: insets.bottom + 18, borderTopColor: colors.foreground }]}>
        <BrutalButton label="build my plan" onPress={buildPlan} disabled={!isValid} loading={saving} />
      </View>

      <EvidenceModal card={activeCard} visible={activeCard !== null} onClose={() => setActiveCard(null)} />
    </View>
  );
}

function ExpRow({ opt, selected, onPress, colors }: {
  opt: { label: string; desc: string }; selected: boolean; onPress: () => void; colors: ReturnType<typeof useColors>;
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

function DayTile({ n, label, selected, onPress, colors }: {
  n: number; label?: string; selected: boolean; onPress: () => void; colors: ReturnType<typeof useColors>;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable onPress={onPress} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} style={{ position: "relative" }}>
      <View style={[StyleSheet.absoluteFillObject,
        { pointerEvents: "none", transform: [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }], backgroundColor: pressed ? "transparent" : colors.foreground, borderRadius: BRUTAL.radius }]} />
      <View style={{
        width: 42, height: 48, borderWidth: BRUTAL.border, borderColor: colors.foreground, borderRadius: BRUTAL.radius,
        backgroundColor: selected ? colors.primary : colors.card, alignItems: "center", justifyContent: "center",
        transform: pressed ? [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }] : [],
      }}>
        <Text style={{ fontFamily: F.monoSemi, fontSize: 16, color: selected ? colors.primaryForeground : colors.foreground }}>
          {label ?? n}
        </Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1 },
  content:  { paddingHorizontal: 24, gap: 18 },
  heading:  { fontFamily: F.displayBold, fontSize: 34, fontStyle: "italic", letterSpacing: -1 },
  sub:      { fontFamily: F.bodyReg, fontSize: 14, lineHeight: 21, marginTop: -10 },
  section:  { gap: 10 },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label:    { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 1 },
  hint:     { fontFamily: F.bodyReg, fontSize: 12, marginTop: -2, lineHeight: 18 },
  why:      { borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, paddingHorizontal: 10, paddingVertical: 4 },
  whyText:  { fontFamily: F.bodyBold, fontSize: 11 },
  jobLabel: { fontFamily: F.bodyBold, fontSize: 15 },
  jobDesc:  { fontFamily: F.bodyReg, fontSize: 12, marginTop: 2 },
  check:    { width: 24, height: 24, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  gridRow:  { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chipRow:  { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  footer:   { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 16, borderTopWidth: BRUTAL.border },
});
