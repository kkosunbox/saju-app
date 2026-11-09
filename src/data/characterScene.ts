import { BRANCHES, STEMS, type Element } from './sajuData';

/** 천간의 오방색. 배경은 밝게, 글자는 짙게 써서 흰 캐릭터도 또렷하게 보인다. */
export const CHARACTER_PALETTES = {
  wood: { background: '#E3F2EB', floor: '#C4E1D4', accent: '#366C56', ink: '#203F35', soft: '#F3FAF6' },
  fire: { background: '#FBE7E3', floor: '#F2C9C0', accent: '#A04C40', ink: '#633B35', soft: '#FFF6F2' },
  earth: { background: '#F8EFCF', floor: '#E9D99F', accent: '#7E6124', ink: '#55451F', soft: '#FFFBED' },
  metal: { background: '#EEF0F5', floor: '#D6DBE6', accent: '#5B6882', ink: '#394359', soft: '#FFFFFF' },
  water: { background: '#DEE8F3', floor: '#BECEE2', accent: '#49698F', ink: '#263E5D', soft: '#F1F6FC' },
} satisfies Record<Element, { background: string; floor: string; accent: string; ink: string; soft: string }>;

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
