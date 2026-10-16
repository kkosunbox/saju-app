/**
 * 유료 화면의 표시용 계산 — 서버 결과를 화면에 그릴 때 쓰는 가벼운 함수만 (십성 이름, 충·합 판정, 날짜).
 * 사주 원국·대운·운세 점수 같은 계산은 서버가 한다.
 */
import { KeywordTag, User } from '../../types';
import { Pillar } from '../../types/content';
import { Cat, CrossAxis, Daeun, SajuFull, SajuProfile, StageKey, StrengthLevel } from '../../types/premium';
import { BRANCHES, CONTROLS, ELEMENT_INFO, Element, GENERATES, STEMS, TEN_GOD_TEXT, TenGodGroup } from '../../data/sajuData';
import { ThaiDay, WEEKDAY_TO_THAI } from '../../data/thaiData';
import { KEYWORDS } from '../../data/keywords';
import { dayNumber, parseISO, toISODate, weekdayOf } from '../../utils/date';
import { HIDDEN, JS_START, LIUHE, SAMJAE_YEARS } from './data';

export const CATS: Cat[] = ['love', 'money', 'work', 'relationship'];
export const ELS: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];
export const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

const mod = (n: number, m: number) => ((n % m) + m) % m;
export const pText = (p: Pillar) => `${STEMS[p.stem].ko}${BRANCHES[p.branch].ko}(${STEMS[p.stem].hanja}${BRANCHES[p.branch].hanja})`;
export const pad2 = (n: number) => String(n).padStart(2, '0');
export function addDays(iso: string, n: number) { const { y, m, d } = parseISO(iso); return toISODate(new Date(y, m - 1, d + n)); }
export const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
export const kwTag = (label: string) => (Object.keys(KEYWORDS) as KeywordTag[]).find(k => KEYWORDS[k].label === label) ?? 'change';
export const elName = (e: Element) => `${ELEMENT_INFO[e].ko}(${ELEMENT_INFO[e].hanja})`;
export const tenName = (r: TenGodGroup) => TEN_GOD_TEXT[r].name;

/* ---------- 60갑자 · 날짜 ---------- */
export const pFrom = (i: number): Pillar => ({ stem: mod(i, 60) % 10, branch: mod(i, 60) % 12 });
/** 그해의 년주 (입춘 이후 기준) */
export const yearPillarOf = (y: number) => pFrom(y - 4);
const GAPJA_BASE = dayNumber('1949-10-01'); // 갑자일
/** 그날의 일진 */
export const dayPillar = (iso: string): Pillar => pFrom(dayNumber(iso) - GAPJA_BASE);
/** 그달의 월주 (15일 기준: 절입일이 지나 그달의 월지가 확정된 날) */
export function monthPillarOf(y: number, m: number): Pillar {
  const branch = m % 12; // 1월=축 … 12월=자
  const sajuYear = m === 1 ? y - 1 : y; // 1월 15일은 입춘 전이라 전년 기준
  const inStem = mod((yearPillarOf(sajuYear).stem % 5) * 2 + 2, 10); // 갑기년 → 병인월
  return { stem: mod(inStem + mod(branch - 2, 12), 10), branch };
}
/** 만 나이 */
export function ageOf(birthDate: string, today: string) {
  const b = parseISO(birthDate), t = parseISO(today);
  return t.y - b.y - ((t.m < b.m || (t.m === b.m && t.d < b.d)) ? 1 : 0);
}
export const ageNow = (u: Pick<User, 'birthDate'>, today: string) => ageOf(u.birthDate, today);
/** 태국 점성술의 태어난 요일 (서버 만세력) */
export const thaiDay = (u: User): ThaiDay => (u.natal?.thaiBirthDay ?? thaiDayOf(u.birthDate, u.birthTime)) as ThaiDay;
/** 양력 생일의 요일 → 태국 점성술 요일 (수요일은 18시부터 밤) */
export function thaiDayOf(birthDate: string, birthTime: string | null): ThaiDay {
  const base = WEEKDAY_TO_THAI[weekdayOf(birthDate)];
  if (base === 'wedDay' && birthTime && Number(birthTime.split(':')[0]) >= 18) return 'wedNight';
  return base;
}

