import React, { PropsWithChildren, useEffect, useId, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  cancelAnimation, Easing, SharedValue, useAnimatedProps,
  useAnimatedStyle, useDerivedValue, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { MASCOT_GLOSS } from '../utils/mascotLayout';
import type { MascotPose } from '../utils/resultMascot';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const CLOTHS = [
  require('../../assets/images/mascot-cloth-arc-right.png'),
  require('../../assets/images/mascot-cloth-arc-left.png'),
  require('../../assets/images/mascot-cloth-arc-top.png'),
] as const;
const CLOTH_SIZE = 0.38;
const CYCLE_MS = 4800;
const FINISH_MS = 2600;
// 접촉면 중심의 2차 베지어 곡선: 오른쪽 볼·왼쪽 볼·머리선을 따라 왕복한다.
// 구역 사이에서는 완전히 숨겨서 이동 경로가 보이지 않게 한다.
const SPOTS = [
  { x0: 0.65, y0: 0.85, cx: 0.89, cy: 0.79, x1: 0.91, y1: 0.59 },
  { x0: 0.39, y0: 0.85, cx: 0.19, cy: 0.76, x1: 0.20, y1: 0.58 },
  { x0: 0.35, y0: 0.25, cx: 0.55, cy: 0.06, x1: 0.71, y1: 0.19 },
] as const;
// 원본 마스코트의 비대칭 실루엣 안으로 반사광을 제한한다 (108 × 100).
const SILHOUETTE = 'M65 7C78 2 80 14 77 30C75 42 78 45 89 50C104 56 105 75 93 85C81 97 51 99 31 93C11 87 5 75 11 56C17 34 36 14 65 7Z';

function clamp01(value: number) {
  'worklet';
  return Math.max(0, Math.min(1, value));
}

/** 각 1.6초: 등장 → 둥근 윤곽을 따라 두 번 왕복 → 사라짐 → 다음 구역. */
function polishPose(time: number) {
  'worklet';
  const beat = Math.min(clamp01(time), 0.999999) * SPOTS.length;
  const index = Math.floor(beat);
  const local = beat - index;
  const here = SPOTS[index];
  const fade = Math.min(clamp01((local - 0.04) / 0.12), clamp01((0.9 - local) / 0.14));
  const visibility = fade * fade * (3 - 2 * fade);
  const scrub = clamp01((local - 0.16) / 0.56);
  const envelope = Math.pow(Math.sin(scrub * Math.PI), 2);
  const rub = Math.sin(scrub * Math.PI * 4) * envelope;
  const pressure = envelope * visibility;
  // 코사인 왕복은 양 끝에서 멈췄다가 부드럽게 반대 방향으로 돌아온다.
  // 곡선의 가운데 40%만 사용해, 윤곽을 크게 훑기보다 한 부위를 작게 닦는다.
  const t = 0.3 + (1 - Math.cos(scrub * Math.PI * 4)) / 2 * 0.4;
  const u = 1 - t;
  const x = u * u * here.x0 + 2 * u * t * here.cx + t * t * here.x1;
  const y = u * u * here.y0 + 2 * u * t * here.cy + t * t * here.y1;
  const tangentX = u * (here.cx - here.x0) + t * (here.x1 - here.cx);
  const tangentY = u * (here.cy - here.y0) + t * (here.y1 - here.cy);
  const centerAngle = Math.atan2(here.y1 - here.y0, here.x1 - here.x0);
  const angle = (Math.atan2(tangentY, tangentX) - centerAngle) * 180 / Math.PI;
  return {
    x: x - CLOTH_SIZE / 2,
    y: y - CLOTH_SIZE / 2,
    angle: angle * 0.35,
    frame: index,
    rub, pressure, visibility,
  };
}

function glint(time: number, start: number, end: number) {
  'worklet';
  const t = clamp01((time - start) / (end - start));
  // 빠르게 빛나고, 잔광을 남기며 천천히 사라진다.
  return t < 0.25 ? Math.sin(t * 2 * Math.PI) : Math.pow((1 - t) / 0.75, 2);
}

/** 결과의 점수 상승·분야별 링·풀이 펼침과 겹치도록 세 번의 잔광을 남긴다. */
function revealGlint(progress: number, delay: number) {
  'worklet';
  if (progress <= 0 || progress >= 1) return 0;
  const seconds = progress * FINISH_MS / 1000;
  return Math.max(
    glint(seconds, 0.04 + delay, 0.8 + delay),
    glint(seconds, 0.85 + delay, 1.65 + delay) * 0.75,
    glint(seconds, 1.6 + delay, Math.min(2.58, 2.3 + delay)) * 0.5,
  );
}

/** 기존 이미지와 버튼을 유지하고, 천과 반사광만 별도 레이어로 합성한다. */
export default function MascotPolish({ busy, reduced, size, variant = 'original', sparkleTrigger = 0, onCycleComplete, children }: PropsWithChildren<{
  busy: boolean; reduced: boolean; size: number; variant?: MascotPose | 'original'; sparkleTrigger?: number; onCycleComplete?(): void;
}>) {
  const id = useId().replace(/:/g, '');
  const wasBusy = useRef(false);
  const lastSparkleTrigger = useRef(sparkleTrigger);
  const phase = useSharedValue(0);
  const cloth = useSharedValue(0);
  const finish = useSharedValue(1);

  useEffect(() => {
    let active = true;
    let notified = false;
    const completeCycle = () => {
      if (!active || notified) return;
      notified = true;
      onCycleComplete?.();
    };
    const tapped = sparkleTrigger !== lastSparkleTrigger.current;
    lastSparkleTrigger.current = sparkleTrigger;
    cancelAnimation(phase);
    cancelAnimation(cloth);
    cancelAnimation(finish);
    if (busy && !reduced) {
      phase.value = 0;
      finish.value = 1;
      cloth.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
      phase.value = withRepeat(withTiming(1, { duration: CYCLE_MS, easing: Easing.linear }, finished => {
        if (finished) scheduleOnRN(completeCycle);
      }), -1, false);
    } else {
      cloth.value = withTiming(0, { duration: reduced ? 0 : 280, easing: Easing.out(Easing.cubic) });
      if ((wasBusy.current || tapped) && !busy && !reduced) {
        finish.value = 0;
        // 운세 공개와 터치 모두 같은 반사광·반짝임을 재생한다. 연타는 겹치지 않고 다시 시작한다.
        finish.value = withTiming(1, { duration: FINISH_MS, easing: Easing.linear });
      } else {
        finish.value = 1;
      }
    }
    // 동작 줄이기에서는 생략된 연출 때문에 결과 공개가 막히지 않게 한다.
    if (busy && reduced) completeCycle();
    wasBusy.current = busy;
    return () => { active = false; };
  }, [busy, reduced, sparkleTrigger, onCycleComplete, phase, cloth, finish]);

  useEffect(() => () => {
    cancelAnimation(phase);
    cancelAnimation(cloth);
    cancelAnimation(finish);
  }, [phase, cloth, finish]);

  const pose = useDerivedValue(() => polishPose(phase.value));
  const bodyStyle = useAnimatedStyle(() => {
    const pressure = pose.value.pressure * cloth.value;
    return {
      transform: [
        { translateX: -pose.value.rub * size * 0.008 * cloth.value },
        { rotate: `${-pose.value.rub * 1.5 * cloth.value}deg` },
        { scaleX: 1 + pressure * 0.018 },
        { scaleY: 1 - pressure * 0.022 },
      ],
    };
  });
  const clothStyle = useAnimatedStyle(() => {
    const pressure = pose.value.pressure;
    return {
      opacity: cloth.value * pose.value.visibility,
      transform: [
        { translateX: pose.value.x * size },
        { translateY: pose.value.y * size },
        { rotate: `${pose.value.angle}deg` },
        { scale: 0.94 + pose.value.visibility * 0.06 },
        { scaleX: 1 + pressure * 0.025 },
        { scaleY: 1 - pressure * 0.04 },
      ],
    };
  });
  const shineStyle = useAnimatedStyle(() => {
    const seconds = finish.value * FINISH_MS / 1000;
    return { opacity: Math.max(
      glint(phase.value, 0.64, 1) * cloth.value,
      glint(seconds, 0.03, 0.8),
      glint(seconds, 1.05, 1.95) * 0.55,
    ) };
  });
  const shineProps = useAnimatedProps(() => {
    const seconds = finish.value * FINISH_MS / 1000;
    const sweep = finish.value < 1
      ? seconds < 1 ? clamp01((seconds - 0.03) / 0.77) : clamp01((seconds - 1.05) / 0.9)
      : clamp01((phase.value - 0.64) / 0.36);
    return { x: -45 + sweep * 175 };
  });
  const glossStyle = useAnimatedStyle(() => ({
    opacity: Math.max(glint(phase.value, 0.73, 1) * cloth.value * 0.8, revealGlint(finish.value, 0.1) * 0.9),
  }));
  const auraStyle = useAnimatedStyle(() => {
    const seconds = finish.value * FINISH_MS / 1000;
    return {
      opacity: glint(seconds, 0, 1.35) * 0.6 + glint(seconds, 1.1, 2.55) * 0.22,
      transform: [{ scale: 0.9 + clamp01(seconds / 0.6) * 0.15 }],
    };
  });

  const gloss = MASCOT_GLOSS[variant];

  return (
    <View>
      <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[s.aura, { left: -size * 0.18, top: -size * 0.18, width: size * 1.45, height: size * 1.45 }, auraStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id={`${id}aura`}>
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.65" />
              <Stop offset="0.48" stopColor="#D5F5FF" stopOpacity="0.4" />
              <Stop offset="1" stopColor="#92D8FF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="50" fill={`url(#${id}aura)`} />
        </Svg>
      </Animated.View>
      <Animated.View style={bodyStyle}>
        {children}
        <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Animated.View style={[StyleSheet.absoluteFill, shineStyle]}>
            <Svg width={size * 1305 / 1205} height={size} viewBox="0 0 108 100">
              <Defs>
                <ClipPath id={`${id}clip`}><Path d={SILHOUETTE} /></ClipPath>
                {/* 오른쪽 아래 소품 영역에는 몸통 반사광이 겹치지 않게 한다. */}
                <ClipPath id={`${id}propSafe`}>
                  <Rect width={108} height={64} />
                  <Rect y={64} width={50} height={36} />
                </ClipPath>
                <LinearGradient id={`${id}shine`} x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
                  <Stop offset="0.34" stopColor="#EEFBFF" stopOpacity="0.12" />
                  <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.85" />
                  <Stop offset="0.65" stopColor="#FFFCE5" stopOpacity="0.28" />
                  <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <G clipPath={`url(#${id}clip)`}>
                <G clipPath={`url(#${id}propSafe)`}>
                  <AnimatedRect animatedProps={shineProps} y={-40} width={32} height={180} fill={`url(#${id}shine)`} transform="rotate(24 54 50)" />
                </G>
              </G>
            </Svg>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, glossStyle]}>
            <Svg width={size * 1305 / 1205} height={size} viewBox="0 0 108 100">
              <Path d={gloss.top} fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
              <Path d={gloss.rim} fill="none" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round" />
              <Circle cx={gloss.dot[0]} cy={gloss.dot[1]} r="1.4" fill="#FFFFFF" />
            </Svg>
          </Animated.View>
        </View>
      </Animated.View>
      <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Animated.View style={[s.cloth, { width: size * CLOTH_SIZE, height: size * CLOTH_SIZE }, clothStyle]}>
          {CLOTHS.map((source, index) => (
            <ClothFrame key={index} source={source} index={index} motion={pose} />
          ))}
        </Animated.View>
        <Sparkle phase={phase} cloth={cloth} finish={finish} delay={0} size={size * 0.3} left={size * 0.88} top={size * 0.02} />
        <Sparkle phase={phase} cloth={cloth} finish={finish} delay={0.07} size={size * 0.19} left={-size * 0.06} top={size * 0.77} />
        <Sparkle phase={phase} cloth={cloth} finish={finish} delay={0.13} size={size * 0.12} left={size * 0.12} top={size * 0.28} />
      </View>
    </View>
  );
}

