/**
 * 유료 상품에 담긴 항목을 모두 칩으로 보여 준다.
 * 항목은 Item.desc를 ' · '로 나눠 만든다. '성격·외모'처럼 띄어쓰기 없는 가운뎃점은 한 칩으로 남는다.
 */
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { sansW } from '../../theme/typography';

export function ItemContents({ desc, center, style }: { desc: string; center?: boolean; style?: StyleProp<ViewStyle> }) {
  const parts = desc.split(' · ').map(t => t.trim()).filter(Boolean);
  // 맨 앞의 '9개 섹션' 같은 개수 표시는 칩에서 뺀다.
  const items = /^\d+개 섹션$/.test(parts[0] ?? '') ? parts.slice(1) : parts;
  return (
    <View style={[s.wrap, center ? { justifyContent: 'center' } : null, style]}>
      {items.map(t => (
        <View key={t} style={s.chip}><Text style={s.chipText}>{t}</Text></View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.accentSoft },
  chipText: { ...sansW('500'), fontSize: 12, lineHeight: 16, letterSpacing: -0.4, color: colors.purpleSoft },
});
