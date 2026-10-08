/** /fortune/blood — 혈액형 성격 콘텐츠(재미 요소). 날짜별로 다른 팁을 고른다. */
import { AnalysisResult, User } from '../../types';
import { BLOOD_INFO } from '../../data/bloodData';
import { seededRandom, pick } from '../../utils/seed';

export function getBloodAnalysis(user: User, date: string): AnalysisResult {
  const info = BLOOD_INFO[user.bloodType];
  const rand = seededRandom(`blood-${user.bloodType}-${date}`);
  const tip = pick(rand, info.tips);
  return {
    source: 'blood',
    title: '혈액형',
    emoji: '🩸',
    headline: tip,
    details: [
      { label: '나의 혈액형', value: `${user.bloodType}형` },
      { label: '성향 키워드', value: info.trait },
      { label: '오늘의 한마디', value: tip },
    ],
    description: `${user.bloodType}형의 ${info.trait} 기질이 오늘의 흐름과 만나요. ${tip}`,
    tags: info.tags,
    scoreBias: info.bias,
  };
}
