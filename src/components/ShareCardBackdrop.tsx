import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const STORY_WIDTH = 311;
export const STORY_HEIGHT = 548;
export const STORY_FRAME = { left: 20, top: 50, width: 271, height: 416, border: 3 };

/** CSS/Figma gradient line, including its projection onto the rectangular card. */
function gradientLine(degrees: number) {
  const radians = degrees * Math.PI / 180;
  const dx = Math.sin(radians), dy = -Math.cos(radians);
  const length = Math.abs(STORY_WIDTH * dx) + Math.abs(STORY_HEIGHT * dy);
  return {
    start: { x: 0.5 - dx * length / (2 * STORY_WIDTH), y: 0.5 - dy * length / (2 * STORY_HEIGHT) },
    end: { x: 0.5 + dx * length / (2 * STORY_WIDTH), y: 0.5 + dy * length / (2 * STORY_HEIGHT) },
  };
}
const BLUE_LINE = gradientLine(151.94542343494598);
const GOLD_LINE = gradientLine(143.7815352311065);

/** Shared Figma artwork: explicit image dimensions prevent intrinsic-size cropping on web. */
export default function ShareCardBackdrop({ gold = false }: { gold?: boolean }) {
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <LinearGradient
      colors={gold ? ['#FFD277', '#FDFCF5', '#FFE399'] : ['#1BADFE', '#C4E3F3', '#8ACAFF']}
      locations={gold ? [0.32838, 0.49728, 0.69056] : [0.28826, 0.50177, 0.74611]}
      {...(gold ? GOLD_LINE : BLUE_LINE)} style={StyleSheet.absoluteFill}
    />
    <View style={s.frame} testID="share-frame">
      <Image source={gold ? require('../../assets/figma/share/gold-base.png') : require('../../assets/figma/share/clouds.png')} style={s.fill} resizeMode="stretch" accessible={false} />
      {gold ? <Image source={require('../../assets/figma/share/gold-paper.png')} style={s.goldPaper} resizeMode="stretch" accessible={false} /> : null}
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
});
