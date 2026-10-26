import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import ResultMascot from './ResultMascot';
import MascotShadow from './MascotShadow';
import type { MascotPose } from '../utils/resultMascot';
import { useReducedMotion } from '../utils/motion';

/** 기본 무지개 젤리 → 오늘의 포즈들. 홈에서 만나는 모습을 미리 보여준다 */
const CAST: { key: string; pose: MascotPose | null }[] = [
  { key: 'rainbow', pose: null },
  { key: 'crown', pose: 'crown' },
  { key: 'hearts', pose: 'hearts' },
  { key: 'clover', pose: 'clover' },
  { key: 'checklist', pose: 'checklist' },
  { key: 'breeze', pose: 'breeze' },
];
const HOLD = 2000;
const PUSH = 720;
const PUSH_EASING = Easing.bezier(0.65, 0, 0.35, 1);

/**
 * 웹 랜딩 첫 화면의 마스코트 — 다음 젤리가 오른쪽에서 들어오며 지금 젤리를 왼쪽으로 밀어내고,
 * 가운데에 닿으면 젤리처럼 말랑하게 눌렸다 펴진다. 둘은 같은 곡선으로 함께 움직여 맞닿은 채 밀린다.
 * 젤리를 모두 띄워 두고 위치만 바꿔서, 바뀔 때 기본 젤리가 깜빡이지 않는다.
 * 동작 줄이기 설정에서는 밀지 않고 바로 바꾼다.
 */
export default function MascotCarousel({ size }: { size: number }) {
  const reduced = useReducedMotion();
  const [current, setCurrent] = useState(0);
  // 0 = 가운데, -1 = 왼쪽으로 밀려남, 1 = 오른쪽에서 대기
  const [pos] = useState(() => CAST.map((_, i) => new Animated.Value(i === 0 ? 0 : 1)));
  // 도착한 젤리의 말랑함: +면 납작, -면 길쭉
  const [squish] = useState(() => new Animated.Value(0));
  const shift = size * 1.05;

  useEffect(() => {
    const id = setTimeout(() => {
      const next = (current + 1) % CAST.length;
      pos[next].setValue(1);
      const push = (v: Animated.Value, to: number) => Animated.timing(v, { toValue: to, duration: reduced ? 0 : PUSH, easing: PUSH_EASING, useNativeDriver: true });
      setCurrent(next);
      Animated.parallel([push(pos[current], -1), push(pos[next], 0)]).start(({ finished }) => {
        if (!finished || reduced) return;
        Animated.sequence([
          Animated.timing(squish, { toValue: 1, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.spring(squish, { toValue: 0, speed: 14, bounciness: 16, useNativeDriver: true }),
        ]).start();
      });
    }, HOLD);
    return () => clearTimeout(id);
  }, [current, pos, squish, reduced]);

  return (
    <View style={{ width: size * 1.08, height: size, alignSelf: 'center' }} accessible accessibilityRole="image" accessibilityLabel="그날의 기운에 따라 모습이 바뀌는 젤리 마스코트">
      {CAST.map((c, i) => (
        <Animated.View
          key={c.key}
          style={[StyleSheet.absoluteFill, {
            opacity: pos[i].interpolate({ inputRange: [-1, -0.55, 0, 0.55, 1], outputRange: [0, 0.85, 1, 0.85, 0], extrapolate: 'clamp' }),
            transform: [
              { translateX: pos[i].interpolate({ inputRange: [-1, 1], outputRange: [-shift, shift] }) },
              { scale: pos[i].interpolate({ inputRange: [-1, 0, 1], outputRange: [0.7, 1, 0.7], extrapolate: 'clamp' }) },
            ],
          }]}
        >
          {/* 기울어도 그림자는 바닥에 붙어 있고, 눌리면 옆으로 퍼진다 */}
          <MascotShadow size={size} style={{ transform: [{ scaleX: squish.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.92, 1, 1.14] }) }] }} />
          {/* 바닥을 기준으로 기울고, 눌렸다 펴진다. 미는 쪽은 앞으로, 밀리는 쪽은 뒤로 살짝 기운다 */}
          <Animated.View style={[StyleSheet.absoluteFill, {
            transformOrigin: 'bottom',
            transform: [
              { rotate: pos[i].interpolate({ inputRange: [-1, -0.5, 0, 0.5, 1], outputRange: ['-10deg', '-7deg', '0deg', '-7deg', '-10deg'], extrapolate: 'clamp' }) },
              { scaleX: squish.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.94, 1, 1.09] }) },
              { scaleY: squish.interpolate({ inputRange: [-1, 0, 1], outputRange: [1.06, 1, 0.9] }) },
            ],
          }]}>
            <ResultMascot pose={c.pose} size={size} accessible={false} />
          </Animated.View>
        </Animated.View>
      ))}
    </View>
  );
}
