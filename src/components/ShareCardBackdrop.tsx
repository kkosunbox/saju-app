import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

export const STORY_WIDTH = 311;
export const STORY_HEIGHT = 548;
export const STORY_FRAME = { left: 20, top: 50, width: 271, height: 416, border: 3 };

/** CSS/Figma gradient line, including its projection onto the rectangular card. */
export function gradientLine(degrees: number, w = STORY_WIDTH, h = STORY_HEIGHT) {
  const radians = degrees * Math.PI / 180;
  const dx = Math.sin(radians), dy = -Math.cos(radians);
  const length = Math.abs(w * dx) + Math.abs(h * dy);
  return {
    start: { x: 0.5 - dx * length / (2 * w), y: 0.5 - dy * length / (2 * h) },
    end: { x: 0.5 + dx * length / (2 * w), y: 0.5 + dy * length / (2 * h) },
  };
}
export const BLUE_LINE = gradientLine(151.94542343494598);
const GOLD_LINE = gradientLine(143.7815352311065);
/**
 * 전생 카드 — 피그마 내보내기 CSS(배경 227° · 테두리 161°)는 핸들을 잘못 옮겨 색이 다르게 나온다.
 * 피그마 렌더 픽셀로 맞춘 값: 배경은 하늘색 카드와 같은 선(152°, 색 위치 0.288·0.502·0.746),
 * 테두리는 168.45°에 색 위치를 0.06~0.978로 좁힌다. 웹은 각도만 쓰고 길이는 상자 전체로 늘리므로 위치로 옮겼다.
 */
export const NIGHT_LOCATIONS = [0.28826, 0.50177, 0.74611] as const;
export const NIGHT_BORDER_LINE = gradientLine(168.45, STORY_FRAME.width, STORY_FRAME.height);
export const NIGHT_BORDER_LOCATIONS = [0.06, 0.528, 0.712, 0.978] as const;

/** 전생 카드: 남색 그라디언트 위 밤하늘 액자, 테두리는 남색·연노랑 그라디언트 3px */
function NightBackdrop() {
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <LinearGradient colors={['#091228', '#223B77', '#42639F']} locations={NIGHT_LOCATIONS} {...BLUE_LINE} style={StyleSheet.absoluteFill} />
    <View style={s.nightFrame} testID="share-frame">
      <LinearGradient colors={['#222FAB', '#E7EAB8', '#253F92', '#4A48CB']} locations={NIGHT_BORDER_LOCATIONS} {...NIGHT_BORDER_LINE} style={StyleSheet.absoluteFill} />
      <View style={s.nightInner}>
        <Image source={require('../../assets/figma/share/night.webp')} style={s.fill} contentFit="fill" accessible={false} />
      </View>
    </View>
  </View>;
}

/**
 * 오늘의 타로 카드 배경 — #091228 · #1B2D65 · #C8D0F9.
 * 피그마가 내보내는 '227deg 0% · 44% · 95%'는 실제 그림과 달라서, 피그마 배경 PNG의 픽셀에서 축을 역산했다:
 * 약 152°, 카드 전체 대각선 기준 색 위치 0.284 · 0.498 · 0.746 — 하늘색 카드와 같은 축이라 BLUE_LINE·위치를 그대로 쓴다.
 */
function TarotBackdrop() {
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <LinearGradient colors={['#091228', '#1B2D65', '#C8D0F9']} locations={[0.28826, 0.50177, 0.74611]} {...BLUE_LINE} style={StyleSheet.absoluteFill} />
    {/* 밤하늘 액자 — 피그마에서 그라디언트 테두리(3)까지 함께 내보낸 271×416 그림 */}
    <Image source={require('../../assets/figma/share/tarot-night.webp')} style={s.tarotFrame} contentFit="fill" accessible={false} testID="share-frame" />
  </View>;
}

/** Shared Figma artwork: explicit image dimensions prevent intrinsic-size cropping on web. */
export default function ShareCardBackdrop({ gold = false, night = false, tarot = false }: { gold?: boolean; night?: boolean; tarot?: boolean }) {
  if (tarot) return <TarotBackdrop />;
  if (night) return <NightBackdrop />;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <LinearGradient
      colors={gold ? ['#FFD277', '#FDFCF5', '#FFE399'] : ['#1BADFE', '#C4E3F3', '#8ACAFF']}
      locations={gold ? [0.32838, 0.49728, 0.69056] : [0.28826, 0.50177, 0.74611]}
      {...(gold ? GOLD_LINE : BLUE_LINE)} style={StyleSheet.absoluteFill}
    />
    <View style={s.frame} testID="share-frame">
      <Image source={gold ? require('../../assets/figma/share/gold-base.webp') : require('../../assets/figma/share/clouds.webp')} style={s.fill} contentFit="fill" accessible={false} />
      {gold ? <Image source={require('../../assets/figma/share/gold-paper.webp')} style={s.goldPaper} contentFit="fill" accessible={false} /> : null}
    </View>
    <View style={[s.border, gold && s.goldBorder]} />
  </View>;
}

const s = StyleSheet.create({
  frame: { position: 'absolute', left: STORY_FRAME.left + 3, top: STORY_FRAME.top + 3, width: STORY_FRAME.width - 6, height: STORY_FRAME.height - 6, borderRadius: 29, overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  goldPaper: { position: 'absolute', left: '-4.38%', top: '-8.22%', width: '107.29%', height: '108.22%' },
  border: { position: 'absolute', left: STORY_FRAME.left, top: STORY_FRAME.top, width: STORY_FRAME.width, height: STORY_FRAME.height, borderWidth: 3, borderColor: '#7FD1FF', borderRadius: 32 },
  goldBorder: { borderColor: '#FFFFFF' },
  tarotFrame: { position: 'absolute', left: STORY_FRAME.left, top: STORY_FRAME.top, width: STORY_FRAME.width, height: STORY_FRAME.height },
  nightFrame: { position: 'absolute', left: STORY_FRAME.left, top: STORY_FRAME.top, width: STORY_FRAME.width, height: STORY_FRAME.height, borderRadius: 32, overflow: 'hidden' },
  nightInner: { position: 'absolute', left: 3, top: 3, right: 3, bottom: 3, borderRadius: 29, overflow: 'hidden' },
});
