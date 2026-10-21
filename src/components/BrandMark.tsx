import React from 'react';
import Mascot, { Logo } from './Mascot';
import { colors } from '../theme/colors';

/** 브랜드 — 화면 문구와 공유 문구가 모두 여기서 가져간다 (docs/BRAND.md) */
export const BRAND = { name: '운Pick', ko: '운픽', slogan: '오늘의 운, 하나만 Pick!', store: '운Pick - 오늘의 운, 하나만 Pick' };

/**
 * 마크: 마스코트 얼굴 하나 (로딩 · 작은 자리).
 * fg 는 예전 단선 레터링 마크의 획 색이었다 — 마스코트는 색이 정해져 있어 쓰지 않는다.
 */
export function LogoMark({ size = 24 }: { size?: number; fg?: string }) {
  return <Mascot size={size} />;
}

/** 워드마크: 마스코트 얼굴 + '운픽' 레터링 (첫 화면 · 헤더 · 공유 카드). size = 예전 워드마크 높이 기준 */
export default function BrandMark({ light = false, size = 22 }: { light?: boolean; size?: number }) {
  return <Logo height={Math.round(size * 1.5)} color={light ? colors.white : colors.ink} />;
}
