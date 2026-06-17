import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EvidenceButton } from "@/components/EvidenceButton";
import { EvidenceModal } from "@/components/EvidenceModal";
import { MacroBar } from "@/components/MacroBar";
import { StatCard } from "@/components/StatCard";
import { useProfile } from "@/stores/profile-store";
import { EVIDENCE_CARDS } from "@/data/evidence";
import { getGoalLabel } from "@/lib/calorie-engine";
import { getNEATDescription, getNEATLabel } from "@/lib/activity-classifier";
import { useColors } from "@/hooks/useColors";
import { EvidenceCard } from "@/types";
import { F } from "@/constants/fonts";

export default function PlanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { result } = useProfile();
  const [activeEvidence, setActiveEvidence] = useState<EvidenceCard | null>(null);
  const [hotTakesOpen, setHotTakesOpen] = useState(false);

  const openEvidence = (id: string) => {
    const card = EVIDENCE_CARDS.find((c) => c.id === id);
    if (card) {
      Haptics.selectionAsync();
      setActiveEvidence(card);
    }
  };

  const topPad = Platform.OS === "web" ? 67 + 16 : insets.top + 16;

  if (!result) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Feather name="clipboard" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          Nothing here yet
        </Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Complete your setup to see your full nutrition plan.
        </Text>
        <Pressable
          style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.replace("/(onboarding)/step1")}
        >
          <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>
            Let's go
          </Text>
        </Pressable>
      </View>
    );
  }

  const { calories, macros, hydrationMl, notes } = result;

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back nav */}
        <Pressable
          style={styles.backRow}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
          <Text style={[styles.backText, { color: colors.foreground }]}>Home</Text>
        </Pressable>

        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              Your plan
            </Text>
            <Text style={[styles.goalTitle, { color: colors.foreground }]}>
              {getGoalLabel(calories.goalMode)}
            </Text>
          </View>
          <View
            style={[styles.neatBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" }]}
          >
            <View style={[styles.neatDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.neatBadgeText, { color: colors.primary }]}>
              {getNEATLabel(calories.neatCategory)}
            </Text>
          </View>
        </View>

        {/* Main calories */}
        <View
          style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.heroInner}>
            <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>
              TARGET CALORIES
            </Text>
            <Text style={[styles.heroValue, { color: colors.primary }]}>
              {calories.targetCalories}
            </Text>
            <Text style={[styles.heroUnit, { color: colors.mutedForeground }]}>
              kcal / day
            </Text>
          </View>
          <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
          <View style={styles.heroMeta}>
            <View style={styles.heroMetaItem}>
              <Text style={[styles.heroMetaLabel, { color: colors.mutedForeground }]}>
                BMR
              </Text>
              <Text style={[styles.heroMetaValue, { color: colors.foreground }]}>
                {calories.bmr} kcal
              </Text>
            </View>
            <View style={styles.heroMetaItem}>
              <Text style={[styles.heroMetaLabel, { color: colors.mutedForeground }]}>
                Maintenance
              </Text>
              <Text style={[styles.heroMetaValue, { color: colors.foreground }]}>
                {calories.maintenanceCalories} kcal
              </Text>
            </View>
            <View style={styles.heroMetaItem}>
              <Text style={[styles.heroMetaLabel, { color: colors.mutedForeground }]}>
                {calories.deficit < 0 ? "Deficit" : "Surplus"}
              </Text>
              <Text
                style={[
                  styles.heroMetaValue,
                  { color: calories.deficit < 0 ? colors.warning : colors.primary },
                ]}
              >
                {Math.abs(calories.deficit)} kcal
              </Text>
            </View>
          </View>
          <EvidenceButton
            label="How we ran the math"
            onPress={() => openEvidence("bmr_equation")}
          />
        </View>

        {/* NEAT explanation */}
        <View style={[styles.infoBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="activity" size={16} color={colors.primary} />
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>
              {getNEATLabel(calories.neatCategory)}
            </Text>
            <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>
              {getNEATDescription(calories.neatCategory)}
            </Text>
            <EvidenceButton
              label="Why NEAT is lowkey everything"
              onPress={() => openEvidence("neat_matters")}
            />
          </View>
        </View>

        {/* Macros section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Macros
          </Text>
          <EvidenceButton
            label="Why this split hits"
            onPress={() => openEvidence("carbs_remainder")}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MacroBar
            proteinG={macros.proteinG}
            fatG={macros.fatG}
            carbG={macros.carbG}
            calories={macros.calories}
          />
        </View>

        <View style={styles.statRow}>
          <StatCard
            label="Protein"
            value={macros.proteinG.toString()}
            unit="g"
            accent
            sublabel={`${(macros.proteinG / result.profile.weightKg).toFixed(1)}g/kg`}
          />
          <StatCard
            label="Carbs"
            value={macros.carbG.toString()}
            unit="g"
          />
        </View>
        <View style={styles.statRow}>
          <StatCard label="Fat" value={macros.fatG.toString()} unit="g" />
          <StatCard
            label="Fiber"
            value={macros.fiberG.toString()}
            unit="g"
            sublabel="Daily minimum"
          />
        </View>

        <View style={styles.evidenceRow}>
          <EvidenceButton label="Protein science" onPress={() => openEvidence("protein_high")} />
          <EvidenceButton label="Fat minimum" onPress={() => openEvidence("fat_minimum")} />
          <EvidenceButton label="Fiber" onPress={() => openEvidence("fiber_matters")} />
        </View>

        {/* Hydration */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hydration</Text>
          <EvidenceButton label="Why it matters" onPress={() => openEvidence("hydration_basics")} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.hydRow}>
            <Feather name="droplet" size={24} color={colors.info} />
            <View>
              <Text style={[styles.hydValue, { color: colors.foreground }]}>
                {(hydrationMl / 1000).toFixed(1)}L / day
              </Text>
              <Text style={[styles.hydSubtext, { color: colors.mutedForeground }]}>
                {hydrationMl}ml based on your body weight. Add 400 to 600ml per hour of training.
              </Text>
            </View>
          </View>
          <View style={[styles.electrolytesRow]}>
            {[
              { icon: "zap", label: "Sodium", tip: "Salt your food to taste, don't stress it" },
              { icon: "heart", label: "Potassium", tip: "Banana, curd, dal" },
              { icon: "sun", label: "Magnesium", tip: "Nuts, dark leafy veg, seeds" },
            ].map((e) => (
              <View key={e.label} style={[styles.electrolyteCard, { backgroundColor: colors.muted }]}>
                <Feather name={e.icon as React.ComponentProps<typeof Feather>["name"]} size={14} color={colors.info} />
                <Text style={[styles.electrolyteLabel, { color: colors.foreground }]}>{e.label}</Text>
                <Text style={[styles.electrolyteTip, { color: colors.mutedForeground }]}>{e.tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Hot takes — collapsible */}
        {notes.length > 0 && (
          <>
            <Pressable
              style={styles.hotTakesToggle}
              onPress={() => {
                Haptics.selectionAsync();
                setHotTakesOpen((v) => !v);
              }}
            >
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Hot takes
              </Text>
              <View style={styles.hotTakesRight}>
                <View style={[styles.hotTakesBadge, { backgroundColor: colors.primary + "14" }]}>
                  <Text style={[styles.hotTakesBadgeText, { color: colors.primary }]}>
                    {notes.length}
                  </Text>
                </View>
                <Feather
                  name={hotTakesOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.mutedForeground}
                />
              </View>
            </Pressable>
            {hotTakesOpen && notes.map((note, i) => (
              <View
                key={i}
                style={[
                  styles.noteCard,
                  { backgroundColor: colors.accent, borderColor: colors.primary + "30" },
                ]}
              >
                <Feather name="check-circle" size={14} color={colors.primary} />
                <Text style={[styles.noteText, { color: colors.foreground }]}>
                  {note}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Recalibrate */}
        <Pressable
          style={[styles.recalibrate, { borderColor: colors.border }]}
          onPress={() => router.push("/(onboarding)/step1")}
        >
          <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
          <Text style={[styles.recalibrateText, { color: colors.mutedForeground }]}>
            Redo my plan
          </Text>
        </Pressable>
      </ScrollView>

      <EvidenceModal
        card={activeEvidence}
        visible={activeEvidence !== null}
        onClose={() => setActiveEvidence(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  emptyTitle: { fontSize: 22, fontFamily: F.displayBold },
  emptyText: { fontSize: 14, fontFamily: F.bodyReg, textAlign: "center", lineHeight: 22 },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  emptyBtnText: { fontSize: 16, fontFamily: F.bodyBold },
  backRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  backText: { fontSize: 16, fontFamily: F.bodySemi },
  content: { paddingHorizontal: 20, gap: 14 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { fontSize: 12, fontFamily: F.bodyMed, letterSpacing: 0.5, textTransform: "uppercase" },
  goalTitle: { fontSize: 28, fontFamily: F.displayBold, marginTop: 2 },
  neatBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  neatDot: { width: 6, height: 6, borderRadius: 3 },
  neatBadgeText: { fontSize: 11, fontFamily: F.bodySemi },
  heroCard: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 16 },
  heroInner: { alignItems: "center", gap: 4 },
  heroLabel: { fontSize: 11, fontFamily: F.bodyMed, letterSpacing: 1, textTransform: "uppercase" },
  heroValue: { fontSize: 64, fontFamily: F.monoSemi, lineHeight: 72 },
  heroUnit: { fontSize: 14, fontFamily: F.bodyReg },
  heroDivider: { height: 1 },
  heroMeta: { flexDirection: "row", justifyContent: "space-around" },
  heroMetaItem: { alignItems: "center", gap: 3 },
  heroMetaLabel: { fontSize: 11, fontFamily: F.bodyReg, textTransform: "uppercase" },
  heroMetaValue: { fontSize: 15, fontFamily: F.monoSemi },
  infoBox: { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: "row", gap: 12 },
  infoText: { flex: 1, gap: 6 },
  infoTitle: { fontSize: 13, fontFamily: F.bodySemi },
  infoDesc: { fontSize: 12, fontFamily: F.bodyReg, lineHeight: 18 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  sectionTitle: { fontSize: 18, fontFamily: F.displayBold },
  card: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 16 },
  statRow: { flexDirection: "row", gap: 12 },
  evidenceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  hydRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  hydValue: { fontSize: 22, fontFamily: F.monoSemi },
  hydSubtext: { fontSize: 12, fontFamily: F.bodyReg, lineHeight: 18, marginTop: 2, maxWidth: 260 },
  electrolytesRow: { flexDirection: "row", gap: 8 },
  electrolyteCard: { flex: 1, borderRadius: 10, padding: 10, gap: 4 },
  electrolyteLabel: { fontSize: 12, fontFamily: F.bodySemi },
  electrolyteTip: { fontSize: 11, fontFamily: F.bodyReg, lineHeight: 16 },
  noteCard: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "flex-start" },
  noteText: { fontSize: 13, fontFamily: F.bodyReg, lineHeight: 20, flex: 1 },
  hotTakesToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  hotTakesRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  hotTakesBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  hotTakesBadgeText: { fontSize: 12, fontFamily: F.bodySemi },
  recalibrate: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14, borderWidth: 1 },
  recalibrateText: { fontSize: 14, fontFamily: F.bodyMed },
});
