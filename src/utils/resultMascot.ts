import type { Element } from '../types/content';

export type MascotMood = 'bright' | 'calm' | 'gentle';
export type MascotAccessory = 'heart' | 'coin' | 'pencil' | 'ribbon' | 'cloud' | 'star';
export type MascotScores = { totalScore: number; love: number; money: number; work: number; relationship: number };
export interface ResultMascotState {
  element: Element | null;
  mood: MascotMood;
  accessory: MascotAccessory | null;
  label: string;
}

const ELEMENTS: Element[] = ['wood', 'wood', 'fire', 'fire', 'earth', 'earth', 'metal', 'metal', 'water', 'water'];
export const MASCOT_NAMES: Record<Element, string> = {
  wood: '새싹 젤리', fire: '불꽃 젤리', earth: '포근 젤리', metal: '진주 젤리', water: '물방울 젤리',
};
const THEMES = [
  { key: 'love', accessory: 'heart', label: '하트를 안고 인연을 응원해요' },
  { key: 'money', accessory: 'coin', label: '동전과 함께 기회를 응원해요' },
  { key: 'work', accessory: 'pencil', label: '연필을 들고 도전을 응원해요' },
  { key: 'relationship', accessory: 'ribbon', label: '리본과 함께 만남을 응원해요' },
] as const;

/** 운세 날짜의 일간(0=갑 … 9=계)으로 타입, 공개된 점수로 표정·소품을 정한다. 동점은 위 순서로 고정. */
export function getResultMascot(dayStem?: number, scores?: MascotScores): ResultMascotState {
  const element = dayStem !== undefined && Number.isInteger(dayStem) ? ELEMENTS[dayStem] ?? null : null;
  const name = element ? MASCOT_NAMES[element] : '무지개 젤리';
  const base: ResultMascotState = { element, mood: 'calm', accessory: null, label: name };
  if (!scores || ![scores.totalScore, ...THEMES.map(t => scores[t.key])].every(n => Number.isFinite(n) && n >= 0 && n <= 100)) return base;
  // 낮은 점수에도 슬프거나 겁주는 표정 대신 휴식을 권하는 부드러운 모습을 쓴다.
  if (scores.totalScore < 60) return { element, mood: 'gentle', accessory: 'cloud', label: `${name}, 구름에 기대어 쉬어가요` };
  const mood: MascotMood = scores.totalScore >= 80 ? 'bright' : 'calm';
  const best = THEMES.reduce((a, b) => scores[b.key] > scores[a.key] ? b : a);
  if (scores[best.key] >= 75) return { element, mood, accessory: best.accessory, label: `${name}, ${best.label}` };
  return { element, mood, accessory: 'star', label: `${name}, 작은 별과 함께 오늘을 응원해요` };
}
