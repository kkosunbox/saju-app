/** Daily and period fortunes from the server. */
import { api, call } from '../../api/client';
import { DailyFortune, PeriodFortune } from '../../types';

export const fortuneApi = {
  /** Today (KST) by default — the rule fortune, given at once. */
  async daily(userId: string, date?: string): Promise<DailyFortune> {
    const data = await call<Omit<DailyFortune, 'userId'>>(
      api.GET('/v1/fortunes/daily', { params: { query: { date } } }),
    );
    return { ...data, userId };
  },

  /** The user drew it: the server writes the AI texts once (scores and summary stay). Can take tens of seconds. */
  async draw(userId: string, date?: string): Promise<DailyFortune> {
    const data = await call<Omit<DailyFortune, 'userId'>>(
      api.POST('/v1/fortunes/daily/draw', { params: { query: { date } } }),
    );
    return { ...data, userId };
  },

  async period(type: 'weekly' | 'monthly' | 'yearly', date?: string): Promise<PeriodFortune> {
    return call<PeriodFortune>(api.GET('/v1/fortunes/period', { params: { query: { type, date } } }));
  },
};
