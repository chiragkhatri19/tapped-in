import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { F } from "@/constants/fonts";

interface MacroBarProps {
  proteinG: number;
  fatG: number;
  carbG: number;
  calories: number;
}

export function MacroBar({ proteinG, fatG, carbG }: MacroBarProps) {
  const colors = useColors();
  const proteinCal = proteinG * 4;
  const fatCal = fatG * 9;
  const carbCal = carbG * 4;
  const total = proteinCal + fatCal + carbCal;

  const proteinPct = Math.round((proteinCal / total) * 100);
  const fatPct = Math.round((fatCal / total) * 100);
  const carbPct = 100 - proteinPct - fatPct;

  return (
    <View style={styles.container}>
      {/* Bar */}
      <View style={[styles.bar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.segment,
            { width: `${proteinPct}%` as `${number}%`, backgroundColor: "#00C2A8" },
          ]}
        />
        <View
          style={[
            styles.segment,
            { width: `${fatPct}%` as `${number}%`, backgroundColor: "#FF7A1A" },
          ]}
        />
        <View
          style={[
            styles.segment,
            { width: `${carbPct}%` as `${number}%`, backgroundColor: "#2B3AFF" },
          ]}
        />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <MacroLegendItem
          color="#00C2A8"
          label="Protein"
          grams={proteinG}
          pct={proteinPct}
          colors={colors}
        />
        <MacroLegendItem
          color="#2B3AFF"
          label="Carbs"
          grams={carbG}
          pct={carbPct}
          colors={colors}
        />
        <MacroLegendItem
          color="#FF7A1A"
          label="Fat"
          grams={fatG}
          pct={fatPct}
          colors={colors}
        />
      </View>
    </View>
  );
}

function MacroLegendItem({
  color,
  label,
  grams,
  pct,
  colors,
}: {
  color: string;
  label: string;
  grams: number;
  pct: number;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <View>
        <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        <Text style={[styles.legendValue, { color: colors.foreground }]}>
          {grams}g
          <Text style={[styles.legendPct, { color: colors.mutedForeground }]}>
            {" "}
            {pct}%
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  bar: {
    flexDirection: "row",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  segment: {
    height: "100%",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 11,
    fontFamily: F.bodyReg,
  },
  legendValue: {
    fontSize: 14,
    fontFamily: F.monoSemi,
  },
  legendPct: {
    fontSize: 12,
    fontFamily: F.bodyReg,
  },
});
