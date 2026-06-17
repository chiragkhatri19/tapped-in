import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Modal, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { storageAsyncCompat, storage, STORAGE_KEYS, todayDateKey } from '@/lib/storage';
import { updateStreakRiskNudge } from '@/lib/notifications';
import { useProfile, useProfileStore } from '@/stores/profile-store';
import { getTodayKey, useTrackerStore } from '@/stores/tracker-store';
import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { BrutalButton, BrutalBox } from '@/components/brutal';
import { Appear } from '@/components/motion/Appear';
import type { DailyLog, LoggedMeal } from '@/data/tracker-types';
import { WaterCard } from '@/components/hydration/WaterCard';
import { SleepCard } from '@/components/sleep/SleepCard';
import { useUiStore } from '@/stores/ui-store';
import { DOCK_SAFE_BOTTOM } from '@/components/navigation/BrutalDock';
import { DailyProgressCard } from '@/components/home/DailyProgressCard';
import { DayCompleteOverlay } from '@/components/home/DayCompleteOverlay';
import { useCompleteness } from '@/hooks/useCompleteness';
import { SectionHeader } from '@/components/SectionHeader';
import { HeaderMenuButton } from '@/components/navigation/HeaderMenuButton';
import { getDailyInsight } from '@/lib/daily-insight';
import type { MicroMap } from '@/data/micronutrients';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'good morning';
  if (h < 17) return 'good afternoon';
  return 'good evening';
}
function formatDate(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).toLowerCase();
}

const TIMELINE_WEEKS: Record<string, number> = {
  '4_weeks': 4, '8_weeks': 8, '3_months': 13, '6_months': 26, '1_year': 52,
};

function validateDeadline(currentKg: number, targetKg: number, timeline: string): {
  isUnhealthy: boolean;
  weeklyRate: number;
  recommendedTimeline: string;
  recommendedWeeks: number;
} {
  const weeks = TIMELINE_WEEKS[timeline];
  if (!weeks || !targetKg || currentKg === targetKg) {
    return { isUnhealthy: false, weeklyRate: 0, recommendedTimeline: 'no_deadline', recommendedWeeks: 0 };
  }
  const totalDelta = targetKg - currentKg;
  const weeklyRate = totalDelta / weeks;
  const isLoss = totalDelta < 0;
  const threshold = isLoss ? -1 : 0.5;
  const isUnhealthy = isLoss ? weeklyRate < threshold : weeklyRate > threshold;
  if (!isUnhealthy) return { isUnhealthy: false, weeklyRate, recommendedTimeline: timeline, recommendedWeeks: weeks };

  const healthyKgPerWeek = isLoss ? 0.75 : 0.35;
  const recommendedWeeks = Math.ceil(Math.abs(totalDelta) / healthyKgPerWeek);
  const buckets: [string, number][] = [
    ['4_weeks', 4], ['8_weeks', 8], ['3_months', 13], ['6_months', 26], ['1_year', 52]
  ];
  const best = buckets.find(([, w]) => w >= recommendedWeeks) ?? ['1_year', 52];
  return { isUnhealthy: true, weeklyRate, recommendedTimeline: best[0], recommendedWeeks: best[1] };
}

function formatTimeline(t: string): string {
  return t.replace('_', ' ');
}

