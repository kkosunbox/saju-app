import React from 'react';
import { StyleSheet, Text, ViewStyle, StyleProp, View } from 'react-native';
import PressableScale from './PressableScale';
import { colors } from '../theme/colors';
import { radius } from '../theme/typography';

interface Props { label: string; onPress(): void; disabled?: boolean; variant?: 'solid' | 'soft' | 'text'; style?: StyleProp<ViewStyle>; icon?: React.ReactNode; small?: boolean }

/** 단색 먹남색 버튼 */
/** small: 카드 안에 들어가는 40 높이 버튼 */
export default function PrimaryButton({ label, onPress, disabled, variant = 'solid', style, icon, small }: Props) {
  const solid = variant === 'solid';
  return (
    <PressableScale onPress={onPress} disabled={disabled} haptic={solid} style={[s.wrap, style]} accessibilityState={{ disabled }}>
      <View style={[s.inner, small && s.small, solid ? { backgroundColor: disabled ? colors.lavender : colors.navy } : variant === 'soft' ? { backgroundColor: colors.card } : null]}>
        {icon}<Text style={[s.label, small && { fontSize: 14, fontWeight: '500' }, !solid ? { color: colors.ink } : disabled ? { color: colors.inkMute } : null]}>{label}</Text>
      </View>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  wrap: { borderRadius: radius.md },
  inner: { height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  small: { height: 40 },
  label: { color: colors.white, fontSize: 15, fontWeight: '600', letterSpacing: -0.5 },
});
