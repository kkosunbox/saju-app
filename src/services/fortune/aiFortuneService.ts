/**
 * AI 종합 레이어.
 * - FortuneEngine 인터페이스만 지키면 규칙 엔진 / Claude / OpenAI 등으로 교체 가능.
 * - API 키는 앱에 넣지 않는다. 반드시 자체 백엔드(Supabase Edge Function 등)를 프록시로 둔다.
 * - AI 응답은 JSON으로만 받고, 검증 실패 시 규칙 엔진으로 fallback.
 */
import { CombinedFortune, CombinedFortuneInput } from '../../types';
import { combineRuleBased } from './combinedService';

export interface FortuneEngine {
  name: 'rule' | 'ai';
  generate(input: CombinedFortuneInput): Promise<CombinedFortune>;
}

export const AI_CONFIG = {
  enabled: false, // 백엔드 준비 후 true
  endpoint: 'https://YOUR-BACKEND/functions/v1/combine-fortune',
  timeoutMs: 12000,
};

export const ruleEngine: FortuneEngine = {
  name: 'rule',
  generate: async input => combineRuleBased(input),
};

/** 백엔드에서 LLM에 그대로 전달할 프롬프트 */
export function buildPrompt(input: CombinedFortuneInput) {
  const strip = (a: CombinedFortuneInput['saju']) => ({ headline: a.headline, description: a.description, tags: a.tags });
  return {
    system:
      '너는 운세 콘텐츠 앱 "운Pick"의 작가다. 사주·태국 점성술·MBTI·혈액형 분석 결과를 하나의 이야기로 종합한다. ' +
      '재미와 참고를 위한 콘텐츠이며, 미래를 단정하거나 과학적 예측처럼 표현하지 않는다. ' +
      '금전·건강·법률 결정을 운세만으로 내리도록 유도하지 않는다. 반드시 JSON만 출력한다.',
    user: JSON.stringify({
      date: input.date,
      nickname: input.user.nickname,
      interests: input.interests,
      concern: input.user.concern ?? null,
      saju: strip(input.saju),
      thai: strip(input.thai),
      mbti: strip(input.mbti),
      blood: strip(input.blood),
      outputSchema: {
        totalScore: 'number 55~97', summary: 'string ≤40자', keywords: 'string[3]', commonKeywords: 'string[]',
        love: 'number', money: 'number', work: 'number', relationship: 'number',
        categoryTexts: '{love,money,work,relationship: string}', combinedStory: 'string ≤300자',
        goodActions: 'string[3]', avoidActions: 'string[3]', luckyColor: 'string', luckyColorHex: '#RRGGBB',
        luckyNumber: 'number 1~9', luckyTime: 'HH:mm~HH:mm',
      },
    }),
  };
}

export function validateCombinedFortune(x: any): x is CombinedFortune {
  const num = (v: any) => typeof v === 'number' && v >= 0 && v <= 100;
  const strArr = (v: any) => Array.isArray(v) && v.every(s => typeof s === 'string');
  return !!x && num(x.totalScore) && typeof x.summary === 'string' && strArr(x.keywords)
    && num(x.love) && num(x.money) && num(x.work) && num(x.relationship)
    && strArr(x.goodActions) && strArr(x.avoidActions) && typeof x.luckyTime === 'string'
    && x.categoryTexts && typeof x.combinedStory === 'string';
}

export const aiEngine: FortuneEngine = {
  name: 'ai',
  async generate(input) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs);
    try {
      const res = await fetch(AI_CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPrompt(input)),
        signal: controller.signal,
      });
      const text = await res.text();
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      if (!validateCombinedFortune(parsed)) throw new Error('invalid schema');
      return parsed;
    } catch (e) {
      console.warn('[aiEngine] fallback to rule engine:', e);
      return combineRuleBased(input);
    } finally {
      clearTimeout(timer);
    }
  },
};

export const getFortuneEngine = (): FortuneEngine => (AI_CONFIG.enabled ? aiEngine : ruleEngine);
