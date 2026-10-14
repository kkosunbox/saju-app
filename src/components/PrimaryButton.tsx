import React from 'react';
import { StyleSheet, Text, ViewStyle, StyleProp, View } from 'react-native';
import PressableScale from './PressableScale';
import { colors } from '../theme/colors';
import { radius } from '../theme/typography';

interface Props { label: string; onPress(): void; disabled?: boolean; variant?: 'solid' | 'soft' | 'text'; style?: StyleProp<ViewStyle>; icon?: React.ReactNode }

/** 단색 먹색 버튼 (책력) */
export default function PrimaryButton({ label, onPress, disabled, variant = 'solid', style, icon }: Props) {
  const solid = variant === 'solid';
  return (
    <PressableScale onPress={onPress} disabled={disabled} haptic={solid} style={[s.wrap, style]} accessibilityState={{ disabled }}>
      <View style={[s.inner, solid ? { backgroundColor: disabled ? colors.lavender : colors.navy } : variant === 'soft' ? { backgroundColor: colors.lavenderSoft } : null]}>
        {icon}<Text style={[s.label, !solid ? { color: colors.purple } : disabled ? { color: colors.inkMute } : null]}>{label}</Text>
      </View>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  wrap: { borderRadius: radius.md },
  inner: { height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  label: { color: colors.white, fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
});
