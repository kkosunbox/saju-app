/** Daily and period fortunes from the server. */
import { api, call } from '../../api/client';
import { DailyFortune, PeriodFortune } from '../../types';

export const fortuneApi = {
  /** Today (KST) by default. The first call of the day can take a moment. */
  async daily(userId: string, date?: string): Promise<DailyFortune> {
    const data = await call<Omit<DailyFortune, 'userId'>>(
      api.GET('/v1/fortunes/daily', { params: { query: { date } } }),
    );
    return { ...data, userId };
  },

  async period(type: 'weekly' | 'monthly' | 'yearly', date?: string): Promise<PeriodFortune> {
    return call<PeriodFortune>(api.GET('/v1/fortunes/period', { params: { query: { type, date } } }));
  },
};
