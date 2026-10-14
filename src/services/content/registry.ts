/**
 * 콘텐츠 로드맵 — 요즘 사람들이 가장 궁금해하고 공유하는 주제들.
 * status를 'soon' → 'live'로 바꾸고 route(화면)를 연결하면 콘텐츠 탭에 바로 열린다.
 * 'soon'인 동안은 콘텐츠 탭 "곧 오픈"에 예고로 보이고, 사용자가 오픈 알림을 신청할 수 있다.
 * viral: 왜 공유가 잘 되는지(기획 메모) — 무료는 "결과 비교"가 되는 주제를 우선한다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scopedKey } from '../storage/storageService';

export type ContentStatus = 'live' | 'soon';
export interface ContentEntry {
  key: string; title: string; hanja: string; hook: string; desc: string;
  tier: 'free' | 'premium'; cost?: number; status: ContentStatus; route?: string; viral: string;
}

export const UPCOMING: ContentEntry[] = [
  { key: 'reunion', title: '재회 가능성 리포트', hanja: '回', tier: 'premium', cost: 200, status: 'soon',
    hook: '그 사람, 다시 연락 올까?', desc: '두 사람의 사주로 본 재회 확률 · 연락이 올 시기 · 다시 만나도 될지 · 마음 정리법',
    viral: '이별 후 가장 많이 검색하는 질문. 결과 공유보다 "친구에게 추천" 동선이 강함' },
  { key: 'loveTiming', title: '올해 연애 시작할 수 있을까', hanja: '春', tier: 'free', status: 'soon',
    hook: '나의 연애 시작 확률은?', desc: '올해 연애운 지수 · 인연이 오는 달 · 지금 연애가 어려운 이유 한 줄',
    viral: '확률(%) 하나로 끝나서 친구끼리 숫자 비교하기 좋음' },
  { key: 'jobTiming', title: '퇴사·이직 타이밍', hanja: '轉', tier: 'premium', cost: 150, status: 'soon',
    hook: '지금 그만둬도 괜찮을까?', desc: '버틸 때 vs 떠날 때 · 이직 성공 시기 · 맞는 회사 유형 · 연봉 협상하기 좋은 날',
    viral: '직장인 단톡방 공유가 많은 주제' },
  { key: 'friendRank', title: '친구 궁합 랭킹', hanja: '友', tier: 'free', status: 'soon',
    hook: '내 친구 중 찐친은 누구?', desc: '초대 링크로 들어온 친구들과의 궁합을 순위로 · 1위 친구에게 자랑하기',
    viral: '랭킹에 들려면 친구가 링크를 열어야 해서 초대가 계속 생김 (가장 강한 유입 장치)' },
  { key: 'marryAge', title: '나의 결혼 나이', hanja: '婚', tier: 'free', status: 'soon',
    hook: '나는 몇 살에 결혼할까?', desc: '대운으로 본 결혼 적령기 · 결혼 상대를 만나는 장소 한 줄',
    viral: '숫자 하나라 스토리 카드로 올리기 좋음 · 미래 배우자 리포트로 이어짐' },
  { key: 'tarot', title: '오늘의 타로 한 장', hanja: '牌', tier: 'free', status: 'soon',
    hook: '오늘 나에게 온 카드는?', desc: '매일 한 장 · 사주 기운과 겹쳐 본 오늘의 메시지',
    viral: '매일 바뀌어서 재방문 · 출석 체크와 묶기 좋음' },
  { key: 'dream', title: '꿈해몽', hanja: '夢', tier: 'premium', cost: 50, status: 'soon',
    hook: '어젯밤 그 꿈, 무슨 뜻일까?', desc: '꿈 내용을 적으면 상징 풀이 · 길몽/흉몽 · 오늘 조심할 것 · 로또 번호(재미)',
    viral: '아침에 바로 찾는 콘텐츠. 상담과 같은 입력 구조라 재사용 가능' },
  { key: 'boss', title: '직장 상사·동료 궁합', hanja: '職', tier: 'premium', cost: 100, status: 'soon',
    hook: '팀장님이랑 나, 왜 안 맞을까?', desc: '일하는 스타일 차이 · 부딪히는 지점 · 잘 지내는 말투 · 보고하기 좋은 날',
    viral: '상대 생일만 알면 바로 가능 · 동료끼리 공유' },
  { key: 'exam', title: '시험·합격운', hanja: '及', tier: 'premium', cost: 100, status: 'soon',
    hook: '이번 시험, 붙을 수 있을까?', desc: '합격운 지수 · 집중이 잘 되는 시간 · 시험 당일 컨디션 · 막판 공부 전략',
    viral: '수능·공시·자격증 시즌마다 수요가 몰림' },
  { key: 'baby', title: '우리 아이 사주', hanja: '兒', tier: 'premium', cost: 300, status: 'soon',
    hook: '우리 아이는 어떤 사람으로 자랄까?', desc: '타고난 기질 · 재능 · 맞는 교육 방식 · 부모와의 궁합',
    viral: '부모 커뮤니티 공유 · 객단가 높음' },
  { key: 'pet', title: '반려동물 궁합', hanja: '犬', tier: 'free', status: 'soon',
    hook: '우리 집 댕냥이와 나의 궁합은?', desc: '반려동물 생일로 보는 성격 · 나와의 궁합 점수 · 함께하면 좋은 놀이',
    viral: '반려동물 사진과 함께 올리기 좋은 귀여운 결과 카드' },
  { key: 'name', title: '이름 풀이', hanja: '名', tier: 'premium', cost: 100, status: 'soon',
    hook: '내 이름에 담긴 운은?', desc: '이름 획수와 오행 · 사주와 어울리는지 · 이름이 주는 기운',
    viral: '개명·작명 수요로 확장 가능' },
];

/* ---------- 오픈 알림 신청 (계정별) ---------- */
const NK = () => scopedKey('notify');
export async function loadNotify(): Promise<string[]> {
  try { return JSON.parse((await AsyncStorage.getItem(NK())) ?? '[]'); } catch { return []; }
}
export async function toggleNotify(key: string): Promise<string[]> {
  const cur = await loadNotify();
  const next = cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key];
  await AsyncStorage.setItem(NK(), JSON.stringify(next)).catch(() => {});
  return next;
}
