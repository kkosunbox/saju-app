/**
 * 기기 설정 저장 (AsyncStorage). 프로필·운세·포인트·기록은 모두 서버에 있고,
 * 여기에는 이 기기에만 해당하는 값(온보딩 완료, 아침 알림 시간, 새 콘텐츠 알림 신청)만 둔다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 이 기기의 알림 설정. fortune·minute: 오늘의 운세 알림 (minute은 자정부터 분, KST 30분 단위).
 * marketing: 이벤트·혜택 알림 동의 — 계정 단위라 서버 값이 기준이고 여기는 마지막으로 본 값.
 */
export interface NotificationSettings { fortune: boolean; minute: number; marketing: boolean }
/** 예전 앱이 저장한 모양 (아침 운세 알림 하나, 7·8·9시) */
interface LegacyNotificationSettings { enabled: boolean; hour: number; minute?: number }
/** 알림 권유 시트를 띄운 기록. decided: 마이 메뉴에서 운세 알림을 직접 켜거나 껐다 — 다시 권하지 않는다 */
export interface NotificationPromptRecord { count: number; lastAt: number; decided?: boolean }

export const DEFAULT_FORTUNE_MINUTE = 8 * 60;

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
  /** 처음엔 모두 꺼져 있다. 예전 앱에서 켜 둔 아침 운세 알림은 그 시각 그대로 이어진다 */
  getNotificationSettings: async (): Promise<NotificationSettings> => {
    const saved = await getJSON<NotificationSettings | LegacyNotificationSettings>(deviceKey('notification'));
    if (!saved) return { fortune: false, minute: DEFAULT_FORTUNE_MINUTE, marketing: false };
    if ('fortune' in saved) return saved;
    return { fortune: saved.enabled, minute: saved.hour * 60 + (saved.minute ?? 0), marketing: false };
  },
  saveNotificationSettings: (s: NotificationSettings) => AsyncStorage.setItem(deviceKey('notification'), JSON.stringify(s)),
  getNotificationPrompt: async (): Promise<NotificationPromptRecord> =>
    (await getJSON<NotificationPromptRecord>(deviceKey('notificationPrompt'))) ?? { count: 0, lastAt: 0 },
  saveNotificationPrompt: (r: NotificationPromptRecord) => AsyncStorage.setItem(deviceKey('notificationPrompt'), JSON.stringify(r)).catch(() => {}),
  /** 이 기기에서 마지막으로 로그인한 방법 ('email' · 'kakao' …) — 로그인 화면의 '최근 로그인' 말풍선 */
  getLastLogin: () => AsyncStorage.getItem(deviceKey('lastLogin')).catch(() => null),
  setLastLogin: (method: string) => AsyncStorage.setItem(deviceKey('lastLogin'), method).catch(() => {}),
};
