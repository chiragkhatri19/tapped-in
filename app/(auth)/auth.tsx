import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "@/stores/auth-store";
import { useColors } from "@/hooks/useColors";
import { F } from "@/constants/fonts";
import { BRUTAL } from "@/constants/brutal";
import { BrutalButton } from "@/components/brutal";
import { Appear } from "@/components/motion/Appear";

type Screen = "main" | "otp";

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { signInWithGoogle, sendEmailOTP, verifyEmailOTP } = useAuthStore();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [screen, setScreen] = useState<Screen>("main");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingOTP, setLoadingOTP] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpRef = useRef<TextInput>(null);

  const isReturning = params.mode === "signin";
  const emailValid = email.trim().length > 4 && email.includes("@");

  // Navigate as soon as a session lands — handles both the WebBrowser success
  // path and the Android deep-link path where openAuthSessionAsync returns
  // 'dismiss' while the OS fires the tapped-in:///auth-callback deep link.
  const { session } = useAuthStore();
  React.useEffect(() => {
    if (session) router.replace("/");
  }, [session]);

  // ── Google ────────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingGoogle(true);
    setError(null);
    const err = await signInWithGoogle();
    setLoadingGoogle(false);
    // Don't navigate here — let the session useEffect above drive routing.
    // On Android the Chrome tab closes with type:'dismiss' before the deep
    // link fires, so the session may not be set yet at this point.
    if (err) setError(friendlyError(err));
  };

  // ── Email OTP — send ──────────────────────────────────────────────────────
  const handleSendCode = async () => {
    if (!emailValid || loadingEmail) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadingEmail(true);
    setError(null);
    const err = await sendEmailOTP(email.trim().toLowerCase());
    setLoadingEmail(false);
    if (err) { setError(friendlyError(err)); return; }
    setScreen("otp");
    setTimeout(() => otpRef.current?.focus(), 300);
  };

  // ── Email OTP — verify ────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otp.length < 6 || loadingOTP) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingOTP(true);
    setError(null);
    const err = await verifyEmailOTP(email.trim().toLowerCase(), otp.trim());
    setLoadingOTP(false);
    if (err) { setError(friendlyError(err)); return; }
    router.replace("/");
  };

  const skip = () => {
    Haptics.selectionAsync();
    // Returning users (entered via "sign in") just back out. Fresh users who
    // skip auth still need to onboard — send them straight into the flow so
    // app/index doesn't bounce them back to /welcome.
    if (isReturning) router.back();
    else router.replace("/(onboarding)/step1");
  };

  // ── OTP entry screen ──────────────────────────────────────────────────────
  if (screen === "otp") {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[s.root, { paddingTop: topPad + 28, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Appear index={0}>
            <View style={[s.pill, { backgroundColor: colors.highlight, borderColor: colors.foreground }]}>
              <Text style={[s.pillText, { color: "#111111" }]}>check your email.</Text>
            </View>
            <Text style={[s.heading, { color: colors.foreground }]}>enter the code.</Text>
            <Text style={[s.sub, { color: colors.mutedForeground }]}>
              we sent a 6-digit code to{" "}
              <Text style={{ color: colors.primary, fontFamily: F.bodyMed }}>{email.trim()}</Text>.
              {"\n"}it expires in 10 minutes.
            </Text>
          </Appear>

          <Appear index={1}>
            <View style={s.fieldGroup}>
              <Text style={[s.label, { color: colors.foreground }]}>verification code</Text>
              <BrutalTextInput
                ref={otpRef}
                value={otp}
                onChangeText={(t) => { setOtp(t); setError(null); if (t.length === 6) setTimeout(handleVerifyOTP, 100); }}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                colors={colors}
              />
            </View>
            {error && <ErrorBox text={error} colors={colors} />}
          </Appear>

          <Appear index={2}>
            <View style={s.actions}>
              <BrutalButton
                label={loadingOTP ? "..." : "verify"}
                onPress={handleVerifyOTP}
                disabled={otp.length < 6 || loadingOTP}
                icon={loadingOTP ? <ActivityIndicator size="small" color={colors.primaryForeground} /> : undefined}
              />
              <Pressable style={s.linkRow} onPress={() => { setLoadingEmail(false); handleSendCode(); }}>
                <Text style={[s.linkText, { color: colors.mutedForeground }]}>
                  didn't get it?{" "}
                  <Text style={{ color: colors.primary, fontFamily: F.bodySemi }}>resend code</Text>
                </Text>
              </Pressable>
              <Pressable style={s.linkRow} onPress={() => { setScreen("main"); setOtp(""); setError(null); }}>
                <Text style={[s.linkText, { color: colors.mutedForeground }]}>← change email</Text>
              </Pressable>
            </View>
          </Appear>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Main auth screen ──────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[s.root, { paddingTop: topPad + 28, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Appear index={0}>
          <View style={[s.pill, { backgroundColor: colors.highlight, borderColor: colors.foreground }]}>
            <Text style={[s.pillText, { color: "#111111" }]}>
              {isReturning ? "welcome back." : "let's get you set up."}
            </Text>
          </View>
          <Text style={[s.heading, { color: colors.foreground }]}>
            {isReturning ? "sign in." : "create your account."}
          </Text>
          <Text style={[s.sub, { color: colors.mutedForeground }]}>
            {isReturning
              ? "pick up right where you left off."
              : "free. sign in to sync across devices — or skip and use it locally."}
          </Text>
        </Appear>

        {/* Google button */}
        <Appear index={1}>
          <Pressable
            style={({ pressed }) => [
              s.googleBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.foreground,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={handleGoogle}
            disabled={loadingGoogle}
          >
            <View style={s.googleBtnInner}>
              {loadingGoogle ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <GoogleLogo size={20} />
              )}
              <Text style={[s.googleBtnText, { color: colors.foreground }]}>
                {loadingGoogle ? "signing in..." : "continue with Google"}
              </Text>
            </View>
          </Pressable>
        </Appear>

        {/* Divider */}
        <Appear index={2}>
          <View style={s.divider}>
            <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[s.dividerText, { color: colors.mutedForeground }]}>or use email</Text>
            <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
          </View>
        </Appear>

        {/* Email + send code */}
        <Appear index={3}>
          <View style={s.form}>
            <View style={s.fieldGroup}>
              <Text style={[s.label, { color: colors.foreground }]}>email address</Text>
              <BrutalTextInput
                value={email}
                onChangeText={(t) => { setEmail(t); setError(null); }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                colors={colors}
              />
            </View>
            {error && <ErrorBox text={error} colors={colors} />}
            <BrutalButton
              label={loadingEmail ? "..." : "send code"}
              variant="secondary"
              onPress={handleSendCode}
              disabled={!emailValid || loadingEmail}
              icon={loadingEmail ? <ActivityIndicator size="small" color={colors.foreground} /> : undefined}
            />
          </View>
        </Appear>

        {/* Skip */}
        <Appear index={4}>
          <Pressable style={s.linkRow} onPress={skip}>
            <Text style={[s.linkText, { color: colors.mutedForeground }]}>skip for now</Text>
          </Pressable>
        </Appear>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const BrutalTextInput = React.forwardRef<TextInput, {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "number-pad";
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences";
  autoComplete?: string;
  textContentType?: string;
  maxLength?: number;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}>(function BrutalTextInput({ value, onChangeText, placeholder, keyboardType, secureTextEntry,
  autoCapitalize, autoComplete, textContentType, maxLength, colors }, ref) {
  const [focused, setFocused] = useState(false);
  const offset = BRUTAL.shadow;
  return (
    <View style={{ position: "relative", marginRight: offset, marginBottom: offset }}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, {
        transform: [{ translateX: offset }, { translateY: offset }],
        backgroundColor: colors.foreground,
        borderRadius: BRUTAL.radius,
      }]} />
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType ?? "default"}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize ?? "sentences"}
        autoComplete={autoComplete as any}
        textContentType={textContentType as any}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[s.input, {
          borderColor: focused ? colors.primary : colors.foreground,
          backgroundColor: colors.card,
          color: colors.foreground,
          fontFamily: F.bodyReg,
        }]}
      />
    </View>
  );
});

function ErrorBox({ text, colors }: { text: string; colors: ReturnType<typeof import("@/hooks/useColors").useColors> }) {
  return (
    <View style={[s.errorBox, { backgroundColor: "#FF3B2F22", borderColor: "#FF3B2F" }]}>
      <Text style={[s.errorText, { color: "#FF3B2F" }]}>{text}</Text>
    </View>
  );
}

// Inline Google "G" logo SVG-free version (coloured squares)
function GoogleLogo({ size = 20 }: { size?: number }) {
  const s2 = size * 0.45;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", width: size, height: size }}>
        <View style={{ width: s2, height: s2, backgroundColor: "#4285F4" }} />
        <View style={{ width: s2, height: s2, backgroundColor: "#EA4335" }} />
        <View style={{ width: s2, height: s2, backgroundColor: "#34A853" }} />
        <View style={{ width: s2, height: s2, backgroundColor: "#FBBC05" }} />
      </View>
    </View>
  );
}

