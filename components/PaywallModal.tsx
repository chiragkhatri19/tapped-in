import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { F } from "@/constants/fonts";
import { BRUTAL } from "@/constants/brutal";
import { BrutalButton } from "@/components/brutal";
import { DUR, SPRING } from "@/constants/motion";

// ─── Country detection (no package needed) ───────────────────────────────────
function isIndianLocale(): boolean {
  try {
    const locale = (Intl as any)?.DateTimeFormat?.()?.resolvedOptions?.()?.locale ?? "";
    return locale.toLowerCase().includes("-in") || locale.toLowerCase() === "hi";
  } catch {
    return false;
  }
}

const PRICE = isIndianLocale()
  ? { monthly: "₹849", annual: "₹4,190", perMonth: "₹349", currency: "INR" }
  : { monthly: "$9.99", annual: "$59.99", perMonth: "$5", currency: "USD" };

const PRO_FEATURES = [
  "ai meal scanner. unlimited.",
  "ai coach. context-aware answers.",
  "workout generation plus logging.",
  "recipe community (20g protein gate).",
  "micronutrient tracking (b12, d, iron).",
  "priority plan recalculations.",
];

const FREE_FEATURES = [
  "calorie and macro targets",
  "neat score",
  "manual meal logging",
  "evidence library",
];

