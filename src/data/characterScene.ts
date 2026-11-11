import { BRANCHES, STEMS, type Element } from './sajuData';

/** 천간의 오방색. 배경은 밝게, 글자는 짙게 써서 흰 캐릭터도 또렷하게 보인다. */
export const CHARACTER_PALETTES = {
  wood: { background: '#E3F2EB', floor: '#C4E1D4', accent: '#366C56', ink: '#203F35', soft: '#F3FAF6' },
  fire: { background: '#FBE7E3', floor: '#F2C9C0', accent: '#A04C40', ink: '#633B35', soft: '#FFF6F2' },
  earth: { background: '#F8EFCF', floor: '#E9D99F', accent: '#7E6124', ink: '#55451F', soft: '#FFFBED' },
  metal: { background: '#EEF0F5', floor: '#D6DBE6', accent: '#5B6882', ink: '#394359', soft: '#FFFFFF' },
  water: { background: '#DEE8F3', floor: '#BECEE2', accent: '#49698F', ink: '#263E5D', soft: '#F1F6FC' },
} satisfies Record<Element, { background: string; floor: string; accent: string; ink: string; soft: string }>;

/**
 * 공유 카드 배경 5종 (Figma 505:3403 — 금 489:3136 · 화 491:3576 · 목 505:3188 · 토 505:3256 · 수 505:3323).
 * card: 카드 바탕 그라디언트 3색 · frame: 액자 안쪽 위 색(아래는 흰색으로 흐린다)
 * border: 액자 테두리 그라디언트 4색 · core: 한 줄 성격 글자색.
 * frame은 캐릭터 화면 첫 정보 박스 색, heart는 그 박스의 특징 하트 색(금은 Figma 489:3030 #9687E2, 나머지는 박스 색에 맞춘 중간 톤).
 */
export const CHARACTER_SHARE_THEMES = {
  metal: { card: ['#3E4C6D', '#C8CEE0', '#EBEEF3'], frame: '#D9E1FF', border: ['#2E489B', '#E7EAB8', '#B1BEF5', '#AEB9EA'], core: '#1FA6FD', heart: '#9687E2' },
  fire: { card: ['#FA7D68', '#FBE8E2', '#FFF6F1'], frame: '#FBE7E6', border: ['#E09575', '#E7EAB8', '#FBD9BD', '#FEECD4'], core: '#653F3A', heart: '#EE8C7C' },
  wood: { card: ['#A5C69D', '#F4F8E7', '#E3F3E9'], frame: '#F4F7E2', border: ['#5CC867', '#E7EAB8', '#ACE3A9', '#A2DFA3'], core: '#3A6540', heart: '#74BC7C' },
  earth: { card: ['#ECAC65', '#F8EEE7', '#F3E9D1'], frame: '#FCF1CF', border: ['#C88E5C', '#E7EAB8', '#E3CBA9', '#DFCDA2'], core: '#654C3A', heart: '#D9A066' },
  water: { card: ['#6297D1', '#E7ECF8', '#D1E0F3'], frame: '#DEE6FF', border: ['#5C7CC8', '#B8CEEA', '#A9B3E3', '#C5C1E4'], core: '#3A3D65', heart: '#7C9BDB' },
} satisfies Record<Element, { card: readonly [string, string, string]; frame: string; border: readonly [string, string, string, string]; core: string; heart: string }>;

/** 캐릭터 크기에 대한 풍경 높이의 비율. */
export const CHARACTER_SCENE_HEIGHT = 1.35;

/** 오행의 성질을 한자 없이 바로 읽을 수 있는 말로 표시한다. */
export const CHARACTER_ENERGY_LABELS = {
  wood: '성장의 기운',
  fire: '열정의 기운',
  earth: '안정의 기운',
  metal: '결단의 기운',
  water: '지혜의 기운',
} satisfies Record<Element, string>;

const COLOR_NAMES = ['푸른', '푸른', '붉은', '붉은', '노란', '노란', '하얀', '하얀', '검은', '검은'];
const PILLARS = Array.from({ length: 60 }, (_, i) => STEMS[i % 10].hanja + BRANCHES[i % 12].hanja);
const NAMES = Array.from({ length: 60 }, (_, i) => `${COLOR_NAMES[i % 10]} ${BRANCHES[i % 12].animal}`);

export function characterIndex(hanja?: string, name?: string) {
  const index = hanja ? PILLARS.indexOf(hanja) : -1;
  return index >= 0 ? index : name ? NAMES.indexOf(name) : -1;
}

/** 그림과 동일하게 유효한 60갑자만 선택하며, 한자가 없으면 찰떡 캐릭터 이름을 사용한다. */
export function characterScene(hanja?: string, name?: string) {
  const index = characterIndex(hanja, name);
  if (index < 0) return null;
  const element = STEMS[index % 10].element;
  return { element, palette: CHARACTER_PALETTES[element], energyLabel: CHARACTER_ENERGY_LABELS[element] };
}