function DailyInsightCard({ result }: { result: NonNullable<ReturnType<typeof useProfile>['result']> }) {
  const colors = useColors();
  const todayLog = useTrackerStore((s) => s.todayLog());
  // Access dailyLogs map directly so Zustand compares by reference (stable object).
  // Computing recentLogs here via useMemo avoids the infinite-loop caused by
  // s.recentLogs(7) returning a new Array.from result on every selector call.
  const dailyLogs = useTrackerStore((s) => s.dailyLogs);
  const recentLogs = useMemo((): DailyLog[] => {
    const todayKey = getTodayKey();
    const [y, m, d] = todayKey.split('-').map(Number);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(y, m - 1, d + (i - 6));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return dailyLogs[key] ?? null;
    }).filter((log): log is DailyLog => log !== null);
  }, [dailyLogs]);
  const todayMicros: MicroMap = (todayLog?.micros as MicroMap | undefined) ?? {} as MicroMap;
  const insight = getDailyInsight({
    todayMicros,
    todayLog: todayLog ?? null,
    recentLogs,
    targetProteinG: result.macros.proteinG,
    targetCalories: result.macros.calories,
  });
  return (
    <Pressable
      onPress={() => { if (insight.route) { Haptics.selectionAsync(); router.push(insight.route as never); } }}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <BrutalBox style={s.insightCard} offset={4} background={colors.teal + '18'}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[s.insightDot, { backgroundColor: colors.teal, borderColor: colors.foreground }]}>
            <Feather name="zap" size={11} color="#111111" />
          </View>
          <Text style={[s.insightTitle, { color: colors.foreground }]}>{insight.title}</Text>
        </View>
        <Text style={[s.insightBody, { color: colors.mutedForeground }]}>{insight.body}</Text>
        {insight.route && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Text style={[s.insightLink, { color: colors.teal }]}>view details</Text>
            <Feather name="arrow-right" size={11} color={colors.teal} />
          </View>
        )}
      </BrutalBox>
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { result, profile } = useProfile();
  const updateWeight = useProfileStore(s => s.updateWeight);
  const logWeight = useTrackerStore(s => s.logWeight);
  const todayLog = useTrackerStore((store) => store.todayLog());
  const [activePlan, setActivePlan] = useState<{
    weeklySchedule?: Record<string, string>;
    sessions?: Array<{ name: string; muscleGroups?: string[] }>;
  } | null>(null);
  // Inline diet-pref banner — dismissed once per calendar day (not a repeated modal)
  const [dietBannerVisible, setDietBannerVisible] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const topPad = Platform.OS === 'web' ? 67 + 16 : insets.top + 16;

  const { todayCompleteness, recentCompleteness, currentStreak, bestStreak, tappedInScore } = useCompleteness();
  const [celebVisible, setCelebVisible] = useState(false);

  // Haptic + celebration overlay when all 4 rings close for the first time today
  const prevRingsClosed = useRef(todayCompleteness.ringsClosed);
  useEffect(() => {
    if (todayCompleteness.dayComplete && prevRingsClosed.current < 4) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCelebVisible(true);
    }
    prevRingsClosed.current = todayCompleteness.ringsClosed;
    // Keep the 8pm streak-risk nudge accurate to current ring state
    updateStreakRiskNudge(todayCompleteness.ringsClosed, todayCompleteness.dayComplete).catch(() => null);
  }, [todayCompleteness.dayComplete, todayCompleteness.ringsClosed]);

  // ── Daily weight check-in state ─────────────────────────
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInputStr, setWeightInputStr] = useState('');
  const [targetInputStr, setTargetInputStr] = useState('');
  const [weightModalKey, setWeightModalKey] = useState(0);

  const targetCalories = result?.macros?.calories ?? 0;
  const consumedCalories = todayLog?.totalCalories ?? 0;
  const calorieRatio = targetCalories > 0 ? Math.min(consumedCalories / targetCalories, 1) : 0;
  const remaining = Math.max(targetCalories - consumedCalories, 0);
  const isOver = consumedCalories > targetCalories && targetCalories > 0;

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: calorieRatio, duration: 700, useNativeDriver: false }).start();
  }, [calorieRatio, progressAnim]);

  const setDockVisible = useUiStore((s) => s.setDockVisible);
  const lastScrollY = useRef(0);

  useFocusEffect(
    useCallback(() => {
      setDockVisible(true);
      storageAsyncCompat.getItem('tapped_in_workout_plan').then((raw) => setActivePlan(raw ? JSON.parse(raw) : null));

      // Show diet-pref banner once per day (not a repeated full-screen modal)
      if (profile && !profile.dietType) {
        const dismissedDate = storage.getString(STORAGE_KEYS.DIET_PREF_BANNER_DISMISSED_DATE);
        if (dismissedDate !== todayDateKey()) {
          setDietBannerVisible(true);
        }
      } else {
        setDietBannerVisible(false);
      }

      // Weight check-in: once per calendar day after 6pm, never immediately after onboarding
      const justOnboarded = storage.getBoolean(STORAGE_KEYS.ONBOARDING_JUST_DONE);
      if (justOnboarded) {
        storage.remove(STORAGE_KEYS.ONBOARDING_JUST_DONE);
      }
      const weightPromptedDate = storage.getString(STORAGE_KEYS.WEIGHT_PROMPTED_DATE);
      const afterSixPm = new Date().getHours() >= 18;
      if (!justOnboarded && afterSixPm && weightPromptedDate !== todayDateKey() && todayLog?.weightKg === undefined) {
        const t = setTimeout(() => {
          setWeightInputStr(profile?.weightKg ? String(profile.weightKg) : '');
          setTargetInputStr(profile?.targetWeightKg ? String(profile.targetWeightKg) : '');
          setWeightModalKey(k => k + 1);
          setShowWeightModal(true);
          storage.set(STORAGE_KEYS.WEIGHT_PROMPTED_DATE, todayDateKey());
        }, 800);
        return () => { clearTimeout(t); setDockVisible(true); };
      }
      return () => setDockVisible(true);
    }, [setDockVisible, todayLog?.weightKg, profile])
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    if (currentY <= 10) {
      setDockVisible(true);
    } else if (currentY > lastScrollY.current + 15) {
      setDockVisible(false);
    } else if (currentY < lastScrollY.current - 15) {
      setDockVisible(true);
    }
    lastScrollY.current = currentY;
  };

  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const sessionName = activePlan?.weeklySchedule?.[dayName];
  const isRestDay = sessionName === 'Rest' || sessionName === 'rest' || sessionName === undefined;
  const todaySession = activePlan && !isRestDay ? activePlan.sessions?.find((session) => session.name === sessionName) ?? null : null;
  const meals = todayLog?.meals ?? [];
  const barColor = isOver ? colors.persimmon : colors.primary;

  if (!result) {
    return (
      <View style={[s.empty, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <BrutalBox background={colors.pop} style={s.emptyTagBox} offset={4}>
          <Text style={s.emptyTag}>no plan yet</Text>
        </BrutalBox>
        <Text style={[s.emptyTitle, { color: colors.foreground }]}>set up your plan.</Text>
        <Text style={[s.emptyText, { color: colors.mutedForeground }]}>4 quick questions and we build your calorie, macro, and hydration targets. 2 minutes.</Text>
        <BrutalButton label="drop my plan" onPress={() => router.push('/(onboarding)/step1')} style={{ alignSelf: 'stretch', marginTop: 8 }} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[s.content, { paddingTop: topPad, paddingBottom: insets.bottom + DOCK_SAFE_BOTTOM + 12 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <Appear index={0}>
          <View style={s.headerRow}>
            <View>
              <Text style={[s.greeting, { color: colors.mutedForeground }]}>{getGreeting()}</Text>
              <Text style={[s.dateText, { color: colors.foreground }]}>{formatDate()}</Text>
            </View>
            <HeaderMenuButton />
          </View>
        </Appear>

        {/* Diet preference inline banner — at most once per day, not a blocking modal */}
        {dietBannerVisible && (
          <Appear index={0.2}>
            <View style={[s.dietBanner, { backgroundColor: colors.pop, borderColor: colors.foreground }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.dietBannerTitle, { color: '#111111' }]}>set food preferences</Text>
                <Text style={[s.dietBannerSub, { color: '#111111' }]}>better meal recs + recipes. 2 min.</Text>
              </View>
              <View style={s.dietBannerActions}>
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); setDietBannerVisible(false); router.push('/(onboarding)/step6?edit=true&returnTo=results'); }}
                  style={[s.dietBannerBtn, { backgroundColor: '#111111' }]}
                >
                  <Text style={{ fontFamily: F.bodyBold, fontSize: 12, color: '#E8FF00' }}>set up</Text>
                </Pressable>
                <Pressable
                  onPress={() => { storage.set(STORAGE_KEYS.DIET_PREF_BANNER_DISMISSED_DATE, todayDateKey()); setDietBannerVisible(false); }}
                  hitSlop={12}
                >
                  <Feather name="x" size={16} color="#111111" />
                </Pressable>
              </View>
            </View>
          </Appear>
        )}

        {/* Calories hero — first and prominent */}
        <Appear index={0.5}>
          <SectionHeader label="calories" mt={2} />
          <CaloriesCard
            consumedCalories={consumedCalories} targetCalories={targetCalories}
            remaining={remaining} isOver={isOver} barColor={barColor}
            progressAnim={progressAnim} colors={colors}
            consumedProtein={todayLog?.totalProteinG ?? 0} targetProtein={result.macros.proteinG}
            consumedCarbs={todayLog?.totalCarbsG ?? 0} targetCarbs={result.macros.carbG}
            consumedFat={todayLog?.totalFatG ?? 0} targetFat={result.macros.fatG}
          />
        </Appear>

        <Appear index={0.8}>
          <BrutalButton
            label="+ log a meal"
            onPress={() => { Haptics.selectionAsync(); router.push('/log-meal'); }}
            style={{ marginTop: 4 }}
          />
        </Appear>

        {/* Rings + streak combined — close all 4 rings to keep your streak */}
        <Appear index={1}>
          <DailyProgressCard
            rings={todayCompleteness.rings}
            ringsClosed={todayCompleteness.ringsClosed}
            recentDays={recentCompleteness}
            currentStreak={currentStreak}
            bestStreak={bestStreak}
            tappedInScore={tappedInScore}
            onDayPress={key => useTrackerStore.getState().setViewingKey(key)}
          />
        </Appear>

        {/* Daily insight card */}
        <Appear index={1.4}>
          <DailyInsightCard result={result} />
        </Appear>

        {/* Secondary modules — collapsible to keep first viewport clean */}
        <Appear index={1.8}>
          <CollapsibleSection label="hydration" defaultOpen={false} colors={colors}>
            <WaterCard variant="home" isToday />
          </CollapsibleSection>
        </Appear>

        <Appear index={1.9}>
          <CollapsibleSection label="sleep" defaultOpen={false} colors={colors}>
            <SleepCard dateKey={getTodayKey()} isToday />
          </CollapsibleSection>
        </Appear>

        <Appear index={2}>
          <CollapsibleSection label="today's workout" defaultOpen colors={colors}>
            <WorkoutStatusCard activePlan={activePlan} isRestDay={isRestDay} todaySession={todaySession} colors={colors} />
          </CollapsibleSection>
        </Appear>

        <Appear index={3}>
          <CollapsibleSection label="weight" defaultOpen={false} colors={colors}>
            <WeightTargetCard
              profile={profile}
              todayWeight={todayLog?.weightKg}
              colors={colors}
              onAddPress={() => {
                setWeightInputStr(profile?.weightKg ? String(profile.weightKg) : '');
                setTargetInputStr(profile?.targetWeightKg ? String(profile.targetWeightKg) : '');
                setWeightModalKey(k => k + 1);
                setShowWeightModal(true);
              }}
            />
          </CollapsibleSection>
        </Appear>

        <Appear index={4}>
          <CollapsibleSection label="today's meals" defaultOpen colors={colors}>
            <MealsCard meals={meals} colors={colors} />
          </CollapsibleSection>
        </Appear>
      </ScrollView>

      <WeightCheckInModal
        key={weightModalKey}
        visible={showWeightModal}
        colors={colors}
        initialWeight={weightInputStr}
        initialTarget={targetInputStr}
        currentTimeline={profile?.goalTimeline ?? 'no_deadline'}
        goalMode={profile?.goalMode ?? 'fat_loss'}
        onClose={() => setShowWeightModal(false)}
        onSave={(weightKg, targetKg) => {
          logWeight(weightKg);
          updateWeight(weightKg, targetKg);
          setShowWeightModal(false);
        }}
      />

      {/* Day complete celebration — fires once when the 4th ring closes */}
      <DayCompleteOverlay
        visible={celebVisible}
        streak={currentStreak}
        onDismiss={() => setCelebVisible(false)}
      />
    </>
  );
}

type Colors = ReturnType<typeof useColors>;

function CaloriesCard({ consumedCalories, targetCalories, remaining, isOver, barColor, progressAnim, colors, consumedProtein, targetProtein, consumedCarbs, targetCarbs, consumedFat, targetFat }: {
  consumedCalories: number; targetCalories: number; remaining: number; isOver: boolean;
  barColor: string; progressAnim: Animated.Value; colors: Colors;
  consumedProtein: number; targetProtein: number; consumedCarbs: number; targetCarbs: number; consumedFat: number; targetFat: number;
}) {
  return (
    <BrutalBox style={s.heroCard} offset={BRUTAL.shadowLg}>
      <View style={s.calorieTop}>
        <View>
          <Text style={[s.label, { color: colors.mutedForeground }]}>CALORIES TODAY</Text>
          <View style={s.calorieRow}>
            <Text style={[s.calorieConsumed, { color: isOver ? colors.persimmon : colors.foreground }]}>{consumedCalories}</Text>
            <Text style={[s.calorieTarget, { color: colors.mutedForeground }]}> / {targetCalories} kcal</Text>
          </View>
        </View>
        <View style={[s.remainingBadge, { backgroundColor: isOver ? colors.persimmon : colors.pop, borderColor: colors.foreground }]}>
          <Text style={[s.remainingText, { color: isOver ? '#FFFFFF' : '#111111' }]}>{isOver ? `${consumedCalories - targetCalories} over` : `${remaining} left`}</Text>
        </View>
      </View>
      <View style={[s.barTrack, { backgroundColor: colors.background, borderColor: colors.foreground }]}>
        <Animated.View style={[s.barFill, { backgroundColor: barColor, width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
      <View style={s.macroRow}>
        <MacroPill label="P" consumed={consumedProtein} target={targetProtein} accent={colors.blue} colors={colors} />
        <MacroPill label="C" consumed={consumedCarbs} target={targetCarbs} accent={colors.orange} colors={colors} />
        <MacroPill label="F" consumed={consumedFat} target={targetFat} accent={colors.pink} colors={colors} />
      </View>
    </BrutalBox>
  );
}

function MealsCard({ meals, colors }: { meals: LoggedMeal[]; colors: Colors }) {
  if (meals.length === 0) {
    return (
      <Pressable onPress={() => { Haptics.selectionAsync(); router.push('/log-meal'); }}>
        <BrutalBox style={s.emptyMeal} offset={4}>
          <View style={[s.iconSquare, { backgroundColor: colors.pop, borderColor: colors.foreground }]}>
            <Feather name="plus" size={18} color="#111111" />
          </View>
          <Text style={[s.emptyMealText, { color: colors.mutedForeground }]}>nothing logged yet. be honest with yourself. log it all.</Text>
        </BrutalBox>
      </Pressable>
    );
  }
  return (
    <BrutalBox style={s.card} offset={4}>
      <View style={s.rowBetween}>
        <Text style={[s.mealCountNum, { color: colors.foreground }]}>{meals.length} <Text style={[s.mealCountLabel, { color: colors.mutedForeground }]}>{meals.length === 1 ? 'meal' : 'meals'}</Text></Text>
        <Pressable style={[s.smallBtn, { backgroundColor: colors.primary, borderColor: colors.foreground }]} onPress={() => { Haptics.selectionAsync(); router.push('/log-meal'); }}>
          <Text style={[s.smallBtnText, { color: colors.primaryForeground }]}>log more</Text>
        </Pressable>
      </View>
      {meals.slice(-2).map((meal) => (
        <View key={meal.id} style={[s.mealRow, { borderTopColor: colors.foreground }]}>
          <Text style={[s.mealName, { color: colors.foreground }]} numberOfLines={1}>{meal.name}</Text>
          <Text style={[s.mealCal, { color: colors.mutedForeground }]}>{meal.totalCalories} kcal</Text>
        </View>
      ))}
    </BrutalBox>
  );
}

function WorkoutStatusCard({ activePlan, isRestDay, todaySession, colors }: {
  activePlan: { weeklySchedule?: Record<string, string>; sessions?: Array<{ name: string; muscleGroups?: string[] }> } | null;
  isRestDay: boolean;
  todaySession: { name: string; muscleGroups?: string[] } | null;
  colors: Colors;
}) {
  if (!activePlan) return (
    <Pressable onPress={() => router.push('/(tabs)/workout')}>
      <BrutalBox style={s.rowCard} offset={4}>
        <View style={[s.iconSquare, { backgroundColor: colors.orange, borderColor: colors.foreground }]}><Feather name="activity" size={20} color="#111111" /></View>
        <View style={{ flex: 1 }}>
          <Text style={[s.rowTitle, { color: colors.foreground }]}>no workout plan yet</Text>
          <Text style={[s.rowSub, { color: colors.mutedForeground }]}>generate a plan built around your goal</Text>
        </View>
        <Feather name="chevron-right" size={16} color={colors.foreground} />
      </BrutalBox>
    </Pressable>
  );
  if (isRestDay) return (
    <BrutalBox style={s.rowCard} offset={4}>
      <View style={[s.iconSquare, { backgroundColor: colors.violet, borderColor: colors.foreground }]}><Feather name="moon" size={18} color="#111111" /></View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowTitle, { color: colors.foreground }]}>rest day</Text>
        <Text style={[s.rowSub, { color: colors.mutedForeground }]}>recovery is part of the program. stay hydrated.</Text>
      </View>
    </BrutalBox>
  );
  if (!todaySession) return null;
  return (
    <Pressable onPress={() => router.push('/(tabs)/workout')}>
      <BrutalBox style={s.rowCard} offset={4}>
        <View style={[s.iconSquare, { backgroundColor: colors.orange, borderColor: colors.foreground }]}><Feather name="zap" size={20} color="#111111" /></View>
        <View style={{ flex: 1 }}>
          <Text style={[s.rowTitle, { color: colors.foreground }]}>{todaySession.name}</Text>
          {(todaySession.muscleGroups?.length ?? 0) > 0 && (
            <Text style={[s.rowSub, { color: colors.mutedForeground }]} numberOfLines={1}>{todaySession.muscleGroups?.join(' · ')}</Text>
          )}
        </View>
        <View style={[s.smallBtn, { backgroundColor: colors.primary, borderColor: colors.foreground }]}>
          <Text style={[s.smallBtnText, { color: colors.primaryForeground }]}>start</Text>
        </View>
      </BrutalBox>
    </Pressable>
  );
}

function WeightTargetCard({ profile, todayWeight, colors, onAddPress }: { profile: any; todayWeight?: number; colors: Colors; onAddPress?: () => void }) {
  if (!profile) return null;
  const current = todayWeight ?? profile.weightKg ?? 0;
  const target = profile.targetWeightKg || current;
  const delta = target - current;
  const timeline = profile.goalTimeline ? formatTimeline(profile.goalTimeline) : 'no deadline';
  const displayDelta = delta > 0 ? `+${delta.toFixed(1)} kg` : delta < 0 ? `${delta.toFixed(1)} kg` : '—';
  const deltaColor = delta < 0 ? colors.teal : delta > 0 ? colors.orange : colors.mutedForeground;

  return (
    <BrutalBox style={s.card} offset={4}>
      <View style={s.rowBetween}>
        <Text style={[s.sectionMiniTitle, { color: colors.foreground }]}>weight target</Text>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); onAddPress?.(); }}
          style={[wm.addBtn, { backgroundColor: colors.primary, borderColor: colors.foreground }]}
        >
          <Feather name="plus" size={14} color={colors.primaryForeground} />
          <Text style={[wm.addBtnText, { color: colors.primaryForeground }]}>log weight</Text>
        </Pressable>
      </View>
      <View style={s.rowBetween}>
        <View>
          <Text style={[s.label, { color: colors.mutedForeground }]}>CURRENT VS TARGET</Text>
          <Text style={[s.bigLine, { color: colors.foreground }]}>
            {current} kg <Text style={{ fontFamily: F.mono, fontSize: 14, color: colors.mutedForeground }}>/ {target} kg</Text>
          </Text>
        </View>
        <View style={[s.dailyBadge, { backgroundColor: deltaColor + '33', borderColor: deltaColor }]}>
          <Text style={[s.dailyBadgeText, { color: deltaColor }]}>{displayDelta}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <Text style={[{ fontFamily: F.bodyReg, fontSize: 12 }, { color: colors.mutedForeground }]}>
          timeline: <Text style={{ fontFamily: F.bodyBold, color: colors.foreground }}>{timeline}</Text>
        </Text>
        <Text style={[{ fontFamily: F.bodyReg, fontSize: 12 }, { color: colors.mutedForeground }]}>
          goal: <Text style={{ fontFamily: F.bodyBold, color: colors.foreground }}>{profile.goalMode?.replace('_', ' ') || 'maintain'}</Text>
        </Text>
      </View>
      {todayWeight !== undefined && (
        <View style={[wm.loggedChip, { backgroundColor: colors.teal + '22', borderColor: colors.teal }]}>
          <Feather name="check" size={11} color={colors.teal} />
          <Text style={[wm.loggedChipText, { color: colors.teal }]}>logged today: {todayWeight} kg</Text>
        </View>
      )}
    </BrutalBox>
  );
}

