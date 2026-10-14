/**
 * 유료: 말 못 할 고민 상담 (1회 100P)
 * 고민 글(최대 200자)에서 주제·감정 단서를 읽고, 사주 원국 · 이번 달 기운 · 앞으로 3개월 흐름 · MBTI로 답한다.
 * 같은 사람·같은 글·같은 날이면 같은 답이 나온다.
 * 지금은 규칙 기반. CONSULT_CONFIG.enabled를 켜면 같은 근거(consultFacts)를 LLM 백엔드에 넘겨 문장을 다듬도록 확장할 수 있다.
 * 고민 원문은 이 기기(계정별 저장소)에만 저장하고, 공유 카드에는 절대 넣지 않는다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../types';
import { scopedKey } from '../storage/storageService';
import { STEMS, TenGodGroup } from '../../data/sajuData';
import { MBTI_INFO } from '../../data/mbtiData';
import { relation } from '../fortune/sajuService';
import { WEEK, addDays, fortuneOf, isoOf, monthPillarOf, sajuFull } from '../premium/engine';
import { STEM_PERSONA, YEAR_IDIOM } from '../premium/data';
import { parseISO, weekdayOf } from '../../utils/date';
import { pick, seededRandom } from '../../utils/seed';

export const CONSULT_CONFIG = { enabled: false, maxLen: 200, minLen: 10, cost: 100 };

export type ConsultCat = 'love' | 'reunion' | 'work' | 'money' | 'people' | 'family' | 'study' | 'self';
type FCat = 'love' | 'money' | 'work' | 'relationship';
export const CONSULT_CATS: { key: ConsultCat; label: string; hanja: string; fcat: FCat; grp: TenGodGroup | 'spouse'; kw: string[] }[] = [
  { key: 'love', label: '연애·썸', hanja: '緣', fcat: 'love', grp: 'spouse', kw: ['썸', '고백', '좋아하', '짝사랑', '연애', '남친', '여친', '애인', '설레', '데이트', '결혼', '소개팅'] },
  { key: 'reunion', label: '재회·이별', hanja: '回', fcat: 'love', grp: 'spouse', kw: ['헤어', '이별', '재회', '전남친', '전여친', '전 애인', '잊', '차였', '권태', '다시 만'] },
  { key: 'work', label: '직장·이직', hanja: '業', fcat: 'work', grp: 'officer', kw: ['회사', '직장', '상사', '이직', '퇴사', '그만두', '승진', '팀장', '야근', '취업', '면접', '사업'] },
  { key: 'money', label: '돈·재테크', hanja: '財', fcat: 'money', grp: 'wealth', kw: ['돈', '빚', '대출', '월급', '투자', '주식', '코인', '저축', '집값', '전세', '카드값', '부업'] },
  { key: 'people', label: '인간관계', hanja: '人', fcat: 'relationship', grp: 'peer', kw: ['친구', '동료', '손절', '서운', '단톡', '무리', '오해', '뒷담', '눈치', '인간관계'] },
  { key: 'family', label: '가족', hanja: '家', fcat: 'relationship', grp: 'resource', kw: ['엄마', '아빠', '부모', '가족', '형제', '언니', '오빠', '동생', '시댁', '처가', '자식', '아이'] },
  { key: 'study', label: '진로·시험', hanja: '學', fcat: 'work', grp: 'resource', kw: ['시험', '공부', '진로', '합격', '수능', '자격증', '전공', '대학', '공시', '꿈'] },
  { key: 'self', label: '나 자신', hanja: '我', fcat: 'relationship', grp: 'peer', kw: ['불안', '우울', '자존감', '외로', '지쳐', '번아웃', '무기력', '나 자신', '성격', '의욕'] },
];
export const catOf = (k: ConsultCat) => CONSULT_CATS.find(c => c.key === k)!;

/** 글에서 주제를 추측 (사용자가 고르지 않았을 때 제안용) */
export function guessCat(text: string): ConsultCat | null {
  let best: ConsultCat | null = null, n = 0;
  CONSULT_CATS.forEach(c => { const hit = c.kw.filter(k => text.includes(k)).length; if (hit > n) { n = hit; best = c.key; } });
  return best;
}

