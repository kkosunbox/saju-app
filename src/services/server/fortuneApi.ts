/** Daily and period fortunes from the server. */
import { api, call } from '../../api/client';
import { DailyFortune, PeriodFortune } from '../../types';

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

  async period(type: 'weekly' | 'monthly' | 'yearly', date?: string): Promise<PeriodFortune> {
    return call<PeriodFortune>(api.GET('/v1/fortunes/period', { params: { query: { type, date } } }));
  },
};
