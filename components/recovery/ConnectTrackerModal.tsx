import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrutalBox, BrutalButton } from '@/components/brutal';
import { getHealthProvider } from '@/lib/health';
import { rawSleepToEntry, rawStepsToEntry } from '@/lib/health/mappers';
import type { HealthProviderId } from '@/stores/health-store';
import { useHealthStore } from '@/stores/health-store';
import { useSleepStore } from '@/stores/sleep-store';
import { useStepsStore } from '@/stores/steps-store';
import type { SleepEntry } from '@/data/sleep-types';
import type { StepEntry } from '@/data/steps-types';
import { formatDuration, formatClock } from '@/lib/sleep-utils';
import { formatSteps } from '@/lib/steps-utils';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type Phase = 'idle' | 'checking' | 'requesting' | 'importing' | 'confirm' | 'unavailable' | 'error';

interface ImportPreview {
  sleep: SleepEntry | null;
  steps: StepEntry | null;
  providerId: HealthProviderId;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ConnectTrackerModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('idle');
  const [unavailableReason, setUnavailableReason] = useState('');
  const [canInstallHc, setCanInstallHc] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  const upsertSleep = useSleepStore((s) => s.upsert);
  const upsertSteps = useStepsStore((s) => s.upsert);
  const { setConnected, setLastSync } = useHealthStore();

  const reasonText: Record<string, string> = {
    no_module: 'this build doesn\'t include the health connector. make sure you\'re running a dev build (not expo go).',
    no_app: 'health connect isn\'t set up on this device yet. install it from the play store, open it once, then come back and connect. your fitbit / samsung / google fit data flows in through health connect.',
    update_required: 'health connect needs an update before it can share data. update it from the play store, then try again.',
    expo_go: 'health sync isn\'t available in expo go. run a dev build to use this feature.',
    unsupported_os: 'health sync is available on android (health connect) and iphone (apple health).',
  };

  // Open Health Connect so the user can grant access manually. If Health Connect
  // is installed this opens its settings/permissions screen; otherwise it falls
  // back to the Play Store listing to install it.
  const openHealthConnect = useCallback(async () => {
    const market = 'market://details?id=com.google.android.apps.healthdata';
    const web = 'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';
    try {
      await Linking.sendIntent('androidx.health.connect.action.HEALTH_CONNECT_SETTINGS');
      return;
    } catch { /* HC settings intent unavailable — try the store */ }
    try {
      await Linking.openURL(market);
    } catch {
      Linking.openURL(web).catch(() => { /* nothing else we can do */ });
    }
  }, []);

