import React, { useEffect, useState } from 'react';
import { Animated, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { useReducedMotion } from '../utils/motion';
import { scoreDelta, scoreDeltaLabel, scoreDeltaText } from '../utils/scoreDelta';

export { scoreDeltaLabel };

/**
 * 어제 대비 칩: 오르면 연한 빨강 바탕 ▲4, 내리면 연한 파랑 바탕 ▼4. prefix는 칩 안 앞쪽 글자 ('어제보다').
 * delay를 주면 그만큼 기다렸다가 톡 튀어나온다 (점수 카운트업이 끝난 뒤).
 */
export default function ScoreDelta({ now, before, delay, prefix, small, style }: { now: number; before?: number | null; delay?: number; prefix?: string; small?: boolean; style?: StyleProp<ViewStyle> }) {
  const d = scoreDelta(now, before);
  const reduced = useReducedMotion();
  const [pop] = useState(() => new Animated.Value(delay == null ? 1 : 0));
  useEffect(() => {
    if (delay == null || reduced) { pop.setValue(1); return; }
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, delay, friction: 5, tension: 160, useNativeDriver: true }).start();
  }, [delay, reduced, d, pop]);
  if (d == null) return null;
  const up = d > 0;
  return (
    <Animated.View
      style={[s.chip, small && s.chipSmall, { backgroundColor: up ? colors.loveBg : colors.workBg, opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }, style]}
      importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
    >
      <Animated.Text style={[s.text, small && s.textSmall, { color: up ? colors.danger : colors.work }]}>{prefix ? <Animated.Text style={s.prefix}>{prefix} </Animated.Text> : null}{up ? '▲' : '▼'}{Math.abs(d)}</Animated.Text>
    </Animated.View>
  );
}

/** 종합 점수용 문구: '어제보다 4점 올랐어요' (오르면 빨강, 내리면 파랑). 차이가 없으면 null. */
export function ScoreDeltaText({ now, before, style }: { now: number; before?: number | null; style?: StyleProp<TextStyle> }) {
  const text = scoreDeltaText(now, before);
  if (!text) return null;
  return (
    <Text style={[s.line, { color: now > before! ? colors.danger : colors.work }, style]} importantForAccessibility="no" accessibilityElementsHidden>
      {text}
    </Text>
  );
}

const s = StyleSheet.create({
  line: { fontSize: 12, fontWeight: '600', letterSpacing: -0.4 },
  chip: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 999 },
  chipSmall: { paddingHorizontal: 4, paddingVertical: 0, marginTop: 1 },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  textSmall: { fontSize: 10, lineHeight: 13 },
  prefix: { fontWeight: '600' },
});
