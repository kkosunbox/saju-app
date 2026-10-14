import { useCallback, useEffect, useState } from 'react';
import { router, useNavigation } from 'expo-router';

/**
 * 하단 탭 화면의 뒤로 가기.
 * 탭은 backBehavior="history" 라서 뒤로 가면 직전에 보던 탭으로 간다. 돌아갈 곳이 없으면 홈으로.
 */
export function useTabBack() {
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.navigate('/');
  }, []);
}

/** 홈 탭에서 돌아갈 이전 탭이 있는지 (탭 이동 기록 기준) */
export function useHasTabHistory() {
  const navigation = useNavigation();
  const [hasHistory, setHasHistory] = useState(false);
  useEffect(
    () =>
      navigation.addListener('state', (e: { data: { state?: { history?: unknown[] } } }) => {
        setHasHistory((e.data.state?.history?.length ?? 0) > 1);
      }),
    [navigation],
  );
  return hasHistory;
}
