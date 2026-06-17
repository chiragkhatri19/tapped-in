import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import ReAnimated from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { BrutalBox } from '@/components/brutal';
import { Appear } from '@/components/motion/Appear';
import { getTodayKey, useTrackerStore, useViewingDailyLog } from '@/stores/tracker-store';
import { useProfile } from '@/stores/profile-store';
import { useUiStore } from '@/stores/ui-store';
import { DOCK_SAFE_BOTTOM } from '@/components/navigation/BrutalDock';
import DailyMacroSummary from '@/components/DailyMacroSummary';
import MealCard from '@/components/MealCard';
import MicroPanel from '@/components/MicroPanel';
import { WaterCard } from '@/components/hydration/WaterCard';
import { HydrationPanel } from '@/components/hydration/HydrationPanel';
import { SleepCard } from '@/components/sleep/SleepCard';
import { usePressScale } from '@/components/motion/usePressScale';
import { LoggedMeal, MealType, MEAL_TYPE_LABELS, DailyLog } from '@/data/tracker-types';
import { createZeroMicros, sumMicros, type MicroMap } from '@/data/micronutrients';
import { sumSupplementMicros } from '@/data/supplements';
import { EVIDENCE_CARDS } from '@/data/evidence';
import { EvidenceModal } from '@/components/EvidenceModal';
import { getDailyInsight } from '@/lib/daily-insight';
import { HeaderMenuButton } from '@/components/navigation/HeaderMenuButton';
import { SUPPLEMENTS, suggestSupplementsForGaps, type SupplementDef } from '@/data/supplements';
import type { EvidenceCard } from '@/types';
import { router } from 'expo-router';

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];

const MEAL_COLORS: Record<MealType, string> = {
  breakfast: '#E8FF00',
  lunch: '#FF7A1A',
  dinner: '#7C5CFF',
  snack: '#00C2A8',
  pre_workout: '#2B3AFF',
  post_workout: '#FF3DA5',
};

const EMPTY_SUPPLEMENT_IDS: string[] = [];
const MIN_SUPPLEMENTS = 3;
const MAX_SUPPLEMENTS = 5;

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

function groupMeals(meals: LoggedMeal[]): Array<{ type: MealType; meals: LoggedMeal[] }> {
  const map: Partial<Record<MealType, LoggedMeal[]>> = {};
  for (let i = 0; i < meals.length; i++) {
    const m = meals[i];
    if (!map[m.mealType]) map[m.mealType] = [];
    map[m.mealType]!.push(m);
  }
  return MEAL_ORDER.filter(t => map[t]?.length).map(t => ({ type: t, meals: map[t]! }));
}

// -- Date navigation header ----------------------------------------------------

