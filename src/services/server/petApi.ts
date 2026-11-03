/** 반려동물 궁합 — 등록한 아이들과 각 아이의 궁합 (서버가 내 지금 프로필로 계산). */
import { useQuery } from '@tanstack/react-query';
import { api, call } from '../../api/client';
import { queryClient } from '../../api/query';
import { useApp } from '../../context/AppContext';
import { Pet, PetInput } from '../../types/content';

export const petKeys = { list: ['pets'] as const };

/** 생성된 스키마는 결과(result)를 빈 객체로 적어서 앱 타입으로 읽는다 */
export const petApi = {
  list: async () => (await call<{ list: Pet[] }>(api.GET('/v1/pets'))).list,
  create: (pet: PetInput) => call<Pet>(api.POST('/v1/pets', { body: pet })),
  remove: (id: number) => call(api.DELETE('/v1/pets/{id}', { params: { path: { id } } })),
};

/** 프로필을 바꾸면 결과도 바뀌므로 프로필 버전마다 새로 받는다 */
export function usePets() {
  const { user } = useApp();
  return useQuery({ queryKey: [...petKeys.list, user?.id, user?.version], queryFn: petApi.list, enabled: !!user });
}

/** 목록과 열어 둔 전체 결과(성향을 고치면 비교가 바뀐다)를 함께 새로 */
export const refreshPets = () => Promise.all([
  queryClient.invalidateQueries({ queryKey: petKeys.list }),
  queryClient.invalidateQueries({ predicate: q => q.queryKey[0] === 'premium' && String(q.queryKey[1]).startsWith('pet:') }),
]);
