/**
 * 고민 상담 — 주제 목록과 글에서 주제 고르기 (화면용). 서버 값(GET /consults/status)이 오기 전 기본값.
 * 답변 · 위기 판단 · 기록은 서버(/consults)가 한다. 고민 글은 공유 카드에 절대 넣지 않는다.
 */
export const CONSULT_CONFIG = { maxLen: 500, minLen: 10, cost: 100 };

export type ConsultCat = 'love' | 'reunion' | 'work' | 'money' | 'people' | 'family' | 'study' | 'self';
export const CONSULT_CATS: { key: ConsultCat; label: string; hanja: string; kw: string[] }[] = [
  { key: 'love', label: '연애·썸', hanja: '緣', kw: ['썸', '고백', '좋아하', '짝사랑', '연애', '남친', '여친', '애인', '설레', '데이트', '결혼', '소개팅'] },
  { key: 'reunion', label: '재회·이별', hanja: '回', kw: ['헤어', '이별', '재회', '전남친', '전여친', '전 애인', '잊', '차였', '권태', '다시 만'] },
  { key: 'work', label: '직장·이직', hanja: '業', kw: ['회사', '직장', '상사', '이직', '퇴사', '그만두', '승진', '팀장', '야근', '취업', '면접', '사업'] },
  { key: 'money', label: '돈·재테크', hanja: '財', kw: ['돈', '빚', '대출', '월급', '투자', '주식', '코인', '저축', '집값', '전세', '카드값', '부업'] },
  { key: 'people', label: '인간관계', hanja: '人', kw: ['친구', '동료', '손절', '서운', '단톡', '무리', '오해', '뒷담', '눈치', '인간관계'] },
  { key: 'family', label: '가족', hanja: '家', kw: ['엄마', '아빠', '부모', '가족', '형제', '언니', '오빠', '동생', '시댁', '처가', '자식', '아이'] },
  { key: 'study', label: '진로·시험', hanja: '學', kw: ['시험', '공부', '진로', '합격', '수능', '자격증', '전공', '대학', '공시', '꿈'] },
  { key: 'self', label: '나 자신', hanja: '我', kw: ['불안', '우울', '자존감', '외로', '지쳐', '번아웃', '무기력', '나 자신', '성격', '의욕'] },
];
export const catOf = (k: ConsultCat) => CONSULT_CATS.find(c => c.key === k)!;

/** 글에서 주제를 추측 (사용자가 고르지 않았을 때 제안용) */
export function guessCat(text: string): ConsultCat | null {
  let best: ConsultCat | null = null, n = 0;
  CONSULT_CATS.forEach(c => { const hit = c.kw.filter(k => text.includes(k)).length; if (hit > n) { n = hit; best = c.key; } });
  return best;
}
