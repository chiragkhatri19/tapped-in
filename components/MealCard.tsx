import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { BrutalShadow } from '@/components/brutal';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { LoggedMeal, MEAL_TYPE_LABELS, OIL_DATA } from '@/data/tracker-types';

const OIL_ORANGE = '#F97316';

interface Props { meal: LoggedMeal; onDelete: (id: string) => void; }

export default function MealCard({ meal, onDelete }: Props) {
  const colors = useColors();
  const swipeRef = useRef<Swipeable>(null);
  const [expanded, setExpanded] = useState(false);

  function confirmDelete() {
    swipeRef.current?.close();
    if (Platform.OS === 'web') { onDelete(meal.id); return; }
    Alert.alert('delete meal?', `remove "${meal.name}"?`, [
      { text: 'cancel', style: 'cancel', onPress: () => swipeRef.current?.close() },
      { text: 'delete', style: 'destructive', onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); onDelete(meal.id); } },
    ]);
  }

  function renderRightActions(_: unknown, dragX: Animated.AnimatedInterpolation<number>) {
    const opacity = dragX.interpolate({ inputRange: [-80, -40], outputRange: [1, 0], extrapolate: 'clamp' });
    return (
      <Animated.View style={[s.deleteAction, { backgroundColor: colors.persimmon, opacity }]}>
        <Feather name="trash-2" size={20} color="#FFFFFF" />
        <Text style={s.deleteActionText}>delete</Text>
      </Animated.View>
    );
  }

  const timeStr = new Date(meal.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const hasOil = !!meal.oilEntry;

  return (
    <BrutalShadow
      offset={BRUTAL.shadowSm}
      style={s.wrapper}
    >
      <Swipeable
        ref={swipeRef}
        renderRightActions={renderRightActions}
        onSwipeableOpen={confirmDelete}
        rightThreshold={60}
        friction={2}
        overshootRight={false}
      >
        <Pressable
          onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); setExpanded(v => !v); }}
          style={[s.card, { backgroundColor: colors.card, borderColor: colors.foreground }]}
        >
          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={[s.typeDot, { backgroundColor: colors.primary, borderColor: colors.foreground }]} />
              <View style={s.headerText}>
                <Text style={[s.name, { color: colors.foreground }]} numberOfLines={1}>{meal.name}</Text>
                <View style={s.metaRow}>
                  <Text style={[s.meta, { color: colors.mutedForeground }]}>
                    {MEAL_TYPE_LABELS[meal.mealType].toLowerCase()} · {timeStr}
                  </Text>
                  {meal.logMethod === 'ai_scan' && (
                    <View style={[s.aiBadge, { backgroundColor: colors.violet }]}>
                      <Text style={[s.aiBadgeText, { color: '#FFFFFF' }]}>AI</Text>
                    </View>
                  )}
                  {hasOil && (
                    <View style={[s.oilBadge, { borderColor: OIL_ORANGE }]}>
                      <Text style={[s.oilBadgeText, { color: OIL_ORANGE }]}>oil</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={s.headerRight}>
              <Text style={[s.calories, { color: colors.foreground }]}>{Math.round(meal.totalCalories)}</Text>
              <Text style={[s.calUnit, { color: colors.mutedForeground }]}>kcal</Text>
            </View>
          </View>

          {/* Macro chips */}
          <View style={s.macroRow}>
            <MacroChip label="P" value={meal.totalProteinG} accent={colors.blue}   colors={colors} />
            <MacroChip label="C" value={meal.totalCarbsG}  accent={colors.orange} colors={colors} />
            <MacroChip label="F" value={meal.totalFatG}    accent={colors.pink}   colors={colors} />
          </View>

          {/* Expanded ingredient detail */}
          {expanded && (
            <View style={[s.detail, { borderTopColor: colors.foreground }]}>
              {meal.ingredients.map((ing, i) => (
                <View key={i} style={[s.ingRow, i > 0 && { borderTopColor: colors.muted, borderTopWidth: 1 }]}>
                  <Text style={[s.ingName, { color: colors.foreground }]}>{ing.name}</Text>
                  <Text style={[s.ingMeta, { color: colors.mutedForeground }]}>
                    {ing.weightGrams}g · {Math.round(ing.calories)} kcal
                  </Text>
                </View>
              ))}
              {meal.oilEntry && (
                <View style={[s.ingRow, { borderTopColor: colors.muted, borderTopWidth: 1 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[s.oilDot, { backgroundColor: OIL_ORANGE }]} />
                    <Text style={[s.ingName, { color: OIL_ORANGE }]}>
                      {OIL_DATA[meal.oilEntry.oilType]?.label ?? 'oil'} {meal.oilEntry.weightGrams}g
                    </Text>
                  </View>
                  <Text style={[s.ingMeta, { color: colors.mutedForeground }]}>+{Math.round(meal.oilEntry.calories)} kcal</Text>
                </View>
              )}
              <Pressable onPress={confirmDelete} style={s.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="trash-2" size={14} color={colors.persimmon} />
                <Text style={[s.deleteTxt, { color: colors.persimmon }]}>delete</Text>
              </Pressable>
            </View>
          )}

          {/* Expand chevron */}
          <View style={s.chevronRow}>
            <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.mutedForeground} />
          </View>
        </Pressable>
      </Swipeable>
    </BrutalShadow>
  );
}

function MacroChip({ label, value, accent, colors }: {
  label: string; value: number; accent: string; colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[s.chip, { borderColor: colors.foreground, backgroundColor: colors.background }]}>
      <View style={[s.chipDot, { backgroundColor: accent }]} />
      <Text style={[s.chipLabel, { color: colors.foreground }]}>{label}</Text>
      <Text style={[s.chipVal, { color: colors.mutedForeground }]}>{Math.round(value)}g</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { marginHorizontal: 20, marginBottom: 14 },
  card: {
    borderRadius: BRUTAL.radius,
    borderWidth: BRUTAL.border,
    padding: 14,
    backgroundColor: 'transparent',
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  typeDot: { width: 12, height: 12, borderWidth: 2, marginTop: 4, flexShrink: 0, borderRadius: BRUTAL.radiusPill },
  headerText: { flex: 1 },
  name: { fontFamily: F.bodyBold, fontSize: 15, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' },
  meta: { fontFamily: F.bodyReg, fontSize: 12 },
  aiBadge: { borderRadius: BRUTAL.radiusPill, paddingHorizontal: 6, paddingVertical: 2 },
  aiBadgeText: { fontFamily: F.monoSemi, fontSize: 9, letterSpacing: 0.5 },
  oilBadge: { borderWidth: 1.5, borderRadius: BRUTAL.radiusPill, paddingHorizontal: 6, paddingVertical: 2 },
  oilBadgeText: { fontFamily: F.monoSemi, fontSize: 9 },
  headerRight: { alignItems: 'flex-end' },
  calories: { fontFamily: F.monoSemi, fontSize: 20, letterSpacing: -0.5 },
  calUnit: { fontFamily: F.mono, fontSize: 11 },
  macroRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: BRUTAL.radiusPill, borderWidth: 2 },
  chipDot: { width: 8, height: 8, borderRadius: BRUTAL.radiusPill },
  chipLabel: { fontFamily: F.bodyBold, fontSize: 11 },
  chipVal: { fontFamily: F.monoMed, fontSize: 12 },
  detail: { borderTopWidth: 2, marginTop: 12, paddingTop: 10 },
  ingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 },
  ingName: { fontFamily: F.bodyReg, fontSize: 13, flex: 1 },
  ingMeta: { fontFamily: F.mono, fontSize: 12 },
  oilDot: { width: 8, height: 8, borderRadius: BRUTAL.radiusPill },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', marginTop: 10, padding: 4 },
  deleteTxt: { fontFamily: F.bodyBold, fontSize: 13 },
  chevronRow: { alignItems: 'center', marginTop: 8 },
  deleteAction: {
    width: 72, marginRight: 20, marginBottom: 14,
    borderRadius: BRUTAL.radius,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  deleteActionText: { fontFamily: F.bodyBold, fontSize: 12, color: '#FFFFFF' },
});
