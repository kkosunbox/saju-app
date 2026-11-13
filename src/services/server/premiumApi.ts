/**
 * Paid contents and their free previews from the server.
 * The body comes only with an entitlement (member + unlocked); the preview (guests too) is the free top part.
 */
import { useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, call } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { useContentScope, useScopedPremium } from '../../context/ContentScopeContext';
import { useSharedView } from '../../context/SharedViewContext';
import { PurposeKey, SajuFull, SajuProfile } from '../../types/premium';
import { ReadingView } from '../../types/reading';
import { toSajuFull } from '../premium/helpers';
import { markViewing } from '../readingPresence';
import { readingsKey } from './premiumReadings';
import { ContentPerson } from './profileApi';
import { pointsKeys } from './pointsApi';

export { listReadings, readingsKey } from './premiumReadings';
export type { ReadingListItem } from './premiumReadings';

export type ThemeKind = 'love' | 'money' | 'career';
export type PremiumRef =
  | { kind: 'saju' }
  | { kind: 'life' }
  | { kind: 'spouse' }
  | { kind: 'newyear'; year: number }
  | { kind: 'monthly'; month: string }
  | { kind: 'theme'; theme: ThemeKind }
  | { kind: 'lucky'; purpose: PurposeKey }
  | { kind: 'compat'; id: number }
  | { kind: 'crush'; id: number }
  | { kind: 'pet'; id: number };

/** Unlock key of a content (same as the server catalog). */
export function contentKeyOf(ref: PremiumRef): string {
  switch (ref.kind) {
    case 'newyear': return `newyear:${ref.year}`;
    case 'monthly': return `monthly:${ref.month}`;
    case 'theme': return `theme:${ref.theme}`;
    case 'lucky': return `lucky:${ref.purpose}`;
    case 'compat': return `compat:${ref.id}`;
    case 'crush': return `crush:${ref.id}`;
    case 'pet': return `pet:${ref.id}`;
    default: return ref.kind;
  }
}

interface Envelope<T> {
  contentKey: string;
  data: T;
  profile?: SajuProfile;
  reading?: ReadingView | null;
  /** 보고 있는 열람권 */
  entitlementId?: number;
  /** 처음 열어 본 날 — 결과와 풀이의 기준일 */
  openedOn?: string;
  /** 누구의 콘텐츠인지 (처음 열어 본 때의 프로필 정보) */
  person?: ContentPerson;
}

/** 어느 프로필 것을 볼지 · 예전에 산 것을 볼지 (없으면 대표 프로필의 지금 정보로 연 것) */
export interface ContentTarget { profileId?: number; entitlementId?: number }

function getContent<T>(ref: PremiumRef, target: ContentTarget) {
  const query = target;
  const r = (() => {
    switch (ref.kind) {
      case 'saju': return api.GET('/v1/premium/contents/saju', { params: { query } });
      case 'life': return api.GET('/v1/premium/contents/life', { params: { query } });
      case 'spouse': return api.GET('/v1/premium/contents/spouse', { params: { query } });
      case 'newyear': return api.GET('/v1/premium/contents/newyear/{year}', { params: { path: { year: ref.year }, query } });
      case 'monthly': return api.GET('/v1/premium/contents/monthly/{month}', { params: { path: { month: ref.month }, query } });
      case 'theme': return api.GET('/v1/premium/contents/theme/{kind}', { params: { path: { kind: ref.theme }, query } });
      case 'lucky': return api.GET('/v1/premium/contents/lucky/{purpose}', { params: { path: { purpose: ref.purpose }, query } });
      case 'compat': return api.GET('/v1/premium/contents/compat/{compatibilityId}', { params: { path: { compatibilityId: ref.id }, query } });
      case 'crush': return api.GET('/v1/premium/contents/crush/{compatibilityId}', { params: { path: { compatibilityId: ref.id }, query } });
      case 'pet': return api.GET('/v1/premium/contents/pet/{petId}', { params: { path: { petId: ref.id }, query } });
    }
  })();
  return call<Envelope<T>>(r);
}

function getPreview<T>(ref: PremiumRef, profileId?: number) {
  const query = { profileId };
  const r = (() => {
    switch (ref.kind) {
      case 'saju': return api.GET('/v1/premium/previews/saju', { params: { query } });
      case 'life': return api.GET('/v1/premium/previews/life', { params: { query } });
      case 'spouse': return api.GET('/v1/premium/previews/spouse', { params: { query } });
      case 'newyear': return api.GET('/v1/premium/previews/newyear/{year}', { params: { path: { year: String(ref.year) }, query } });
      case 'monthly': return api.GET('/v1/premium/previews/monthly/{month}', { params: { path: { month: ref.month }, query } });
      case 'theme': return api.GET('/v1/premium/previews/theme/{kind}', { params: { path: { kind: ref.theme }, query } });
      case 'lucky': return api.GET('/v1/premium/previews/lucky/{purpose}', { params: { path: { purpose: ref.purpose }, query } });
      default: throw new Error(`no preview for ${ref.kind}`);
    }
  })();
  return call<Envelope<T>>(r);
}

/** 화면 범위(고른 프로필 · 예전 열람권)에서 서버에 넘길 대상과 쿼리 키 */
function useTarget(ref: PremiumRef): { target: ContentTarget; key: unknown[] } {
  const scope = useContentScope();
  const entitlementId = scope?.entitlement?.contentKey === contentKeyOf(ref) ? scope.entitlement.id : undefined;
  // 심층 궁합 · 속마음은 궁합 기록의 프로필로 정해진다 (서버가 고른다)
  const byRecord = ref.kind === 'compat' || ref.kind === 'crush';
  const profileId = byRecord ? undefined : scope?.profileId ?? undefined;
  return {
    target: entitlementId !== undefined ? { entitlementId } : { profileId },
    key: [entitlementId ? `e${entitlementId}` : `p${profileId ?? ''}`, byRecord ? '' : scope?.profile?.version ?? ''],
  };
}