  const handleConnect = useCallback(async () => {
    // Every native Health Connect / HealthKit call is wrapped: a thrown native
    // error here must surface as an in-sheet error, never crash the app.
    try {
      try { Haptics.selectionAsync(); } catch { /* haptics optional */ }
      setPhase('checking');

      const provider = getHealthProvider();

      const availability = await provider.isAvailable();
      if (!availability.available) {
        setUnavailableReason(reasonText[availability.reason ?? 'no_module'] ?? 'not available');
        setCanInstallHc(availability.reason === 'no_app' || availability.reason === 'update_required');
        setPhase('unavailable');
        return;
      }
      setCanInstallHc(false);

      setPhase('requesting');
      const permissions = await provider.requestPermissions(['sleep', 'steps', 'heartRate']);
      if (permissions.granted.length === 0) {
        setUnavailableReason("couldn't get access. open health connect, allow Tappd In to read steps, sleep & heart rate, then come back and tap connect again.");
        setCanInstallHc(true);
        setPhase('unavailable');
        return;
      }

      setPhase('importing');
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0);

      const [sleepSessions, stepBuckets] = await Promise.all([
        permissions.granted.includes('sleep')
          ? provider.readSleep({ start: yesterday, end: now })
          : Promise.resolve([]),
        permissions.granted.includes('steps')
          ? provider.readSteps({ start: yesterday, end: now })
          : Promise.resolve([]),
      ]);

      // Get resting HR for latest sleep session if available
      let restingHR: number | null = null;
      if (provider.readRestingHeartRate && permissions.granted.includes('heartRate')) {
        restingHR = await provider.readRestingHeartRate({ start: yesterday, end: now });
      }

      const source = provider.id === 'health_connect' ? 'health_connect' as const : 'healthkit' as const;

      // Take most recent sleep session
      const latestSleep = sleepSessions.length > 0
        ? rawSleepToEntry(
            { ...sleepSessions[sleepSessions.length - 1], restingHeartRate: restingHR ?? undefined },
            source,
          )
        : null;

      // Today's steps (last bucket for today's dateKey)
      const todayKey = new Date().toISOString().split('T')[0];
      const todaySteps = stepBuckets.find((b) => b.dateKey === todayKey) ?? null;
      const stepsEntry = todaySteps ? rawStepsToEntry(todaySteps, source) : null;

      if (!latestSleep && !stepsEntry) {
        setUnavailableReason('no sleep or steps data found for the last 24 hours. check that your tracker has synced to health connect.');
        setPhase('unavailable');
        return;
      }

      setPreview({ sleep: latestSleep, steps: stepsEntry, providerId: provider.id });
      setPhase('confirm');
    } catch (err) {
      console.error('[health] connect/import failed:', err instanceof Error ? err.message : err);
      setUnavailableReason("couldn't reach your health data. make sure health connect is installed and set up, then try again.");
      setPhase('error');
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!preview) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (preview.sleep) upsertSleep(preview.sleep);
    if (preview.steps) upsertSteps(preview.steps);
    setConnected(preview.providerId, ['sleep', 'steps', 'heartRate']);
    setLastSync(new Date().toISOString());
    setPhase('idle');
    setPreview(null);
    onClose();
  }, [preview, upsertSleep, upsertSteps, setConnected, setLastSync, onClose]);

  const handleClose = () => {
    setPhase('idle');
    setPreview(null);
    onClose();
  };

  const isLoading = phase === 'checking' || phase === 'requesting' || phase === 'importing';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.foreground, paddingBottom: insets.bottom + 24 }]}>
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.muted }]} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: F.displayBold, color: colors.foreground }]}>
            connect your tracker
          </Text>
          <Pressable onPress={handleClose} style={[styles.closeBtn, { borderColor: colors.foreground }]}>
            <Feather name="x" size={16} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Loading states */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.violet} />
              <Text style={[styles.loadingText, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
                {phase === 'checking' ? 'checking availability…'
                  : phase === 'requesting' ? 'requesting permissions…'
                  : 'importing your data…'}
              </Text>
            </View>
          )}

          {/* Unavailable / error — same actionable layout */}
          {(phase === 'unavailable' || phase === 'error') && (
            <View style={styles.statusContainer}>
              <Feather name="alert-circle" size={28} color={colors.orange} />
              <Text style={[styles.statusText, { fontFamily: F.bodyMed, color: colors.foreground }]}>
                {unavailableReason}
              </Text>
              {canInstallHc && (
                <BrutalButton label="open health connect" onPress={openHealthConnect} variant="primary" height={48} />
              )}
              <BrutalButton label="close" onPress={handleClose} variant="secondary" height={44} />
            </View>
          )}

          {/* Idle — connect CTA */}
          {phase === 'idle' && (
            <View style={styles.idleContainer}>
              <Text style={[styles.description, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
                import last night's sleep (including stages and resting HR) and today's steps. you'll review everything before anything is saved.
              </Text>
              <BrutalButton
                label="connect + import"
                onPress={handleConnect}
                variant="primary"
                height={52}
              />
            </View>
          )}

          {/* Confirm preview */}
          {phase === 'confirm' && preview && (
            <View style={styles.confirmContainer}>
              <Text style={[styles.confirmTitle, { fontFamily: F.bodySemi, color: colors.foreground }]}>
                review before saving
              </Text>

              {preview.sleep && (
                <BrutalBox style={styles.previewCard}>
                  <Text style={[styles.previewLabel, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>sleep</Text>
                  <Text style={[styles.previewValue, { fontFamily: F.mono, color: colors.foreground }]}>
                    {formatDuration(preview.sleep.durationMin)}
                  </Text>
                  <Text style={[styles.previewSub, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
                    {formatClock(preview.sleep.bedtime)} → {formatClock(preview.sleep.wakeTime)}
                  </Text>
                  {preview.sleep.deepMin !== undefined && (
                    <Text style={[styles.previewSub, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
                      deep {preview.sleep.deepMin}m · rem {preview.sleep.remMin}m · light {preview.sleep.lightMin}m
                    </Text>
                  )}
                  {preview.sleep.restingHeartRate && (
                    <Text style={[styles.previewSub, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
                      resting HR: {preview.sleep.restingHeartRate} bpm
                    </Text>
                  )}
                </BrutalBox>
              )}

              {preview.steps && (
                <BrutalBox style={styles.previewCard}>
                  <Text style={[styles.previewLabel, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>steps today</Text>
                  <Text style={[styles.previewValue, { fontFamily: F.mono, color: colors.foreground }]}>
                    {formatSteps(preview.steps.steps)}
                  </Text>
                  {preview.steps.distanceM && (
                    <Text style={[styles.previewSub, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
                      {(preview.steps.distanceM / 1000).toFixed(1)} km
                    </Text>
                  )}
                </BrutalBox>
              )}

              <View style={styles.confirmButtons}>
                <BrutalButton label="discard" onPress={handleClose} variant="secondary" height={48} style={{ flex: 1 }} />
                <BrutalButton label="save" onPress={handleSave} variant="primary" height={48} style={{ flex: 1 }} />
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: BRUTAL.border,
    borderLeftWidth: BRUTAL.border,
    borderRightWidth: BRUTAL.border,
    paddingTop: 14,
    paddingHorizontal: 20,
    maxHeight: '85%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 20, fontStyle: 'italic', letterSpacing: -0.5 },
  closeBtn: { width: 36, height: 36, borderRadius: BRUTAL.radius, borderWidth: BRUTAL.border, alignItems: 'center', justifyContent: 'center' },
  loadingContainer: { alignItems: 'center', paddingVertical: 40, gap: 16 },
  loadingText: { fontSize: 14 },
  statusContainer: { alignItems: 'center', paddingVertical: 30, gap: 16 },
  statusText: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  idleContainer: { gap: 18, paddingBottom: 8 },
  description: { fontSize: 14, lineHeight: 21 },
  confirmContainer: { gap: 14, paddingBottom: 8 },
  confirmTitle: { fontSize: 15 },
  previewCard: { padding: 16, gap: 4 },
  previewLabel: { fontSize: 12 },
  previewValue: { fontSize: 32, letterSpacing: -1 },
  previewSub: { fontSize: 12 },
  confirmButtons: { flexDirection: 'row', gap: 10 },
});
