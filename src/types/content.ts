/** Free content results (computed by the server, same shape as the prototype). */
import { MBTI } from './index';

export interface MbtiMatch { type: MBTI; score: number; nickname: string; reason: string; together: string }
export interface MbtiMatches { best: MbtiMatch[]; worst: MbtiMatch; all: MbtiMatch[] }

export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export interface SajuCharacter {
  name: string; title: string; hanja: string; element: Element; colorHex: string;
  core: string; traits: string[]; inner: string; bestFriend: string; keyword: string;
}

export interface Talisman {
  hanja: string; keyword: string; mantra: string;
  color: string; colorHex: string; number: number; time: string; score: number;
}

export interface PastLife { title: string; era: string; role: string; scene: string; carried: string; karma: string; bond: string; hanja: string }

/** 원국 4주 · 오행 개수 · 태국 점성술의 태어난 요일 (서버 만세력 기준). */
export interface Natal {
  chart: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null };
  elementCounts: Record<Element, number>;
  thaiBirthDay: 'sun' | 'mon' | 'tue' | 'wedDay' | 'wedNight' | 'thu' | 'fri' | 'sat';
}
export interface Pillar { stem: number; branch: number }
