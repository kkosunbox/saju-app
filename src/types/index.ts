export type Gender = 'female' | 'male';
export type BloodType = 'A' | 'B' | 'O' | 'AB';
export type MBTI =
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

/** 출생지 (서버 GET /birth-places) — 태어난 시간을 해석하는 기준 (시간대·경도는 서버만 안다) */
export interface BirthPlace {
  id: number;
  /** 포항시 · 로스앤젤레스 (해외는 한글 이름이 없으면 영어) */
  name: string;
  /** 해외 도시의 영어 이름 (name이 한글일 때만) */
  englishName: string | null;
  /** 경북 · 북한 함북 · 미국 · 미 태평양 시간 (특별·광역시는 null) */
  region: string | null;
}

/** Firebase/Supabase users 테이블과 1:1 대응 */
export interface User {
  id: string;
  nickname: string;
  birthDate: string; // YYYY-MM-DD (양력)
  birthTime: string | null; // HH:mm, 모르면 null
  gender: Gender;
  mbti: MBTI;
  /** 가입 때 MBTI를 건너뛰어 사주로 추정한 값이면 true */
  mbtiUnknown?: boolean;
  bloodType: BloodType;
  occupation?: string;
  interests?: Interest[];
  concern?: string;
  createdAt: string;
  /** Server profile fields (the calendar the user entered the birthday in, …). */
  birthDateInput?: string;
  calendarType?: 'solar' | 'lunar';
  isLeapMonth?: boolean;
  useYajasi?: boolean;
  /** 출생지. null이면 모름 (서울로 계산) */
  birthPlace?: BirthPlace | null;
  version?: number;
  /** 원국 · 오행 · 태어난 요일 (서버 계산). */
  natal?: import('./content').Natal;
}

export type Interest = 'love' | 'money' | 'work' | 'relationship' | 'health' | 'study';

/** 운세 키워드 태그 — 각 모듈이 공통 어휘로 말해야 "공통 키워드"를 뽑을 수 있다 */
export type KeywordTag =
  | 'newMeeting' | 'change' | 'opportunity' | 'money' | 'rest'
  | 'focus' | 'expression' | 'caution' | 'harmony' | 'challenge'
  | 'intuition' | 'learning';

export interface AnalysisResult {
  source: 'saju' | 'thai' | 'mbti' | 'blood';
  title: string;
  emoji: string;
  headline: string; // 한 줄 결과
  details: { label: string; value: string }[];
  description: string; // 2~3문장 해석
  tags: KeywordTag[]; // 오늘 강하게 작용하는 키워드
  scoreBias: { love: number; money: number; work: number; relationship: number }; // -10 ~ +10
  /** 점성술만: 서양 · 인도 · 태국 각각의 풀이 (예전에 저장된 운세에는 없다) */
  systems?: AstroSystemReading[];
}

export interface AstroSystemReading {
  system: 'western' | 'vedic' | 'thai';
  title: string;
  headline: string;
  details: { label: string; value: string }[];
  description: string;
  tags: KeywordTag[];
  scoreBias: AnalysisResult['scoreBias'];
}

/** AI(또는 규칙 엔진)가 반드시 반환해야 하는 JSON 구조 */
export interface CombinedFortune {
  totalScore: number;
  summary: string;
  keywords: string[];
  commonKeywords: string[];
  love: number;
  money: number;
  work: number;
  relationship: number;
  categoryTexts: { love: string; money: string; work: string; relationship: string };
  /** 홈 카드용 두 문장 요약 */
  storyBrief: string;
  /** 종합 풀이 문단 (오늘의 흐름 · 다른 관점에서 · 오늘의 중심) */
  storySections: { title: string; body: string }[];
  /** storySections 본문을 빈 줄로 이은 전문 */
  combinedStory: string;
  goodActions: string[];
  avoidActions: string[];
  luckyColor: string;
  luckyColorHex: string;
  luckyNumber: number;
  luckyTime: string;
  /** 행운 색 · 숫자 · 시간을 고른 근거 (한 문장씩). 예전에 저장된 운세에는 없음 */
  luckyReasons?: { color: string; number: string; time: string };
}

export interface DailyFortune {
  userId: string;
  date: string;
  analyses: { saju: AnalysisResult; thai: AnalysisResult; mbti: AnalysisResult; blood: AnalysisResult };
  combined: CombinedFortune;
  engine: 'rule' | 'ai';
  /** 문장이 아직 규칙 엔진 것이고, 뽑으면 AI가 다시 쓴다 (점수·요약은 그대로). */
  textsPending?: boolean;
  /** 그날의 일진 (서버 만세력). */
  dayPillar?: { stem: number; branch: number };
}

/** 궁합 상대와의 관계 */
export type Relationship = 'lover' | 'friend' | 'family' | 'work';

export interface PartnerInput {
  nickname: string;
  birthDate: string;
  birthTime: string | null;
  /** 모르면 null (서울로 계산) */
  birthPlace?: BirthPlace | null;
  gender: Gender;
  /** 모르면 null (궁합에서 빠진다) */
  mbti: MBTI | null;
  bloodType: BloodType | null;
}

export interface CompatibilityResult {
  /** Server record id (궁합 기록). */
  id?: number;
  /** invite: made from an invite link — no partner details. */
  source?: 'manual' | 'invite';
  /** invite 기록에서 나의 쪽 — inviter: 내 링크를 상대가 열어 생김 · friend: 내가 상대 링크를 열어 봄 */
  inviteRole?: 'inviter' | 'friend' | null;
  /** 내 링크로 상대가 본 궁합을 아직 열어 보지 않음 */
  isNew?: boolean;
  relationship: Relationship;
  userId: string;
  target: PartnerInput;
  total: number;
  love: number;
  personality: number;
  conversation: number;
  money: number;
  summary: string;
  /** kind: 풀이의 근거 (상대 MBTI·혈액형을 모르면 zodiac(띠)이 대신하거나 빠진다) */
  points: { title: string; text: string; kind?: 'saju' | 'zodiac' | 'mbti' | 'blood' }[];
  createdAt: string;
}

export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface PeriodFortune {
  period: Period;
  label: string;
  score: number;
  summary: string;
  flow: { label: string; score: number }[];
  focus: string;
  /** 분야별 운세 — 점수 · 풀이 · 가장 좋은 때(요일·주차·달) */
  cats: Record<'love' | 'money' | 'work' | 'relationship', { score: number; text: string; best: string }>;
}
