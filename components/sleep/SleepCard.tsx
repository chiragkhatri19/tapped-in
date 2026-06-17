import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons, Feather } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { BrutalBox } from '@/components/brutal';
import { useSleepStore } from '@/stores/sleep-store';
import { useStepsStore } from '@/stores/steps-store';
import { useHealthStore, type HealthScope } from '@/stores/health-store';
import { SleepLogModal } from '@/components/sleep/SleepLogModal';
import { SleepRingBadge } from '@/components/sleep/SleepRingBadge';
import { formatDuration, formatClock } from '@/lib/sleep-utils';
import { runHealthSync, SYNC_ERROR_MESSAGE, HealthSyncException, type HealthSyncPayload } from '@/lib/health/sync';
import { SLEEP_TARGET_MIN, type SleepEntry } from '@/data/sleep-types';
import type { StepEntry } from '@/data/steps-types';

interface SleepCardProps {
  dateKey: string;
  isToday: boolean;
}

type SyncPhase =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'confirm'; payload: HealthSyncPayload }
  | { phase: 'error'; message: string };

export function SleepCard({ dateKey, isToday }: SleepCardProps) {
  const colors = useColors();
  const entries   = useSleepStore(s => s.entries);
  const entry     = entries[dateKey];
  const upsertSleep = useSleepStore(s => s.upsert);
  const upsertSteps = useStepsStore(s => s.upsert);
  const setHealthConnected = useHealthStore(s => s.setConnected);
  const setHrv  = useHealthStore(s => s.setHrv);
  const setSpo2 = useHealthStore(s => s.setSpo2);
  const setLatestWeight = useHealthStore(s => s.setLatestWeight);
  const setLastSync = useHealthStore(s => s.setLastSync);
  const spo2Alerts = useHealthStore(s => s.spo2Alerts);
  const spo2Today = spo2Alerts[dateKey];

  const [modalMode, setModalMode] = useState<'manual' | 'estimate' | null>(null);
  const [sync, setSync] = useState<SyncPhase>({ phase: 'idle' });

  const handleSave = useCallback((e: SleepEntry) => { upsertSleep(e); }, [upsertSleep]);

  const handleHealthSync = useCallback(async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSync({ phase: 'loading' });
    try {
      const payload = await runHealthSync(7);
      // Silently apply non-sleep data regardless of sleep count
      if (Object.keys(payload.hrv).length > 0) setHrv(payload.hrv);
      if (Object.keys(payload.spo2).length > 0) setSpo2(payload.spo2);
      if (payload.latestWeightKg !== null) setLatestWeight(payload.latestWeightKg);

      if (payload.sleep.length === 0 && payload.steps.length === 0) {
        setHealthConnected(payload.providerId, payload.grantedScopes as HealthScope[]);
        setLastSync(new Date().toISOString());
        setSync({ phase: 'idle' });
        return;
      }
      setSync({ phase: 'confirm', payload });
    } catch (err) {
      const code = err instanceof HealthSyncException ? err.code : 'read_failed';
      setSync({ phase: 'error', message: SYNC_ERROR_MESSAGE(code) });
    }
  }, [setHealthConnected]);

  const handleImport = useCallback(() => {
    if (sync.phase !== 'confirm') return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const { payload } = sync;

    // Only upsert sleep entries that don't already have a manual source
    for (const s of payload.sleep) {
      const existing = entries[s.dateKey];
      if (!existing || existing.source === 'health_connect' || existing.source === 'healthkit') {
        upsertSleep(s);
      }
    }
    for (const s of payload.steps) {
      upsertSteps(s);
    }
    setHealthConnected(payload.providerId, payload.grantedScopes as HealthScope[]);
    setLastSync(new Date().toISOString());
    setSync({ phase: 'idle' });
  }, [sync, entries, upsertSleep, upsertSteps, setHealthConnected, setLastSync]);

  const fill = entry ? Math.min(entry.durationMin / SLEEP_TARGET_MIN, 1) : 0;
  const entryQuality = entry?.quality;
  const isAndroid = Platform.OS === 'android';

  return (
    <>
      <BrutalBox style={[s.card, { marginHorizontal: 20 }]} offset={BRUTAL.shadow}>
        {/* Header */}
        <View style={s.headerRow}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>SLEEP</Text>
          <Ionicons name="moon" size={15} color={colors.violet} />
        </View>

        {/* ── Sync loading ── */}
        {sync.phase === 'loading' && (
          <View style={s.syncRow}>
            <ActivityIndicator size="small" color={colors.violet} />
            <Text style={[s.syncText, { color: colors.mutedForeground }]}>
              connecting to Health Connect…
            </Text>
          </View>
        )}

        {/* ── Confirm import ── */}
        {sync.phase === 'confirm' && (
          <View style={s.confirmBody}>
            <View style={[s.confirmBadge, { borderColor: colors.foreground, backgroundColor: colors.violet + '18' }]}>
              <Ionicons name="cloud-download-outline" size={16} color={colors.violet} />
              <Text style={[s.confirmText, { color: colors.foreground }]}>
                found {sync.payload.sleep.length} sleep session{sync.payload.sleep.length !== 1 ? 's' : ''}
                {sync.payload.steps.length > 0 ? ` + ${sync.payload.steps.length} step days` : ''} from Health Connect
              </Text>
            </View>
            {/* Preview the most recent 3 sessions */}
            {sync.payload.sleep.slice(0, 3).map((se) => (
              <View key={se.dateKey} style={[s.previewRow, { borderColor: colors.muted }]}>
                <Text style={[s.previewDate, { color: colors.mutedForeground }]}>{se.dateKey}</Text>
                <Text style={[s.previewDur, { color: colors.foreground }]}>{formatDuration(se.durationMin)}</Text>
                {se.deepMin != null && (
                  <Text style={[s.previewStage, { color: colors.violet }]}>
                    {formatDuration(se.deepMin)} deep
                  </Text>
                )}
              </View>
            ))}
            <View style={s.confirmBtns}>
              <Pressable
                onPress={handleImport}
                style={({ pressed }) => [s.importBtn, { backgroundColor: colors.violet, borderColor: colors.foreground, opacity: pressed ? 0.8 : 1 }]}
              >
                <Feather name="download" size={13} color="#FFFFFF" />
                <Text style={[s.importBtnTxt, { color: '#FFFFFF' }]}>
                  import {sync.payload.sleep.length > 0 ? sync.payload.sleep.length : ''} session{sync.payload.sleep.length !== 1 ? 's' : ''}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSync({ phase: 'idle' })}
                style={({ pressed }) => [s.dismissBtn, { borderColor: colors.foreground, backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={[s.dismissTxt, { color: colors.foreground }]}>dismiss</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Error ── */}
        {sync.phase === 'error' && (
          <View style={s.errorRow}>
            <Feather name="alert-triangle" size={14} color={colors.orange} />
            <Text style={[s.errorText, { color: colors.orange }]}>{sync.message}</Text>
            <Pressable onPress={() => setSync({ phase: 'idle' })} hitSlop={8}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </Pressable>
          </View>
        )}

        {/* ── Main body (hidden while sync UI is showing) ── */}
        {sync.phase === 'idle' && (
          <>
            {entry ? (
              <Pressable onPress={() => setModalMode('manual')} style={s.loggedBody}>
                <SleepRingBadge fill={fill} size={64} />
                <View style={s.loggedInfo}>
                  <Text style={[s.duration, { color: colors.foreground }]}>
                    {formatDuration(entry.durationMin)}
                  </Text>
                  <Text style={[s.times, { color: colors.mutedForeground }]}>
                    {formatClock(entry.bedtime)} → {formatClock(entry.wakeTime)}
                  </Text>
                  {(entry.source === 'health_connect' || entry.source === 'healthkit') && (
                    <Text style={[s.sourceTag, { color: colors.violet }]}>
                      <Ionicons name="sync" size={10} color={colors.violet} /> health connect
                    </Text>
                  )}
                  {spo2Today && spo2Today.dipCount > 0 && (
                    <View style={[s.spo2Badge, { backgroundColor: colors.orange + '20', borderColor: colors.orange }]}>
                      <Feather name="alert-triangle" size={10} color={colors.orange} />
                      <Text style={[s.spo2Text, { color: colors.orange }]}>
                        SpO₂ dipped {spo2Today.dipCount}× below 90% (min {spo2Today.minPct}%)
                      </Text>
                    </View>
                  )}
                  {entryQuality != null && (
                    <View style={s.qualityRow}>
                      {([1, 2, 3, 4, 5] as const).map(n => (
                        <View
                          key={n}
                          style={[s.dot, {
                            backgroundColor: n <= entryQuality ? colors.violet : colors.muted,
                            borderColor: colors.foreground,
                          }]}
                        />
                      ))}
                    </View>
                  )}
                </View>
                <Feather name="edit-2" size={14} color={colors.mutedForeground} />
              </Pressable>
            ) : (
              <View style={s.emptyBody}>
                <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
                  {isToday ? 'last night not logged' : 'no sleep logged'}
                </Text>
                {isToday && (
                  <View style={s.btnRow}>
                    <Pressable
                      onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setModalMode('manual'); }}
                      style={({ pressed }) => [s.logBtn, { backgroundColor: colors.violet, borderColor: colors.foreground, opacity: pressed ? 0.8 : 1 }]}
                    >
                      <Ionicons name="moon" size={13} color="#FFFFFF" />
                      <Text style={[s.logBtnTxt, { color: '#FFFFFF' }]}>manual</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setModalMode('estimate'); }}
                      style={({ pressed }) => [s.logBtn, { backgroundColor: colors.card, borderColor: colors.foreground, opacity: pressed ? 0.8 : 1 }]}
                    >
                      <Ionicons name="flash" size={13} color={colors.foreground} />
                      <Text style={[s.logBtnTxt, { color: colors.foreground }]}>estimate</Text>
                    </Pressable>
                    {isAndroid && (
                      <Pressable
                        onPress={handleHealthSync}
                        style={({ pressed }) => [s.logBtn, { backgroundColor: colors.card, borderColor: colors.foreground, opacity: pressed ? 0.8 : 1 }]}
                      >
                        <Ionicons name="heart-circle-outline" size={13} color={colors.foreground} />
                        <Text style={[s.logBtnTxt, { color: colors.foreground }]}>health</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Re-sync row when entry already exists and came from health */}
            {entry && isAndroid && (
              <Pressable
                onPress={handleHealthSync}
                style={s.resyncRow}
                hitSlop={4}
              >
                <Ionicons name="sync-outline" size={12} color={colors.mutedForeground} />
                <Text style={[s.resyncTxt, { color: colors.mutedForeground }]}>re-sync from Health Connect</Text>
              </Pressable>
            )}
          </>
        )}
      </BrutalBox>

      <SleepLogModal
        visible={modalMode !== null}
        mode={modalMode ?? 'manual'}
        initial={entry}
        onClose={() => setModalMode(null)}
        onSave={handleSave}
      />
    </>
  );
}

const s = StyleSheet.create({
  card: { padding: 16, gap: 12 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 1 },

  // Sync loading
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  syncText: { fontFamily: F.bodyReg, fontSize: 13 },

  // Confirm import
  confirmBody: { gap: 10 },
  confirmBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: BRUTAL.borderThin, borderRadius: BRUTAL.radius, padding: 10 },
  confirmText: { fontFamily: F.bodyMed, fontSize: 13, flex: 1 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, paddingBottom: 6 },
  previewDate: { fontFamily: F.mono, fontSize: 11, width: 84 },
  previewDur: { fontFamily: F.monoSemi, fontSize: 13, flex: 1 },
  previewStage: { fontFamily: F.mono, fontSize: 11 },
  confirmBtns: { flexDirection: 'row', gap: 10, marginTop: 2 },
  importBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 2, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radiusPill, paddingHorizontal: 14, paddingVertical: 9, justifyContent: 'center' },
  importBtnTxt: { fontFamily: F.bodyBold, fontSize: 13 },
  dismissBtn: { flex: 1, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radiusPill, paddingHorizontal: 14, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
  dismissTxt: { fontFamily: F.bodyMed, fontSize: 13 },

  // Error
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  errorText: { fontFamily: F.bodyMed, fontSize: 13, flex: 1 },

  // Logged state
  loggedBody: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  loggedInfo: { flex: 1, gap: 4 },
  duration: { fontFamily: F.monoSemi, fontSize: 28, letterSpacing: -1, lineHeight: 32 },
  times: { fontFamily: F.mono, fontSize: 12 },
  sourceTag: { fontFamily: F.mono, fontSize: 10, letterSpacing: 0.3 },
  spo2Badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 2 },
  spo2Text: { fontFamily: F.mono, fontSize: 10 },
  qualityRow: { flexDirection: 'row', gap: 5, marginTop: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },

  // Empty state
  emptyBody: { gap: 12 },
  emptyText: { fontFamily: F.bodyReg, fontSize: 13 },
  btnRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  logBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: BRUTAL.border, borderRadius: BRUTAL.radiusPill, paddingHorizontal: 14, paddingVertical: 9 },
  logBtnTxt: { fontFamily: F.bodyBold, fontSize: 13 },

  // Re-sync
  resyncRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  resyncTxt: { fontFamily: F.mono, fontSize: 11 },
});
