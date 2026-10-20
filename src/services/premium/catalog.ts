/**
 * 포인트 상품 카탈로그 — 1,000원 = 100P, 항목별 열람.
 * 키는 서버 열람권 키(docs/payment-design.md 3.2)와 같다. 가격의 기준은 서버이고 여기는 화면 표시용.
 */
import { PURPOSE } from './data';
import { addDays } from './helpers';
import { PurposeKey } from '../../types/premium';

export interface Item {
  key: string; title: string; cost: number; scope: string; desc: string;
  until?: string; orig?: number; includes?: string[];
}

export type ThemeKind = 'love' | 'money' | 'career';
export const THEME_T: Record<ThemeKind, string> = { love: '연애·결혼 운세', money: '재물 운세', career: '직업·적성 운세' };

export const ITEMS = {
  sajuDeep: (): Item => ({ key: 'saju', title: '상세 사주 해석', cost: 300, scope: '한 번 열면 계속 볼 수 있어요', desc: '사주 원국표 · 오행 균형 · 타고난 본성 · 십성과 신살 · 연애 · 재물 · 직업 · 건강 · 대운 · 개운법' }),
  life: (): Item => ({ key: 'life', title: '평생운 · 10년 대운', cost: 500, scope: '한 번 열면 계속 볼 수 있어요', desc: '초년·중년·말년 · 인생 그래프 · 10년 대운 · 황금기와 조심할 시기 · 앞으로 10년의 해마다 흐름' }),
  newyear: (y: number): Item => ({ key: 'newyear:' + y, title: y + '년 신년운세', cost: 300, scope: y + '년 운세를 계속 볼 수 있어요', desc: '올해 총운과 사자성어 · 띠와 삼재 · 분야별 6대 운세 · 분기 전략 · 12개월 흐름 · 개운법' }),
  monthly: (y: number, m: number): Item => ({ key: `monthly:${y}-${String(m).padStart(2, '0')}`, title: `${y}년 ${m}월 상세운세`, cost: 100, scope: '그달의 운세를 계속 볼 수 있어요', desc: '이달의 총운 · 운세 달력 · 주차별 흐름 · 분야별 운세 · 좋은 날과 조심할 날 · 이달의 미션' }),
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
  spouse: (): Item => ({ key: 'spouse', title: '미래 배우자 리포트', cost: 300, scope: '한 번 열면 계속 볼 수 있어요', desc: '배우자의 성격·외모·직업·경제관 · 알아보는 신호 · 찰떡 조건 · 나의 배우자 운 · 6년 인연 지수와 결혼 시기 · 만나는 길과 장소 · 결혼 생활 미리보기 · 놓치기 쉬운 점 · 개운법' }),
  crush: (compatibilityId: number, name: string): Item => ({ key: 'crush:' + compatibilityId, title: name + '님의 속마음', cost: 150, scope: '이 상대의 속마음은 계속 볼 수 있어요', desc: '마음 온도와 연인 발전 가능성 · 나를 어떻게 느끼는지와 끌리는 이유 · 호감 신호 · 관계 속도와 오해 포인트 · 3개월 흐름 · 연락·고백하기 좋은 날 · 대화 주제와 첫 메시지' }),
  consult: (id: string): Item => ({ key: 'consult:' + id, title: '고민 상담 1회', cost: 100, scope: '24시간 동안 10번 이어서 물어볼 수 있어요', desc: '고민에 대한 한 줄 답 · 마음 읽기 · 사주로 본 나 · 이번 달 흐름과 3개월 전망 · 이렇게 해 보세요 · 피할 것 · 행동하기 좋은 날 · 이어 묻기 10번' }),
  compat: (compatibilityId: number, name: string): Item => ({
    key: 'compat:' + compatibilityId, title: name + '님과 심층 궁합', cost: 150, scope: '이 상대와의 궁합은 계속 볼 수 있어요',
    desc: '두 사람 사주 비교 · 사주로 본 인연 · 서로에게 어떤 사람인지 · MBTI 4축 · 연애·결혼·소통·금전 궁합 · 서로를 위한 조언 · 좋은 날',
  }),
};

export const BUNDLE: Item = {
  key: 'bundle:life', title: '인생 패키지', cost: 1100, orig: 1400, scope: '포함된 콘텐츠를 모두 계속 볼 수 있어요',
  desc: '상세 사주 해석 · 평생운 · 테마 운세 3종', includes: ['saju', 'life', 'theme:love', 'theme:money', 'theme:career'],
};

const LIST_COST: Record<string, number> = { saju: 300, life: 500, 'theme:love': 200, 'theme:money': 200, 'theme:career': 200 };

/**
 * 내 인생 패키지 — 이미 가진 항목은 빼고 남은 항목 정가에 같은 할인율(1,100/1,400), 10P 단위 내림.
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
  ['오늘의 운세 · 4가지 분석 · 종합', '무료'], ['주간 운세 · 기본 궁합', '무료'], ['찰떡 MBTI · 사주 캐릭터 · 오늘의 부적', '무료'], ['월별 상세운세', '100P / 월'], ['신년운세', '300P / 해'],
  ['상세 사주 해석', '300P · 소장'], ['평생운 · 10년 대운', '500P · 소장'], ['테마 운세 (연애 · 재물 · 직업)', '각 200P · 소장'],
  ['심층 궁합', '150P / 상대 1명'], ['그 사람의 속마음', '150P / 상대 1명'], ['미래 배우자 리포트', '300P · 소장'], ['말 못 할 고민 상담', '100P / 1회'], ['길일 찾기', '50P / 목적별 7일'], ['인생 패키지', '1,100P (1,400P → 21% 할인)'],
];

/** 충전 상품: [원, 포인트, 보너스]. 상품 ID는 서버와 같다 (points_{원}). */
export const PACKS: [number, number, number][] = [[1000, 100, 0], [3000, 300, 0], [5000, 500, 50], [10000, 1000, 150], [30000, 3000, 600]];
export const packProductId = (won: number) => `points_${won}`;

export const fmtP = (n: number) => n.toLocaleString('ko-KR') + 'P';

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
    default: return '유료 콘텐츠';
  }
}
