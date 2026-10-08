/**
 * /fortune/combined
 * 규칙 기반 종합 엔진. AI 엔진과 같은 입력/출력(JSON) 계약을 지킨다.
 * AI 연결 실패 시 fallback으로도 사용된다.
 */
import { CombinedFortune, CombinedFortuneInput, KeywordTag } from '../../types';
import { ACTIONS, KEYWORDS } from '../../data/keywords';
import { ELEMENT_INFO } from '../../data/sajuData';
import { getWeakElement } from './sajuService';
import { clamp, pick, pickMany, seededRandom } from '../../utils/seed';

type Cat = 'love' | 'money' | 'work' | 'relationship';
const CATS: Cat[] = ['love', 'money', 'work', 'relationship'];

const SUMMARY: Record<KeywordTag, string> = {
  newMeeting: '새로운 사람과의 만남에서 좋은 흐름이 생기는 날이에요.',
  change: '작은 변화가 큰 전환점이 되는 날이에요.',
  opportunity: '기다리던 기회가 문을 두드리는 날이에요.',
  money: '돈의 흐름을 잡기 좋은 날이에요.',
  rest: '속도를 늦출수록 더 멀리 가는 날이에요.',
  focus: '한 가지에 몰입할 때 성과가 나는 날이에요.',
  expression: '마음을 말로 꺼낼수록 일이 풀리는 날이에요.',
  caution: '한 번 더 확인하는 습관이 나를 지켜주는 날이에요.',
  harmony: '함께할 때 힘이 배가 되는 날이에요.',
  challenge: '조금 어려운 선택이 나를 키우는 날이에요.',
  intuition: '첫 느낌을 믿어봐도 좋은 날이에요.',
  learning: '배운 만큼 흐름이 넓어지는 날이에요.',
};

const CAT_TEXT: Record<Cat, { high: string[]; mid: string[]; low: string[] }> = {
  love: {
    high: ['설렘이 자연스럽게 찾아와요. 먼저 건넨 한마디가 분위기를 바꿔요.', '연인과는 대화가 깊어지고, 솔로라면 새 인연의 신호가 보여요.'],
    mid: ['잔잔하지만 따뜻한 흐름이에요. 작은 관심 표현이 좋아요.', '큰 이벤트보다 일상의 배려가 마음을 움직여요.'],
    low: ['말 한마디가 오해로 번지기 쉬워요. 감정은 하루 묵혀 전해보세요.', '기대를 조금 내려놓으면 오히려 편안해져요.'],
  },
  money: {
    high: ['들어오는 흐름이 보여요. 다만 크게 벌이기보다 지키는 쪽이 유리해요.', '작은 부수입이나 뜻밖의 절약 기회가 생겨요.'],
    mid: ['무난한 흐름이에요. 지출 목록을 한 번 정리하면 마음이 가벼워져요.', '계획한 소비는 괜찮지만 충동구매는 멈춰요.'],
    low: ['지출이 새기 쉬운 날이에요. 결제 전 10초만 멈춰보세요.', '돈 이야기는 오늘보다 내일이 나아요.'],
  },
  work: {
    high: ['실력이 눈에 띄는 날이에요. 미뤄둔 보고나 제안을 꺼내보세요.', '집중력이 좋아 어려운 일도 속도가 붙어요.'],
    mid: ['해야 할 일을 차근차근 쳐내기 좋은 흐름이에요.', '협업에서 역할을 분명히 하면 효율이 올라가요.'],
    low: ['실수가 생기기 쉬우니 마감 전 한 번 더 확인하세요.', '새 일을 벌이기보다 진행 중인 일을 마무리해요.'],
  },
  relationship: {
    high: ['사람 복이 따르는 날이에요. 모임이나 약속에서 좋은 연결이 생겨요.', '주변에서 먼저 도움을 주려는 사람이 나타나요.'],
    mid: ['편안한 관계가 힘이 되는 날이에요. 고마움을 표현해보세요.', '적당한 거리가 관계를 오래 지켜줘요.'],
    low: ['사소한 말에 서운함이 생길 수 있어요. 들어주는 쪽에 서보세요.', '오늘은 넓은 관계보다 가까운 한 사람에게 집중해요.'],
  },
};

const LUCKY_TIMES = ['07:00~09:00', '09:00~11:00', '11:00~13:00', '13:00~15:00', '15:00~17:00', '17:00~19:00', '19:00~21:00'];

