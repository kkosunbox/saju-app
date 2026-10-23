import React from 'react';
import { StyleSheet, Text, StyleProp, ViewStyle, View } from 'react-native';
import PressableScale from './PressableScale';
import Seal from './Seal';
import { colors } from '../theme/colors';
import { radius } from '../theme/typography';
import { profileLine, profileType } from '../theme/profileDesign';

interface Props { label: string; sub?: string; selected: boolean; onPress(): void; style?: StyleProp<ViewStyle>; compact?: boolean; variant?: 'default' | 'profile' }

export default function OptionChip({ label, sub, selected, onPress, style, compact, variant = 'default' }: Props) {
  const m = label.match(/^([\u4E00-\u9FFF])\s(.+)$/);
  const textStyle = [s.label, compact && { fontSize: 14 }, variant === 'profile' && profileType(13, '600', 16, -0.26), selected && { color: variant === 'profile' ? '#EDEDED' : colors.white }];
  return (
    <PressableScale
      onPress={onPress}
      haptic
      scaleTo={0.95}
      accessibilityState={{ selected }}
      style={[s.base, compact && s.compact, variant === 'profile' && s.profile, selected && s.sel, style]}
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
  profile: { minHeight: 40, height: 40, paddingVertical: 0, borderRadius: 5, borderColor: profileLine, backgroundColor: colors.cream },
  base: { minHeight: 52, paddingHorizontal: 6, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  compact: { minHeight: 44 },
  sel: { backgroundColor: colors.navy, borderColor: colors.navy },
  label: { fontSize: 16, fontWeight: '600', color: colors.ink, letterSpacing: -0.2 },
  sub: { fontSize: 12, fontWeight: '500', color: colors.inkMute, marginTop: 1 },
});