/* ---------- 오행 · 십성 · 12운성 ---------- */
export function relation(me: Element, other: Element): TenGodGroup {
  if (me === other) return 'peer';
  if (GENERATES[other] === me) return 'resource';
  if (GENERATES[me] === other) return 'output';
  if (CONTROLS[me] === other) return 'wealth';
  return 'officer';
}
export const mainStem = (b: number) => HIDDEN[b][HIDDEN[b].length - 1];
export function tenGod(ds: number, os: number) {
  const a = STEMS[ds].element, b = STEMS[os].element;
  const same = (ds % 2) === (os % 2);
  let g: number;
  if (a === b) g = 0;
  else if (GENERATES[a] === b) g = 2;
  else if (CONTROLS[a] === b) g = 4;
  else if (CONTROLS[b] === a) g = 6;
  else g = 8;
  return g + (same ? 0 : 1);
}
export const tgGroup = (i: number): TenGodGroup => (['peer', 'peer', 'output', 'output', 'wealth', 'wealth', 'officer', 'officer', 'resource', 'resource'] as const)[i];
export const stage12 = (ds: number, b: number) => { const st = JS_START[ds]; return ds % 2 === 0 ? mod(b - st, 12) : mod(st - b, 12); };

/* ---------- 띠 · 지지 관계 ---------- */
export const SAMHAP = (b: number) => [[2, 6, 10], [8, 0, 4], [5, 9, 1], [11, 3, 7]].findIndex(g => g.includes(b));
export function samjae(birthYearBranch: number, yb: number) {
  const ys = SAMJAE_YEARS[SAMHAP(birthYearBranch)];
  const i = ys.indexOf(yb);
  return i < 0 ? null : ['들삼재', '눌삼재', '날삼재'][i];
}
export const isLiuhe = (a: number, b: number) => LIUHE.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
export const isClash = (a: number, b: number) => mod(a - b, 12) === 6;
export function BRANCH_GOOD(b: number) {
  const g = SAMHAP(b);
  const tri = [[2, 6, 10], [8, 0, 4], [5, 9, 1], [11, 3, 7]][g].filter(x => x !== b);
  const lh = LIUHE.find(([x, y]) => x === b || y === b)!;
  return [...tri, lh[0] === b ? lh[1] : lh[0]];
}

/* ---------- 결과 읽기 ---------- */
export function axisVerdict(a: CrossAxis) {
  const vals = Object.values(a.v);
  const pos = vals.filter(v => v > 0).length, neg = vals.filter(v => v < 0).length;
  return { pos, neg, verdict: pos > neg ? a.pos : neg > pos ? a.neg : '균형' };
}
export const currentDaeun = (list: Daeun[], now: number) => [...list].reverse().find(x => now >= x.age);
export const stageKeyOfAge = (now: number): StageKey => (now < 30 ? 'early' : now < 55 ? 'mid' : 'late');
export const Q_TEXT = (v: number) => (v >= 82 ? '적극적으로 움직일 때' : v >= 77 ? '계획을 실행할 때' : '다지고 준비할 때');

/** 신강약 5단계 → 화면의 3단계 */
export const strength3 = (level: StrengthLevel): SajuFull['strength'] =>
  level === '극강' || level === '신강' ? '신강' : level === '극약' || level === '신약' ? '신약' : '중화';

/** 서버 SajuProfile → 화면에서 쓰던 SajuFull */
export function toSajuFull(p: SajuProfile): SajuFull {
  return {
    ch: p.chart, ds: p.dayStem, meE: p.dayElement, pillars: p.pillars,
    grp: p.groupCounts, tgc: p.tenGodCounts, ratio: p.strength.supportRatio, strength: strength3(p.strength.level),
    elc: p.elementCounts, yong: p.yongsin.yongsin, hee: p.yongsin.huisin, gi: p.yongsin.gisin,
    topTG: p.topTenGods.map(t => ({ i: t.index, c: t.count })),
    sinsal: p.sinsal, gE: p.groupElements, spouseGrp: p.spouseGroup, dayStage: p.dayStage,
  };
}
