import type { DailyFortune } from '../types';

/** 앱이 '오늘의 운세' 위젯에 넣는 값 (iOS · Android 공통). 위젯은 이것만 보고 그린다. */
export interface FortuneWidgetProps {
  /** ready: 이 날짜의 운세가 있다 · stale: 앱이 넣어 둔 날짜가 지났다 · signedOut: 프로필 없음 */
  state: 'ready' | 'stale' | 'signedOut';
  /** KST 날짜 (YYYY-MM-DD) */
  date?: string;
  /** 머리줄 날짜 (예: '11월 12일 목') */
  dateLabel?: string;
  /** 점수·요약을 보여 주는지 (위젯에서 뽑았거나, 앱·다른 기기에서 이미 뽑음) */
  revealed?: boolean;
  score?: number;
  /** 어제 종합 점수와의 차이. 어제 기록이 없으면 null */
  delta?: number | null;
  summary?: string;
  /** '#키워드 #키워드' */
  keywords?: string;
  luckyColor?: string;
  luckyNumber?: number;
  luckyTime?: string;
}

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

/** 운세 한 날치를 위젯 값으로. revealed는 서버가 뽑았다고 한 경우만 true (위젯에서 뽑은 건 위젯이 기억한다) */
export function toFortuneWidgetProps(f: DailyFortune): FortuneWidgetProps {
  const [y, m, d] = f.date.split('-').map(Number);
  const c = f.combined;
  return {
    state: 'ready',
    date: f.date,
    dateLabel: `${m}월 ${d}일 ${WEEK[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}`,
    revealed: !!f.drawn,
    score: c.totalScore,
    delta: f.yesterdayScores ? c.totalScore - f.yesterdayScores.totalScore : null,
    summary: c.summary,
    keywords: (c.keywords ?? []).slice(0, 3).map(k => `#${k}`).join(' '),
    luckyColor: c.luckyColor,
    luckyNumber: c.luckyNumber,
    luckyTime: c.luckyTime,
  };
}

/** 그 KST 날짜가 시작하는 순간 (00:00 KST) */
export function kstMidnight(iso: string): Date {
  return new Date(`${iso}T00:00:00+09:00`);
}

export function nextISO(iso: string): string {
  return new Date(kstMidnight(iso).getTime() + 33 * 3600 * 1000).toISOString().slice(0, 10);
}
