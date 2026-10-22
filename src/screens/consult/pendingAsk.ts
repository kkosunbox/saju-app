/**
 * 첫 상담 요청을 화면 밖에 둔다: 상담 탭이 요청을 시작하고 바로 대화 화면으로 넘어가면,
 * 대화 화면이 같은 요청을 이어받아 "답을 쓰는 중"을 보여 준다 (화면이 다시 그려져도 두 번 보내지 않는다).
 * 웹에서 새로고침하면 사라진다 — 대화 화면은 그때 상담 탭으로 돌려보낸다.
 * 답이 오면 캐시(상담 목록 · 무료 상담권 · 알)는 여기서 갱신한다: 기다리다 뒤로 가서 대화 화면이 없어져도 상담 탭이 새 상담을 보여 준다.
 */
import { queryClient } from '../../api/query';
import { refreshPoints } from '../../context/PremiumContext';
import { ConsultCat } from '../../services/content/consult';
import { ConsultView, consultApi, consultKeys } from '../../services/server/consultApi';

export interface PendingAsk {
  readonly worry: string;
  readonly topic?: ConsultCat;
  readonly result: Promise<ConsultView>;
}

const pending = new Map<string, PendingAsk>();
let seq = 0;

/** 요청을 시작하고 대화 화면에 넘길 키를 돌려준다 */
export function startAsk(worry: string, topic?: ConsultCat): string {
  const key = `${Date.now()}-${++seq}`;
  const result = consultApi.ask(worry, topic);
  result.then(
    v => {
      if (v.id != null) queryClient.setQueryData(consultKeys.one(v.id), v);
      queryClient.invalidateQueries({ queryKey: consultKeys.list });
      if (v.charged) refreshPoints();
    },
    () => {}, // 오류는 대화 화면이 받아서 보여 준다
  );
  pending.set(key, { worry, topic, result });
  return key;
}

export const getAsk = (key: string | undefined) => (key ? pending.get(key) : undefined);

export const dropAsk = (key: string) => pending.delete(key);
