import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { useColors } from "@/hooks/useColors";

import { F } from "@/constants/fonts";

interface Props {
  label: string;
  onPress: () => void;
}

export function EvidenceButton({ label, onPress }: Props) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.primary + "18",
          borderColor: colors.primary + "40",
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      onPress={handlePress}
    >
      <Feather name="book-open" size={12} color={colors.primary} />
      <Text style={[styles.text, { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontFamily: F.bodySemi,
    letterSpacing: 0.2,
  },
});
