/**
 * 포인트 상품 카탈로그 — 900원 = 100알, 항목별 열람.
 * 키는 서버 열람권 키(docs/payment-design.md 3.2)와 같다. 가격의 기준은 서버이고 여기는 화면 표시용.
 */
import { PURPOSE } from './data';
import { addDays } from './helpers';
import { PurposeKey } from '../../types/premium';
import { Relationship } from '../../types';
import { RELATIONSHIP_INFO } from '../../data/relationships';

export interface Item {
  key: string; title: string; cost: number; scope: string; desc: string;
  until?: string; orig?: number; includes?: string[];
  /** 이벤트 할인 중 (가격 옆에 '이벤트' 딱지). orig에 원래 가격 */
  event?: boolean;
}

/** 신년운세는 그해 1~12월 월별 상세운세를 함께 연다. 서버 premium-catalog 와 같은 값 */
export const NEWYEAR_COST = 500;
export const MONTHLY_COST = 40;

/** 월별 상세운세 키(monthly:YYYY-MM)를 함께 여는 신년운세 키, 다른 키면 null (서버 newYearKeyOfMonth) */
export const newYearKeyOfMonth = (key: string): string | null => {
  const m = /^monthly:(\d{4})-(0[1-9]|1[0-2])$/.exec(key);
  return m ? 'newyear:' + m[1] : null;
};

/**
 * 내 신년운세 — 그해 월별 상세운세를 이미 연 달마다 40알씩 뺀다. 서버(premium-catalog credits)와 같은 계산이고
 * 결제 금액은 서버가 정한다. owned 는 신년운세가 아직 없을 때 부르므로 직접 연 달만 센다.
 */
export function newYearFor(y: number, owned: (key: string) => boolean): Item {
  const item = ITEMS.newyear(y);
  const held = Array.from({ length: 12 }, (_, i) => ITEMS.monthly(y, i + 1).key).filter(owned).length;
  if (!held) return item;
  return { ...item, cost: Math.max(0, item.cost - held * MONTHLY_COST), orig: item.cost, desc: `${item.desc} · 이미 연 ${held}개월은 빼고 계산했어요` };
}

export type ThemeKind = 'love' | 'money' | 'career';
export const THEME_T: Record<ThemeKind, string> = { love: '연애·결혼 운세', money: '재물 운세', career: '직업·적성 운세' };

