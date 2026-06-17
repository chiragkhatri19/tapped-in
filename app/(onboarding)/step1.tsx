import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useOnboarding } from "@/context/onboarding-context";
import { useColors } from "@/hooks/useColors";
import { F } from "@/constants/fonts";
import { BRUTAL } from "@/constants/brutal";
import { BrutalButton, BrutalInput, BrutalProgress } from "@/components/brutal";
import { Appear } from "@/components/motion/Appear";
import { Sex, UnitSystem } from "@/types";

export default function Step1() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { data, setData } = useOnboarding();

  const [sex, setSex] = useState<Sex | null>(data.sex ?? null);
  const [age, setAge] = useState(data.age?.toString() ?? "");
  const [unit, setUnit] = useState<UnitSystem>(data.unitSystem ?? "metric");

  const [heightCm, setHeightCm] = useState(data.heightCm?.toString() ?? "");
  const [weightKg, setWeightKg] = useState(data.weightKg?.toString() ?? "");
  const [heightFt, setHeightFt] = useState(() =>
    data.heightCm ? Math.floor(data.heightCm / 30.48).toString() : ""
  );
  const [heightIn, setHeightIn] = useState(() =>
    data.heightCm ? Math.round((data.heightCm / 2.54) % 12).toString() : ""
  );
  const [weightLbs, setWeightLbs] = useState(() =>
    data.weightKg ? Math.round(data.weightKg * 2.205).toString() : ""
  );

  const resolvedHeightCm =
    unit === "metric"
      ? parseFloat(heightCm)
      : (parseInt(heightFt || "0") * 12 + parseInt(heightIn || "0")) * 2.54;
  const resolvedWeightKg =
    unit === "metric" ? parseFloat(weightKg) : parseFloat(weightLbs || "0") / 2.205;

  const ageValid = age.length > 0 && parseInt(age) >= 15 && parseInt(age) <= 80;
  const bodyValid =
    resolvedHeightCm >= 100 && resolvedHeightCm <= 250 &&
    resolvedWeightKg >= 30 && resolvedWeightKg <= 300;
  const isValid = sex !== null && ageValid && bodyValid;

  const next = () => {
    if (!isValid || !sex) return;
    Haptics.selectionAsync();
    setData({
      sex,
      age: parseInt(age),
      unitSystem: unit,
      heightCm: Math.round(resolvedHeightCm * 10) / 10,
      weightKg: Math.round(resolvedWeightKg * 10) / 10,
    });
    router.push(from === 'profile' ? '/(onboarding)/step2?from=profile' : '/(onboarding)/step2' as never);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={[s.content, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 130 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <BrutalProgress step={1} total={3} />

          <Appear index={0}>
            <Text style={[s.heading, { color: colors.foreground }]}>about you.</Text>
            <Text style={[s.sub, { color: colors.mutedForeground }]}>
              the basics behind your bmr. takes about thirty seconds.
            </Text>
          </Appear>

          {/* Sex */}
          <Appear index={1}><View style={s.section}>
            <Text style={[s.label, { color: colors.foreground }]}>BIOLOGICAL SEX</Text>
            <View style={s.row}>
              {(["male", "female"] as Sex[]).map((value) => (
                <SexCard
                  key={value}
                  label={value}
                  hint="different bmr formula"
                  selected={sex === value}
                  onPress={() => { Haptics.selectionAsync(); setSex(value); }}
                  colors={colors}
                />
              ))}
            </View>
          </View></Appear>

          {/* Units */}
          <Appear index={2}><View style={s.section}>
            <Text style={[s.label, { color: colors.foreground }]}>UNITS</Text>
            <View style={[s.seg, { borderColor: colors.foreground, backgroundColor: colors.card }]}>
              {(["metric", "imperial"] as UnitSystem[]).map((u, i) => (
                <Pressable
                  key={u}
                  style={[
                    s.segOpt,
                    i === 0 && { borderRightWidth: BRUTAL.border, borderRightColor: colors.foreground },
                    unit === u && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setUnit(u); }}
                >
                  <Text style={[s.segText, { color: unit === u ? colors.primaryForeground : colors.foreground }]}>
                    {u === "metric" ? "kg / cm" : "lbs / ft"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View></Appear>

          {/* Age */}
          <Appear index={3}><View style={s.section}>
            <Text style={[s.label, { color: colors.foreground }]}>AGE</Text>
            <BrutalInput value={age} onChangeText={setAge} placeholder="24" keyboardType="numeric" />
          </View></Appear>

          {/* Height */}
          <Appear index={4}><View style={s.section}>
            <Text style={[s.label, { color: colors.foreground }]}>HEIGHT</Text>
            {unit === "metric" ? (
              <BrutalInput value={heightCm} onChangeText={setHeightCm} placeholder="175" suffix="cm" keyboardType="numeric" />
            ) : (
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <BrutalInput value={heightFt} onChangeText={setHeightFt} placeholder="5" suffix="ft" keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <BrutalInput value={heightIn} onChangeText={setHeightIn} placeholder="11" suffix="in" keyboardType="numeric" />
                </View>
              </View>
            )}
          </View></Appear>

          {/* Weight */}
          <Appear index={5}><View style={s.section}>
            <Text style={[s.label, { color: colors.foreground }]}>WEIGHT</Text>
            {unit === "metric" ? (
              <BrutalInput value={weightKg} onChangeText={setWeightKg} placeholder="72" suffix="kg" keyboardType="numeric" />
            ) : (
              <BrutalInput value={weightLbs} onChangeText={setWeightLbs} placeholder="160" suffix="lbs" keyboardType="numeric" />
            )}
          </View></Appear>
        </ScrollView>

        <View style={[s.footer, { backgroundColor: colors.background, paddingBottom: insets.bottom + 18, borderTopColor: colors.foreground }]}>
          <BrutalButton label="continue" onPress={next} disabled={!isValid} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function SexCard({
  label, hint, selected, onPress, colors,
}: {
  label: string; hint: string; selected: boolean; onPress: () => void; colors: ReturnType<typeof useColors>;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{ flex: 1, position: "relative" }}
    >
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { pointerEvents: "none", transform: [{ translateX: BRUTAL.shadow }, { translateY: BRUTAL.shadow }], backgroundColor: pressed ? "transparent" : colors.foreground, borderRadius: BRUTAL.radius },
        ]}
      />
      <View
        style={{
          borderWidth: BRUTAL.border, borderColor: colors.foreground, borderRadius: BRUTAL.radius,
          backgroundColor: selected ? colors.primary : colors.card, padding: 16, gap: 3,
          transform: pressed ? [{ translateX: BRUTAL.shadow }, { translateY: BRUTAL.shadow }] : [],
        }}
      >
        <Text style={[s.sexLabel, { color: selected ? colors.primaryForeground : colors.foreground }]}>{label}</Text>
        <Text style={[s.sexHint, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>{hint}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1 },
  content:  { paddingHorizontal: 24, gap: 22 },
  heading:  { fontFamily: F.displayBold, fontSize: 36, fontStyle: "italic", letterSpacing: -1 },
  sub:      { fontFamily: F.bodyReg, fontSize: 14, lineHeight: 21, marginTop: -10 },
  section:  { gap: 10 },
  label:    { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 1 },
  row:      { flexDirection: "row", gap: 14 },
  sexLabel: { fontFamily: F.bodyBold, fontSize: 17 },
  sexHint:  { fontFamily: F.bodyReg, fontSize: 11 },
  seg:      { flexDirection: "row", borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, overflow: "hidden" },
  segOpt:   { flex: 1, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  segText:  { fontFamily: F.bodySemi, fontSize: 14 },
  footer:   { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 16, borderTopWidth: BRUTAL.border },
});
