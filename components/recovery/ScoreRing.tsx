import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { F } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';

interface ScoreRingProps {
  fill: number;        // 0..1
  color: string;
  size?: number;
  centerLabel?: string;
  centerSublabel?: string;
}

export function ScoreRing({ fill, color, size = 72, centerLabel, centerSublabel }: ScoreRingProps) {
  const colors = useColors();
  const THICKNESS = 10;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - THICKNESS) / 2;
  const circumference = 2 * Math.PI * r;
  const clampedFill = Math.max(0, Math.min(1, fill));
  const strokeDashoffset = circumference * (1 - clampedFill);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cy} r={r} stroke={colors.muted} strokeWidth={THICKNESS} fill="none" />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={color}
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
      {centerLabel && (
        <View style={{ alignItems: 'center', gap: 1 }}>
          <Text style={{ fontFamily: F.monoSemi, fontSize: size <= 64 ? 12 : 14, color: colors.foreground, lineHeight: 16 }}>
            {centerLabel}
          </Text>
          {centerSublabel && (
            <Text style={{ fontFamily: F.bodyMed, fontSize: 9, color: colors.mutedForeground, lineHeight: 12 }}>
              {centerSublabel}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
