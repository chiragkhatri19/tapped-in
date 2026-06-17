/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView, Platform, Alert, Linking, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing, type SharedValue } from 'react-native-reanimated';

import { speak as speechSpeak, stopSpeech } from '@/lib/coach/speech';
import { useTalkMode } from '@/hooks/useTalkMode';
import { VoiceBar } from '@/components/coach/VoiceBar';

import { useColors }       from '@/hooks/useColors';
import { useCompleteness } from '@/hooks/useCompleteness';
import { useProfile }      from '@/stores/profile-store';
import { useTrackerStore } from '@/stores/tracker-store';
import { useHydrationStore } from '@/stores/hydration-store';
import { useWorkoutStore } from '@/stores/workout-store';
import { useCoachStore, migrateLegacyCoachHistory } from '@/stores/coach-store';
import type { PendingWorkoutAction } from '@/stores/coach-store';
import { BrutalBox } from '@/components/brutal';
import { Appear } from '@/components/motion/Appear';
import { EvidenceModal } from '@/components/EvidenceModal';
import { EVIDENCE_CARDS } from '@/data/evidence';
import type { EvidenceCard } from '@/types';
import { DOCK_SAFE_BOTTOM } from '@/components/navigation/BrutalDock';
import { useUiStore } from '@/stores/ui-store';
import { HeaderMenuButton } from '@/components/navigation/HeaderMenuButton';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';

import { sendToCoach } from '@/lib/coach/client';
import { assembleCoachContext } from '@/lib/coach/prompt';
import { matchLocalIntent } from '@/lib/coach/local-intent';
import { checkGuardrail } from '@/lib/coach/guardrail';
import type { CoachMessage, CoachResponse, CoachAction, NavigateAction, LogMealAction, LogMealsBatchAction, GenerateWorkoutAction, StartWorkoutAction, EditWorkoutAction, EditNotesAction } from '@/lib/coach/actions';
import { ALLOWED_ROUTES }     from '@/lib/coach/actions';
import CoachMealCard          from '@/components/coach/CoachMealCard';
import CoachActionCard        from '@/components/coach/CoachActionCard';

// ─── Text parser ─────────────────────────────────────────────────────────────

type Segment = { type: 'para'; text: string } | { type: 'bullet'; text: string };

function parseSegments(raw: string): Segment[] {
  const segments: Segment[] = [];
  const paras = raw.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  for (let i = 0; i < paras.length; i++) {
    const para = paras[i];
    const lines = para.split('\n').map(l => l.trim()).filter(Boolean);
    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];
      if (/^[-•*]\s/.test(line)) {
        segments.push({ type: 'bullet', text: line.replace(/^[-•*]\s+/, '') });
      } else {
        segments.push({ type: 'para', text: line });
      }
    }
  }
  return segments.length ? segments : [{ type: 'para', text: raw }];
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDot({ dot, color }: { dot: SharedValue<number>; color: string }) {
  const style = useAnimatedStyle(() => ({ opacity: dot.value }));
  return <Animated.View style={[{ width: 7, height: 7, borderRadius: 2, backgroundColor: color }, style]} />;
}

function TypingDots() {
  const colors = useColors();
  const dots = [useSharedValue(0.3), useSharedValue(0.3), useSharedValue(0.3)];
  useEffect(() => {
    dots.forEach((dot, i) => {
      dot.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: i * 200 }),
          withTiming(1,   { duration: 350, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 350, easing: Easing.inOut(Easing.ease) }),
        ), -1, false
      );
    });
  }, []);
  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 6 }}>
      {dots.map((dot, i) => (
        <TypingDot key={i} dot={dot} color={colors.foreground} />
      ))}
    </View>
  );
}

// ─── Message text ─────────────────────────────────────────────────────────────

function MessageText({ text, colors }: { text: string; colors: ReturnType<typeof useColors> }) {
  const segments = parseSegments(text);
  return (
    <View style={{ gap: 6 }}>
      {segments.map((seg, i) =>
        seg.type === 'bullet' ? (
          <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <View style={[s.bulletDot, { backgroundColor: colors.foreground, marginTop: 7 }]} />
            <Text style={[s.msgText, { color: colors.foreground, flex: 1 }]}>{seg.text}</Text>
          </View>
        ) : (
          <Text key={i} style={[s.msgText, { color: colors.foreground }]}>{seg.text}</Text>
        )
      )}
    </View>
  );
}

