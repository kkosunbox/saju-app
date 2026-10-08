import { PeriodFortune, User } from '../../types';
import { quickTotal } from './fortuneService';
import { parseISO, toISODate, weekdayOf } from '../../utils/date';
import { relation } from './sajuService';
import { buildChart } from './sajuService';
import { STEMS } from '../../data/sajuData';
import { seededRandom } from '../../utils/seed';

const addDays = (iso: string, n: number) => {
  const { y, m, d } = parseISO(iso);
  return toISODate(new Date(y, m - 1, d + n));
};

const FOCUS = ['관계', '재정 정리', '새로운 시작', '휴식과 회복', '배움', '성과 정리'];
const avg = (a: number[]) => Math.round(a.reduce((s, v) => s + v, 0) / a.length);

export function getPeriodFortune(user: User, today: string, period: 'weekly' | 'monthly' | 'yearly'): PeriodFortune {
  const rand = seededRandom(`${user.id}-${period}-${today.slice(0, period === 'yearly' ? 4 : 7)}`);

  if (period === 'weekly') {
    const monday = addDays(today, -((weekdayOf(today) + 6) % 7));
    const labels = ['월', '화', '수', '목', '금', '토', '일'];
    const flow = labels.map((label, i) => ({ label, score: quickTotal(user, addDays(monday, i)) }));
    const best = flow.reduce((a, b) => (a.score >= b.score ? a : b));
    return {
      period, label: '이번 주', score: avg(flow.map(f => f.score)), flow,
      summary: `${best.label}요일에 흐름이 가장 좋아요. 중요한 약속이나 결정은 이날로 잡아보세요.`,
      focus: FOCUS[Math.floor(rand() * FOCUS.length)],
    };
  }

  if (period === 'monthly') {
    const { y, m } = parseISO(today);
    const first = toISODate(new Date(y, m - 1, 1));
    const flow = [0, 1, 2, 3].map(w => ({
      label: `${w + 1}주차`,
      score: avg([0, 2, 4, 6].map(d => quickTotal(user, addDays(first, w * 7 + d)))),
    }));
    const best = flow.reduce((a, b) => (a.score >= b.score ? a : b));
    return {
      period, label: `${m}월`, score: avg(flow.map(f => f.score)), flow,
      summary: `${best.label}에 기회가 모여요. 월초에 계획을 세워두면 흐름을 잘 탈 수 있어요.`,
      focus: FOCUS[Math.floor(rand() * FOCUS.length)],
    };
  }

  // yearly: 올해 년간과 내 일간의 관계 + 월별 변동
  const { y } = parseISO(today);
  const me = STEMS[buildChart(user.birthDate, user.birthTime).day.stem].element;
  const yearStem = STEMS[(((y - 4) % 10) + 10) % 10].element;
  const rel = relation(me, yearStem);
  const base = { peer: 76, resource: 80, output: 82, wealth: 81, officer: 74 }[rel];
  const flow = Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}`, score: Math.round(base + rand() * 16 - 8) }));
  const text = {
    peer: '함께할 사람이 늘어나는 해예요. 협업과 네트워크가 자산이 돼요.',
    resource: '배우고 채우는 해예요. 자격·공부·건강 관리에 투자하기 좋아요.',
    output: '표현하고 드러내는 해예요. 새로운 도전과 창작에 힘이 실려요.',
    wealth: '결과를 거두는 해예요. 재정 계획을 세워두면 흐름을 잡기 좋아요.',
    officer: '책임이 커지는 해예요. 버틴 만큼 인정과 자리로 돌아와요.',
  }[rel];
  return { period, label: `${y}년`, score: avg(flow.map(f => f.score)), flow, summary: text, focus: FOCUS[Math.floor(rand() * FOCUS.length)] };
}
