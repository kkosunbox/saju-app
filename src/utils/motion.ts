import { useEffect, useState } from 'react';
import { AccessibilityInfo, Easing } from 'react-native';

/** OS의 '동작 줄이기' 설정을 존중 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}

export const motion = {
  easeOut: Easing.out(Easing.cubic),
  easeInOut: Easing.inOut(Easing.sin),
  fast: 180,
  base: 320,
  slow: 1100,
};
