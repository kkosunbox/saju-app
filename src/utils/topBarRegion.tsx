/**
 * 상단 바를 둘 자리 (위 · 왼쪽 · 오른쪽 여백). 화면 모서리에 놓인 상태 표시(iPhone Duo의 시간 · 와이파이 묶음)를 피한다.
 *
 * 일반 안전 영역(useSafeAreaInsets)은 모서리의 상태 표시를 위쪽 띠 전체로 잡아서
 * - 펼친 세로 모드: 상단 바가 상태 표시 높이만큼 통째로 내려가 위쪽 띠가 비고
 * - 접었을 때: 위 여백이 0이라 로고가 화면 테두리에 붙고, 오른쪽 세로 막대를 모르는 상단 바 오른쪽 버튼이 시간 표시와 겹친다.
 * iOS 27.1의 바 레이아웃 영역은 '높이 56의 바를 위쪽에 둘 때' 쓸 수 있는 자리를 알려 주므로,
 * 상단 바는 상태 표시 옆까지 올라가고 그 모서리 쪽만 비켜 선다 (modules/top-bar-region).
 *
 * 값은 화면을 덮는 보이지 않는 네이티브 뷰(TopBarProbe)가 자기 영역을 읽어 보낸다. 그 뷰가 없는 곳
 * (안드로이드 · 웹 · 모듈을 넣기 전 iOS 빌드에 OTA로 온 경우)과 iOS 27.1 전에는 일반 안전 영역과 같다.
 */
import React, { useSyncExternalStore } from 'react';
import { Platform, StyleSheet, type ViewProps } from 'react-native';
import { requireNativeView, requireOptionalNativeModule } from 'expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { webSafeTop } from './webThemeColor';

export interface TopBarInsets {
  top: number;
  left: number;
  right: number;
}

/** 상단 바 높이. 홈 상단 바와 공용 Screen 상단 바가 같은 높이다 */
export const TOP_BAR_H = 56;

type RegionEvent = { nativeEvent: TopBarInsets };

const NativeProbe: React.ComponentType<ViewProps & { barHeight: number; onRegionChange: (e: RegionEvent) => void }> | null =
  Platform.OS === 'ios' && requireOptionalNativeModule('TopBarRegion') ? requireNativeView('TopBarRegion') : null;

let current: TopBarInsets | null = null;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const snapshot = () => current;

function onRegionChange({ nativeEvent: { top, left, right } }: RegionEvent) {
  if (current && current.top === top && current.left === left && current.right === right) return;
  current = { top, left, right };
  listeners.forEach(listener => listener());
}

/** 화면을 덮는 맨 바깥 뷰 안에 하나 둔다. 아무것도 그리지 않고 누름도 받지 않는다 */
export function TopBarProbe() {
  if (!NativeProbe) return null;
  return <NativeProbe pointerEvents="none" style={StyleSheet.absoluteFill} barHeight={TOP_BAR_H} onRegionChange={onRegionChange} />;
}

/**
 * 상단 바의 위 · 왼쪽 · 오른쪽 여백. 상단 바 아래 본문은 이 값과 상관없이 바 아래에 놓인다.
 * 아이폰 Safari 탭에서는 안전 영역 위가 0이라, 상단 바 색을 칠하는 띠(webThemeColor)가 로고 말풍선 윗부분을 덮지 않게 띠 높이만큼은 띄운다
 */
export function useTopBarInsets(): TopBarInsets {
  const safe = useSafeAreaInsets();
  const region = useSyncExternalStore(subscribe, snapshot, snapshot);
  return region ?? { top: webSafeTop(safe.top), left: safe.left, right: safe.right };
}
