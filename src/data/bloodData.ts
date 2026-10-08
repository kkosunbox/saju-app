import { BloodType, KeywordTag } from '../types';

export const BLOOD_INFO: Record<BloodType, {
  trait: string; tags: KeywordTag[]; tips: string[];
  bias: { love: number; money: number; work: number; relationship: number };
}> = {
  A: {
    trait: '꼼꼼하고 배려 깊은 계획형',
    tags: ['caution', 'harmony'],
    tips: ['완벽보다 완료를 목표로 해보세요.', '작은 부탁 하나쯤은 해도 괜찮아요.', '미리 세운 계획이 오늘 빛을 봐요.'],
    bias: { love: 1, money: 3, work: 4, relationship: 2 },
  },
  B: {
    trait: '자유롭고 솔직한 몰입형',
    tags: ['challenge', 'change'],
    tips: ['꽂히는 일에 과감히 시간을 써보세요.', '솔직함에 부드러운 말투 한 스푼.', '즉흥 계획이 의외의 재미를 줘요.'],
    bias: { love: 3, money: -1, work: 2, relationship: 1 },
  },
  O: {
    trait: '대범하고 사람을 끄는 리더형',
    tags: ['opportunity', 'newMeeting'],
    tips: ['먼저 판을 깔면 사람들이 따라와요.', '큰 목표 하나를 입 밖으로 말해보세요.', '챙겨주던 사람에게 오늘은 챙김 받기.'],
    bias: { love: 2, money: 2, work: 3, relationship: 4 },
  },
  AB: {
    trait: '합리적이고 독특한 균형형',
    tags: ['intuition', 'learning'],
    tips: ['남다른 관점이 오늘의 무기예요.', '혼자만의 시간이 아이디어를 키워요.', '거리 두던 사람에게 한 발 다가가 보기.'],
    bias: { love: 1, money: 2, work: 2, relationship: -1 },
  },
};
