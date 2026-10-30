import { api, call } from '../../api/client';

/** 풀이 목록은 화면 훅과 앱 전체 완료 알림이 함께 사용한다. Context에 의존하지 않는다. */
export interface ReadingListItem {
  contentKey: string;
  status: 'writing' | 'done' | 'failed';
  completedAt: string | null;
  updatedAt: string;
}

export const readingsKey = ['readings'] as const;
export const listReadings = async (): Promise<ReadingListItem[]> =>
  (await call<{ items: ReadingListItem[] }>(api.GET('/v1/premium/readings'))).items;
