/** 궁합 관계 — 관계마다 분야 이름과 풀이가 달라진다 (server: CompatibilityRelationship). */
import { Relationship } from '../types';

type ScoreKey = 'love' | 'personality' | 'conversation' | 'money';

export const RELATIONSHIPS: { k: Relationship; l: string; hint: string }[] = [
  { k: 'lover', l: '연인', hint: '썸·연애·부부' },
  { k: 'friend', l: '친구', hint: '친구·지인' },
  { k: 'family', l: '가족', hint: '부모·형제·친척' },
  { k: 'work', l: '직장·비즈니스', hint: '동료·상사·거래처' },
];

export const RELATIONSHIP_INFO: Record<Relationship, {
  label: string;
  /** 결과 화면 가운데 표시 (연인은 하트 아이콘) */
  han: string;
  /** 첫 분야(love 점수)의 낙관 */
  seal: string;
  /** 분야별 궁합 이름 */
  bars: Record<ScoreKey, string>;
  /** 심층 궁합의 분야별 풀이 이름 (love · life · talk · money) */
  fields: Record<'love' | 'life' | 'talk' | 'money', string>;
}> = {
  lover: {
    label: '연인', han: '緣', seal: '緣',
    bars: { love: '연애 궁합', personality: '성격 궁합', conversation: '대화 궁합', money: '금전 궁합' },
    fields: { love: '연애 궁합', life: '결혼·생활 궁합', talk: '소통 궁합', money: '금전 궁합' },
  },
  friend: {
    label: '친구', han: '友', seal: '友',
    bars: { love: '우정 궁합', personality: '성격 궁합', conversation: '대화 궁합', money: '금전 궁합' },
    fields: { love: '우정 궁합', life: '함께 지내기', talk: '소통 궁합', money: '돈 거래 궁합' },
  },
  family: {
    label: '가족', han: '家', seal: '情',
    bars: { love: '정(情) 궁합', personality: '성격 궁합', conversation: '대화 궁합', money: '살림 궁합' },
    fields: { love: '정(情) 궁합', life: '한집 생활 궁합', talk: '소통 궁합', money: '살림·돈 궁합' },
  },
  work: {
    label: '직장·비즈니스', han: '業', seal: '協',
    bars: { love: '협업 궁합', personality: '업무 스타일', conversation: '소통 궁합', money: '성과 궁합' },
    fields: { love: '협업 궁합', life: '업무 스타일 궁합', talk: '소통 궁합', money: '성과·돈 궁합' },
  },
};

/** 관계가 없던 예전 기록은 연인 궁합이었다 */
export const relationshipOf = (r: { relationship?: Relationship }): Relationship => r.relationship ?? 'lover';
