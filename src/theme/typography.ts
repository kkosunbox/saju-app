import { Platform, TextStyle, ViewStyle } from 'react-native';
import { colors, isDark } from './colors';

/**
 * 타입 시스템
 * - 제목 · 본문 · UI: Pretendard (로고의 둥근 단선 레터링과 어울리는 현대 고딕, 한국어 UI 표준)
 * - 강조(큰 숫자 · 한자 낙관 · 책력 카드 제목 · 인용): Noto Serif KR (한자까지 같은 서체로 일관)
 * 웹은 웹폰트(Pretendard CDN · Google Fonts)를 굵기별로, 네이티브는 굵기별 파일을 따로 불러온다(App.tsx).
 * 네이티브는 굵기마다 다른 글꼴 이름을 써야 해서 display/serif 는 대표 굵기(700) 파일을 쓴다.
 * 두 서체 모두 SIL Open Font License (assets/fonts/LICENSE-*.txt).
 */
export const fonts = {
  serif: Platform.select({ web: "'Noto Serif KR', 'Nanum Myeongjo', serif", default: 'NotoSerifKR-Bold' })!,
  display: Platform.select({ web: "Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif", default: 'Pretendard-Bold' })!,
  sans: Platform.select({ web: "Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif", default: 'Pretendard-Regular' }),
};

/** Pretendard 굵기 → 글꼴 이름 (웹은 굵기로, 네이티브는 굵기별 파일 이름으로) */
const PRE: Record<string, string> = { '400': 'Pretendard-Regular', '500': 'Pretendard-Medium', '600': 'Pretendard-SemiBold', '700': 'Pretendard-Bold', '800': 'Pretendard-Bold' };
export const sansW = (w: '400' | '500' | '600' | '700' | '800'): TextStyle =>
  Platform.OS === 'web' ? { fontFamily: fonts.sans, fontWeight: w } : { fontFamily: PRE[w] };

/** 숫자·제목에 덧붙이는 명조체 */
export const serif: TextStyle = { fontFamily: fonts.serif };

export const txt = {
  title: { fontFamily: fonts.display, fontSize: 25, lineHeight: 34, fontWeight: '700', letterSpacing: -0.7, color: colors.ink },
  h2: { fontFamily: fonts.display, fontSize: 19, lineHeight: 27, fontWeight: '700', letterSpacing: -0.5, color: colors.ink },
  h3: { ...sansW('700'), fontSize: 16, lineHeight: 22, letterSpacing: -0.3, color: colors.ink },
  body: { ...sansW('400'), fontSize: 15, lineHeight: 23, letterSpacing: -0.2, color: colors.inkSub },
  bodyStrong: { ...sansW('600'), fontSize: 15, lineHeight: 22, letterSpacing: -0.2, color: colors.ink },
  small: { ...sansW('500'), fontSize: 13, lineHeight: 19, color: colors.inkMute },
  caption: { ...sansW('500'), fontSize: 12, lineHeight: 17, color: colors.inkMute },
} satisfies Record<string, TextStyle>;

/** 반경: 히어로 18 · 카드 14 · 입력/버튼 10~12 · 칩 6 */
export const radius = { xs: 6, sm: 10, md: 12, lg: 14, xl: 18, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, section: 32 };
export const SCREEN_PX = 20;

/** 그림자는 거의 평평하게, 히어로만 은은하게 */
export const shadow = {
  card: { shadowColor: '#281E0A', shadowOpacity: isDark ? 0.4 : 0.06, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  hero: { shadowColor: '#141623', shadowOpacity: 0.16, shadowRadius: 13, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  float: { shadowColor: '#281E0A', shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: -2 }, elevation: 12 },
} satisfies Record<string, ViewStyle>;
