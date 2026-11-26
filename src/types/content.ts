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

/** 천생연분 스타 — 후보 한 명과 나의 점수 (사진 없이 그 스타의 사주 캐릭터로 보여준다) */
export interface StarScore {
  id: number;
  name: string;
  /** 이름 아래 한 줄 (예: 가수 · 배우) */
  description: string;
  gender: 'female' | 'male';
  /** 스타의 일주 한자 — 사주 캐릭터 그림 */
  hanja: string;
  /** 스타의 사주 캐릭터 이름 (예: 푸른 용) */
  character: string;
  element: Element;
  /** 나와의 오늘 궁합 점수 (50~99, 날마다 바뀐다) — 낮아도 그대로 보여준다 */
  score: number;
}

export type StarGender = 'female' | 'male' | 'all';

/** 고르기 목록의 스타 한 명 (점수 없이) */
export type StarCard = Omit<StarScore, 'score'>;

/** 천생연분 스타 뽑기 결과: 뽑힌 한 명 + 가장 잘 맞는 세 명 + 고르기 목록 */
export interface StarMatch {
  gender: StarGender;
  pick: StarScore | null;
  /** 오늘 가장 잘 맞는 세 명 (뽑힌 스타 포함) — 돌림판의 세 칸 */
  finalists: StarScore[];
  poolSize: number;
  /** 남녀 모든 스타, 이름순 */
  stars: StarCard[];
  /** 나의 사주 캐릭터 */
  me: { hanja: string; character: string };
}

/** 스타 한 명과의 궁합 (무료) */
export interface StarMatchDetail extends StarScore {
  /** 양력 생일 — 궁합 상대로 추가할 때 칸을 채운다 */
  birthDate: string;
  /** 타고난 궁합 점수 (score는 여기에 오늘의 기운을 더한 오늘의 점수) */
  baseScore: number;
  /** 오늘 두 사람에게 닿는 기운 한 줄 */
  todayLine: string;
  summary: string;
  /** 두 캐릭터 사이 한 줄 (예: 함께 빛나는 사이) */
  bond: string;
  reasons: string[];
  scores: { love: number; personality: number; conversation: number; life: number };
  together: string[];
  /** 케미 유형 (예: 편안한 케미유형) — 예전 서버에는 없다 */
  chemistry?: { title: string; line: string; tags: string[] };
  /** 만약 우리가 연인이라면 — 먼저 다가가는 쪽과 연애 스타일 */
  lover?: { first: 'me' | 'star'; style: string };
  /** 드라마 속 우리라면 — 로맨스 장르 (key로 그림을 고른다) */
  drama?: { key: 'friends' | 'reunion' | 'status' | 'fate'; title: string; line: string };
  /** 이런 순간 잘 맞아요 — 세 장면 */
  moments?: { title: string; text: string }[];
  me: { hanja: string; character: string; element: Element };
}

/* ---------- MBTI × 일간 (서버 계산, GET /v1/contents/day-stem) ---------- */
export interface DayStemMbti {
  /** 예: 무토남 */
  label: string;
  /** 예: 무토 */
  stemName: string;
  /** 예: 戊土 */
  hanja: string;
  element: Element;
  colorHex: string;
  isYang: boolean;
  /** 일간의 상징 (예: 큰 산) */
  image: string;
  mbti: MBTI;
  /** 예: ISTP × 무토남 */
  title: string;
  tags: string[];
  /** 일간오행 풀이 */
  story: string;
  strengths: string[];
  /** 이 MBTI와 이 일간이 만난 사람 — 세 문단 (에너지 · 생각과 판단 · 생활 리듬) */
  meet: string[];
  love: string;
  work: string;
  friend: string;
}
