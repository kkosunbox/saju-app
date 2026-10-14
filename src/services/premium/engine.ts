/**
 * 프리미엄 콘텐츠 계산 엔진 — 십성·지장간·12운성·신강약·용신·신살, 대운·평생운·신년·월별·테마·길일.
 * 오늘의 운세 엔진(analyzeAll/combineRuleBased)을 그대로 재사용해 점수가 서로 어긋나지 않게 한다.
 */
import { BloodType, CombinedFortune, CompatibilityResult, KeywordTag, User } from '../../types';
import { BRANCHES, CONTROLS, ELEMENT_INFO, Element, GENERATES, STEMS, TEN_GOD_TEXT, TenGodGroup } from '../../data/sajuData';
import { THAI_DAYS, THAI_FRIENDS, ThaiDay, WEEKDAY_TO_THAI } from '../../data/thaiData';
import { MBTI_INFO } from '../../data/mbtiData';
import { BLOOD_INFO } from '../../data/bloodData';
import { ACTIONS, KEYWORDS } from '../../data/keywords';
import { Pillar, SajuChart, buildChart, dayPillar, elementCounts, getWeakElement, pillarText, relation, RELATION_EFFECT, SOLAR_TERMS } from '../fortune/sajuService';
import { birthThaiDay } from '../fortune/thaiAstrologyService';
import { AXES } from '../fortune/mbtiService';
import { analyzeAll } from '../fortune/fortuneService';
import { combineRuleBased } from '../fortune/combinedService';
import { parseISO, toISODate, weekdayOf } from '../../utils/date';
import { clamp, pick, seededRandom } from '../../utils/seed';
import {
  BLOOD_STAGE, BLOOD_STAGE_TEXT, BLOOD_YEAR, DOHWA, GWIIN, HIDDEN, HWAGAE, JOB_BY_TEMP, JS_START, LIUHE, MONEY_TYPES, MUNCHANG,
  PERIOD_TEXT, PURPOSE, REL_SCORE, SAMJAE_YEARS, STAGE_TEXT, STEM_HAP, STEM_PERSONA, THAI_STAGE, WONJIN, YANGIN, YEOKMA, ZODIAC_TEXT,
} from './data';

export type Cat = 'love' | 'money' | 'work' | 'relationship';
export const CATS: Cat[] = ['love', 'money', 'work', 'relationship'];
export const ELS: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];
export const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

const mod = (n: number, m: number) => ((n % m) + m) % m;
export const pText = pillarText;
export const pad2 = (n: number) => String(n).padStart(2, '0');
export const isoOf = (y: number, m: number, d: number) => `${y}-${pad2(m)}-${pad2(d)}`;
export function addDays(iso: string, n: number) { const { y, m, d } = parseISO(iso); return toISODate(new Date(y, m - 1, d + n)); }
export const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
export const thaiDay = (u: { birthDate: string; birthTime: string | null }): ThaiDay => birthThaiDay(u.birthDate, u.birthTime);
export const kwTag = (label: string) => (Object.keys(KEYWORDS) as KeywordTag[]).find(k => KEYWORDS[k].label === label) ?? 'change';
export const elName = (e: Element) => `${ELEMENT_INFO[e].ko}(${ELEMENT_INFO[e].hanja})`;
export const tenName = (r: TenGodGroup) => TEN_GOD_TEXT[r].name;

/* ---------- 오늘의 운세 엔진 재사용 (동기 · 캐시) ---------- */
const fcache = new Map<string, CombinedFortune>();
export function fortuneOf(u: User, iso: string): CombinedFortune {
  const k = `${u.id}|${u.birthDate}|${u.birthTime}|${u.mbti}|${u.bloodType}|${iso}`;
  let f = fcache.get(k);
  if (!f) {
    f = combineRuleBased({ user: u, date: iso, ...analyzeAll(u, iso), interests: u.interests ?? [] });
    fcache.set(k, f);
  }
  return f;
}
export const quickTotal = (u: User, iso: string) => fortuneOf(u, iso).totalScore;

/** 궁합 상대를 엔진에 넣을 수 있는 User 형태로 */
export function partnerUser(r: CompatibilityResult): User {
  const t = r.target;
  return { ...t, id: 'p-' + t.nickname + t.birthDate, createdAt: '' };
}

