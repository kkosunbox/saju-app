/**
 * Paid contents and their free previews from the server.
 * The body comes only with an entitlement (member + unlocked); the preview (guests too) is the free top part.
 */
import { useQuery } from '@tanstack/react-query';
import { api, call } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { PurposeKey, SajuFull, SajuProfile } from '../../types/premium';
import { toSajuFull } from '../premium/helpers';

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

interface Envelope<T> { contentKey: string; data: T; profile?: SajuProfile }

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
    queryFn: async (): Promise<{ data: T; F: SajuFull | null }> => {
      const r = await getContent<T>(ref);
      return { data: r.data, F: r.profile ? toSajuFull(r.profile) : null };
    },
    staleTime: 10 * 60_000,
  });
  return { open, ...q };
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
