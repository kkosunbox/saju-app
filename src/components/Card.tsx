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
 * 기본 카드. 반경 20 / 흰 바탕 / 보라 톤 그림자 + 얇은 테두리.
 * 히어로(28)·카드(20)·내부 요소(12) 반경 위계를 지킨다.
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
  base: { borderRadius: radius.lg, padding: 18, backgroundColor: colors.white },
  elevated: { ...shadow.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.lineStrong },
  flat: { borderWidth: 1, borderColor: colors.line },
});
