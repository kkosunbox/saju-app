/** Daily and period fortunes from the server. */
import { api, call } from '../../api/client';
import { DailyFortune, PeriodFortune } from '../../types';

/** 지난 오늘의 운세 한 줄 (뽑은 날만) */
export interface FortuneHistoryItem {
  id: number;
  date: string;
  profileId: number | null;
  nickname: string;
  totalScore: number;
  title: string | null;
  summary: string;
}

export const fortuneHistoryKeys = {
  all: ['fortune-history'] as const,
  head: ['fortune-history', 'head'] as const,
  pages: ['fortune-history', 'pages'] as const,
};

export const fortuneApi = {
  /** Today (KST) by default — the rule fortune, given at once. profileId: whose (null: the primary profile). */
  async daily(userId: string, date?: string, profileId: number | null = null): Promise<DailyFortune> {
    const data = await call<Omit<DailyFortune, 'userId' | 'forProfile'>>(
      api.GET('/v1/fortunes/daily', { params: { query: { date, profileId: profileId ?? undefined } } }),
    );
    return { ...data, userId, forProfile: profileId };
  },

  /**
   * The user drew it: the server writes the AI texts once (scores and summary stay). Can take tens of seconds.
   * A second profile the same day needs the `daily:{date}` entitlement first (drawCost > 0), else 403 CONTENT_LOCKED.
   */
  async draw(userId: string, date?: string, profileId: number | null = null): Promise<DailyFortune> {
    const data = await call<Omit<DailyFortune, 'userId' | 'forProfile'>>(
      api.POST('/v1/fortunes/daily/draw', { params: { query: { date, profileId: profileId ?? undefined } } }),
    );
    return { ...data, userId, forProfile: profileId };
  },

  /** Fortunes drawn with AI texts (tokens used), the latest date first. before: the last id of the previous page. */
  async history(query: { before?: number; limit?: number } = {}): Promise<FortuneHistoryItem[]> {
    return call<FortuneHistoryItem[]>(api.GET('/v1/fortunes/daily/history', { params: { query } }));
  },

  /** One drawn fortune as it was (read only: nothing is made, drawn or charged). */
  async drawn(userId: string, id: number): Promise<DailyFortune> {
    const data = await call<Omit<DailyFortune, 'userId' | 'forProfile'>>(
      api.GET('/v1/fortunes/daily/history/{id}', { params: { path: { id } } }),
    );
    return { ...data, userId, forProfile: data.profileId ?? null };
  },

  async period(type: 'weekly' | 'monthly' | 'yearly', date?: string): Promise<PeriodFortune> {
    return call<PeriodFortune>(api.GET('/v1/fortunes/period', { params: { query: { type, date } } }));
  },
};
