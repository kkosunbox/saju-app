import React from 'react';
import { StyleSheet, Text, StyleProp, ViewStyle } from 'react-native';
import PressableScale from './PressableScale';
import { colors } from '../theme/colors';
import { radius } from '../theme/typography';

interface Props { label: string; sub?: string; selected: boolean; onPress(): void; style?: StyleProp<ViewStyle>; compact?: boolean }

export default function OptionChip({ label, sub, selected, onPress, style, compact }: Props) {
  return (
    <PressableScale
      onPress={onPress}
      haptic
      scaleTo={0.95}
      accessibilityState={{ selected }}
      style={[s.base, compact && { minHeight: 44 }, selected && s.sel, style]}
    >
      <Text style={[s.label, compact && { fontSize: 15 }, selected && { color: colors.white }]}>{label}</Text>
      {sub ? <Text style={[s.sub, selected && { color: 'rgba(255,255,255,0.72)' }]}>{sub}</Text> : null}
    </PressableScale>
  );
}

const s = StyleSheet.create({
  base: { minHeight: 54, paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  sel: { backgroundColor: colors.purple, borderColor: colors.purple },
  label: { fontSize: 16, fontWeight: '700', color: colors.ink, letterSpacing: -0.3 },
  sub: { fontSize: 11, color: colors.inkMute, marginTop: 2 },
});
