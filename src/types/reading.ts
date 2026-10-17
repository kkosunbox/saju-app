/**
 * AI readings of paid contents (server: premium_reading). The server writes them in parts in the
 * background; a screen shows the parts already written and polls until all are done.
 */
export type ReadingStatus = 'writing' | 'done' | 'failed' | 'unavailable';

export interface ReadingView<P = Record<string, unknown>> {
  status: ReadingStatus;
  done: number;
  total: number;
  parts: Partial<P>;
  completedAt: string | null;
}

export interface Titled { title: string; text: string }
export interface FieldText { headline: string; text: string; tip: string }
export interface Period { title: string; text: string }

/** 상세 사주 해석 (server: saju.reading.ts). */
export interface SajuReading {
  core: {
    headline: string; summary: string; outer: string; inner: string; dayPillar: string;
    strengths: Titled[]; cautions: Titled[]; closing: string;
  };
  structure: {
    elements: { text: string; balance: string[] };
    strength: string;
    tenGods: { text: string; talents: Titled[] };
    sinsal: { key: string; text: string }[];
    crossView: string;
  };
  fields: Record<'love' | 'money' | 'work' | 'people' | 'health', FieldText>;
  flow: {
    daeunNow: Period | null;
    daeunNext: Period | null;
    luck: { text: string; habits: string[]; people: string };
  };
}

/** 평생운 · 10년 대운 (server: life.reading.ts). */
export interface LifeReading {
  overview: {
    headline: string; summary: string;
    stages: { title: string; text: string; advice: string }[];
    golden: Titled; rest: Titled; lifeAdvice: string[]; closing: string;
  };
  daeun: { periods: Titled[]; now: { text: string; focus: string[] } | null };
  years: { years: Titled[] };
}

/** 신년운세 (server: year.reading.ts). */
export interface YearReading {
  overview: {
    headline: string; summary: string; energy: string; flags: string[]; cautions: string[];
    luck: { text: string; actions: string[] }; closing: string;
  };
  fields: Record<'money' | 'work' | 'love' | 'health' | 'people' | 'study', { headline: string; text: string; strategy: string }>;
  months: { months: Titled[]; quarters: Titled[] };
}

/** 월별 상세운세 (server: month.reading.ts). */
export interface MonthReading {
  overview: {
    headline: string; summary: string; energy: string;
    fields: Record<'love' | 'money' | 'work' | 'relationship', FieldText>;
    missions: string[]; closing: string;
  };
  days: { weeks: Titled[]; bestDays: string[]; lowDays: string[] };
}

/** 테마 운세 공통 시기 파트 (server: theme.reading.ts). */
export interface ThemeTiming { years: Titled[]; months: string[]; periods: string[]; now: string; luck?: string; move?: string }
export interface ThemeLoveReading {
  core: { headline: string; summary: string; pattern: Titled[]; charms: string[]; cautions: string[]; closing: string };
  match: { match: Titled[]; clash: Titled; signals: string[] };
  timing: ThemeTiming;
}
export interface ThemeMoneyReading {
  core: {
    headline: string; summary: string;
    earn: { text: string; ways: Titled[] }; spend: { text: string; leaks: string[] }; manage: { text: string; habits: string[] };
    closing: string;
  };
  timing: ThemeTiming;
}
export interface ThemeCareerReading {
  core: {
    headline: string; summary: string; type: string; jobs: Titled[]; style: string; leadership: string; environment: string;
    strengths: string[]; weaknesses: string[]; closing: string;
  };
  timing: ThemeTiming;
}
export type ThemeReading = Partial<ThemeLoveReading & ThemeMoneyReading & ThemeCareerReading>;

/** 미래 배우자 리포트 (server: spouse.reading.ts). */
export interface SpouseReading {
  portrait: {
    headline: string; summary: string; traits: Titled[]; look: string; love: string; money: string; work: string;
    signs: string[]; match: string;
  };
  mine: { star: string; seat: string; married: Titled; conflict: string; blind: string[] };
  timing: { years: Titled[]; months: string[]; periods: string[]; meet: { text: string; places: Titled[] }; advice: string[]; closing: string };
}
