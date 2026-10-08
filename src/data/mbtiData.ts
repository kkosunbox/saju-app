import { KeywordTag, MBTI } from '../types';

export const MBTI_LIST: MBTI[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

export const MBTI_INFO: Record<MBTI, { nickname: string; strength: string; watch: string }> = {
  INTJ: { nickname: '전략가', strength: '큰 그림을 설계하는 힘', watch: '혼자 결론 내리기' },
  INTP: { nickname: '탐구가', strength: '원리를 파고드는 호기심', watch: '생각만 하다 타이밍 놓치기' },
  ENTJ: { nickname: '지휘관', strength: '목표를 밀어붙이는 추진력', watch: '속도만 챙기다 사람 놓치기' },
  ENTP: { nickname: '발명가', strength: '틀을 깨는 아이디어', watch: '벌여놓고 마무리 미루기' },
  INFJ: { nickname: '통찰가', strength: '사람의 속마음을 읽는 감각', watch: '혼자 짊어지기' },
  INFP: { nickname: '중재자', strength: '진심을 담는 따뜻함', watch: '상처를 오래 품기' },
  ENFJ: { nickname: '선도자', strength: '사람을 모으는 영향력', watch: '남 챙기다 나를 놓치기' },
  ENFP: { nickname: '활동가', strength: '분위기를 바꾸는 에너지', watch: '관심이 금방 흩어지기' },
  ISTJ: { nickname: '관리자', strength: '약속을 지키는 신뢰감', watch: '변화에 지나치게 경계하기' },
  ISFJ: { nickname: '수호자', strength: '조용히 챙기는 배려', watch: '거절 못 하고 떠안기' },
  ESTJ: { nickname: '경영자', strength: '일을 굴러가게 만드는 실행력', watch: '내 방식만 정답으로 보기' },
  ESFJ: { nickname: '친선대사', strength: '관계를 이어주는 친화력', watch: '남의 평가에 흔들리기' },
  ISTP: { nickname: '장인', strength: '문제를 바로 푸는 손재주', watch: '감정 표현 생략하기' },
  ISFP: { nickname: '예술가', strength: '지금을 즐기는 감수성', watch: '결정을 끝까지 미루기' },
  ESTP: { nickname: '모험가', strength: '현장에서 빛나는 순발력', watch: '충동적으로 뛰어들기' },
  ESFP: { nickname: '연예인', strength: '주변을 밝히는 에너지', watch: '즉흥 소비' },
};

/** 성향 축별 키워드. 오늘의 흐름과 맞물리는 축이 강조된다 */
export const AXIS_TAGS: Record<string, KeywordTag[]> = {
  E: ['newMeeting', 'expression'],
  I: ['rest', 'focus'],
  N: ['intuition', 'change'],
  S: ['focus', 'money'],
  T: ['challenge', 'focus'],
  F: ['harmony', 'expression'],
  J: ['focus', 'caution'],
  P: ['change', 'opportunity'],
};
