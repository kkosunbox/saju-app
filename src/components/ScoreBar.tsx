import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useReducedMotion, motion } from '../utils/motion';

/** 왼쪽에서 차오르는 점수 막대 */
export default function ScoreBar({ value, color, track = '#EEEAF5', height = 6, delay = 200 }: { value: number; color: string; track?: string; height?: number; delay?: number }) {
  const reduced = useReducedMotion();
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) { w.setValue(value); return; }
    w.setValue(0);
    Animated.timing(w, { toValue: value, duration: 900, delay, easing: motion.easeOut, useNativeDriver: false }).start();
  }, [value, reduced]);
  const width = w.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View style={{ height, borderRadius: height / 2, backgroundColor: color, width }} />
    </View>
  );
}
