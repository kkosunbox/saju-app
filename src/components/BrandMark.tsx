import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

/** 초승달 심볼 + 워드마크. 앱 전체에서 같은 모양으로 반복 사용 */
export function Crescent({ size = 18, color = colors.purple, cut = colors.cream }: { size?: number; color?: string; cut?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: cut, left: size * 0.34, top: -size * 0.14 }} />
    </View>
  );
}

export default function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <View style={s.row} accessibilityLabel="오늘나">
      <Crescent color={light ? colors.moon : colors.purple} cut={light ? colors.purpleDeep : colors.cream} />
      <Text style={[s.word, light && { color: colors.white }]}>오늘나</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  word: { fontSize: 17, fontWeight: '800', letterSpacing: -0.6, color: colors.purple },
});
