/**
 * 유료 콘텐츠 결과 — 서버 엔진(/premium/contents/*)이 계산해서 보내는 구조 그대로.
 * 서버의 SajuProfile 만 앱 화면이 쓰던 SajuFull 로 바꿔서 쓴다 (services/premium/premiumApi.ts).
 */
import { CombinedFortune, KeywordTag, MBTI } from './index';
import { Element, TenGodGroup } from '../data/sajuData';
import { Pillar } from './content';

export type Cat = 'love' | 'money' | 'work' | 'relationship';
export type SrcKey = 'saju' | 'thai' | 'mbti' | 'blood';
export type SinsalKey = 'gwiin' | 'munchang' | 'dohwa' | 'yeokma' | 'hwagae' | 'yangin' | 'goegang' | 'baekho';
export type StrengthLevel = '극약' | '신약' | '중화' | '신강' | '극강';
export interface SajuChart { year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null }

/** 서버 SajuProfile (내 사주 원국 분석). */
export interface SajuProfile {
  chart: SajuChart;
  dayStem: number;
  dayElement: Element;
  pillars: [string, Pillar | null][];
  groupCounts: Record<TenGodGroup, number>;
  tenGodCounts: number[];
  elementCounts: Record<Element, number>;
  strength: { level: StrengthLevel; supportRatio: number };
  yongsin: { yongsin: Element; huisin: Element; gisin: Element };
  topTenGods: { index: number; count: number }[];
  sinsal: SinsalKey[];
  groupElements: Record<TenGodGroup, Element>;
  spouseGroup: TenGodGroup;
  dayStage: number;
}

/** 화면에서 쓰는 사주 요약 (짧은 이름). */
export interface SajuFull {
  ch: SajuChart; ds: number; meE: Element; pillars: [string, Pillar | null][];
  grp: Record<TenGodGroup, number>; tgc: number[]; ratio: number; strength: '신강' | '신약' | '중화';
  elc: Record<Element, number>; yong: Element; hee: Element; gi: Element; topTG: { i: number; c: number }[];
  sinsal: SinsalKey[]; gE: Record<TenGodGroup, Element>; spouseGrp: TenGodGroup; dayStage: number;
}

export interface CrossAxis { name: string; pos: string; neg: string; v: Record<SrcKey, number> }
export interface Daeun { age: number; p: Pillar; rel: TenGodGroup; relB: TenGodGroup; score: number }
export interface DaeunTable { fwd: boolean; start: number; list: Daeun[] }

export type StageKey = 'early' | 'mid' | 'late';
export interface LifeStage {
  key: StageKey; label: string; range: string; score: number; rel: TenGodGroup;
  headline: string; desc: string; tags: KeywordTag[]; advice: string; views: Record<SrcKey, string>;
}

export interface MonthAgg { m: number; total: number; love: number; money: number; work: number; relationship: number; kw: string[] }
export type DatedMonth = MonthAgg & { y: number };
export interface YearData {
  y: number; yp: Pillar; rel: TenGodGroup; zr: 'same' | 'clash' | 'harmony' | 'normal'; total: number; months: MonthAgg[];
  cat: Record<Cat, number>; best: MonthAgg[]; low: MonthAgg[]; kws: string[]; qs: number[];
  views: Record<SrcKey, string>; zodiac: [string, string]; animal: string; myAnimal: string;
}

export interface DayEntry { iso: string; d: number; total: number; c: CombinedFortune }
export interface MonthReport {
  y: number; m: number; n: number; days: DayEntry[]; cat: Record<Cat, number>; best: DayEntry[]; low: DayEntry[];
  kws: string[]; missions: string[]; avg: number; first: number;
}

export type PurposeKey = 'move' | 'contract' | 'confess' | 'interview' | 'travel' | 'start';
export interface LuckyDay { iso: string; s: number; c: CombinedFortune; hit: string[]; dp: Pillar; gw: boolean; clash: boolean; tg: number; st: number }
export interface LuckyDays { P: [string, string, string, Cat[], KeywordTag[]]; list: LuckyDay[]; bad: LuckyDay[] }

