/**
 * 주간 · 월간 · 연간 운세 — 날짜별 종합 운세(fortuneOf)를 모아 계산한다.
 * 분야별(연애·재물·직장·관계) 점수와 가장 좋은 때(요일·주차·달), 한 줄 풀이까지 만든다.
 * 연간은 유료 신년운세와 같은 계산(yearData)을 써서 숫자가 서로 어긋나지 않는다.
 */
import { CombinedFortune, PeriodFortune, User } from '../../types';
import { parseISO, toISODate, weekdayOf } from '../../utils/date';
import { daysInMonth, fortuneOf, monthReport, yearData } from '../premium/engine';
import { FIELD } from '../premium/data';
import { seededRandom } from '../../utils/seed';

type Cat = 'love' | 'money' | 'work' | 'relationship';
const CATS: Cat[] = ['love', 'money', 'work', 'relationship'];
const addDays = (iso: string, n: number) => { const { y, m, d } = parseISO(iso); return toISODate(new Date(y, m - 1, d + n)); };
const avg = (a: number[]) => Math.round(a.reduce((s, v) => s + v, 0) / a.length);
const FOCUS = ['관계', '재정 정리', '새로운 시작', '휴식과 회복', '배움', '성과 정리'];

/** 분야 × 흐름 단계(좋음·보통·조심) 풀이 */
const LINE: Record<Cat, [string, string, string]> = {
  love: ['설렘이 커지는 흐름이에요. 마음을 표현하면 좋은 반응이 와요.', '잔잔하고 편안한 흐름이에요. 작은 배려가 관계를 단단하게 해요.', '오해가 생기기 쉬워요. 서운한 건 미루지 말고 부드럽게 말해 주세요.'],
  money: ['돈이 들어올 기회가 보여요. 수입을 늘릴 방법을 적극적으로 찾아보세요.', '들어오고 나가는 게 균형을 이뤄요. 고정비를 점검하기 좋아요.', '지출이 커지기 쉬워요. 큰 결제와 돈거래는 한 번 더 생각하세요.'],
  work: ['성과가 눈에 띄는 흐름이에요. 미뤄둔 제안이나 도전을 꺼내 보세요.', '맡은 일을 차근차근 해내기 좋아요. 꾸준함이 평가로 이어져요.', '일이 몰리거나 꼬이기 쉬워요. 우선순위를 정하고 무리하지 마세요.'],
  relationship: ['사람 운이 좋아요. 새로운 만남과 모임에서 도움을 받아요.', '가까운 사람들과 편안한 흐름이에요. 먼저 연락하면 좋아요.', '말 한마디가 오해를 부를 수 있어요. 듣는 쪽에 무게를 두세요.'],
};
/** 받침이 있으면 '이에요', 없으면 '예요' */
const ieyo = (w: string) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 ? '이에요' : '예요'; };
const lvl = (v: number) => (v >= 80 ? 0 : v >= 72 ? 1 : 2);
const FIELD_KEY: Record<Cat, 'love' | 'money' | 'work' | 'people'> = { love: 'love', money: 'money', work: 'work', relationship: 'people' };

function catsFrom(groups: { label: string; days: CombinedFortune[] }[], unit: string): PeriodFortune['cats'] {
  const out = {} as PeriodFortune['cats'];
  CATS.forEach(k => {
    const per = groups.map(g => ({ label: g.label, v: avg(g.days.map(d => d[k])) }));
    const score = avg(groups.flatMap(g => g.days.map(d => d[k])));
    const best = per.reduce((a, b) => (b.v > a.v ? b : a)).label;
    out[k] = { score, best, text: `${LINE[k][lvl(score)]} ${unit === '요일' ? `${best}요일` : best}에 가장 힘이 실려요.` };
  });
  return out;
}

export function getPeriodFortune(user: User, today: string, period: 'weekly' | 'monthly' | 'yearly'): PeriodFortune {
  const rand = seededRandom(`${user.id}-${period}-${today.slice(0, period === 'yearly' ? 4 : 7)}`);

  if (period === 'weekly') {
    const monday = addDays(today, -((weekdayOf(today) + 6) % 7));
    const labels = ['월', '화', '수', '목', '금', '토', '일'];
    const days = labels.map((label, i) => ({ label, days: [fortuneOf(user, addDays(monday, i))] }));
    const flow = days.map(d => ({ label: d.label, score: d.days[0].totalScore }));
    const best = flow.reduce((a, b) => (a.score >= b.score ? a : b));
    return {
      period, label: '이번 주', score: avg(flow.map(f => f.score)), flow,
      summary: `${best.label}요일에 흐름이 가장 좋아요. 중요한 약속이나 결정은 이날로 잡아보세요.`,
      focus: FOCUS[Math.floor(rand() * FOCUS.length)], cats: catsFrom(days, '요일'),
    };
  }

  if (period === 'monthly') {
    const { y, m } = parseISO(today);
    const R = monthReport(user, toISODate(new Date(y, m - 1, 1)));
    const n = daysInMonth(y, m);
    const weeks = Array.from({ length: Math.ceil(n / 7) }, (_, w) => ({ label: `${w + 1}주차`, days: R.days.slice(w * 7, w * 7 + 7).map(d => d.c) })).filter(w => w.days.length >= 3);
    const flow = weeks.map(w => ({ label: w.label, score: avg(w.days.map(d => d.totalScore)) }));
    const best = flow.reduce((a, b) => (a.score >= b.score ? a : b));
    return {
      period, label: `${m}월`, score: R.avg, flow,
      summary: `${best.label}에 기회가 모여요. 이달의 키워드는 '${R.kws[0]}'${ieyo(R.kws[0])}.`,
      focus: R.kws[0] ?? FOCUS[Math.floor(rand() * FOCUS.length)], cats: catsFrom(weeks, '주차'),
    };
  }

  const { y } = parseISO(today);
  const D = yearData(user, y);
  const flow = D.months.map(x => ({ label: `${x.m}`, score: x.total }));
  const text = {
    peer: '함께할 사람이 늘어나는 해예요. 협업과 네트워크가 자산이 돼요.',
    resource: '배우고 채우는 해예요. 자격·공부·건강 관리에 투자하기 좋아요.',
    output: '표현하고 드러내는 해예요. 새로운 도전과 창작에 힘이 실려요.',
    wealth: '결과를 거두는 해예요. 재정 계획을 세워두면 흐름을 잡기 좋아요.',
    officer: '책임이 커지는 해예요. 버틴 만큼 인정과 자리로 돌아와요.',
  }[D.rel];
  const cats = {} as PeriodFortune['cats'];
  CATS.forEach(k => {
    const bm = D.months.reduce((a, b) => (b[k] > a[k] ? b : a)).m;
    const field = (FIELD[D.rel] as Record<string, string>)[FIELD_KEY[k]];
    cats[k] = { score: D.cat[k], best: `${bm}월`, text: `${field.split('.')[0]}. ${bm}월에 가장 힘이 실려요.` };
  });
  return { period, label: `${y}년`, score: D.total, flow, summary: text, focus: D.kws[0] ?? FOCUS[0], cats };
}
