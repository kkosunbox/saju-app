import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { colors } from '../theme/colors';

/** 브랜드 — 화면 문구와 공유 문구가 모두 여기서 가져간다 (docs/BRAND.md) */
export const BRAND = { name: '운Pick', ko: '운픽', slogan: '오늘의 운, 하나만 Pick!', store: '운Pick - 오늘의 운, 하나만 Pick' };

/**
 * 운Pick 로고는 글꼴이 아니라 직접 그린 단선 레터링이다(획 두께 11 · 둥근 끝 · scripts/render-icons.js 와 같은 패스).
 * 시그니처: '운'의 ㅜ 기둥 자리에 붉은 매듭 끈으로 매달린 노란 부적(위아래 붉은 두 줄 · 도장 · 웃는 눈 · 볼 · 그림자) — 오늘 뽑은(Pick) 행운.
 */
const STROKE = { fill: 'none', strokeWidth: 11, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function Un({ fg }: { fg: string }) {
  return (
    <>
      <Ellipse cx={50} cy={24.5} rx={20} ry={15} stroke={fg} {...STROKE} />
      <Path d="M26 74 V86.5 H83" stroke={fg} {...STROKE} />
      {/* ㅜ 기둥 자리의 부적 — 붉은 매듭 끈 · 접힌 그림자 · 위아래 붉은 두 줄 · 도장 · 웃는 눈. 회전은 좌표로 미리 계산 */}
      <Path d="M50 54 V61.6" stroke={colors.seal} strokeWidth={1.1} strokeLinecap="round" />
      <Circle cx={50} cy={59.6} r={1.45} fill={colors.seal} />
      <Path d="M 42.73 63.82 L 60.6 61.63 L 63.17 82.57 L 45.3 84.76 Z" fill="#22293F" opacity={0.16} />
      <Path d="M 41.37 62.58 L 59.24 60.38 L 61.8 81.23 L 43.93 83.42 Z" fill="#EFCB63" stroke="#EFCB63" strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M 43.23 64.57 L 57.92 62.76 L 57.99 63.36 L 43.3 65.16 Z M 43.37 65.76 L 58.06 63.95 L 58.11 64.3 L 43.42 66.11 Z M 45.13 80.05 L 59.82 78.25 L 59.86 78.59 L 45.17 80.4 Z M 45.24 80.94 L 59.93 79.14 L 60.0 79.74 L 45.31 81.54 Z" fill={colors.seal} opacity={0.85} />
      <Circle cx={51.15} cy={68.33} r={2.6} fill={colors.seal} />
      <Path d="M 47.03 73.37 Q 48.3 71.4 50.01 73.0 M 53.38 72.59 Q 54.65 70.62 56.36 72.22" fill="none" stroke="#22293F" strokeWidth={1.2} strokeLinecap="round" />
      <Path d="M 49.59 75.37 Q 52.27 77.46 54.36 74.79" fill="none" stroke="#22293F" strokeWidth={1.15} strokeLinecap="round" />
      <Circle cx={46.3} cy={75.67} r={1.5} fill="#E07C6A" opacity={0.5} />
      <Circle cx={57.62} cy={74.29} r={1.5} fill="#E07C6A" opacity={0.5} />
      <Path d="M14 52.5 H86" stroke={fg} {...STROKE} />
    </>
  );
}

/** 마크: '운' 레터링 (앱 아이콘과 같음). fg: 획 색 — 밝은 바탕엔 먹남색, 어두운 바탕엔 한지색 */
export function LogoMark({ size = 24, fg = colors.purple }: { size?: number; fg?: string }) {
  return (
    <Svg width={size} height={size} viewBox="2 2 96 96" accessibilityLabel={BRAND.name}>
      <Un fg={fg} />
    </Svg>
  );
}

/** 워드마크: 운Pick 레터링 하나 (첫 화면 · 헤더 · 공유 카드). size = 높이 */
export default function BrandMark({ light = false, size = 22 }: { light?: boolean; size?: number }) {
  const fg = light ? '#F4EDDF' : colors.purple;
  return (
    <Svg width={(size * 281) / 92} height={size} viewBox="-6 2 281 92" accessibilityLabel={BRAND.name}>
      <Un fg={fg} />
      <G x={110}>
        <Path d="M0 86.5 V13 H15 A18.5 18.5 0 0 1 15 50 H0" stroke={fg} {...STROKE} />
        <Path d="M55 44 V86.5" stroke={fg} {...STROKE} />
        <Circle cx={55} cy={22} r={7} fill={fg} />
        <Path d="M110 52 A18.5 18.5 0 1 0 110 80" stroke={fg} {...STROKE} />
        <Path d="M128 13 V86.5 M128 67 L151 44 M135 61 L153 86.5" stroke={fg} {...STROKE} />
      </G>
    </Svg>
  );
}
