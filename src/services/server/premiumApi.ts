/**
 * Paid contents and their free previews from the server.
 * The body comes only with an entitlement (member + unlocked); the preview (guests too) is the free top part.
 */
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, call } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { PurposeKey, SajuFull, SajuProfile } from '../../types/premium';
import { ReadingView } from '../../types/reading';
import { toSajuFull } from '../premium/helpers';
import { readingsKey } from './premiumReadings';

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
  | { kind: 'crush'; id: number };

/** Unlock key of a content (same as the server catalog). */
export function contentKeyOf(ref: PremiumRef): string {
  switch (ref.kind) {
    case 'newyear': return `newyear:${ref.year}`;
    case 'monthly': return `monthly:${ref.month}`;
    case 'theme': return `theme:${ref.theme}`;
    case 'lucky': return `lucky:${ref.purpose}`;
    case 'compat': return `compat:${ref.id}`;
    case 'crush': return `crush:${ref.id}`;
    default: return ref.kind;
  }
}

interface Envelope<T> { contentKey: string; data: T; profile?: SajuProfile; reading?: ReadingView | null }

function getContent<T>(ref: PremiumRef) {
  const r = (() => {
    switch (ref.kind) {
      case 'saju': return api.GET('/v1/premium/contents/saju');
      case 'life': return api.GET('/v1/premium/contents/life');
      case 'spouse': return api.GET('/v1/premium/contents/spouse');
      case 'newyear': return api.GET('/v1/premium/contents/newyear/{year}', { params: { path: { year: ref.year } } });
      case 'monthly': return api.GET('/v1/premium/contents/monthly/{month}', { params: { path: { month: ref.month } } });
      case 'theme': return api.GET('/v1/premium/contents/theme/{kind}', { params: { path: { kind: ref.theme } } });
      case 'lucky': return api.GET('/v1/premium/contents/lucky/{purpose}', { params: { path: { purpose: ref.purpose } } });
      case 'compat': return api.GET('/v1/premium/contents/compat/{compatibilityId}', { params: { path: { compatibilityId: ref.id } } });
      case 'crush': return api.GET('/v1/premium/contents/crush/{compatibilityId}', { params: { path: { compatibilityId: ref.id } } });
    }
  })();
  return call<Envelope<T>>(r);
}

function getPreview<T>(ref: PremiumRef) {
  const r = (() => {
    switch (ref.kind) {
      case 'saju': return api.GET('/v1/premium/previews/saju');
      case 'life': return api.GET('/v1/premium/previews/life');
      case 'spouse': return api.GET('/v1/premium/previews/spouse');
      case 'newyear': return api.GET('/v1/premium/previews/newyear/{year}', { params: { path: { year: String(ref.year) } } });
      case 'monthly': return api.GET('/v1/premium/previews/monthly/{month}', { params: { path: { month: ref.month } } });
      case 'theme': return api.GET('/v1/premium/previews/theme/{kind}', { params: { path: { kind: ref.theme } } });
      case 'lucky': return api.GET('/v1/premium/previews/lucky/{purpose}', { params: { path: { purpose: ref.purpose } } });
      default: throw new Error(`no preview for ${ref.kind}`);
    }
  })();
  return call<Envelope<T>>(r);
}

/**
 * The paid body, fetched only once the content is unlocked.
 * `F` is the user's saju summary the screens build their sentences on.
 */
export function usePremiumContent<T>(ref: PremiumRef) {
  const { user, account, today } = useApp();
  const { owned } = usePremium();
  const key = contentKeyOf(ref);
  const open = !!account && owned(key);
  const q = useQuery({
    queryKey: ['premium', key, user?.id, user?.version, today],
    enabled: open && !!user,
    queryFn: async (): Promise<{ data: T; F: SajuFull | null; reading: ReadingView | null }> => {
      const r = await getContent<T>(ref);
      return { data: r.data, F: r.profile ? toSajuFull(r.profile) : null, reading: r.reading ?? null };
    },
    staleTime: 10 * 60_000,
  });
  return { open, key, ...q };
}

const READING_POLL_MS = 3000;

/**
 * The AI reading of an opened content. While the server is writing, polls its status (the server
 * keeps writing when the user leaves; coming back shows the finished reading).
 * `retry` asks the server to write again (a failed reading is restarted when the content is fetched).
 */
export function useReading<P>(content: { key: string; data?: { reading: ReadingView | null }; refetch(): unknown }) {
  const qc = useQueryClient();
  const initial = (content.data?.reading ?? null) as ReadingView<P> | null;
  const writing = initial?.status === 'writing';
  const poll = useQuery({
    queryKey: ['reading-status', content.key],
    enabled: writing,
    queryFn: async () =>
      (await call<{ reading: ReadingView | null }>(
        api.GET('/v1/premium/readings/status', { params: { query: { contentKey: content.key } } }),
      )).reading as ReadingView<P> | null,
    refetchInterval: q => (q.state.data && q.state.data.status !== 'writing' ? false : READING_POLL_MS),
  });
  const latest = writing && poll.data ? poll.data : initial;
  useEffect(() => {
    // let the app-wide watcher know, so it can tell the user when this finishes elsewhere
    if (writing) qc.invalidateQueries({ queryKey: readingsKey });
  }, [writing, qc]);
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
  const key = contentKeyOf(ref);
  return useQuery({
    queryKey: ['premium-preview', key, user?.id, user?.version, today],
    enabled: enabled && !!user,
    queryFn: async () => (await getPreview<T>(ref)).data,
    staleTime: 10 * 60_000,
  });
}
