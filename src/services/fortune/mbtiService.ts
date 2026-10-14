/**
 * /fortune/mbti
 * MBTI는 예측 체계가 아니라 성향 분석이므로, "오늘의 흐름과 내 성향이 만나는 지점"으로 해석한다.
 * 오늘의 흐름: 날짜마다 강조되는 성향 축 하나 + 그 방향(날짜 기반 규칙).
 */
import { AnalysisResult, KeywordTag, User } from '../../types';
import { AXIS_TAGS, MBTI_INFO } from '../../data/mbtiData';
import { dayNumber } from '../../utils/date';

export const AXES: [string, string, string][] = [
  ['E', 'I', '에너지 방향'],
  ['N', 'S', '정보 인식'],
  ['T', 'F', '판단 기준'],
  ['J', 'P', '생활 방식'],
];

export function getMbtiAnalysis(user: User, date: string): AnalysisResult {
  const n = dayNumber(date);
  const axisIdx = n % 4;
  const [a, b, axisName] = AXES[axisIdx];
  const todayFlow = Math.floor(n / 4) % 2 === 0 ? a : b;
  const mine = user.mbti[axisIdx];
  const aligned = mine === todayFlow;
  const info = MBTI_INFO[user.mbti];

  const tags: KeywordTag[] = aligned
    ? [...AXIS_TAGS[mine]]
    : [AXIS_TAGS[todayFlow][0], 'learning'];

  const headline = aligned
    ? `${info.nickname}의 강점이 그대로 통하는 날`
    : `익숙하지 않은 ${todayFlow} 성향을 빌려 쓰는 날`;

  const description = aligned
    ? `오늘은 '${axisName}'에서 ${todayFlow} 쪽 흐름이 강해요. ${user.mbti}인 당신의 ${info.strength}이 자연스럽게 발휘돼요. 다만 ${info.watch}는 조심하세요.`
    : `오늘은 '${axisName}'에서 ${todayFlow} 쪽 흐름이 강해 평소의 ${mine} 성향과 반대예요. 조금 어색해도 반대편 방식을 한 번 써보면 새로운 결과가 나와요.`;

  const bias = aligned
    ? { love: user.mbti.includes('F') ? 4 : 2, money: user.mbti.includes('J') ? 3 : 1, work: 4, relationship: user.mbti.startsWith('E') ? 5 : 2 }
    : { love: 1, money: 0, work: 1, relationship: 2 };

  return {
    source: 'mbti',
    title: 'MBTI',
    emoji: '性',
    headline,
    details: [
      { label: '나의 유형', value: `${user.mbti} · ${info.nickname}` },
      { label: '타고난 강점', value: info.strength },
      { label: '오늘 강조되는 축', value: `${axisName} → ${todayFlow}` },
      { label: '주의 포인트', value: info.watch },
    ],
    description,
    tags,
    scoreBias: bias,
  };
}
