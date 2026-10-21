import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from '@/navigation/compat';
import { colors } from '../theme/colors';

function apply(color: string) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  // Safari 26부터는 theme-color 대신 페이지 바탕색으로 상단 바를 칠한다
  document.documentElement.style.backgroundColor = color;
}

/** 웹(아이폰 Safari)에서 이 화면이 보이는 동안 상태바·상단 바 색을 화면 상단 색에 맞춘다. 떠나면 기본 바탕색으로 돌린다. */
export function useWebThemeColor(color: string) {
  useFocusEffect(useCallback(() => {
    if (Platform.OS !== 'web') return;
    apply(color);
    return () => apply(colors.cream);
  }, [color]));
}
