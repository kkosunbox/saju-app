/**
 * 고민 상담 (서버 AI). 하루 5번까지 무료 미리보기(결론까지만), 100P로 열면 전체 답변과
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
export type ConsultPreview = Pick<ConsultAnswer, 'headline' | 'direct' | 'empathy' | 'followUps'>;
export interface ConsultFacts {
  topic: ConsultCat; topicLabel: string; mode: string; modeLabel: string;
  flow: { label: string; score: number }[]; bestMonth: string;
  goodDays: { iso: string; label: string }[];
  idiom: [string, string, string];
}
export interface ConsultTurn { question: string; reply: string; followUps: string[]; createdAt: string }
export interface HelpLine { name: string; phone: string }
export interface ConsultView {
  /** null: 위기 안내 (저장하지 않음) */
  id: number | null;
  status: 'preview' | 'answered' | 'crisis';
  topic: ConsultCat;
  risk: 'none' | 'concern' | 'crisis';
  /** 위기 · 마음 건강 신호 · '나 자신' 고민일 때 */
  helpLines: HelpLine[] | null;
  /** 고민 글 (한 건 조회에서만) */
  question: string | null;
  /** 잠겨 있으면 ConsultPreview 항목만 */
  answer: ConsultAnswer | ConsultPreview | null;
  locked: boolean;
  facts: ConsultFacts | null;
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

export const consultKeys = {
  list: ['consults'] as const,
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

  async list(): Promise<ConsultView[]> {
    return (await call<{ list: ConsultView[] }>(api.GET('/v1/consults'))).list;
  },

  get: (id: number) => call<ConsultView>(api.GET('/v1/consults/{id}', { params: { path: { id } } })),

  remove: (id: number) => call(api.DELETE('/v1/consults/{id}', { params: { path: { id } } })),
};

/** 오늘 무료 미리보기 · 가격 (로그인했을 때만) */
export function useConsultStatus(enabled: boolean) {
  return useQuery({ queryKey: consultKeys.status, queryFn: consultApi.status, enabled, staleTime: 60_000 });
}
