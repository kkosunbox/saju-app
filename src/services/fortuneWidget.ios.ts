/**
 * iOS '오늘의 운세' 위젯에 운세를 넣는다 (src/widgets/FortuneWidget.ios.tsx).
 *
 * 위젯은 네트워크를 못 써서 앱이 미리 넣어 둔 타임라인만 보여 준다.
 * - 오늘 운세 → 지금부터, 내일 운세(서버가 ±1일까지 줌, AI 없이 규칙 엔진) → 내일 00:00 KST부터
 * - 그다음 날 00:00 KST부터는 'stale'(앱을 열어 달라) — 이틀 넘게 앱을 안 열었을 때
 * 위젯의 '운세 뽑기'는 위젯 안에서 그 날 항목의 revealed만 true로 바꾼다. 앱이 타임라인을 다시 넣을 때
 * 같은 날짜에서 위젯이 뽑아 둔 것은 지우지 않는다.
 */
import type { DailyFortune } from '../types';
import { type FortuneWidgetProps, kstMidnight, nextISO, toFortuneWidgetProps } from '../widgets/fortuneWidgetProps';

type WidgetHandle = typeof import('../widgets/FortuneWidget.ios').default;

let handle: WidgetHandle | null | undefined;
/** 위젯 모듈이 없는 빌드(Expo Go · 위젯을 넣기 전 개발 빌드)에서는 조용히 아무것도 안 한다 */
function widget(): WidgetHandle | null {
  if (handle === undefined) {
    try {
      handle = (require('../widgets/FortuneWidget.ios') as { default: WidgetHandle }).default;
    } catch {
      handle = null;
    }
  }
  return handle;
}

async function revealedDates(w: WidgetHandle): Promise<Set<string>> {
  try {
    const entries = await w.getTimeline();
    return new Set(entries.filter(e => e.props.state === 'ready' && e.props.revealed && e.props.date).map(e => e.props.date!));
  } catch {
    return new Set();
  }
}

/** 오늘(과 받아 왔으면 내일) 운세를 위젯 타임라인으로 */
export async function syncFortuneWidget(today: DailyFortune, tomorrow: DailyFortune | null): Promise<void> {
  const w = widget();
  if (!w) return;
  try {
    const revealed = await revealedDates(w);
    const days = [today, ...(tomorrow && tomorrow.date === nextISO(today.date) ? [tomorrow] : [])];
    const entries: { date: Date; props: FortuneWidgetProps }[] = days.map((f, i) => {
      const props = toFortuneWidgetProps(f);
      if (revealed.has(f.date)) props.revealed = true;
      // 오늘 항목은 지금부터 (자정 시각을 넣어도 되지만, 이미 지난 시각이면 WidgetKit이 바로 쓴다)
      return { date: i === 0 ? new Date() : kstMidnight(f.date), props };
    });
    const last = days[days.length - 1].date;
    entries.push({ date: kstMidnight(nextISO(last)), props: { state: 'stale' } });
    w.updateTimeline(entries);
  } catch {
    // 위젯은 부가 기능이라 앱 흐름을 막지 않는다
  }
}

/** 로그아웃 · 탈퇴 · 프로필 없음 */
export function clearFortuneWidget(): void {
  const w = widget();
  if (!w) return;
  try {
    w.updateSnapshot({ state: 'signedOut' });
  } catch {
    // 무시
  }
}
