/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { withAlpha } from '@/constants/colors';
import { muscleColor } from '@/constants/muscles';
import { BrutalBox, BrutalButton } from '@/components/brutal';
import { SectionLabel } from '@/components/workout/ui';
import { storageAsyncCompat as AsyncStorage } from '@/lib/storage';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

interface Props {
  log: any;
  topPad: number;
  bottomPad: number;
  onBack: () => void;
}

export default function SessionLogDetail({ log, topPad, bottomPad, onBack }: Props) {
  const colors = useColors();
  const [showCompare, setShowCompare] = useState(false);
  const [prevLog, setPrevLog] = useState<any>(null);

  useEffect(() => { loadPrevious(); }, []);

  async function loadPrevious() {
    const raw = await AsyncStorage.getItem('tapped_in_workout_logs');
    if (!raw) return;
    const logs: any[] = JSON.parse(raw);
    const same = logs.filter(l => l.sessionName === log.sessionName && l.date !== log.date && !l.skipped);
    if (same.length > 0) {
      setPrevLog(same.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]);
    }
  }

  const stats = [
    { label: 'duration', val: log.durationMinutes != null ? `${log.durationMinutes} min` : '-' },
    { label: 'sets', val: log.totalSets != null ? String(log.totalSets) : '-' },
    { label: 'volume', val: log.totalVolume ? `${log.totalVolume.toLocaleString()} kg` : '-' },
    { label: 'prs', val: String((log.prsAchieved ?? []).length) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingTop: topPad + 8, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: BRUTAL.border, borderBottomColor: colors.foreground }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={onBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ width: 36, height: 36, borderWidth: BRUTAL.border, borderColor: colors.foreground, borderRadius: BRUTAL.radius, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="arrow-left" size={16} color={colors.foreground} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.bodySemi, fontSize: 16, color: colors.foreground }}>{log.sessionName}</Text>
            <Text style={{ fontFamily: F.mono, fontSize: 11, color: colors.mutedForeground, marginTop: 1 }}>{formatDate(log.date)}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 40 }}>
        {/* Stat tiles */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {stats.map(t => (
            <BrutalBox key={t.label} style={{ padding: 14, width: '47%', alignItems: 'center' }}>
              <Text style={{ fontFamily: F.monoSemi, fontSize: 22, color: colors.foreground }}>{t.val}</Text>
              <Text style={{ fontFamily: F.mono, fontSize: 10, color: colors.mutedForeground, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {t.label}
              </Text>
            </BrutalBox>
          ))}
        </View>

        {/* PRs */}
        {(log.prsAchieved ?? []).length > 0 && (
          <BrutalBox style={{ padding: 12, marginBottom: 20 }}>
            {log.prsAchieved.map((pr: any, i: number) => (
              <Text key={i} style={{ fontFamily: F.bodySemi, fontSize: 13, color: colors.highlight, lineHeight: 22 }}>
                {pr.exerciseName} · {pr.type}: {pr.newValue}
              </Text>
            ))}
          </BrutalBox>
        )}

        {/* Exercises */}
        {(log.exercises ?? []).map((ex: any) => (
          <View key={ex.exerciseName} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Text style={{ fontFamily: F.bodySemi, fontSize: 16, color: colors.foreground, flex: 1 }}>
                {ex.exerciseName}
              </Text>
              {ex.muscleGroup && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BRUTAL.radius, borderWidth: 1, borderColor: withAlpha(muscleColor(ex.muscleGroup), 0.65), backgroundColor: withAlpha(muscleColor(ex.muscleGroup), 0.13) }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: muscleColor(ex.muscleGroup) }} />
                  <Text style={{ fontFamily: F.mono, fontSize: 10, color: colors.foreground }}>{ex.muscleGroup}</Text>
                </View>
              )}
            </View>

            {/* Set table */}
            <BrutalBox style={{ overflow: 'hidden', padding: 0 }}>
              {/* Table header */}
              <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.muted, borderBottomWidth: 1, borderBottomColor: withAlpha(colors.foreground, 0.19) }}>
                {['Set', 'kg', 'Reps', 'Vol', 'RPE'].map((h, i) => (
                  <Text
                    key={h}
                    style={{ flex: i === 0 ? 0.6 : 1, fontFamily: F.monoSemi, fontSize: 10, color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {h}
                  </Text>
                ))}
              </View>

              {/* Set rows */}
              {(ex.sets ?? []).map((set: any, i: number) => {
                const vol = (set.weightKg ?? 0) * (set.reps ?? 0);
                const isLast = i === (ex.sets ?? []).length - 1;
                return (
                  <View
                    key={i}
                    style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: withAlpha(colors.foreground, 0.07), opacity: set.isWarmup ? 0.55 : 1 }}>
                    <Text style={{ flex: 0.6, fontFamily: F.monoSemi, fontSize: 13, color: set.isPR ? colors.highlight : colors.foreground }}>
                      {set.isWarmup ? 'W' : set.setNumber}
                    </Text>
                    <Text style={{ flex: 1, fontFamily: F.mono, fontSize: 13, color: colors.foreground }}>{set.weightKg ?? '-'}</Text>
                    <Text style={{ flex: 1, fontFamily: F.mono, fontSize: 13, color: colors.foreground }}>{set.reps ?? '-'}</Text>
                    <Text style={{ flex: 1, fontFamily: F.mono, fontSize: 13, color: colors.foreground }}>{vol > 0 ? vol : '-'}</Text>
                    <Text style={{ flex: 1, fontFamily: F.mono, fontSize: 13, color: colors.mutedForeground }}>{set.rpe ?? '-'}</Text>
                  </View>
                );
              })}

              {/* Total row */}
              {ex.totalVolume > 0 && (
                <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.muted, borderTopWidth: 1, borderTopColor: withAlpha(colors.foreground, 0.19) }}>
                  <Text style={{ flex: 0.6, fontFamily: F.monoSemi, fontSize: 10, color: colors.mutedForeground, textTransform: 'uppercase' }}>TOT</Text>
                  <View style={{ flex: 3 }} />
                  <Text style={{ flex: 1, fontFamily: F.monoSemi, fontSize: 13, color: colors.violet }}>{ex.totalVolume} kg</Text>
                </View>
              )}
            </BrutalBox>

            {ex.notes ? (
              <Text style={{ fontFamily: F.bodyReg, fontSize: 13, color: colors.mutedForeground, fontStyle: 'italic', marginTop: 8 }}>
                {ex.notes}
              </Text>
            ) : null}
          </View>
        ))}

        {/* Check-in summary */}
        {(log.feelingRating != null || log.energyLevel != null || log.sleepLastNight != null) && (
          <BrutalBox style={{ padding: 14, marginBottom: 20 }}>
            <SectionLabel style={{ marginBottom: 10 }}>SESSION CHECK-IN</SectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {log.feelingRating != null && (
                <Text style={{ fontFamily: F.bodyReg, fontSize: 13, color: colors.mutedForeground }}>
                  feeling{' '}
                  <Text style={{ fontFamily: F.monoSemi, color: colors.foreground }}>{log.feelingRating}/5</Text>
                </Text>
              )}
              {log.energyLevel != null && (
                <Text style={{ fontFamily: F.bodyReg, fontSize: 13, color: colors.mutedForeground }}>
                  energy{' '}
                  <Text style={{ fontFamily: F.monoSemi, color: colors.foreground }}>{log.energyLevel}/5</Text>
                </Text>
              )}
              {log.sleepLastNight != null && (
                <Text style={{ fontFamily: F.bodyReg, fontSize: 13, color: colors.mutedForeground }}>
                  sleep{' '}
                  <Text style={{ fontFamily: F.monoSemi, color: colors.foreground }}>{log.sleepLastNight}h</Text>
                </Text>
              )}
            </View>
            {log.notes ? (
              <Text style={{ fontFamily: F.bodyReg, fontSize: 13, color: colors.mutedForeground, fontStyle: 'italic', marginTop: 8 }}>
                {log.notes}
              </Text>
            ) : null}
            {/* Cardio check-in */}
            {log.cardioCompleted != null && (
              <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: withAlpha(colors.foreground, 0.1) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontFamily: F.bodyReg, fontSize: 13, color: colors.mutedForeground }}>cardio</Text>
                  <Text style={{ fontFamily: F.monoSemi, fontSize: 13, color: log.cardioCompleted ? colors.teal : colors.persimmon }}>
                    {log.cardioCompleted ? 'done' : 'skipped'}
                  </Text>
                  {log.cardioCompleted && log.cardioMinutes != null && (
                    <Text style={{ fontFamily: F.mono, fontSize: 12, color: colors.mutedForeground }}>
                      · {log.cardioMinutes} min
                    </Text>
                  )}
                  {log.cardioCompleted && log.cardioModality && (
                    <Text style={{ fontFamily: F.mono, fontSize: 12, color: colors.mutedForeground }}>
                      · {log.cardioModality}
                    </Text>
                  )}
                  {log.cardioCompleted && log.cardioAvgHR != null && (
                    <Text style={{ fontFamily: F.mono, fontSize: 12, color: colors.orange }}>
                      · {log.cardioAvgHR} BPM avg
                    </Text>
                  )}
                </View>
              </View>
            )}
          </BrutalBox>
        )}

        {/* Compare with previous */}
        {prevLog && (
          <>
            <BrutalButton
              label={showCompare ? 'hide comparison' : 'compare with previous session'}
              variant="secondary"
              height={44}
              style={{ marginBottom: 12 }}
              onPress={() => setShowCompare(!showCompare)}
            />
            {showCompare && (
              <BrutalBox style={{ overflow: 'hidden', padding: 0, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.muted, borderBottomWidth: 1, borderBottomColor: withAlpha(colors.foreground, 0.19) }}>
                  <Text style={{ flex: 2, fontFamily: F.monoSemi, fontSize: 10, color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.5 }}>EXERCISE</Text>
                  <Text style={{ flex: 1, fontFamily: F.monoSemi, fontSize: 10, color: colors.mutedForeground, textTransform: 'uppercase' }}>{formatDate(prevLog.date).slice(0, 6)}</Text>
                  <Text style={{ flex: 1, fontFamily: F.monoSemi, fontSize: 10, color: colors.mutedForeground, textTransform: 'uppercase' }}>{formatDate(log.date).slice(0, 6)}</Text>
                  <Text style={{ flex: 1, fontFamily: F.monoSemi, fontSize: 10, color: colors.mutedForeground, textTransform: 'uppercase' }}>CHG</Text>
                </View>
                {(log.exercises ?? []).map((ex: any, i: number) => {
                  const prev = (prevLog.exercises ?? []).find((e: any) => e.exerciseName === ex.exerciseName);
                  const diff = prev ? ex.totalVolume - prev.totalVolume : null;
                  const pct = prev && prev.totalVolume > 0 ? Math.round((diff! / prev.totalVolume) * 100) : null;
                  const isLast = i === (log.exercises ?? []).length - 1;
                  return (
                    <View
                      key={ex.exerciseName}
                      style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: withAlpha(colors.foreground, 0.06) }}>
                      <Text style={{ flex: 2, fontFamily: F.bodyReg, fontSize: 12, color: colors.foreground }} numberOfLines={1}>
                        {ex.exerciseName}
                      </Text>
                      <Text style={{ flex: 1, fontFamily: F.mono, fontSize: 12, color: colors.mutedForeground }}>{prev ? prev.totalVolume : '-'}</Text>
                      <Text style={{ flex: 1, fontFamily: F.mono, fontSize: 12, color: colors.foreground }}>{ex.totalVolume}</Text>
                      <Text style={{ flex: 1, fontFamily: F.monoSemi, fontSize: 12, color: pct == null ? colors.mutedForeground : pct >= 0 ? colors.teal : colors.persimmon }}>
                        {pct == null ? '-' : `${pct >= 0 ? '+' : ''}${pct}%`}
                      </Text>
                    </View>
                  );
                })}
              </BrutalBox>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
