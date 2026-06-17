import { Tabs, Redirect } from "expo-router";
import React, { useState } from "react";
import { View, ActivityIndicator } from "react-native";

import { storage, STORAGE_KEYS } from "@/lib/storage";
import { PaywallModal } from "@/components/PaywallModal";
import { BrutalDock } from "@/components/navigation/BrutalDock";
import { dockTabTransitionSpec, dockTabSceneInterpolator } from "@/constants/tab-transition";
import { useAuthStore } from "@/stores/auth-store";
import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const [paywall, setPaywall] = useState(false);
  const { session, isLoading } = useAuthStore();
  const colors = useColors();

  // Auth is optional (local-first): unauthenticated users may use every tab.
  // We only gate on the auth store's initial load so session-dependent UI
  // (sync status, account row) doesn't render against a stale null session.
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const maybeShowPaywall = () => {
    if (!storage.getBoolean(STORAGE_KEYS.PAYWALL_SHOWN)) {
      storage.set(STORAGE_KEYS.PAYWALL_SHOWN, true);
      setPaywall(true);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          // Match the dock pill's spring so switching screens feels like one system.
          transitionSpec: dockTabTransitionSpec,
          sceneStyleInterpolator: dockTabSceneInterpolator,
        }}
        tabBar={(props) => <BrutalDock {...props} maybeShowPaywall={maybeShowPaywall} />}
      >
        <Tabs.Screen name="results" options={{ title: "home" }} />
        <Tabs.Screen name="index" options={{ title: "tracker" }} />
        <Tabs.Screen name="sleep" options={{ title: "recovery" }} />
        <Tabs.Screen name="workout" options={{ title: "workout" }} />
        <Tabs.Screen name="trainer" options={{ title: "coach" }} />
        <Tabs.Screen name="profile" options={{ href: null, title: "profile" }} />
        <Tabs.Screen name="evidence" options={{ href: null }} />
        <Tabs.Screen name="recipes" options={{ href: null }} />
      </Tabs>

      <PaywallModal visible={paywall} onDismiss={() => setPaywall(false)} />
    </View>
  );
}
