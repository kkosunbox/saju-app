/**
 * /fortune/thai
 * 태국 점성술(MVP): 태어난 요일의 수호 행성과 오늘 요일 행성의 관계로 해석한다.
 * 우호 관계표는 앱 자체 규칙이며, 전문가 검수 데이터로 교체 예정.
 */
import { AnalysisResult, KeywordTag, User } from '../../types';
import { THAI_DAYS, THAI_FRIENDS, ThaiDay, WEEKDAY_TO_THAI } from '../../data/thaiData';
import { weekdayOf } from '../../utils/date';

export function birthThaiDay(birthDate: string, birthTime: string | null): ThaiDay {
  const base = WEEKDAY_TO_THAI[weekdayOf(birthDate)];
  if (base === 'wedDay' && birthTime && Number(birthTime.split(':')[0]) >= 18) return 'wedNight';
  return base;
}

export function getThaiAnalysis(user: User, date: string): AnalysisResult {
  const mine = birthThaiDay(user.birthDate, user.birthTime);
  const todayKey = WEEKDAY_TO_THAI[weekdayOf(date)];
  const me = THAI_DAYS[mine];
  const today = THAI_DAYS[todayKey];

  let headline: string, description: string, tags: KeywordTag[], bias: AnalysisResult['scoreBias'];
  const ownDay = todayKey === mine || (mine === 'wedNight' && todayKey === 'wedDay');

  if (ownDay) {
    headline = `내 행성 ${me.planetKo}이 가장 밝은 날`;
    description = `오늘은 당신이 태어난 요일이에요. ${me.planetKo}의 기운이 그대로 실려, 평소 모습 그대로 있을 때 가장 매력적으로 보여요.`;
    tags = ['opportunity', 'expression'];
    bias = { love: 5, money: 3, work: 4, relationship: 4 };
  } else if (THAI_FRIENDS[mine].includes(todayKey)) {
    headline = `${today.planetKo}이 ${me.planetKo}을 돕는 날`;
    description = `오늘의 행성 ${today.planetKo}은 당신의 ${me.planetKo}과 사이가 좋아요. 주변에서 뜻밖의 도움이나 좋은 소식이 들어오기 쉬워요.`;
    tags = ['newMeeting', 'harmony'];
    bias = { love: 4, money: 2, work: 2, relationship: 6 };
  } else if (today.color === me.cautionColor) {
    headline = '행동은 천천히, 확인은 두 번';
    description = `오늘의 색 ${today.color}은 당신에게 주의 색이에요. 서두르기보다 한 박자 늦게 움직이면 흐름을 지킬 수 있어요.`;
    tags = ['caution', 'rest'];
    bias = { love: -2, money: -3, work: 1, relationship: -1 };
  } else {
    headline = `${today.planetKo}의 기운이 새 흐름을 여는 날`;
    description = `${today.planetKo}의 기운이 ${me.planetKo}에 새로운 자극을 줘요. 익숙한 틀에서 조금 벗어나 보면 재미있는 전환점이 생겨요.`;
    tags = ['change', 'intuition'];
    bias = { love: 2, money: 1, work: 2, relationship: 1 };
  }

  return {
    source: 'thai',
    title: '태국 점성술',
    emoji: '星',
    headline,
    details: [
      { label: '태어난 요일', value: `${me.label} · 수호 행성 ${me.planetKo}(${me.planet})` },
      { label: '타고난 성향', value: me.trait },
      { label: '나의 행운색', value: me.color },
      { label: '오늘의 행성', value: `${today.planetKo} · 오늘의 색 ${today.color}` },
      { label: '피하면 좋은 색', value: me.cautionColor },
    ],
    description,
    tags,
    scoreBias: bias,
  };
}