/* ---------- 기본 유틸 ---------- */
export const idx60 = (st: number, br: number) => { for (let i = 0; i < 60; i++) if (i % 10 === st && i % 12 === br) return i; return 0; };
export const pFrom = (i: number): Pillar => ({ stem: mod(i, 60) % 10, branch: mod(i, 60) % 12 });
export function ageNow(u: User, today: string) {
  const b = parseISO(u.birthDate), t = parseISO(today);
  return t.y - b.y - ((t.m < b.m || (t.m === b.m && t.d < b.d)) ? 1 : 0);
}
export const meEl = (u: User) => STEMS[buildChart(u.birthDate, u.birthTime).day.stem].element;
export const monthPillarOf = (y: number, m: number) => buildChart(isoOf(y, m, 15), null).month;

export function zodiacRel(a: number, b: number): 'same' | 'clash' | 'harmony' | 'normal' {
  if (a === b) return 'same';
  if (mod(a - b, 12) === 6) return 'clash';
  if (LIUHE.some(([x, z]) => (x === a && z === b) || (x === b && z === a))) return 'harmony';
  return 'normal';
}
export const SAMHAP = (b: number) => [[2, 6, 10], [8, 0, 4], [5, 9, 1], [11, 3, 7]].findIndex(g => g.includes(b));
export function samjae(birthYearBranch: number, yb: number) {
  const ys = SAMJAE_YEARS[SAMHAP(birthYearBranch)];
  const i = ys.indexOf(yb);
  return i < 0 ? null : ['들삼재', '눌삼재', '날삼재'][i];
}
export const isWonjin = (a: number, b: number) => WONJIN.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
export const isLiuhe = (a: number, b: number) => LIUHE.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
export const isClash = (a: number, b: number) => mod(a - b, 12) === 6;
export const isStemHap = (a: number, b: number) => STEM_HAP.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
export function BRANCH_GOOD(b: number) {
  const g = SAMHAP(b);
  const tri = [[2, 6, 10], [8, 0, 4], [5, 9, 1], [11, 3, 7]][g].filter(x => x !== b);
  const lh = LIUHE.find(([x, y]) => x === b || y === b)!;
  return [...tri, lh[0] === b ? lh[1] : lh[0]];
}
export const flipC = (t: string, i: number) => t.slice(0, i) + ({ E: 'I', I: 'E', N: 'S', S: 'N', T: 'F', F: 'T', J: 'P', P: 'J' } as Record<string, string>)[t[i]] + t.slice(i + 1);

/* ---------- 십성 · 지장간 · 12운성 ---------- */
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

export type SinsalKey = 'gwiin' | 'munchang' | 'dohwa' | 'yeokma' | 'hwagae' | 'yangin' | 'goegang' | 'baekho';
const TONE_ORDER: Record<string, number> = { good: 0, mix: 1, care: 2 };
const SINSAL_TONE: Record<SinsalKey, 'good' | 'mix' | 'care'> = { gwiin: 'good', munchang: 'good', dohwa: 'mix', yeokma: 'mix', hwagae: 'mix', yangin: 'care', goegang: 'care', baekho: 'care' };
export function findSinsal(ch: SajuChart): SinsalKey[] {
  const ds = ch.day.stem;
  const brs = [ch.year, ch.month, ch.day, ch.hour].filter(Boolean).map(p => p!.branch);
  const res: SinsalKey[] = [];
  const add = (k: SinsalKey) => { if (!res.includes(k)) res.push(k); };
  [ch.year.branch, ch.day.branch].forEach(base => {
    const g = SAMHAP(base);
    if (brs.includes(DOHWA[g])) add('dohwa');
    if (brs.includes(YEOKMA[g])) add('yeokma');
    if (brs.includes(HWAGAE[g])) add('hwagae');
  });
  if (GWIIN[ds].some(b => brs.includes(b))) add('gwiin');
  if (brs.includes(MUNCHANG[ds])) add('munchang');
  if (YANGIN[ds] !== undefined && brs.includes(YANGIN[ds])) add('yangin');
  const dp = ch.day.stem + ',' + ch.day.branch;
  if (['6,4', '6,10', '8,4', '8,10', '4,10'].includes(dp)) add('goegang');
  if (['0,4', '1,7', '2,10', '3,1', '4,4', '8,10', '9,1'].includes(dp)) add('baekho');
  return res.sort((a, b) => TONE_ORDER[SINSAL_TONE[a]] - TONE_ORDER[SINSAL_TONE[b]]);
}

export const grpElOf = (me: Element): Record<TenGodGroup, Element> => ({
  peer: me,
  resource: (Object.keys(GENERATES) as Element[]).find(k => GENERATES[k] === me)!,
  output: GENERATES[me],
  wealth: CONTROLS[me],
  officer: (Object.keys(CONTROLS) as Element[]).find(k => CONTROLS[k] === me)!,
});

