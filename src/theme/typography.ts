import { TextStyle, ViewStyle } from 'react-native';
import { colors } from './colors';

/**
 * 모바일 타입 스케일 (시스템 폰트 기준, 출시 전 Pretendard 적용 권장)
 * 제목은 무겁게·좁게, 본문은 15/22로 가독성 우선.
 */
export const txt = {
  title: { fontSize: 24, lineHeight: 32, fontWeight: '800', letterSpacing: -0.6, color: colors.ink },
  h2: { fontSize: 18, lineHeight: 26, fontWeight: '700', letterSpacing: -0.4, color: colors.ink },
  h3: { fontSize: 16, lineHeight: 22, fontWeight: '700', letterSpacing: -0.3, color: colors.ink },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400', letterSpacing: -0.2, color: colors.inkSub },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2, color: colors.ink },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '500', color: colors.inkMute },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', color: colors.inkMute },
} satisfies Record<string, TextStyle>;

export const radius = { xs: 8, sm: 12, md: 16, lg: 20, xl: 28, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, section: 32 };
export const SCREEN_PX = 20;

/** 보라 톤 그림자: 회색 그림자보다 배경과 자연스럽게 섞인다 */
export const shadow = {
  card: { shadowColor: '#2A1B5C', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  hero: { shadowColor: '#3D2A78', shadowOpacity: 0.32, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 10 },
  float: { shadowColor: '#2A1B5C', shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: -2 }, elevation: 12 },
} satisfies Record<string, ViewStyle>;
