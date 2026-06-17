/**
 * DailyProgressCard — merged rings + streak card.
 * 4 rings (horizontal row) in the top half; 7-day streak + Tapped In score below.
 * The header shows the streak count directly next to the rings count so the
 * "close all 4 = keep your streak" relationship is visible at a glance.
 */

import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { useColors } from '@/hooks/useColors';
import { F } from '@/constants/fonts';
import { BRUTAL } from '@/constants/brutal';
import { BrutalBox } from '@/components/brutal';
import { scoreLabel } from '@/lib/completeness-engine';
import type { RingState, DayCompleteness } from '@/lib/completeness-engine';

// ── Ring geometry (slightly smaller to fit 4-in-a-row) ───────────────────────
const RING_SIZE   = 64;
const STROKE      = 8;
const RADIUS      = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_COLORS: Record<string, string> = {
  nutrition: '#E8FF00',
  hydration: '#00C2A8',
  training:  '#FF7A1A',
  recovery:  '#7C5CFF',
};

const RING_ICON_NAMES: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  nutrition: 'leaf-outline',
  hydration: 'water-outline',
  training:  'barbell-outline',
  recovery:  'moon-outline',
};

const RING_TIPS: Record<string, { title: string; body: string; tab: string | null }> = {
  nutrition: {
    title: 'nutrition ring',
    body: 'Closes when calories are within 90–110% of your target AND protein meets target.\n\nLog all meals honestly — the ring only updates when food is logged.',
    tab: null,
  },
  hydration: {
    title: 'hydration ring',
    body: 'Closes when water intake meets your daily target (weight-scaled, IOM/EFSA formula).\n\nLog glasses on the tracker tab.',
    tab: null,
  },
  training: {
    title: 'training ring',
    body: 'Closes when you log a workout, or when today is a scheduled rest day (auto-closes).\n\nHead to the workout tab to start a session.',
    tab: '/(tabs)/workout',
  },
  recovery: {
    title: 'recovery ring',
    body: "Closes when last night's sleep is 7+ hours.\n\nLog sleep on the sleep tab. The ring activates once you log your first entry.",
    tab: null,
  },
};

// ── Day-label helper ─────────────────────────────────────────────────────────
const DAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
function getDayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return DAY_SHORT[new Date(y, m - 1, d).getDay()];
}

const BAND_COLORS: Record<string, string> = {
  'locked in': '#E8FF00',
  'dialed':    '#00C2A8',
  'steady':    '#FF7A1A',
  'slipping':  '#FF3B2F',
};

// ── Single ring ──────────────────────────────────────────────────────────────
function RingBadge({ ring, onPress }: { ring: RingState; onPress: () => void }) {
  const colors   = useColors();
  const accent   = RING_COLORS[ring.id];
  const iconName = RING_ICON_NAMES[ring.id] ?? 'ellipse-outline';

  const fillAnim = useSharedValue(0);
  useEffect(() => {
    fillAnim.value = withSpring(ring.fill, { damping: 18, stiffness: 120 });
  }, [ring.fill]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - fillAnim.value),
  }));

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [sr.ringItem, { opacity: pressed ? 0.72 : 1 }]}
    >
      <View style={sr.svgWrap}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
            stroke={colors.muted} strokeWidth={STROKE} fill="none"
          />
          <AnimatedCircle
            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
            stroke={ring.closed ? accent : accent + 'AA'}
            strokeWidth={STROKE} strokeLinecap="round" fill="none"
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        <View style={[sr.iconWrap, {
          borderColor: colors.foreground,
          backgroundColor: ring.closed ? accent : colors.card,
        }]}>
          <Ionicons name={iconName} size={15} color={ring.closed ? '#111111' : colors.mutedForeground} />
        </View>
      </View>
      <Text style={[sr.ringLabel, { color: colors.foreground }]}>{ring.label}</Text>
      <Text style={[sr.ringDetail, { color: colors.mutedForeground }]} numberOfLines={1}>{ring.detail}</Text>
    </Pressable>
  );
}

