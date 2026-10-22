import React, { useEffect, useId, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { isDark } from '../theme/colors';
import { haptic } from '../utils/haptic';
import { motion } from '../utils/motion';

const CLOVER_IMAGE = require('../../assets/images/lucky-clover-flat.png');
const CLOVER_SIZE = 36 * 0.7;

/** 누를 때마다 네잎클로버가 위로 떠오르고 은은한 후광이 퍼지는 행운 연출. 운세 점수와는 별개다. */
export function useMascotPlay(enabled: boolean, reduced: boolean) {
  const glowId = `mascotGlow${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const glowColor = isDark ? '#71D993' : '#52B975';
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
    // 연타해도 첫 터치와 같은 은은한 밝기를 유지하고 사라지는 시간만 갱신한다.
    glow.stopAnimation(() => {
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 0.32, duration: 120,
          useNativeDriver: true, isInteraction: false,
        }),
        Animated.delay(220),
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
        <Svg width={188} height={188} viewBox="0 0 188 188">
          <Defs>
            <RadialGradient id={glowId} cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={glowColor} stopOpacity={isDark ? 0.65 : 0.6} />
              <Stop offset="35%" stopColor={glowColor} stopOpacity={isDark ? 0.55 : 0.5} />
              <Stop offset="65%" stopColor={glowColor} stopOpacity={0.3} />
              <Stop offset="85%" stopColor={glowColor} stopOpacity={0.08} />
              <Stop offset="100%" stopColor={glowColor} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={94} cy={94} r={94} fill={`url(#${glowId})`} />
        </Svg>
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
  aura: { position: 'absolute', left: -26, top: -26, width: 188, height: 188, alignItems: 'center', justifyContent: 'center' },
});
