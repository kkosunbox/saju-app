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
