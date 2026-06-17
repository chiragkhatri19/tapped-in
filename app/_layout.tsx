import "@/lib/nitro-polyfill";
import "../global.css";

import {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from "@expo-google-fonts/bricolage-grotesque";
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from "@expo-google-fonts/hanken-grotesk";
import {
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
} from "@expo-google-fonts/geist-mono";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OnboardingProvider } from "@/context/onboarding-context";
import { useAuthStore } from "@/stores/auth-store";
import { ensureCatalogReady } from "@/lib/catalog-db";
import { initSecureStorage } from "@/lib/storage";
import { runMigrationIfNeeded } from "@/lib/db/migration";
import { syncDatabase } from "@/lib/db/sync";
import { triggerBackgroundHealthSync } from "@/lib/health/background-sync";
import {
  requestNotificationPermission,
  scheduleWaterReminders,
  scheduleMealNudge,
  scheduleBedtimeWindDown,
  scheduleStreakRiskNudge,
} from "@/lib/notifications";
import "@/stores/profile-store";
import "@/stores/tracker-store";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const init = useAuthStore((s) => s.init);
  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, [init]);

  // Wire push notifications on first mount (request permission + schedule opted-in categories)
  useEffect(() => {
    requestNotificationPermission().then((granted) => {
      if (!granted) return;
      scheduleWaterReminders().catch(() => null);
      scheduleMealNudge().catch(() => null);
      scheduleBedtimeWindDown().catch(() => null);
      scheduleStreakRiskNudge().catch(() => null);
    }).catch(() => null);
  }, []);

  // Run MMKV→WatermelonDB migration once, then sync on session change
  useEffect(() => {
    if (!session) return;
    runMigrationIfNeeded()
      .then(() => syncDatabase())
      .catch((err) => console.warn('[Sync] init error:', err));
  }, [session?.user?.id]);

  // Foreground sync: re-sync DB + health data when app resumes
  useEffect(() => {
    if (!session) return;
    const { AppState } = require('react-native') as typeof import('react-native');
    const sub = AppState.addEventListener('change', (state: string) => {
      if (state === 'active') {
        syncDatabase().catch(() => null);
        triggerBackgroundHealthSync().catch(() => null);
      }
    });
    return () => sub.remove();
  }, [session?.user?.id]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth-callback" />
      <Stack.Screen
        name="log-meal"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="meal-review"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="plan"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="scan-barcode"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    GeistMono_400Regular,
    GeistMono_500Medium,
    GeistMono_600SemiBold,
  });
  const [catalogReady, setCatalogReady] = React.useState(false);

  useEffect(() => {
    // Hard 6-second timeout: some Android Keystore implementations (Realme,
    // MIUI, etc.) can hang indefinitely on SecureStore calls. If that happens
    // we skip encryption for this boot and still dismiss the splash screen.
    let settled = false;
    const done = () => { if (!settled) { settled = true; setCatalogReady(true); } };
    const timer = setTimeout(done, 6000);

    initSecureStorage()
      .then(() => ensureCatalogReady())
      .catch(() => {})
      .finally(() => { clearTimeout(timer); done(); });

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && catalogReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, catalogReady]);

  if ((!fontsLoaded && !fontError) || !catalogReady) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <OnboardingProvider>
                <RootLayoutNav />
              </OnboardingProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
