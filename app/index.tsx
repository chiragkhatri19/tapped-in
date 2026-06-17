import { Redirect } from "expo-router";
import { useProfile } from "@/stores/profile-store";
import { useAuthStore } from "@/stores/auth-store";
import { View, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function RootIndex() {
  const { hasCompletedOnboarding, isLoading: profileLoading } = useProfile();
  const { session, isLoading: authLoading, reconciling } = useAuthStore();
  const colors = useColors();

  // `reconciling` covers the post-sign-in cloud pull for returning users —
  // hold the spinner so we don't route to /welcome before their profile lands.
  if (profileLoading || authLoading || reconciling) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // Signed in + done onboarding → main app
  if (session && hasCompletedOnboarding) return <Redirect href="/(tabs)/results" />;

  // Signed in but no profile yet (new account, or fresh device with no cloud
  // profile to reconcile) → run onboarding. Auth now sits *before* onboarding.
  if (session && !hasCompletedOnboarding) return <Redirect href="/(onboarding)/step1" />;

  // No session + onboarding complete → go straight to app (skipped auth, local-first)
  if (!session && hasCompletedOnboarding) return <Redirect href="/(tabs)/results" />;

  // Fresh user — no session, no onboarding
  return <Redirect href="/welcome" />;
}
