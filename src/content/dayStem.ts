import type { User } from '../types';
import { STEMS } from '../data/sajuData';

const ELEMENT_KO = { wood: '목', fire: '화', earth: '토', metal: '금', water: '수' } as const;

/** 콘텐츠 이름 (무료 카드 큰 제목 · 화면 제목) */
export const DAY_STEM_TITLE = 'MBTI × 일간';

/** 일간 + 오행 + 성별 (예: 무토남). 원국이 아직 없으면 null */
export function dayStemLabel(u: Pick<User, 'gender' | 'natal'> | null | undefined): string | null {
  const stem = u?.natal?.chart.day.stem;
  if (stem == null) return null;
  const s = STEMS[stem];
  return `${s.ko}${ELEMENT_KO[s.element]}${u!.gender === 'male' ? '남' : '녀'}`;
}

/** 무료 카드 작은 제목 (예: ISTP 무토남 특징). MBTI를 사주로 추정했으면 무토남 특징 */
export function dayStemCaption(u: Pick<User, 'gender' | 'natal' | 'mbti' | 'mbtiUnknown'> | null | undefined, label = dayStemLabel(u)): string {
  if (!label) return '나의 일간 특징';
  return u && !u.mbtiUnknown ? `${u.mbti} ${label} 특징` : `${label} 특징`;
}
