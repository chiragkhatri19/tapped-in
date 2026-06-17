// Neo-brutalist UI primitives - tappd in v4
// Hard offset shadows (cross-platform via an absolute block), thick black
// borders, squared corners, and a "press INTO the shadow" interaction.
//
// Shadow geometry: the offset shadow block lives OUTSIDE the visible face, so
// every shadowed primitive RESERVES `offset` px on its right + bottom (via an
// inner relative wrapper). Layout props the caller passes (margins, flex,
// alignSelf, width, position) are routed to the OUTERMOST element so spacing
// stays correct and the shadow never inflates or overlaps a neighbour.

import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { F } from "@/constants/fonts";
import { BRUTAL } from "@/constants/brutal";

// --- Style routing ------------------------------------------------------------
// Props that affect how the primitive sits in its parent belong on the outer
// wrapper; everything else (padding, background, flexDirection, gap...) is visual
// and belongs on the bordered face.
const OUTER_KEYS = new Set<string>([
  "margin", "marginTop", "marginBottom", "marginLeft", "marginRight",
  "marginHorizontal", "marginVertical", "marginStart", "marginEnd",
  "flex", "flexGrow", "flexShrink", "flexBasis",
  "alignSelf",
  "width", "minWidth", "maxWidth",
  "position", "top", "left", "right", "bottom", "start", "end", "zIndex",
]);

function splitStyle(style?: StyleProp<ViewStyle>): { outer: ViewStyle; inner: ViewStyle } {
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  const keys = Object.keys(flat);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    (OUTER_KEYS.has(key) ? outer : inner)[key] = flat[key];
  }
  return { outer: outer as ViewStyle, inner: inner as ViewStyle };
}

// --- Hard shadow wrapper ------------------------------------------------------
// Renders a solid offset block behind `children`. children must carry their own
// background + border and define their own size. `style` is treated as layout
// (applied to the outer element); shadow space is reserved automatically.
export function BrutalShadow({
  children,
  offset = BRUTAL.shadow,
  radius = BRUTAL.radius,
  color,
  style,
}: {
  children: React.ReactNode;
  offset?: number;
  radius?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  return (
    <View style={style}>
      <View style={{ position: "relative", marginRight: offset, marginBottom: offset }}>
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              transform: [{ translateX: offset }, { translateY: offset }],
              backgroundColor: color ?? colors.foreground,
              borderRadius: radius,
            },
          ]}
        />
        {children}
      </View>
    </View>
  );
}

// --- Box (bordered card with hard shadow) -------------------------------------
export function BrutalBox({
  children,
  style,
  shadow = true,
  offset = BRUTAL.shadow,
  radius = BRUTAL.radiusLg,
  background,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  shadow?: boolean;
  offset?: number;
  radius?: number;
  background?: string;
}) {
  const colors = useColors();
  const { outer, inner } = splitStyle(style);
  const face = (
    <View
      style={[
        {
          borderWidth: BRUTAL.border,
          borderColor: colors.foreground,
          backgroundColor: background ?? colors.card,
          borderRadius: radius,
        },
        inner,
      ]}
    >
      {children}
    </View>
  );
  if (!shadow) return <View style={outer}>{face}</View>;
  return (
    <BrutalShadow offset={offset} radius={radius} style={outer}>
      {face}
    </BrutalShadow>
  );
}