/**
 * The paid body, fetched only once the content is unlocked.
 * `F` is the user's saju summary the screens build their sentences on.
 * On a share link (/r/{token}) it is the copy the sharer shared, and nothing is fetched.
 */
export function usePremiumContent<T>(ref: PremiumRef) {
  const { user, account } = useApp();
  const { owned, entitlements } = useScopedPremium();
  const queryClient = useQueryClient();
  const scope = useContentScope();
  const shared = useSharedView();
  const key = contentKeyOf(ref);
  const { target, key: targetKey } = useTarget(ref);
  const open = !!account && owned(key);
  const q = useQuery({
    queryKey: ['premium', key, user?.id, ...targetKey],
    enabled: open && !!user && !shared,
    queryFn: async (): Promise<{ data: T; F: SajuFull | null; reading: ReadingView | null; entitlementId: number | null; person: ContentPerson | null; openedOn: string | null }> => {
      const r = await getContent<T>(ref, target);
      return {
        data: r.data,
        F: r.profile ? toSajuFull(r.profile) : null,
        reading: r.reading ?? null,
        entitlementId: r.entitlementId ?? null,
        person: r.person ?? null,
        openedOn: r.openedOn ?? null,
      };
    },
    staleTime: 10 * 60_000,
  });
  // 열어 본 콘텐츠는 처음 연 때의 사람 · 날로 화면 전체를 그린다
  const person = q.data?.person ?? null;
  const openedOn = q.data?.openedOn ?? null;
  const scopeKey = scope?.scopeKey(key);
  // 심층 궁합 · 속마음은 궁합 기록의 프로필로 정해져서 화면(나로 볼 프로필 고르기)을 바꾸지 않는다
  const byRecord = ref.kind === 'compat' || ref.kind === 'crush';
  useEffect(() => {
    if (scope && scopeKey && person && !byRecord) scope.reportOpened(scopeKey, person, openedOn);
  }, [scope, scopeKey, person, openedOn, byRecord]);
  // 처음 열어 본 순간 서버가 그 날을 적어 두니, 구매 기록(언제 봤는지)을 다시 읽는다
  const entitlementId = q.data?.entitlementId ?? null;
  const unseen = !!entitlementId && entitlements.some(e => e.id === entitlementId && !e.openedOn);
  useEffect(() => {
    if (unseen) void queryClient.invalidateQueries({ queryKey: pointsKeys.unlocks });
  }, [unseen, queryClient]);
  if (shared) {
    const data = shared.contentKey === key ? { data: shared.data as T, F: shared.F, reading: shared.reading, entitlementId: null, person: null, openedOn: null } : undefined;
    return { ...q, open: true, key, target, data, isError: !data };
  }
  return { open, key, target, ...q };
}

const READING_POLL_MS = 3000;

/**
 * The AI reading of an opened content. While the server is writing, polls its status (the server
 * keeps writing when the user leaves; coming back shows the finished reading).
 * `retry` asks the server to write again (a failed reading is restarted when the content is fetched).
 */
export function useReading<P>(content: { key: string; target?: ContentTarget; data?: { reading: ReadingView | null; entitlementId?: number | null }; refetch(): unknown }) {
  const qc = useQueryClient();
  const initial = (content.data?.reading ?? null) as ReadingView<P> | null;
  const writing = initial?.status === 'writing';
  const entitlementId = content.data?.entitlementId ?? undefined;
  const poll = useQuery({
    queryKey: ['reading-status', content.key, entitlementId ?? content.target?.profileId ?? ''],
    enabled: writing,
    queryFn: async () =>
      (await call<{ reading: ReadingView | null }>(
        api.GET('/v1/premium/readings/status', {
          params: { query: { contentKey: content.key, ...(entitlementId ? { entitlementId } : content.target ?? {}) } },
        }),
      )).reading as ReadingView<P> | null,
    refetchInterval: q => (q.state.data && q.state.data.status !== 'writing' ? false : READING_POLL_MS),
  });
  const latest = writing && poll.data ? poll.data : initial;
  useEffect(() => {
    // let the app-wide watcher know, so it can tell the user when this finishes elsewhere
    if (writing) qc.invalidateQueries({ queryKey: readingsKey });
  }, [writing, qc]);
  // 이 화면을 보는 동안엔 풀이가 화면에 바로 채워지니 완성 토스트를 띄우지 않는다
  const key = content.key;
  useFocusEffect(useCallback(() => markViewing(key), [key]));
  const finished = writing && !!poll.data && poll.data.status !== 'writing';
  useEffect(() => {
    // keep the content cache in step so leaving and coming back shows the finished reading
    if (finished) {
      qc.invalidateQueries({ queryKey: ['premium', content.key] });
      qc.invalidateQueries({ queryKey: readingsKey });
    }
  }, [finished, qc, content.key]);
  return { reading: latest, retry: () => content.refetch() };
}

/** The free top part of a paid screen, shown while it is locked. */
export function usePremiumPreview<T>(ref: PremiumRef, enabled = true) {
  const { user, today } = useApp();
  const scope = useContentScope();
  const shared = useSharedView();
  const key = contentKeyOf(ref);
  const profileId = scope?.profileId ?? undefined;
  const day = scope?.realToday ?? today;
  return useQuery({
    queryKey: ['premium-preview', key, user?.id, profileId ?? '', scope?.profile?.version ?? user?.version, day],
    enabled: enabled && !!user && !shared,
    queryFn: async () => (await getPreview<T>(ref, profileId)).data,
    staleTime: 10 * 60_000,
  });
}
