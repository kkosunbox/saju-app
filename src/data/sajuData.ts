export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export const STEMS = [
  { ko: '갑', hanja: '甲', element: 'wood' as Element, yang: true },
  { ko: '을', hanja: '乙', element: 'wood' as Element, yang: false },
  { ko: '병', hanja: '丙', element: 'fire' as Element, yang: true },
  { ko: '정', hanja: '丁', element: 'fire' as Element, yang: false },
  { ko: '무', hanja: '戊', element: 'earth' as Element, yang: true },
  { ko: '기', hanja: '己', element: 'earth' as Element, yang: false },
  { ko: '경', hanja: '庚', element: 'metal' as Element, yang: true },
  { ko: '신', hanja: '辛', element: 'metal' as Element, yang: false },
  { ko: '임', hanja: '壬', element: 'water' as Element, yang: true },
  { ko: '계', hanja: '癸', element: 'water' as Element, yang: false },
];

export const BRANCHES = [
  { ko: '자', hanja: '子', animal: '쥐', element: 'water' as Element },
  { ko: '축', hanja: '丑', animal: '소', element: 'earth' as Element },
  { ko: '인', hanja: '寅', animal: '호랑이', element: 'wood' as Element },
  { ko: '묘', hanja: '卯', animal: '토끼', element: 'wood' as Element },
  { ko: '진', hanja: '辰', animal: '용', element: 'earth' as Element },
  { ko: '사', hanja: '巳', animal: '뱀', element: 'fire' as Element },
  { ko: '오', hanja: '午', animal: '말', element: 'fire' as Element },
  { ko: '미', hanja: '未', animal: '양', element: 'earth' as Element },
  { ko: '신', hanja: '申', animal: '원숭이', element: 'metal' as Element },
  { ko: '유', hanja: '酉', animal: '닭', element: 'metal' as Element },
  { ko: '술', hanja: '戌', animal: '개', element: 'earth' as Element },
  { ko: '해', hanja: '亥', animal: '돼지', element: 'water' as Element },
];

export const ELEMENT_INFO: Record<Element, { ko: string; hanja: string; color: string; hex: string; nature: string }> = {
  wood: { ko: '목', hanja: '木', color: '초록', hex: '#4E9A6B', nature: '뻗어나가는 성장의 기운' },
  fire: { ko: '화', hanja: '火', color: '코랄', hex: '#E9765B', nature: '밝게 드러나는 열정의 기운' },
  earth: { ko: '토', hanja: '土', color: '베이지', hex: '#C9A56B', nature: '중심을 잡는 안정의 기운' },
  metal: { ko: '금', hanja: '金', color: '실버 화이트', hex: '#A7ADB8', nature: '맺고 끊는 결단의 기운' },
  water: { ko: '수', hanja: '水', color: '네이비', hex: '#34508C', nature: '스며드는 지혜의 기운' },
};

// 상생: key가 value를 생한다
export const GENERATES: Record<Element, Element> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
// 상극: key가 value를 극한다
export const CONTROLS: Record<Element, Element> = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

/** 오늘 일진과 내 일간의 관계(십성 대분류) */
export type TenGodGroup = 'peer' | 'resource' | 'output' | 'wealth' | 'officer';

export const TEN_GOD_TEXT: Record<TenGodGroup, { name: string; headline: string; desc: string }> = {
  peer: {
    name: '비겁(比劫)',
    headline: '나와 같은 기운이 모이는 날',
    desc: '비슷한 결을 가진 사람들과 힘을 합치기 좋은 흐름이에요. 다만 고집이 세지기 쉬우니 양보 한 번이 판을 부드럽게 만들어요.',
  },
  resource: {
    name: '인성(印星)',
    headline: '나를 채워주는 기운이 들어오는 날',
    desc: '배움과 도움이 들어오는 흐름이에요. 조언을 구하거나 공부하기 좋고, 몸과 마음을 충전하기에도 알맞아요.',
  },
  output: {
    name: '식상(食傷)',
    headline: '나를 표현하는 기운이 흐르는 날',
    desc: '말과 아이디어가 잘 풀리는 흐름이에요. 새로운 사람을 만나거나 내 생각을 드러낼수록 좋은 반응이 돌아와요.',
  },
  wealth: {
    name: '재성(財星)',
    headline: '결과와 재물이 손에 잡히는 날',
    desc: '노력한 만큼 손에 쥐는 것이 생기는 흐름이에요. 금전 기회가 보이지만, 욕심을 조금 덜어낼수록 오래 남아요.',
  },
  officer: {
    name: '관성(官星)',
    headline: '책임과 시험이 찾아오는 날',
    desc: '해야 할 일과 기대가 몰리는 흐름이에요. 부담스럽게 느껴질 수 있지만, 차근차근 해내면 인정으로 돌아와요.',
  },
};
