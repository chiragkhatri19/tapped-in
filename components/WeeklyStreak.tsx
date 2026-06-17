import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { BrutalBox } from '@/components/brutal';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { useTrackerStore } from '@/stores/tracker-store';

const DAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getWeekKeys(): { key: string; dayLabel: string }[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { key, dayLabel: DAY_SHORT[d.getDay()] };
  });
}

interface Props {
  targetCalories: number;
  onDayPress: (dateKey: string) => void;
}

export default function WeeklyStreak({ targetCalories, onDayPress }: Props) {
  const colors = useColors();
  const dailyLogs = useTrackerStore(s => s.dailyLogs);
  const viewingKey = useTrackerStore(s => s.viewingKey);
  const week = getWeekKeys();
  const todayKey = week[week.length - 1].key;

  let streakCount = 0;
  for (let i = week.length - 1; i >= 0; i--) {
    const log = dailyLogs[week[i].key];
    if (log && log.totalCalories > 0) streakCount++;
    else break;
  }

  const maxCals = Math.max(
    ...week.map(({ key }) => dailyLogs[key]?.totalCalories ?? 0),
    targetCalories, 1,
  );
  const BAR_MAX_H = 48;

  return (
    <BrutalBox style={s.box} offset={BRUTAL.shadow}>
      <View style={s.topRow}>
        <View style={s.titleBlock}>
          <Text style={[s.title, { color: colors.foreground }]}>this week</Text>
          <View style={[s.titleStroke, { backgroundColor: colors.highlight }]} />
        </View>
        {streakCount >= 2 && (
          <View style={[s.streakBadge, { backgroundColor: colors.highlight, borderColor: colors.foreground }]}>
            <Text style={[s.streakTxt, { color: '#111111' }]}>{streakCount} day streak</Text>
          </View>
        )}
      </View>

      <View style={s.days}>
        {week.map(({ key, dayLabel }) => {
          const log = dailyLogs[key];
          const cals = log?.totalCalories ?? 0;
          const isToday    = key === todayKey;
          const isViewing  = key === viewingKey;
          const hasData    = cals > 0;
          const isOver     = hasData && targetCalories > 0 && cals > targetCalories * 1.05;
          const barColor   = isOver ? colors.persimmon : colors.primary;
          const barH       = hasData ? Math.max(4, Math.round((cals / maxCals) * BAR_MAX_H)) : 0;

          return (
            <Pressable key={key} onPress={() => onDayPress(key)} style={s.dayCol}>
              {/* Calorie label above bar */}
              <Text style={[s.dayKcal, {
                color: hasData ? (isOver ? colors.persimmon : colors.mutedForeground) : 'transparent',
                fontSize: 9,
              }]}>
                {cals >= 1000 ? `${(cals / 1000).toFixed(1)}k` : cals > 0 ? String(Math.round(cals)) : '0'}
              </Text>

              {/* Bar track */}
              <View style={[s.barTrack, { borderColor: colors.foreground, backgroundColor: colors.muted }]}>
                {hasData && (
                  <View style={[s.barFill, {
                    height: barH,
                    backgroundColor: isViewing ? barColor : barColor + '60',
                  }]} />
                )}
              </View>

              {/* Day label dot */}
              <View style={[s.dayDot, {
                backgroundColor: isToday ? colors.primary
                  : isViewing ? colors.foreground
                  : 'transparent',
              }]} />

              <Text style={[s.dayLabel, {
                color: isToday ? colors.primary
                  : isViewing ? colors.foreground
                  : colors.mutedForeground,
                fontFamily: (isToday || isViewing) ? F.bodyBold : F.bodyReg,
              }]}>
                {dayLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </BrutalBox>
  );
}

const s = StyleSheet.create({
  box: { padding: 16, marginHorizontal: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontFamily: F.displayBold, fontSize: 16, fontStyle: 'italic' },
  streakBadge: { borderWidth: 2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BRUTAL.radiusPill },
  streakTxt: { fontFamily: F.monoSemi, fontSize: 11 },
  titleBlock: { gap: 2 },
  titleStroke: { height: 3, width: 40, borderRadius: 2 },
  days: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 4 },
  dayCol: { flex: 1, alignItems: 'center', gap: 4 },
  dayKcal: { fontFamily: F.mono },
  barTrack: { width: '85%', height: 48, borderRadius: 2, borderWidth: 2, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%' },
  dayDot: { width: 6, height: 6, borderRadius: BRUTAL.radiusPill },
  dayLabel: { fontSize: 10 },
});