// ─── Verdict banner ───────────────────────────────────────────────────────────

type VerdictRating = 'legit' | 'myth' | 'depends';

const VERDICT_CONFIG: Record<VerdictRating, { icon: string; label: string; bgKey: keyof ReturnType<typeof useColors> }> = {
  myth:    { icon: 'x-circle',     label: 'MYTH',       bgKey: 'persimmon' },
  legit:   { icon: 'check-circle', label: 'CHECKS OUT', bgKey: 'teal' },
  depends: { icon: 'alert-circle', label: 'DEPENDS',    bgKey: 'orange' },
};

function VerdictBanner({ rating, claim, colors }: { rating: VerdictRating; claim: string; colors: ReturnType<typeof useColors> }) {
  const cfg = VERDICT_CONFIG[rating];
  const bg = colors[cfg.bgKey] as string;
  return (
    <View style={[s.verdictBanner, { backgroundColor: bg, borderColor: colors.foreground }]}>
      <Feather name={cfg.icon as any} size={14} color={colors.foreground} />
      <Text style={[s.verdictLabel, { color: colors.foreground }]}>{cfg.label}</Text>
      <Text style={[s.verdictClaim, { color: colors.foreground }]} numberOfLines={2}>{claim}</Text>
    </View>
  );
}

// ─── Action buttons ───────────────────────────────────────────────────────────

function ActionButtons({
  actions, colors, router, setPendingWorkoutAction,
}: {
  actions: CoachAction[];
  colors: ReturnType<typeof useColors>;
  router: ReturnType<typeof useRouter>;
  setPendingWorkoutAction: (action: PendingWorkoutAction) => void;
}) {
  if (actions.length === 0) return null;
  return (
    <View style={{ gap: 6, marginTop: 4 }}>
      {actions.map((action, i) => {
        // Meal logging — handled by CoachMealCard
        if (action.kind === 'log_meal' || action.kind === 'log_meals_batch') {
          return (
            <CoachMealCard
              key={i}
              action={action as LogMealAction | LogMealsBatchAction}
            />
          );
        }

        // Navigation
        if (action.kind === 'navigate') {
          return (
            <Pressable
              key={i}
              onPress={() => {
                const route = (action as NavigateAction).route;
                if ((ALLOWED_ROUTES as readonly string[]).includes(route)) {
                  router.push(route as any);
                }
              }}
              style={({ pressed }) => [
                s.actionBtn,
                {
                  borderColor:     colors.foreground,
                  backgroundColor: pressed ? colors.primary : colors.card,
                  transform:       pressed ? [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }] : [],
                },
              ]}
            >
              <Feather name="arrow-right" size={13} color={colors.foreground} />
              <Text style={[s.actionBtnTxt, { color: colors.foreground }]}>{action.label}</Text>
            </Pressable>
          );
        }

        // Inline confirm cards — quick_log, edit_profile, manage_plan,
        // edit_workout (set_active / update_meta)
        if (
          action.kind === 'quick_log' ||
          action.kind === 'log_weight' ||
          action.kind === 'edit_profile' ||
          action.kind === 'manage_plan' ||
          (action.kind === 'edit_workout' && (action.op === 'set_active' || action.op === 'update_meta'))
        ) {
          return <CoachActionCard key={i} action={action} />;
        }

        // Pending-signal workout actions — generate, start, swap_exercise,
        // all edit_notes — navigate to workout tab after setting signal
        if (
          action.kind === 'generate_workout' ||
          action.kind === 'start_workout' ||
          (action.kind === 'edit_workout' && action.op === 'swap_exercise') ||
          action.kind === 'edit_notes'
        ) {
          return (
            <Pressable
              key={i}
              onPress={() => {
                if (action.kind === 'generate_workout') {
                  setPendingWorkoutAction({ kind: 'generate', inputs: (action as GenerateWorkoutAction).inputs ?? {} });
                } else if (action.kind === 'start_workout') {
                  setPendingWorkoutAction({ kind: 'start', sessionName: (action as StartWorkoutAction).sessionName });
                } else if (action.kind === 'edit_workout') {
                  const a = action as EditWorkoutAction;
                  setPendingWorkoutAction({ kind: 'edit_plan', planId: a.planId, op: a.op, patch: a.patch });
                } else if (action.kind === 'edit_notes') {
                  const a = action as EditNotesAction;
                  const target = (a.target === 'session' || a.target === 'log') ? a.target : 'session';
                  setPendingWorkoutAction({ kind: 'edit_notes', target, id: a.id, sessionName: a.sessionName, text: a.text });
                }
                router.push('/(tabs)/workout');
              }}
              style={({ pressed }) => [
                s.actionBtn,
                {
                  borderColor:     colors.foreground,
                  backgroundColor: pressed ? colors.primary : colors.card,
                  transform:       pressed ? [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }] : [],
                },
              ]}
            >
              <Feather name="arrow-right" size={13} color={colors.foreground} />
              <Text style={[s.actionBtnTxt, { color: colors.foreground }]}>{action.label}</Text>
            </Pressable>
          );
        }

        return null;
      })}
    </View>
  );
}

