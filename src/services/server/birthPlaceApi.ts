/** Birth place search (GET /birth-places — Korea's 시·군, North Korea, cities abroad). */
import { api, call } from '../../api/client';
import { BirthPlace } from '../../types';

export const birthPlaceApi = {
  /** Places matching a Korean or English name; an empty query gives the popular ones. */
  async search(q: string, limit = 8): Promise<BirthPlace[]> {
    const data = await call<{ places: BirthPlace[] }>(api.GET('/v1/birth-places', { params: { query: { q, limit } } }));
    return data.places;
  },
};

/** "포항시 · 경북", "서울특별시", "로스앤젤레스 · 미국 · 미 태평양 시간" */
export const placeLabel = (p: BirthPlace): string => [p.name, p.region].filter(Boolean).join(' · ');
