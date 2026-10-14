import React from 'react';
import { StyleSheet, Text, StyleProp, ViewStyle, View } from 'react-native';
import PressableScale from './PressableScale';
import Seal from './Seal';
import { colors } from '../theme/colors';
import { radius } from '../theme/typography';

interface Props { label: string; sub?: string; selected: boolean; onPress(): void; style?: StyleProp<ViewStyle>; compact?: boolean }

export default function OptionChip({ label, sub, selected, onPress, style, compact }: Props) {
  const m = label.match(/^([\u4E00-\u9FFF])\s(.+)$/);
  const textStyle = [s.label, compact && { fontSize: 14 }, selected && { color: colors.white }];
  return (
    <PressableScale
      onPress={onPress}
      haptic
      scaleTo={0.95}
      accessibilityState={{ selected }}
      style={[s.base, compact && s.compact, selected && s.sel, style]}
    >
      {m ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Seal ch={m[1]} color={selected ? colors.white : colors.inkSub} />
          <Text style={textStyle}>{m[2]}</Text>
        </View>
      ) : <Text style={textStyle}>{label}</Text>}
      {sub ? <Text style={[s.sub, selected && { color: 'rgba(255,255,255,0.72)' }]}>{sub}</Text> : null}
    </PressableScale>
  );
}

const s = StyleSheet.create({
  base: { minHeight: 52, paddingHorizontal: 6, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  compact: { minHeight: 44 },
  sel: { backgroundColor: colors.navy, borderColor: colors.navy },
  label: { fontSize: 16, fontWeight: '600', color: colors.ink, letterSpacing: -0.2 },
  sub: { fontSize: 12, fontWeight: '500', color: colors.inkMute, marginTop: 1 },
});
