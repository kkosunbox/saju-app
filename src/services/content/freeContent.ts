/**
 * 무료 바이럴 콘텐츠 — 찰떡 MBTI · 사주 캐릭터 · 오늘의 부적
 * 공유하기 좋게 결과가 짧고 또렷하도록 만든다. 같은 입력이면 항상 같은 결과.
 */
import { MBTI, User } from '../../types';
import { MBTI_INFO, MBTI_LIST } from '../../data/mbtiData';
import { BRANCHES, ELEMENT_INFO, Element, STEMS } from '../../data/sajuData';
import { buildChart } from '../fortune/sajuService';
import { BRANCH_GOOD, fortuneOf, kwTag } from '../premium/engine';
import { BRANCH_SEAT, STEM_PERSONA } from '../premium/data';
import { KEYWORDS } from '../../data/keywords';
import { clamp, pick, seededRandom } from '../../utils/seed';

/* ---------- 찰떡 MBTI ---------- */
/** 널리 알려진 MBTI 궁합 차트의 '최고의 짝' */
const GOLDEN: Record<MBTI, MBTI[]> = {
  INFP: ['ENFJ', 'ENTJ'], ENFP: ['INFJ', 'INTJ'], INFJ: ['ENFP', 'ENTP'], ENFJ: ['INFP', 'ISFP'],
  INTJ: ['ENFP', 'ENTP'], ENTJ: ['INFP', 'INTP'], INTP: ['ENTJ', 'ESTJ'], ENTP: ['INFJ', 'INTJ'],
  ISFP: ['ENFJ', 'ESFJ', 'ESTJ'], ESFP: ['ISFJ', 'ISTJ'], ISTP: ['ESFJ', 'ESTJ'], ESTP: ['ISFJ', 'ISTJ'],
  ISFJ: ['ESFP', 'ESTP'], ESFJ: ['ISFP', 'ISTP'], ISTJ: ['ESFP', 'ESTP'], ESTJ: ['ISFP', 'ISTP', 'INTP'],
};

export interface MbtiMatch { type: MBTI; score: number; nickname: string; reason: string; together: string }

/** 서로 다른(보완하는) 축을 먼저, 그다음 닮은 축으로 이유를 만든다 */
function pairReason(a: string, b: string) {
  const diff: string[] = [], same: string[] = [];
  if (a[0] !== b[0]) diff.push(a[0] === 'E' ? '내가 분위기를 열고 상대가 깊이를 더해요' : '상대가 나를 밖으로 이끌고 나는 쉼표가 돼줘요');
  else same.push(a[0] === 'E' ? '둘 다 활발해서 함께 있으면 에너지가 넘쳐요' : '둘 다 조용한 시간을 존중해 편안해요');
  if (a[2] !== b[2]) diff.push(a[2] === 'T' ? '내 논리에 상대의 따뜻함이 더해져요' : '내 공감에 상대의 냉철함이 균형을 잡아요');
  else same.push(a[2] === 'T' ? '판단 기준이 같아 결정이 빨라요' : '감정의 결이 닮아 마음을 쉽게 알아채요');
  if (a[3] !== b[3]) diff.push(a[3] === 'J' ? '내가 계획하면 상대가 즐거움을 더해요' : '상대의 계획 덕에 나의 즉흥이 빛나요');
  else same.push(a[3] === 'J' ? '생활 리듬이 비슷해 일상이 편해요' : '둘 다 유연해서 함께라면 어디든 즐거워요');
  if (a[1] === b[1]) same.unshift(a[1] === 'N' ? '상상과 아이디어 이야기가 끝없이 이어져요' : '현실적인 대화가 척척 통해요');
  else diff.push('세상을 보는 방식이 달라 서로에게 새로운 시각을 줘요');
  return [...diff, ...same];
}

const TOGETHER = ['함께 여행 계획을 세우면 최고의 파트너', '새벽까지 이어지는 대화 메이트', '서로의 고민을 들어주는 든든한 편', '같이 새로운 걸 시도하면 시너지 폭발', '말없이 있어도 편한 사이'];

export function mbtiMatches(mine: MBTI) {
  const scored = MBTI_LIST.map(t => {
    const a = mine, b = t;
    // 차트의 첫 번째 짝일수록 가산점 → 같은 점수로 겹치지 않게
    const gi = GOLDEN[a].indexOf(b), gj = GOLDEN[b].indexOf(a);
    const golden = gi >= 0 || gj >= 0 ? 24 + Math.max(gi === 0 ? 4 : 0, gj === 0 ? 2 : 0) : 0;
    const score = clamp(52 + golden + (a[1] === b[1] ? 8 : -7) + (a[0] !== b[0] ? 5 : 1) + (a[2] !== b[2] ? 3 : 1) + (a[3] !== b[3] ? 3 : 0) + (a === b ? 2 : 0), 40, 99);
    const reasons = pairReason(a, b);
    const r = seededRandom(`${a}-${b}`);
    return { type: t, score, nickname: MBTI_INFO[t].nickname, reason: reasons.slice(0, 2).join(' · '), together: pick(r, TOGETHER) } as MbtiMatch;
  }).sort((x, y) => y.score - x.score);
  return { best: scored.slice(0, 3), worst: scored[scored.length - 1], all: scored };
}

/* ---------- 나의 사주 캐릭터 (일주 60갑자) ---------- */
const STEM_COLOR = ['푸른', '푸른', '붉은', '붉은', '노란', '노란', '하얀', '하얀', '검은', '검은'];
const STEM_SCENE = ['하늘로 뻗는 숲의', '바람에 흔들리는 들꽃의', '한낮의 태양 아래', '밤을 밝히는 촛불 곁의', '높은 산 위의', '넓은 들판의', '단단한 바위 위의', '반짝이는 보석함 속', '깊은 바다를 건너는', '새벽 이슬 맺힌'];
const ANIMAL_EMOJI_FREE = BRANCHES.map(b => b.animal);