function DateNav({ topPad }: { topPad: number }) {
  const colors = useColors();
  const viewingKey  = useTrackerStore(s => s.viewingKey);
  const setViewing  = useTrackerStore(s => s.setViewingKey);
  const viewingLog  = useViewingDailyLog();
  const todayKey    = getTodayKey();
  const isToday     = viewingKey === todayKey;

  function go(dir: 1 | -1) {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const [y, m, d] = viewingKey.split('-').map(Number);
    const next = new Date(y, m - 1, d + dir);
    setViewing(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`);
  }

  const [y, m, d] = viewingKey.split('-').map(Number);
  const dateLabel = isToday
    ? 'today'
    : new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).toLowerCase();

  const canGoForward = viewingKey < todayKey;

  return (
    <View style={[s.header, { paddingTop: topPad + 10, borderBottomColor: colors.foreground, backgroundColor: colors.background }]}>
      <Pressable
        onPress={() => go(-1)}
        hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
        style={({ pressed }) => [s.navBtn, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="chevron-back" size={24} color={colors.foreground} />
      </Pressable>

      <View style={s.headerCenter}>
        <Text style={[s.headerDate, { color: colors.foreground }]}>{dateLabel}</Text>
        {viewingLog && viewingLog.totalCalories > 0 ? (
          <Text style={[s.headerSub, { color: colors.mutedForeground }]}>
            {Math.round(viewingLog.totalCalories)} kcal logged
          </Text>
        ) : (
          <Text style={[s.headerSub, { color: colors.mutedForeground }]}>nothing logged</Text>
        )}
      </View>

      <View style={s.navRight}>
        <Pressable
          onPress={() => canGoForward && go(1)}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          style={({ pressed }) => [s.navBtn, (!canGoForward || pressed) && { opacity: 0.3 }]}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.foreground} />
        </Pressable>
        <HeaderMenuButton />
      </View>
    </View>
  );
}

// -- Main screen ---------------------------------------------------------------

export default function TrackerHome() {
  const colors     = useColors();
  const insets     = useSafeAreaInsets();
  const routerHook = useRouter();
  const viewingKey = useTrackerStore(s => s.viewingKey);
  const viewingLog = useViewingDailyLog();
  const deleteMeal = useTrackerStore(s => s.deleteMeal);
  const todayKey   = getTodayKey();
  const { result, profile } = useProfile();

  // ── Supplement + insight data ──────────────────────────────────────────
  const recentLogsFn       = useTrackerStore(s => s.recentLogs);
  const checkedSupplements = useTrackerStore(s => s.supplementLog[viewingKey] ?? EMPTY_SUPPLEMENT_IDS);
  const toggleSupplement   = useTrackerStore(s => s.toggleSupplement);
  const [activeEvidence, setActiveEvidence] = useState<EvidenceCard | null>(null);
  const scienceCard        = EVIDENCE_CARDS[getDayOfYear() % EVIDENCE_CARDS.length];
  const scienceCardPress   = usePressScale();

  const isToday       = viewingKey === todayKey;
  const meals: LoggedMeal[] = viewingLog?.meals ?? [];
  const groups        = groupMeals(meals);

  const totalCalories   = viewingLog?.totalCalories   ?? 0;
  const totalProteinG   = viewingLog?.totalProteinG   ?? 0;
  const totalCarbsG     = viewingLog?.totalCarbsG     ?? 0;
  const totalFatG       = viewingLog?.totalFatG       ?? 0;
  const supplementIds   = useTrackerStore(s => s.supplementLog[viewingKey]);
  const micros          = React.useMemo(
    () => sumMicros([viewingLog?.micros ?? createZeroMicros(), sumSupplementMicros(supplementIds ?? [])]),
    [viewingLog?.micros, supplementIds],
  );
  const foodMicros = viewingLog?.micros ?? createZeroMicros();

  const targetCalories = result?.calories?.targetCalories ?? 2200;
  const targetProteinG = result?.macros?.proteinG ?? 150;
  const targetCarbsG   = result?.macros?.carbG ?? 250;
  const targetFatG     = result?.macros?.fatG ?? 70;

  const recentLogs = recentLogsFn(7);

  const insight = getDailyInsight({
    todayMicros: micros,
    todayLog: viewingLog ?? undefined,
    recentLogs,
    targetProteinG,
    targetCalories,
  });

  const topPad    = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 + 84 : insets.bottom + DOCK_SAFE_BOTTOM + 12;

  const setDockVisible = useUiStore((s) => s.setDockVisible);
  const lastScrollY = useRef(0);

  useFocusEffect(
    useCallback(() => {
      setDockVisible(true);
      return () => setDockVisible(true);
    }, [setDockVisible])
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

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <DateNav topPad={topPad} />

        {/* Daily macro summary */}
        <View style={{ height: 20 }} />
        <Appear index={0}>
          <DailyMacroSummary
            totalCalories={totalCalories}
            totalProteinG={totalProteinG}
            totalCarbsG={totalCarbsG}
            totalFatG={totalFatG}
            targetCalories={targetCalories}
            targetProteinG={targetProteinG}
            targetCarbsG={targetCarbsG}
            targetFatG={targetFatG}
          />
        </Appear>

        {/* Water tracker */}
        <View style={{ height: 16 }} />
        <Appear index={1}>
          <WaterCard variant="tracker" isToday={isToday} />
        </Appear>

        {/* Hydration panel - electrolytes + science + reminders */}
        <View style={{ height: 8 }} />
        <Appear index={1.5}>
          <HydrationPanel />
        </Appear>

        {/* Sleep */}
        <View style={{ height: 8 }} />
        <Appear index={2}>
          <SleepCard dateKey={viewingKey} isToday={isToday} />
        </Appear>

        {/* Micros */}
        <View style={{ height: 16 }} />
        <Appear index={3}>
          <MicroPanel values={micros} />
        </Appear>

        {/* Meals section */}
        <View style={{ height: 24 }} />
        <View style={s.mealsHeader}>
          <View style={s.headingBlock}>
            <Text style={[s.mealsSectionTitle, { color: colors.foreground }]}>meals</Text>
            <View style={[s.headingStroke, { backgroundColor: colors.highlight }]} />
          </View>
          {isToday && (
            <Pressable
              onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); routerHook.push('/log-meal'); }}
              style={[s.logBtn, { backgroundColor: colors.primary, borderColor: colors.foreground }]}
            >
              <Ionicons name="add" size={17} color={colors.primaryForeground} />
              <Text style={[s.logBtnTxt, { color: colors.primaryForeground }]}>log meal</Text>
            </Pressable>
          )}
        </View>

        {groups.length > 0 ? (
          <View style={{ marginTop: 12 }}>
            {groups.map(group => {
              const groupCals = Math.round(group.meals.reduce((acc, m) => acc + m.totalCalories, 0));
              const accent = MEAL_COLORS[group.type] ?? colors.primary;
              return (
                <View key={group.type} style={{ marginBottom: 16 }}>
                  <View style={[s.groupHeader, { borderBottomColor: colors.foreground }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={[s.groupDot, { backgroundColor: accent, borderColor: colors.foreground }]} />
                      <Text style={[s.groupTitle, { color: colors.foreground }]}>
                        {MEAL_TYPE_LABELS[group.type].toLowerCase()}
                      </Text>
                    </View>
                    <Text style={[s.groupCals, { color: colors.mutedForeground }]}>{groupCals} kcal</Text>
                  </View>
                  {group.meals.map(meal => (
                    <MealCard key={meal.id} meal={meal} onDelete={deleteMeal} />
                  ))}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={s.empty}>
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>
              {isToday ? 'nothing logged yet.' : 'no meals this day.'}
            </Text>
            <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
              {isToday ? 'be honest with yourself. log it all.' : 'navigate back to today to add meals.'}
            </Text>
            {isToday && (
              <Pressable
                onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); routerHook.push('/log-meal'); }}
                style={[s.emptyBtn, { borderColor: colors.foreground, backgroundColor: colors.card }]}
              >
                <Ionicons name="add" size={18} color={colors.foreground} />
                <Text style={[s.emptyBtnTxt, { color: colors.foreground }]}>log your first meal</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ── Analysis widgets (relocated from Home) ── */}
        <View style={{ height: 24 }} />

        <Appear index={8}>
          <DailyInsightCard insight={insight} colors={colors} />
        </Appear>

        <View style={{ height: 12 }} />
        <Appear index={10}>
          <TrendCard recentLogs={recentLogs} targetCalories={targetCalories} targetProtein={targetProteinG} colors={colors} />
        </Appear>

        <View style={{ height: 12 }} />
        <Appear index={11}>
          <SupplementCard
            takesSupplements={profile?.takesSupplements}
            selectedIds={profile?.supplements ?? []}
            checkedIds={checkedSupplements}
            foodMicros={foodMicros}
            onToggle={(id) => toggleSupplement(viewingKey, id)}
            colors={colors}
          />
        </Appear>

        <View style={{ height: 12 }} />
        <Appear index={12}>
          <View style={s.sectionHeaderRow}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>science pick</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[s.dailyBadge, { backgroundColor: colors.teal, borderColor: colors.foreground }]}>
                <Text style={s.dailyBadgeText}>daily</Text>
              </View>
              <Pressable onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/evidence' as never); }} hitSlop={8}>
                <Text style={[s.seeAllLink, { color: colors.teal }]}>see all →</Text>
              </Pressable>
            </View>
          </View>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setActiveEvidence(scienceCard); }}
            onPressIn={scienceCardPress.onPressIn}
            onPressOut={scienceCardPress.onPressOut}
            style={{ marginHorizontal: 20 }}
          >
            <ReAnimated.View style={scienceCardPress.animatedStyle}>
              <BrutalBox style={s.scienceCard} offset={4}>
                <View style={s.scienceTop}>
                  <View style={[s.confBadge, { backgroundColor: colors.teal, borderColor: colors.foreground }]}>
                    <Text style={s.confText}>{scienceCard.confidence.toUpperCase()}</Text>
                  </View>
                  <Text style={[s.scienceCat, { color: colors.mutedForeground }]}>{scienceCard.category}</Text>
                </View>
                <Text style={[s.scienceClaim, { color: colors.foreground }]}>{scienceCard.claim}</Text>
                <Text style={[s.scienceExp, { color: colors.mutedForeground }]} numberOfLines={3}>{scienceCard.shortExplanation}</Text>
                <View style={s.scienceLink}>
                  <Text style={[s.scienceLinkText, { color: colors.teal }]}>tap to read</Text>
                  <Feather name="arrow-right" size={12} color={colors.teal} />
                </View>
              </BrutalBox>
            </ReAnimated.View>
          </Pressable>
        </Appear>

        <View style={{ height: 16 }} />
      </ScrollView>

      {isToday && (
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            routerHook.push('/log-meal');
          }}
          hitSlop={8}
          style={[s.fab, { bottom: Platform.OS === 'web' ? 96 : insets.bottom + DOCK_SAFE_BOTTOM + 8 }]}
        >
          {({ pressed }) => (
            <>
              <View style={[s.fabShadow, { backgroundColor: colors.foreground, opacity: pressed ? 0 : 1 }]} />
              <View style={[s.fabBtn, {
                backgroundColor: colors.primary, borderColor: colors.foreground,
                transform: pressed ? [{ translateX: BRUTAL.shadowSm }, { translateY: BRUTAL.shadowSm }] : [],
              }]}>
                <Ionicons name="add" size={30} color={colors.primaryForeground} />
              </View>
            </>
          )}
        </Pressable>
      )}

      <EvidenceModal card={activeEvidence} visible={activeEvidence !== null} onClose={() => setActiveEvidence(null)} />

    </View>
  );
}

// ── Analysis widgets (relocated from Home) ────────────────────────────────────

type Colors = ReturnType<typeof useColors>;

function DailyInsightCard({ insight, colors }: { insight: { title: string; body: string; route?: string }; colors: Colors }) {
  const press = usePressScale();
  return (
    <Pressable
      onPress={() => { if (insight.route) router.push(insight.route as never); }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={{ marginHorizontal: 20 }}
    >
      <ReAnimated.View style={press.animatedStyle}>
        <BrutalBox style={s.rowCard} offset={4}>
          <View style={[s.iconSquare, { backgroundColor: colors.pop, borderColor: colors.foreground }]}>
            <Feather name="zap" size={18} color="#111111" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.rowTitle, { color: colors.foreground }]}>{insight.title}</Text>
            <Text style={[s.rowSub, { color: colors.mutedForeground }]}>{insight.body}</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.foreground} />
        </BrutalBox>
      </ReAnimated.View>
    </Pressable>
  );
}

function TrendCard({ recentLogs, targetCalories, targetProtein, colors }: { recentLogs: DailyLog[]; targetCalories: number; targetProtein: number; colors: Colors }) {
  const maxCalories = Math.max(targetCalories, ...recentLogs.map((log) => log.totalCalories), 1);
  const maxProtein  = Math.max(targetProtein,  ...recentLogs.map((log) => log.totalProteinG),  1);
  return (
    <BrutalBox style={[s.analysisCard, { marginHorizontal: 20 }]} offset={4}>
      <Text style={[s.analysisSectionTitle, { color: colors.foreground }]}>7-day trends</Text>
      <View style={s.trendRows}>
        <MiniBars label="kcal"    values={recentLogs.map((log) => log.totalCalories)} max={maxCalories} color={colors.primary} colors={colors} />
        <MiniBars label="protein" values={recentLogs.map((log) => log.totalProteinG)} max={maxProtein}  color={colors.teal}    colors={colors} />
      </View>
    </BrutalBox>
  );
}

function MiniBars({ label, values, max, color, colors }: { label: string; values: number[]; max: number; color: string; colors: Colors }) {
  return (
    <View style={s.miniBarRow}>
      <Text style={[s.miniLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={s.miniBars}>
        {values.map((value, idx) => (
          <View
            key={`${label}-${idx}`}
            style={[s.miniBar, { height: Math.max(4, (value / max) * 38), backgroundColor: value > 0 ? color : colors.muted, borderColor: colors.foreground }]}
          />
        ))}
      </View>
    </View>
  );
}

function SupplementCard({ takesSupplements, selectedIds, checkedIds, foodMicros, onToggle, colors }: {
  takesSupplements?: boolean;
  selectedIds: string[];
  checkedIds: string[];
  foodMicros: MicroMap;
  onToggle: (id: string) => void;
  colors: Colors;
}) {
  const base = selectedIds.length > 0
    ? SUPPLEMENTS.filter((supp) => selectedIds.includes(supp.id))
    : suggestSupplementsForGaps(foodMicros, MAX_SUPPLEMENTS);
  const byId = new Map<string, SupplementDef>();
  for (const supp of SUPPLEMENTS) if (checkedIds.includes(supp.id)) byId.set(supp.id, supp);
  for (const supp of base) byId.set(supp.id, supp);
  for (const supp of SUPPLEMENTS) { if (byId.size >= MIN_SUPPLEMENTS) break; byId.set(supp.id, supp); }
  const visible = Array.from(byId.values()).slice(0, MAX_SUPPLEMENTS);
  return (
    <BrutalBox style={[s.analysisCard, { marginHorizontal: 20 }]} offset={4}>
      <View style={s.rowBetween}>
        <Text style={[s.analysisSectionTitle, { color: colors.foreground }]}>supplements today</Text>
        {!takesSupplements && <Text style={[s.nudgeText, { color: colors.mutedForeground }]}>optional nudge</Text>}
      </View>
      {!takesSupplements ? (
        <Text style={[s.rowSub, { color: colors.mutedForeground }]}>
          common gaps: vitamin D, omega-3, magnesium & B12. food first; track supplements if you use them.
        </Text>
      ) : null}
      <View style={s.suppList}>
        {visible.map((supp) => {
          const checked = checkedIds.includes(supp.id);
          // derive which micro key this supplement primarily provides
          const primaryKey = Object.entries(supp.provides).reduce<string | null>(
            (best, [k, v]) => (v > 0 && (!best || v > (supp.provides[best] ?? 0)) ? k : best), null
          );
          const gapFlag = primaryKey && foodMicros[primaryKey] !== undefined
            ? (foodMicros[primaryKey] ?? 0) < 0.3 * (SUPPLEMENTS.find(s => s.id === supp.id)?.provides[primaryKey] ?? 1)
            : false;
          return (
            <Pressable
              key={supp.id}
              onPress={() => onToggle(supp.id)}
              style={[s.suppRow, { borderColor: colors.foreground, backgroundColor: checked ? colors.primary : colors.background }]}
            >
              <Feather name={checked ? 'check-square' : 'square'} size={16} color={checked ? colors.primaryForeground : colors.foreground} />
              <View style={{ flex: 1 }}>
                <Text style={[s.suppText, { color: checked ? colors.primaryForeground : colors.foreground }]}>{supp.label}</Text>
                {!checked && gapFlag && primaryKey && (
                  <Text style={[s.suppWhy, { color: colors.mutedForeground }]}>low in {primaryKey.replace(/([A-Z])/g, ' $1').toLowerCase().trim()} today</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </BrutalBox>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: BRUTAL.border },
  navBtn: { width: 36, alignItems: 'center', justifyContent: 'center', height: 36 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerCenter: { flex: 1, alignItems: 'center', gap: 3 },
  headerDate: { fontFamily: F.displayBold, fontSize: 24, fontStyle: 'italic', letterSpacing: -0.5 },
  headerSub: { fontFamily: F.mono, fontSize: 12 },

  // Meals section
  mealsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  headingBlock: { gap: 2 },
  headingStroke: { height: 3, width: 44, borderRadius: 2 },
  mealsSectionTitle: { fontFamily: F.displayBold, fontSize: 24, fontStyle: 'italic', letterSpacing: -0.5 },
  logBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radiusPill, paddingHorizontal: 14, paddingVertical: 8 },
  logBtnTxt: { fontFamily: F.bodyBold, fontSize: 13 },

  // Group header
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, paddingBottom: 8, marginBottom: 4, borderBottomWidth: 2 },
  groupDot: { width: 10, height: 10, borderWidth: 2, borderRadius: BRUTAL.radiusPill },
  groupTitle: { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 1 },
  groupCals: { fontFamily: F.monoMed, fontSize: 11 },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 40, gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: F.displayBold, fontSize: 28, fontStyle: 'italic', letterSpacing: -0.5, textAlign: 'center' },
  emptySub: { fontFamily: F.bodyReg, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radiusPill, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  emptyBtnTxt: { fontFamily: F.bodyBold, fontSize: 14 },

  // FAB
  fab: { position: 'absolute', right: 20 },
  fabShadow: { position: 'absolute', top: BRUTAL.shadowSm, left: BRUTAL.shadowSm, width: 58, height: 58, borderRadius: BRUTAL.radiusPill, pointerEvents: 'none' },
  fabBtn: { width: 58, height: 58, borderRadius: BRUTAL.radiusPill, borderWidth: BRUTAL.border, alignItems: 'center', justifyContent: 'center' },

  // Analysis widgets
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 8 },
  sectionTitle: { fontFamily: F.displayBold, fontSize: 20, fontStyle: 'italic', letterSpacing: -0.5 },
  analysisCard: { padding: 16, gap: 14 },
  rowCard: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconSquare: { width: 38, height: 38, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowTitle: { fontFamily: F.bodyBold, fontSize: 15 },
  rowSub: { fontFamily: F.bodyReg, fontSize: 12, lineHeight: 17, marginTop: 2 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  analysisSectionTitle: { fontFamily: F.displayBold, fontSize: 17, fontStyle: 'italic' },
  trendRows: { gap: 12 },
  miniBarRow: { gap: 6 },
  miniLabel: { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase' },
  miniBars: { height: 42, flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  miniBar: { flex: 1, borderWidth: 2, borderRadius: 2 },
  nudgeText: { fontFamily: F.bodyMed, fontSize: 11 },
  suppList: { gap: 8 },
  suppRow: { borderWidth: 2, borderRadius: BRUTAL.radius, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  suppText: { fontFamily: F.bodyBold, fontSize: 12 },
  suppWhy:  { fontFamily: F.bodyReg, fontSize: 11, marginTop: 2 },
  dailyBadge: { borderWidth: 2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BRUTAL.radius },
  dailyBadgeText: { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 0.5, color: '#111111' },
  scienceCard: { padding: 16, gap: 14 },
  scienceTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confBadge: { borderWidth: 2, paddingHorizontal: 7, paddingVertical: 3, borderRadius: BRUTAL.radius },
  confText: { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 0.5, color: '#111111' },
  scienceCat: { fontFamily: F.bodyMed, fontSize: 11, textTransform: 'capitalize' },
  scienceClaim: { fontFamily: F.bodyBold, fontSize: 15, lineHeight: 21 },
  scienceExp: { fontFamily: F.bodyReg, fontSize: 12, lineHeight: 18 },
  scienceLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  scienceLinkText: { fontFamily: F.bodyBold, fontSize: 12 },
  seeAllLink: { fontFamily: F.bodyBold, fontSize: 12 },

  // Modal Prompt Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { padding: 20, width: '100%', maxWidth: 320, gap: 12 },
  modalDot: { width: 12, height: 12, borderWidth: 3, marginBottom: 4 },
  modalTitle: { fontFamily: F.displayBold, fontSize: 22, fontStyle: 'italic', letterSpacing: -0.5 },
  modalSub: { fontFamily: F.bodyReg, fontSize: 13, lineHeight: 19, marginBottom: 8 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1.5, borderWidth: BRUTAL.borderThin, borderRadius: BRUTAL.radius, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  modalBtnSecondary: { flex: 1, borderWidth: BRUTAL.borderThin, borderRadius: BRUTAL.radius, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  modalBtnTxt: { fontFamily: F.bodyBold, fontSize: 13 },
  modalBtnTxtSecondary: { fontFamily: F.bodyMed, fontSize: 13 },
});
