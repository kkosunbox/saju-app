/** 구독 혜택 표시 — 왕관 + 글자. 구독 덕분에 무료·2배가 된 자리에 붙여, 구독으로 받는 혜택임을 한눈에 보여 준다 */
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import SolidIcon from '../SolidIcon';
import { sansW } from '../../theme/typography';

/** 정기 구독 카드 바탕 · 왕관 색 (디자인 값, 내 알 화면 정기 구독 카드와 같다) */
export const SUB_BG = '#FFF5E4';
export const CROWN = '#FCBD51';
/** 왕관 칩 위 글자색 — 금색 바탕에서도 읽히는 진한 갈색 */
export const SUB_INK = '#9A6200';

export function SubscriptionBadge({ label = '구독 혜택', small, style }: { label?: string; small?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.badge, small && s.small, style]} accessibilityLabel={label}>
      <SolidIcon name="crown" size={small ? 11 : 13} color={CROWN} />
      <Text style={[s.text, small && s.textSmall]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', backgroundColor: SUB_BG, borderRadius: 999, paddingLeft: 6, paddingRight: 8, paddingVertical: 3 },
  small: { paddingLeft: 5, paddingRight: 7, paddingVertical: 2 },
  text: { ...sansW('700'), fontSize: 12, lineHeight: 16, letterSpacing: -0.36, color: SUB_INK },
  textSmall: { fontSize: 11, lineHeight: 14 },
});