export interface SajuFull {
  ch: SajuChart; ds: number; meE: Element; pillars: [string, Pillar | null][];
  grp: Record<TenGodGroup, number>; tgc: number[]; ratio: number; strength: '신강' | '신약' | '중화';
  elc: Record<Element, number>; yong: Element; hee: Element; gi: Element; topTG: { i: number; c: number }[];
  sinsal: SinsalKey[]; gE: Record<TenGodGroup, Element>; spouseGrp: TenGodGroup; dayStage: number;
}
const sfCache = new Map<string, SajuFull>();
export function sajuFull(u: Pick<User, 'birthDate' | 'birthTime' | 'gender'>): SajuFull {
  const ck = u.birthDate + u.birthTime + u.gender;
  const hit = sfCache.get(ck);
  if (hit) return hit;
  const ch = buildChart(u.birthDate, u.birthTime);
  const ds = ch.day.stem;
  const meE = STEMS[ds].element;
  const pillars: [string, Pillar | null][] = [['시주', ch.hour], ['일주', ch.day], ['월주', ch.month], ['년주', ch.year]];
  const grp: Record<TenGodGroup, number> = { peer: 0, output: 0, wealth: 0, officer: 0, resource: 0 };
  const tgc = Array(10).fill(0) as number[];
  let sup = 0, tot = 0;
  pillars.forEach(([l, p]) => {
    if (!p) return;
    if (l !== '일주') {
      const g = tenGod(ds, p.stem); tgc[g]++; grp[tgGroup(g)]++; tot += 1;
      if (['peer', 'resource'].includes(tgGroup(g))) sup += 1;
    }
    const bg = tenGod(ds, mainStem(p.branch)); tgc[bg]++; grp[tgGroup(bg)]++;
    const w = l === '월주' ? 2.5 : l === '일주' ? 1.5 : 1; tot += w;
    if (['peer', 'resource'].includes(tgGroup(bg))) sup += w;
  });
  const ratio = sup / tot;
  const strength = ratio >= 0.55 ? '신강' : ratio <= 0.4 ? '신약' : '중화';
  const elc = elementCounts(ch);
  const gE = grpElOf(meE);
  const cand: TenGodGroup[] | null = strength === '신강' ? ['output', 'wealth', 'officer'] : strength === '신약' ? ['resource', 'peer'] : null;
  const yong = cand ? gE[cand.reduce((a, b) => (elc[gE[b]] < elc[gE[a]] ? b : a))] : ELS.reduce((a, b) => (elc[b] < elc[a] ? b : a));
  const hee = (Object.keys(GENERATES) as Element[]).find(k => GENERATES[k] === yong)!;
  const gi = (Object.keys(CONTROLS) as Element[]).find(k => CONTROLS[k] === yong)!;
  const topTG = tgc.map((c, i) => ({ i, c })).filter(x => x.c > 0).sort((a, b) => b.c - a.c).slice(0, 3);
  const spouseGrp: TenGodGroup = u.gender === 'female' ? 'officer' : 'wealth';
  const R: SajuFull = { ch, ds, meE, pillars, grp, tgc, ratio, strength, elc, yong, hee, gi, topTG, sinsal: findSinsal(ch), gE, spouseGrp, dayStage: stage12(ds, ch.day.branch) };
  sfCache.set(ck, R);
  return R;
}

/* ---------- 4가지 관점 교차 성향 ---------- */
export type SrcKey = 'saju' | 'thai' | 'mbti' | 'blood';
export interface CrossAxis { name: string; pos: string; neg: string; v: Record<SrcKey, number> }
export function crossAxes(u: User, F: SajuFull): CrossAxis[] {
  const td = thaiDay(u); const mb = u.mbti, b = u.bloodType, g = F.grp;
  const sgn = (v: number) => (v > 0 ? 1 : v < 0 ? -1 : 0);
  return [
    { name: '에너지', pos: '외향', neg: '내향', v: { saju: sgn((g.output + g.wealth) - (g.resource + g.peer)), thai: ['sun', 'tue', 'wedDay', 'fri'].includes(td) ? 1 : ['mon', 'sat', 'wedNight'].includes(td) ? -1 : 0, mbti: mb[0] === 'E' ? 1 : -1, blood: ({ O: 1, B: 1, A: -1, AB: 0 } as Record<BloodType, number>)[b] } },
    { name: '생활 방식', pos: '계획형', neg: '즉흥형', v: { saju: sgn((g.officer + F.tgc[5]) - (F.tgc[3] + F.tgc[4] + F.tgc[1])), thai: ['sat', 'thu', 'mon'].includes(td) ? 1 : ['tue', 'wedNight'].includes(td) ? -1 : 0, mbti: mb[3] === 'J' ? 1 : -1, blood: ({ A: 1, AB: 1, B: -1, O: 0 } as Record<BloodType, number>)[b] } },
    { name: '판단 기준', pos: '감성', neg: '이성', v: { saju: sgn((g.resource + F.tgc[2]) - (F.tgc[6] + F.tgc[7] + F.elc.metal - 1)), thai: ['mon', 'fri', 'wedNight'].includes(td) ? 1 : ['sun', 'tue', 'sat'].includes(td) ? -1 : 0, mbti: mb[2] === 'F' ? 1 : -1, blood: ({ A: 1, B: 0, O: -1, AB: -1 } as Record<BloodType, number>)[b] } },
  ];
}
export function axisVerdict(a: CrossAxis) {
  const vals = Object.values(a.v);
  const pos = vals.filter(v => v > 0).length, neg = vals.filter(v => v < 0).length;
  return { pos, neg, verdict: pos > neg ? a.pos : neg > pos ? a.neg : '균형' };
}

