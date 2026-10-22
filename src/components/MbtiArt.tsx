import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { MBTI } from '../types';

/**
 * MBTI별 마스코트 캐릭터 그림 (16장). 원본은 Figma '사주앱' 파일의 MBTI 캐릭터 시트,
 * 384px webp로 줄여 넣었다(16장 304KB). INTP만 세로가 조금 짧다(384×371).
 */
const ART: Record<MBTI, number> = {
  ISTJ: require('../../assets/images/mbti/istj.webp'),
  ISFJ: require('../../assets/images/mbti/isfj.webp'),
  INFJ: require('../../assets/images/mbti/infj.webp'),
  INTJ: require('../../assets/images/mbti/intj.webp'),
  ISTP: require('../../assets/images/mbti/istp.webp'),
  ISFP: require('../../assets/images/mbti/isfp.webp'),
  INFP: require('../../assets/images/mbti/infp.webp'),
  INTP: require('../../assets/images/mbti/intp.webp'),
  ESTP: require('../../assets/images/mbti/estp.webp'),
  ESFP: require('../../assets/images/mbti/esfp.webp'),
  ENFP: require('../../assets/images/mbti/enfp.webp'),
  ENTP: require('../../assets/images/mbti/entp.webp'),
  ESTJ: require('../../assets/images/mbti/estj.webp'),
  ESFJ: require('../../assets/images/mbti/esfj.webp'),
  ENFJ: require('../../assets/images/mbti/enfj.webp'),
  ENTJ: require('../../assets/images/mbti/entj.webp'),
};

/** MBTI 캐릭터 그림. 모르는 유형이면 아무것도 그리지 않는다 */
export default function MbtiArt({ type, size, style }: { type: string; size: number; style?: StyleProp<ImageStyle> }) {
  const src = ART[type as MBTI];
  if (!src) return null;
  return <Image source={src} style={[{ width: size, height: size }, style]} resizeMode="contain" accessibilityIgnoresInvertColors />;
}
