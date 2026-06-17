/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { withAlpha } from '@/constants/colors';
import { muscleColor } from '@/constants/muscles';
import { BrutalBox, BrutalButton, BrutalShadow } from '@/components/brutal';
import VolumeBars from '@/components/workout/VolumeBars';
import { SectionLabel, WeekStrip, makeWeekStripDays } from '@/components/workout/ui';
import { EvidenceModal } from '@/components/EvidenceModal';
import { useWorkoutStore } from '@/stores/workout-store';
import {
  getWeeklyMuscleVolumes, getOnboardingFallbackVolumes,
  getWeakPoints, computeWorkoutStreak,
} from '@/lib/workout-analytics';
import { EXERCISES } from '@/data/exercises';
import { EVIDENCE_CARDS } from '@/data/evidence';
import type { WorkoutPlan, WorkoutLog } from '@/stores/workout-store';
import type { EvidenceCard } from '@/types';

// -- Constants -----------------------------------------------------------------

const DAYS_7 = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;

const MOTIVATION_LINES = [
  "leg day. the squat doesn't care about your feelings.",
  "you don't need motivation, you need to start set one.",
  "consistency is the only real cheat code. log it.",
  "be honest. did you actually push to 1 or 2 RIR last session?",
  "rest day. recovery is where the muscle is actually built.",
  "progressive overload isn't a vibe. it's a number. add it.",
  "the workout you skip is the one that would have mattered.",
  "honestly, your future self is going to respect what you did today.",
  "compound first, isolation later. your CNS will thank you.",
  "volume is the dose. you wouldn't take half your meds.",
];

const WORKOUT_CARD_IDS = [
  'workout_volume','workout_frequency','progressive_overload',
  'proximity_to_failure','rest_intervals','exercise_order',
];

// -- Helpers -------------------------------------------------------------------