/** 위기 신호 — 결제 없이 전문 상담 연결을 먼저 안내한다 */
const CRISIS = ['죽고 싶', '죽고싶', '자살', '자해', '사라지고 싶', '살기 싫', '끝내고 싶', '목숨'];
export const isCrisis = (text: string) => CRISIS.some(k => text.replace(/\s/g, '').includes(k.replace(/\s/g, '')));
export const CRISIS_LINES: [string, string][] = [['자살예방 상담전화', '109'], ['정신건강 위기상담', '1577-0199'], ['청소년 상담', '1388']];

/** 지금(이번 달) 나에게 들어온 기운 → 고민을 대하는 태도 */
type Mode = 'act' | 'steady' | 'wait' | 'together';
const MODE_OF: Record<TenGodGroup, Mode> = { output: 'act', wealth: 'act', officer: 'steady', resource: 'wait', peer: 'together' };
export const MODE_LABEL: Record<Mode, string> = { act: '움직일 때', steady: '원칙대로 정면 돌파', wait: '준비하며 기다릴 때', together: '사람에게 기댈 때' };

const HEAD: Record<ConsultCat, Record<Mode, string>> = {
  love: { act: '마음을 표현할 타이밍이 왔어요. 이번엔 먼저 다가가세요', steady: '가볍게 말고 진지하게. 마음을 분명하게 보여줄수록 풀려요', wait: '조급해하지 마세요. 상대가 다가올 여지를 남겨둘 때예요', together: '친구들의 도움을 받으세요. 자연스러운 자리에서 가까워져요' },
  reunion: { act: '미련이 남았다면 한 번은 연락해 볼 만한 흐름이에요', steady: '다시 만나려면 헤어진 이유부터 정리해야 해요. 그게 먼저예요', wait: '지금 연락하면 서두른 게 돼요. 나를 먼저 채울 때예요', together: '혼자 끙끙대지 말고 털어놓으세요. 마음이 정리되면 답이 보여요' },
  work: { act: '움직여도 되는 흐름이에요. 준비한 걸 꺼내 보세요', steady: '버티는 게 지는 게 아니에요. 지금은 실력을 증명할 때예요', wait: '당장 결정하기보다 3개월만 준비 기간을 가져 보세요', together: '혼자 해결하려 하지 마세요. 내 편을 만들면 일이 풀려요' },
  money: { act: '수입을 늘릴 기회가 보이는 때예요. 다만 계획은 꼼꼼히', steady: '새는 돈부터 막을 때예요. 지키는 쪽이 이기는 흐름이에요', wait: '큰돈이 오가는 결정은 잠시 미루고, 공부하며 기다리세요', together: '돈 거래는 문서로, 상의는 믿을 만한 사람과 하세요' },
  people: { act: '하고 싶은 말은 해도 돼요. 대신 부드럽게', steady: '선을 분명하게 그을 때예요. 다 맞춰줄 필요는 없어요', wait: '지금은 거리를 두고 지켜볼 때예요. 시간이 정리해 줘요', together: '좋은 사람들 쪽으로 무게를 옮기세요. 관계도 고를 수 있어요' },
  family: { act: '먼저 한마디 건네 보세요. 생각보다 쉽게 풀려요', steady: '감정보다 사실로 이야기하세요. 그래야 오해가 줄어요', wait: '지금은 내 마음부터 돌볼 때예요. 서두르면 상처만 남아요', together: '다른 가족이나 제3자의 도움을 받으면 실마리가 생겨요' },
  study: { act: '도전해도 좋은 흐름이에요. 미루던 시작을 해 보세요', steady: '계획표대로 가면 돼요. 지금의 꾸준함이 결과가 돼요', wait: '배움이 쌓이는 시기예요. 결과보다 실력을 믿으세요', together: '스터디·멘토를 찾으세요. 함께할 때 속도가 붙어요' },
  self: { act: '작은 것 하나를 바꾸면 흐름이 바뀌어요. 오늘 시작하세요', steady: '나에게 너무 엄격했어요. 기준을 조금만 낮춰 보세요', wait: '쉬어도 괜찮은 시기예요. 충전이 먼저예요', together: '혼자 버티지 말고 기대세요. 말하는 것만으로 가벼워져요' },
};