function CollapsibleSection({ label, defaultOpen = true, colors, children }: {
  label: string; defaultOpen?: boolean; colors: Colors; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View>
      <Pressable
        onPress={() => { Haptics.selectionAsync(); setOpen(o => !o); }}
        style={s.sectionHeader}
      >
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>{label}</Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} />
      </Pressable>
      {open && children}
    </View>
  );
}

// ── Weight modal styles ──────────────────────────────────────────────────
const wm = StyleSheet.create({
  sheet: {
    borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 2,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40, gap: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: F.displayBold, fontSize: 22, fontStyle: 'italic', letterSpacing: -0.5 },
  sub: { fontFamily: F.bodyReg, fontSize: 13, lineHeight: 19, marginTop: -4 },
  row: { flexDirection: 'row', gap: 12 },
  inputGroup: { flex: 1, gap: 6 },
  label: { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 1 },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: BRUTAL.radius, paddingHorizontal: 12, paddingVertical: 10 },
  input: { flex: 1, fontSize: 20, padding: 0 },
  unit: { fontFamily: F.bodyReg, fontSize: 13, marginLeft: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1.5, borderRadius: BRUTAL.radius, alignSelf: 'flex-start' },
  chipText: { fontFamily: F.bodyReg, fontSize: 12 },
  warning: { flexDirection: 'row', gap: 10, padding: 12, borderWidth: 1.5, borderRadius: BRUTAL.radius, alignItems: 'flex-start' },
  warnTitle: { fontFamily: F.bodyBold, fontSize: 13 },
  warnBody: { fontFamily: F.bodyReg, fontSize: 12, lineHeight: 17 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 2, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BRUTAL.radiusPill },
  addBtnText: { fontFamily: F.bodyBold, fontSize: 12 },
  loggedChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1.5, borderRadius: BRUTAL.radius, marginTop: 2 },
  loggedChipText: { fontFamily: F.bodySemi, fontSize: 11 },
});

