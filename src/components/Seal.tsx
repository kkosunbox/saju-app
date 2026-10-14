import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/** 낙관(도장) — 이모지 대신 쓰는 테두리 한자 */
export default function Seal({ ch, color = colors.inkSub, size = 11 }: { ch: string; color?: string; size?: number }) {
  const box = Math.round(size * 1.5);
  return (
    <View style={[s.box, { width: box, height: box, borderColor: color }]}>
      <Text style={{ fontFamily: fonts.serif, fontSize: size, lineHeight: size + 2, fontWeight: '600', color }}>{ch}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 3, alignItems: 'center', justifyContent: 'center', opacity: 0.9 },
});
