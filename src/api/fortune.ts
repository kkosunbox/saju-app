// 운세 API 창구. 화면/컨텍스트는 이 파일만 의존한다.
// TODO(BE): saju-be-monorepo에 운세 엔드포인트가 생기면 local-engine 호출을 HTTP 호출로 교체하고 local-engine을 삭제한다.
import { PeriodFortune, Period, User } from '@/types';
import { getDailyFortune as localDaily } from './local-engine/fortuneService';
import { getPeriodFortune as localPeriod } from './local-engine/periodFortuneService';
import { getCompatibilityEngine } from './local-engine/compatibilityService';

type PartnerInput = Parameters<ReturnType<typeof getCompatibilityEngine>['analyze']>[1];

export const fortuneApi = {
  getDaily: (user: User, date: string, opts?: { force?: boolean }) => localDaily(user, date, opts),
  getPeriod: async (user: User, today: string, period: Exclude<Period, 'daily'>): Promise<PeriodFortune> => localPeriod(user, today, period),
  analyzeCompatibility: (user: User, partner: PartnerInput) => getCompatibilityEngine().analyze(user, partner),
};
