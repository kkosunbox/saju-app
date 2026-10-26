import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { ART } from './Mascot';
import { getMascotFrame } from '../utils/mascotLayout';
import { motion } from '../utils/motion';
import { getResultMascot, MASCOT_LABELS, type MascotPose, type MascotScores } from '../utils/resultMascot';

export const POSES: Record<MascotPose, number> = {
  crown: require('../../assets/images/mascots/crown.webp'),
  hearts: require('../../assets/images/mascots/hearts.webp'),
  clover: require('../../assets/images/mascots/clover.webp'),
  checklist: require('../../assets/images/mascots/checklist.webp'),
  breeze: require('../../assets/images/mascots/breeze.webp'),
  question: require('../../assets/images/mascots/question.webp'),
  rain: require('../../assets/images/mascots/rain.webp'),
  sleepy: require('../../assets/images/mascots/sleepy.webp'),
};

/**
 * 기본 무지개 젤리 → 점수에 맞는 포즈 그림 한 장으로 바뀐다. pose를 주면 점수 대신 그 포즈를 쓴다.
 * dozing이면 그 위로 조는 모습이 겹쳐졌다가, 풀리면 원래 포즈로 돌아온다.
 */
export default function ResultMascot({ scores, pose: poseOverride, dozing = false, size, accessible = true, revealed = true, animateReveal = false }: {
  scores?: MascotScores; pose?: MascotPose | null; dozing?: boolean; size: number; accessible?: boolean; revealed?: boolean; animateReveal?: boolean;
}) {
  const pose = poseOverride !== undefined ? poseOverride : getResultMascot(scores).pose;
  const label = pose ? MASCOT_LABELS[pose] : '무지개 젤리';
  const variant = pose ?? 'original';
  const [displayedVariant, setDisplayedVariant] = useState<string | null>(null);
  const [reveal] = useState(() => new Animated.Value(0));
  const [doze] = useState(() => new Animated.Value(0));
  const ready = displayedVariant === variant;
  const originalFrame = getMascotFrame('original', size);

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

  const dozingNow = dozing && revealed;
  useEffect(() => {
    const animation = Animated.timing(doze, { toValue: dozingNow ? 1 : 0, duration: animateReveal ? 360 : 0, easing: motion.easeInOut, useNativeDriver: true, isInteraction: false });
    animation.start();
    return () => animation.stop();
  }, [dozingNow, animateReveal, doze]);

  return (
    <View style={{ width: size * 1.08, height: size }} accessible={accessible} accessibilityRole={accessible ? 'image' : undefined} accessibilityLabel={revealed ? label : '무지개 젤리'} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: reveal.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
        <Image source={ART.mascot} style={[s.artwork, originalFrame]} contentFit="contain" loading="eager" />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: ready ? Animated.multiply(reveal, doze.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })) : 0 }]}>
        <Image source={pose ? POSES[pose] : ART.mascot} style={[s.artwork, getMascotFrame(variant, size)]} contentFit="contain" loading="eager" onDisplay={() => setDisplayedVariant(variant)} />
      </Animated.View>
      {revealed ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: doze }]}>
          <Image source={POSES.sleepy} style={[s.artwork, getMascotFrame('sleepy', size)]} contentFit="contain" loading="eager" />
        </Animated.View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({ artwork: { position: 'absolute' } });
