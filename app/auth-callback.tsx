import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { supabase } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";

/**
 * OAuth deep-link landing route.
 *
 * Supabase redirects the in-app browser to `tapped-in://auth-callback?code=...`
 * after Google sign-in. On Android the OS frequently deep-links this custom
 * scheme straight into the app (rather than handing it back to
 * WebBrowser.openAuthSessionAsync), so we need a real screen here to trade the
 * PKCE `code` for a session. The verifier was persisted to SecureStore when the
 * flow started, so the exchange works even on a cold relaunch.
 *
 * After exchanging (or if there's nothing to do), we bounce to "/" which routes
 * via the auth/onboarding gate in app/index.tsx.
 */
export default function AuthCallback() {
  const colors = useColors();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        // Only exchange if we don't already have a session (avoids a double
        // exchange if signInWithGoogle's success path got there first).
        if (!data.session && typeof code === "string" && code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
      } catch {
        // Swallow — if the exchange failed there's simply no session, and the
        // gate below will route back to the sign-in screen.
      }
      router.replace("/");
    })();
  }, [code]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
