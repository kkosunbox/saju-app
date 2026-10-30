/**
 * 화면 모드 설정(시스템 · 라이트 · 다크). 고른 적이 없으면 라이트.
 * 색은 앱 시작 때 한 번 정해지므로(colors.ts) 저장값을 동기로 읽어야 한다. 바꾸면 안내 시트를 거쳐 앱을 다시 불러온다(MyPageScreen).
 * 웹은 localStorage, 네이티브는 SecureStore의 동기 API를 쓴다.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type ThemePref = 'system' | 'light' | 'dark';
export const THEME_KEY = 'woonpick.theme';

const isThemePref = (v: unknown): v is ThemePref => v === 'system' || v === 'light' || v === 'dark';

export function readThemePrefSync(): ThemePref {
  try {
    const v = Platform.OS === 'web'
      ? (typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_KEY) : null)
      : SecureStore.getItem(THEME_KEY);
    return isThemePref(v) ? v : 'light';
  } catch {
    return 'light';
  }
}

export async function saveThemePref(pref: ThemePref): Promise<void> {
  try {
    if (Platform.OS === 'web') localStorage.setItem(THEME_KEY, pref);
    else await SecureStore.setItemAsync(THEME_KEY, pref);
  } catch {}
}
