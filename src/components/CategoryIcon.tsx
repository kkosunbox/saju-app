import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CategoryKey, categoryTheme, colors } from '../theme/colors';

/** 분야 아이콘 (heroicons solid 20) — 연애 하트 · 재물 동전 · 직장 가방 · 관계 사람들 */
const PATHS: Record<CategoryKey, string> = {
  love: 'M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z',
  money: 'M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z',
  work: 'M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z',
  relationship: 'M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z',
};

export function CategoryGlyph({ category, size = 16, color }: { category: CategoryKey; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d={PATHS[category]} fill={color ?? categoryTheme[category].color} fillRule="evenodd" clipRule="evenodd" />
    </Svg>
  );
}

/** 흰 네모 칸 안의 분야 아이콘 (회색 카드 위) */
export default function CategoryIcon({ category, size = 38, style }: { category: CategoryKey; size?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ width: size, height: size, borderRadius: 6, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, style]}>
      <CategoryGlyph category={category} size={size * 0.47} />
    </View>
  );
}
