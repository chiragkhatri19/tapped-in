import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import React, { useState, useCallback } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useProfile } from "@/stores/profile-store";
import { useOnboarding } from "@/context/onboarding-context";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore, type ThemePreference } from "@/stores/theme-store";
import { getGoalLabel } from "@/lib/calorie-engine";
import { getNEATLabel } from "@/lib/activity-classifier";
import { useColors } from "@/hooks/useColors";
import { F } from "@/constants/fonts";
import { BRUTAL } from "@/constants/brutal";
import { BrutalBox, BrutalButton } from "@/components/brutal";
import { PaywallModal } from "@/components/PaywallModal";
import { useUiStore } from "@/stores/ui-store";
import { DOCK_SAFE_BOTTOM } from "@/components/navigation/BrutalDock";
import { EvidenceModal } from "@/components/EvidenceModal";
import { Appear } from "@/components/motion/Appear";
import { EVIDENCE_CARDS } from "@/data/evidence";
import type { EvidenceCard } from "@/types";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const setDockVisible = useUiStore((s) => s.setDockVisible);

  useFocusEffect(
    useCallback(() => {
      setDockVisible(true);
      return () => setDockVisible(true);
    }, [setDockVisible])
  );

  const { profile, result, clearProfile } = useProfile();
  const { initFromProfile } = useOnboarding();
  const { session, user, signOut, deleteAccount } = useAuthStore();
  const { preference: themePref, setPreference: setTheme } = useThemeStore();

  const displayName: string =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "you.";
  const displayEmail: string = user?.email ?? "";
  const isPro = false; // upgrade via PaywallModal; flip when RevenueCat is integrated

  const handleSignOut = () => {
    Alert.alert("sign out", "you'll stay on this device until you sign back in.", [
      { text: "cancel", style: "cancel" },
      {
        text: "sign out", style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await signOut();
          router.replace("/welcome");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "delete account",
      "this permanently removes your account and all data. this cannot be undone.",
      [
        { text: "cancel", style: "cancel" },
        {
          text: "delete forever", style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            const err = await deleteAccount();
            if (err) {
              Alert.alert("error", err);
            } else {
              router.replace("/welcome");
            }
          },
        },
      ],
    );
  };
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [activeEvidence, setActiveEvidence] = useState<EvidenceCard | null>(null);

  const GOAL_ACCENT: Record<string, string> = {
    fat_loss: colors.orange, recomp: colors.blue, muscle_gain: colors.teal, maintain: colors.violet,
  };

  const handleReset = () => {
    Alert.alert("reset your plan", "this clears your profile so you can start fresh. logged meals stay.", [
      { text: "cancel", style: "cancel" },
      {
        text: "reset", style: "destructive",
        onPress: async () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); await clearProfile(); router.replace("/(onboarding)/step1"); },
      },
    ]);
  };

  const topPad = Platform.OS === "web" ? 67 + 16 : insets.top + 16;

  if (!profile || !result) {
    return (
      <View style={[s.empty, { backgroundColor: colors.background }]}>
        <Ionicons name="person-circle-outline" size={56} color={colors.foreground} />
        <Text style={[s.emptyTitle, { color: colors.foreground }]}>no profile yet.</Text>
        <Text style={[s.emptyText, { color: colors.mutedForeground }]}>complete onboarding to see your plan.</Text>
        <BrutalButton label="get started" onPress={() => router.push("/(onboarding)/step1")} style={{ alignSelf: "stretch", marginTop: 8 }} />
      </View>
    );
  }

  const accent = GOAL_ACCENT[profile.goalMode] ?? colors.primary;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[s.content, { paddingTop: topPad, paddingBottom: insets.bottom + DOCK_SAFE_BOTTOM + 12 }]}
      showsVerticalScrollIndicator={false}
    >
      <Appear index={0}>
        <Text style={[s.pageTitle, { color: colors.foreground }]}>profile.</Text>
      </Appear>

      {/* Account card */}
      <Appear index={0}>
        {session ? (
          <BrutalBox style={s.accountCard} offset={4}>
            {/* Avatar initials */}
            <View style={[s.avatar, { backgroundColor: colors.primary, borderColor: colors.foreground }]}>
              <Text style={[s.avatarText, { color: colors.primaryForeground }]}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={s.accountInfo}>
              <View style={s.accountNameRow}>
                <Text style={[s.accountName, { color: colors.foreground }]} numberOfLines={1}>
                  {displayName}
                </Text>
                <View style={[s.planBadge, { backgroundColor: isPro ? colors.pop : colors.card, borderColor: colors.foreground }]}>
                  <Text style={[s.planBadgeText, { color: isPro ? "#111111" : colors.mutedForeground }]}>
                    {isPro ? "PRO" : "FREE"}
                  </Text>
                </View>
              </View>
              {displayEmail ? (
                <Text style={[s.accountEmail, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {displayEmail}
                </Text>
              ) : null}
              {profile?.age ? (
                <Text style={[s.accountMeta, { color: colors.mutedForeground }]}>
                  {profile.age} yrs · {profile.sex} · {getGoalLabel(profile.goalMode)}
                </Text>
              ) : null}
            </View>
          </BrutalBox>
        ) : (
          <BrutalBox style={[s.accountCard, { alignItems: "center" }]} offset={4}>
            <Ionicons name="person-circle-outline" size={36} color={colors.mutedForeground} />
            <View style={{ flex: 1 }}>
              <Text style={[s.accountName, { color: colors.foreground }]}>not signed in.</Text>
              <Text style={[s.accountEmail, { color: colors.mutedForeground }]}>
                sign in to sync your data across devices.
              </Text>
            </View>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); router.push("/(auth)/auth?mode=signin"); }}
              style={[s.signInBtn, { backgroundColor: colors.primary, borderColor: colors.foreground }]}
            >
              <Text style={[s.signInBtnText, { color: colors.primaryForeground }]}>sign in</Text>
            </Pressable>
          </BrutalBox>
        )}
      </Appear>

      {/* Goal hero */}
      <Appear index={1}>
      <BrutalBox style={[s.hero, { backgroundColor: accent }]} offset={BRUTAL.shadow}>
        <View style={s.heroTop}>
          <View style={[s.goalBadge, { backgroundColor: "#111111" }]}>
            <Text style={[s.goalBadgeText, { color: "#FFFFFF" }]}>{getGoalLabel(profile.goalMode).toUpperCase()}</Text>
          </View>
          <View style={[s.neatBadge, { borderColor: "#111111" }]}>
            <Text style={[s.neatText, { color: "#111111" }]}>{getNEATLabel(result.calories.neatCategory).toLowerCase()}</Text>
          </View>
        </View>
        <Text style={[s.heroCalories, { color: "#111111" }]}>
          {result.calories.targetCalories}<Text style={s.heroUnit}> kcal/day</Text>
        </Text>
        <View style={s.macroRow}>
          <MacroChip label="P" value={result.macros.proteinG} />
          <MacroChip label="C" value={result.macros.carbG} />
          <MacroChip label="F" value={result.macros.fatG} />
          <MacroChip label="fiber" value={result.macros.fiberG} />
        </View>
        <Text style={[s.hydration, { color: "#111111" }]}>{(result.hydrationMl / 1000).toFixed(1)}L water / day</Text>
      </BrutalBox>
      </Appear>

      {/* Your targets */}
      <Appear index={2}>
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>your targets</Text>
        <BrutalBox style={{ padding: 14, gap: 12 }} offset={4}>
          <View style={s.targetGrid}>
            <TargetStat label="bmr" value={`${result.calories.bmr}`} accent={colors.mutedForeground} colors={colors} />
            <TargetStat label="maintenance" value={`${result.calories.maintenanceCalories}`} accent={colors.mutedForeground} colors={colors} />
            <TargetStat label={result.calories.deficit < 0 ? "deficit" : result.calories.deficit > 0 ? "surplus" : "adjust"} value={`${result.calories.deficit > 0 ? "+" : ""}${result.calories.deficit}`} accent={result.calories.deficit < 0 ? colors.persimmon : colors.primary} colors={colors} />
            <TargetStat label="protein" value={`${(result.macros.proteinG / profile.weightKg).toFixed(1)}`} sub="g/kg" accent={colors.blue} colors={colors} />
            <TargetStat label="fiber" value={`${result.macros.fiberG}`} sub="g min" accent={colors.teal} colors={colors} />
            <TargetStat label="water" value={`${(result.hydrationMl / 1000).toFixed(1)}`} sub="L/day" accent={colors.violet} colors={colors} />
          </View>
          <Pressable onPress={() => { const c = EVIDENCE_CARDS.find((x) => x.id === "bmr_equation"); if (c) { Haptics.selectionAsync(); setActiveEvidence(c); } }}
            style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: colors.pop, borderColor: colors.foreground, borderWidth: 2, borderRadius: BRUTAL.radius, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontFamily: F.bodyBold, fontSize: 11, color: "#111111" }}>Why?</Text>
          </Pressable>
        </BrutalBox>
      </Appear>

      {/* Data table */}
      <Appear index={3}>
      <Text style={[s.sectionTitle, { color: colors.foreground }]}>your data</Text>
      <BrutalBox style={{ overflow: "hidden" }} offset={4}>
        {[
          { label: "age", value: `${profile.age} yrs` },
          { label: "sex", value: profile.sex },
          { label: "height", value: `${profile.heightCm} cm` },
          { label: "weight", value: `${profile.weightKg} kg` },
          { label: "experience", value: profile.experience },
          { label: "training", value: `${profile.trainingDaysPerWeek}x / week` },
          { label: "daily steps", value: profile.dailySteps.toLocaleString() },
          { label: "sitting", value: `${profile.sittingHoursPerDay} hrs/day` },
          { label: "job type", value: profile.jobType.replace(/_/g, " ") },
        ].map((row, i, arr) => (
          <View key={row.label} style={[s.tableRow, i < arr.length - 1 && { borderBottomWidth: 2, borderBottomColor: colors.foreground }]}>
            <Text style={[s.tableLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
            <Text style={[s.tableValue, { color: colors.foreground }]}>{row.value}</Text>
          </View>
        ))}
      </BrutalBox>
      </Appear>

      {result.notes.length > 0 && (
        <>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>how this was calculated</Text>
          <BrutalBox style={{ padding: 16, gap: 10 }} offset={4}>
            {result.notes.map((note, i) => (
              <View key={i} style={s.noteRow}>
                <View style={[s.noteDot, { backgroundColor: colors.primary, borderColor: colors.foreground }]} />
                <Text style={[s.noteText, { color: colors.mutedForeground }]}>{note}</Text>
              </View>
            ))}
          </BrutalBox>
        </>
      )}

      {/* Upgrade */}
      <BrutalButton
        label="upgrade to pro"
        variant="pop"
        icon={<Feather name="zap" size={16} color="#111111" />}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setPaywallVisible(true); }}
        style={{ marginTop: 4 }}
      />

      {/* Quick-edit actions — change one thing without full reset */}
      <Text style={[s.sectionTitle, { color: colors.foreground }]}>edit your plan</Text>
      <BrutalBox style={{ overflow: 'hidden' }} offset={4}>
        {[
          { label: 'update body & basics', sub: 'sex · age · height · weight', step: '/(onboarding)/step1?from=profile' },
          { label: 'change goal & activity', sub: 'goal · steps · sitting · job type', step: '/(onboarding)/step2?from=profile' },
          { label: 'change training details', sub: 'days · experience · cardio', step: '/(onboarding)/step3?from=profile' },
        ].map((item, i, arr) => (
          <Pressable
            key={item.step}
            onPress={() => { Haptics.selectionAsync(); initFromProfile(profile); router.push(item.step as never); }}
            style={[s.editRow, i < arr.length - 1 && { borderBottomWidth: 2, borderBottomColor: colors.foreground }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[s.editRowLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Text style={[s.editRowSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </BrutalBox>

      {/* Theme switcher */}
      <Text style={[s.sectionTitle, { color: colors.foreground }]}>appearance</Text>
      <ThemeToggle current={themePref} onChange={setTheme} colors={colors} />

      <Pressable onPress={handleReset} style={[s.resetBtn, { borderColor: colors.persimmon }]}>
        <Ionicons name="trash-outline" size={16} color={colors.persimmon} />
        <Text style={[s.resetText, { color: colors.persimmon }]}>reset everything and start over</Text>
      </Pressable>
      <Text style={[s.resetNote, { color: colors.mutedForeground }]}>only use this if you want to clear your entire profile. logged meals are kept.</Text>

      {/* Account actions */}
      {session ? (
        <>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>account</Text>
          <BrutalBox style={{ overflow: "hidden" }} offset={4}>
            <Pressable
              onPress={handleSignOut}
              style={[s.accountActionRow, { borderBottomWidth: 2, borderBottomColor: colors.foreground }]}
            >
              <Feather name="log-out" size={16} color={colors.foreground} />
              <Text style={[s.accountActionLabel, { color: colors.foreground }]}>sign out</Text>
            </Pressable>
            <Pressable onPress={handleDeleteAccount} style={s.accountActionRow}>
              <Feather name="trash-2" size={16} color={colors.persimmon} />
              <Text style={[s.accountActionLabel, { color: colors.persimmon }]}>delete account</Text>
            </Pressable>
          </BrutalBox>
        </>
      ) : null}

      <View style={[s.disclaimer, { borderColor: colors.foreground, backgroundColor: colors.card }]}>
        <Text style={[s.disclaimerText, { color: colors.mutedForeground }]}>
          tappd in uses validated formulas (mifflin-st jeor + neat scoring), not generic multipliers. track for 2 to 4 weeks and adjust if needed. not medical advice.
        </Text>
      </View>

      <PaywallModal visible={paywallVisible} onDismiss={() => setPaywallVisible(false)} />
      <EvidenceModal card={activeEvidence} visible={activeEvidence !== null} onClose={() => setActiveEvidence(null)} />
    </ScrollView>
  );
}

function MacroChip({ label, value }: { label: string; value: number }) {
  return (
    <View style={[s.macroChip, { borderColor: "#111111" }]}>
      <Text style={[s.macroChipLabel, { color: "#111111" }]}>{label}</Text>
      <Text style={[s.macroChipVal, { color: "#111111" }]}>{Math.round(value)}g</Text>
    </View>
  );
}

const THEME_OPTS: { value: ThemePreference; label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { value: "light", label: "light", icon: "sunny-outline" },
  { value: "system", label: "auto", icon: "phone-portrait-outline" },
  { value: "dark", label: "dark", icon: "moon-outline" },
];

function ThemeToggle({ current, onChange, colors }: {
  current: ThemePreference;
  onChange: (p: ThemePreference) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[s.themeRow, { borderColor: colors.foreground, backgroundColor: colors.card }]}>
      {THEME_OPTS.map((opt, i) => {
        const active = current === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => { Haptics.selectionAsync(); onChange(opt.value); }}
            style={[
              s.themeOpt,
              i < THEME_OPTS.length - 1 && { borderRightWidth: BRUTAL.border, borderRightColor: colors.foreground },
              active && { backgroundColor: colors.primary },
            ]}
          >
            <Ionicons name={opt.icon} size={16} color={active ? colors.primaryForeground : colors.mutedForeground} />
            <Text style={[s.themeLabel, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function StatBox({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <BrutalBox style={s.statBox} offset={4}>
      <Text style={[s.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </BrutalBox>
  );
}

function TargetStat({ label, value, sub, accent, colors }: { label: string; value: string; sub?: string; accent: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[s.targetStat, { borderColor: colors.foreground, backgroundColor: colors.background }]}>
      <View style={[s.targetDot, { backgroundColor: accent }]} />
      <Text style={[s.targetVal, { color: colors.foreground }]}>{value}{sub ? <Text style={[s.targetSub, { color: colors.mutedForeground }]}> {sub}</Text> : null}</Text>
      <Text style={[s.targetLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 28 },
  emptyTitle: { fontFamily: F.displayBold, fontSize: 26, fontStyle: "italic" },
  emptyText: { fontFamily: F.bodyReg, fontSize: 14, textAlign: "center" },

  content: { paddingHorizontal: 20, gap: 14 },
  pageTitle: { fontFamily: F.displayBold, fontSize: 30, fontStyle: "italic", letterSpacing: -1 },

  hero: { padding: 18, gap: 12 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  goalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BRUTAL.radius },
  goalBadgeText: { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 0.8 },
  neatBadge: { borderWidth: 2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BRUTAL.radius },
  neatText: { fontFamily: F.bodyMed, fontSize: 11 },
  heroCalories: { fontFamily: F.monoSemi, fontSize: 38, letterSpacing: -1 },
  heroUnit: { fontFamily: F.monoMed, fontSize: 16 },
  macroRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  macroChip: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 2, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BRUTAL.radius },
  macroChipLabel: { fontFamily: F.bodyBold, fontSize: 11 },
  macroChipVal: { fontFamily: F.monoSemi, fontSize: 13 },
  hydration: { fontFamily: F.bodyMed, fontSize: 13 },

  statsRow: { flexDirection: "row", gap: 10 },
  statBox: { flex: 1, padding: 12, alignItems: "center", gap: 3 },
  targetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  targetStat: { width: "30%", flexGrow: 1, borderWidth: 2, borderRadius: BRUTAL.radius, padding: 10, gap: 2 },
  targetDot: { width: 12, height: 12, marginBottom: 4 },
  targetVal: { fontFamily: F.monoSemi, fontSize: 18 },
  targetSub: { fontFamily: F.mono, fontSize: 10 },
  targetLabel: { fontFamily: F.bodyMed, fontSize: 11 },
  whyChip: { alignSelf: "flex-start", borderWidth: 2, borderRadius: BRUTAL.radius, paddingHorizontal: 10, paddingVertical: 5 },
  whyText: { fontFamily: F.bodyBold, fontSize: 11, color: "#111111" },
  statValue: { fontFamily: F.monoSemi, fontSize: 18 },
  statLabel: { fontFamily: F.monoMed, fontSize: 10, textAlign: "center", letterSpacing: 0.5 },

  sectionTitle: { fontFamily: F.displayBold, fontSize: 18, fontStyle: "italic", marginTop: 2 },
  tableRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
  tableLabel: { fontFamily: F.bodyReg, fontSize: 13 },
  tableValue: { fontFamily: F.bodySemi, fontSize: 13, textTransform: "capitalize" },

  noteRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  noteDot: { width: 10, height: 10, borderWidth: 2, marginTop: 4, flexShrink: 0 },
  noteText: { fontFamily: F.bodyReg, fontSize: 13, flex: 1, lineHeight: 19 },

  themeRow: { flexDirection: "row", borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, overflow: "hidden" },
  themeOpt: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 },
  themeLabel: { fontFamily: F.bodyBold, fontSize: 13 },
  editRow:      { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  editRowLabel: { fontFamily: F.bodyBold, fontSize: 14, marginBottom: 2 },
  editRowSub:   { fontFamily: F.bodyReg, fontSize: 12 },
  resetBtn: { height: 50, borderRadius: BRUTAL.radius, borderWidth: BRUTAL.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  resetText: { fontFamily: F.bodyBold, fontSize: 14 },
  resetNote: { fontFamily: F.bodyReg, fontSize: 11, textAlign: "center", lineHeight: 17, marginTop: -6 },
  disclaimer: { borderRadius: BRUTAL.radius, borderWidth: 2, padding: 14 },
  disclaimerText: { fontFamily: F.bodyReg, fontSize: 12, lineHeight: 18 },

  // Account card
  accountCard:     { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  avatar:          { width: 44, height: 44, borderRadius: 22, borderWidth: BRUTAL.border, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText:      { fontFamily: F.displayBold, fontSize: 20, fontStyle: "italic" },
  accountInfo:     { flex: 1, gap: 2 },
  accountNameRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
  accountName:     { fontFamily: F.bodySemi, fontSize: 15, flexShrink: 1 },
  planBadge:       { borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, paddingHorizontal: 7, paddingVertical: 2, flexShrink: 0 },
  planBadgeText:   { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 0.5 },
  accountEmail:    { fontFamily: F.bodyReg, fontSize: 12 },
  accountMeta:     { fontFamily: F.bodyReg, fontSize: 11 },
  signInBtn:       { borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, paddingHorizontal: 12, paddingVertical: 8, flexShrink: 0 },
  signInBtnText:   { fontFamily: F.bodySemi, fontSize: 13 },

  // Account actions
  accountActionRow:  { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  accountActionLabel:{ fontFamily: F.bodyMed, fontSize: 14 },
});