function friendlyError(msg: string): string {
  if (!msg) return "something went wrong. please try again.";
  if (msg.includes("Invalid") || msg.includes("invalid")) return "incorrect code. please try again.";
  if (msg.includes("expired") || msg.includes("Expired")) return "code expired. tap 'resend' to get a new one.";
  if (msg.includes("Email not confirmed")) return "confirm your email first, then try again.";
  if (msg.includes("rate limit") || msg.includes("Too many")) return "too many attempts. wait a minute and try again.";
  if (msg.includes("network") || msg.includes("fetch")) return "network error. check your connection.";
  return msg.toLowerCase();
}

const s = StyleSheet.create({
  root:       { flexGrow: 1, paddingHorizontal: 24, gap: 28 },

  pill:       { alignSelf: "flex-start", borderWidth: BRUTAL.border, borderRadius: BRUTAL.radiusPill, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 10 },
  pillText:   { fontFamily: F.bodySemi, fontSize: 13, letterSpacing: 0.2 },
  heading:    { fontFamily: F.displayBold, fontSize: 44, fontStyle: "italic", letterSpacing: -1.5, lineHeight: 48 },
  sub:        { fontFamily: F.bodyReg, fontSize: 15, lineHeight: 22, marginTop: 8, maxWidth: "92%" },

  googleBtn: {
    borderWidth: BRUTAL.border,
    borderRadius: BRUTAL.radius,
    paddingVertical: 15,
    paddingHorizontal: 18,
    // Hard offset shadow
    shadowColor: "#111111",
    shadowOffset: { width: BRUTAL.shadow, height: BRUTAL.shadow },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: BRUTAL.shadow,
  },
  googleBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  googleBtnText:  { fontFamily: F.bodySemi, fontSize: 16 },

  divider:    { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine:{ flex: 1, height: 2 },
  dividerText:{ fontFamily: F.bodyMed, fontSize: 13 },

  form:       { gap: 16 },
  fieldGroup: { gap: 6 },
  label:      { fontFamily: F.bodySemi, fontSize: 13, letterSpacing: 0.3, textTransform: "lowercase" },
  input:      { borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },

  errorBox:   { borderWidth: BRUTAL.borderThin, borderRadius: BRUTAL.radius, padding: 12 },
  errorText:  { fontFamily: F.bodyMed, fontSize: 14 },

  actions:    { gap: 16 },
  linkRow:    { alignItems: "center", paddingVertical: 8 },
  linkText:   { fontFamily: F.bodyReg, fontSize: 14 },
});