export interface SajuCharacter {
  name: string; title: string; hanja: string; element: Element; colorHex: string;
  core: string; traits: string[]; inner: string; bestFriend: string; keyword: string;
}
export function sajuCharacter(u: Pick<User, 'birthDate' | 'birthTime'>): SajuCharacter {
  const ch = buildChart(u.birthDate, u.birthTime);
  const st = ch.day.stem, br = ch.day.branch;
  const per = STEM_PERSONA[st];
  const el = STEMS[st].element;
  const friendBr = BRANCH_GOOD(br)[2] ?? BRANCH_GOOD(br)[0];
  return {
    name: `${STEM_COLOR[st]} ${ANIMAL_EMOJI_FREE[br]}`,
    title: `${STEM_SCENE[st]} ${ANIMAL_EMOJI_FREE[br]}`,
    hanja: `${STEMS[st].hanja}${BRANCHES[br].hanja}`,
    element: el,
    colorHex: ELEMENT_INFO[el].hex,
    core: per.core,
    traits: per.str,
    inner: BRANCH_SEAT[br][0],
    bestFriend: `${STEM_COLOR[(st + 5) % 10]} ${ANIMAL_EMOJI_FREE[friendBr]}`,
    keyword: per.work.split(' · ')[0],
  };
}

/* ---------- 오늘의 부적 ---------- */
const MANTRA: Record<string, string> = {
  newMeeting: '오늘 건넨 첫인사가 좋은 인연이 된다', change: '작게 바꾼 하나가 큰 흐름을 연다', opportunity: '문 앞에 온 기회를 두 손으로 맞이한다',
  money: '새는 돈은 막고 들어올 길은 연다', rest: '쉬어 가는 만큼 멀리 간다', focus: '하나에 마음을 모으면 길이 보인다',
  expression: '마음을 말로 꺼내면 일이 풀린다', caution: '한 번 더 살피는 마음이 나를 지킨다', harmony: '함께하는 손이 힘을 두 배로 만든다',
  challenge: '조금 어려운 길이 나를 키운다', intuition: '첫 느낌을 믿고 한 걸음 내딛는다', learning: '배운 만큼 하루가 넓어진다',
};
export function todayTalisman(u: User, today: string) {
  const f = fortuneOf(u, today);
  const tag = kwTag(f.keywords[0]);
  return {
    hanja: KEYWORDS[tag].emoji,
    keyword: KEYWORDS[tag].label,
    mantra: MANTRA[tag],
    color: f.luckyColor, colorHex: f.luckyColorHex, number: f.luckyNumber, time: f.luckyTime,
    score: f.totalScore,
  };
}

/* ---------- 전생 테스트 ---------- */
/** 년지(띠)로 시대·장소, 일간 오행 × MBTI 기질로 신분, 일지로 장면을 정한다 */
const ERA = ['고려의 개경', '조선의 한양', '신라의 서라벌', '백제의 사비성', '송나라의 항저우', '르네상스의 피렌체', '고대 이집트의 테베', '에도 시대의 교토', '빅토리아 시대의 런던', '고대 그리스의 아테네', '실크로드의 사마르칸트', '발해의 상경성'];
const ROLE: Record<Element, [string, string]> = {
  wood: ['의원', '서당 훈장'], fire: ['궁중 화원', '떠돌이 광대'], earth: ['큰 객주의 상인', '도자기 장인'],
  metal: ['호위 무사', '대장장이'], water: ['밤하늘을 읽던 점성가', '떠돌이 시인'],
};
const SCENE = [
  '밤마다 몰래 책을 읽다 새벽을 맞곤 했어요', '사람들이 고민이 생기면 가장 먼저 찾아오는 사람이었어요', '큰 장이 서는 날이면 누구보다 바빴어요',
  '아무도 모르는 비밀 하나를 평생 지켰어요', '먼 길을 떠나 낯선 땅에서 이름을 알렸어요', '한 사람을 오래 기다린 이야기가 전해져요',
  '작은 마을의 분쟁을 지혜롭게 풀어 존경받았어요', '누구보다 아름다운 것을 알아보는 눈이 있었어요', '위기 때마다 침착하게 사람들을 이끌었어요',
  '말 한마디로 사람들을 웃게 만들었어요', '손재주로 만든 물건이 궁궐까지 올라갔어요', '계절이 바뀔 때마다 새로운 곳으로 떠났어요',
];
export interface PastLife { title: string; era: string; role: string; scene: string; carried: string; karma: string; bond: string; hanja: string }
export function pastLife(u: Pick<User, 'birthDate' | 'birthTime' | 'mbti'>): PastLife {
  const ch = buildChart(u.birthDate, u.birthTime);
  const st = ch.day.stem, el = STEMS[st].element;
  const role = ROLE[el][u.mbti[1] === 'N' ? 1 : 0];
  const era = ERA[ch.year.branch];
  const per = STEM_PERSONA[st];
  const bondBr = BRANCH_GOOD(ch.day.branch)[0];
  return {
    title: `${era.split('의 ')[0]}의 ${role}`,
    era, role,
    scene: SCENE[(ch.day.branch + st) % 12],
    carried: per.str[0],
    karma: per.watch,
    bond: `${BRANCHES[bondBr].animal}띠`,
    hanja: '前',
  };
}
