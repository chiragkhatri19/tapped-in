import { useColorScheme } from "react-native";
import colors from "@/constants/colors";
import { useThemeStore } from "@/stores/theme-store";

export function useColors() {
  const systemScheme = useColorScheme();
  const preference = useThemeStore((s) => s.preference);

  const scheme =
    preference === "system" ? systemScheme : preference;

  const palette =
    scheme === "dark" && "dark" in colors
      ? (colors as unknown as Record<string, typeof colors.light>).dark
      : colors.light;

  return { ...palette, radius: colors.radius };
}
