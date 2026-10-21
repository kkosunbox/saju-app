import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import PressableScale from './PressableScale';
import { colors } from '../theme/colors';
import { radius, shadow } from '../theme/typography';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'flat' | 'tinted';
  tint?: string;
  onPress?(): void;
  accessibilityLabel?: string;
}

/**
 * 기본 카드. 반경 12 / 연회색 면 / 선·그림자 없음.
 * flat: 흰 바탕 + 1px 선 (회색 카드가 겹칠 때)
 */
export default function Card({ children, style, variant = 'elevated', tint, onPress, accessibilityLabel }: Props) {
  const base = [
    s.base,
    variant === 'elevated' && s.elevated,
    variant === 'flat' && s.flat,
    variant === 'tinted' && { backgroundColor: tint ?? colors.lavenderSoft },
    style,
  ];
  if (onPress) {
    return <PressableScale onPress={onPress} style={base} accessibilityLabel={accessibilityLabel}>{children}</PressableScale>;
  }
  return <View style={base}>{children}</View>;
}

const s = StyleSheet.create({
  base: { borderRadius: radius.lg, padding: 16, backgroundColor: colors.card },
  elevated: { ...shadow.card },
  flat: { backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line },
});