export interface MoneyType { name: string; emoji: string; desc: string; str: string; watch: string; tip: string }
export interface ThemeLove { st: string; blood: string; types: string[]; yrs: { yy: number; why: string }[]; ms: DatedMonth[]; views: Record<SrcKey, string> }
export interface ThemeMoney { t: MoneyType; cnt: number; wealthEl: Element; ms: DatedMonth[]; views: Record<SrcKey, string> }
export interface ThemeCareer { jobs: string[]; temp: 'NT' | 'NF' | 'SJ' | 'SP'; ups: Daeun[]; style: string[]; views: Record<SrcKey, string> }
/** 테마 운세 응답: 테마 결과 + 10년 대운 */
export type ThemeContent<K extends 'love' | 'money' | 'career'> = (K extends 'love' ? ThemeLove : K extends 'money' ? ThemeMoney : ThemeCareer) & { daeun: DaeunTable };

export interface SpouseYear { yy: number; v: number; why: string[] }
export interface SpouseReport {
  headline: string; spouseEl: Element; look: string; personality: string[];
  persona: { img: string; hanja: string; core: string; str: string[]; watch: string };
  loveStyle: string; moneyStyle: string; jobs: string[]; signs: string[];
  star: { n: number; text: string; type: string[] | null };
  seatNote: string[]; stage: [string, string];
  mbti: MBTI[]; mbtiWhy: string; avoidMbti: MBTI; animals: string[]; avoidAnimals: string[];
  ageGap: string; ageWhy: string; yearIdx: SpouseYear[]; bestYear: SpouseYear;
  years: { yy: number; why: string }[]; months: DatedMonth[]; daeLove: Daeun[];
  places: string[]; meetWay: string; first: string; home: [string, string]; blind: string[]; advice: string[];
  views: Record<SrcKey, string>;
}

export interface CrushReport {
  temp: number; chance: number; tg: string; feel: string; relLine: string; pull: string;
  signals: string[]; pace: string[]; caution: string; flow: { label: string; v: number }[];
  contact: { iso: string; label: string }[]; confess: { label: string; time: string; place: string };
  topics: string[]; messages: string[]; dos: string[]; donts: string[]; oneLine: string; today: number;
}

/** 심층 궁합의 근거 데이터 (서버 DeepCompatibility). */
export interface DeepCompatibility {
  me: SajuProfile; partner: SajuProfile;
  stemHap: boolean; dayHap: boolean; daySamhap: boolean; dayClash: boolean;
  zodiac: 'same' | 'clash' | 'harmony' | 'normal'; zodiacWonjin: boolean;
  tenGodMeToPartner: number; tenGodPartnerToMe: number;
  partnerFillsMe: Element[]; meFillsPartner: Element[];
  partnerHasMyYongsin: boolean; meHasPartnerYongsin: boolean;
  sameAxes: number[]; differentAxes: number[];
  goodDays: { iso: string; d: number; s: number }[];
}

/* ---------- 미리보기 (열기 전 무료 상단) ---------- */
export interface SajuPreview { strength: StrengthLevel; yongsin: Element }
export interface LifePreview { strength: StrengthLevel; chart: { a: number; v: number }[] }
export type YearPreview = Pick<YearData, 'y' | 'yp' | 'rel' | 'total' | 'kws' | 'animal' | 'myAnimal'>;
export type MonthPreview = Pick<MonthReport, 'y' | 'm' | 'n' | 'avg' | 'kws'>;
export type ThemePreview =
  | { kind: 'love'; st: string; blood: string }
  | { kind: 'money'; t: MoneyType }
  | { kind: 'career'; jobs: string[] };
export interface LuckyPreview { top: { iso: string; s: number } }
export interface SpousePreview { spouseEl: Element; headline: string; mbti: MBTI; animal: string; ageGap: string; thisYear: number; bestYear: number }
