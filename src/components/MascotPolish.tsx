import React, { PropsWithChildren, useEffect, useId, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  cancelAnimation, Easing, SharedValue, useAnimatedProps,
  useAnimatedStyle, useDerivedValue, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const TOWELS = [
  { pose: 'lowerRight', source: require('../../assets/images/mascot-cloth-contour-lower-right.png') },
  { pose: 'lowerLeft', source: require('../../assets/images/mascot-cloth-contour-lower-left.png') },
  { pose: 'upperLeft', source: require('../../assets/images/mascot-cloth-contour-upper-left.png') },
] as const;
type ClothPose = typeof TOWELS[number]['pose'];
const CYCLE_MS = 3300;
const FINISH_MS = 2600;
// 사각 천의 좌상단 좌표. 우하단 → 좌하단 → 좌상단에서 각각 한 이미지를 고정한다.
const SPOTS = [
  { x: 0.56, y: 0.53, dx: 0.045, dy: -0.03, pose: 'lowerRight' },
  { x: 0.08, y: 0.54, dx: 0.035, dy: -0.035, pose: 'lowerLeft' },
  // 홈의 103px 마스코트 기준: 기준 위치에서 오른쪽 16px, 위로 4px 이동.
  { x: 0.16 + 16 / 103, y: 0.02 - 4 / 103, dx: 0.045, dy: -0.006, pose: 'upperLeft' },
] as const;
// 원본 마스코트의 비대칭 실루엣 안으로 반사광을 제한한다 (108 × 100).
const SILHOUETTE = 'M65 7C78 2 80 14 77 30C75 42 78 45 89 50C104 56 105 75 93 85C81 97 51 99 31 93C11 87 5 75 11 56C17 34 36 14 65 7Z';

function clamp01(value: number) {
  'worklet';
  return Math.max(0, Math.min(1, value));
}

/** 각 1.1초: 착지 → 같은 자리에서 슥삭 두 번 → 잠깐 쉼 → 다음 구역으로 톡 이동. */
function polishPose(time: number) {
  'worklet';
  const beat = Math.min(clamp01(time), 0.999999) * SPOTS.length;
  const index = Math.floor(beat);
  const local = beat - index;
  const here = SPOTS[index];
  const next = SPOTS[(index + 1) % SPOTS.length];
  const travel = clamp01((local - 0.8) / 0.2);
  const eased = travel * travel * (3 - 2 * travel);
  const hop = Math.sin(travel * Math.PI);
  const scrub = clamp01((local - 0.12) / 0.6);
  const envelope = Math.min(1, scrub * 12, (1 - scrub) * 12);
  const rub = Math.sin(scrub * Math.PI * 4) * envelope;
  const landing = local < 0.12 ? Math.sin(local / 0.12 * Math.PI) : 0;
  const pressure = local >= 0.12 && local <= 0.72 ? 1 : 0;
  return {
    x: here.x + (next.x - here.x) * eased + rub * here.dx,
    y: here.y + (next.y - here.y) * eased - hop * 0.1 + rub * here.dy,
    // 구역별 굴곡은 이미지에 반영되어 있다. 문지를 때만 접촉면을 중심으로 작게 흔든다.
    angle: rub * 3,
    // 공중 이동의 중간에만 교체. 닦는 도중에는 이미지가 바뀌지 않는다.
    frame: travel >= 0.5 ? next.pose : here.pose,
    rub, pressure, landing, hop,
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
export default function MascotPolish({ busy, reduced, size, children }: PropsWithChildren<{
  busy: boolean; reduced: boolean; size: number;
}>) {
  const id = useId().replace(/:/g, '');
  const wasBusy = useRef(false);
  const phase = useSharedValue(0);
  const cloth = useSharedValue(0);
  const finish = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(phase);
    cancelAnimation(cloth);
    cancelAnimation(finish);
    if (busy && !reduced) {
      phase.value = 0;
      finish.value = 1;
      cloth.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
      phase.value = withRepeat(withTiming(1, { duration: CYCLE_MS, easing: Easing.linear }), -1, false);
    } else {
      cloth.value = withTiming(0, { duration: reduced ? 0 : 280, easing: Easing.out(Easing.cubic) });
      if (wasBusy.current && !busy && !reduced) {
        finish.value = 0;
        // busy가 풀리는 렌더에서 홈 점수·풀이도 함께 공개된다.
        finish.value = withTiming(1, { duration: FINISH_MS, easing: Easing.linear });
      } else {
        finish.value = 1;
      }
    }
    wasBusy.current = busy;
  }, [busy, reduced, phase, cloth, finish]);

  useEffect(() => () => {
    cancelAnimation(phase);
    cancelAnimation(cloth);
    cancelAnimation(finish);
  }, [phase, cloth, finish]);

  const pose = useDerivedValue(() => polishPose(phase.value));
  const bodyStyle = useAnimatedStyle(() => {
    const pressure = pose.value.pressure * cloth.value;
    const pop = glint(finish.value * FINISH_MS / 1000, 0.02, 0.45);
    return {
      transform: [
        { translateX: -pose.value.rub * size * 0.008 * cloth.value },
        { rotate: `${-pose.value.rub * 1.5 * cloth.value}deg` },
        { scaleX: 1 + pressure * 0.018 + pop * 0.025 },
        { scaleY: 1 - pressure * 0.022 + pop * 0.025 },
      ],
    };
  });
  const clothStyle = useAnimatedStyle(() => {
    const pressure = pose.value.pressure;
    return {
      opacity: cloth.value * (1 - pose.value.hop * 0.2),
      transform: [
        { translateX: pose.value.x * size + (1 - cloth.value) * size * 0.18 },
        { translateY: pose.value.y * size + (1 - cloth.value) * size * 0.08 },
        { rotate: `${pose.value.angle}deg` },
        { scaleX: 1 + pose.value.landing * 0.035 + pressure * Math.abs(pose.value.rub) * 0.015 },
        { scaleY: 1 - pose.value.landing * 0.025 - pressure * Math.abs(pose.value.rub) * 0.015 + pose.value.hop * 0.025 },
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
                <LinearGradient id={`${id}shine`} x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
                  <Stop offset="0.34" stopColor="#EEFBFF" stopOpacity="0.12" />
                  <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.85" />
                  <Stop offset="0.65" stopColor="#FFFCE5" stopOpacity="0.28" />
                  <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <G clipPath={`url(#${id}clip)`}>
                <AnimatedRect animatedProps={shineProps} y={-40} width={32} height={180} fill={`url(#${id}shine)`} transform="rotate(24 54 50)" />
              </G>
            </Svg>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, glossStyle]}>
            <Svg width={size * 1305 / 1205} height={size} viewBox="0 0 108 100">
              <Path d="M67 12C72 13 72 20 70 27" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
              <Path d="M94 64C97 76 84 86 73 89" fill="none" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round" />
              <Circle cx="66" cy="33" r="1.4" fill="#FFFFFF" />
            </Svg>
          </Animated.View>
        </View>
      </Animated.View>
      <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Animated.View style={[s.cloth, { width: size * 0.42, height: size * 0.42 }, clothStyle]}>
          {TOWELS.map(towel => (
            <ClothFrame key={towel.pose} source={towel.source} pose={towel.pose} motion={pose} />
          ))}
        </Animated.View>
        <Sparkle phase={phase} cloth={cloth} finish={finish} delay={0} size={size * 0.3} left={size * 0.88} top={size * 0.02} />
        <Sparkle phase={phase} cloth={cloth} finish={finish} delay={0.07} size={size * 0.19} left={-size * 0.06} top={size * 0.77} />
        <Sparkle phase={phase} cloth={cloth} finish={finish} delay={0.13} size={size * 0.12} left={size * 0.72} top={size} />
      </View>
    </View>
  );
}

function ClothFrame({ source, pose, motion }: {
  source: number; pose: ClothPose; motion: SharedValue<ReturnType<typeof polishPose>>;
}) {
  const style = useAnimatedStyle(() => ({ opacity: motion.value.frame === pose ? 1 : 0 }));
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