interface PaywallModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function PaywallModal({ visible, onDismiss }: PaywallModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState<"annual" | "monthly">("annual");

  const slideAnim = useRef(new Animated.Value(700)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, ...SPRING.sheet }),
        Animated.timing(fadeAnim, { toValue: 1, duration: DUR.fast, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 700, duration: DUR.base, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: DUR.fast, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const subscribe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'coming soon.',
      "in-app purchasing isn't set up yet. we'll notify you when pro launches.",
      [{ text: 'ok' }],
    );
  };

  const priceMain = plan === "annual" ? PRICE.annual : PRICE.monthly;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background,
            borderColor: colors.foreground,
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        {/* Drag handle */}
        <View style={[styles.handle, { backgroundColor: colors.foreground }]} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.proTag, { backgroundColor: colors.highlight, borderColor: colors.foreground }]}>
              <Text style={[styles.proTagText, { color: "#111111" }]}>PRO</Text>
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>tappd in pro.</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              the full evidence-based os. coach, scanner, workouts, recipes.
            </Text>
          </View>

          {/* Plan toggle */}
          <View style={[styles.seg, { borderColor: colors.foreground, backgroundColor: colors.card }]}>
            {(["annual", "monthly"] as const).map((p, i) => (
              <Pressable
                key={p}
                onPress={() => { Haptics.selectionAsync(); setPlan(p); }}
                style={[
                  styles.segOpt,
                  i === 0 && { borderRightWidth: BRUTAL.border, borderRightColor: colors.foreground },
                  plan === p && { backgroundColor: colors.primary },
                ]}
              >
                <Text style={[styles.segText, { color: plan === p ? colors.primaryForeground : colors.foreground }]}>
                  {p === "annual" ? "annual" : "monthly"}
                </Text>
                {p === "annual" ? (
                  <View style={[styles.saveTag, { backgroundColor: plan === p ? colors.highlight : colors.highlight, borderColor: colors.foreground }]}>
                    <Text style={[styles.saveText, { color: "#111111" }]}>SAVE 50%</Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>

          {/* Price block */}
          <View style={styles.shadowWrap}>
            <View style={[StyleSheet.absoluteFillObject, { pointerEvents: "none", transform: [{ translateX: BRUTAL.shadow }, { translateY: BRUTAL.shadow }], backgroundColor: colors.foreground, borderRadius: BRUTAL.radius }]} />
            <View style={[styles.priceBox, { backgroundColor: colors.highlight, borderColor: colors.foreground }]}>
              <View style={styles.priceRow}>
                <Text style={[styles.priceMain, { color: "#111111" }]}>{priceMain}</Text>
                <Text style={[styles.pricePer, { color: "#111111" }]}>
                  {plan === "annual" ? `/ year` : `/ month`}
                </Text>
              </View>
              <Text style={[styles.priceNote, { color: "#111111" }]}>
                {plan === "annual" ? `that's ${PRICE.perMonth}/mo. billed yearly.` : "billed monthly. cancel anytime."}
              </Text>
            </View>
          </View>

          {/* Pro features */}
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>EVERYTHING IN PRO</Text>
          <View style={styles.shadowWrap}>
            <View style={[StyleSheet.absoluteFillObject, { pointerEvents: "none", transform: [{ translateX: BRUTAL.shadow }, { translateY: BRUTAL.shadow }], backgroundColor: colors.foreground, borderRadius: BRUTAL.radius }]} />
            <View style={[styles.featureBox, { backgroundColor: colors.card, borderColor: colors.foreground }]}>
              {PRO_FEATURES.map((f, i) => (
                <View
                  key={f}
                  style={[
                    styles.featureRow,
                    i > 0 && { borderTopWidth: 2, borderTopColor: colors.foreground },
                  ]}
                >
                  <View style={[styles.check, { backgroundColor: colors.primary, borderColor: colors.foreground }]}>
                    <Feather name="check" size={13} color={colors.primaryForeground} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Free tier */}
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>FREE FOREVER INCLUDES</Text>
          <View style={[styles.freeBox, { borderColor: colors.foreground, backgroundColor: colors.background }]}>
            {FREE_FEATURES.map((f) => (
              <Text key={f} style={[styles.freeText, { color: colors.mutedForeground }]}>
                {f}
              </Text>
            ))}
          </View>

          <Text style={[styles.legal, { color: colors.mutedForeground }]}>
            {plan === "annual"
              ? `billed ${PRICE.annual} yearly. renews automatically. cancel anytime.`
              : `billed ${PRICE.monthly} monthly. cancel anytime.`}
            {"\n"}no account needed for the free tier.
          </Text>
        </ScrollView>

        {/* CTA */}
        <View style={[styles.ctaArea, { borderTopColor: colors.foreground, backgroundColor: colors.background }]}>
          <BrutalButton label={`get pro  ·  ${priceMain}`} onPress={subscribe} />
          <Pressable onPress={onDismiss} style={styles.dismiss}>
            <Text style={[styles.dismissText, { color: colors.mutedForeground }]}>continue with free</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop:   { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet:      { position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: "94%", borderTopWidth: 4, borderLeftWidth: 0, borderRightWidth: 0 },
  handle:     { width: 44, height: 5, borderRadius: 0, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  content:    { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, gap: 18 },

  header:     { gap: 10 },
  proTag:     { alignSelf: "flex-start", borderWidth: BRUTAL.border, paddingHorizontal: 12, paddingVertical: 4, borderRadius: BRUTAL.radius },
  proTagText: { fontFamily: F.monoSemi, fontSize: 13, letterSpacing: 1 },
  title:      { fontFamily: F.displayBold, fontSize: 34, fontStyle: "italic", letterSpacing: -1 },
  subtitle:   { fontFamily: F.bodyReg, fontSize: 14, lineHeight: 21 },

  seg:        { flexDirection: "row", borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, overflow: "hidden" },
  segOpt:     { flex: 1, paddingVertical: 13, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  segText:    { fontFamily: F.bodyBold, fontSize: 14 },
  saveTag:    { borderWidth: 2, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 2 },
  saveText:   { fontFamily: F.monoSemi, fontSize: 9, letterSpacing: 0.5 },

  shadowWrap: { position: "relative", marginRight: BRUTAL.shadow, marginBottom: BRUTAL.shadow },
  priceBox:   { borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, padding: 18, gap: 4 },
  priceRow:   { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  priceMain:  { fontFamily: F.monoSemi, fontSize: 40, letterSpacing: -1 },
  pricePer:   { fontFamily: F.monoMed, fontSize: 15, marginBottom: 6 },
  priceNote:  { fontFamily: F.bodySemi, fontSize: 13 },

  sectionLabel: { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 1 },
  featureBox: { borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  check:      { width: 24, height: 24, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  featureText:{ flex: 1, fontFamily: F.bodyMed, fontSize: 14 },

  freeBox:    { borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, padding: 14, gap: 8 },
  freeText:   { fontFamily: F.bodyReg, fontSize: 13 },

  legal:      { fontFamily: F.bodyReg, fontSize: 11, lineHeight: 17, textAlign: "center" },

  ctaArea:    { paddingHorizontal: 24, paddingTop: 14, borderTopWidth: BRUTAL.border, gap: 6 },
  dismiss:    { paddingVertical: 10, alignItems: "center" },
  dismissText:{ fontFamily: F.bodyMed, fontSize: 14 },
});
