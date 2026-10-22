import { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { haptic } from '../utils/haptic';

/** 터치하면 마스코트가 튕기고 운세 공개 때의 반짝임을 다시 재생한다. */
export function useMascotPlay(enabled: boolean, reduced: boolean) {
  const [bounce] = useState(() => new Animated.Value(0));
  const [sparkleTrigger, setSparkleTrigger] = useState(0);

  useEffect(() => {
    bounce.setValue(0);
    return () => bounce.stopAnimation();
  }, [enabled, reduced, bounce]);

  const play = () => {
    if (!enabled) return;
    haptic.tap();
    if (reduced) return;

    setSparkleTrigger(value => value + 1);
    bounce.stopAnimation();
    bounce.setValue(1);
    Animated.spring(bounce, {
      toValue: 0, speed: 16, bounciness: 9, useNativeDriver: true, isInteraction: false,
    }).start();
  };

  return {
    play,
    sparkleTrigger,
    style: {
      transform: [
        { translateY: bounce.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, -9, 2] }) },
        { scaleX: bounce.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.96, 1.05] }) },
        { scaleY: bounce.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1.05, 0.95] }) },
      ],
    },
  };
}
