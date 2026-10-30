import { STEMS, type Element } from '../../data/sajuData';
import { STEM_PERSONA } from '../premium/data';
import type { MoneyType } from '../../types/premium';

/** Complete phrases for a small share-card slot, in the same order as STEM_PERSONA. */
const PERSONA_COPY = [
  { strength: '추진력', talent: '목표 달성' },
  { strength: '유연함', talent: '분위기 파악' },
  { strength: '열정', talent: '솔직한 표현' },
  { strength: '섬세함', talent: '세심한 관찰' },
  { strength: '듬직함', talent: '든든한 지지' },
  { strength: '실용성', talent: '현실 감각' },
  { strength: '결단력', talent: '의리와 약속' },
  { strength: '감각', talent: '미적 감각' },
  { strength: '지략', talent: '넓은 시야' },
  { strength: '직관', talent: '남다른 직감' },
] as const;

export const personaCopy = (stem: number) => PERSONA_COPY[stem];
export const characterStrength = (hanja: string, core: string) =>
  PERSONA_COPY[STEMS.findIndex(x => x.hanja === hanja[0])]?.strength ?? core;
export const carriedTalent = (carried: string) =>
  PERSONA_COPY[STEM_PERSONA.findIndex(x => x.str[0] === carried)]?.talent ?? carried;

export const PLAIN_ELEMENT: Record<Element, string> = {
  wood: '나무', fire: '불', earth: '흙', metal: '금속', water: '물',
};
// Summaries of the existing EL_LUCK activities, selected by the result's helpful element.
export const COMFORT: Record<Element, string> = {
  wood: '자연과 산책', fire: '햇빛과 활기', earth: '규칙적인 일상', metal: '정돈된 공간', water: '조용한 몰입',
};

const MONEY_COPY: Record<string, { strength: string; watch: string }> = {
  '차곡차곡 저축가': { strength: '꾸준한 저축', watch: '망설임' },
  '기회 포착 탐험가': { strength: '기회 포착', watch: '잦은 변심' },
  '판을 키우는 사업가': { strength: '추진·협상력', watch: '커지는 지출' },
  '경험에 쓰는 낭만가': { strength: '가치 소비', watch: '즉흥 지출' },
  '사람이 재산인 마당발': { strength: '사람과 인맥', watch: '지인 돈거래' },
  '실력이 곧 돈인 장인': { strength: '기술과 실력', watch: '관리 소홀' },
};
export const moneyCopy = (type: MoneyType) => MONEY_COPY[type.name]
  ?? Object.entries(MONEY_COPY).find(([name]) => name.replace(/\s/g, '') === type.name.replace(/\s/g, ''))?.[1]
  ?? { strength: type.str, watch: type.watch };

/** Keep the actual engine boundaries (currently 29 / 30–54 / 55+), not rounded decades. */
export const lifeRange = (range: string) => range
  .replace(/^[~～](\d+)세$/, '$1세까지')
  .replace(/^(\d+)세[~～]$/, '$1세부터');

// Matches the five groups described by CrushReport.feel. No ten-god jargon on a shared image.
const RELATION_COPY: Record<string, string> = {
  비견: '말이 통하는 사람', 겁재: '말이 통하는 사람',
  식신: '웃게 하는 사람', 상관: '웃게 하는 사람',
  편재: '마음이 끌리는 사람', 정재: '마음이 끌리는 사람',
  편관: '신경 쓰이는 사람', 정관: '신경 쓰이는 사람',
  편인: '기대고 싶은 사람', 정인: '기대고 싶은 사람',
};
export const relationCopy = (tg: string, feel: string) => RELATION_COPY[tg] ?? feel.split(/[.!?。]/)[0];
