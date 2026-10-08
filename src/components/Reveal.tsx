import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion, motion } from '../utils/motion';

/** 첫 진입 시 한 번만 쓰는 부드러운 등장 (홈 히어로 시퀀스 전용) */
export default function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) { v.setValue(1); return; }
    Animated.timing(v, { toValue: 1, duration: 520, delay, easing: motion.easeOut, useNativeDriver: true }).start();
  }, [reduced]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}
