/**
 * /fortune/saju
 * MVP 사주 엔진: 년·월·일·시 4주(四柱)를 근사 계산하고, 오늘 일진과 내 일간의 관계로 해석한다.
 * - 일주: 1949-10-01 = 갑자일 기준 60갑자 순환 (정확)
 * - 년주: 입춘(2/4 고정) 기준 근사
 * - 월주: 절입일을 고정일로 근사 (실제는 해마다 ±1일 차이)
 * - 음력 변환, 야자시, 지역 시차 보정은 미적용 → 향후 만세력 API/엔진으로 교체
 */
import { AnalysisResult, KeywordTag, User } from '../../types';
import { BRANCHES, CONTROLS, ELEMENT_INFO, Element, GENERATES, STEMS, TEN_GOD_TEXT, TenGodGroup } from '../../data/sajuData';
import { dayNumber, parseISO } from '../../utils/date';

const mod = (n: number, m: number) => ((n % m) + m) % m;
const GAPJA_BASE = dayNumber('1949-10-01');

export interface Pillar { stem: number; branch: number }
export interface SajuChart { year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null }

export function dayPillar(iso: string): Pillar {
  const idx = mod(dayNumber(iso) - GAPJA_BASE, 60);
  return { stem: idx % 10, branch: idx % 12 };
}

// 각 절기의 대략적 시작일 (월, 일) → 해당 월지 인덱스
const SOLAR_TERMS: [number, number, number][] = [
  [1, 6, 1], [2, 4, 2], [3, 6, 3], [4, 5, 4], [5, 6, 5], [6, 6, 6],
  [7, 7, 7], [8, 8, 8], [9, 8, 9], [10, 8, 10], [11, 7, 11], [12, 7, 0],
];

export function buildChart(birthDate: string, birthTime: string | null): SajuChart {
  const { y, m, d } = parseISO(birthDate);
  const beforeIpchun = m < 2 || (m === 2 && d < 4);
  const sajuYear = beforeIpchun ? y - 1 : y;
  const yIdx = mod(sajuYear - 4, 60);
  const year = { stem: yIdx % 10, branch: yIdx % 12 };

  // 월지
  let monthBranch = 0; // 12/7 이전의 1월 초는 자월
  for (const [tm, td, br] of SOLAR_TERMS) if (m > tm || (m === tm && d >= td)) monthBranch = br;
  // 월간: 연간 기준 인월 천간(갑기년→병인)
  const inStem = mod((year.stem % 5) * 2 + 2, 10);
  const offset = mod(monthBranch - 2, 12);
  const month = { stem: mod(inStem + offset, 10), branch: monthBranch };

  const day = dayPillar(birthDate);

  let hour: Pillar | null = null;
  if (birthTime) {
    const h = Number(birthTime.split(':')[0]);
    const hb = Math.floor((h + 1) / 2) % 12;
    const ziStem = mod((day.stem % 5) * 2, 10);
    hour = { stem: mod(ziStem + hb, 10), branch: hb };
  }
  return { year, month, day, hour };
}

export const pillarText = (p: Pillar) => `${STEMS[p.stem].ko}${BRANCHES[p.branch].ko}(${STEMS[p.stem].hanja}${BRANCHES[p.branch].hanja})`;

export function elementCounts(chart: SajuChart): Record<Element, number> {
  const c: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const pillars = [chart.year, chart.month, chart.day, chart.hour].filter(Boolean) as Pillar[];
  pillars.forEach(p => { c[STEMS[p.stem].element]++; c[BRANCHES[p.branch].element]++; });
  return c;
}

export function relation(me: Element, other: Element): TenGodGroup {
  if (me === other) return 'peer';
  if (GENERATES[other] === me) return 'resource';
  if (GENERATES[me] === other) return 'output';
  if (CONTROLS[me] === other) return 'wealth';
  return 'officer';
}

const RELATION_EFFECT: Record<TenGodGroup, { tags: KeywordTag[]; bias: AnalysisResult['scoreBias'] }> = {
  peer: { tags: ['harmony', 'challenge'], bias: { love: 0, money: -2, work: 3, relationship: 6 } },
  resource: { tags: ['learning', 'rest'], bias: { love: 2, money: 0, work: 5, relationship: 2 } },
  output: { tags: ['expression', 'newMeeting'], bias: { love: 7, money: 1, work: 2, relationship: 4 } },
  wealth: { tags: ['money', 'opportunity'], bias: { love: 3, money: 8, work: 3, relationship: -1 } },
  officer: { tags: ['caution', 'focus'], bias: { love: -2, money: -1, work: 6, relationship: -2 } },
};

export function getSajuAnalysis(user: User, date: string): AnalysisResult {
  const chart = buildChart(user.birthDate, user.birthTime);
  const me = STEMS[chart.day.stem];
  const today = dayPillar(date);
  const todayStem = STEMS[today.stem];
  const rel = relation(me.element, todayStem.element);
  const counts = elementCounts(chart);
  const weakest = (Object.keys(counts) as Element[]).sort((a, b) => counts[a] - counts[b])[0];
  const effect = RELATION_EFFECT[rel];
  const text = TEN_GOD_TEXT[rel];

  return {
    source: 'saju',
    title: '사주',
    emoji: '🔮',
    headline: text.headline,
    details: [
      { label: '나의 일간', value: `${me.ko}${ELEMENT_INFO[me.element].ko}(${me.hanja}) · ${ELEMENT_INFO[me.element].nature}` },
      { label: '사주 원국', value: [chart.year, chart.month, chart.day].map(pillarText).join(' ') + (chart.hour ? ' ' + pillarText(chart.hour) : ' (시주 미상)') },
      { label: '오늘의 일진', value: `${pillarText(today)} · ${BRANCHES[today.branch].animal}의 날` },
      { label: '오늘의 관계', value: text.name },
      { label: '보완하면 좋은 기운', value: `${ELEMENT_INFO[weakest].ko}(${ELEMENT_INFO[weakest].hanja}) → ${ELEMENT_INFO[weakest].color}` },
    ],
    description: text.desc,
    tags: effect.tags,
    scoreBias: effect.bias,
  };
}

export function getWeakElement(user: User): Element {
  const counts = elementCounts(buildChart(user.birthDate, user.birthTime));
  return (Object.keys(counts) as Element[]).sort((a, b) => counts[a] - counts[b])[0];
}
