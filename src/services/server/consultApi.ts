/** 말 못 할 고민 상담 (서버 AI · 100P, 답변이 만들어진 뒤에만 차감). 회원 전용. */
import { api, call } from '../../api/client';
import { ConsultCat } from '../content/consult';

export interface ConsultAnswer {
  headline: string; direct: string; empathy: string; me: string; star: string; now: string;
  dos: string[]; avoid: string[]; closing: string;
}
export interface ConsultFacts {
  topic: ConsultCat; topicLabel: string; mode: string; modeLabel: string;
  flow: { label: string; score: number }[]; bestMonth: string;
  goodDays: { iso: string; label: string }[];
  idiom: [string, string, string];
}
export interface HelpLine { name: string; phone: string }
export interface ConsultView {
  /** null: 위기 안내 (저장하지 않음) */
  id: number | null;
  status: 'answered' | 'crisis';
  topic: ConsultCat;
  risk: 'none' | 'concern' | 'crisis';
  /** 위기 · 마음 건강 신호 · '나 자신' 고민일 때 */
  helpLines: HelpLine[] | null;
  /** 고민 글 (한 건 조회에서만) */
  question: string | null;
  answer: ConsultAnswer | null;
  facts: ConsultFacts | null;
  charged: number;
  createdAt: string | null;
  expiresAt: string | null;
}

export const consultKeys = { list: ['consults'] as const, one: (id: number) => ['consults', id] as const };

export const consultApi = {
  ask: (worry: string, topic?: ConsultCat) =>
    call<ConsultView>(api.POST('/v1/consults', { body: { worry, topic } as never })),

  async list(): Promise<ConsultView[]> {
    return (await call<{ list: ConsultView[] }>(api.GET('/v1/consults'))).list;
  },

  get: (id: number) => call<ConsultView>(api.GET('/v1/consults/{id}', { params: { path: { id } } })),

  remove: (id: number) => call(api.DELETE('/v1/consults/{id}', { params: { path: { id } } })),
};
