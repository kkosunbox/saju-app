export const colors = {
  // 브랜드
  purple: '#3D2A78',
  purpleDeep: '#231651',
  purpleSoft: '#6B57B8',
  purpleMist: '#8E7FD0',
  lavender: '#E9E3FF',
  lavenderSoft: '#F5F2FF',
  cream: '#FAF8F4',
  white: '#FFFFFF',
  moon: '#FFE3A3',

  // 텍스트
  ink: '#1C1530',
  inkSub: '#5B5470',
  inkMute: '#9993AA',
  line: '#EEEAF5',
  lineStrong: '#E0DAEC',

  // 분야별 포인트
  love: '#E8628F',
  loveBg: '#FDEEF3',
  money: '#C4952A',
  moneyBg: '#FBF3DF',
  work: '#4574D1',
  workBg: '#EAF0FC',
  relation: '#35996D',
  relationBg: '#E5F4EC',

  danger: '#D25A5A',
  success: '#35996D',
};

export type CategoryKey = 'love' | 'money' | 'work' | 'relationship';

export const categoryTheme: Record<CategoryKey, { label: string; short: string; emoji: string; color: string; bg: string }> = {
  love: { label: '연애운', short: '연애', emoji: '❤️', color: colors.love, bg: colors.loveBg },
  money: { label: '재물운', short: '재물', emoji: '💰', color: colors.money, bg: colors.moneyBg },
  work: { label: '직장·사업운', short: '직장', emoji: '💼', color: colors.work, bg: colors.workBg },
  relationship: { label: '인간관계운', short: '관계', emoji: '🤝', color: colors.relation, bg: colors.relationBg },
};

/** 4가지 분석 관점별 고유 컬러 — 카드가 한눈에 구분되도록 */
export type SourceKey = 'saju' | 'thai' | 'mbti' | 'blood';
export const analysisTheme: Record<SourceKey, { label: string; sub: string; emoji: string; color: string; bg: string }> = {
  saju: { label: '사주', sub: '타고난 기운', emoji: '🔮', color: '#5B4BB7', bg: '#EFECFB' },
  thai: { label: '태국 점성술', sub: '요일의 행성', emoji: '🌙', color: '#C27A2C', bg: '#FBF0E1' },
  mbti: { label: 'MBTI', sub: '지금의 성향', emoji: '🧠', color: '#2A8886', bg: '#E2F2F1' },
  blood: { label: '혈액형', sub: '기질 한마디', emoji: '🩸', color: '#C24C5C', bg: '#FAE8EA' },
};

export const gradients = {
  hero: ['#7461C4', '#46318A', '#231651'] as const,
  night: ['#2E2066', '#1A1040'] as const,
  soft: ['#F5F2FF', '#EDE7FF'] as const,
};