/* ---------- 대운 (10년 주기) ---------- */
export interface Daeun { age: number; p: Pillar; rel: TenGodGroup; relB: TenGodGroup; score: number }
export function daeun(u: User): { fwd: boolean; start: number; list: Daeun[] } {
  const ch = buildChart(u.birthDate, u.birthTime);
  const yang = ch.year.stem % 2 === 0;
  const fwd = (yang && u.gender === 'male') || (!yang && u.gender === 'female');
  const { y, m, d } = parseISO(u.birthDate);
  const terms: number[] = [];
  for (const yy of [y - 1, y, y + 1]) for (const [tm, td] of SOLAR_TERMS) terms.push(Date.UTC(yy, tm - 1, td));
  terms.sort((a, b) => a - b);
  const b = Date.UTC(y, m - 1, d);
  const diff = fwd ? (terms.find(t => t > b)! - b) / 864e5 : (b - [...terms].reverse().find(t => t <= b)!) / 864e5;
  const start = Math.max(1, Math.round(diff / 3));
  const base = idx60(ch.month.stem, ch.month.branch);
  const me = STEMS[ch.day.stem].element;
  const r = seededRandom(u.id + '-daeun');
  return {
    fwd, start,
    list: Array.from({ length: 8 }, (_, k) => {
      const p = pFrom(base + (fwd ? k + 1 : -(k + 1)));
      const rel = relation(me, STEMS[p.stem].element), relB = relation(me, BRANCHES[p.branch].element);
      return { age: start + k * 10, p, rel, relB, score: Math.round(REL_SCORE[rel] * 0.65 + REL_SCORE[relB] * 0.35 + (r() * 6 - 3)) };
    }),
  };
}
export const currentDaeun = (list: Daeun[], now: number) => [...list].reverse().find(x => now >= x.age);

