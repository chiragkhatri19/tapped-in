import React from 'react';
import Animated, { FadeInDown, FadeIn, ReduceMotion } from 'react-native-reanimated';
import { ViewStyle, StyleProp } from 'react-native';
import { DUR, STAGGER } from '@/constants/motion';

type Direction = 'up' | 'none';

interface AppearProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  from?: Direction;
  style?: StyleProp<ViewStyle>;
}

export function Appear({ children, index = 0, delay, from = 'up', style }: AppearProps) {
  const totalDelay = delay !== undefined ? delay : index * STAGGER;

  const entering = from === 'up'
    ? FadeInDown
        .duration(DUR.base)
        .delay(totalDelay)
        .reduceMotion(ReduceMotion.System)
    : FadeIn
        .duration(DUR.base)
        .delay(totalDelay)
        .reduceMotion(ReduceMotion.System);

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}
