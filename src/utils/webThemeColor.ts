import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from '@/navigation/compat';
import { colors } from '../theme/colors';

const TOP_TINT_ID = 'top-bar-tint';
// Safari는 가장자리 몇 px 안쪽에서 맨 위에 보이는 고정 요소를 찾고, 10px 이하로 얇으면 건너뛴다
const TOP_TINT_H = 12;
// 아이패드 Safari는 데스크톱(Mac)처럼 자신을 밝히므로 터치 지원으로 가린다
const IS_IOS = Platform.OS === 'web' && typeof navigator !== 'undefined'
  && (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

/** 내용 맨 위 기준 [위치, 색]. 위치 순서대로, 마지막 색이 그 아래로 이어진다 */
export type TopBarStops = readonly (readonly [number, string])[];

const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

/** 내용 위치 y에 그려진 그라디언트 색 */
function colorAt(y: number, stops: TopBarStops): string {
  for (let i = 1; i < stops.length; i++) {
    const [a, ca] = stops[i - 1];
    const [b, cb] = stops[i];
    if (y > b) continue;
    if (y <= a || b === a) return ca;
    const t = (y - a) / (b - a);
    const [from, to] = [rgb(ca), rgb(cb)];
    return `rgb(${from.map((v, k) => Math.round(v + (to[k] - v) * t)).join(',')})`;
  }
  return stops[stops.length - 1][1];
}

function setTint(color: string | null) {
  // Safari 26부터는 theme-color를 무시하고 페이지 바탕색으로 상단·하단 바를 함께 칠한다.
  // 바탕은 기본색으로 두고, 화면 위 가장자리에 붙은 고정 요소가 있으면 그 색으로 상단 바를 칠하는 점을 이용한다
  // (viewport 메타에 viewport-fit=cover 가 있어야 한다, +html.tsx)
  document.documentElement.style.backgroundColor = colors.cream;
  let tint = document.getElementById(TOP_TINT_ID);
  // 띠는 iOS Safari에서만 상단 바 밑에 가려진다. PC·안드로이드에서는 화면 맨 위에 줄로 보이므로 theme-color만 바꾼다
  if (!color || !IS_IOS) {
    tint?.remove();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color ?? colors.cream);
    return;
  }
  if (!tint) {
    tint = document.createElement('div');
    tint.id = TOP_TINT_ID;
    tint.setAttribute('aria-hidden', 'true');
    tint.style.cssText = `position:fixed;top:0;left:0;right:0;height:${TOP_TINT_H}px;z-index:2147483647`;
    document.body.appendChild(tint);
  }
  tint.style.backgroundColor = color;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
}

/**
 * 웹(아이폰 Safari)에서 이 화면이 보이는 동안 상단 바 색을 바로 아래 보이는 내용 색에 맞춘다. 떠나면 기본으로 돌린다.
 * Safari 상단 바는 단색이라 그라디언트가 그 아래로 지나가면 경계가 생기고, 띠를 없애면 바가 따로 흰 띠로 그려진다.
 * 그래서 띠는 화면이 보이는 내내 두고, 스크롤할 때마다 띠 바로 아래 내용 색으로 바꾼다. 돌려준 함수를 onScroll에서 부른다.
 */
export function useWebTopBar(stops: TopBarStops) {
  const y = useRef(0);
  const focused = useRef(false);
  const stopsRef = useRef(stops);
  const update = useCallback(() => {
    if (focused.current) setTint(colorAt(y.current + TOP_TINT_H, stopsRef.current));
  }, []);
  useFocusEffect(useCallback(() => {
    if (Platform.OS !== 'web') return;
    focused.current = true;
    update();
    return () => { focused.current = false; setTint(null); };
  }, [update]));
  // 높이를 재고 나서 그라디언트 위치가 바뀌면 다시 맞춘다
  useEffect(() => {
    stopsRef.current = stops;
    update();
  });
  return useCallback((scrollY: number) => {
    y.current = scrollY;
    if (Platform.OS === 'web') update();
  }, [update]);
}
