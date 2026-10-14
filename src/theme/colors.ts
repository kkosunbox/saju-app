/**
 * 책력(冊曆) 디자인 시스템 — 한지 바탕 · 먹색 남색 · 낙관(도장) 붉은색.
 * 화면 모드는 마이 > 화면 모드(시스템·라이트·다크)를 따른다. 앱 시작 시 결정(index.ts가 먼저 읽음).
 * - purple: 글자·강조용 (다크에서 밝아짐)   - navy: 채움용 (버튼·선택 상태, 다크에서도 그대로)
 */
import { Appearance } from 'react-native';
import { readThemePrefSync } from './themePref';

const pref = readThemePrefSync();
export const isDark = pref === 'dark' ? true : pref === 'light' ? false : Appearance.getColorScheme() === 'dark';

const light = {
  purple: '#22293F',
  purpleDeep: '#161A27',
  purpleSoft: '#56648A',
  lavender: '#E3DFD5',
  lavenderSoft: '#ECE7DC',
  cream: '#F3EEE4', // 화면 바탕
  card: '#FFFDF8',
  frame: '#E2DCD0', // 데스크톱 웹에서 앱 바깥
  ink: '#1C1A17',
  inkSub: '#58524A',
  inkMute: '#736B5F',
  line: '#E8E1D4',
  lineStrong: '#DCD3C3',
  love: '#A84A50', loveBg: '#F3E4E0',
  money: '#93702A', moneyBg: '#F1E8D4',
  work: '#33507F', workBg: '#E3E8EF',
  relation: '#3F7258', relationBg: '#E2EBE3',
  saju: '#2D3A5C', sajuBg: '#E4E6EC',
  thai: '#A06428', thaiBg: '#F2E6D6',
  mbti: '#3B6E68', mbtiBg: '#DFEAE7',
  blood: '#A23E48', bloodBg: '#F3E2E1',
  okBg: '#E2EBE3', careBg: '#F2E6D6',
  badge: '#7E5C1A', badgeBg: '#F2E8D2',
  danger: '#B5432E',
  success: '#3F7258',
};

const dark: typeof light = {
  ...light,
  purple: '#C9D0E6',
  purpleSoft: '#9AA6C7',
  lavender: '#2D3140',
  lavenderSoft: '#24272F',
  cream: '#151411',
  card: '#1E1C18',
  frame: '#0D0C0A',
  ink: '#EDE7DB',
  inkSub: '#BDB4A4',
  inkMute: '#9A9283',
  line: '#2B2823',
  lineStrong: '#38342D',
  love: '#D58A8C', loveBg: '#35221F',
  money: '#CDA559', moneyBg: '#332B1A',
  work: '#8FA6CF', workBg: '#1E2533',
  relation: '#86B596', relationBg: '#1D2B23',
  saju: '#9DAAD0', sajuBg: '#232836',
  thai: '#D59A5C', thaiBg: '#33281B',
  mbti: '#7FB3AC', mbtiBg: '#1B2B29',
  blood: '#D7878D', bloodBg: '#35201F',
  okBg: '#1D2B23', careBg: '#33281B',
  badge: '#EAC56B', badgeBg: '#3A2E14',
  success: '#86B596',
};

export const colors = {
  ...(isDark ? dark : light),
  // 모드와 무관한 고정색
  navy: '#22293F',
  heroBg: '#1F2433',
  moon: '#D9B872',
  seal: '#B5432E',
  white: '#FFFFFF',
};

export type CategoryKey = 'love' | 'money' | 'work' | 'relationship';

/** emoji 자리는 한자 도장(낙관) */
export const categoryTheme: Record<CategoryKey, { label: string; short: string; emoji: string; color: string; bg: string }> = {
  love: { label: '연애운', short: '연애', emoji: '緣', color: colors.love, bg: colors.loveBg },
  money: { label: '재물운', short: '재물', emoji: '財', color: colors.money, bg: colors.moneyBg },
  work: { label: '직장·사업운', short: '직장', emoji: '業', color: colors.work, bg: colors.workBg },
  relationship: { label: '인간관계운', short: '관계', emoji: '人', color: colors.relation, bg: colors.relationBg },
};

/** 4가지 분석 관점별 고유 색 */
export type SourceKey = 'saju' | 'thai' | 'mbti' | 'blood';
export const analysisTheme: Record<SourceKey, { label: string; sub: string; emoji: string; color: string; bg: string }> = {
  saju: { label: '사주', sub: '타고난 기운', emoji: '命', color: colors.saju, bg: colors.sajuBg },
  thai: { label: '태국 점성술', sub: '요일의 행성', emoji: '星', color: colors.thai, bg: colors.thaiBg },
  mbti: { label: 'MBTI', sub: '지금의 성향', emoji: '性', color: colors.mbti, bg: colors.mbtiBg },
  blood: { label: '혈액형', sub: '기질 한마디', emoji: '血', color: colors.blood, bg: colors.bloodBg },
};

/** 히어로는 그라디언트 없이 단색 먹색 */
export const gradients = {
  hero: [colors.heroBg, colors.heroBg, colors.heroBg] as const,
  night: ['#1F2433', '#12151F'] as const,
  soft: [colors.lavenderSoft, colors.lavenderSoft] as const,
};
