import { Platform, TextStyle } from 'react-native';
import { colors, isDark } from './colors';
import { sansW } from './typography';

// Figma: 운픽_11 (166:4950), 운픽_12 (180:1142).
export const profileInk = isDark ? colors.ink : '#000000';
export const profileLine = isDark ? colors.lineStrong : '#E8E8E8';
export function profileType(size: number, weight: '400' | '500' | '600' | '700' | '800', lineHeight: number, letterSpacing = 0, color = profileInk): TextStyle {
  return {
    ...sansW(weight),
    ...(weight === '800' && Platform.OS !== 'web' ? { fontFamily: 'Pretendard-ExtraBold' } : {}),
    fontSize: size, lineHeight, letterSpacing, color, includeFontPadding: false,
  };
}
