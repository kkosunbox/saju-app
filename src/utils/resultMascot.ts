export type MascotPose = 'crown' | 'hearts' | 'clover' | 'checklist' | 'breeze' | 'question' | 'rain' | 'sleepy';
export type MascotScores = { totalScore: number; love: number; money: number; work: number; relationship: number };
export interface ResultMascotState {
  /** null이면 기본 무지개 젤리 (공개 전 · 점수 없음) */
  pose: MascotPose | null;
  label: string;
}

const NAME = '무지개 젤리';
export const MASCOT_LABELS: Record<MascotPose, string> = {
  crown: `${NAME}, 왕관을 쓰고 최고의 하루를 맞아요`,
  hearts: `${NAME}, 하트를 띄우며 인연을 응원해요`,
  clover: `${NAME}, 네잎클로버를 안고 행운을 응원해요`,
  checklist: `${NAME}, 체크리스트를 들고 도전을 응원해요`,
  breeze: `${NAME}, 산들바람처럼 편안한 하루예요`,
  question: `${NAME}, 갸웃하며 한 번 더 살펴보자고 해요`,
  rain: `${NAME}, 비구름 아래에서 쉬어가자고 해요`,
  sleepy: `${NAME}, 꾸벅꾸벅 졸고 있어요`,
};
/** 점수 분포(평균 74 · 66 미만 약 18%)에 맞춘 경계 */
const CROWN_FROM = 85;
const CAREFUL_BELOW = 66;
const RAIN_BELOW = 60;
const STANDOUT_FROM = 80;
const THEMES = [
  { key: 'love', pose: 'hearts' },
  { key: 'money', pose: 'clover' },
  { key: 'work', pose: 'checklist' },
  { key: 'relationship', pose: 'hearts' },
] as const;

const state = (pose: MascotPose | null): ResultMascotState => ({ pose, label: pose ? MASCOT_LABELS[pose] : NAME });

/** 공개된 점수로 오늘의 포즈를 정한다. 동점은 위 순서로 고정. (sleepy는 홈에서 가끔 나오는 장난이라 여기선 고르지 않는다) */
export function getResultMascot(scores?: MascotScores): ResultMascotState {
  if (!scores || ![scores.totalScore, ...THEMES.map(t => scores[t.key])].every(n => Number.isFinite(n) && n >= 0 && n <= 100)) return state(null);
  const total = scores.totalScore;
  if (total >= CROWN_FROM) return state('crown');
  if (total < RAIN_BELOW) return state('rain');
  if (total < CAREFUL_BELOW) return state('question');
  const best = THEMES.reduce((a, b) => scores[b.key] > scores[a.key] ? b : a);
  return state(scores[best.key] >= STANDOUT_FROM ? best.pose : 'breeze');
}