// ─── Auto-applied actions ───────────────────────────────────────────────────
// Safe, scalar logs (water) apply the moment the coach proposes them, so voice
// users who never tap a confirm card still get their data saved. Runs exactly
// once per response at send-time (not on re-render or app restart). Meals still
// route through review (oil + weight confirmation — CLAUDE.md rules 4 & 5).

function applyCoachAutoActions(res: CoachResponse) {
  for (const action of res.actions) {
    if (action.kind === 'quick_log') {
      // Normalize the unit — the model sometimes returns litres or glasses
      // instead of ml, which would otherwise log a near-zero amount.
      const unit = (action.unit || 'ml').toLowerCase();
      let value = action.value;
      if (/glass|cup|bottle/.test(unit)) value = action.value * (useHydrationStore.getState().settings.glassSizeMl || 250);
      else if (/^l$|litre|liter/.test(unit)) value = action.value * 1000;
      const ml = Math.round(value);
      if (!Number.isFinite(ml) || ml <= 0) continue;
      if (action.logType === 'water_set') useTrackerStore.getState().setWater(ml);
      else useTrackerStore.getState().addWater(ml);
    } else if (action.kind === 'log_weight') {
      const kg = action.weightKg;
      // logWeight keys by YYYY-MM-DD; coerce any ISO date, ignore anything else.
      const dateKey = action.date && /^\d{4}-\d{2}-\d{2}/.test(action.date)
        ? action.date.slice(0, 10)
        : undefined;
      if (Number.isFinite(kg) && kg > 0) useTrackerStore.getState().logWeight(kg, dateKey);
    }
  }
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function TrainerScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();

  const setDockVisible = useUiStore((s) => s.setDockVisible);

  const { profile: rawProfile, result } = useProfile();

  useFocusEffect(
    useCallback(() => {
      setDockVisible(true);
      return () => setDockVisible(true);
    }, [setDockVisible])
  );
  const { todayCompleteness, tappedInScore } = useCompleteness();
  const dailyLogs    = useTrackerStore(s => s.dailyLogs ?? {});
  const workoutPlans = useWorkoutStore(s => s.plans ?? []);
  const workoutLogs  = useWorkoutStore(s => s.logs ?? []);
  const exercisePRs  = useWorkoutStore(s => s.exercisePRs ?? {});
  const setPendingWorkoutAction = useCoachStore(s => s.setPendingWorkoutAction);

  const activePlan = useMemo(
    () => (workoutPlans ?? []).find(p => p?.isActive) ?? workoutPlans?.[0] ?? null,
    [workoutPlans]
  );
  const recentLogs = useMemo(
    () => [...(workoutLogs ?? [])]
      .filter(w => w && w.startedAt)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 5),
    [workoutLogs]
  );

  const messages          = useCoachStore(s => s.messages ?? []);
  const addMessage        = useCoachStore(s => s.addMessage);
  const clearMessages     = useCoachStore(s => s.clearMessages);
  const voiceOutputEnabled    = useCoachStore(s => s.voiceOutputEnabled);
  const setVoiceOutputEnabled = useCoachStore(s => s.setVoiceOutputEnabled);

  const [inputText,   setInputText]   = useState('');
  const [isTyping,    setIsTyping]    = useState(false);
  const [typingLabel, setTypingLabel] = useState('thinking...');
  const [activeEvidence, setActiveEvidence] = useState<EvidenceCard | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef    = useRef<ScrollView>(null);
  const sessionCalls = useRef(0);
  const SESSION_CALL_LIMIT = 60;

  const topPad    = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => { migrateLegacyCoachHistory(); }, []);

  // Stop speech when leaving the screen
  useEffect(() => () => { stopSpeech(); }, []);

  useEffect(() => {
    if (messages.length > 0)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isTyping]);

  const ctx = assembleCoachContext(dailyLogs, rawProfile, result, activePlan, recentLogs, exercisePRs, workoutPlans);
  ctx.tappedInScore = tappedInScore;
  ctx.ringsClosed = todayCompleteness.ringsClosed;
  ctx.totalRings = 4;

  // Smart empty-state suggestions — action-first, context-aware
  const suggestions: string[] = [];
  if (ctx.todayRemaining.proteinG > 30)
    suggestions.push(`suggest a meal. i need ${Math.round(ctx.todayRemaining.proteinG)}g more protein today.`);
  else
    suggestions.push('how is my nutrition looking today?');
  if (ctx.todaySession)
    suggestions.push(`what should i eat before ${ctx.todaySession}?`);
  if (ctx.recentWorkouts.length > 0)
    suggestions.push('how was my training this week?');
  else
    suggestions.push('how am i doing this week overall?');
  const waterMl = ctx.micros.waterMl;
  const waterTargetMl = ctx.micros.waterTargetMl;
  if (waterTargetMl > 0 && waterMl < waterTargetMl * 0.6)
    suggestions.push('did i drink enough water today?');
  if (ctx.avg7DayCalories && ctx.avg7DayCalories < ctx.targetCalories - 150)
    suggestions.push("i've been under calories all week. is that hurting me?");
  suggestions.push('is something i saw in a reel actually true?');
  suggestions.push(`why is my protein target ${ctx.targetProteinG}g?`);
  const topSuggestions = suggestions.slice(0, 4);

  // ── Shared reply handler ─────────────────────────────────────────────────

  function handleCoachReply(res: CoachResponse) {
    addMessage({
      id: (Date.now() + 1).toString(),
      role: 'coach',
      text: res.message,
      parsed: res,
      timestamp: new Date().toISOString(),
    });

    if (voiceOutputEnabled) {
      stopSpeech();
      speechSpeak(res.message, { rate: 0.95 });
    }
  }

  // ── Shared coach pipeline (used by both text input and talk mode) ─────────

  const askCoach = useCallback(async (msg: string): Promise<CoachResponse> => {
    const prevMessages = [...messages];

    addMessage({
      id: Date.now().toString(),
      role: 'user',
      text: msg,
      timestamp: new Date().toISOString(),
    });

    let cachedCtx: ReturnType<typeof assembleCoachContext> | null = null;

    try {
      const blocked = checkGuardrail(msg);
      if (blocked) {
        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'coach',
          text: blocked.message,
          parsed: blocked,
          timestamp: new Date().toISOString(),
        });
        return blocked;
      }

      cachedCtx = assembleCoachContext(dailyLogs, rawProfile, result, activePlan, recentLogs, exercisePRs, workoutPlans);

      const local = matchLocalIntent(msg, cachedCtx);
      if (local) {
        applyCoachAutoActions(local);
        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'coach',
          text: local.message,
          parsed: local,
          timestamp: new Date().toISOString(),
        });
        return local;
      }

      // Warn at 50 so users aren't surprised by the hard stop at 60
      if (sessionCalls.current === SESSION_CALL_LIMIT - 10) {
        addMessage({
          id: (Date.now() - 1).toString(),
          role: 'coach',
          text: `heads up — you've used ${sessionCalls.current} of ${SESSION_CALL_LIMIT} messages this session. ${SESSION_CALL_LIMIT - sessionCalls.current} left before you'll need to restart the app.`,
          parsed: { message: '', citations: [], actions: [], followUpSuggestions: [], isOffTopic: false },
          timestamp: new Date().toISOString(),
        });
      }

      if (sessionCalls.current >= SESSION_CALL_LIMIT) {
        const limitRes: CoachResponse = {
          message: `you've reached the ${SESSION_CALL_LIMIT}-message session limit. restart the app to continue.`,
          citations: [], actions: [], followUpSuggestions: [], isOffTopic: false,
        };
        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'coach',
          text: limitRes.message,
          parsed: limitRes,
          timestamp: new Date().toISOString(),
        });
        return limitRes;
      }
      sessionCalls.current += 1;

      const res: CoachResponse = await sendToCoach(msg, prevMessages, cachedCtx);
      applyCoachAutoActions(res);
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'coach',
        text: res.message,
        parsed: res,
        timestamp: new Date().toISOString(),
      });
      return res;

    } catch (err) {
      console.warn('[coach] askCoach failed, falling back to local intent:', err instanceof Error ? err.message : err);
      const fallbackCtx = cachedCtx ?? assembleCoachContext(dailyLogs, rawProfile, result, activePlan, recentLogs, exercisePRs, workoutPlans);
      const local = matchLocalIntent(msg, fallbackCtx);
      if (local) {
        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'coach',
          text: local.message,
          parsed: local,
          timestamp: new Date().toISOString(),
        });
        return local;
      }

      const errRes: CoachResponse = {
        message: 'connection issue. try again in a sec.',
        citations: [], actions: [], followUpSuggestions: [], isOffTopic: false,
      };
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'coach',
        text: errRes.message,
        parsed: errRes,
        timestamp: new Date().toISOString(),
      });
      return errRes;
    }
  }, [messages, dailyLogs, rawProfile, result, activePlan, recentLogs, exercisePRs, workoutPlans, addMessage]);

  // ── Talk mode ─────────────────────────────────────────────────────────────

  const [showTalkMode, setShowTalkMode] = useState(false);

  const talkMode = useTalkMode({
    askCoach,
    onOpen:  () => setShowTalkMode(true),
    onClose: () => setShowTalkMode(false),
  });

  // ── Text send ─────────────────────────────────────────────────────────────

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? inputText).trim();
    if (!msg || isTyping) return;

    setInputText('');
    setTypingLabel('thinking...');
    setIsTyping(true);
    // Switch to "asking gemini..." after 1.5s if still waiting — local intents resolve instantly
    typingTimer.current = setTimeout(() => setTypingLabel('asking gemini...'), 1500);
    try {
      const res = await askCoach(msg);
      if (voiceOutputEnabled) {
        stopSpeech();
        speechSpeak(res.message, { rate: 0.95 });
      }
    } finally {
      if (typingTimer.current) { clearTimeout(typingTimer.current); typingTimer.current = null; }
      setIsTyping(false);
      setTypingLabel('thinking...');
    }
  }, [inputText, isTyping, askCoach, voiceOutputEnabled]);

  // ── Clear ─────────────────────────────────────────────────────────────────

  function handleClear() {
    stopSpeech();
    Alert.alert(
      'clear conversation?',
      "coach's memory resets. your meals and workout plan stay.",
      [
        { text: 'cancel', style: 'cancel' },
        { text: 'clear', style: 'destructive', onPress: clearMessages },
      ]
    );
  }

  // ── Single message ────────────────────────────────────────────────────────

  function renderMessage(msg: CoachMessage, idx: number) {
    const isUser = msg.role === 'user';
    const isLast = idx === messages.length - 1;
    const citations = msg.parsed?.citations ?? [];
    const followUps = (msg.parsed?.followUpSuggestions ?? []).slice(0, 3);
    const actions   = isLast ? (msg.parsed?.actions ?? []) : [];
    const verdict   = msg.parsed?.verdict;

    if (isUser) {
      return (
        <View key={msg.id} style={s.userRow}>
          <View style={[s.userBubble, { backgroundColor: colors.primary, borderColor: colors.foreground }]}>
            <Text style={[s.userText, { color: colors.primaryForeground }]}>{msg.text}</Text>
          </View>
          <Text style={[s.timestamp, { color: colors.mutedForeground }]}>{fmtTime(msg.timestamp)}</Text>
        </View>
      );
    }

    return (
      <View key={msg.id} style={s.coachRow}>
        <View style={s.coachMeta}>
          <View style={[s.coachDot, { backgroundColor: colors.violet, borderColor: colors.foreground }]} />
          <Text style={[s.coachLabel, { color: colors.mutedForeground }]}>coach · {fmtTime(msg.timestamp)}</Text>
          {/* Per-message speak button for text-typed turns */}
          <Pressable
            onPress={() => speechSpeak(msg.text, { rate: 0.95 })}
            hitSlop={10}
            style={{ marginLeft: 4 }}
          >
            <Feather name="volume-2" size={12} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <BrutalBox style={s.coachBubble} offset={4}>
          {verdict && (
            <VerdictBanner
              rating={verdict.rating}
              claim={verdict.claim}
              colors={colors}
            />
          )}
          <MessageText text={msg.text} colors={colors} />
          <ActionButtons actions={actions} colors={colors} router={router} setPendingWorkoutAction={setPendingWorkoutAction} />
        </BrutalBox>

        {citations.length > 0 && (
          <View style={s.citList}>
            {citations.map((c, i) => {
              const matchedCard = c?.doi
                ? EVIDENCE_CARDS.find(card => card.citations.some(cc => cc.doi === c.doi))
                : undefined;
              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    if (matchedCard) { setActiveEvidence(matchedCard); return; }
                    if (c?.doi) Linking.openURL(`https://doi.org/${c.doi}`).catch(() => {});
                  }}
                  disabled={!c?.doi && !matchedCard}
                  style={[s.citCard, { borderColor: colors.foreground, backgroundColor: colors.muted }]}
                >
                  <View style={s.citCardInner}>
                    <Feather name="book-open" size={13} color={colors.violet} style={{ marginTop: 1 }} />
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={[s.citClaim, { color: colors.foreground }]} numberOfLines={2}>{c?.claim}</Text>
                      <Text style={[s.citMeta, { color: colors.mutedForeground }]}>{c?.authors} · {c?.year} · {c?.journal}</Text>
                    </View>
                    {(c?.doi || matchedCard) ? (
                      <View style={[s.citLinkBadge, { backgroundColor: matchedCard ? colors.teal : colors.violet, borderColor: colors.foreground }]}>
                        <Text style={s.citLinkText}>{matchedCard ? 'library' : 'read'}</Text>
                        <Feather name={matchedCard ? 'book' : 'external-link'} size={9} color="#fff" />
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {followUps.length > 0 && (
          <View style={s.sugRow}>
            {followUps.map((q, i) => (
              <Pressable
                key={i}
                onPress={() => handleSend(q)}
                style={[s.sugChip, { borderColor: colors.foreground, backgroundColor: colors.card }]}
              >
                <Text style={[s.sugText, { color: colors.foreground }]}>{q}</Text>
                <Feather name="arrow-right" size={11} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[s.root, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 10, borderBottomColor: colors.foreground, backgroundColor: colors.background }]}>
        <View style={{ gap: 2 }}>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>coach.</Text>
          <Text style={[s.headerSub, { color: colors.mutedForeground }]}>evidence-based. cites its work.</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {/* Voice output mute toggle */}
          <Pressable
            onPress={() => {
              if (voiceOutputEnabled) stopSpeech();
              setVoiceOutputEnabled(!voiceOutputEnabled);
            }}
            hitSlop={12}
            style={[s.headerBtn, { borderColor: colors.foreground, backgroundColor: voiceOutputEnabled ? colors.violet : colors.background }]}
          >
            <Feather name={voiceOutputEnabled ? 'volume-2' : 'volume-x'} size={14} color={voiceOutputEnabled ? '#fff' : colors.mutedForeground} />
          </Pressable>
          {messages.length > 0 && (
            <Pressable onPress={handleClear} hitSlop={12} style={[s.headerBtn, { borderColor: colors.foreground }]}>
              <Feather name="trash-2" size={14} color={colors.mutedForeground} />
            </Pressable>
          )}
          <HeaderMenuButton />
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={s.messageList}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={s.empty}>
            <Appear index={0} style={{ alignItems: 'center', width: '100%', gap: 12 }}>
              <View style={[s.emptyDot, { backgroundColor: colors.violet, borderColor: colors.foreground }]} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>ask me anything.</Text>
              <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
                i know your macros, your meals, and your training. every answer cites a study.
              </Text>
            </Appear>
            <Appear index={1}>
              <View style={s.sugGrid}>
                {topSuggestions.map((p, i) => (
                  <Pressable key={i} onPress={() => handleSend(p)}
                    style={[s.emptySugCard, { borderColor: colors.foreground, backgroundColor: colors.card }]}>
                    <Text style={[s.emptySugText, { color: colors.foreground }]}>{p}</Text>
                    <Feather name="arrow-right" size={13} color={colors.mutedForeground} style={{ marginTop: 4 }} />
                  </Pressable>
                ))}
              </View>
            </Appear>
          </View>
        ) : (
          <>
            {messages.map((m, i) => renderMessage(m, i))}
            {isTyping && (
              <View style={s.coachRow}>
                <View style={s.coachMeta}>
                  <View style={[s.coachDot, { backgroundColor: colors.violet, borderColor: colors.foreground }]} />
                  <Text style={[s.coachLabel, { color: colors.mutedForeground }]}>coach · {typingLabel}</Text>
                </View>
                <BrutalBox style={s.coachBubble} offset={4}>
                  <TypingDots />
                </BrutalBox>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Input bar — compact voice panel (when talking) OR text + mic + send */}
      <View style={[s.inputBar, { paddingBottom: bottomPad + DOCK_SAFE_BOTTOM, borderTopColor: colors.foreground, backgroundColor: colors.background }]}>
        {showTalkMode ? (
          <VoiceBar
            phase={talkMode.phase}
            partialTranscript={talkMode.partialTranscript}
            lastCoachText={talkMode.lastCoachText}
            errorMessage={talkMode.errorMessage}
            onExit={talkMode.exit}
          />
        ) : (
          <View style={s.inputRow}>
            <View style={[s.inputWrap, { borderColor: colors.foreground, backgroundColor: colors.card }]}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="ask coach..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                style={[s.input, { color: colors.foreground }]}
                returnKeyType="send"
                blurOnSubmit
                onSubmitEditing={() => handleSend()}
              />
            </View>

            {/* Mic — start a live voice conversation */}
            <Pressable
              onPress={() => talkMode.enter()}
              disabled={isTyping}
              hitSlop={6}
              style={({ pressed }) => [s.micBtn, {
                backgroundColor: pressed ? colors.violet : colors.card,
                borderColor:     colors.foreground,
                opacity:         isTyping ? 0.5 : 1,
                transform:       pressed ? [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }] : [],
              }]}
              accessibilityRole="button"
              accessibilityLabel="talk to coach"
            >
              <Feather name="mic" size={18} color={colors.foreground} />
            </Pressable>

            <Pressable
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isTyping}
              style={({ pressed }) => [s.sendBtn, {
                backgroundColor: (!inputText.trim() || isTyping) ? colors.muted : colors.primary,
                borderColor:     colors.foreground,
                opacity:         (!inputText.trim() || isTyping) ? 0.5 : 1,
                transform:       pressed ? [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }] : [],
              }]}
            >
              <Feather name="arrow-up" size={18} color={colors.primaryForeground} />
            </Pressable>
          </View>
        )}
      </View>

      <EvidenceModal card={activeEvidence} visible={activeEvidence !== null} onClose={() => setActiveEvidence(null)} />

    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: BRUTAL.border },
  headerTitle: { fontFamily: F.displayBold, fontSize: 28, fontStyle: 'italic', letterSpacing: -0.5 },
  headerSub:   { fontFamily: F.bodyReg, fontSize: 12 },
  headerBtn:   { width: 32, height: 32, borderWidth: 2, borderRadius: BRUTAL.radius, alignItems: 'center', justifyContent: 'center' },

  // Messages
  messageList: { padding: 16, gap: 6, paddingBottom: 20 },

  // User message
  userRow:    { alignItems: 'flex-end', gap: 4, marginBottom: 8 },
  userBubble: { borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, padding: 12, paddingHorizontal: 14, maxWidth: '78%' },
  userText:   { fontFamily: F.bodyMed, fontSize: 14, lineHeight: 21 },

  // Coach message
  coachRow:    { gap: 6, marginBottom: 14 },
  coachMeta:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  coachDot:    { width: 10, height: 10, borderWidth: 2 },
  coachLabel:  { fontFamily: F.monoMed, fontSize: 11 },
  coachBubble: { padding: 14, gap: 10 },
  msgText:     { fontFamily: F.bodyReg, fontSize: 14, lineHeight: 22 },
  bulletDot:   { width: 5, height: 5, borderRadius: 1, flexShrink: 0 },

  // Verdict banner
  verdictBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 2, borderRadius: BRUTAL.radius, paddingHorizontal: 12, paddingVertical: 8, flexWrap: 'wrap' },
  verdictLabel:  { fontFamily: F.monoMed, fontSize: 12, letterSpacing: 0.5 },
  verdictClaim:  { fontFamily: F.bodyReg, fontSize: 12, flex: 1, lineHeight: 17 },

  // Action buttons
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius,
    paddingHorizontal: 12, paddingVertical: 9,
    shadowColor: '#000', shadowOffset: { width: BRUTAL.shadowSm, height: BRUTAL.shadowSm },
    shadowOpacity: 1, shadowRadius: 0, elevation: BRUTAL.shadowSm,
  },
  actionBtnMuted: { opacity: 0.5 },
  actionBtnTxt:   { fontFamily: F.bodyMed, fontSize: 13, flex: 1 },

  // Citations — full reference cards with tappable DOI links
  citList:      { gap: 6 },
  citCard:      { borderWidth: 2, borderRadius: BRUTAL.radius, paddingHorizontal: 12, paddingVertical: 10 },
  citCardInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  citClaim:     { fontFamily: F.bodyMed, fontSize: 12, lineHeight: 17 },
  citMeta:      { fontFamily: F.mono, fontSize: 10, lineHeight: 15 },
  citLinkBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 2, borderRadius: BRUTAL.radiusPill, paddingHorizontal: 7, paddingVertical: 3, marginTop: 2 },
  citLinkText:  { fontFamily: F.monoMed, fontSize: 9, color: '#fff' },

  // Follow-up suggestions
  sugRow:  { gap: 6 },
  sugChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2, borderRadius: BRUTAL.radius, paddingHorizontal: 12, paddingVertical: 9, gap: 8 },
  sugText: { fontFamily: F.bodyReg, fontSize: 13, flex: 1 },

  // Timestamp
  timestamp: { fontFamily: F.mono, fontSize: 10 },

  // Empty state
  empty:        { paddingTop: 40, alignItems: 'center', gap: 12 },
  emptyDot:     { width: 48, height: 48, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius },
  emptyTitle:   { fontFamily: F.displayBold, fontSize: 28, fontStyle: 'italic', letterSpacing: -0.5, textAlign: 'center' },
  emptySub:     { fontFamily: F.bodyReg, fontSize: 14, textAlign: 'center', lineHeight: 21, paddingHorizontal: 20 },
  sugGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10, paddingHorizontal: 4 },
  emptySugCard: { width: '47%', borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, padding: 14, gap: 8 },
  emptySugText: { fontFamily: F.bodyReg, fontSize: 13, lineHeight: 19 },

  // Input
  inputBar:  { paddingHorizontal: 14, paddingTop: 12, borderTopWidth: BRUTAL.border },
  inputRow:  { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  inputWrap: { flex: 1, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, paddingHorizontal: 14, paddingVertical: 10 },
  input:     { fontFamily: F.bodyReg, fontSize: 14, maxHeight: 90 },
  micBtn:    { width: 48, height: 48, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, alignItems: 'center', justifyContent: 'center' },
  sendBtn:   { width: 48, height: 48, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, alignItems: 'center', justifyContent: 'center' },

  // Modal Prompt Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    padding: 20,
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  modalDot: {
    width: 12,
    height: 12,
    borderWidth: 3,
    marginBottom: 4,
  },
  modalTitle: {
    fontFamily: F.displayBold,
    fontSize: 22,
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  modalSub: {
    fontFamily: F.bodyReg,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1.5,
    borderWidth: BRUTAL.borderThin,
    borderRadius: BRUTAL.radius,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSecondary: {
    flex: 1,
    borderWidth: BRUTAL.borderThin,
    borderRadius: BRUTAL.radius,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnTxt: {
    fontFamily: F.bodyBold,
    fontSize: 13,
  },
  modalBtnTxtSecondary: {
    fontFamily: F.bodyMed,
    fontSize: 13,
  },
});
