import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, Easing } from 'react-native';
import { useIsFocused } from 'expo-router';

/**
 * 끝없이 도는 연출을 지금 돌려도 되는지 — 화면이 앞에 있고 앱이 활성일 때만.
 * 탭 화면은 다른 탭에 가도 살아 있고, 공유 시트·스크린샷·결제 창이 뜨면 앱이 잠깐 비활성이 된다.
 * 그때도 매 프레임 그리면 메인 스레드가 밀려 터치가 늦게 먹고 상태바가 사라진다
 */
export function useScreenLive() {
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => setActive(s === 'active'));
    return () => sub.remove();
  }, []);
  return focused && active;
}

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
