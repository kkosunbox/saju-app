/** 우리 아이 사주 — 등록한 가족(아이 + 보호자 1~2명)과 각 가족의 무료 미리보기. 가족은 고칠 수 없고 지우기만 된다. */
import { useQuery } from '@tanstack/react-query';
import { api, call } from '../../api/client';
import { queryClient } from '../../api/query';
import { useApp } from '../../context/AppContext';
import { useSharedView } from '../../context/SharedViewContext';
import { ChildSet } from '../../types/premium';
import { ProfileInput } from './profileApi';

export const childKeys = { list: ['children'] as const };

/** 한 사람: 내 프로필을 불러오거나(profileId), 직접 입력한다(profile — saveToProfiles면 내 프로필에도 추가) */
export type ChildMemberInput = { profileId: number } | { profile: ProfileInput; saveToProfiles: boolean };
/** 아이와 함께 볼 보호자 1~2명 (입력한 순서대로) */
export interface ChildSetInput { child: ChildMemberInput; parents: ChildMemberInput[] }

/** 생성된 스키마는 결과(result)를 빈 객체로 적어서 앱 타입으로 읽는다 */
export const childApi = {
  list: async () => (await call<{ list: ChildSet[] }>(api.GET('/v1/children'))).list,
  create: (input: ChildSetInput) => call<ChildSet>(api.POST('/v1/children', { body: input as never })),
  remove: (id: number) => call(api.DELETE('/v1/children/{id}', { params: { path: { id } } })),
};

export function useChildSets() {
  const { user } = useApp();
  // 공유 링크로 연 화면은 공유된 아이만 보여 주니 목록을 받지 않는다
  const shared = useSharedView();
  return useQuery({ queryKey: [...childKeys.list, user?.id], queryFn: childApi.list, enabled: !!user && !shared });
}

export const refreshChildSets = () => queryClient.invalidateQueries({ queryKey: childKeys.list });
