/**
 * Android 위젯이 그릴 값. 앱이 오늘부터 일주일 치 운세를 넣어 두고(services/fortuneWidget.android.ts),
 * 위젯 작업(fortuneWidgetTask.android.tsx)은 그릴 때마다 지금 KST 날짜에 맞는 날을 고른다.
 * 위젯을 30분마다 다시 그리므로 앱을 안 열어도 자정이 지나면 그날 운세(안 뽑음)로 바뀐다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayISO } from '../utils/date';
import type { FortuneWidgetProps } from './fortuneWidgetProps';

const KEY = 'fortune-widget:v1';

export interface FortuneWidgetStore {
  signedOut: boolean;
  /** 앱이 넣어 둔 날들 (오늘부터 일주일) */
  days: FortuneWidgetProps[];
  /** 위젯에서 뽑은 날짜 */
  revealed: string[];
}

export async function readWidgetStore(): Promise<FortuneWidgetStore> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as FortuneWidgetStore;
  } catch {
    // 처음이거나 깨졌으면 비운 상태로
  }
  return { signedOut: false, days: [], revealed: [] };
}

export async function writeWidgetStore(store: FortuneWidgetStore): Promise<void> {
  const today = todayISO();
  // 지난 날의 뽑기 기록은 버린다
  const revealed = store.revealed.filter(d => d >= today);
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...store, revealed }));
}

/** 지금 그릴 값 */
export function currentWidgetProps(store: FortuneWidgetStore): FortuneWidgetProps {
  if (store.signedOut) return { state: 'signedOut' };
  const today = todayISO();
  const day = store.days.find(d => d.date === today);
  if (!day) return { state: store.days.length ? 'stale' : 'signedOut' };
  return { ...day, revealed: !!day.revealed || store.revealed.includes(today) };
}