function getDayKey(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getTodayDow(): string {
  return new Date().toLocaleDateString('en-US', { weekday:'long' }).toLowerCase();
}

function getMondayDate(): Date {
  const today = new Date();
  const dow = today.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  const m = new Date(today);
  m.setDate(today.getDate() + diff);
  m.setHours(0,0,0,0);
  return m;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
}

function dailyPick<T>(arr: T[]): T {
  const day = new Date().toISOString().slice(0,10);
  const hash = day.split('').reduce((h,c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
  return arr[Math.abs(hash) % arr.length];
}

// -- Props ---------------------------------------------------------------------

interface Props {
  plans: WorkoutPlan[];
  logs: WorkoutLog[];
  topPad: number;
  bottomPad: number;
  onNewPlan: () => void;
  onBuildManual: () => void;
  onStartWorkout: (session: any, plan: any) => void;
  onViewPlan: (plan: any) => void;
  onViewLog: (log: any) => void;
  onViewHistory: () => void;
  onRestoreWorkout: (workout: any) => void;
  onSetActivePlan: (planId: string) => void;
  onDeletePlan: (planId: string) => void;
  onSaveLog: (log: any) => void;
}

// -- Component -----------------------------------------------------------------

export default function WorkoutMainDashboard({
  plans, logs, topPad, bottomPad,
  onNewPlan, onBuildManual, onStartWorkout, onViewPlan, onViewLog,
  onViewHistory, onRestoreWorkout, onSetActivePlan, onDeletePlan, onSaveLog,
}: Props) {
  const colors = useColors();
  const activeWorkout      = useWorkoutStore(s => s.activeWorkout);
  const customExercises    = useWorkoutStore(s => s.customExercises);
  const clearActiveWorkout = useWorkoutStore(s => s.clearActiveWorkout);

  const [evidenceCard, setEvidenceCard]   = useState<EvidenceCard | null>(null);
  const [evidenceVisible, setEvidenceVisible] = useState(false);
  const [skipCheck, setSkipCheck] = useState<{ sessionName:string; date:string; planId:string } | null>(null);
  const [toast, setToast] = useState('');

  // Crash recovery
  const crashWorkout = useMemo(() => {
    if (!activeWorkout) return null;
    const age = Date.now() - new Date(activeWorkout.startedAt).getTime();
    return age < 4 * 60 * 60 * 1000 ? activeWorkout : null;
  }, [activeWorkout]);

  // Yesterday skip check
  useEffect(() => {
    const activePlan = plans.find(p => p.isActive);
    if (!activePlan) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const ydDow = yesterday.toLocaleDateString('en-US', { weekday:'long' }).toLowerCase();
    const ydKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
    const sessionName = activePlan.weeklySchedule?.[ydDow];
    if (!sessionName || sessionName === 'Rest' || sessionName === 'Active Rest') return;
    const alreadyLogged = logs.some(l => l.date === ydKey && !l.skipped);
    if (!alreadyLogged) setSkipCheck({ sessionName, date: ydKey, planId: activePlan.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  function openEvidence(id: string) {
    const card = EVIDENCE_CARDS.find(c => c.id === id);
    if (!card) return;
    setEvidenceCard(card);
    setEvidenceVisible(true);
  }

  function handleSkipYes() {
    if (!skipCheck) return;
    onSaveLog({
      id: Date.now().toString(),
      planId: skipCheck.planId,
      sessionName: skipCheck.sessionName,
      date: skipCheck.date,
      startedAt: skipCheck.date + 'T00:00:00.000Z',
      completedAt: new Date().toISOString(),
      durationMinutes: null,
      exercises: [],
      totalVolume: 0, totalSets: 0,
      prsAchieved: [], feelingRating: null, energyLevel: null, sleepLastNight: null,
      notes: 'Retroactively marked complete',
      cardioCompleted: false, cardioMinutes: null,
    });
    setSkipCheck(null);
    showToast('logged!');
  }

  // -- Derived data -----------------------------------------------------------
  const activePlan     = plans.find(p => p.isActive) ?? (plans.length > 0 ? plans[0] : null);
  const todayDow       = getTodayDow();
  const todayKey       = getDayKey(0);
  const completedLogs  = logs.filter(l => !l.skipped);
  const isEmpty        = plans.length === 0 && completedLogs.length === 0;

  const todaySessionName  = activePlan?.weeklySchedule?.[todayDow] ?? null;
  const isRestDay         = !todaySessionName || todaySessionName === 'Rest' || todaySessionName === 'Active Rest';
  const todaySession      = !isRestDay && activePlan
    ? (activePlan.sessions ?? []).find((s: any) => s.name === todaySessionName) ?? null
    : null;
  const todayLogged   = logs.some(l => l.date === todayKey && l.sessionName === todaySessionName && !l.skipped);

  // Week strip — use shared makeWeekStripDays helper
  const completedSessionsThisWeek = useMemo(() => {
    const monday = getMondayDate();
    const set = new Set<string>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const log = completedLogs.find(l => l.date === key);
      if (log) set.add(log.sessionName);
    }
    return set;
  }, [completedLogs]);

  const weekStripDays = activePlan
    ? makeWeekStripDays(activePlan.weeklySchedule, completedSessionsThisWeek)
    : [];

  const streak = computeWorkoutStreak(logs);

  // Volume analytics
  const hasEnoughData   = completedLogs.length >= 3;
  const volumes         = hasEnoughData
    ? getWeeklyMuscleVolumes(logs, customExercises)
    : getOnboardingFallbackVolumes([]);
  const weakPoints      = getWeakPoints(volumes);
  const topWeak         = weakPoints[0] ?? null;
  const suggestedExercises = topWeak
    ? EXERCISES.filter(e => e.primaryMuscle === topWeak.group && e.category === 'compound').slice(0, 3)
    : [];

  const sortedPlans = [...plans].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const recentLogs = [...completedLogs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const workoutCards  = EVIDENCE_CARDS.filter(c => WORKOUT_CARD_IDS.includes(c.id));
  const sciencePick   = dailyPick(workoutCards.length ? workoutCards : EVIDENCE_CARDS);
  const motivation    = dailyPick(MOTIVATION_LINES);

  // Today's cardio block (from active plan's cardioProgram)
  const todayCardio = useMemo(() => {
    if (!activePlan?.cardioProgram || isRestDay) return null;
    return activePlan.cardioProgram.sessions.find(c => {
      const dow = DAYS_7.find((_, i) => {
        const d = new Date();
        return d.toLocaleDateString('en-US', { weekday:'long' }).toLowerCase() === DAYS_7[i];
      });
      return c.day === dow || c.placement === 'post_lift';
    }) ?? null;
  }, [activePlan, isRestDay]);

  // -- Section renderers (reduce cyclomatic complexity of main render) ---------

  function renderEmptyState() {
    return (
      <View style={{ paddingHorizontal:20, marginTop:20 }}>
        <Text style={[s.emptyHero, { color: colors.foreground }]}>
          no plan yet.{'\n'}no sessions yet.{'\n'}let's fix that.
        </Text>
        <View style={{ gap:12, marginTop:28 }}>
          <Pressable onPress={onBuildManual}>
            <BrutalBox style={{ padding:20 }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
                <View style={{ flex:1, marginRight:12 }}>
                  <View style={[s.pathTag, { backgroundColor: colors.highlight, borderColor: colors.foreground }]}>
                    <Text style={[s.pathTagText, { color:'#111111' }]}>MANUAL</Text>
                  </View>
                  <Text style={[s.pathTitle, { color: colors.foreground, marginTop:10 }]}>build your own split</Text>
                  <Text style={[s.pathSub, { color: colors.mutedForeground }]}>pick a template, add your lifts, set your numbers. full control.</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} style={{ marginTop:6 }} />
              </View>
            </BrutalBox>
          </Pressable>
          <Pressable onPress={onNewPlan}>
            <BrutalShadow offset={BRUTAL.shadowLg}>
              <View style={[s.aiCard, { backgroundColor: colors.primary, borderColor: colors.foreground }]}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <View style={{ flex:1, marginRight:12 }}>
                    <View style={[s.pathTag, { backgroundColor: colors.highlight, borderColor: colors.foreground }]}>
                      <Text style={[s.pathTagText, { color:'#111111' }]}>FASTEST</Text>
                    </View>
                    <Text style={[s.pathTitle, { color: colors.primaryForeground, marginTop:10 }]}>generate with AI</Text>
                    <Text style={[s.pathSub, { color: withAlpha(colors.primaryForeground, 0.7) }]}>answer a few questions. get an evidence-based plan in 30 sec.</Text>
                  </View>
                  <Feather name="zap" size={20} color={colors.highlight} style={{ marginTop:6 }} />
                </View>
              </View>
            </BrutalShadow>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderPlansSection() {
    return (
      <View style={{ marginTop:22 }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <SectionLabel>MY PLANS</SectionLabel>
          <Pressable onPress={onNewPlan}>
            <Text style={{ fontFamily:F.bodySemi, fontSize:13, color: colors.primary }}>+ new plan</Text>
          </Pressable>
        </View>
        {sortedPlans.length === 0 ? (
          <BrutalBox style={{ padding:18 }}>
            <Text style={[s.cardSub, { color: colors.mutedForeground, marginBottom:14, textAlign:'center' }]}>no plans yet. generate one or build your own.</Text>
            <BrutalButton label="generate with AI" variant="primary" height={44} onPress={onNewPlan} />
            <BrutalButton label="build manually" variant="secondary" height={40} style={{ marginTop:8 }} onPress={onBuildManual} />
          </BrutalBox>
        ) : sortedPlans.map(plan => (
          <BrutalBox key={plan.id} style={{ padding:16, marginBottom:10 }} background={plan.isActive ? colors.primary : undefined}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <Text style={[s.planName, { color: plan.isActive ? colors.primaryForeground : colors.foreground, flex:1 }]}>{plan.splitName ?? 'unnamed plan'}</Text>
              {plan.isActive && (
                <View style={[s.statusBadge, { backgroundColor: withAlpha(colors.teal, 0.2), borderColor: colors.teal, marginLeft:8 }]}>
                  <Text style={[s.statusBadgeText, { color: colors.teal }]}>active</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection:'row', gap:6, marginBottom:12 }}>
              {plan.splitType && (
                <View style={[s.metaChip, { borderColor: plan.isActive ? withAlpha(colors.primaryForeground, 0.3) : withAlpha(colors.foreground, 0.25) }]}>
                  <Text style={[s.metaChipText, { color: plan.isActive ? withAlpha(colors.primaryForeground, 0.8) : colors.mutedForeground }]}>{plan.splitType.replace(/_/g,' ')}</Text>
                </View>
              )}
              {plan.weeklySchedule && (
                <View style={[s.metaChip, { borderColor: plan.isActive ? withAlpha(colors.primaryForeground, 0.3) : withAlpha(colors.foreground, 0.25) }]}>
                  <Text style={[s.metaChipText, { color: plan.isActive ? withAlpha(colors.primaryForeground, 0.8) : colors.mutedForeground }]}>
                    {Object.values(plan.weeklySchedule).filter((v: any) => v !== 'Rest' && v !== 'Active Rest').length}d/week
                  </Text>
                </View>
              )}
              {plan.source === 'manual' && (
                <View style={[s.metaChip, { borderColor: plan.isActive ? withAlpha(colors.highlight, 0.5) : withAlpha(colors.orange, 0.5) }]}>
                  <Text style={[s.metaChipText, { color: plan.isActive ? colors.highlight : colors.orange }]}>manual</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection:'row', gap:16 }}>
              <Pressable onPress={() => onViewPlan(plan)}>
                <Text style={{ fontFamily:F.bodySemi, fontSize:13, color: plan.isActive ? withAlpha(colors.primaryForeground, 0.7) : colors.mutedForeground }}>view</Text>
              </Pressable>
              {!plan.isActive && (
                <Pressable onPress={() => onSetActivePlan(plan.id)}>
                  <Text style={{ fontFamily:F.bodySemi, fontSize:13, color: colors.primary }}>set active</Text>
                </Pressable>
              )}
              <Pressable style={{ marginLeft:'auto' as any }}
                onPress={() => Alert.alert('delete plan?', 'your logs stay.', [
                  { text:'cancel', style:'cancel' },
                  { text:'delete', style:'destructive', onPress:() => onDeletePlan(plan.id) },
                ])}>
                <Text style={{ fontFamily:F.bodySemi, fontSize:13, color: colors.persimmon }}>delete</Text>
              </Pressable>
            </View>
          </BrutalBox>
        ))}
      </View>
    );
  }

  function renderRecentSessions() {
    if (recentLogs.length === 0) return null;
    return (
      <View style={{ marginTop:22 }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <SectionLabel>RECENT SESSIONS</SectionLabel>
          {completedLogs.length > 3 && (
            <Pressable onPress={onViewHistory}>
              <Text style={{ fontFamily:F.bodySemi, fontSize:13, color: colors.primary }}>see all</Text>
            </Pressable>
          )}
        </View>
        {recentLogs.map(log => (
          <Pressable key={log.id ?? log.date + log.sessionName} onPress={() => onViewLog(log)} style={{ marginBottom:8 }}>
            <BrutalBox style={{ padding:14 }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
                <Text style={[s.logName, { color: colors.foreground, flex:1 }]}>{log.sessionName}</Text>
                <Text style={[s.logDate, { color: colors.mutedForeground }]}>{formatDate(log.date)}</Text>
              </View>
              <View style={{ flexDirection:'row', gap:14, flexWrap:'wrap' }}>
                {log.durationMinutes != null && <Text style={[s.logStat, { color: colors.mutedForeground }]}><Text style={[s.logNum, { color: colors.foreground }]}>{log.durationMinutes}</Text> min</Text>}
                {log.totalSets > 0 && <Text style={[s.logStat, { color: colors.mutedForeground }]}><Text style={[s.logNum, { color: colors.foreground }]}>{log.totalSets}</Text> sets</Text>}
                {log.totalVolume > 0 && <Text style={[s.logStat, { color: colors.mutedForeground }]}><Text style={[s.logNum, { color: colors.foreground }]}>{log.totalVolume.toLocaleString()}</Text> kg</Text>}
                {(log.prsAchieved ?? []).length > 0 && <Text style={[s.logNum, { color: colors.highlight }]}>{log.prsAchieved.length} PR{log.prsAchieved.length > 1 ? 's' : ''}</Text>}
              </View>
            </BrutalBox>
          </Pressable>
        ))}
      </View>
    );
  }

  // -- Render -----------------------------------------------------------------
  return (
    <View style={{ flex:1, backgroundColor: colors.background }}>
      {!!toast && (
        <View style={[s.toast, { backgroundColor: colors.teal, borderColor: colors.foreground }]}>
          <Text style={[s.toastText, { color:'#111111' }]}>{toast}</Text>
        </View>
      )}

      <EvidenceModal
        card={evidenceCard}
        visible={evidenceVisible}
        onClose={() => { setEvidenceVisible(false); setEvidenceCard(null); }}
      />

      <ScrollView
        style={{ flex:1 }}
        contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* -- HEADER --------------------------------------------------------- */}
        <View style={[s.headerRow, { paddingHorizontal:20 }]}>
          <View style={{ flex:1 }}>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>workout.</Text>
            <Text style={[s.headerSub, { color: colors.mutedForeground }]}>plan · log · evidence</Text>
          </View>
          <Pressable onPress={onViewHistory}
            style={[s.iconBtn, { borderColor: colors.foreground, backgroundColor: colors.card }]}>
            <Feather name="clock" size={15} color={colors.foreground} />
          </Pressable>
        </View>

        {/* -- CRASH RECOVERY ------------------------------------------------- */}
        {crashWorkout && (
          <View style={{ paddingHorizontal:20, marginTop:12 }}>
            <BrutalBox style={{ padding:16, borderColor: colors.orange }}>
              <Text style={[s.bannerTitle, { color: colors.foreground }]}>unfinished workout</Text>
              <Text style={[s.bannerSub, { color: colors.mutedForeground }]}>{crashWorkout.sessionName}</Text>
              <View style={{ flexDirection:'row', gap:8, marginTop:12 }}>
                <BrutalButton label="continue" variant="primary" height={42} style={{ flex:1 }}
                  onPress={() => onRestoreWorkout(crashWorkout)} />
                <BrutalButton label="discard" variant="secondary" height={42} style={{ flex:1 }}
                  onPress={() => clearActiveWorkout()} />
              </View>
            </BrutalBox>
          </View>
        )}

        {/* -- SKIP CHECK ----------------------------------------------------- */}
        {skipCheck && (
          <View style={{ paddingHorizontal:20, marginTop:12 }}>
            <BrutalBox style={{ padding:16 }}>
              <Text style={[s.bannerTitle, { color: colors.foreground }]}>
                did you do {skipCheck.sessionName} yesterday?
              </Text>
              <View style={{ flexDirection:'row', gap:8, marginTop:12 }}>
                <BrutalButton label="yeah, did it" variant="secondary" height={40} style={{ flex:1 }}
                  onPress={handleSkipYes} />
                <BrutalButton label="nah, skipped" variant="secondary" height={40} style={{ flex:1 }}
                  onPress={() => {
                    onSaveLog({ id: Date.now().toString(), sessionName: skipCheck.sessionName, date: skipCheck.date, skipped: true });
                    setSkipCheck(null);
                  }} />
              </View>
            </BrutalBox>
          </View>
        )}

        {isEmpty ? renderEmptyState() : (
          /* -- POPULATED STATE ----------------------------------------------- */
          <View style={{ paddingHorizontal:20 }}>

            {/* TODAY'S SESSION HERO — the single shadowLg element */}
            <View style={{ marginTop:18 }}>
              <SectionLabel style={{ marginBottom:8 }}>TODAY</SectionLabel>

              {!activePlan ? (
                <BrutalBox style={{ padding:18 }} offset={BRUTAL.shadowLg}>
                  <Text style={[s.cardTitle, { color: colors.foreground }]}>no active plan</Text>
                  <Text style={[s.cardSub, { color: colors.mutedForeground, marginTop:4, marginBottom:16 }]}>
                    generate a plan to see today's session here
                  </Text>
                  <View style={{ flexDirection:'row', gap:8 }}>
                    <BrutalButton label="generate with AI" variant="primary" height={48} style={{ flex:1 }} onPress={onNewPlan} />
                    <BrutalButton label="build manually" variant="secondary" height={48} style={{ flex:1 }} onPress={onBuildManual} />
                  </View>
                </BrutalBox>

              ) : isRestDay ? (
                <BrutalBox style={{ padding:18 }} offset={BRUTAL.shadow}>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <Text style={[s.heroName, { color: colors.foreground }]}>rest day.</Text>
                    <View style={[s.statusBadge, { backgroundColor: withAlpha(colors.teal, 0.14), borderColor: colors.teal }]}>
                      <Text style={[s.statusBadgeText, { color: colors.teal }]}>{todaySessionName ?? 'Rest'}</Text>
                    </View>
                  </View>
                  <Text style={[s.cardSub, { color: colors.mutedForeground }]}>
                    recovery is where the muscle is actually built. let your CNS reset.
                  </Text>
                </BrutalBox>

              ) : todaySession ? (
                <BrutalShadow offset={BRUTAL.shadowLg}>
                  <View style={[s.heroCard, { backgroundColor: colors.card, borderColor: colors.foreground }]}>
                    {/* Session name + done badge */}
                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <Text style={[s.heroName, { color: colors.foreground, flex:1, marginRight:8 }]}>
                        {todaySession.name}
                      </Text>
                      {todayLogged && (
                        <View style={[s.statusBadge, { backgroundColor: withAlpha(colors.teal, 0.14), borderColor: colors.teal }]}>
                          <Text style={[s.statusBadgeText, { color: colors.teal }]}>done</Text>
                        </View>
                      )}
                    </View>

                    {todaySession.sessionGoal ? (
                      <Text style={[s.sessionGoal, { color: colors.mutedForeground }]}>
                        {todaySession.sessionGoal}
                      </Text>
                    ) : null}

                    {/* Muscle tags */}
                    <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:10, marginBottom:14 }}>
                      {(todaySession.musclesFocused ?? []).map((m: string) => (
                        <View key={m} style={[s.muscleTag, { borderColor: colors.foreground, backgroundColor: colors.muted }]}>
                          <View style={{ width:6, height:6, borderRadius:3, backgroundColor: muscleColor(m) }} />
                          <Text style={[s.muscleTagText, { color: colors.foreground }]}>{m}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Stats row */}
                    <View style={[s.statsRow, { borderTopColor: withAlpha(colors.foreground, 0.1), marginBottom:14 }]}>
                      {todaySession.estimatedDurationMin ? (
                        <View style={s.statItem}>
                          <Text style={[s.statValue, { color: colors.foreground }]}>{todaySession.estimatedDurationMin}</Text>
                          <Text style={[s.statUnit, { color: colors.mutedForeground }]}>min</Text>
                        </View>
                      ) : null}
                      <View style={s.statItem}>
                        <Text style={[s.statValue, { color: colors.foreground }]}>{(todaySession.exercises ?? []).length}</Text>
                        <Text style={[s.statUnit, { color: colors.mutedForeground }]}>exercises</Text>
                      </View>
                      <View style={s.statItem}>
                        <Text style={[s.statValue, { color: colors.foreground }]}>
                          {(todaySession.exercises ?? []).reduce((a: number, e: any) => a + (e.sets ?? 0), 0)}
                        </Text>
                        <Text style={[s.statUnit, { color: colors.mutedForeground }]}>sets</Text>
                      </View>
                    </View>

                    {/* Cardio block (if post-lift cardio scheduled today) */}
                    {todaySession.cardioBlock ? (
                      <View style={[s.cardioBlock, { backgroundColor: withAlpha(colors.orange, 0.08), borderColor: colors.orange }]}>
                        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                          <Feather name="activity" size={13} color={colors.orange} />
                          <Text style={[s.cardioLabel, { color: colors.orange }]}>
                            post-workout: {todaySession.cardioBlock.modality ?? todaySession.cardioBlock.type ?? 'cardio'}
                          </Text>
                        </View>
                        <Text style={[s.cardioMeta, { color: colors.mutedForeground }]}>
                          {todaySession.cardioBlock.durationMin} min · {todaySession.cardioBlock.targetHRbpm}
                        </Text>
                        {todaySession.cardioBlock.evidenceId && (
                          <Pressable onPress={() => openEvidence(todaySession.cardioBlock!.evidenceId!)} style={{ marginTop:4 }}>
                            <Text style={[s.whyLink, { color: colors.orange }]}>why after lifting? →</Text>
                          </Pressable>
                        )}
                      </View>
                    ) : null}

                    {/* CTA */}
                    {todayLogged ? (
                      <View style={{ flexDirection:'row', gap:8 }}>
                        <BrutalButton label="view log" variant="secondary" height={44} style={{ flex:1 }}
                          onPress={() => {
                            const log = [...logs].reverse().find(l => l.date === todayKey && !l.skipped);
                            if (log) onViewLog(log);
                          }} />
                        <BrutalButton label="log another" variant="secondary" height={44} style={{ flex:1 }}
                          onPress={() => onStartWorkout(todaySession, activePlan)} />
                      </View>
                    ) : (
                      <BrutalButton label="start workout" variant="primary" height={54}
                        onPress={() => onStartWorkout(todaySession, activePlan)} />
                    )}
                  </View>
                </BrutalShadow>

              ) : (
                <BrutalBox style={{ padding:18 }}>
                  <Text style={[s.cardTitle, { color: colors.foreground }]}>{todaySessionName}</Text>
                  <Text style={[s.cardSub, { color: colors.mutedForeground, marginTop:4 }]}>
                    session not found in plan.
                  </Text>
                </BrutalBox>
              )}
            </View>

            {/* WEEK STRIP */}
            {weekStripDays.length > 0 && (
              <BrutalBox style={{ padding:16, marginTop:14 }}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <SectionLabel>THIS WEEK</SectionLabel>
                  {streak >= 2 && (
                    <Text style={[s.streakText, { color: colors.orange }]}>{streak} day streak</Text>
                  )}
                </View>
                <WeekStrip days={weekStripDays} />
              </BrutalBox>
            )}

            {/* VOLUME / WEAK POINTS */}
            <BrutalBox style={{ padding:16, marginTop:14 }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <SectionLabel>{hasEnoughData ? "WHERE YOU'RE LAGGING" : 'VOLUME TARGETS'}</SectionLabel>
                <Pressable onPress={() => openEvidence('workout_volume')}
                  style={[s.whyChip, { backgroundColor: colors.highlight, borderColor: colors.foreground }]}>
                  <Text style={[s.whyChipText, { color:'#111111' }]}>why 12-14 sets?</Text>
                </Pressable>
              </View>

              {!hasEnoughData && (
                <Text style={[s.cardSub, { color: colors.mutedForeground, marginBottom:10, fontStyle:'italic' }]}>
                  log a week to see your real numbers.
                </Text>
              )}

              <VolumeBars volumes={volumes.slice(0, 6)} />
            </BrutalBox>

            {/* WHAT TO TRY */}
            {topWeak && suggestedExercises.length > 0 && (
              <BrutalBox style={{ padding:16, marginTop:14 }}>
                <SectionLabel style={{ marginBottom:6 }}>WHAT TO TRY</SectionLabel>
                <Text style={[s.cardSub, { color: colors.mutedForeground, marginBottom:14 }]}>
                  your{' '}
                  <Text style={{ color: colors.persimmon, fontFamily:F.bodySemi }}>{topWeak.group}</Text>
                  {' '}is lagging. add these to your next session.
                </Text>
                {suggestedExercises.map((ex, i) => (
                  <View key={ex.id}
                    style={[s.exRow, {
                      borderBottomColor: withAlpha(colors.foreground, 0.1),
                      borderBottomWidth: i < suggestedExercises.length - 1 ? 1 : 0,
                    }]}>
                    <View style={{ width:8, height:8, borderRadius:4, backgroundColor: muscleColor(ex.primaryMuscle), marginTop:3 }} />
                    <View style={{ flex:1 }}>
                      <Text style={[s.exName, { color: colors.foreground }]}>{ex.name}</Text>
                      <Text style={[s.exMeta, { color: colors.mutedForeground }]}>
                        {ex.equipment} · {ex.defaultReps} reps · {ex.defaultRestSec}s rest
                      </Text>
                    </View>
                  </View>
                ))}
              </BrutalBox>
            )}

            {/* MY PLANS */}
            {renderPlansSection()}

            {/* RECENT SESSIONS */}
            {renderRecentSessions()}
          </View>
        )}

        {/* SCIENCE PICK */}
        <View style={{ paddingHorizontal:20, marginTop:22 }}>
          <Pressable onPress={() => { setEvidenceCard(sciencePick); setEvidenceVisible(true); }}>
            <BrutalBox style={{ padding:16 }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <SectionLabel>SCIENCE PICK</SectionLabel>
                <View style={[s.whyChip, { backgroundColor: colors.teal, borderColor: colors.foreground }]}>
                  <Text style={[s.whyChipText, { color:'#111111' }]}>tap to read</Text>
                </View>
              </View>
              <Text style={[s.scienceClaim, { color: colors.foreground }]} numberOfLines={2}>
                {sciencePick.claim}
              </Text>
              <Text style={[s.cardSub, { color: colors.mutedForeground, marginTop:6 }]} numberOfLines={2}>
                {sciencePick.shortExplanation}
              </Text>
            </BrutalBox>
          </Pressable>
        </View>

        {/* MOTIVATION */}
        <View style={{ paddingHorizontal:20, marginTop:14, paddingBottom:8 }}>
          <Text style={[s.motivationLine, { color: colors.mutedForeground }]}>{motivation}</Text>
        </View>

      </ScrollView>
    </View>
  );
}

// -- Styles --------------------------------------------------------------------

const s = StyleSheet.create({
  headerRow:       { flexDirection:'row', alignItems:'flex-start', paddingTop:12, paddingBottom:8 },
  headerTitle:     { fontFamily:F.displayBold, fontSize:42, fontStyle:'italic', letterSpacing:-1, lineHeight:46 },
  headerSub:       { fontFamily:F.bodyReg, fontSize:12, marginTop:2 },
  iconBtn:         { width:36, height:36, borderWidth:BRUTAL.border, borderRadius:BRUTAL.radius, alignItems:'center', justifyContent:'center', marginTop:10 },
  bannerTitle:     { fontFamily:F.bodySemi, fontSize:14 },
  bannerSub:       { fontFamily:F.bodyReg, fontSize:13, marginTop:2 },
  cardTitle:       { fontFamily:F.bodySemi, fontSize:17 },
  cardSub:         { fontFamily:F.bodyReg, fontSize:13, lineHeight:20 },
  heroName:        { fontFamily:F.displayBold, fontSize:28, fontStyle:'italic', letterSpacing:-0.5, lineHeight:32 },
  sessionGoal:     { fontFamily:F.bodyReg, fontSize:13, lineHeight:19, fontStyle:'italic' },
  heroCard:        { borderWidth:BRUTAL.border, borderRadius:BRUTAL.radiusLg, padding:20 },
  aiCard:          { borderWidth:BRUTAL.border, borderRadius:BRUTAL.radiusLg, padding:20 },
  statusBadge:     { borderWidth:2, borderRadius:BRUTAL.radius, paddingHorizontal:8, paddingVertical:3 },
  statusBadgeText: { fontFamily:F.monoSemi, fontSize:10, letterSpacing:0.5 },
  muscleTag:       { flexDirection:'row', alignItems:'center', gap:5, borderWidth:BRUTAL.borderThin, borderRadius:BRUTAL.radius, paddingHorizontal:7, paddingVertical:3 },
  muscleTagText:   { fontFamily:F.mono, fontSize:11 },
  statsRow:        { flexDirection:'row', gap:20, paddingTop:12, borderTopWidth:1 },
  statItem:        { flexDirection:'row', alignItems:'baseline', gap:4 },
  statValue:       { fontFamily:F.monoSemi, fontSize:18 },
  statUnit:        { fontFamily:F.bodyReg, fontSize:11 },
  cardioBlock:     { borderWidth:1, borderRadius:BRUTAL.radius, padding:12, marginBottom:14, gap:4 },
  cardioLabel:     { fontFamily:F.bodySemi, fontSize:13 },
  cardioMeta:      { fontFamily:F.mono, fontSize:11 },
  whyLink:         { fontFamily:F.bodySemi, fontSize:11 },
  streakText:      { fontFamily:F.monoSemi, fontSize:12 },
  whyChip:         { borderWidth:2, borderRadius:BRUTAL.radius, paddingHorizontal:8, paddingVertical:4 },
  whyChipText:     { fontFamily:F.monoSemi, fontSize:10, letterSpacing:0.5 },
  exRow:           { flexDirection:'row', gap:10, paddingVertical:9, alignItems:'flex-start' },
  exName:          { fontFamily:F.bodySemi, fontSize:13 },
  exMeta:          { fontFamily:F.bodyReg, fontSize:12, marginTop:2 },
  planName:        { fontFamily:F.bodySemi, fontSize:15 },
  metaChip:        { borderWidth:1, borderRadius:BRUTAL.radius, paddingHorizontal:6, paddingVertical:2 },
  metaChipText:    { fontFamily:F.mono, fontSize:10 },
  logName:         { fontFamily:F.bodySemi, fontSize:14 },
  logDate:         { fontFamily:F.mono, fontSize:12 },
  logStat:         { fontFamily:F.bodyReg, fontSize:12 },
  logNum:          { fontFamily:F.monoSemi, fontSize:13 },
  scienceClaim:    { fontFamily:F.displaySemi, fontSize:16, lineHeight:22 },
  motivationLine:  { fontFamily:F.bodyReg, fontSize:13, fontStyle:'italic', lineHeight:20, textAlign:'center' },
  emptyHero:       { fontFamily:F.displayBold, fontSize:36, fontStyle:'italic', letterSpacing:-0.8, lineHeight:44 },
  pathTag:         { alignSelf:'flex-start', borderWidth:2, borderRadius:BRUTAL.radius, paddingHorizontal:8, paddingVertical:3 },
  pathTagText:     { fontFamily:F.monoSemi, fontSize:10, letterSpacing:0.8 },
  pathTitle:       { fontFamily:F.bodySemi, fontSize:17 },
  pathSub:         { fontFamily:F.bodyReg, fontSize:13, lineHeight:19, marginTop:4 },
  toast:           { position:'absolute', bottom:120, alignSelf:'center', paddingHorizontal:16, paddingVertical:8, borderRadius:BRUTAL.radius, zIndex:99, borderWidth:BRUTAL.border },
  toastText:       { fontFamily:F.monoSemi, fontSize:12 },
});
