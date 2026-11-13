/**
 * Free contents from the server (guests included), for the profile picked on the screen (the
 * primary one by default). The server keeps each profile's result as first drawn, with who it was
 * drawn for; the screen is drawn with that person.
 */
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, call } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { useContentScope } from '../../context/ContentScopeContext';
import { ContentPerson } from './profileApi';
import { MbtiMatches, PastLife, SajuCharacter, Talisman } from '../../types/content';

type FreeKind = 'mbti-match' | 'character' | 'talisman' | 'past-life';
interface FreeData {
  'mbti-match': MbtiMatches;
  character: SajuCharacter;
  talisman: Talisman;
  'past-life': PastLife;
}

const PATHS = {
  'mbti-match': '/v1/contents/mbti-match',
  character: '/v1/contents/character',
  talisman: '/v1/contents/talisman',
  'past-life': '/v1/contents/past-life',
} as const;

export function useFreeContent<K extends FreeKind>(kind: K) {
  const { user, today } = useApp();
  const scope = useContentScope();
  const profileId = scope?.profileId ?? undefined;
  const version = scope?.profile?.version ?? user?.version;
  const day = scope?.realToday ?? today;
  const q = useQuery({
    queryKey: ['free', kind, user?.id, profileId ?? '', version, kind === 'talisman' ? day : null],
    enabled: !!user,
    // the four paths share one response shape; the generic index loses that for TypeScript
    queryFn: async () => {
      const r = await call<{ data: FreeData[K]; person?: ContentPerson }>(
        api.GET(PATHS[kind] as '/v1/contents/character', { params: { query: { profileId } } }),
      );
      return { data: r.data, person: r.person ?? null };
    },
  });
  // 뽑은 결과는 뽑은 때의 사람으로 그린다 (그 뒤 프로필을 고쳐도 같은 이름 · 같은 MBTI)
  const person = q.data?.person ?? null;
  const scopeKey = scope?.scopeKey(`free:${kind}`);
  useEffect(() => {
    if (scope && scopeKey && person) scope.reportOpened(scopeKey, person, null);
  }, [scope, scopeKey, person]);
  return { ...q, data: q.data?.data };
}
