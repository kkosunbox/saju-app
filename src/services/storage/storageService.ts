/**
 * 저장소 추상화. 지금은 AsyncStorage, 향후 Supabase/Firebase 구현체로 교체.
 * 테이블 매핑: users / daily_fortunes / compatibilities
 * 계정마다 데이터를 나눠 저장한다(onulna:a:<계정ID>:…). 온보딩 완료 여부만 기기 단위.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompatibilityResult, DailyFortune, User } from '../../types';

export interface NotificationSettings { enabled: boolean; hour: number; minute: number }

export interface StorageRepository {
  getUser(): Promise<User | null>;
  saveUser(user: User): Promise<void>;
  getOnboarded(): Promise<boolean>;
  setOnboarded(v: boolean): Promise<void>;
  getDailyFortune(userId: string, date: string): Promise<DailyFortune | null>;
  saveDailyFortune(f: DailyFortune): Promise<void>;
  getCompatibilities(userId: string): Promise<CompatibilityResult[]>;
  saveCompatibility(c: CompatibilityResult): Promise<void>;
  getNotificationSettings(): Promise<NotificationSettings>;
  saveNotificationSettings(s: NotificationSettings): Promise<void>;
  clearAll(): Promise<void>;
}

let scope = 'guest';
/** 로그인한 계정으로 저장 범위를 바꾼다 */
export function setStorageScope(accountId: string | null) { scope = accountId ?? 'guest'; }
/** 현재 계정 범위의 저장 키 */
export const scopedKey = (k: string) => `onulna:a:${scope}:${k}`;

const K = {
  user: () => scopedKey('user'),
  onboarded: 'onulna:onboarded',
  fortune: (u: string, d: string) => scopedKey(`fortune:${u}:${d}`),
  compat: (u: string) => scopedKey(`compat:${u}`),
  noti: () => scopedKey('notification'),
};

async function getJSON<T>(key: string): Promise<T | null> {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
const setJSON = (key: string, v: unknown) => AsyncStorage.setItem(key, JSON.stringify(v));

export const storage: StorageRepository = {
  getUser: () => getJSON<User>(K.user()),
  saveUser: u => setJSON(K.user(), u),
  getOnboarded: async () => (await AsyncStorage.getItem(K.onboarded)) === '1',
  setOnboarded: v => AsyncStorage.setItem(K.onboarded, v ? '1' : '0'),
  getDailyFortune: (u, d) => getJSON<DailyFortune>(K.fortune(u, d)),
  saveDailyFortune: f => setJSON(K.fortune(f.userId, f.date), f),
  getCompatibilities: async u => (await getJSON<CompatibilityResult[]>(K.compat(u))) ?? [],
  saveCompatibility: async c => {
    const list = (await getJSON<CompatibilityResult[]>(K.compat(c.userId))) ?? [];
    await setJSON(K.compat(c.userId), [c, ...list].slice(0, 20));
  },
  getNotificationSettings: async () => (await getJSON<NotificationSettings>(K.noti())) ?? { enabled: true, hour: 8, minute: 0 },
  saveNotificationSettings: s => setJSON(K.noti(), s),
  /** 현재 계정의 프로필·운세·포인트 등 모든 데이터를 지운다(계정 자체는 남김) */
  clearAll: async () => {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter(k => k.startsWith(scopedKey(''))));
  },
};
