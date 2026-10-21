/**
 * 운픽 디자인 시스템 — 흰 바탕 · 하늘색 그라디언트 · 연회색 카드 · 먹남색 버튼 · 마스코트.
 * 화면 모드는 마이 > 화면 모드(시스템·라이트·다크)를 따른다. 앱 시작 시 결정(index.ts가 먼저 읽음).
 * - purple: 강조 글자 (다크에서 밝아짐)   - purpleSoft: 링크·보조 강조(파랑)
 * - navy: 채움용 (버튼·선택 상태)          - accent: 하늘색 포인트 (보내기 버튼·테두리·차트 최고값)
 * 이름(purple·cream 등)은 예전 책력 디자인에서 물려받은 의미 이름이다.
 */
import { Appearance } from 'react-native';
import { readThemePrefSync } from './themePref';

const pref = readThemePrefSync();
export const isDark = pref === 'dark' ? true : pref === 'light' ? false : Appearance.getColorScheme() === 'dark';

const light = {
  purple: '#1D212D',
  purpleDeep: '#12151F',
  purpleSoft: '#4392F7',
  lavender: '#E2E2E2',
  lavenderSoft: '#F5F6F8',
  cream: '#FFFFFF', // 화면 바탕
  card: '#F5F6F8', // 카드 바탕(연회색)
  surface: '#FFFFFF', // 카드 안의 흰 칸
  frame: '#EEF1F5', // 데스크톱 웹에서 앱 바깥
  ink: '#222222',
  inkSub: '#4F4F4F',
  inkMute: '#777777',
  line: '#ECEEF2',
  lineStrong: '#E2E2E2',
  accent: '#28B2FE',
  accentSoft: '#EAF7FF',
  love: '#E54D4D', loveBg: '#FDECEC',
  money: '#E8A23A', moneyBg: '#FFF4DE',
  work: '#3B74D6', workBg: '#E6F0FD',
  relation: '#3DAA6A', relationBg: '#E5F6EC',
  saju: '#DB7500', sajuBg: '#FFF6D9',
  thai: '#B57506', thaiBg: '#FFF1D6',
  mbti: '#1E53A2', mbtiBg: '#E3F4FB',
  blood: '#DD2828', bloodBg: '#FCE7E0',
  okBg: '#E5F6EC', careBg: '#FFF1D6',
  badge: '#B57506', badgeBg: '#FFF4DE',
  danger: '#E54D4D',
  success: '#3DAA6A',
  navy: '#1D212D',
};

const dark: typeof light = {
  ...light,
  purple: '#EEF0F5',
  purpleSoft: '#7DB6FF',
  lavender: '#3A3F4C',
  lavenderSoft: '#242833',
  cream: '#121418',
  card: '#1D2027',
  surface: '#2A2E38',
  frame: '#0A0B0E',
  ink: '#EEF0F5',
  inkSub: '#C2C6D0',
  inkMute: '#9095A1',
  line: '#272B34',
  lineStrong: '#343945',
  accentSoft: '#15283A',
  love: '#F07E7E', loveBg: '#3A2124',
  money: '#F1BA5E', moneyBg: '#372C18',
  work: '#7EA6EE', workBg: '#1C2738',
  relation: '#6FCB94', relationBg: '#1A2E23',
  saju: '#F0A04A', sajuBg: '#382A16',
  thai: '#E0A548', thaiBg: '#372B17',
  mbti: '#7FB0F0', mbtiBg: '#182A3A',
  blood: '#F08080', bloodBg: '#3A2020',
  okBg: '#1A2E23', careBg: '#372B17',
  badge: '#F1BA5E', badgeBg: '#372C18',
  success: '#6FCB94',
  navy: '#3A4152',
};

export const colors = {
  ...(isDark ? dark : light),
  // 모드와 무관한 고정색
  heroBg: '#1D212D', // 어두운 프로모션 카드
  moon: '#FFCB3C', // 포인트 동전 · 금색 강조
  seal: '#FF7A3C', // NEW · 오늘 표시 같은 주황 포인트
  white: '#FFFFFF',
};

export type CategoryKey = 'love' | 'money' | 'work' | 'relationship';

/** emoji 자리는 옛 한자 낙관(공유 카드 등에서 아직 쓴다). 화면 아이콘은 CategoryIcon */
export const categoryTheme: Record<CategoryKey, { label: string; short: string; emoji: string; color: string; bg: string }> = {
  love: { label: '연애운', short: '연애', emoji: '緣', color: colors.love, bg: colors.loveBg },
  money: { label: '재물운', short: '재물', emoji: '財', color: colors.money, bg: colors.moneyBg },
  work: { label: '직장·사업운', short: '직장', emoji: '業', color: colors.work, bg: colors.workBg },
  relationship: { label: '인간관계운', short: '관계', emoji: '人', color: colors.relation, bg: colors.relationBg },
};

/** 4가지 분석 관점별 고유 색 · 타일 그라디언트 */
export type SourceKey = 'saju' | 'thai' | 'mbti' | 'blood';
export const analysisTheme: Record<SourceKey, { label: string; sub: string; emoji: string; color: string; bg: string; tile: readonly [string, string] }> = {
  saju: { label: '사주', sub: '타고난 기운', emoji: '命', color: colors.saju, bg: colors.sajuBg, tile: isDark ? ['#3A3218', '#25221A'] : ['#FCEFA4', '#FFFADD'] },
  thai: { label: '점성술', sub: '별과 행성', emoji: '星', color: colors.thai, bg: colors.thaiBg, tile: isDark ? ['#3A2E18', '#26221A'] : ['#FFEBC2', '#FFFAEC'] },
  mbti: { label: 'MBTI', sub: '지금의 성향', emoji: '性', color: colors.mbti, bg: colors.mbtiBg, tile: isDark ? ['#18303A', '#1A2328'] : ['#C7E9F6', '#F3FCFF'] },
  blood: { label: '혈액형', sub: '기질 한마디', emoji: '血', color: colors.blood, bg: colors.bloodBg, tile: isDark ? ['#3A2420', '#28201E'] : ['#F6D4C7', '#FFF4F0'] },
};

export const gradients = {
  hero: [colors.heroBg, colors.heroBg, colors.heroBg] as const,
  night: ['#1D212D', '#12151F'] as const,
  soft: [colors.lavenderSoft, colors.lavenderSoft] as const,
  /** 홈 상단 하늘 (진한 하늘 → 흰색) */
  sky: isDark ? (['#123A55', '#16222E', colors.cream] as const) : (['#15ABFE', '#C8EBFF', '#FFFFFF'] as const),
  /** 상세 화면 상단의 옅은 하늘 */
  skySoft: isDark ? (['#16283A', colors.cream] as const) : (['#C8EBFF', '#FFFFFF'] as const),
  /** 점수 카드 · 운세 히어로 */
  skyCard: isDark ? (['#163148', colors.card] as const) : (['#AFE2FF', '#FFFFFF'] as const),
  /** 하늘색 테두리 (입력창 · 강조 카드) */
  border: ['#1BADFE', '#C4E3F3', '#3BB9FE'] as const,
};
