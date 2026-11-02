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

/* ---------- 반려동물 궁합 (서버 계산, GET /v1/pets) ---------- */
export type PetSpecies = 'dog' | 'cat' | 'other';
export interface PetTraits {
  energy?: 'active' | 'calm';
  affection?: 'clingy' | 'independent';
  courage?: 'bold' | 'shy';
  appetite?: 'foodie' | 'picky';
}
export type PetTraitAxis = keyof PetTraits;
export interface PetInput {
  name: string; species: PetSpecies; gender: 'male' | 'female' | null;
  birthDate: string | null; birthDateIsEstimated: boolean; adoptedDate: string | null; traits: PetTraits;
}
export interface PetCompatibility {
  basis: { kind: 'birth' | 'adopted'; date: string; estimated: boolean };
  pet: {
    title: string; stem: { ko: string; hanja: string }; element: Element; elementKo: string; animal: string;
    keywords: string[]; persona: string; strength: string; care: string; luckyColor: { name: string; hex: string };
  };
  traits: { axis: PetTraitAxis; label: string; saju: string; owner: string | null; match: boolean | null; text: string }[];
  matched: number; answered: number; score: number;
  type: { key: string; relation: 'peer' | 'resource' | 'output' | 'wealth' | 'officer'; name: string; line: string };
  meToPet: string; petToMe: string;
  points: { kind: 'element' | 'branch' | 'zodiac' | 'fill'; title: string; text: string }[];
  fills: Element[]; play: string[]; goodDays: string[];
}
export interface Pet extends PetInput { id: number; result: PetCompatibility; createdAt: string }