/* ---------- 평생운 ---------- */
export type StageKey = 'early' | 'mid' | 'late';
export interface LifeStage {
  key: StageKey; label: string; range: string; score: number; rel: TenGodGroup;
  headline: string; desc: string; tags: KeywordTag[]; advice: string; views: Record<SrcKey, string>;
}
export const stageKeyOfAge = (now: number): StageKey => (now < 30 ? 'early' : now < 55 ? 'mid' : 'late');
export function lifeStages(u: User): LifeStage[] {
  const ch = buildChart(u.birthDate, u.birthTime);
  const me = STEMS[ch.day.stem].element;
  const r = seededRandom(u.id + '-life');
  const td = thaiDay(u); const t = THAI_DAYS[td]; const mb = u.mbti;
  const has = (c: string) => mb.includes(c);
  type Src = { pillar: Pillar; branchOnly?: boolean };
  const defs: [StageKey, string, string, Src, string][] = [
    ['early', '초년운', '~29세', { pillar: ch.year }, '년주(年柱)'],
    ['mid', '중년운', '30~54세', { pillar: ch.month }, '월주(月柱)'],
    ['late', '말년운', '55세~', ch.hour ? { pillar: ch.hour } : { pillar: ch.day, branchOnly: true }, ch.hour ? '시주(時柱)' : '일지(日支)'],
  ];
  const mbtiB = [(has('E') ? 3 : 0) + (has('N') ? 1 : 0) + (has('P') ? 1 : 0), (has('J') ? 3 : 0) + (has('T') ? 2 : 0) + (has('S') ? 1 : 0), (has('I') ? 2 : 0) + (has('F') ? 3 : 0) + (has('N') ? 1 : 0)];
  const mbtiT = [has('E') ? '사람 속에서 기회를 잡아요' : '혼자만의 세계를 단단히 다져요', has('J') ? '계획한 대로 차곡차곡 쌓아 올리는 힘이 커요' : '유연하게 기회를 갈아타며 커져요', has('F') ? '관계와 의미에서 깊은 만족을 찾아요' : '원칙과 경험이 지혜로 무르익어요'];
  return defs.map(([key, label, range, src, pname], i) => {
    const { pillar, branchOnly } = src;
    const el = branchOnly ? BRANCHES[pillar.branch].element : STEMS[pillar.stem].element;
    const rel = relation(me, el);
    const tb = THAI_STAGE[td][i], bb = BLOOD_STAGE[u.bloodType][i];
    const score = clamp(REL_SCORE[rel] + tb + mbtiB[i] + bb - 5 + (r() * 6 - 3), 60, 96);
    const [h, desc] = STAGE_TEXT[key][rel];
    const tags = RELATION_EFFECT[rel].tags;
    return {
      key, label, range, score, rel, headline: h, desc, tags, advice: ACTIONS[tags[0]].good[0],
      views: {
        saju: `${pname} ${branchOnly ? BRANCHES[pillar.branch].ko + '(' + BRANCHES[pillar.branch].hanja + ')' : pText(pillar)}이 나와 ${tenName(rel)} 관계예요.`,
        thai: tb >= 4 ? `수호 행성 ${t.planetKo}의 힘이 가장 강하게 실리는 때예요.` : tb >= 2 ? `${t.planetKo}의 기운이 꾸준히 받쳐줘요.` : `${t.planetKo}의 기운이 잔잔해 스스로 길을 만들어 가는 때예요.`,
        mbti: `${mb} 성향은 이 시기에 ${mbtiT[i]}.`,
        blood: `${u.bloodType}형의 ${BLOOD_STAGE_TEXT[u.bloodType][i]}.`,
      },
    };
  });
}

/** 인생 그래프의 점 (5~85세) */
export function lifeChartPoints(stages: LifeStage[], dae: { list: Daeun[] }) {
  const ages = [5, 15, 25, 35, 45, 55, 65, 75, 85];
  const stageOf = (a: number) => (a < 30 ? stages[0] : a < 55 ? stages[1] : stages[2]);
  const dScore = (a: number) => { const d = currentDaeun(dae.list, a); return d ? d.score : stageOf(a).score; };
  return ages.map(a => ({ a, v: Math.round(stageOf(a).score * 0.5 + dScore(a) * 0.5) }));
}

