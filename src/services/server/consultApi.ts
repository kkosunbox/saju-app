/**
 * 운알톡 (서버 AI) — 운알이와 가볍게 나누는 대화. 하루 대화 2개까지 각 대화의 메시지 2개는 무료,
 * 그다음은 메시지마다 5알(구독 중이면 알 없이). 알은 답이 만들어진 뒤에만 차감.
 * 예전 무거운 고민 상담(미리보기 · 100알 열기)은 기록으로만 남아 읽기만 한다.
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
/** 운알톡 대화를 시작한 화면 — 운알이가 그 화면 내용을 기억하고 이야기한다 (서버가 DB에서 다시 읽는다) */
export type ChatSource =
  | { type: 'daily_fortune'; ref: string; title?: string }
  /** 주간·월간·연간 운세 — 기간과 그 기간을 정한 날짜 (weekly:2026-11-25). 서버가 같은 숫자를 다시 계산해 읽는다 */
  | { type: 'period_fortune'; ref: string; title?: string }
  | { type: 'content'; ref: string; title: string }
  /** 오늘의 타로 — 카드는 기기에서 뽑아 두므로 화면의 풀이(detail)를 함께 보낸다 */
  | { type: 'tarot'; ref: string; title: string; detail: string };

/** 보낸 출처를 대화 화면의 출처 모양으로 — 답을 기다리는 동안에도 위에 미리 띄운다 (life@123 → life) */
export const sourceView = (source: ChatSource): NonNullable<ConsultView['source']> => ({
  type: source.type,
  title: source.title ?? null,
  key: source.type === 'content' ? source.ref.split('@')[0] : source.type === 'tarot' ? source.ref : source.type === 'period_fortune' ? source.ref.split(':')[0] : null,
});

/** 콘텐츠 화면에서 운알톡을 시작할 때 — 열람권을 알면 그 프로필의 풀이를 읽게 붙인다 (life@123) */
export const contentChatSource = (contentKey: string, title: string, entitlementId?: number | null): ChatSource =>
  ({ type: 'content', ref: entitlementId ? `${contentKey}@${entitlementId}` : contentKey, title });

/** 주간·월간·연간 운세 화면에서 운알톡을 시작할 때 — 화면이 읽은 날짜(KST)로 같은 기간을 가리킨다 */
export const periodChatSource = (period: 'weekly' | 'monthly' | 'yearly', date: string, title: string): ChatSource =>
  ({ type: 'period_fortune', ref: `${period}:${date}`, title });

/** 타로 카드 화면에서 운알톡을 시작할 때 — 주제와 카드 번호(love:3, 역방향은 love:3r), 화면에 보이는 풀이(빈 줄로 나눈 상징 · 조언 · 풀이) */
export const tarotChatSource = (topicKey: string, topicLabel: string, cardId: number, reversed: boolean, detail: string): ChatSource =>
  // 제목은 서버가 붙이는 것과 같게 — 답을 기다리는 동안에도 대화 위에 주제까지 보인다
  ({ type: 'tarot', ref: `${topicKey}:${cardId}${reversed ? 'r' : ''}`, title: `오늘의 타로 · ${topicLabel}`, detail });

export interface ConsultTurn {
  question: string; reply: string; followUps: string[]; createdAt: string;
  /** 운알톡만: 이 답 아래 추가 말풍선으로 권할 콘텐츠 (대화당 많아야 1번) */
  suggest?: string | null;
  /** 운알톡만: 이 메시지에 쓴 알 */
  charged?: number;
}
export interface ConsultView {
  id: number;
  /** chat: 운알톡 대화 (turns에 모든 메시지) · preview/answered: 예전 고민 상담 (읽기만) */
  status: 'chat' | 'preview' | 'answered';
  /** 상담을 시작한 대표 프로필 — 대표 프로필을 바꿔도 끝까지 이 사람으로 이어진다 (예전 상담은 null) */
  profileId?: number | null;
  /** 상담을 시작한 때의 그 프로필 이름 */
  profileNickname?: string | null;
  topic: ConsultCat;
  risk: 'none' | 'concern' | 'crisis';
  /** 답변 아래 추천할 리포트 (서버가 주제로 정함). 대화 중 마음 건강 신호가 있었으면 null — 리포트를 권하지 않는다 */
  suggestedReport?: string | null;
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
  /** 이번 요청에서 구독 운알톡 횟수 1회를 써서 열었음 (알 안 씀) */
  viaSubscription?: boolean;
  /** 운알톡만: 시작한 화면 (오늘의 운세 · 리포트) */
  /** key: content의 콘텐츠 키 (life · theme:love · monthly:2026-11 …) — 그 화면으로 돌아갈 때 */
  source?: { type: ChatSource['type']; title: string | null; key?: string | null } | null;
  /** 운알톡만: 이 대화에 남은 무료 메시지 수 */
  freeTurnsLeft?: number;
  createdAt: string | null;
}
export interface ChatStatus {
  /** 오늘 남은 무료 대화 수 (게스트는 전체) */
  freeChatsLeft: number; freeChatsPerDay: number; freeTurnsPerChat: number;
  /** 무료를 다 쓴 뒤 메시지 1개 가격 */
  cost: number;
  /** 구독 중이라 알 없이 대화 */
  unlimited: boolean;
  minLength: number; maxLength: number; maxTurns: number;
}
export interface ConsultStatus {
  freeToday: boolean;
  /** 오늘 남은 무료 미리보기 · 하루 횟수 */
  freeLeft: number; freePerDay: number;
  cost: number; followUpLimit: number; followUpHours: number; minLength: number; maxLength: number;
  /** 구독 운알톡 — 이번 결제 회차 남은 횟수 (구독 혜택이 없으면 null). 하루 무료를 다 쓰면 알보다 먼저 쓰인다 */
  subscription: { total: number; left: number; periodEnd: string } | null;
  /** 운알톡 대화 (예전 서버는 없음) */
  chat?: ChatStatus;
}

/** 대화(또는 다음 메시지)가 알이 드는지 — 무료 메시지가 남았거나 구독 중이면 0 */
export function nextChatCost(status: ChatStatus | undefined, chat?: Pick<ConsultView, 'freeTurnsLeft'>): number {
  if (!status || status.unlimited) return 0;
  const free = chat ? (chat.freeTurnsLeft ?? 0) > 0 : status.freeChatsLeft > 0;
  return free ? 0 : status.cost;
}

/** 구독 운알톡 이번 회차 남은 횟수 */
export type SubscriptionQuota = NonNullable<ConsultStatus['subscription']>;

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
  /** 운알톡 대화 시작 — source를 주면 그 화면 내용을 기억하고 이야기한다 */
  startChat: (message: string, source?: ChatSource) =>
    call<ConsultView>(api.POST('/v1/consults/chats', { body: { message, source } as never })),

  /** @deprecated 예전 고민 상담 — 새 앱은 startChat */
  ask: (worry: string, topic?: ConsultCat) =>
    call<ConsultView>(api.POST('/v1/consults', { body: { worry, topic } as never })),

  status: () => call<ConsultStatus>(api.GET('/v1/consults/status')),

  unlock: (id: number) => call<ConsultView>(api.POST('/v1/consults/{id}/unlock', { params: { path: { id } } })),

  /** 운알톡 메시지 보내기 (예전 상담의 이어 묻기와 같은 길) */
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
