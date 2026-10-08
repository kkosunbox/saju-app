/** 태국 전통: 태어난 요일(수요일은 낮/밤 구분)에 따라 수호 행성과 색이 정해진다 */
export type ThaiDay = 'sun' | 'mon' | 'tue' | 'wedDay' | 'wedNight' | 'thu' | 'fri' | 'sat';

export const THAI_DAYS: Record<ThaiDay, {
  label: string; planet: string; planetKo: string; color: string; hex: string;
  cautionColor: string; trait: string;
}> = {
  sun: { label: '일요일', planet: 'Sun', planetKo: '태양', color: '빨강', hex: '#D9534F', cautionColor: '파랑', trait: '당당하고 존재감이 뚜렷한 리더형' },
  mon: { label: '월요일', planet: 'Moon', planetKo: '달', color: '노랑', hex: '#E6B422', cautionColor: '빨강', trait: '섬세하고 따뜻한 공감형' },
  tue: { label: '화요일', planet: 'Mars', planetKo: '화성', color: '분홍', hex: '#E77AA8', cautionColor: '노랑', trait: '용감하고 추진력 있는 행동형' },
  wedDay: { label: '수요일 낮', planet: 'Mercury', planetKo: '수성', color: '초록', hex: '#4E9A6B', cautionColor: '분홍', trait: '말재주 좋고 영리한 소통형' },
  wedNight: { label: '수요일 밤', planet: 'Rahu', planetKo: '라후', color: '회색', hex: '#7D7F87', cautionColor: '주황', trait: '독창적이고 직관이 강한 탐구형' },
  thu: { label: '목요일', planet: 'Jupiter', planetKo: '목성', color: '주황', hex: '#E58A3A', cautionColor: '보라', trait: '지혜롭고 배움을 즐기는 스승형' },
  fri: { label: '금요일', planet: 'Venus', planetKo: '금성', color: '하늘색', hex: '#5AA9E6', cautionColor: '회색', trait: '매력 있고 감각적인 예술가형' },
  sat: { label: '토요일', planet: 'Saturn', planetKo: '토성', color: '보라', hex: '#7A56B8', cautionColor: '초록', trait: '끈기 있고 신중한 장인형' },
};

export const WEEKDAY_TO_THAI: ThaiDay[] = ['sun', 'mon', 'tue', 'wedDay', 'thu', 'fri', 'sat'];

/** MVP 규칙: 요일 행성 간 우호 관계 (향후 전문가 검수 데이터로 교체) */
export const THAI_FRIENDS: Record<ThaiDay, ThaiDay[]> = {
  sun: ['wedDay', 'thu'],
  mon: ['thu', 'fri'],
  tue: ['sat', 'sun'],
  wedDay: ['sun', 'fri'],
  wedNight: ['tue', 'sat'],
  thu: ['mon', 'sun'],
  fri: ['mon', 'wedDay'],
  sat: ['tue', 'thu'],
};
