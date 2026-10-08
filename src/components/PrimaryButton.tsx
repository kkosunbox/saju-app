import React from 'react';
import { StyleSheet, Text, ViewStyle, StyleProp, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from './PressableScale';
import { colors } from '../theme/colors';
import { radius, shadow } from '../theme/typography';

interface Props { label: string; onPress(): void; disabled?: boolean; variant?: 'solid' | 'soft' | 'text'; style?: StyleProp<ViewStyle>; icon?: React.ReactNode }

export default function PrimaryButton({ label, onPress, disabled, variant = 'solid', style, icon }: Props) {
  if (variant === 'solid') {
    return (
      <PressableScale onPress={onPress} disabled={disabled} haptic style={[s.wrap, !disabled && shadow.card, style]} accessibilityState={{ disabled }}>
        {disabled ? (
          <View style={[s.inner, { backgroundColor: '#D8D3E5' }]}><Text style={s.label}>{label}</Text></View>
        ) : (
          <LinearGradient colors={['#5A46A8', colors.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.inner}>
            {icon}<Text style={s.label}>{label}</Text>
          </LinearGradient>
        )}
      </PressableScale>
    );
  }
  return (
    <PressableScale onPress={onPress} disabled={disabled} style={[s.wrap, style]} accessibilityState={{ disabled }}>
      <View style={[s.inner, variant === 'soft' ? { backgroundColor: colors.lavenderSoft } : null]}>
        {icon}<Text style={[s.label, { color: colors.purple }]}>{label}</Text>
      </View>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  wrap: { borderRadius: radius.md },
  inner: { height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  label: { color: colors.white, fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
});