export const ITEMS = {
  sajuDeep: (): Item => ({ key: 'saju', title: '상세 사주 해석', cost: 300, scope: '한 번 열면 계속 볼 수 있어요', desc: '사주 원국표 · 오행 균형 · 타고난 본성 · 십성과 신살 · 연애 · 재물 · 직업 · 건강 · 대운 · 개운법' }),
  life: (): Item => ({ key: 'life', title: '평생운 · 10년 대운', cost: 500, scope: '한 번 열면 계속 볼 수 있어요', desc: '초년·중년·말년 · 인생 그래프 · 10년 대운 · 황금기와 조심할 시기 · 앞으로 10년의 해마다 흐름' }),
  newyear: (y: number): Item => ({ key: 'newyear:' + y, title: y + '년 신년운세', cost: NEWYEAR_COST, scope: `${y}년 운세와 1~12월 상세운세를 계속 볼 수 있어요`, desc: `올해 총운과 사자성어 · 띠와 삼재 · 분야별 6대 운세 · 분기 전략 · 12개월 흐름 · 개운법 · ${y}년 1~12월 월별 상세운세 포함` }),
  monthly: (y: number, m: number): Item => ({ key: `monthly:${y}-${String(m).padStart(2, '0')}`, title: `${y}년 ${m}월 상세운세`, cost: MONTHLY_COST, scope: '그달의 운세를 계속 볼 수 있어요', desc: '이달의 총운 · 운세 달력 · 주차별 흐름 · 분야별 운세 · 좋은 날과 조심할 날 · 이달의 미션' }),
  theme: (k: ThemeKind): Item => ({
    key: 'theme:' + k, title: THEME_T[k], cost: 200, scope: '한 번 열면 계속 볼 수 있어요',
    desc: {
      love: '9개 섹션 · 배우자 자리 · 배우자의 별 · 연애 패턴 · 잘 맞는 사람 · 매력 · 연애운이 강한 달 · 결혼 흐름',
      money: '9개 섹션 · 재물 그릇 · 버는 방식 · 쓰는 습관 · 관리법 · 재물이 모이는 시기 · 5년 흐름 · 개운법',
      career: '9개 섹션 · 직업 유형 · 맞는 업종 · 일하는 스타일 · 리더십 · 커리어 상승기 · 5년 흐름 · 이직 타이밍',
    }[k],
  }),
  lucky: (pk: PurposeKey, today: string): Item => {
    const P = PURPOSE.find(p => p[0] === pk)!;
    return { key: 'lucky:' + pk, title: P[2] + ' 길일 TOP 5', cost: 50, scope: '7일 동안 볼 수 있어요', until: addDays(today, 7), desc: 'TOP 5 상세 이유 · 귀인일 · 피해야 할 날 · 당일 팁' };
  },
  /** 하루 한 번 무료로 뽑은 뒤 같은 날 다른 프로필의 오늘의 운세 (서버 daily:{date}, 값은 서버가 준 drawCost) */
  daily: (date: string, name: string, cost: number): Item => ({
    key: 'daily:' + date, title: name + '님의 오늘의 운세', cost, scope: '오늘 하루 볼 수 있어요',
    desc: '오늘의 종합운과 분야별 점수 · 오늘의 이야기 · 해볼 일과 피할 일 · 타로 한 장',
  }),
  spouse: (): Item => ({ key: 'spouse', title: '미래 배우자 리포트', cost: 50, orig: 300, event: true, scope: '한 번 열면 계속 볼 수 있어요', desc: '배우자의 성격·외모·직업·경제관 · 알아보는 신호 · 찰떡 조건 · 나의 배우자 운 · 6년 인연 지수와 결혼 시기 · 만나는 길과 장소 · 결혼 생활 미리보기 · 놓치기 쉬운 점 · 개운법' }),
  /** 등록한 가족(아이 · 엄마 · 아빠)마다 산다 (서버 child:{id}, 프로필을 고쳐도 그대로) */
  child: (childSetId: number, name: string): Item => ({ key: 'child:' + childSetId, title: name ? `${name} · 우리 아이 사주` : '우리 아이 사주', cost: 300, scope: '이 아이의 사주는 계속 볼 수 있어요', desc: '기질 유형과 매력 · 재능 TOP 3와 키워 주는 법 · 맞는 공부 방식 · 혼낼 때 · 친구 · 속상할 때 · 아이 사주 속 엄마·아빠의 자리 · 대운으로 본 자라는 흐름 · 사춘기와 입학 · 올해' }),
  crush: (compatibilityId: number, name: string): Item => ({ key: 'crush:' + compatibilityId, title: name + '님의 속마음', cost: 150, scope: '이 상대의 속마음은 계속 볼 수 있어요', desc: '마음 온도와 연인 발전 가능성 · 나를 어떻게 느끼는지와 끌리는 이유 · 호감 신호 · 관계 속도와 오해 포인트 · 3개월 흐름 · 연락·고백하기 좋은 날 · 대화 주제와 첫 메시지' }),
  consult: (id: string): Item => ({ key: 'consult:' + id, title: '운알톡', cost: 5, scope: '매일 대화 2개는 무료, 그다음은 한 마디 5알', desc: '운알이와 가볍게 나누는 대화 · 오늘의 운세와 리포트를 기억하고 이어서 이야기해요' }),
  pet: (petId: number, name: string): Item => ({ key: 'pet:' + petId, title: name + ' · 반려동물 궁합', cost: 150, scope: '이 아이와의 궁합은 계속 볼 수 있어요', desc: '이 아이 이야기와 매력 · 이럴 때의 마음 · 타고난 성향과 지금 모습 · 우리 사이와 엇갈리는 순간 · 하루 루틴과 놀이 · 계절별 돌봄 · 함께 놀기 좋은 날 · 아이가 보내는 편지' }),
  compat: (compatibilityId: number, name: string, relationship: Relationship = 'lover', mbtiKnown = true): Item => ({
    key: 'compat:' + compatibilityId, title: name + '님과 심층 궁합', cost: 150, scope: '이 상대와의 궁합은 계속 볼 수 있어요',
    desc: `두 사람 사주 비교 · 사주로 본 인연 · 서로에게 어떤 사람인지 · ${mbtiKnown ? 'MBTI 4축 · ' : ''}${Object.values(RELATIONSHIP_INFO[relationship].fields).map(f => f.replace(/ 궁합$/, '')).join('·')} 궁합 · 서로를 위한 조언 · 좋은 날`,
  }),
};

