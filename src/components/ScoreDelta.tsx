import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { colors } from '../theme/colors';
import { scoreDelta, scoreDeltaLabel } from '../utils/scoreDelta';

export { scoreDeltaLabel };

/** 어제 대비 ▲3 / ▼2. 오르면 빨강, 내리면 파랑. */
export default function ScoreDelta({ now, before, style }: { now: number; before?: number | null; style?: StyleProp<TextStyle> }) {
  const d = scoreDelta(now, before);
  if (d == null) return null;
  return (
    <Text style={[s.delta, { color: d > 0 ? colors.danger : colors.work }, style]} importantForAccessibility="no" accessibilityElementsHidden>
      {d > 0 ? '▲' : '▼'}{Math.abs(d)}
    </Text>
  );
}

const s = StyleSheet.create({
  delta: { fontSize: 12, fontWeight: '700', letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
});
