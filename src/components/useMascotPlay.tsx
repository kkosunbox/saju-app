import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { isDark } from '../theme/colors';
import { haptic } from '../utils/haptic';
import { motion } from '../utils/motion';

const CLOVER_IMAGE = require('../../assets/images/lucky-clover-flat.png');
const CLOVER_SIZE = 36 * 0.7;

/** 누를 때마다 네잎클로버가 위로 떠오르고 후광이 차오르는 행운 연출. 운세 점수와는 별개다. */
export function useMascotPlay(enabled: boolean, reduced: boolean) {
  const [bounce] = useState(() => new Animated.Value(0));
  const [glow] = useState(() => new Animated.Value(0));
  // 하나의 이미지만 재사용해서 연타해도 클로버가 여러 개 겹치지 않는다.
  const [burst] = useState(() => new Animated.Value(1));
  const [position] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));

  useEffect(() => {
    bounce.setValue(0);
    glow.setValue(0);
    burst.setValue(1);
    return () => {
      bounce.stopAnimation();
      glow.stopAnimation();
      burst.stopAnimation();
    };
  }, [enabled, reduced, bounce, glow, burst]);

  const play = () => {
    if (!enabled) return;
    haptic.tap();
    // 진행 중인 밝기에서 조금씩 빛을 더해, 연타하면 후광이 자연스럽게 짙어진다.
    glow.stopAnimation(level => {
      Animated.sequence([
        Animated.timing(glow, {
          toValue: Math.min(level + 0.32, 1), duration: 120,
          useNativeDriver: true, isInteraction: false,
        }),
        Animated.timing(glow, {
          toValue: 0, duration: 2400, easing: motion.easeOut,
          useNativeDriver: true, isInteraction: false,
        }),
      ]).start();
    });
    if (reduced) return;

    // 아래로 살짝 눌렸다가 위로 폴짝
    bounce.stopAnimation();
    bounce.setValue(1);
    Animated.spring(bounce, {
      toValue: 0, speed: 16, bounciness: 9, useNativeDriver: true, isInteraction: false,
    }).start();
    burst.stopAnimation();
    // 136px 터치 영역 바깥의 좌우 여백에 배치해 캐릭터와 겹치지 않게 한다.
    const side = Math.random() < 0.5 ? -44 : 136;
    position.setValue({ x: side + Math.random() * 18, y: 48 + Math.random() * 44 });
    burst.setValue(0);
    Animated.timing(burst, {
      toValue: 1, duration: 1400, easing: motion.easeOut, useNativeDriver: true, isInteraction: false,
    }).start();
  };

  return {
    play,
    style: {
      transform: [
        { translateY: bounce.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, -9, 2] }) },
        { scaleX: bounce.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.96, 1.05] }) },
        { scaleY: bounce.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1.05, 0.95] }) },
      ],
    },
    aura: enabled ? (
      <Animated.View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[
        s.aura,
        {
          opacity: glow,
          transform: [{ scale: reduced ? 1 : glow.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.16] }) }],
        },
      ]}>
        <View style={s.glowOuter} />
        <View style={s.glowMiddle} />
        <View style={s.glowInner} />
      </Animated.View>
    ) : null,
    feedback: enabled && !reduced ? (
      <View pointerEvents="none" style={StyleSheet.absoluteFill} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Animated.Image
          source={CLOVER_IMAGE}
          resizeMode="contain"
          fadeDuration={0}
          style={[s.clover, {
            opacity: burst.interpolate({ inputRange: [0, 0.1, 0.65, 1], outputRange: [0, 1, 0.9, 0] }),
            transform: [
              { translateX: Animated.add(position.x, burst.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 5, -3] })) },
              { translateY: Animated.add(position.y, burst.interpolate({ inputRange: [0, 1], outputRange: [0, -72] })) },
              { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '16deg'] }) },
              { scale: burst.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0.35, 1, 0.75] }) },
            ],
          }]}
        />
      </View>
    ) : null,
  };
}

const s = StyleSheet.create({
  clover: { position: 'absolute', left: 0, top: 0, width: CLOVER_SIZE, height: CLOVER_SIZE },
  aura: { position: 'absolute', left: 1, top: 1, width: 134, height: 134, alignItems: 'center', justifyContent: 'center' },
  glowOuter: { position: 'absolute', width: 134, height: 134, borderRadius: 67, backgroundColor: isDark ? '#71D99312' : '#52B9750D' },
  glowMiddle: { position: 'absolute', width: 114, height: 114, borderRadius: 57, backgroundColor: isDark ? '#71D99321' : '#52B97517' },
  glowInner: { position: 'absolute', width: 94, height: 94, borderRadius: 47, backgroundColor: isDark ? '#71D99336' : '#52B97526' },
});