const DO: Record<ConsultCat, string[]> = {
  love: ['안부 대신 구체적인 약속을 제안해 보세요', '상대의 관심사를 하나 골라 질문으로 대화를 여세요', '답장 속도로 마음을 재지 마세요'],
  reunion: ['헤어진 이유를 한 줄로 적어 보세요. 그게 바뀌었는지가 핵심이에요', '연락한다면 사과나 추억이 아닌 가벼운 안부로', '정해 둔 기간까지 답이 없으면 나를 위해 정리하세요'],
  work: ['지금 일에서 얻을 것(경력·사람·돈)을 적어 보세요', '이직이라면 지원서는 먼저 내 보되, 결정은 합격 후에', '힘든 상대와는 업무 기록을 남겨 두세요'],
  money: ['한 달 고정비를 적어 새는 돈 하나를 끊어 보세요', '수입의 일정 비율을 자동이체로 먼저 떼어 두세요', '큰 결정 전엔 전문가 상담을 한 번 받으세요'],
  people: ['서운한 점은 "나는 ~해서 속상했어"로 말해 보세요', '에너지를 뺏는 관계와 채워주는 관계를 나눠 보세요', '답을 바로 주지 말고 하루 생각해 보세요'],
  family: ['짧은 메시지로 먼저 안부를 건네 보세요', '오래된 이야기보다 지금 필요한 것 하나만 말하세요', '나를 지키는 선을 정해 두세요'],
  study: ['하루 할 양을 작게 정해 매일 지키세요', '모의시험·포트폴리오로 내 위치를 확인하세요', '비교는 어제의 나와만 하세요'],
  self: ['잠·식사·햇빛, 기본 세 가지부터 챙기세요', '오늘 잘한 일을 하나씩 적어 보세요', '믿을 만한 사람에게 지금 마음을 말해 보세요'],
};
const AVOID: Record<ConsultCat, string> = {
  love: '밤늦게 감정적으로 긴 메시지를 보내는 건 피하세요',
  reunion: 'SNS로 상대 근황을 계속 확인하는 건 마음만 다쳐요',
  work: '홧김에 그만두겠다고 말하는 건 피하세요',
  money: '"확실하다"는 말에 큰돈을 넣는 건 피하세요',
  people: '제3자에게 그 사람 이야기를 퍼뜨리지 마세요',
  family: '지난 일을 한꺼번에 꺼내 따지지 마세요',
  study: '남의 진도와 비교하며 계획을 자주 바꾸지 마세요',
  self: '혼자 결론 내리고 스스로를 탓하지 마세요',
};
const CLOSE: Record<Mode, string[]> = {
  act: ['문은 두드리는 사람에게 열려요.', '망설인 시간만큼 기회는 지나가요. 한 걸음이면 충분해요.'],
  steady: ['흔들리지 않는 사람에게 결국 길이 나요.', '천천히 가도 멈추지만 않으면 돼요.'],
  wait: ['꽃은 피는 때가 따로 있어요. 지금은 뿌리를 내릴 때예요.', '기다림도 실력이에요. 준비된 사람에게 때가 와요.'],
  together: ['혼자 짊어지지 않아도 돼요. 나눌수록 가벼워져요.', '좋은 사람 곁에 있으면 답은 자연스럽게 와요.'],
};