export function combineRuleBased(input: CombinedFortuneInput): CombinedFortune {
  const { user, date, saju, thai, mbti, blood, interests } = input;
  const analyses = [saju, thai, mbti, blood];
  const rand = seededRandom(`${user.id}-${user.birthDate}-${date}`);

  // 1) 분야별 점수 = 기본 70 + 모듈 편향 합 + 일일 변동
  const scores = {} as Record<Cat, number>;
  CATS.forEach(c => {
    const bias = analyses.reduce((s, a) => s + a.scoreBias[c], 0);
    const noise = rand() * 14 - 6;
    const interestBoost = interests.includes(c) ? 2 : 0;
    scores[c] = clamp(70 + bias * 0.8 + noise + interestBoost, 52, 98);
  });
  const avg = CATS.reduce((s, c) => s + scores[c], 0) / 4;
  const totalScore = clamp(avg + (rand() * 6 - 2), 55, 97);

  // 2) 키워드 집계: 두 개 이상 관점에서 나온 키워드 = 공통 키워드
  const count = new Map<KeywordTag, number>();
  analyses.forEach(a => new Set(a.tags).forEach(t => count.set(t, (count.get(t) ?? 0) + 1)));
  const ranked = [...count.entries()].sort((a, b) => b[1] - a[1] || (rand() - 0.5)).map(([t]) => t);
  const common = ranked.filter(t => (count.get(t) ?? 0) >= 2);
  const top: KeywordTag[] = [...common, ...ranked.filter(t => !common.includes(t))].slice(0, 3);

  // 3) 행동 조언
  const good = new Set<string>();
  top.forEach(t => good.add(pick(rand, ACTIONS[t].good)));
  const avoidPool = new Set<string>();
  top.forEach(t => ACTIONS[t].avoid.forEach(a => avoidPool.add(a)));
  if (scores.money < 72) avoidPool.add('충동적인 소비');
  if (scores.relationship < 72) avoidPool.add('사소한 일로 논쟁하기');
  ['감정적인 결정', '지나친 고민'].forEach(a => avoidPool.add(a));
  const avoid = pickMany(rand, [...avoidPool], 3);

  // 4) 분야별 문장
  const band = (v: number) => (v >= 85 ? 'high' : v >= 72 ? 'mid' : 'low') as 'high' | 'mid' | 'low';
  const categoryTexts = Object.fromEntries(CATS.map(c => [c, pick(rand, CAT_TEXT[c][band(scores[c])])])) as Record<Cat, string>;

  // 5) 행운 요소: 사주에서 부족한 오행의 색
  const weak = ELEMENT_INFO[getWeakElement(user)];
  const best = CATS.reduce((a, b) => (scores[a] >= scores[b] ? a : b));
  const bestLabel = { love: '연애운', money: '재물운', work: '직장운', relationship: '인간관계운' }[best];
  const k0 = KEYWORDS[top[0]].label;

  const combinedStory =
    `사주에서는 '${saju.headline}', 태국 점성술에서는 '${thai.headline}'이라는 흐름이 보여요. ` +
    `MBTI로 보면 '${mbti.headline}'이고, 혈액형 관점에서는 "${blood.headline}"라는 조언이 나왔어요. ` +
    (common.length
      ? `네 가지 관점 중 여러 곳에서 공통으로 '${common.map(t => KEYWORDS[t].label).join("', '")}'이(가) 겹쳐요. `
      : `관점마다 결은 조금씩 다르지만 '${k0}'이(가) 가장 또렷하게 나타나요. `) +
    `오늘은 ${bestLabel}이 가장 강하니, 그 방향으로 한 걸음 먼저 움직여 보세요.`;

  return {
    totalScore,
    summary: SUMMARY[top[0]],
    keywords: top.map(t => KEYWORDS[t].label),
    commonKeywords: common.map(t => KEYWORDS[t].label),
    love: scores.love,
    money: scores.money,
    work: scores.work,
    relationship: scores.relationship,
    categoryTexts,
    combinedStory,
    goodActions: [...good].slice(0, 3),
    avoidActions: avoid,
    luckyColor: weak.color,
    luckyColorHex: weak.hex,
    luckyNumber: 1 + Math.floor(rand() * 9),
    luckyTime: pick(rand, LUCKY_TIMES),
  };
}
