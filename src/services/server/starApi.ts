/**
 * 천생연분 스타 — 오늘의 궁합 (무료, 게스트 가능). 고른 프로필(기본: 대표 프로필) 기준.
 * 점수는 날마다 바뀌고, 서버가 그날 처음 뽑힌 스타를 기억해서 같은 날 다시 열어도 같은 스타가 나온다.
 */
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { requestData } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { useContentScope } from '../../context/ContentScopeContext';
import { ContentPerson } from './profileApi';
import { StarGender, StarMatch, StarMatchDetail } from '../../types/content';

const query = (params: Record<string, string | number | undefined>) => {
  const q = Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
  return q ? `?${q}` : '';
};

/** 뽑은 결과는 뽑은 때의 사람으로 그린다 (그 뒤 프로필을 고쳐도 같은 이름) */
function useReportPerson(kind: string, person: ContentPerson | null | undefined) {
  const scope = useContentScope();
  const scopeKey = scope?.scopeKey(`free:${kind}`);
  useEffect(() => {
    if (scope && scopeKey && person) scope.reportOpened(scopeKey, person, null);
  }, [scope, scopeKey, person]);
}

/** gender를 주지 않으면 서버가 내 성별의 반대로 정한다 */
export function useStarMatch(gender?: StarGender) {
  const { user, today } = useApp();
  const scope = useContentScope();
  const profileId = scope?.profileId ?? undefined;
  const version = scope?.profile?.version ?? user?.version;
  const day = scope?.realToday ?? today;
  const q = useQuery({
    queryKey: ['free', 'celebrity-match', user?.id, profileId ?? '', version, gender ?? '', day],
    enabled: !!user,
    queryFn: () => requestData<{ data: StarMatch; person?: ContentPerson }>(`/v1/contents/celebrity-match${query({ profileId, gender })}`),
  });
  useReportPerson('celebrity-match', q.data?.person);
  return { ...q, data: q.data?.data };
}

export function useStarDetail(id: number | null) {
  const { user, today } = useApp();
  const scope = useContentScope();
  const profileId = scope?.profileId ?? undefined;
  const version = scope?.profile?.version ?? user?.version;
  const day = scope?.realToday ?? today;
  const q = useQuery({
    queryKey: ['free', 'celebrity-match', 'detail', user?.id, profileId ?? '', version, id, day],
    enabled: !!user && id != null,
    queryFn: () => requestData<{ data: StarMatchDetail; person?: ContentPerson }>(`/v1/contents/celebrity-match/${id}${query({ profileId })}`),
  });
  useReportPerson('celebrity-match', q.data?.person);
  return { ...q, data: q.data?.data };
}
