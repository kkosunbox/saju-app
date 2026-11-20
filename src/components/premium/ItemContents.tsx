/**
 * 유료 상품에 무엇이 담겼는지 — 항목을 칩으로 감싸 보여 준다 (5개까지, 나머지는 "+ N개 더").
 * 항목은 Item.desc를 ' · '로 나눠 만든다. '성격·외모'처럼 띄어쓰기 없는 가운뎃점은 한 칩으로 남는다.
 */
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { sansW } from '../../theme/typography';

const SHOWN = 5;

export function splitContents(desc: string): { items: string[]; total: number } {
  const parts = desc.split(' · ').map(t => t.trim()).filter(Boolean);
  // '9개 섹션 · …'처럼 개수로 시작하면 그 개수를 총 개수로 쓰고 칩에서는 뺀다
  const m = parts[0]?.match(/^(\d+)개 섹션$/);
  if (m) return { items: parts.slice(1), total: Number(m[1]) };
  return { items: parts, total: parts.length };
}

export function ItemContents({ desc, center, style }: { desc: string; center?: boolean; style?: StyleProp<ViewStyle> }) {
  const { items, total } = splitContents(desc);
  const shown = items.slice(0, SHOWN);
  const rest = total - shown.length;
  return (
    <View style={[s.wrap, center ? { justifyContent: 'center' } : null, style]}>
      {shown.map(t => (
        <View key={t} style={s.chip}><Text style={s.chipText}>{t}</Text></View>
      ))}
      {rest > 0 ? <View style={[s.chip, s.more]}><Text style={[s.chipText, s.moreText]}>+ {rest}개 더</Text></View> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.accentSoft },
  chipText: { ...sansW('500'), fontSize: 12, lineHeight: 16, letterSpacing: -0.4, color: colors.purpleSoft },
  more: { backgroundColor: colors.lavenderSoft },
  moreText: { color: colors.inkMute },
});
