/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { withAlpha } from '@/constants/colors';
import { BrutalBox } from '@/components/brutal';
import { SectionLabel } from '@/components/workout/ui';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function monthLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

interface Props {
  logs: any[];
  topPad: number;
  bottomPad: number;
  onBack: () => void;
  onViewLog: (log: any) => void;
}

export default function WorkoutHistoryScreen({ logs, topPad, bottomPad, onBack, onViewLog }: Props) {
  const colors = useColors();
  const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const completed = sorted.filter((l: any) => !l.skipped);

  const grouped: Record<string, any[]> = {};
  for (let i = 0; i < sorted.length; i++) {
    const log = sorted[i];
    const key = monthLabel(log.date);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(log);
  }

  const totalSessions = completed.length;
  const totalVolume = completed.reduce((a: number, l: any) => a + (l.totalVolume ?? 0), 0);

  let bestStreak = 0, currentStreak = 0;
  const logDates = new Set(completed.map((l: any) => l.date));
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (logDates.has(k)) { currentStreak++; bestStreak = Math.max(bestStreak, currentStreak); }
    else currentStreak = 0;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingTop: topPad + 8, paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={onBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ width: 36, height: 36, borderWidth: BRUTAL.border, borderColor: colors.foreground, borderRadius: BRUTAL.radius, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="arrow-left" size={16} color={colors.foreground} />
          </Pressable>
          <Text style={{ fontFamily: F.displayBold, fontSize: 28, fontStyle: 'italic', letterSpacing: -0.5, color: colors.foreground }}>
            history.
          </Text>
        </View>
      </View>

      {/* Summary stats */}
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <BrutalBox style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row' }}>
            {[
              { label: 'sessions', val: String(totalSessions) },
              { label: 'best streak', val: `${bestStreak}d` },
              { label: 'total vol', val: totalVolume > 0 ? `${Math.round(totalVolume / 1000)}k kg` : '-' },
            ].map((t, i) => (
              <View
                key={t.label}
                style={{ flex: 1, alignItems: 'center', borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: withAlpha(colors.foreground, 0.12) }}>
                <Text style={{ fontFamily: F.monoSemi, fontSize: 22, color: colors.foreground }}>{t.val}</Text>
                <Text style={{ fontFamily: F.mono, fontSize: 10, color: colors.mutedForeground, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {t.label}
                </Text>
              </View>
            ))}
          </View>
        </BrutalBox>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 40 }}>
        {Object.keys(grouped).length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontFamily: F.displayBold, fontSize: 32, fontStyle: 'italic', color: colors.foreground }}>
              nothing yet.
            </Text>
            <Text style={{ fontFamily: F.bodyReg, fontSize: 14, color: colors.mutedForeground, marginTop: 8, textAlign: 'center' }}>
              start a workout to see your history here
            </Text>
          </View>
        ) : (
          Object.entries(grouped).map(([month, entries]) => (
            <View key={month}>
              <SectionLabel style={{ marginBottom: 8, marginTop: 20 }}>{month}</SectionLabel>
              {entries.map((log: any) => (
                <Pressable
                  key={log.id ?? log.date + log.sessionName}
                  onPress={() => !log.skipped && onViewLog(log)}
                  style={{ marginBottom: 10, opacity: log.skipped ? 0.5 : 1 }}>
                  <BrutalBox style={{ padding: 14 }}>
                    {log.skipped ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontFamily: F.bodySemi, fontSize: 14, color: colors.mutedForeground, textDecorationLine: 'line-through', flex: 1 }}>
                          {log.sessionName}
                        </Text>
                        <View style={{ backgroundColor: colors.muted, borderWidth: BRUTAL.borderThin, borderColor: colors.foreground, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BRUTAL.radius }}>
                          <Text style={{ fontFamily: F.monoSemi, fontSize: 10, color: colors.persimmon, letterSpacing: 0.5 }}>SKIPPED</Text>
                        </View>
                      </View>
                    ) : (
                      <>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={{ fontFamily: F.bodySemi, fontSize: 15, color: colors.foreground, flex: 1 }}>
                            {log.sessionName}
                          </Text>
                          <Text style={{ fontFamily: F.mono, fontSize: 11, color: colors.mutedForeground }}>
                            {formatDate(log.date)}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
                          {log.durationMinutes != null && (
                            <Text style={{ fontFamily: F.bodyReg, fontSize: 12, color: colors.mutedForeground }}>
                              <Text style={{ fontFamily: F.monoSemi, color: colors.foreground }}>{log.durationMinutes}</Text> min
                            </Text>
                          )}
                          {log.totalSets != null && log.totalSets > 0 && (
                            <Text style={{ fontFamily: F.bodyReg, fontSize: 12, color: colors.mutedForeground }}>
                              <Text style={{ fontFamily: F.monoSemi, color: colors.foreground }}>{log.totalSets}</Text> sets
                            </Text>
                          )}
                          {log.totalVolume != null && log.totalVolume > 0 && (
                            <Text style={{ fontFamily: F.bodyReg, fontSize: 12, color: colors.mutedForeground }}>
                              <Text style={{ fontFamily: F.monoSemi, color: colors.foreground }}>{log.totalVolume.toLocaleString()}</Text> kg
                            </Text>
                          )}
                          {(log.prsAchieved ?? []).length > 0 && (
                            <Text style={{ fontFamily: F.monoSemi, fontSize: 12, color: colors.highlight }}>
                              {log.prsAchieved.length} PR{log.prsAchieved.length > 1 ? 's' : ''}
                            </Text>
                          )}
                        </View>
                        {/* Bottom row: feeling dots + cardio badge */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                          {log.feelingRating != null && (
                            <View style={{ flexDirection: 'row', gap: 4 }}>
                              {Array.from({ length: 5 }, (_, idx) => (
                                <View
                                  key={idx}
                                  style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: idx < log.feelingRating ? colors.violet : colors.muted, borderWidth: 1, borderColor: withAlpha(colors.foreground, 0.19) }}
                                />
                              ))}
                            </View>
                          )}
                          {log.cardioCompleted && log.cardioMinutes != null && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Feather name="activity" size={10} color={colors.orange} />
                              <Text style={{ fontFamily: F.mono, fontSize: 10, color: colors.orange }}>
                                {log.cardioMinutes} min cardio
                              </Text>
                            </View>
                          )}
                        </View>
                      </>
                    )}
                  </BrutalBox>
                </Pressable>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
