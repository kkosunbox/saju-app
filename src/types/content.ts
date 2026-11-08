/** Free content results (computed by the server, same shape as the prototype). */
import { MBTI } from './index';

export interface MbtiMatch { type: MBTI; score: number; nickname: string; reason: string; together: string }
export interface MbtiMatches { best: MbtiMatch[]; worst: MbtiMatch; all: MbtiMatch[] }

export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export interface SajuCharacter {
  name: string; title: string; hanja: string; element: Element; colorHex: string;
  core: string; traits: string[]; inner: string; bestFriend: string; keyword: string;
  /** 찰떡 캐릭터의 일주 한자 (그림 고르기용) · 어떤 사이인지 한 줄 (예: 함께 빛나는 사이) · 이유 문장 */
  bestFriendHanja?: string; bestFriendBasis?: string; bestFriendReasons?: string[];
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
  energy?: 'active' | 'middle' | 'calm';
  affection?: 'clingy' | 'middle' | 'independent';
  courage?: 'bold' | 'middle' | 'shy';
  appetite?: 'foodie' | 'middle' | 'picky';
}
export type PetTraitAxis = keyof PetTraits;
/** 아이가 보호자를 부르는 말 (편지에 쓴다). null이면 닉네임님 */
export type OwnerTitle = '엄마' | '아빠' | '언니' | '누나' | '오빠' | '형' | '집사';
export interface PetInput {
  name: string; species: PetSpecies; gender: 'male' | 'female' | null;
  birthDate: string | null; birthDateIsEstimated: boolean; adoptedDate: string | null; adoptedDateIsEstimated: boolean; traits: PetTraits;
  ownerTitle: OwnerTitle | null;
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
/** 잠긴 동안 보이는 윗부분 (GET /v1/pets) — 나머지는 pet:{id}를 알로 열면 */
export type PetPreview = Pick<PetCompatibility, 'basis' | 'score' | 'type'> & {
  pet: Pick<PetCompatibility['pet'], 'title' | 'stem' | 'element' | 'elementKo' | 'animal' | 'keywords' | 'persona'>;
};
export interface Pet extends PetInput { id: number; result: PetPreview; createdAt: string }
