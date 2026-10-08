export type Gender = 'female' | 'male';
export type BloodType = 'A' | 'B' | 'O' | 'AB';
export type MBTI =
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

/** Firebase/Supabase users 테이블과 1:1 대응 */
export interface User {
  id: string;
  nickname: string;
  birthDate: string; // YYYY-MM-DD (양력)
  birthTime: string | null; // HH:mm, 모르면 null
  gender: Gender;
  mbti: MBTI;
  bloodType: BloodType;
  occupation?: string;
  interests?: Interest[];
  concern?: string;
  createdAt: string;
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
}

export interface CombinedFortuneInput {
  user: User;
  date: string; // YYYY-MM-DD
  saju: AnalysisResult;
  thai: AnalysisResult;
  mbti: AnalysisResult;
  blood: AnalysisResult;
  interests: Interest[];
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
  combinedStory: string;
  goodActions: string[];
  avoidActions: string[];
  luckyColor: string;
  luckyColorHex: string;
  luckyNumber: number;
  luckyTime: string;
}

export interface DailyFortune {
  userId: string;
  date: string;
  analyses: { saju: AnalysisResult; thai: AnalysisResult; mbti: AnalysisResult; blood: AnalysisResult };
  combined: CombinedFortune;
  engine: 'rule' | 'ai';
}

export interface PartnerInput {
  nickname: string;
  birthDate: string;
  birthTime: string | null;
  gender: Gender;
  mbti: MBTI;
  bloodType: BloodType;
}

export interface CompatibilityResult {
  userId: string;
  target: PartnerInput;
  total: number;
  love: number;
  personality: number;
  conversation: number;
  money: number;
  summary: string;
  points: { title: string; text: string }[];
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
}
