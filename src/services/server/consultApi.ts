/**
 * 고민 상담 (서버 AI). 하루 5번까지 무료 미리보기(결론까지만), 100알로 열면 전체 답변과
 * 24시간 동안 이어 묻기 10번. 포인트는 답변이 만들어진 뒤에만 차감. 회원 전용.
 */
import { useQuery } from '@tanstack/react-query';
import { api, call } from '../../api/client';
import { ConsultCat } from '../content/consult';

export interface ConsultAnswer {
  headline: string; direct: string; empathy: string; me: string; star: string; now: string;
  dos: string[]; avoid: string[]; closing: string;
  /** 이어 물어볼 질문 3개 (예전 답변엔 없음) */
  followUps?: string[];
}
/** 잠긴 미리보기에서 보이는 부분 */
export type ConsultPreview = Pick<ConsultAnswer, 'headline' | 'direct' | 'empathy' | 'followUps'> & {
  /** 잠긴 나머지를 가리키는 한 줄 (예전 미리보기엔 없음) */
  hook?: string;
};
/** 잠겨 있을 때 보여 줄 사주 일부 — 점수 · 좋은 달 · 좋은 날 자체는 없다 */
export interface ConsultTeaser { modeLabel: string; relatedStarName: string; months: string[]; goodDayCount: number }
export interface ConsultFacts {
  topic: ConsultCat; topicLabel: string; mode: string; modeLabel: string;
  flow: { label: string; score: number }[]; bestMonth: string;
  goodDays: { iso: string; label: string }[];
  idiom: [string, string, string];
}
export interface ConsultTurn { question: string; reply: string; followUps: string[]; createdAt: string }
export interface ConsultView {
  id: number;
  status: 'preview' | 'answered';
  topic: ConsultCat;
  risk: 'none' | 'concern' | 'crisis';
  /** 고민 글 (한 건 조회에서만) */
  question: string | null;
  /** 잠겨 있으면 ConsultPreview 항목만 */
  answer: ConsultAnswer | ConsultPreview | null;
  locked: boolean;
  facts: ConsultFacts | null;
  /** 잠겨 있을 때만 */
  teaser?: ConsultTeaser | null;
  /** 이어 묻기 대화 (목록에서는 null) */
  turns: ConsultTurn[] | null;
  followUpsLeft: number;
  followUpUntil: string | null;
  charged: number;
  createdAt: string | null;
  expiresAt: string | null;
}
export interface ConsultStatus {
  freeToday: boolean;
  /** 오늘 남은 무료 미리보기 · 하루 횟수 */
  freeLeft: number; freePerDay: number;
  cost: number; followUpLimit: number; followUpHours: number; minLength: number; maxLength: number;
}

/** 잠금이 풀린 전체 답변인지 */
export const isFullAnswer = (a: ConsultView['answer']): a is ConsultAnswer => !!a && 'dos' in a;

/** open: 아직 이어서 이야기할 수 있는 상담(미리보기 · 이어 묻기가 남은 상담), past: 끝난 상담 */
export type ConsultListKind = 'open' | 'past';

export const consultKeys = {
  /** 상담 관련 캐시 전부 (목록이 바뀌면 이걸로 무효화) */
  list: ['consults'] as const,
  /** 상담 탭에 보이는 앞부분 · 목록 화면의 무한 스크롤 */
  head: (kind: ConsultListKind) => ['consults', 'head', kind] as const,
  pages: (kind: ConsultListKind) => ['consults', 'pages', kind] as const,
  one: (id: number) => ['consults', id] as const,
  status: ['consults', 'status'] as const,
};

export const consultApi = {
  ask: (worry: string, topic?: ConsultCat) =>
    call<ConsultView>(api.POST('/v1/consults', { body: { worry, topic } as never })),

  status: () => call<ConsultStatus>(api.GET('/v1/consults/status')),

  unlock: (id: number) => call<ConsultView>(api.POST('/v1/consults/{id}/unlock', { params: { path: { id } } })),

  followUp: (id: number, question: string) =>
    call<ConsultView>(api.POST('/v1/consults/{id}/messages', { params: { path: { id } }, body: { question } })),

  /** 최신순 — 다음 페이지는 받은 마지막 id를 before로, limit보다 적게 오면 끝 */
  async list(query: { kind?: ConsultListKind; before?: number; limit?: number } = {}): Promise<ConsultView[]> {
    return (await call<{ list: ConsultView[] }>(api.GET('/v1/consults', { params: { query } }))).list;
  },

  get: (id: number) => call<ConsultView>(api.GET('/v1/consults/{id}', { params: { path: { id } } })),

  remove: (id: number) => call(api.DELETE('/v1/consults/{id}', { params: { path: { id } } })),
};

/** 오늘 무료 미리보기 · 가격 (로그인했을 때만) */
export function useConsultStatus(enabled: boolean) {
  return useQuery({ queryKey: consultKeys.status, queryFn: consultApi.status, enabled, staleTime: 60_000 });
}
