import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrutalBox, BrutalButton } from '@/components/brutal';
import { Appear } from '@/components/motion/Appear';
import { SleepLogModal } from '@/components/sleep/SleepLogModal';
import { SleepDashboard } from '@/components/sleep/SleepDashboard';
import { SleepScienceCard } from '@/components/sleep/SleepScienceCard';

// Recovery components
import { RecoveryScoreHero } from '@/components/recovery/RecoveryScoreHero';
import { SleepSummaryCard } from '@/components/recovery/SleepSummaryCard';
import { StepsCard } from '@/components/recovery/StepsCard';
import { StepsTrend } from '@/components/recovery/StepsTrend';
import { SleepStagesBar } from '@/components/recovery/SleepStagesBar';
import { ConsistencyCard } from '@/components/recovery/ConsistencyCard';
import { SleepDebtCard } from '@/components/recovery/SleepDebtCard';
import { EmptyRecovery } from '@/components/recovery/EmptyRecovery';
import { ConnectTrackerCard } from '@/components/recovery/ConnectTrackerCard';
import { ConnectTrackerModal } from '@/components/recovery/ConnectTrackerModal';

import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { useColors } from '@/hooks/useColors';
import { useLastNight, useRecentSleep, useSleepStore } from '@/stores/sleep-store';
import { useTodaySteps, useRecentSteps } from '@/stores/steps-store';
import { useHealthConnection, useHealthStore } from '@/stores/health-store';
import { computeRecoveryScore } from '@/lib/recovery-engine';
import { DOCK_SAFE_BOTTOM } from '@/components/navigation/BrutalDock';

import type { SleepEntry } from '@/data/sleep-types';

const DAYS = 7;

