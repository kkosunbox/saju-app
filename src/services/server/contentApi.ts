/** Free contents from the server (guests included). Cached per profile version and day. */
import { useQuery } from '@tanstack/react-query';
import { api, call } from '../../api/client';
import { useApp } from '../../context/AppContext';
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
  return useQuery({
    queryKey: ['free', kind, user?.id, user?.version, kind === 'talisman' ? today : null],
    enabled: !!user,
    // the four paths share one response shape; the generic index loses that for TypeScript
    queryFn: async () => (await call<{ data: FreeData[K] }>(api.GET(PATHS[kind] as '/v1/contents/character'))).data,
  });
}
