import type { DailyFortune } from '../types';

/** 앱이 '오늘의 운세' 위젯에 넣는 값 (iOS · Android 공통). 위젯은 이것만 보고 그린다. */
export interface FortuneWidgetProps {
  /** ready: 이 날짜의 운세가 있다 · stale: 앱이 넣어 둔 날짜가 지났다 · signedOut: 프로필 없음 */
  state: 'ready' | 'stale' | 'signedOut';
  /** KST 날짜 (YYYY-MM-DD) */
  date?: string;
  /** 머리줄 날짜 (예: '11.12 목') */
  dateLabel?: string;
  /** 점수·요약을 보여 주는지 (위젯에서 뽑았거나, 앱·다른 기기에서 이미 뽑음) */
  revealed?: boolean;
  score?: number;
  /** 어제 종합 점수와의 차이. 어제 기록이 없으면 null */
  delta?: number | null;
  summary?: string;
  /** 작은 위젯용 요약: 첫 줄을 꽉 채우도록 줄바꿈(\n)을 미리 넣은 것 (fillFirstLine) */
  summarySmall?: string;
  /** '#키워드 #키워드' */
  keywords?: string;
  luckyColor?: string;
  luckyNumber?: number;
  luckyTime?: string;
  /**
   * iOS: 앱이 공유 폴더(App Group)에 복사해 둔 위젯 그림의 폴더 (file://…/ 로 끝남).
   * 안에 logo-light/dark.png(운Pick 워드마크) · bg-small|medium-light|dark.jpg(구름 하늘 배경)
   */
  art?: string;
}

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

/** 운세 한 날치를 위젯 값으로. revealed는 서버가 뽑았다고 한 경우만 true (위젯에서 뽑은 건 위젯이 기억한다) */
export function toFortuneWidgetProps(f: DailyFortune): FortuneWidgetProps {
  const [y, m, d] = f.date.split('-').map(Number);
  const c = f.combined;
  return {
    state: 'ready',
    date: f.date,
    dateLabel: `${m}.${d} ${WEEK[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}`,
    revealed: !!f.drawn,
    score: c.totalScore,
    delta: f.yesterdayScores ? c.totalScore - f.yesterdayScores.totalScore : null,
    summary: c.summary,
    summarySmall: fillFirstLine(c.summary, SMALL_SUMMARY_LINE_EM),
    keywords: (c.keywords ?? []).slice(0, 3).map(k => `#${k}`).join(' '),
    luckyColor: c.luckyColor,
    luckyNumber: c.luckyNumber,
    luckyTime: c.luckyTime,
  };
}

/** 오늘 말고 미리 넣어 두는 날 수 (서버가 7일 뒤까지 준다 — 오늘 포함 일주일) */
export const WIDGET_DAYS_AHEAD = 6;

/** 오늘 다음으로 하루씩 이어지는 날만 (빠진 날이 있으면 거기서 끊는다) */
export function consecutiveDays(today: DailyFortune, ahead: DailyFortune[]): DailyFortune[] {
  const days = [today];
  for (const f of ahead) {
    if (f.date !== nextISO(days[days.length - 1].date)) break;
    days.push(f);
  }
  return days;
}

/**
 * 작은 위젯 요약 첫 줄에 들어가는 폭 (글자 크기 12.5pt 기준 em). 작은 위젯의 글 폭은 기기마다 130~145pt라
 * 가장 좁은 쪽에 맞춰 128pt로 잡는다.
 */
const SMALL_SUMMARY_LINE_EM = 128 / 12.5;

/**
 * 첫 줄을 꽉 채우고 나머지를 둘째 줄로 보내도록 줄바꿈을 넣는다.
 * iOS는 마지막 줄에 단어 하나만 남는 걸 피하려고 첫 줄을 일찍 끊는데('서두르지 않는 게 / 이기는 하루예요.'),
 * 위젯에서는 그 규칙을 끌 수 없어서 줄바꿈을 직접 넣는다. 글자 폭은 SF 12.5pt Medium(자간 -4%)을 잰 값으로 어림한다.
 */
export function fillFirstLine(text: string, maxEm: number): string {
  const width = (w: string) => [...w].reduce((sum, ch) => sum + (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(ch) ? 0.85 : /\s/.test(ch) ? 0.23 : 0.55), 0);
  const words = text.trim().split(/\s+/);
  let used = 0;
  let n = 0;
  for (const w of words) {
    const next = used + (n ? width(' ') : 0) + width(w);
    if (next > maxEm) break;
    used = next;
    n++;
  }
  if (n === 0 || n === words.length) return text;
  return `${words.slice(0, n).join(' ')}\n${words.slice(n).join(' ')}`;
}

/** 그 KST 날짜가 시작하는 순간 (00:00 KST) */
export function kstMidnight(iso: string): Date {
  return new Date(`${iso}T00:00:00+09:00`);
}

export function nextISO(iso: string): string {
  return new Date(kstMidnight(iso).getTime() + 33 * 3600 * 1000).toISOString().slice(0, 10);
}