export const BUNDLE: Item = {
  key: 'bundle:life', title: '인생 패키지', cost: 1100, orig: 1400, scope: '포함된 콘텐츠를 모두 계속 볼 수 있어요',
  desc: '상세 사주 해석 · 평생운 · 테마 운세 3종', includes: ['saju', 'life', 'theme:love', 'theme:money', 'theme:career'],
};

const LIST_COST: Record<string, number> = { saju: 300, life: 500, 'theme:love': 200, 'theme:money': 200, 'theme:career': 200 };

/**
 * 내 인생 패키지 — 이미 가진 항목은 빼고 남은 항목 정가에 같은 할인율(1,100/1,400), 10알 단위 내림.
 * 포함 항목을 반 이상 가졌으면 팔지 않는다(null). 서버(premium-catalog priceFor)와 같은 계산이고, 결제 금액은 서버가 정한다.
 */
export function bundleFor(owned: (key: string) => boolean): Item | null {
  const includes = BUNDLE.includes!;
  const have = includes.filter(owned);
  if (have.length * 2 >= includes.length) return null;
  if (!have.length) return BUNDLE;
  const missing = includes.filter(k => !owned(k)).reduce((sum, k) => sum + LIST_COST[k], 0);
  return { ...BUNDLE, cost: Math.floor((missing * BUNDLE.cost) / BUNDLE.orig! / 10) * 10, orig: missing, desc: BUNDLE.desc + ' · 이미 가진 항목은 빼고 계산했어요' };
}

export const PRICE_TABLE: [string, string][] = [
  ['오늘의 운세 · 4가지 분석 · 종합', '무료'], ['주간 운세 · 기본 궁합', '무료'], ['찰떡 MBTI · 사주 캐릭터 · 오늘의 부적', '무료'], ['월별 상세운세', '40알 / 월'], ['신년운세', '500알 / 해 · 그해 월별 상세운세 포함 (연 달은 40알씩 빼요)'],
  ['상세 사주 해석', '300알 · 소장'], ['평생운 · 10년 대운', '500알 · 소장'], ['테마 운세 (연애 · 재물 · 직업)', '각 200알 · 소장'],
  ['심층 궁합', '150알 / 상대 1명'], ['그 사람의 속마음', '150알 / 상대 1명'], ['미래 배우자 리포트', '이벤트 50알 (300알 → 50알) · 소장'], ['우리 아이 사주', '300알 / 아이 1명'], ['운알톡', '한 마디 5알 (매일 대화 2개 무료)'], ['길일 찾기', '50알 / 목적별 7일'], ['인생 패키지', '1,100알 (1,400알 → 21% 할인)'],
];

/** 충전 상품: [원, 포인트, 보너스, 상품 ID]. 상품 ID는 서버와 같고 처음 가격을 그대로 쓴다 (points_1000 = 900원). */
export const PACKS: Pack[] = [
  [900, 100, 0, 'points_1000'], [2900, 300, 0, 'points_3000'], [4900, 500, 50, 'points_5000'], [9900, 1000, 150, 'points_10000'], [29900, 3000, 600, 'points_30000'],
];

export type Pack = [number, number, number, string];

/** 그 상품으로 받는 보너스 알. 첫 충전이면 1+1 (보너스 = 상품 알만큼, 서버 chargeBonusOf 와 같은 규칙) */
export const packBonus = (pack: Pack, firstCharge: boolean) => (firstCharge ? Math.max(pack[1], pack[2]) : pack[2]);

/** 모자란 알을 한 번에 채우는 가장 작은 상품 (어느 것도 못 채우면 가장 큰 상품) */
export function packFor(shortfall: number, firstCharge: boolean): Pack {
  return PACKS.find(pack => pack[1] + packBonus(pack, firstCharge) >= shortfall) ?? PACKS[PACKS.length - 1];
}

/** 충전 후 돌아갈 앱 안 경로만 받는다 (다른 사이트로 보내지 않게) */
export const safeReturnTo = (path?: string): string | undefined =>
  typeof path === 'string' &&
  path.startsWith('/') &&
  !/^\/(?:\/|%2f|%5c)/i.test(path) &&
  !/[\\\s]/.test(path) &&
  !path.startsWith('/charge') ? path : undefined;

/**
 * 정기 구독 — 서버 상품 premium_monthly 와 같은 ID (docs/payment-design.md 4.6).
 * 웹에서 토스 정기결제로 구독한다. 계약 키를 받기 전까지 서버는 토스 테스트 키로 결제한다.
 */
