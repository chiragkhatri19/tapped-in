import React, { useMemo, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { BrutalBox } from '@/components/brutal';
import { getTodayKey, useTrackerStore } from '@/stores/tracker-store';
import { useHydrationStore } from '@/stores/hydration-store';
import { useProfile } from '@/stores/profile-store';
import { computeHydrationTarget } from '@/lib/hydration-engine';
import { cancelRemainingRemindersToday } from '@/lib/hydration-notifications';

const MAX_DISPLAY_GLASSES = 10;

interface WaterCardProps {
  variant: 'home' | 'tracker';
  isToday: boolean;
}

export function WaterCard({ variant, isToday }: WaterCardProps) {
  const colors = useColors();
  const { profile } = useProfile();
  const { settings } = useHydrationStore();
  const reminderEntries = useHydrationStore(s => s.reminderEntries);
  const viewingKey = useTrackerStore(s => s.viewingKey);
  const dateKey = isToday ? getTodayKey() : viewingKey;
  const waterMl = useTrackerStore(s => s.dailyLogs[dateKey]?.waterMl ?? 0);
  const addWater = useTrackerStore(s => s.addWater);
  const setWater = useTrackerStore(s => s.setWater);

  const targetMl = useMemo(() => {
    if (settings.dailyTargetOverrideMl) return settings.dailyTargetOverrideMl;
    if (!profile) return 2500;
    return computeHydrationTarget(profile, { hotClimate: settings.hotClimate }).targetDrinkMl;
  }, [settings.dailyTargetOverrideMl, settings.hotClimate, profile]);

  const { glassSizeMl } = settings;
  const targetGlasses = Math.ceil(targetMl / glassSizeMl);
  const fullGlasses = Math.floor(waterMl / glassSizeMl);
  const remainder = waterMl % glassSizeMl;
  const hasHalf = remainder >= glassSizeMl / 2;
  const totalFilled = fullGlasses + (hasHalf ? 1 : 0);
  const displayCount = Math.min(Math.max(targetGlasses, fullGlasses + 1), MAX_DISPLAY_GLASSES);
  const met = waterMl >= targetMl && targetMl > 0;
  const pct = targetMl > 0 ? Math.min(1, waterMl / targetMl) : 0;
  const litres = (waterMl / 1000).toFixed(1);
  const targetL = (targetMl / 1000).toFixed(1);

  const haptic = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const heavyHaptic = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const handleTap = useCallback((index: number) => {
    if (!isToday) return;
    const lastFilledIndex = hasHalf ? fullGlasses : fullGlasses - 1;
    if (index <= lastFilledIndex) {
      // tap on a filled glass - only the last one removes
      if (index === lastFilledIndex) {
        haptic();
        const removeAmt = hasHalf ? Math.round(glassSizeMl / 2) : glassSizeMl;
        addWater(-removeAmt, dateKey);
      }
    } else {
      // tap on empty glass - add one
      haptic();
      addWater(glassSizeMl, dateKey);
      // cancel remaining reminders when target is met
      const newTotal = waterMl + glassSizeMl;
      if (newTotal >= targetMl && reminderEntries.length > 0) {
        cancelRemainingRemindersToday(reminderEntries).catch(() => {});
      }
    }
  }, [isToday, hasHalf, fullGlasses, haptic, glassSizeMl, addWater, dateKey, waterMl, targetMl, reminderEntries]);

  const handleLongPress = useCallback(() => {
    if (!isToday) return;
    heavyHaptic();
    if (remainder === 0) {
      // at full boundary -> add half
      addWater(Math.round(glassSizeMl / 2), dateKey);
    } else {
      // remove fractional remainder -> snap down to nearest full glass
      setWater(fullGlasses * glassSizeMl, dateKey);
    }
  }, [isToday, heavyHaptic, remainder, glassSizeMl, addWater, dateKey, fullGlasses, setWater]);

  const glasses = Array.from({ length: displayCount }, (_, i) => {
    const isFull = i < fullGlasses;
    const isHalfFilled = !isFull && i === fullGlasses && hasHalf;
    const isOverflow = i >= targetGlasses;
    const isFilled = isFull || isHalfFilled;
    return { index: i, isFull, isHalfFilled, isOverflow, isFilled };
  });

  const WATER_BLUE = '#7DD3FC';
  const WATER_TEAL = '#38BDF8';

  const isCompact = variant === 'home';

  return (
    <BrutalBox style={isCompact ? s.boxCompact : s.box} offset={BRUTAL.shadow}>
      {/* Header row */}
      <View style={s.topRow}>
        <View style={s.titleGroup}>
          <Text style={[s.title, { color: colors.mutedForeground }]}>WATER</Text>
          <View style={s.amountRow}>
            <Text style={[s.amount, { color: met ? colors.teal : colors.foreground }]}>
              {litres}
            </Text>
            <Text style={[s.unit, { color: colors.mutedForeground }]}>
              L / {targetL}L
            </Text>
          </View>
        </View>
        {met && (
          <View style={[s.metBadge, { backgroundColor: colors.teal, borderColor: colors.foreground }]}>
            <Text style={[s.metTxt, { color: '#111111' }]}>target met</Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View style={[s.barBg, { borderColor: colors.foreground, backgroundColor: colors.muted }]}>
        <View
          style={[
            s.barFill,
            { width: `${pct * 100}%`, backgroundColor: met ? WATER_TEAL : WATER_BLUE },
          ]}
        />
      </View>

      {/* Glass row */}
      <Pressable onLongPress={handleLongPress} delayLongPress={400} style={s.glassRow}>
        {glasses.map(({ index, isFull, isHalfFilled, isOverflow, isFilled }) => {
          const fillColor = isOverflow ? WATER_TEAL : WATER_BLUE;
          return (
            <Pressable
              key={index}
              onPress={() => handleTap(index)}
              disabled={!isToday}
              style={({ pressed }) => [
                s.glass,
                {
                  borderColor: colors.foreground,
                  backgroundColor: isFilled && !isHalfFilled
                    ? fillColor
                    : colors.muted,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              {isHalfFilled && (
                <View
                  style={[
                    s.halfFill,
                    { backgroundColor: fillColor },
                  ]}
                />
              )}
            </Pressable>
          );
        })}

        {/* Show "+N" indicator when glasses overflow the display cap */}
        {totalFilled > MAX_DISPLAY_GLASSES && (
          <View style={[s.overflowBadge, { backgroundColor: colors.teal, borderColor: colors.foreground }]}>
            <Text style={[s.overflowTxt, { color: '#111111' }]}>+{totalFilled - MAX_DISPLAY_GLASSES}</Text>
          </View>
        )}
      </Pressable>

      {/* Quick +/- buttons — both variants */}
      {isToday && (
        <View style={s.quickRow}>
          <Pressable
            onPress={() => { haptic(); addWater(-glassSizeMl, dateKey); }}
            style={({ pressed }) => [s.quickBtn, { borderColor: colors.foreground, backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[s.quickBtnTxt, { color: colors.foreground }]}>−</Text>
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[s.quickMl, { color: colors.mutedForeground }]}>{glassSizeMl} ml / glass</Text>
          </View>
          <Pressable
            onPress={() => {
              haptic();
              addWater(glassSizeMl, dateKey);
              const newTotal = waterMl + glassSizeMl;
              if (newTotal >= targetMl && reminderEntries.length > 0) {
                cancelRemainingRemindersToday(reminderEntries).catch(() => {});
              }
            }}
            style={({ pressed }) => [s.quickBtn, { borderColor: colors.foreground, backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[s.quickBtnTxt, { color: colors.primaryForeground }]}>+</Text>
          </Pressable>
        </View>
      )}

      {/* Glass size chips — tracker variant only */}
      {!isCompact && isToday && (
        <View style={s.presetsRow}>
          <Text style={[s.presetsLabel, { color: colors.mutedForeground }]}>glass size</Text>
          {settings.presets.map(ml => (
            <Pressable
              key={ml}
              onPress={() => useHydrationStore.getState().updateSettings({ glassSizeMl: ml })}
              style={({ pressed }) => [
                s.presetChip,
                {
                  backgroundColor: ml === glassSizeMl ? colors.primary : colors.card,
                  borderColor: colors.foreground,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[s.presetTxt, { color: ml === glassSizeMl ? colors.primaryForeground : colors.foreground }]}>
                {ml}ml
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Long-press hint */}
      {isToday && !isCompact && (
        <Text style={[s.hint, { color: colors.mutedForeground }]}>
          tap glass to add/remove - long press to toggle half glass
        </Text>
      )}
    </BrutalBox>
  );
}

const s = StyleSheet.create({
  box: { padding: 16, marginHorizontal: 20, gap: 12 },
  boxCompact: { padding: 14, gap: 10 },

  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  titleGroup: { gap: 2 },
  title: { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 1 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  amount: { fontFamily: F.monoSemi, fontSize: 32, letterSpacing: -1, lineHeight: 36 },
  unit: { fontFamily: F.mono, fontSize: 14 },
  metBadge: { borderWidth: 2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BRUTAL.radiusPill },
  metTxt: { fontFamily: F.bodyBold, fontSize: 12 },

  barBg: { height: 10, borderRadius: 2, borderWidth: 2, overflow: 'hidden' },
  barFill: { height: '100%' },

  glassRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  glass: {
    flex: 1,
    minWidth: 22,
    maxWidth: 38,
    height: 48,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  halfFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  overflowBadge: {
    borderWidth: 2,
    borderRadius: BRUTAL.radius,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowTxt: { fontFamily: F.bodyBold, fontSize: 11 },

  presetsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  presetsLabel: { fontFamily: F.monoSemi, fontSize: 10, letterSpacing: 0.8 },
  presetChip: {
    borderWidth: 2,
    borderRadius: BRUTAL.radius,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  presetTxt: { fontFamily: F.bodyBold, fontSize: 12 },

  hint: { fontFamily: F.bodyReg, fontSize: 11, lineHeight: 16 },

  quickRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quickBtn: {
    width: 42, height: 42, borderRadius: BRUTAL.radius, borderWidth: BRUTAL.border,
    alignItems: 'center', justifyContent: 'center',
  },
  quickBtnTxt: { fontFamily: F.displayBold, fontSize: 22, lineHeight: 26 },
  quickMl: { fontFamily: F.monoSemi, fontSize: 11, letterSpacing: 0.5 },
});