function getTodayDateLabel(): string {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

export default function RecoveryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const upsert = useSleepStore((s) => s.upsert);
  const lastNight = useLastNight();
  const recent7 = useRecentSleep(DAYS);
  const todaySteps = useTodaySteps();
  const recentSteps = useRecentSteps(DAYS);
  const { connected } = useHealthConnection();
  const hrvEntries = useHealthStore((s) => s.hrvEntries);

  const [sleepModalVisible, setSleepModalVisible] = useState(false);
  const [sleepModalMode, setSleepModalMode] = useState<'manual' | 'estimate'>('manual');
  const [editEntry, setEditEntry] = useState<SleepEntry | undefined>(undefined);
  const [connectModalVisible, setConnectModalVisible] = useState(false);

  const todayRMSSD = lastNight ? hrvEntries[lastNight.dateKey] : undefined;
  const recentRMSSDs = recent7
    .filter((e): e is SleepEntry => e !== null && e.dateKey !== lastNight?.dateKey)
    .map((e) => hrvEntries[e.dateKey])
    .filter((r): r is number => r !== undefined);
  const recoveryScore = computeRecoveryScore(lastNight, recent7, { todayRMSSD, recentRMSSDs });

  // Show the full empty state when no data at all
  const hasAnyData = lastNight !== null || recent7.some(Boolean) || todaySteps !== null;

  function openSleepModal(mode: 'manual' | 'estimate', entry?: SleepEntry) {
    Haptics.selectionAsync();
    setSleepModalMode(mode);
    setEditEntry(entry);
    setSleepModalVisible(true);
  }

  function handleSleep(entry: SleepEntry) {
    upsert(entry);
  }

  function handleSelectBar(dateKey: string, entry: SleepEntry | null) {
    Haptics.selectionAsync();
    setEditEntry(entry ?? undefined);
    setSleepModalMode('manual');
    setSleepModalVisible(true);
  }

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: DOCK_SAFE_BOTTOM + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Appear index={0}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerSuper, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
                recovery
              </Text>
              <Text style={[styles.headerDate, { fontFamily: F.displayBold, color: colors.foreground }]}>
                {getTodayDateLabel()}
              </Text>
            </View>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/profile'); }}
              style={[styles.profileBtn, { borderColor: colors.foreground, backgroundColor: colors.card }]}
            >
              <Feather name="user" size={18} color={colors.foreground} />
            </Pressable>
          </View>
        </Appear>

        {/* Empty state — shown when there is truly no data */}
        {!hasAnyData ? (
          <Appear index={1}>
            <EmptyRecovery
              onLog={() => openSleepModal('manual')}
              onConnect={() => setConnectModalVisible(true)}
            />
          </Appear>
        ) : (
          <>
            {/* ── Section 1: Recovery score hero ── */}
            <Appear index={1}>
              <BrutalBox offset={BRUTAL.shadowLg}>
                <View style={styles.sectionPad}>
                  <RecoveryScoreHero score={recoveryScore} />
                </View>
              </BrutalBox>
            </Appear>

            {/* ── Section 2: Last-night sleep summary ── */}
            <Appear index={2}>
              <BrutalBox>
                <View style={styles.sectionPad}>
                  <Text style={[styles.sectionLabel, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
                    last night
                  </Text>
                  <SleepSummaryCard
                    lastNight={lastNight}
                    onEdit={(entry) => openSleepModal('manual', entry)}
                    onLog={() => openSleepModal('manual')}
                  />
                </View>
              </BrutalBox>
            </Appear>

            {/* ── Section 3: Steps / activity ── */}
            <Appear index={3}>
              <BrutalBox>
                <View style={styles.sectionPad}>
                  <StepsCard
                    today={todaySteps}
                    connected={connected}
                    onConnect={() => setConnectModalVisible(true)}
                  />
                </View>
              </BrutalBox>
            </Appear>

            {/* ── Section 4: Actions row ── */}
            <Appear index={4}>
              <View style={styles.actionsRow}>
                <BrutalButton label="log sleep" onPress={() => openSleepModal('manual')} variant="primary" style={styles.actionBtn} />
                <BrutalButton label="quick estimate" onPress={() => openSleepModal('estimate')} variant="secondary" style={styles.actionBtn} />
              </View>
            </Appear>

            {/* ── Section 5: 7-day sleep trends ── */}
            <Appear index={5}>
              <BrutalBox>
                <View style={styles.dashContent}>
                  <SleepDashboard entries={recent7} onSelectEntry={handleSelectBar} />
                </View>
              </BrutalBox>
            </Appear>

            {/* ── Section 6: 7-day steps trends (only when any step data) ── */}
            {recentSteps.some(Boolean) && (
              <Appear index={6}>
                <BrutalBox>
                  <View style={styles.dashContent}>
                    <StepsTrend entries={recentSteps} />
                  </View>
                </BrutalBox>
              </Appear>
            )}

            {/* ── Section 7: Sleep stages (only when stage data present) ── */}
            {lastNight && (
              <Appear index={7}>
                <BrutalBox>
                  <View style={styles.sectionPad}>
                    <SleepStagesBar entry={lastNight} />
                  </View>
                </BrutalBox>
              </Appear>
            )}

            {/* ── Section 8+9: Consistency + debt ── */}
            <Appear index={8}>
              <BrutalBox>
                <View style={styles.sectionPad}>
                  <ConsistencyCard recent7={recent7} />
                  <View style={[styles.divider, { backgroundColor: colors.muted }]} />
                  <SleepDebtCard recent7={recent7} />
                </View>
              </BrutalBox>
            </Appear>

            {/* ── Section 10: Science card ── */}
            <Appear index={9}>
              <BrutalBox>
                <View style={styles.sectionPad}>
                  <SleepScienceCard />
                </View>
              </BrutalBox>
            </Appear>

            {/* ── Section 11: Connect tracker ── */}
            <Appear index={10}>
              <BrutalBox>
                <View style={styles.sectionPad}>
                  <ConnectTrackerCard
                    onConnect={() => setConnectModalVisible(true)}
                    onSync={() => setConnectModalVisible(true)}
                  />
                </View>
              </BrutalBox>
            </Appear>
          </>
        )}
      </ScrollView>

      <SleepLogModal
        visible={sleepModalVisible}
        mode={sleepModalMode}
        initial={editEntry}
        onClose={() => {
          setSleepModalVisible(false);
          setEditEntry(undefined);
        }}
        onSave={handleSleep}
      />

      <ConnectTrackerModal
        visible={connectModalVisible}
        onClose={() => setConnectModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerLeft: { flex: 1 },
  headerSuper: { fontSize: 13, textTransform: 'lowercase', marginBottom: 2 },
  headerDate: { fontSize: 28, fontStyle: 'italic', letterSpacing: -0.8, textTransform: 'lowercase' },
  profileBtn: { width: 40, height: 40, borderRadius: BRUTAL.radius, borderWidth: BRUTAL.border, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  sectionPad: { padding: 20, gap: 12 },
  sectionLabel: { fontSize: 12, textTransform: 'lowercase', letterSpacing: 0.3, marginBottom: -4 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1 },
  dashContent: { padding: 20 },
  divider: { height: 1, marginVertical: 14 },
});
