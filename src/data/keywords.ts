import { KeywordTag } from '../types';

/** 모든 분석 모듈이 공유하는 키워드 어휘. 공통 키워드 추출의 기준이 된다. */
export const KEYWORDS: Record<KeywordTag, { label: string; emoji: string }> = {
  newMeeting: { label: '새로운 만남', emoji: '✨' },
  change: { label: '변화', emoji: '🚶' },
  opportunity: { label: '기회', emoji: '🍀' },
  money: { label: '금전 흐름', emoji: '💰' },
  rest: { label: '재충전', emoji: '🌙' },
  focus: { label: '집중', emoji: '🎯' },
  expression: { label: '표현', emoji: '💬' },
  caution: { label: '신중함', emoji: '🧭' },
  harmony: { label: '조화', emoji: '🫶' },
  challenge: { label: '도전', emoji: '🔥' },
  intuition: { label: '직감', emoji: '🔮' },
  learning: { label: '배움', emoji: '📖' },
};

export const kw = (t: KeywordTag) => `${KEYWORDS[t].emoji} ${KEYWORDS[t].label}`;

/** 키워드별 행동 제안 풀 */
export const ACTIONS: Record<KeywordTag, { good: string[]; avoid: string[] }> = {
  newMeeting: { good: ['새로운 사람에게 먼저 인사 건네기', '오랜만인 친구에게 연락하기'], avoid: ['약속 직전에 취소하기'] },
  change: { good: ['평소와 다른 길로 걸어보기', '책상 위 하나만 정리하기'], avoid: ['익숙함만 고집하기'] },
  opportunity: { good: ['미뤄둔 일 하나 시작하기', '들어온 제안을 끝까지 들어보기'], avoid: ['기회를 바로 거절하기'] },
  money: { good: ['이번 주 지출 한 번 점검하기', '작은 저축 하나 설정하기'], avoid: ['충동적인 소비'] },
  rest: { good: ['30분 일찍 잠자리에 들기', '휴대폰 없이 산책하기'], avoid: ['무리한 야근·과음'] },
  focus: { good: ['가장 중요한 일 하나만 먼저 끝내기', '알림 끄고 50분 몰입하기'], avoid: ['여러 일을 동시에 벌이기'] },
  expression: { good: ['고마운 사람에게 마음 표현하기', '생각을 글로 적어보기'], avoid: ['말 대신 속으로 삭이기'] },
  caution: { good: ['중요한 결정은 하루 묵혀보기', '서류·일정 한 번 더 확인하기'], avoid: ['감정적인 결정'] },
  harmony: { good: ['상대 이야기를 끝까지 들어주기', '함께 식사하며 대화하기'], avoid: ['사소한 일로 논쟁하기'] },
  challenge: { good: ['조금 어려운 목표 하나 세우기', '처음 해보는 것 시도하기'], avoid: ['해보기도 전에 포기하기'] },
  intuition: { good: ['첫 느낌을 메모해두기', '마음이 끌리는 선택 존중하기'], avoid: ['지나친 고민'] },
  learning: { good: ['관심 분야 글 하나 읽기', '배운 것 한 줄로 정리하기'], avoid: ['모르는 걸 아는 척하기'] },
};
