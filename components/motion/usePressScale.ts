import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SPRING } from '@/constants/motion';

export function usePressScale(toScale = 0.97) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => { scale.value = withSpring(toScale, SPRING.press); };
  const onPressOut = () => { scale.value = withSpring(1, SPRING.press); };

  return { animatedStyle, onPressIn, onPressOut };
}
