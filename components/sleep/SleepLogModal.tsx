import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BrutalButton, BrutalChip, BrutalInput } from '@/components/brutal';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { useColors } from '@/hooks/useColors';
import { SleepEntry } from '@/data/sleep-types';
import { computeDurationMin, formatClock, formatDuration, getTodayKey } from '@/lib/sleep-utils';

interface SleepLogModalProps {
  visible: boolean;
  mode: 'manual' | 'estimate';
  initial?: SleepEntry;
  onClose: () => void;
  onSave: (entry: SleepEntry) => void;
}

const QUALITY_LABELS: Record<number, string> = { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' };

// Representative minute values for quick, honest estimates.
const LATENCY_OPTS = [
  { label: 'instantly', value: 2 },
  { label: '<15m', value: 10 },
  { label: '15–30m', value: 22 },
  { label: '30–60m', value: 45 },
  { label: '60m+', value: 75 },
];

const AWAKE_OPTS = [
  { label: 'none', value: 0 },
  { label: '~15m', value: 15 },
  { label: '~30m', value: 30 },
  { label: '~1h', value: 60 },
  { label: '1h+', value: 90 },
];

function buildDefaultBedtime(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(23, 0, 0, 0);
  return d;
}

function buildDefaultWake(): Date {
  const d = new Date();
  d.setHours(7, 0, 0, 0);
  return d;
}

export function SleepLogModal({ visible, mode, initial, onClose, onSave }: SleepLogModalProps) {
  const colors = useColors();

  const [bedtime, setBedtime] = useState<Date>(
    initial ? new Date(initial.bedtime) : buildDefaultBedtime(),
  );
  const [wakeTime, setWakeTime] = useState<Date>(
    initial ? new Date(initial.wakeTime) : buildDefaultWake(),
  );
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5 | undefined>(initial?.quality);
  const [wakeCount, setWakeCount] = useState<number>(initial?.wakeCount ?? 0);
  const [latencyMin, setLatencyMin] = useState<number>(0);
  const [awakeNightMin, setAwakeNightMin] = useState<number>(initial?.awakeMin ?? 0);
  const [restingHr, setRestingHr] = useState<string>(
    initial?.restingHeartRate ? String(initial.restingHeartRate) : '',
  );
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const [showBedPicker, setShowBedPicker] = useState(Platform.OS === 'ios');
  const [showWakePicker, setShowWakePicker] = useState(Platform.OS === 'ios');

  useEffect(() => {
    if (visible) {
      setBedtime(initial ? new Date(initial.bedtime) : buildDefaultBedtime());
      setWakeTime(initial ? new Date(initial.wakeTime) : buildDefaultWake());
      setQuality(initial?.quality);
      setWakeCount(initial?.wakeCount ?? 0);
      setLatencyMin(0);
      setAwakeNightMin(initial?.awakeMin ?? 0);
      setRestingHr(initial?.restingHeartRate ? String(initial.restingHeartRate) : '');
      setNotes(initial?.notes ?? '');
      setError(null);
      if (Platform.OS === 'android') {
        setShowBedPicker(false);
        setShowWakePicker(false);
      }
    }
  }, [visible, initial]);

  const isManual = mode === 'manual';

  // Total time between bedtime and wake. For manual logs we subtract the time
  // spent awake (latency + mid-night wakefulness) to store *actual* sleep, which
  // is what the recovery engine scores against the 8h target.
  const timeInBedMin = computeDurationMin(bedtime.toISOString(), wakeTime.toISOString());
  const awakeTotalMin = isManual ? latencyMin + awakeNightMin : 0;
  const asleepMin = Math.max(30, timeInBedMin - awakeTotalMin);
  const displayDurationMin = isManual ? asleepMin : timeInBedMin;

  function handleSave() {
    if (timeInBedMin < 60 || timeInBedMin > 16 * 60) {
      setError('time in bed must be between 1h and 16h. check your times.');
      return;
    }
    setError(null);

    const dateKey =
      `${wakeTime.getFullYear()}-` +
      `${String(wakeTime.getMonth() + 1).padStart(2, '0')}-` +
      `${String(wakeTime.getDate()).padStart(2, '0')}`;

    const hrParsed = parseInt(restingHr, 10);
    const validHr = Number.isFinite(hrParsed) && hrParsed >= 30 && hrParsed <= 120;

    const entry: SleepEntry = {
      dateKey,
      bedtime: bedtime.toISOString(),
      wakeTime: wakeTime.toISOString(),
      durationMin: displayDurationMin,
      quality: isManual ? quality : undefined,
      wakeCount: isManual ? wakeCount : undefined,
      awakeMin: isManual && awakeTotalMin > 0 ? awakeTotalMin : undefined,
      restingHeartRate: isManual && validHr ? hrParsed : undefined,
      notes: isManual && notes.trim() ? notes.trim() : undefined,
      source: mode,
    };

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(entry);
    onClose();
  }

  function handleBedChange(_event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShowBedPicker(false);
    if (date) setBedtime(date);
  }

  function handleWakeChange(_event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShowWakePicker(false);
    if (date) setWakeTime(date);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kavWrapper}>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.foreground }]}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.handle, { backgroundColor: colors.muted }]} />

            <Text style={[styles.title, { fontFamily: F.displayBold, color: colors.foreground }]}>
              {isManual ? 'log last night' : 'quick estimate'}
            </Text>

            <Text style={[styles.subline, { fontFamily: F.bodyReg, color: colors.mutedForeground }]}>
              {isManual
                ? 'be honest. accurate sleep makes the recovery ring real.'
                : 'rough is fine. this counts for less but still counts.'}
            </Text>

            <View style={[styles.durationRow, { borderColor: colors.muted, backgroundColor: colors.background }]}>
              <Text style={[styles.durationLabel, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
                {isManual ? 'time asleep' : 'duration'}
              </Text>
              <Text style={[styles.durationValue, { fontFamily: F.monoSemi, color: colors.foreground }]}>
                {formatDuration(displayDurationMin)}
              </Text>
            </View>

            {error && (
              <View style={[styles.errorRow, { borderColor: colors.orange }]}>
                <Feather name="alert-triangle" size={14} color={colors.orange} />
                <Text style={[styles.errorText, { fontFamily: F.bodyMed, color: colors.orange }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* Bedtime picker */}
            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
                went to bed
              </Text>
              {Platform.OS === 'ios' ? (
                <View style={[styles.iosPicker, { borderColor: colors.foreground, backgroundColor: colors.background }]}>
                  <DateTimePicker
                    value={bedtime}
                    mode="time"
                    display="spinner"
                    onChange={handleBedChange}
                    textColor={colors.foreground}
                    style={{ flex: 1 }}
                  />
                </View>
              ) : (
                <Pressable
                  style={[styles.androidTimeRow, { borderColor: colors.foreground, backgroundColor: colors.background }]}
                  onPress={() => setShowBedPicker(true)}
                >
                  <Text style={[styles.androidTimeText, { fontFamily: F.mono, color: colors.foreground }]}>
                    {formatClock(bedtime.toISOString())}
                  </Text>
                  <Feather name="clock" size={16} color={colors.mutedForeground} />
                </Pressable>
              )}
              {showBedPicker && Platform.OS === 'android' && (
                <DateTimePicker value={bedtime} mode="time" display="default" onChange={handleBedChange} />
              )}
            </View>

            {/* Wake time picker */}
            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
                woke up
              </Text>
              {Platform.OS === 'ios' ? (
                <View style={[styles.iosPicker, { borderColor: colors.foreground, backgroundColor: colors.background }]}>
                  <DateTimePicker
                    value={wakeTime}
                    mode="time"
                    display="spinner"
                    onChange={handleWakeChange}
                    textColor={colors.foreground}
                    style={{ flex: 1 }}
                  />
                </View>
              ) : (
                <Pressable
                  style={[styles.androidTimeRow, { borderColor: colors.foreground, backgroundColor: colors.background }]}
                  onPress={() => setShowWakePicker(true)}
                >
                  <Text style={[styles.androidTimeText, { fontFamily: F.mono, color: colors.foreground }]}>
                    {formatClock(wakeTime.toISOString())}
                  </Text>
                  <Feather name="clock" size={16} color={colors.mutedForeground} />
                </Pressable>
              )}
              {showWakePicker && Platform.OS === 'android' && (
                <DateTimePicker value={wakeTime} mode="time" display="default" onChange={handleWakeChange} />
              )}
            </View>

            {/* Manual-only fields */}
            {isManual && (
              <>
                <View style={styles.fieldBlock}>
                  <Text style={[styles.fieldLabel, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
                    sleep quality
                  </Text>
                  <View style={styles.chipsRow}>
                    {([1, 2, 3, 4, 5] as const).map((q) => (
                      <BrutalChip
                        key={q}
                        label={QUALITY_LABELS[q]}
                        selected={quality === q}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setQuality(q);
                        }}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={[styles.fieldLabel, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
                    times woken
                  </Text>
                  <View style={[styles.stepperRow, { borderColor: colors.foreground, backgroundColor: colors.background }]}>
                    <Pressable
                      onPress={() => { Haptics.selectionAsync(); setWakeCount((c) => Math.max(0, c - 1)); }}
                      style={[styles.stepBtn, { borderColor: colors.foreground }]}
                    >
                      <Feather name="minus" size={16} color={colors.foreground} />
                    </Pressable>
                    <Text style={[styles.stepValue, { fontFamily: F.monoSemi, color: colors.foreground }]}>
                      {wakeCount}
                    </Text>
                    <Pressable
                      onPress={() => { Haptics.selectionAsync(); setWakeCount((c) => c + 1); }}
                      style={[styles.stepBtn, { borderColor: colors.foreground }]}
                    >
                      <Feather name="plus" size={16} color={colors.foreground} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={[styles.fieldLabel, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
                    fell asleep in
                  </Text>
                  <View style={styles.chipsRow}>
                    {LATENCY_OPTS.map((o) => (
                      <BrutalChip
                        key={o.value}
                        label={o.label}
                        selected={latencyMin === o.value}
                        onPress={() => { Haptics.selectionAsync(); setLatencyMin(o.value); }}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={[styles.fieldLabel, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
                    awake during the night
                  </Text>
                  <View style={styles.chipsRow}>
                    {AWAKE_OPTS.map((o) => (
                      <BrutalChip
                        key={o.value}
                        label={o.label}
                        selected={awakeNightMin === o.value}
                        onPress={() => { Haptics.selectionAsync(); setAwakeNightMin(o.value); }}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={[styles.fieldLabel, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
                    resting heart rate (optional)
                  </Text>
                  <BrutalInput
                    value={restingHr}
                    onChangeText={setRestingHr}
                    placeholder="e.g. 58"
                    suffix="bpm"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={[styles.fieldLabel, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
                    notes
                  </Text>
                  <BrutalInput value={notes} onChangeText={setNotes} placeholder="anything worth noting..." />
                </View>
              </>
            )}

            <BrutalButton label="save sleep" onPress={handleSave} variant="primary" style={{ marginTop: 8 }} />

            <Pressable onPress={onClose} style={styles.skipBtn}>
              <Text style={[styles.skipText, { fontFamily: F.bodyMed, color: colors.mutedForeground }]}>
                skip for now
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  kavWrapper: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: BRUTAL.radiusLg, borderTopRightRadius: BRUTAL.radiusLg, borderWidth: BRUTAL.border, borderBottomWidth: 0, maxHeight: '90%' },
  content: { padding: 24, gap: 14, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  title: { fontSize: 22, fontStyle: 'italic', letterSpacing: -0.6 },
  subline: { fontSize: 13, lineHeight: 19 },
  durationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, padding: 14 },
  durationLabel: { fontSize: 13 },
  durationValue: { fontSize: 20, letterSpacing: -0.5 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 2, borderRadius: BRUTAL.radius, padding: 10 },
  errorText: { fontSize: 13, flex: 1 },
  fieldBlock: { gap: 8 },
  fieldLabel: { fontSize: 12, textTransform: 'lowercase', letterSpacing: 0.2 },
  iosPicker: { borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, overflow: 'hidden', height: 120 },
  androidTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, paddingHorizontal: 14, paddingVertical: 14 },
  androidTimeText: { fontSize: 16 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius, overflow: 'hidden' },
  stepBtn: { padding: 14, borderRightWidth: 1 },
  stepValue: { flex: 1, textAlign: 'center', fontSize: 18 },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 13 },
});
