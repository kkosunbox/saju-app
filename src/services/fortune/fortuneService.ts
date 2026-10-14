/** 오늘의 운세 파이프라인: 4개 모듈 → 종합 엔진 → 캐시 */
import { DailyFortune, User } from '../../types';
import { getSajuAnalysis } from './sajuService';
import { getThaiAnalysis } from './thaiAstrologyService';
import { getMbtiAnalysis } from './mbtiService';
import { getBloodAnalysis } from './bloodTypeService';
import { getFortuneEngine } from './aiFortuneService';
import { combineRuleBased } from './combinedService';
import { storage } from '../storage/storageService';

export function analyzeAll(user: User, date: string) {
  return {
    saju: getSajuAnalysis(user, date),
    thai: getThaiAnalysis(user, date),
    mbti: getMbtiAnalysis(user, date),
    blood: getBloodAnalysis(user, date),
  };
}

export async function getDailyFortune(user: User, date: string, { force = false } = {}): Promise<DailyFortune> {
  if (!force) {
    const cached = await storage.getDailyFortune(user.id, date);
    if (cached) return cached;
  }
  const analyses = analyzeAll(user, date);
  const engine = getFortuneEngine();
  const combined = await engine.generate({ user, date, ...analyses, interests: user.interests ?? [] });
  const fortune: DailyFortune = { userId: user.id, date, analyses, combined, engine: engine.name };
  await storage.saveDailyFortune(fortune);
  return fortune;
}

/** 기간 운세 계산용: 캐시·AI 없이 동기 점수만 */
export function quickTotal(user: User, date: string) {
  return combineRuleBased({ user, date, ...analyzeAll(user, date), interests: user.interests ?? [] }).totalScore;
}
