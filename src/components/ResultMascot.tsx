import React, { useEffect, useId, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { ClipPath, Defs, Ellipse, G, Image as SvgImage, Path } from 'react-native-svg';
import { ART } from './Mascot';
import MascotAccessory from './MascotAccessory';
import { getMascotFrame } from '../utils/mascotLayout';
import { motion } from '../utils/motion';
import type { Element } from '../types/content';
import { getResultMascot, type MascotMood, type MascotScores } from '../utils/resultMascot';

const BODIES: Record<Element, number> = {
  wood: require('../../assets/images/mascots/wood.webp'),
  fire: require('../../assets/images/mascots/fire.webp'),
  earth: require('../../assets/images/mascots/earth.webp'),
  metal: require('../../assets/images/mascots/metal.webp'),
  water: require('../../assets/images/mascots/water.webp'),
};

/** 원본 PNG의 눈 영역만 재사용해 흰자·동공·시선까지 같은 모습으로 맞춘다. */
function OriginalEyes() {
  const clipId = `mascotEyes${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <>
      <Defs>
        <ClipPath id={clipId}>
          <Ellipse cx={136.8} cy={176} rx={29.3} ry={31.8} transform="rotate(28 136.8 176)" />
          <Ellipse cx={198.2} cy={156.9} rx={30.8} ry={33} transform="rotate(25 198.2 156.9)" />
        </ClipPath>
      </Defs>
      <SvgImage href={ART.mascot} width={360} height={332} clipPath={`url(#${clipId})`} />
    </>
  );
}

function Face({ mood }: { mood: MascotMood }) {
  return (
    <G>
      <Ellipse cx={33} cy={61} rx={4} ry={2.1} fill="#F39B9D" opacity={0.4} />
      <Ellipse cx={67} cy={58} rx={4} ry={2.1} fill="#F39B9D" opacity={0.4} />
      <Path d={mood === 'bright' ? 'M47 64 Q52 72 57 63 Q52 65 47 64Z' : 'M48 65 Q52 68 56 64'} fill={mood === 'bright' ? '#985C68' : 'none'} stroke="#985C68" strokeWidth={1.2} strokeLinecap="round" />
    </G>
  );
}

/** 공통 얼굴·소품을 겹쳐 본체 이미지 5장으로 오늘의 모습을 조합한다. */
export default function ResultMascot({ dayStem, scores, size, accessible = true, revealed = true, animateReveal = false }: {
  dayStem?: number; scores?: MascotScores; size: number; accessible?: boolean; revealed?: boolean; animateReveal?: boolean;
}) {
  const state = getResultMascot(dayStem, scores);
  const variant = state.element ?? 'original';
  const [displayedVariant, setDisplayedVariant] = useState<string | null>(null);
  const [reveal] = useState(() => new Animated.Value(0));
  const ready = displayedVariant === variant;
  const originalFrame = getMascotFrame('original', size);
  const resultFrame = getMascotFrame(variant, size);

  useEffect(() => {
    // 공개 전부터 결과 이미지를 준비하고, 실제 표시가 끝날 때까지 원래 모습을 유지한다.
    const animation = Animated.timing(reveal, {
      toValue: revealed && ready ? 1 : 0,
      duration: revealed && ready && animateReveal ? 480 : 0,
      easing: motion.easeInOut,
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [revealed, ready, animateReveal, reveal]);

  return (
    <View style={{ width: size * 1.08, height: size }} accessible={accessible} accessibilityRole={accessible ? 'image' : undefined} accessibilityLabel={revealed ? state.label : '무지개 젤리'} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: reveal.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
        <Image source={ART.mascot} style={[s.artwork, originalFrame]} contentFit="contain" loading="eager" />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: ready ? reveal : 0 }]}>
        <View style={[s.artwork, resultFrame]}>
          <Image source={state.element ? BODIES[state.element] : ART.mascot} style={StyleSheet.absoluteFill} contentFit="contain" loading="eager" onDisplay={() => setDisplayedVariant(variant)} />
          {state.element ? <Svg width="100%" height="100%" viewBox="0 0 100 100" style={StyleSheet.absoluteFill}><Face mood={state.mood} /></Svg> : null}
        </View>
        {state.element ? <Svg width={originalFrame.width} height={originalFrame.height} viewBox="0 0 360 332" style={[s.artwork, originalFrame]}><OriginalEyes /></Svg> : null}
        {state.accessory ? <Svg width="100%" height="100%" viewBox="0 0 108 100" style={StyleSheet.absoluteFill}><MascotAccessory kind={state.accessory} /></Svg> : null}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({ artwork: { position: 'absolute' } });
