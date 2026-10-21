import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme/colors';
import { radius as R } from '../theme/typography';

/** 하늘색 그라디언트 테두리 상자 (입력창 · 강조 카드). style 은 안쪽 흰 면에 붙는다 */
export default function GradientBorder({ children, width = 1, radius = R.lg, style, outer }: { children: React.ReactNode; width?: number; radius?: number; style?: StyleProp<ViewStyle>; outer?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient colors={gradients.border} locations={[0, 0.47, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ borderRadius: radius, padding: width }, outer]}>
      <View style={[{ borderRadius: radius - width, backgroundColor: colors.cream, overflow: 'hidden' }, style]}>{children}</View>
    </LinearGradient>
  );
}
