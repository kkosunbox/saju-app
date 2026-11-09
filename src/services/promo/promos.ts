/**
 * 무료 화면 끝에 붙이는 유료 콘텐츠 추천 — 운세 · 분야 상세 · 종합 풀이 · 무료 콘텐츠가 같은 목록을 쓴다.
 * track은 노출·클릭 기록과 구매 대조에 쓰는 열람권 키(또는 앞부분)다 (서버 promo_event.item).
 */
import { NavigationProp, ParamListBase } from '@/navigation/compat';
import { ITEMS, Item } from '../premium/catalog';
import { PremiumRef } from '../server/premiumApi';
import { MonthPreview, SpousePreview, ThemePreview, YearPreview } from '../../types/premium';
import { CategoryKey } from '../../theme/colors';
import { parseISO } from '../../utils/date';

export type PromoKey = 'theme-love' | 'theme-money' | 'theme-career' | 'consult' | 'lucky' | 'crush' | 'monthly' | 'newyear' | 'life' | 'spouse' | 'sajuDeep';

export interface Promo {
  key: PromoKey;
  track: string;
  title: string;
  desc: string;
  item: Item;
  /** 알약 버튼의 동사 (가격 뒤) */
  verb: string;
  /** 잠겨 있을 때 미리보기로 설명을 내 결과 한 조각으로 바꾼다 */
  ref?: PremiumRef;
  teaser?(data: unknown): string | null;
  go(): void;
}

type Nav = Pick<NavigationProp<ParamListBase>, 'navigate'>;

/** 신년운세 시즌 — 11월부터 다음 해 1월까지 */
export const isNewYearSeason = (today: string) => { const { m } = parseISO(today); return m >= 11 || m === 1; };
/** 11 · 12월에는 다음 해 신년운세를 권한다 */
export const newYearOf = (today: string) => { const { y, m } = parseISO(today); return m >= 11 ? y + 1 : y; };
/** 25일부터는 다음 달 상세운세를 미리 권한다 */
export function monthOf(today: string): { y: number; m: number; next: boolean } {
  const { y, m, d } = parseISO(today);
  if (d < 25) return { y, m, next: false };
  return m === 12 ? { y: y + 1, m: 1, next: true } : { y, m: m + 1, next: true };
}

/** 운알톡 · 속마음은 상대·질문마다 따로 사서 목록에는 가격만 보여 준다 */
const CONSULT_ITEM = { ...ITEMS.consult('preview'), title: '운알톡 1회' };
const CRUSH_ITEM = { ...ITEMS.crush(0, ''), key: 'crush:preview', title: '그 사람의 속마음' };