// --- Button (presses into its shadow) -----------------------------------------
export function BrutalButton({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
  icon,
  height = 56,
  style,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "pop";
  icon?: React.ReactNode;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const [pressed, setPressed] = useState(false);
  const { outer, inner } = splitStyle(style);

  const bg =
    variant === "primary" ? colors.primary
    : variant === "pop" ? colors.highlight
    : colors.card;
  const fg =
    variant === "primary" ? colors.primaryForeground
    : variant === "pop" ? "#111111"
    : colors.foreground;

  const showShadow = !disabled && !pressed;

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={outer}
    >
      <View style={[{ position: "relative", marginRight: BRUTAL.shadow, marginBottom: BRUTAL.shadow }, inner]}>
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              transform: [{ translateX: BRUTAL.shadow }, { translateY: BRUTAL.shadow }],
              backgroundColor: showShadow ? colors.foreground : "transparent",
              borderRadius: BRUTAL.radius,
            },
          ]}
        />
        <View
          style={{
            height,
            borderRadius: BRUTAL.radius,
            borderWidth: BRUTAL.border,
            borderColor: colors.foreground,
            backgroundColor: disabled ? colors.muted : bg,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            transform: pressed
              ? [{ translateX: BRUTAL.shadow }, { translateY: BRUTAL.shadow }]
              : [],
          }}
        >
          {loading ? (
            <ActivityIndicator color={fg} />
          ) : (
            <>
              <Text style={[bs.btnText, { color: disabled ? colors.mutedForeground : fg }]}>
                {label}
              </Text>
              {icon}
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// --- Chip / toggle ------------------------------------------------------------
export function BrutalChip({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const [pressed, setPressed] = useState(false);
  const { outer, inner } = splitStyle(style);
  const showShadow = !pressed;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={outer}
    >
      <View style={[{ position: "relative", marginRight: BRUTAL.shadowSm, marginBottom: BRUTAL.shadowSm }, inner]}>
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              transform: [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }],
              backgroundColor: showShadow ? colors.foreground : "transparent",
              borderRadius: BRUTAL.radius,
            },
          ]}
        />
        <View
          style={{
            borderWidth: BRUTAL.border,
            borderColor: colors.foreground,
            backgroundColor: selected ? colors.primary : colors.card,
            borderRadius: BRUTAL.radius,
            paddingHorizontal: 14,
            paddingVertical: 9,
            transform: pressed
              ? [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }]
              : [],
          }}
        >
          <Text
            style={[
              bs.chipText,
              { color: selected ? colors.primaryForeground : colors.foreground },
            ]}
          >
            {label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// --- Numeric / text input -----------------------------------------------------
export function BrutalInput({
  value,
  onChangeText,
  placeholder,
  suffix,
  keyboardType = "default",
  multiline = false,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  suffix?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  multiline?: boolean;
}) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const offset = BRUTAL.shadow;
  // Shadow space is RESERVED in layout (marginRight/Bottom) so the input box
  // aligns to the same grid as its label and never clips at the screen edge.
  return (
    <View style={{ position: "relative", marginRight: offset, marginBottom: offset }}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ translateX: offset }, { translateY: offset }],
            backgroundColor: colors.foreground,
            borderRadius: BRUTAL.radius,
          },
        ]}
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: multiline ? "flex-start" : "center",
          borderWidth: BRUTAL.border,
          borderColor: focused ? colors.primary : colors.foreground,
          backgroundColor: colors.card,
          borderRadius: BRUTAL.radius,
          paddingHorizontal: 14,
          minHeight: multiline ? 84 : 56,
        }}
      >
        <TextInput
          style={[bs.input, { color: colors.foreground, paddingTop: multiline ? 14 : 0, flex: 1 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="transparent"
          keyboardType={keyboardType}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {suffix ? <Text style={[bs.suffix, { color: colors.mutedForeground }]}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

// --- Progress (segmented brutalist blocks) ------------------------------------
export function BrutalProgress({ step, total }: { step: number; total: number }) {
  const colors = useColors();
  return (
    <View style={bs.progressRow}>
      <View style={bs.progressBlocks}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 12,
              borderWidth: BRUTAL.border,
              borderColor: colors.foreground,
              backgroundColor: i < step ? colors.primary : colors.card,
              borderRadius: 2,
            }}
          />
        ))}
      </View>
      <Text style={[bs.progressLabel, { color: colors.foreground }]}>
        {step}/{total}
      </Text>
    </View>
  );
}

const bs = StyleSheet.create({
  btnText: { fontFamily: F.bodyBold, fontSize: 16, letterSpacing: 0.2 },
  chipText: { fontFamily: F.bodySemi, fontSize: 13 },
  input: { fontFamily: F.mono, fontSize: 18 },
  suffix: { fontFamily: F.bodyMed, fontSize: 13, marginLeft: 6 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  progressBlocks: { flex: 1, flexDirection: "row", gap: 6 },
  progressLabel: { fontFamily: F.monoSemi, fontSize: 12 },
});