function ClothFrame({ source, index, motion }: {
  source: number; index: number; motion: SharedValue<ReturnType<typeof polishPose>>;
}) {
  const style = useAnimatedStyle(() => ({ opacity: motion.value.frame === index ? 1 : 0 }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Image source={source} contentFit="contain" transition={0} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

function Sparkle({ phase, cloth, finish, delay, size, left, top }: {
  phase: SharedValue<number>; cloth: SharedValue<number>; finish: SharedValue<number>;
  delay: number; size: number; left: number; top: number;
}) {
  const id = useId().replace(/:/g, '');
  const starStyle = useAnimatedStyle(() => {
    const light = Math.max(
      glint(phase.value, 0.7 + delay, 0.96 + delay * 0.2) * cloth.value,
      revealGlint(finish.value, delay * 2),
    );
    return {
      opacity: light,
      transform: [{ scale: 0.55 + light * 0.5 }, { rotate: `${-8 + light * 16}deg` }],
    };
  });
  return (
    <Animated.View style={[s.star, { left, top, width: size, height: size }, starStyle]}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Defs>
          <RadialGradient id={`${id}halo`}>
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
            <Stop offset="0.3" stopColor="#DAF5FF" stopOpacity="0.65" />
            <Stop offset="1" stopColor="#90D7FF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="20" cy="20" r="20" fill={`url(#${id}halo)`} />
        <Path d="M20 3C21.2 15.5 24.5 18.8 37 20C24.5 21.2 21.2 24.5 20 37C18.8 24.5 15.5 21.2 3 20C15.5 18.8 18.8 15.5 20 3Z" fill="#FFFFFF" />
        <Path d="M12 12 16 16M24 24 28 28M28 12 24 16M16 24 12 28" stroke="#F7FEFF" strokeOpacity="0.7" strokeWidth="0.9" strokeLinecap="round" />
        <Circle cx="20" cy="20" r="2.5" fill="#FFFDEB" />
      </Svg>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  aura: { position: 'absolute', opacity: 0 },
  cloth: { position: 'absolute', left: 0, top: 0, opacity: 0, transformOrigin: '50% 50%' },
  star: { position: 'absolute', opacity: 0 },
});
