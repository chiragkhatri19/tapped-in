import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { F } from "@/constants/fonts";

interface Props {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
  sublabel?: string;
}

export function StatCard({ label, value, unit, accent, sublabel }: Props) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: accent ? colors.primary + "12" : colors.card,
          borderColor: accent ? colors.primary + "30" : colors.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <View style={styles.valueRow}>
        <Text
          style={[
            styles.value,
            { color: accent ? colors.primary : colors.foreground },
          ]}
        >
          {value}
        </Text>
        {unit && (
          <Text style={[styles.unit, { color: colors.mutedForeground }]}>
            {unit}
          </Text>
        )}
      </View>
      {sublabel && (
        <Text style={[styles.sublabel, { color: colors.mutedForeground }]}>
          {sublabel}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: F.bodyMed,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  value: {
    fontSize: 28,
    fontFamily: F.monoSemi,
  },
  unit: {
    fontSize: 13,
    fontFamily: F.bodyReg,
  },
  sublabel: {
    fontSize: 11,
    fontFamily: F.bodyReg,
    marginTop: 2,
  },
});