/** 글 속 감정 단서 → 첫 문장 공감 */
const FEEL: [string[], string][] = [
  [['불안', '걱정', '무서'], '불안한 마음이 오래 이어졌을 것 같아요.'],
  [['지쳐', '힘들', '번아웃', '피곤'], '그동안 정말 많이 지쳤겠어요.'],
  [['외로', '혼자'], '혼자라고 느끼는 시간이 길었을 것 같아요.'],
  [['화나', '짜증', '억울'], '억울하고 답답한 마음이 크게 느껴져요.'],
  [['슬프', '눈물', '울'], '마음이 많이 아팠겠어요.'],
  [['모르겠', '고민', '어떻게'], '어떤 선택이 맞는지 몰라 오래 고민했을 것 같아요.'],
];

/** 글 속 핵심 질문 → "결론부터" 문장의 주어 */
const TOPIC: [string[], string][] = [
  [['이직', '퇴사', '그만두', '그만 둘'], '회사를 떠날지 고민이라면'], [['연락'], '연락할지 말지 고민이라면'], [['고백'], '고백할지 고민이라면'],
  [['재회', '다시 만'], '다시 만날지 고민이라면'], [['헤어', '이별'], '관계를 정리할지 고민이라면'], [['결혼'], '결혼을 고민 중이라면'],
  [['투자', '주식', '코인'], '투자를 고민 중이라면'], [['시험', '합격'], '시험을 앞두고 있다면'], [['손절', '절교'], '관계를 끊을지 고민이라면'],
  [['이사'], '이사를 고민 중이라면'], [['창업', '사업'], '사업을 고민 중이라면'],
];
const DIRECT: Record<Mode, (t: string, bm: string) => string> = {
  act: (t, bm) => `${t}, 지금은 '해 보는 쪽'에 힘이 실려요. 특히 ${bm}에 움직이면 결과가 좋아요.`,
  steady: (t, bm) => `${t}, 감정으로 정하기보다 기준을 세우고 정면으로 부딪히는 쪽이 맞아요. ${bm}까지 원칙대로 가 보세요.`,
  wait: (t, bm) => `${t}, 지금 당장보다 ${bm} 무렵이 더 좋아요. 그때까지는 준비하며 지켜보세요.`,
  together: (t, bm) => `${t}, 혼자 결정하지 마세요. 믿을 만한 한 사람과 이야기한 뒤 ${bm}에 정하면 후회가 적어요.`,
};

export interface ConsultAnswer {
  cat: ConsultCat; mode: Mode; headline: string; direct: string;
  empathy: string; me: string; star: string;
  now: string; flow: { label: string; v: number }[]; bestMonth: string;
  dos: string[]; avoid: string[]; days: { iso: string; label: string }[]; closing: string; idiom: [string, string, string];
}