/* ---------- 신년 · 연간 데이터 ---------- */
export interface MonthAgg { m: number; total: number; love: number; money: number; work: number; relationship: number; kw: string[] }
export interface YearData {
  y: number; yp: Pillar; rel: TenGodGroup; zr: ReturnType<typeof zodiacRel>; total: number; months: MonthAgg[];
  cat: Record<Cat, number>; best: MonthAgg[]; low: MonthAgg[]; kws: string[]; qs: number[];
  views: Record<SrcKey, string>; zodiac: [string, string]; animal: string; myAnimal: string;
}
const ydCache = new Map<string, YearData>();
export function yearData(u: User, y: number): YearData {
  const ck = `${u.id}|${u.birthDate}|${u.birthTime}|${u.mbti}|${u.bloodType}|${y}`;
  const hit = ydCache.get(ck);
  if (hit) return hit;
  const yp = pFrom(y - 4); const me = meEl(u);
  const rel = relation(me, STEMS[yp.stem].element);
  const birth = buildChart(u.birthDate, u.birthTime);
  const zr = zodiacRel(birth.year.branch, yp.branch);
  const months: MonthAgg[] = Array.from({ length: 12 }, (_, i) => {
    const fs = [3, 10, 17, 24].map(d => fortuneOf(u, isoOf(y, i + 1, d)));
    const avg = (k: Cat | 'totalScore') => Math.round(fs.reduce((s, f) => s + f[k], 0) / 4);
    return { m: i + 1, total: avg('totalScore'), love: avg('love'), money: avg('money'), work: avg('work'), relationship: avg('relationship'), kw: fs.map(f => f.keywords[0]) };
  });
  const cat = {} as Record<Cat, number>;
  CATS.forEach(c => (cat[c] = Math.round(months.reduce((s, x) => s + x[c], 0) / 12)));
  const zBonus = { same: 0, clash: -3, harmony: 4, normal: 1 }[zr];
  const total = clamp(REL_SCORE[rel] * 0.4 + (months.reduce((s, x) => s + x.total, 0) / 12) * 0.6 + zBonus, 55, 96);
  const sk = new Date(Date.UTC(y, 3, 13)).getUTCDay(); const yPlanet = WEEKDAY_TO_THAI[sk];
  const myT = thaiDay(u); const tp = THAI_DAYS[yPlanet], mp = THAI_DAYS[myT];
  const thaiTxt = yPlanet === myT || (myT === 'wedNight' && yPlanet === 'wedDay')
    ? `송끄란(4/13)이 ${tp.label}이라 ${tp.planetKo}이 다스리는 해예요. 내 수호 행성과 같아 한 해 내내 힘이 실려요.`
    : THAI_FRIENDS[myT].includes(yPlanet)
      ? `올해를 다스리는 ${tp.planetKo}은 나의 ${mp.planetKo}과 사이가 좋아요. 주변의 도움이 자주 들어와요.`
      : tp.color === mp.cautionColor
        ? `올해의 행성 ${tp.planetKo}의 색(${tp.color})은 나에게 주의 색이에요. 큰 결정은 한 박자 늦게 내려보세요.`
        : `올해의 행성 ${tp.planetKo}이 나의 ${mp.planetKo}에 새로운 자극을 줘요. 익숙한 방식에서 벗어날수록 재미있어져요.`;
  const ax = AXES[y % 4]; const flow = Math.floor(y / 4) % 2 === 0 ? ax[0] : ax[1]; const mine = u.mbti[y % 4];
  const mbtiTxt = mine === flow
    ? `올해는 '${ax[2]}'에서 ${flow} 흐름이 강해 ${u.mbti}인 나와 잘 맞아요. 평소 방식대로 밀고 가도 좋은 해예요.`
    : `올해는 '${ax[2]}'에서 ${flow} 흐름이 강해 평소의 ${mine} 성향과 반대예요. 반대편 방식을 하나 익히면 크게 성장해요.`;
  const bloodTxt = pick(seededRandom(`by-${u.bloodType}-${y}`), BLOOD_YEAR[u.bloodType]);
  const sorted = [...months].sort((a, b) => b.total - a.total);
  const kc = new Map<string, number>();
  months.forEach(x => x.kw.forEach(k => kc.set(k, (kc.get(k) ?? 0) + 1)));
  const kws = [...kc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  const qs = [0, 1, 2, 3].map(q => Math.round(months.slice(q * 3, q * 3 + 3).reduce((s, x) => s + x.total, 0) / 3));
  const R: YearData = {
    y, yp, rel, zr, total, months, cat, best: sorted.slice(0, 3), low: sorted.slice(-2).reverse(), kws, qs,
    views: { saju: `${pText(yp)}년의 기운이 나의 일간과 ${tenName(rel)} 관계예요. ${PERIOD_TEXT.year[rel][1]}`, thai: thaiTxt, mbti: mbtiTxt, blood: bloodTxt },
    zodiac: ZODIAC_TEXT[zr] as [string, string], animal: BRANCHES[yp.branch].animal, myAnimal: BRANCHES[birth.year.branch].animal,
  };
  ydCache.set(ck, R);
  return R;
}
export const Q_TEXT = (v: number) => (v >= 82 ? '적극적으로 움직일 때' : v >= 77 ? '계획을 실행할 때' : '다지고 준비할 때');

/* ---------- 월별 리포트 ---------- */
export interface DayEntry { iso: string; d: number; total: number; c: CombinedFortune }
export interface MonthReport {
  y: number; m: number; n: number; days: DayEntry[]; cat: Record<Cat, number>; best: DayEntry[]; low: DayEntry[];
  kws: string[]; missions: string[]; avg: number; first: number;
}
export function monthReport(u: User, iso: string): MonthReport {
  const { y, m } = parseISO(iso); const n = daysInMonth(y, m);
  const days: DayEntry[] = [];
  for (let d = 1; d <= n; d++) { const di = isoOf(y, m, d); const c = fortuneOf(u, di); days.push({ iso: di, d, total: c.totalScore, c }); }
  const cat = {} as Record<Cat, number>;
  CATS.forEach(k => (cat[k] = Math.round(days.reduce((s, x) => s + x.c[k], 0) / n)));
  const best = [...days].sort((a, b) => b.total - a.total).slice(0, 3);
  const low = [...days].sort((a, b) => a.total - b.total).slice(0, 2);
  const kc = new Map<string, number>();
  days.forEach(x => x.c.keywords.forEach((k, i) => kc.set(k, (kc.get(k) ?? 0) + (3 - i))));
  const kws = [...kc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  const r = seededRandom(`${u.id}-mission-${y}-${m}`);
  const missions = kws.map(k => pick(r, ACTIONS[kwTag(k)].good));
  return { y, m, n, days, cat, best, low, kws, missions, avg: Math.round(days.reduce((s, x) => s + x.total, 0) / n), first: weekdayOf(days[0].iso) };
}

/* ---------- 테마 운세 ---------- */
const BLOOD_LOVE: Record<BloodType, string> = { A: '세심하게 챙기며 신뢰를 쌓아요', B: '좋으면 솔직하게 직진해요', O: '든든하게 이끌어 주는 편이에요', AB: '적당한 거리를 지킬 줄 알아요' };
function nextYearMonths(u: User, today: string) {
  const { y, m } = parseISO(today);
  return [
    ...yearData(u, y).months.filter(x => x.m >= m).map(x => ({ ...x, y })),
    ...yearData(u, y + 1).months.filter(x => x.m < m).map(x => ({ ...x, y: y + 1 })),
  ];
}
export function themeLove(u: User, today: string) {
  const mb = u.mbti;
  const st = `${mb[0] === 'E' ? '먼저 다가가는' : '천천히 마음을 여는'} ${mb[2] === 'F' ? '다정한' : '행동파'} 연애`;
  const me = meEl(u);
  const sup = (Object.keys(GENERATES) as Element[]).find(k => GENERATES[k] === me)!;
  const types = [flipC(flipC(mb, 0), 3), flipC(mb, 0), flipC(mb, 3)];
  const y = parseISO(today).y;
  const spouse: TenGodGroup = u.gender === 'female' ? 'officer' : 'wealth';
  const birthYB = buildChart(u.birthDate, u.birthTime).year.branch;
  const yrs: { yy: number; why: string }[] = [];
  for (let yy = y; yy < y + 10 && yrs.length < 3; yy++) {
    const yp = pFrom(yy - 4); const r = relation(me, STEMS[yp.stem].element); const z = zodiacRel(birthYB, yp.branch);
    if (r === spouse || (r === 'output' && yrs.length < 1) || z === 'harmony') yrs.push({ yy, why: r === spouse ? '인연의 기운(관계성)이 들어오는 해' : z === 'harmony' ? '띠가 합을 이루는 귀인의 해' : '마음을 표현하는 기운이 강한 해' });
  }
  const ms = nextYearMonths(u, today).sort((a, b) => b.love - a.love).slice(0, 3);
  return {
    st, blood: BLOOD_LOVE[u.bloodType], types, yrs, ms,
    views: {
      saju: `나를 살려주는 ${elName(sup)} 기운이 강한 사람에게 편안함을 느끼기 쉬워요.`,
      thai: `${THAI_FRIENDS[thaiDay(u)].map(k => THAI_DAYS[k].label).join(', ')}생과 잘 통해요.`,
      mbti: `${types.join(', ')} 유형과 서로를 채워주는 조합이에요.`,
      blood: `${u.bloodType}형은 연애할 때 ${BLOOD_LOVE[u.bloodType]}.`,
    } as Record<SrcKey, string>,
  };
}
export type MoneyTypeKey = keyof typeof MONEY_TYPES;
export function themeMoney(u: User, today: string) {
  const mb = u.mbti, b = u.bloodType;
  const sc: Record<MoneyTypeKey, number> = {
    saver: (mb[3] === 'J' ? 2 : 0) + (mb[1] === 'S' ? 1 : 0) + (b === 'A' ? 2 : 0),
    explorer: (mb[3] === 'P' ? 2 : 0) + (mb[1] === 'N' ? 1 : 0) + (b === 'B' ? 2 : 0),
    leader: (mb[0] === 'E' ? 1 : 0) + (mb[2] === 'T' ? 2 : 0) + (b === 'O' ? 2 : 0),
    experience: (mb[2] === 'F' ? 2 : 0) + (mb[3] === 'P' ? 1 : 0) + (b === 'AB' ? 2 : 0),
  };
  const type = (Object.keys(sc) as MoneyTypeKey[]).reduce((a, k) => (sc[k] > sc[a] ? k : a), 'saver' as MoneyTypeKey);
  const ch = buildChart(u.birthDate, u.birthTime); const me = meEl(u);
  const cnt = elementCounts(ch)[CONTROLS[me]];
  const ms = nextYearMonths(u, today).sort((a, b2) => b2.money - a.money).slice(0, 3);
  const td = thaiDay(u);
  return {
    t: MONEY_TYPES[type], cnt, wealthEl: CONTROLS[me], ms,
    views: {
      saju: `재물을 뜻하는 ${elName(CONTROLS[me])} 기운이 원국에 ${cnt}개 — ${cnt === 0 ? '스스로 만들어가는 재물이에요. 기술과 실력이 곧 돈이 돼요.' : cnt <= 2 ? '꾸준히 들어오는 재물이에요. 관리할수록 커져요.' : '재물 감각을 타고났어요. 다만 들어온 만큼 나가는 흐름도 커요.'}`,
      thai: `${THAI_DAYS[td].trait}이라 ${['sun', 'tue', 'thu'].includes(td) ? '과감한 결정에서' : '꾸준한 관리에서'} 돈이 모여요.`,
      mbti: mb[3] === 'J' ? '계획형(J)이라 예산을 세우면 잘 지켜요.' : '탐색형(P)이라 기회에 빠르지만 예산은 느슨해지기 쉬워요.',
      blood: `${b}형은 ${({ A: '예산표를 써두면 마음이 편해지는 타입이에요', B: '꽂히면 아낌없이 쓰는 타입이에요', O: '사람에게 쓰는 돈은 아깝지 않은 타입이에요', AB: '가성비를 꼼꼼히 따지는 타입이에요' } as Record<BloodType, string>)[b]}.`,
    } as Record<SrcKey, string>,
  };
}
export function themeCareer(u: User, today: string) {
  const mb = u.mbti;
  const temp = (mb[1] === 'N' ? 'N' + mb[2] : 'S' + mb[3]) as keyof typeof JOB_BY_TEMP;
  const ch = buildChart(u.birthDate, u.birthTime); const per = STEM_PERSONA[ch.day.stem];
  const jobs = [...new Set([...per.work.split(' · '), ...JOB_BY_TEMP[temp]])].slice(0, 6);
  const dae = daeun(u); const now = ageNow(u, today);
  const ups = dae.list.filter(d => d.age + 9 >= now && ['officer', 'resource', 'output'].includes(d.rel)).slice(0, 3);
  return {
    jobs, temp, ups,
    style: [mb[2] === 'T' ? '근거와 효율로 판단해요' : '사람과 의미를 먼저 봐요', mb[3] === 'J' ? '마감과 계획이 있을 때 강해요' : '자율과 변화가 있을 때 빛나요', mb[0] === 'E' ? '함께 부딪히며 일할 때 에너지가 올라요' : '혼자 몰입하는 시간이 있어야 성과가 나요'],
    views: {
      saju: `일간 ${STEMS[ch.day.stem].ko}(${STEMS[ch.day.stem].hanja}) · ${per.core} — ${per.work}에 강해요.`,
      thai: `${THAI_DAYS[thaiDay(u)].trait}이에요.`,
      mbti: `${mb} · ${MBTI_INFO[mb].nickname} — ${MBTI_INFO[mb].strength}이 무기예요.`,
      blood: `${u.bloodType}형 · ${BLOOD_INFO[u.bloodType].trait}이에요.`,
    } as Record<SrcKey, string>,
  };
}

/* ---------- 길일 찾기 ---------- */
export type PurposeKey = 'move' | 'contract' | 'confess' | 'interview' | 'travel' | 'start';
export interface LuckyDay { iso: string; s: number; c: CombinedFortune; hit: string[]; dp: Pillar; gw: boolean; clash: boolean; tg: number; st: number }
export function luckyDays(u: User, today: string, pk: PurposeKey) {
  const F = sajuFull(u);
  const P = PURPOSE.find(p => p[0] === pk)!;
  const all: LuckyDay[] = [];
  for (let i = 1; i <= 45; i++) {
    const iso = addDays(today, i); const c = fortuneOf(u, iso);
    const tagsL = P[4].map(t => KEYWORDS[t].label);
    const hit = c.keywords.filter(k => tagsL.includes(k));
    const dp = dayPillar(iso);
    const gw = GWIIN[F.ds].includes(dp.branch);
    const clash = isClash(F.ch.day.branch, dp.branch);
    const s = Math.round(P[3].reduce((a, k) => a + c[k], 0) / P[3].length + hit.length * 4 + (gw ? 4 : 0) - (clash ? 6 : 0));
    all.push({ iso, s, c, hit, dp, gw, clash, tg: tenGod(F.ds, dp.stem), st: stage12(F.ds, dp.branch) });
  }
  return { P, list: [...all].sort((a, b) => b.s - a.s).slice(0, 5), bad: [...all].sort((a, b) => a.s - b.s).slice(0, 3) };
}

export { getWeakElement };
