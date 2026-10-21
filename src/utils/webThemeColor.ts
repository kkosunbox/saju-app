import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from '@/navigation/compat';
import { colors } from '../theme/colors';

const TOP_TINT_ID = 'top-bar-tint';

function apply(color: string) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  // Safari 26부터는 theme-color를 무시하고 페이지 바탕색으로 상단·하단 바를 함께 칠한다.
  // 바탕은 기본색으로 두고, 화면 위 가장자리에 붙은 고정 요소의 색을 쓰는 점을 이용해 상단 바만 칠한다
  document.documentElement.style.backgroundColor = colors.cream;
  let tint = document.getElementById(TOP_TINT_ID);
  if (color === colors.cream) {
    tint?.remove();
    return;
  }
  if (!tint) {
    tint = document.createElement('div');
    tint.id = TOP_TINT_ID;
    tint.setAttribute('aria-hidden', 'true');
    // Safari는 가장자리 몇 px 안쪽에서 맨 위에 보이는 고정 요소를 찾고, 10px 이하로 얇으면 건너뛴다고 한다.
    // viewport 메타에 viewport-fit=cover 가 있어야 고정 요소 색을 쓴다 (+html.tsx).
    // 그래서 내용 위에 12px로 깐다 — 같은 색 화면 위에서만 깔아 둘 것
    tint.style.cssText = 'position:fixed;top:0;left:0;right:0;height:12px;z-index:2147483647';
    document.body.appendChild(tint);
  }
  tint.style.backgroundColor = color;
}

/**
 * 웹(아이폰 Safari)에서 이 화면이 보이는 동안 상단 바 색을 화면 상단 색에 맞춘다. 떠나면 기본 바탕색으로 돌린다.
 * 화면 맨 위에 그 색 띠가 실제로 보이므로, 화면 상단이 그 색일 때만 넘기고 아니면 colors.cream 을 넘긴다.
 */
export function useWebThemeColor(color: string) {
  useFocusEffect(useCallback(() => {
    if (Platform.OS !== 'web') return;
    apply(color);
    return () => apply(colors.cream);
  }, [color]));
}