export function promosOf(nav: Nav, today: string): Record<PromoKey, Promo> {
  const ny = newYearOf(today);
  const mo = monthOf(today);
  const month = `${mo.y}-${String(mo.m).padStart(2, '0')}`;
  return {
    'theme-love': {
      key: 'theme-love', track: 'theme:love', title: '연애·결혼 운세', desc: '연애 스타일 · 잘 맞는 사람 · 인연이 오는 해',
      item: ITEMS.theme('love'), verb: '자세히 보기', ref: { kind: 'theme', theme: 'love' },
      teaser: d => { const p = d as ThemePreview; return p.kind === 'love' && p.st ? `내 연애 스타일은 「${p.st}」 · 잘 맞는 사람 · 인연이 오는 해` : null; },
      go: () => nav.navigate('Theme', { kind: 'love' }),
    },
    'theme-money': {
      key: 'theme-money', track: 'theme:money', title: '재물 운세', desc: '돈 버는 방식 · 재물이 모이는 시기 · 5년 흐름',
      item: ITEMS.theme('money'), verb: '자세히 보기', ref: { kind: 'theme', theme: 'money' },
      teaser: d => { const p = d as ThemePreview; return p.kind === 'money' && p.t?.name ? `내 돈 성향은 「${p.t.name}」 · 재물이 모이는 시기 · 5년 흐름` : null; },
      go: () => nav.navigate('Theme', { kind: 'money' }),
    },
    'theme-career': {
      key: 'theme-career', track: 'theme:career', title: '직업 · 적성 운세', desc: '맞는 일 · 커리어 상승기 · 이직 타이밍',
      item: ITEMS.theme('career'), verb: '확인하기', ref: { kind: 'theme', theme: 'career' },
      teaser: d => { const p = d as ThemePreview; return p.kind === 'career' && p.jobs?.length ? `잘 맞는 일 ${p.jobs.slice(0, 2).join(' · ')} · 커리어 상승기 · 이직 타이밍` : null; },
      go: () => nav.navigate('Theme', { kind: 'career' }),
    },
    consult: {
      key: 'consult', track: 'consult', title: '운알톡', desc: '비밀 고민 · 해결법부터 · 하루 5번 무료',
      item: CONSULT_ITEM, verb: '운알이와 대화하기', go: () => nav.navigate('Tabs', { screen: 'Consult' }),
    },
    lucky: {
      key: 'lucky', track: 'lucky', title: '길일 찾기', desc: '이사 · 계약 · 고백 · 면접하기 좋은 날 TOP 5',
      item: ITEMS.lucky('move', today), verb: '자세히 보기', go: () => nav.navigate('Lucky'),
    },
    crush: {
      key: 'crush', track: 'crush', title: '그 사람의 속마음', desc: '마음 온도 · 연인 가능성 · 연락하기 좋은 날',
      item: CRUSH_ITEM, verb: '궁합 보러 가기', go: () => nav.navigate('Tabs', { screen: 'Compatibility' }),
    },
    monthly: {
      key: 'monthly', track: `monthly:${month}`, title: mo.next ? `${mo.m}월 상세운세 미리 보기` : `${mo.m}월 상세운세`,
      desc: '운세 달력 · 주차별 흐름 · 좋은 날 활용법 · 이달의 미션',
      item: ITEMS.monthly(mo.y, mo.m), verb: '자세히 보기', ref: { kind: 'monthly', month },
      teaser: d => { const p = d as MonthPreview; return p.line?.headline ? `「${p.line.headline}」 · 운세 달력 · 좋은 날과 조심할 날` : null; },
      go: () => nav.navigate('Monthly', { y: mo.y, m: mo.m }),
    },
    newyear: {
      key: 'newyear', track: `newyear:${ny}`, title: ny > parseISO(today).y ? `${ny}년 신년운세 미리 보기` : `${ny}년 신년운세`,
      desc: '올해의 사자성어 · 분야별 6대 운세 · 12개월 하나하나',
      item: ITEMS.newyear(ny), verb: '자세히 보기', ref: { kind: 'newyear', year: ny },
      teaser: d => { const p = d as YearPreview; return p.idiom?.[0] ? `${ny}년의 사자성어 「${p.idiom[0]}」 · 분야별 6대 운세 · 12개월 흐름` : null; },
      go: () => nav.navigate('NewYear', { year: ny }),
    },
    life: {
      key: 'life', track: 'life', title: '평생운 · 10년 대운', desc: '인생 그래프 · 황금기와 위기 · 앞으로 10년',
      item: ITEMS.life(), verb: '자세히 보기', go: () => nav.navigate('Life'),
    },
    spouse: {
      key: 'spouse', track: 'spouse', title: '미래 배우자 리포트', desc: '어떤 사람을, 언제, 어디서 만나게 될까?',
      item: ITEMS.spouse(), verb: '리포트 열기', ref: { kind: 'spouse' },
      teaser: d => { const p = d as SpousePreview; return p.headline ? `「${p.headline}」 · 만나는 시기와 장소까지` : null; },
      go: () => nav.navigate('Spouse'),
    },
    sajuDeep: {
      key: 'sajuDeep', track: 'saju', title: '상세 사주 해석', desc: '원국표 · 오행 · 신살 · 재물 · 연애까지',
      item: ITEMS.sajuDeep(), verb: '자세히 보기', go: () => nav.navigate('SajuDeep'),
    },
  };
}

/** 분야 → 그 분야를 더 깊이 보는 콘텐츠 */
export const PROMO_OF_CATEGORY: Record<CategoryKey, PromoKey> = { love: 'theme-love', money: 'theme-money', work: 'theme-career', relationship: 'consult' };
