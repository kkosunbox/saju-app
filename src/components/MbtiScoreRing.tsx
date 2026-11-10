import React, { useId } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { sansW } from '../theme/typography';

/**
 * 찰떡 MBTI 종합 궁합 링 — 피그마 'Union'(78×78): 12시에서 시계 방향으로 약 297°까지 도는 둥근 끝 호,
 * 하늘색 그라데이션. 가운데 점수 32/600 · '종합 궁합' 10/600.
 */
const BASE = 78;
const STROKE = 4.3;
const END = 297; // 끝나는 각도 (12시 = 0°, 시계 방향)

const arc = (size: number) => {
  const r = (size - STROKE) / 2;
  const point = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${(size / 2 + r * Math.cos(a)).toFixed(2)} ${(size / 2 + r * Math.sin(a)).toFixed(2)}`;
  };
  return `M ${point(0)} A ${r} ${r} 0 1 1 ${point(END)}`;
};

/** size: 링 지름 (기본 78 = 피그마). 글자·간격은 같은 비율로 줄고 선 두께는 그대로. color: 가운데 글자색 (밝은 바탕이면 검정) */
export default function MbtiScoreRing({ score, label = '종합 궁합', size = BASE, color = '#FFFFFF', style }: { score: number; label?: string; size?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  const k = size / BASE;
  // 같은 문서에 링이 둘 이상 있을 수 있어(뒤에 깔린 결과 화면 + 공유 카드) 그라데이션 id를 링마다 따로 둔다
  const id = `mbtiRing${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View style={[s.ring, { width: size, height: size, paddingTop: 16 * k }, style]} accessible accessibilityLabel={`${label} ${score}점`}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id} x1={2.62 * k} y1="0" x2={80.31 * k} y2={8.59 * k} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#1BADFE" />
            <Stop offset="0.466" stopColor="#C4E3F3" />
            <Stop offset="1" stopColor="#3BB9FE" />
          </LinearGradient>
        </Defs>
        <Path d={arc(size)} stroke={`url(#${id})`} strokeWidth={STROKE} strokeLinecap="round" fill="none" />
      </Svg>
      <Text style={[s.score, { color,  fontSize: 32 * k, lineHeight: 34 * k, letterSpacing: -1.6 * k }]}>{score}</Text>
      <Text style={[s.label, { color,  fontSize: 10 * k, lineHeight: 12 * k, letterSpacing: -0.5 * k }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  ring: { alignItems: 'center' },
  score: sansW('600'),
  label: sansW('600'),
});
