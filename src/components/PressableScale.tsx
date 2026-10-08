import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
  children?: React.ReactNode;
}

/** 모든 탭 가능한 요소의 기본: 눌렀을 때 살짝 들어가고 스프링으로 돌아온다 */
export default function PressableScale({ style, scaleTo = 0.97, haptic = false, onPress, onPressIn, onPressOut, children, disabled, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const spring = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: v === 1 ? 6 : 0 }).start();
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityRole={rest.accessibilityRole ?? 'button'}
      onPressIn={e => { spring(scaleTo); onPressIn?.(e); }}
      onPressOut={e => { spring(1); onPressOut?.(e); }}
      onPress={e => {
        if (haptic) Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}
