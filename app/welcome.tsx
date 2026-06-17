import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { F } from "@/constants/fonts";
import { BRUTAL } from "@/constants/brutal";
import { BrutalButton } from "@/components/brutal";

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[s.root, { minHeight: "100%", paddingTop: topPad + 28, paddingBottom: insets.bottom + 28 }]}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Logo and Wordmark */}
      <View style={s.brandingContainer}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={[
            s.logo,
            {
              borderColor: colors.foreground,
              backgroundColor: colors.background,
            },
          ]}
          resizeMode="contain"
        />
        <View style={s.wordmarkRow}>
          <Text style={[s.wordmark, { color: colors.foreground }]}>tappd in</Text>
          <View style={[s.dot, { backgroundColor: colors.primary, borderColor: colors.foreground }]} />
        </View>
      </View>

      {/* Hero statement — what we do, said once, big */}
      <View style={s.hero}>
        <Text style={[s.heroLine, { color: colors.foreground }]}>the fitness</Text>
        <Text style={[s.heroLine, { color: colors.foreground }]}>app that shows</Text>
        <View style={[s.markBox, { backgroundColor: colors.highlight, borderColor: colors.foreground }]}>
          <Text style={[s.markText, { color: "#111111" }]}>its work.</Text>
        </View>
        <Text style={[s.sub, { color: colors.mutedForeground }]}>
          evidence-based targets, built around how you actually live. every number cites a study.
        </Text>
      </View>

      {/* CTA */}
      <View style={s.bottom}>
        <BrutalButton
          label="get started"
          icon={<Feather name="arrow-right" size={18} color={colors.primaryForeground} />}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/(auth)/auth");
          }}
        />
        <Text style={[s.note, { color: colors.foreground }]}>2 minutes. account optional.</Text>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/(auth)/auth?mode=signin");
          }}
        >
          <Text style={[s.signInLink, { color: colors.mutedForeground }]}>
            already have an account?{" "}
            <Text style={{ color: colors.primary }}>sign in</Text>
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:        { flexGrow: 1, paddingHorizontal: 24, justifyContent: "space-between" },
  brandingContainer: { gap: 12, alignItems: "flex-start" },
  logo:        { width: 72, height: 72, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radiusLg },
  wordmarkRow: { flexDirection: "row", alignItems: "flex-end", gap: 7 },
  wordmark:    { fontFamily: F.displayBold, fontSize: 30, letterSpacing: -1, fontStyle: "italic" },
  dot:         { width: 11, height: 11, borderWidth: 3, marginBottom: 9 },

  hero:        { gap: 6, paddingVertical: 40 },
  heroLine:    { fontFamily: F.displayBold, fontSize: 52, fontStyle: "italic", letterSpacing: -2, lineHeight: 54 },
  markBox:     { alignSelf: "flex-start", borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, paddingHorizontal: 12, paddingVertical: 4, marginTop: 4 },
  markText:    { fontFamily: F.displayBold, fontSize: 52, fontStyle: "italic", letterSpacing: -2, lineHeight: 58 },
  sub:         { fontFamily: F.bodyReg, fontSize: 16, lineHeight: 24, marginTop: 24, maxWidth: "92%" },

  bottom:      { gap: 14 },
  note:        { fontFamily: F.bodyMed, fontSize: 13, textAlign: "center" },
  signInLink:  { fontFamily: F.bodyReg, fontSize: 14, textAlign: "center" },
});
