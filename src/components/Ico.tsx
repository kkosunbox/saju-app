import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/** 책력 아이콘 칸: 카드색 바탕 · 1px 선 · 명조 한자 */
export default function Ico({ ch, size = 36, color = colors.purple, style }: { ch: string; size?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.box, { width: size, height: size, borderRadius: Math.min(12, size / 3) }, style]}>
      <Text style={{ fontFamily: fonts.serif, fontSize: size * 0.44, fontWeight: '600', color }}>{ch}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
});
