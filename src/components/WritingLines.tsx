import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useReducedMotion } from '../utils/motion';

const WIDTHS = ['100%', '92%', '96%', '64%'] as const;

/** 글이 아직 오는 중 — 숨 쉬듯 깜빡이는 줄 몇 개와 안내 한 줄 */
export default function WritingLines({ label, lines = 4 }: { label: string; lines?: number }) {
  const reduced = useReducedMotion();
  const [o] = useState(() => new Animated.Value(0.45));
  useEffect(() => {
    if (reduced) return;
    const a = Animated.loop(Animated.sequence([
      Animated.timing(o, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(o, { toValue: 0.45, duration: 700, useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [reduced, o]);
  return (
    <View accessible accessibilityLabel={label} accessibilityLiveRegion="polite">
      <Animated.View style={{ opacity: o, gap: 7, marginTop: 10 }}>
        {WIDTHS.slice(0, lines).map((w, i) => <View key={i} style={[s.bar, { width: w }]} />)}
      </Animated.View>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  bar: { height: 10, borderRadius: 5, backgroundColor: colors.line },
  label: { fontSize: 12, fontWeight: '600', color: colors.inkMute, letterSpacing: -0.4, marginTop: 10 },
});
