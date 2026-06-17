import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { F } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';

interface SleepRingBadgeProps {
  fill: number; // 0–1 where 1 = SLEEP_TARGET_MIN
  size?: number;
}

export function SleepRingBadge({ fill, size = 72 }: SleepRingBadgeProps) {
  const colors = useColors();

  const THICKNESS = 10;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - THICKNESS) / 2;
  const circumference = 2 * Math.PI * r;
  const clampedFill = Math.max(0, Math.min(1, fill));
  const strokeDashoffset = circumference * (1 - clampedFill);
  const pct = Math.round(clampedFill * 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cy} r={r} stroke={colors.muted} strokeWidth={THICKNESS} fill="none" />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={colors.violet}
          strokeWidth={THICKNESS}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
        <Circle
          cx={cx}
          cy={cy}
          r={size / 2 - 1.5}
          stroke={colors.foreground}
          strokeWidth={3}
          fill="none"
        />
      </Svg>
      <Text style={{ fontFamily: F.monoSemi, fontSize: 13, color: colors.foreground, lineHeight: 16 }}>
        {pct}%
      </Text>
    </View>
  );
}
