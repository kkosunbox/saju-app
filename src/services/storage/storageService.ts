/**
 * 기기 설정 저장 (AsyncStorage). 프로필·운세·포인트·기록은 모두 서버에 있고,
 * 여기에는 이 기기에만 해당하는 값(온보딩 완료, 아침 알림 시간, 새 콘텐츠 알림 신청)만 둔다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationSettings { enabled: boolean; hour: number; minute: number }

/** 기기 설정 저장 키 */
export const deviceKey = (k: string) => `onulna:${k}`;

async function getJSON<T>(key: string): Promise<T | null> {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

export const storage = {
  getOnboarded: async () => (await AsyncStorage.getItem(deviceKey('onboarded'))) === '1',
  setOnboarded: (v: boolean) => AsyncStorage.setItem(deviceKey('onboarded'), v ? '1' : '0'),
  getNotificationSettings: async (): Promise<NotificationSettings> =>
    (await getJSON<NotificationSettings>(deviceKey('notification'))) ?? { enabled: true, hour: 8, minute: 0 },
  saveNotificationSettings: (s: NotificationSettings) => AsyncStorage.setItem(deviceKey('notification'), JSON.stringify(s)),
  /** 이 기기에서 마지막으로 로그인한 방법 ('email' · 'kakao' …) — 로그인 화면의 '최근 로그인' 말풍선 */
  getLastLogin: () => AsyncStorage.getItem(deviceKey('lastLogin')).catch(() => null),
  setLastLogin: (method: string) => AsyncStorage.setItem(deviceKey('lastLogin'), method).catch(() => {}),
};