export const SUBSCRIPTION = {
  productId: 'premium_monthly', name: '운Pick 프리미엄', won: 9900, period: '1개월',
  // 서버 SUBSCRIPTION_BENEFITS 와 같은 내용. 광고는 아직 없지만 생겨도 구독자에겐 보이지 않는다
  benefits: ['운알톡 무제한', '월별 상세운세 매달 무료', '출석 체크 알 2배', '광고 없이 이용'],
};

/** 문장 속 금액 ("100알"). 숫자 옆에 마스코트 아이콘을 둘 수 있는 자리는 Kit의 Amount를 쓴다 */
export const fmtP = (n: number) => n.toLocaleString('ko-KR') + '알';
export const fmtN = (n: number) => n.toLocaleString('ko-KR');

/** 숫자를 읽은 소리의 받침 — 끝자리(0이면 십·백·천·만은 모두 받침 있음): 일·칠·팔은 ㄹ */
function numFinal(n: number): 'none' | 'l' | 'other' {
  const d = Math.abs(n) % 10;
  if (d === 0) return 'other';
  if (d === 1 || d === 7 || d === 8) return 'l';
  if (d === 3 || d === 6) return 'other';
  return 'none';
}
/** 아이콘+숫자 뒤에 붙는 조사: 100으로 / 2로 · 100이 / 2가 */
export const ro = (n: number) => (numFinal(n) === 'other' ? '으로' : '로');
export const iga = (n: number) => (numFinal(n) === 'none' ? '가' : '이');

/**
 * 콘텐츠 키 → 그 콘텐츠를 보는 화면 경로 (풀이 완성 알림·토스트를 눌렀을 때).
 * 궁합·속마음은 궁합 탭에서 그 상대를, 반려동물은 그 아이를, 길일은 그 목적을 골라 연다.
 * to: 어느 프로필로(profileId) · 어느 열람권으로(entitlementId) 열지 — 보유 콘텐츠 목록에서 고른 것 그대로 연다.
 *     궁합·속마음은 궁합 기록에 묶여 있어서 붙이지 않는다.
 */
export function hrefOfKey(key: string, to?: { profileId?: number | null; entitlementId?: number | null }): string | null {
  const [kind, arg] = key.split(':');
  const base = baseHrefOfKey(kind, arg);
  if (!base || !to || kind === 'compat' || kind === 'crush' || kind === 'child') return base;
  const q = [to.profileId != null ? `profileId=${to.profileId}` : null, to.entitlementId != null ? `entitlementId=${to.entitlementId}` : null].filter(Boolean);
  return q.length ? `${base}${base.includes('?') ? '&' : '?'}${q.join('&')}` : base;
}

function baseHrefOfKey(kind: string, arg: string | undefined): string | null {
  switch (kind) {
    case 'saju': return '/premium/saju';
    case 'life': return '/premium/life';
    case 'spouse': return '/spouse';
    case 'newyear': return `/premium/new-year?year=${arg}`;
    case 'monthly': { const [y, m] = (arg ?? '').split('-'); return `/premium/monthly?y=${y}&m=${Number(m)}`; }
    case 'theme': return `/premium/theme/${arg}`;
    case 'lucky': return `/premium/lucky?purpose=${arg}`;
    case 'compat':
    case 'crush': return `/compatibility?resultId=${arg}`;
    case 'pet': return `/pet?petId=${arg}`;
    case 'child': return `/child?childId=${arg}`;
    default: return null;
  }
}

/** 열람권 키 → 사람이 읽는 이름 (알림 문구용). */
export function titleOfKey(key: string): string {
  const [kind, arg] = key.split(':');
  switch (kind) {
    case 'saju': return '상세 사주 해석';
    case 'life': return '평생운 · 10년 대운';
    case 'spouse': return '미래 배우자 리포트';
    case 'newyear': return `${arg}년 신년운세`;
    case 'monthly': { const [y, m] = arg.split('-'); return `${y}년 ${Number(m)}월 상세운세`; }
    case 'theme': return THEME_T[arg as ThemeKind] ?? '테마 운세';
    case 'lucky': return '길일 찾기';
    case 'compat': return '심층 궁합';
    case 'crush': return '그 사람의 속마음';
    case 'pet': return '반려동물 궁합';
    case 'child': return '우리 아이 사주';
    default: return '유료 콘텐츠';
  }
}