function MacroPill({ label, consumed, target, accent, colors }: { label: string; consumed: number; target: number; accent: string; colors: Colors }) {
  return (
    <View style={[s.macroPill, { backgroundColor: colors.card, borderColor: colors.foreground }]}>
      <View style={[s.macroDot, { backgroundColor: accent, borderColor: colors.foreground }]}><Text style={s.macroDotText}>{label}</Text></View>
      <Text style={[s.macroVal, { color: colors.foreground }]}>{Math.round(consumed)}<Text style={[s.macroTarget, { color: colors.mutedForeground }]}>/{Math.round(target)}g</Text></Text>
    </View>
  );
}

function WeightCheckInModal({
  visible, colors, initialWeight, initialTarget, currentTimeline, goalMode, onClose, onSave,
}: {
  visible: boolean; colors: Colors; initialWeight: string; initialTarget: string;
  currentTimeline: string; goalMode: string; onClose: () => void;
  onSave: (weightKg: number, targetKg?: number) => void;
}) {
  const [wStr, setWStr] = useState(initialWeight);
  const [tStr, setTStr] = useState(initialTarget);

  const wNum = parseFloat(wStr);
  const tNum = parseFloat(tStr);
  const isValidWeight = !isNaN(wNum) && wNum > 20 && wNum < 300;
  const isValidTarget = !isNaN(tNum) && tNum > 20 && tNum < 300;

  const validation = (isValidWeight && isValidTarget && currentTimeline !== 'no_deadline')
    ? validateDeadline(wNum, tNum, currentTimeline)
    : null;

  const timelineLabel = formatTimeline(currentTimeline);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} />
        <View style={[wm.sheet, { backgroundColor: colors.card, borderColor: colors.foreground }]}>
          <View style={wm.header}>
            <Text style={[wm.title, { color: colors.foreground }]}>daily weight check-in</Text>
            <Pressable onPress={onClose} hitSlop={12}><Feather name="x" size={20} color={colors.mutedForeground} /></Pressable>
          </View>
          <Text style={[wm.sub, { color: colors.mutedForeground }]}>tracking your weight helps keep your calorie targets accurate.</Text>
          <View style={wm.row}>
            <View style={wm.inputGroup}>
              <Text style={[wm.label, { color: colors.mutedForeground }]}>TODAY'S WEIGHT</Text>
              <View style={[wm.inputBox, { borderColor: colors.foreground, backgroundColor: colors.background }]}>
                <TextInput value={wStr} onChangeText={setWStr} keyboardType="decimal-pad" placeholder="75.0" placeholderTextColor={colors.mutedForeground} style={[wm.input, { color: colors.foreground, fontFamily: F.monoSemi }]} selectTextOnFocus />
                <Text style={[wm.unit, { color: colors.mutedForeground }]}>kg</Text>
              </View>
            </View>
            <View style={wm.inputGroup}>
              <Text style={[wm.label, { color: colors.mutedForeground }]}>TARGET WEIGHT</Text>
              <View style={[wm.inputBox, { borderColor: colors.foreground, backgroundColor: colors.background }]}>
                <TextInput value={tStr} onChangeText={setTStr} keyboardType="decimal-pad" placeholder="70.0" placeholderTextColor={colors.mutedForeground} style={[wm.input, { color: colors.foreground, fontFamily: F.monoSemi }]} selectTextOnFocus />
                <Text style={[wm.unit, { color: colors.mutedForeground }]}>kg</Text>
              </View>
            </View>
          </View>
          {currentTimeline !== 'no_deadline' && (
            <View style={[wm.chip, { backgroundColor: colors.muted, borderColor: colors.foreground }]}>
              <Feather name="calendar" size={12} color={colors.mutedForeground} />
              <Text style={[wm.chipText, { color: colors.mutedForeground }]}>
                timeline: <Text style={{ fontFamily: F.bodyBold, color: colors.foreground }}>{timelineLabel}</Text>
              </Text>
            </View>
          )}
          {validation?.isUnhealthy && (
            <View style={[wm.warning, { backgroundColor: colors.orange + '22', borderColor: colors.orange }]}>
              <Feather name="alert-triangle" size={14} color={colors.orange} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[wm.warnTitle, { color: colors.orange }]}>that rate might be too {(tNum - wNum) < 0 ? 'aggressive' : 'fast'}</Text>
                <Text style={[wm.warnBody, { color: colors.mutedForeground }]}>
                  {Math.abs(validation.weeklyRate).toFixed(2)} kg/wk is{' '}
                  {(tNum - wNum) < 0 ? 'above the healthy ~0.75 kg/wk max for fat loss' : 'above the healthy ~0.35 kg/wk max for muscle gain'}.
                  {' '}A {formatTimeline(validation.recommendedTimeline)} timeline would be healthier and more sustainable.
                </Text>
              </View>
            </View>
          )}
          <BrutalButton label="save weight" onPress={() => { if (!isValidWeight) return; Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onSave(wNum, isValidTarget ? tNum : undefined); }} style={{ marginTop: 4 }} />
          <Pressable onPress={onClose} style={{ alignItems: 'center', paddingVertical: 10 }}>
            <Text style={{ fontFamily: F.bodyBold, fontSize: 13, color: colors.mutedForeground }}>skip for now</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  emptyTagBox: { paddingHorizontal: 12, paddingVertical: 5 },
  emptyTag: { fontFamily: F.monoSemi, fontSize: 12, letterSpacing: 1, color: '#111111' },
  emptyTitle: { fontFamily: F.displayBold, fontSize: 32, fontStyle: 'italic', letterSpacing: -1, textAlign: 'center' },
  emptyText: { fontFamily: F.bodyReg, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  content: { paddingHorizontal: 20, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontFamily: F.bodyMed, fontSize: 12 },
  dateText: { fontFamily: F.displayBold, fontSize: 28, fontStyle: 'italic', letterSpacing: -0.8, marginTop: 2 },
  profileBtn: { width: 40, height: 40, borderRadius: BRUTAL.radius, borderWidth: BRUTAL.border, alignItems: 'center', justifyContent: 'center' },
  card: { padding: 16, gap: 14 },
  heroCard: { padding: 18, gap: 16 },
  label: { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 1 },
  calorieTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  calorieRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  calorieConsumed: { fontFamily: F.monoSemi, fontSize: 48, letterSpacing: -1.5 },
  calorieTarget: { fontFamily: F.mono, fontSize: 14 },
  remainingBadge: { borderWidth: 2, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BRUTAL.radius, marginTop: 4 },
  remainingText: { fontFamily: F.bodyBold, fontSize: 12 },
  barTrack: { height: 16, borderRadius: 2, borderWidth: 2, overflow: 'hidden' },
  barFill: { height: '100%' },
  macroRow: { flexDirection: 'row', gap: 10 },
  macroPill: { flex: 1, borderWidth: 2, borderRadius: BRUTAL.radius, padding: 10, gap: 6, flexDirection: 'row', alignItems: 'center' },
  macroDot: { width: 22, height: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  macroDotText: { fontFamily: F.bodyBold, fontSize: 11, color: '#111111' },
  macroVal: { fontFamily: F.monoSemi, fontSize: 14 },
  macroTarget: { fontFamily: F.mono, fontSize: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, marginBottom: 8 },
  sectionTitle: { fontFamily: F.displayBold, fontSize: 20, fontStyle: 'italic', letterSpacing: -0.5 },
  sectionMiniTitle: { fontFamily: F.displayBold, fontSize: 17, fontStyle: 'italic' },
  dietBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius },
  dietBannerTitle: { fontFamily: F.bodyBold, fontSize: 14 },
  dietBannerSub: { fontFamily: F.bodyReg, fontSize: 12, marginTop: 2 },
  dietBannerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dietBannerBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: BRUTAL.radius },
  rowCard: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconSquare: { width: 38, height: 38, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowTitle: { fontFamily: F.bodyBold, fontSize: 15 },
  rowSub: { fontFamily: F.bodyReg, fontSize: 12, lineHeight: 17, marginTop: 2 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  bigLine: { fontFamily: F.monoSemi, fontSize: 24, marginTop: 2 },
  emptyMeal: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  emptyMealText: { fontFamily: F.bodyReg, fontSize: 13, lineHeight: 19, flex: 1 },
  mealCountNum: { fontFamily: F.monoSemi, fontSize: 24 },
  mealCountLabel: { fontFamily: F.bodyReg, fontSize: 14 },
  smallBtn: { borderWidth: 2, paddingHorizontal: 12, paddingVertical: 7, borderRadius: BRUTAL.radius },
  smallBtnText: { fontFamily: F.bodyBold, fontSize: 13 },
  mealRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 2 },
  mealName: { fontFamily: F.bodyMed, fontSize: 13, flex: 1, marginRight: 8 },
  mealCal: { fontFamily: F.monoMed, fontSize: 13 },
  dailyBadge: { borderWidth: 2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BRUTAL.radius },
  dailyBadgeText: { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 0.5, color: '#111111' },
  redo: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: BRUTAL.radius, borderWidth: BRUTAL.border, marginTop: 4 },
  redoText: { fontFamily: F.bodyBold, fontSize: 14 },
  insightCard: { padding: 14, gap: 6 },
  insightDot: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  insightTitle: { fontFamily: F.bodyBold, fontSize: 14, flex: 1 },
  insightBody: { fontFamily: F.bodyReg, fontSize: 13, lineHeight: 19 },
  insightLink: { fontFamily: F.bodySemi, fontSize: 12 },
});
