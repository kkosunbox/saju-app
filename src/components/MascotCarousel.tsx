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
/** 한 모습이 머무는 시간 — 아래 리뷰 슬라이드보다 느긋하게 */
const HOLD = 2600;
const FADE = 700;
const FADE_EASING = Easing.bezier(0.4, 0, 0.2, 1);

/**
 * 웹 랜딩 첫 화면의 마스코트 — 제자리에서 지금 모습이 옅어지며 다음 모습이 겹쳐 떠오른다.
 * 바로 아래 리뷰 카드가 옆으로 넘어가므로, 마스코트는 옆으로 움직이지 않아 두 움직임이 겹쳐 보이지 않는다.
 * 그림자는 하나만 깔아 두어 바뀌는 동안에도 바닥이 그대로다. 젤리를 모두 띄워 두고 투명도만 바꿔서 깜빡이지 않는다.
 * 동작 줄이기 설정에서는 바로 바꾼다.
 */
export default function MascotCarousel({ size }: { size: number }) {
  const reduced = useReducedMotion();
  const [current, setCurrent] = useState(0);
  // 0 = 안 보임, 1 = 보임
  const [shown] = useState(() => CAST.map((_, i) => new Animated.Value(i === 0 ? 1 : 0)));

  useEffect(() => {
    const id = setTimeout(() => {
      const next = (current + 1) % CAST.length;
      const fade = (v: Animated.Value, to: number) => Animated.timing(v, { toValue: to, duration: reduced ? 0 : FADE, easing: FADE_EASING, useNativeDriver: true });
      setCurrent(next);
      Animated.parallel([fade(shown[current], 0), fade(shown[next], 1)]).start();
    }, HOLD);
    return () => clearTimeout(id);
  }, [current, shown, reduced]);

  return (
    <View style={{ width: size * 1.08, height: size, alignSelf: 'center' }} accessible accessibilityRole="image" accessibilityLabel="그날의 기운에 따라 모습이 바뀌는 젤리 마스코트">
      <MascotShadow size={size} />
      {CAST.map((c, i) => (
        <Animated.View
          key={c.key}
          style={[StyleSheet.absoluteFill, {
            opacity: shown[i],
            // 떠오를 때 살짝 커지며 자리 잡는다 — 바닥 기준이라 발이 들리지 않는다
            transformOrigin: 'bottom',
            transform: [{ scale: shown[i].interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
          }]}
        >
          <ResultMascot pose={c.pose} size={size} accessible={false} />
        </Animated.View>
      ))}
    </View>
  );
}
