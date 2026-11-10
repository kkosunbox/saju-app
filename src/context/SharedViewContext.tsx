/**
 * 공유 링크(/r/{token})로 연 유료 풀이 — 공유한 사람의 화면을 그대로 그리되, 데이터는 서버가 공유 시점에 복사해 둔 것을 쓴다.
 * 이 안에서는 유료 화면 훅(usePremiumContent 등)이 서버를 부르지 않고 이 값을 돌려주고,
 * 결제 · 공유 · 다른 달/목적 고르기처럼 공유한 사람만 쓰는 부분은 숨긴다.
 */
import React, { createContext, useContext } from 'react';
import { SajuFull } from '../types/premium';
import { ReadingView } from '../types/reading';
import { CompatibilityResult, User } from '../types';
import { Pet } from '../types/content';

export interface SharedView {
  /** 열람권 키 (saju, monthly:2026-10 …) */
  contentKey: string;
  data: unknown;
  F: SajuFull | null;
  reading: ReadingView | null;
  owner: User;
  /** 공유한 날 — 화면의 '오늘' */
  sharedOn: string;
  /** 심층 궁합 · 속마음: 그 궁합 기록 (상대 정보 포함) */
  compat: CompatibilityResult | null;
  /** 반려동물 궁합: 그 아이 */
  pet: Pet | null;
}

const Ctx = createContext<SharedView | null>(null);

export function SharedViewProvider({ value, children }: { value: SharedView; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** 공유 링크로 연 화면이면 그 내용, 아니면 null */
export function useSharedView(): SharedView | null {
  return useContext(Ctx);
}

/** 공유된 콘텐츠 키의 인자 (monthly:2026-10 → 2026-10). 공유 화면이 아니면 null */
export function useSharedArg(): string | null {
  const v = useContext(Ctx);
  if (!v) return null;
  const i = v.contentKey.indexOf(':');
  return i < 0 ? '' : v.contentKey.slice(i + 1);
}