// ── Ring info bottom sheet ───────────────────────────────────────────────────
function RingTip({ ring, visible, onClose }: { ring: RingState | null; visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const router = useRouter();
  if (!ring) return null;
  const tip    = RING_TIPS[ring.id];
  const accent = RING_COLORS[ring.id];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={sr.backdrop} onPress={onClose} />
      <View style={[sr.sheet, { backgroundColor: colors.card, borderColor: colors.foreground }]}>
        <View style={[sr.handle, { backgroundColor: colors.muted }]} />
        <View style={[sr.sheetDot, { backgroundColor: accent, borderColor: colors.foreground }]} />
        <Text style={[sr.sheetTitle, { color: colors.foreground }]}>{tip.title}</Text>
        <Text style={[sr.sheetBody, { color: colors.mutedForeground }]}>{tip.body}</Text>
        {tip.tab ? (
          <Pressable
            onPress={() => { onClose(); setTimeout(() => router.push(tip.tab as never), 220); }}
            style={[sr.sheetBtn, { backgroundColor: accent, borderColor: colors.foreground }]}
          >
            <Text style={sr.sheetBtnTxt}>go there</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onClose}
          style={[sr.sheetClose, { borderColor: colors.foreground, backgroundColor: colors.muted }]}
        >
          <Text style={[sr.sheetCloseTxt, { color: colors.foreground }]}>got it</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

// ── Day cell ─────────────────────────────────────────────────────────────────
function DayCell({ day, isToday, onPress }: { day: DayCompleteness; isToday: boolean; onPress: () => void }) {
  const colors  = useColors();
  const label   = getDayLabel(day.dateKey);
  const hasData = day.score > 0;
  const cellBg  = day.dayComplete ? colors.highlight : hasData ? colors.muted : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [sr.dayCell, {
        borderColor: isToday ? colors.foreground : colors.muted,
        backgroundColor: cellBg,
        borderWidth: isToday ? BRUTAL.border : 2,
        opacity: pressed ? 0.72 : 1,
      }]}
    >
      {day.dayComplete ? (
        <Ionicons name="flame" size={12} color="#111111" />
      ) : (
        <View style={[sr.scoreDot, {
          backgroundColor: hasData ? colors.primary + '88' : 'transparent',
          borderColor: colors.muted,
          borderWidth: hasData ? 0 : 1.5,
        }]} />
      )}
      <Text style={[sr.dayLabel, {
        color: day.dayComplete ? '#111111' : isToday ? colors.foreground : colors.mutedForeground,
        fontFamily: isToday ? F.bodyBold : F.bodyReg,
      }]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ── Score strip ──────────────────────────────────────────────────────────────
function ScoreStrip({ score }: { score: number }) {
  const colors = useColors();
  const label  = scoreLabel(score);
  const accent = BAND_COLORS[label] ?? colors.primary;
  return (
    <View style={[sr.scoreStrip, { borderColor: colors.border ?? colors.muted, backgroundColor: colors.background }]}>
      <View style={sr.scoreLeft}>
        <Text style={[sr.scoreBig, { color: colors.foreground }]}>{score}</Text>
        <Text style={[sr.scoreSlash, { color: colors.mutedForeground }]}>/100</Text>
      </View>
      <Text style={[sr.scoreLabel, { color: colors.mutedForeground }]}>tapped in score</Text>
      <View style={[sr.scoreBand, { backgroundColor: accent, borderColor: colors.foreground }]}>
        <Text style={sr.scoreBandTxt}>{label.toUpperCase()}</Text>
      </View>
    </View>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
interface Props {
  rings: RingState[];
  ringsClosed: number;
  recentDays: DayCompleteness[];
  currentStreak: number;
  bestStreak: number;
  tappedInScore: number;
  onDayPress: (dateKey: string) => void;
}

export function DailyProgressCard({
  rings, ringsClosed, recentDays, currentStreak, bestStreak, tappedInScore, onDayPress,
}: Props) {
  const colors   = useColors();
  const [activeRing, setActiveRing] = React.useState<RingState | null>(null);
  const [tipVisible, setTipVisible] = React.useState(false);
  const todayKey = recentDays[recentDays.length - 1]?.dateKey ?? '';

  const allClosed   = ringsClosed === 4;
  const hintText    = allClosed
    ? 'all 4 rings closed — streak continues!'
    : ringsClosed === 3
    ? '1 more ring to lock in your streak'
    : `${4 - ringsClosed} more rings to lock in your streak`;

  function handleRingPress(ring: RingState) {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setActiveRing(ring);
    setTipVisible(true);
  }

  const [nutrition, hydration, training, recovery] = rings;

  return (
    <>
      <BrutalBox style={sr.card} offset={BRUTAL.shadow}>
        {/* Header: title + streak count */}
        <View style={sr.header}>
          <View>
            <Text style={[sr.title, { color: colors.foreground }]}>rings & streak</Text>
            <View style={[sr.titleStroke, { backgroundColor: colors.orange }]} />
          </View>
          <View style={sr.headerRight}>
            <Ionicons
              name="flame"
              size={16}
              color={currentStreak > 0 ? colors.orange : colors.mutedForeground}
            />
            <Text style={[sr.streakNum, { color: currentStreak > 0 ? colors.foreground : colors.mutedForeground }]}>
              {currentStreak}
            </Text>
            {bestStreak > 1 ? (
              <Text style={[sr.bestLabel, { color: colors.mutedForeground }]}>best {bestStreak}</Text>
            ) : null}
            <View style={[sr.ringsBadge, {
              backgroundColor: allClosed ? colors.highlight : colors.muted,
              borderColor: colors.foreground,
            }]}>
              <Text style={[sr.ringsBadgeTxt, { color: allClosed ? '#111111' : colors.mutedForeground }]}>
                {ringsClosed}/4
              </Text>
            </View>
          </View>
        </View>

        {/* Hint line connecting rings → streak */}
        <Text style={[sr.hint, { color: allClosed ? colors.teal : colors.mutedForeground }]}>
          {hintText}
        </Text>

        {/* 4 rings in a row */}
        <View style={sr.ringsRow}>
          {nutrition ? <RingBadge ring={nutrition} onPress={() => handleRingPress(nutrition)} /> : null}
          {hydration ? <RingBadge ring={hydration} onPress={() => handleRingPress(hydration)} /> : null}
          {training  ? <RingBadge ring={training}  onPress={() => handleRingPress(training)}  /> : null}
          {recovery  ? <RingBadge ring={recovery}  onPress={() => handleRingPress(recovery)}  /> : null}
        </View>

        {/* Divider */}
        <View style={[sr.divider, { backgroundColor: colors.muted }]} />

        {/* 7-day row */}
        <View style={sr.daysRow}>
          {recentDays.map(day => (
            <DayCell
              key={day.dateKey}
              day={day}
              isToday={day.dateKey === todayKey}
              onPress={() => onDayPress(day.dateKey)}
            />
          ))}
        </View>

        {/* Score strip */}
        <ScoreStrip score={tappedInScore} />
      </BrutalBox>

      <RingTip ring={activeRing} visible={tipVisible} onClose={() => setTipVisible(false)} />
    </>
  );
}

const sr = StyleSheet.create({
  card: { padding: 16, gap: 12 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: F.displayBold, fontSize: 16, fontStyle: 'italic' },
  titleStroke: { height: 3, width: 30, borderRadius: 2, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakNum: { fontFamily: F.monoSemi, fontSize: 20 },
  bestLabel: { fontFamily: F.mono, fontSize: 10 },
  ringsBadge: { borderWidth: BRUTAL.borderThin, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BRUTAL.radiusPill },
  ringsBadgeTxt: { fontFamily: F.monoSemi, fontSize: 10 },

  hint: { fontFamily: F.bodyReg, fontSize: 11, letterSpacing: 0.1, marginTop: -4 },

  ringsRow: { flexDirection: 'row', justifyContent: 'space-between' },

  ringItem: { flex: 1, alignItems: 'center', gap: 3 },
  svgWrap: { width: RING_SIZE, height: RING_SIZE, justifyContent: 'center', alignItems: 'center' },
  iconWrap: {
    position: 'absolute', width: 28, height: 28,
    borderRadius: BRUTAL.radiusPill, borderWidth: BRUTAL.borderThin,
    justifyContent: 'center', alignItems: 'center',
  },
  ringLabel: { fontFamily: F.monoSemi, fontSize: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  ringDetail: { fontFamily: F.mono, fontSize: 7.5, textAlign: 'center', paddingHorizontal: 2 },

  divider: { height: 1.5, borderRadius: 1 },

  daysRow: { flexDirection: 'row', gap: 5, justifyContent: 'space-between' },
  dayCell: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 7, borderRadius: BRUTAL.radius, gap: 3,
  },
  scoreDot: { width: 7, height: 7, borderRadius: BRUTAL.radiusPill },
  dayLabel: { fontSize: 9 },

  scoreStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: BRUTAL.borderThin, borderRadius: BRUTAL.radius,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  scoreLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  scoreBig: { fontFamily: F.monoSemi, fontSize: 22 },
  scoreSlash: { fontFamily: F.mono, fontSize: 11 },
  scoreLabel: { fontFamily: F.mono, fontSize: 10, flex: 1, marginLeft: 6 },
  scoreBand: { borderWidth: 2, borderRadius: BRUTAL.radius, paddingHorizontal: 8, paddingVertical: 4 },
  scoreBandTxt: { fontFamily: F.monoSemi, fontSize: 10, color: '#111111' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: BRUTAL.border, borderBottomWidth: 0,
    padding: 24, paddingBottom: 44, gap: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  sheetDot: { width: 12, height: 12, borderWidth: 3, borderRadius: BRUTAL.radiusPill },
  sheetTitle: { fontFamily: F.displayBold, fontSize: 20, fontStyle: 'italic', letterSpacing: -0.3 },
  sheetBody: { fontFamily: F.bodyReg, fontSize: 14, lineHeight: 21 },
  sheetBtn: {
    borderWidth: BRUTAL.border, borderRadius: BRUTAL.radius,
    paddingVertical: 12, alignItems: 'center', marginTop: 4,
  },
  sheetBtnTxt: { fontFamily: F.bodyBold, fontSize: 14, color: '#111111' },
  sheetClose: {
    borderWidth: BRUTAL.borderThin, borderRadius: BRUTAL.radius,
    paddingVertical: 11, alignItems: 'center',
  },
  sheetCloseTxt: { fontFamily: F.bodyMed, fontSize: 13 },
});