export function consultAnswer(u: User, text: string, cat: ConsultCat, at: string): ConsultAnswer {
  const C = catOf(cat); const F = sajuFull(u); const per = STEM_PERSONA[F.ds];
  const r = seededRandom(`${u.id}|${cat}|${at}|${text.length}`);
  const { y, m } = parseISO(at);
  const mp = monthPillarOf(y, m);
  const rel = relation(F.meE, STEMS[mp.stem].element);
  const mode = MODE_OF[rel];
  const grp: TenGodGroup = C.grp === 'spouse' ? F.spouseGrp : C.grp;
  const n = F.grp[grp];

  const feel = FEEL.find(([ks]) => ks.some(k => text.includes(k)))?.[1] ?? '쉽게 꺼내기 어려운 이야기를 해 줘서 고마워요.';
  const empathy = `${feel} ${u.mbti[2] === 'F' ? '마음을 깊이 쓰는 사람일수록 이런 고민이 더 무겁게 느껴져요.' : '머리로는 답을 알아도 마음이 따라주지 않을 때가 있어요.'}`;
  const me = `${u.nickname}님은 ${per.img}처럼 ${per.core}을 지닌 사람이에요. 다만 ${per.watch}. 이번 고민도 그 결에서 더 크게 느껴졌을 수 있어요.`;
  const star = n === 0
    ? `이 고민과 연결된 기운이 원국에 드러나 있지 않아요. 스스로 해결하려 애쓰기보다 운에서 그 기운이 들어올 때 자연스럽게 풀리는 타입이라, 아래 "좋은 달"을 기억해 두세요.`
    : n <= 2 ? `이 고민과 연결된 기운이 원국에 ${n}개, 적당히 자리 잡고 있어요. 이미 스스로 풀어갈 힘이 있다는 뜻이에요.`
    : `이 고민과 연결된 기운이 원국에 ${n}개나 있어요. 그만큼 이 문제를 크게 느끼지만, 해결할 힘도 남들보다 큰 사주예요.`;
  const NOW: Record<Mode, string> = {
    act: `이번 달은 나의 기운이 밖으로 뻗어 나가는 달이에요. 고민만 하던 일을 행동으로 옮기면 결과가 따라오기 쉬워요.`,
    steady: `이번 달은 책임과 원칙의 기운이 들어와요. 요령보다 정면으로, 약속과 기준을 지킬 때 풀리는 흐름이에요.`,
    wait: `이번 달은 채우고 배우는 기운이 강해요. 당장 결론을 내기보다 정보를 모으고 마음을 다지면 다음 달이 편해져요.`,
    together: `이번 달은 사람의 기운이 강해요. 혼자 결정하기보다 믿을 만한 사람과 이야기할수록 답이 선명해져요.`,
  };

  // 앞으로 3개월 — 이 고민 분야의 흐름
  const flow = [0, 1, 2].map(k => {
    const mm = ((m - 1 + k) % 12) + 1, yy = y + Math.floor((m - 1 + k) / 12);
    const v = Math.round([4, 11, 18, 25].reduce((s, d) => s + fortuneOf(u, isoOf(yy, mm, d))[C.fcat], 0) / 4);
    return { label: `${mm}월`, v };
  });
  const bestMonth = flow.reduce((a, b) => (b.v > a.v ? b : a)).label;

  // 결정·행동하기 좋은 날 (앞으로 30일)
  const ds: { iso: string; s: number }[] = [];
  for (let i = 1; i <= 30; i++) { const iso = addDays(at, i); const c = fortuneOf(u, iso); ds.push({ iso, s: c[C.fcat] * 2 + c.totalScore }); }
  const days = ds.sort((a, b) => b.s - a.s).slice(0, 3).sort((a, b) => a.iso.localeCompare(b.iso))
    .map(d => { const p = parseISO(d.iso); return { iso: d.iso, label: `${p.m}/${p.d} (${WEEK[weekdayOf(d.iso)]})` }; });

  return {
    cat, mode, headline: HEAD[cat][mode],
    direct: DIRECT[mode](TOPIC.find(([ks]) => ks.some(k => text.includes(k)))?.[1] ?? '결론부터 말하면', bestMonth),
    empathy, me, star, now: NOW[mode], flow, bestMonth,
    dos: [...DO[cat]],
    avoid: [AVOID[cat], `'${MBTI_INFO[u.mbti].watch}' 습관이 이번 고민을 키우지 않게 조심하세요`],
    days, closing: pick(r, CLOSE[mode]), idiom: YEAR_IDIOM[rel] as [string, string, string],
  };
}

/* ---------- 상담 기록 (계정별, 이 기기에만) ---------- */
export interface ConsultEntry { id: string; cat: ConsultCat; text: string; at: string }
const CK = () => scopedKey('consults');
export async function loadConsults(): Promise<ConsultEntry[]> {
  try { return JSON.parse((await AsyncStorage.getItem(CK())) ?? '[]'); } catch { return []; }
}
export async function saveConsult(e: ConsultEntry) {
  const list = await loadConsults();
  await AsyncStorage.setItem(CK(), JSON.stringify([e, ...list.filter(x => x.id !== e.id)].slice(0, 30))).catch(() => {});
}
