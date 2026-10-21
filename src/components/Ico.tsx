import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/** 아이콘 칸: 흰 바탕 둥근 네모 · 굵은 한자 (회색 카드 위에 놓인다) */
export default function Ico({ ch, size = 36, color = colors.purpleSoft, style }: { ch: string; size?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.box, { width: size, height: size, borderRadius: Math.min(8, size / 4) }, style]}>
      <Text style={{ fontFamily: fonts.serif, fontSize: size * 0.42, fontWeight: '700', color }}>{ch}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
});
