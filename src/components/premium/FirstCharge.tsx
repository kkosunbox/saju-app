/** 첫 충전 1+1 표시: 결제 화면의 작은 태그 */
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, sansW } from '../../theme/typography';

/** "첫 충전 1+1" 작은 태그 */
export function FirstChargeTag({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.tag, style]}>
      <Text style={s.tagText}>첫 충전 1+1</Text>
    </View>
  );
}

const s = StyleSheet.create({
  tag: { alignSelf: 'flex-start', backgroundColor: colors.accent, borderRadius: radius.xs, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { ...sansW('700'), fontSize: 12, lineHeight: 16, letterSpacing: -0.24, color: '#FFFFFF' },
});
