import { Platform, TextStyle, ViewStyle } from 'react-native';
import { colors, isDark } from './colors';

/**
 * 타입 시스템 — 모두 Pretendard (깔끔한 현대 고딕, 한국어 UI 표준).
 * 예전 책력 디자인에서 명조(serif)를 쓰던 자리(큰 숫자 · 한자 · 인용)도 이제 Pretendard Bold로 쓴다.
 * 이름 serif 는 그 자리를 표시하려고 남겨 둔다.
 * 웹은 웹폰트(Pretendard CDN)를 굵기별로, 네이티브는 굵기별 파일을 따로 불러온다.
 * SIL Open Font License (assets/fonts/LICENSE-Pretendard.txt).
 */
export const fonts = {
  serif: Platform.select({ web: "Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif", default: 'Pretendard-Bold' })!,
  display: Platform.select({ web: "Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif", default: 'Pretendard-Bold' })!,
  sans: Platform.select({ web: "Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif", default: 'Pretendard-Regular' }),
};

/** Pretendard 굵기 → 글꼴 이름 (웹은 굵기로, 네이티브는 굵기별 파일 이름으로) */
const PRE: Record<string, string> = { '400': 'Pretendard-Regular', '500': 'Pretendard-Medium', '600': 'Pretendard-SemiBold', '700': 'Pretendard-Bold', '800': 'Pretendard-Bold' };
export const sansW = (w: '400' | '500' | '600' | '700' | '800'): TextStyle =>
  Platform.OS === 'web' ? { fontFamily: fonts.sans, fontWeight: w } : { fontFamily: PRE[w] };

/** 숫자·제목 강조 (예전 명조 자리) */
export const serif: TextStyle = { fontFamily: fonts.serif };

/** 자간은 디자인의 -0.04em 에 맞춘다 */
export const txt = {
  title: { ...sansW('800'), fontSize: 24, lineHeight: 32, letterSpacing: -1, color: colors.ink },
  h2: { ...sansW('600'), fontSize: 18, lineHeight: 25, letterSpacing: -0.5, color: colors.ink },
  h3: { ...sansW('700'), fontSize: 16, lineHeight: 22, letterSpacing: -0.6, color: colors.ink },
  body: { ...sansW('400'), fontSize: 14, lineHeight: 21, letterSpacing: -0.5, color: colors.inkSub },
  bodyStrong: { ...sansW('600'), fontSize: 15, lineHeight: 22, letterSpacing: -0.5, color: colors.ink },
  small: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.5, color: colors.inkMute },
  caption: { ...sansW('500'), fontSize: 12, lineHeight: 17, letterSpacing: -0.4, color: colors.inkMute },
} satisfies Record<string, TextStyle>;

/** 반경: 카드 12 · 버튼/탭 8 · 탭 손잡이 5 · 칩 알약 */
export const radius = { xs: 5, sm: 8, md: 8, lg: 12, xl: 12, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, section: 32 };
export const SCREEN_PX = 24;

/** 카드는 평평하게(연회색 면), 떠 있는 것만 그림자 */
export const shadow = {
  card: { shadowColor: '#000', shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  hero: { shadowColor: '#000', shadowOpacity: isDark ? 0.4 : 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  float: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: -4 }, elevation: 12 },
} satisfies Record<string, ViewStyle>;
