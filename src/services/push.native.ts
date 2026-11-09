/**
 * 앱 푸시 (expo-notifications). 서버가 Expo를 거쳐 APNs·FCM으로 보내고, 앱은 권한을 받아 Expo 토큰을 서버에 맡긴다.
 * - 권한은 알림을 켤 때만 묻는다 — 마이 메뉴 토글, 오늘의 운세를 뽑은 뒤의 권유 시트 (앱을 열자마자 묻지 않는다)
 * - 오늘의 운세 알림이나 이벤트·혜택 알림 중 하나라도 켜져 있으면 기기를 등록한다. 운세 시각도 함께 보낸다
 * - 허용된 기기는 앱을 열 때·계정이 바뀔 때마다 다시 등록한다 (토큰이 바뀌거나 다른 계정으로 로그인해도 맞춰진다)
 * - 로그아웃하면 이 기기를 그 계정에서 떼어 낸다
 */
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { pushApi } from './server/pushApi';
import { storage } from './storage/storageService';

export type PushPermission = 'granted' | 'denied' | 'undetermined';

// 앱을 보고 있을 때 온 알림도 배너로 보여 준다
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
let token: string | null = null;

/** 안드로이드 13+는 채널이 있어야 권한 창이 뜬다 */
async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', { name: '운Pick 알림', importance: AndroidImportance.DEFAULT });
}

/** 시뮬레이터·에뮬레이터는 원격 푸시 토큰을 받을 수 없다 */
async function getToken(): Promise<string | null> {
  if (!Device.isDevice || !projectId) return null;
  token ??= (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return token;
}

/** dailyFortuneMinute: 오늘의 운세 알림 시각, null이면 운세 알림 끔 (이벤트 알림만) */
async function register(dailyFortuneMinute: number | null): Promise<boolean> {
  const t = await getToken();
  if (!t) return false;
  await pushApi.register(t, Platform.OS === 'ios' ? 'ios' : 'android', dailyFortuneMinute);
  return true;
}

export const push = {
  permission: async (): Promise<PushPermission> => (await Notifications.getPermissionsAsync()).status as PushPermission,

  /** 알림을 켤 때: 권한을 묻고(처음 한 번) 허용되면 등록. 거절됐으면 false (설정 앱에서 켜야 한다) */
  async enable(dailyFortuneMinute: number | null): Promise<boolean> {
    await ensureChannel();
    let { status, canAskAgain } = await Notifications.getPermissionsAsync();
    if (status !== 'granted' && canAskAgain) ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return false;
    return register(dailyFortuneMinute).catch(() => false);
  },

  /**
   * 앱을 열 때·계정이 바뀔 때: 알림을 하나라도 켜 두고 권한도 있으면 다시 등록 (권한은 묻지 않는다).
   * 이벤트·혜택 동의는 계정마다 달라서 서버 값으로 맞춘다
   */
  async sync(): Promise<void> {
    try {
      if ((await Notifications.getPermissionsAsync()).status !== 'granted') return;
      let settings = await storage.getNotificationSettings();
      const marketing = (await pushApi.getMarketing().catch(() => null))?.agreed ?? settings.marketing;
      if (marketing !== settings.marketing) {
        settings = { ...settings, marketing };
        await storage.saveNotificationSettings(settings);
      }
      if (!settings.fortune && !settings.marketing) return;
      await ensureChannel();
      await register(settings.fortune ? settings.minute : null);
    } catch {
      // 다음에 앱을 열 때 다시
    }
  },

  /** 알림을 모두 끌 때·로그아웃 전: 이 기기를 지금 계정에서 뗀다 */
  async unregister(): Promise<void> {
    try {
      if ((await Notifications.getPermissionsAsync()).status !== 'granted') return;
      const t = await getToken();
      if (t) await pushApi.unregister(t);
    } catch {
      // 서버가 Expo의 DeviceNotRegistered로도 정리한다
    }
  },
};

/** 알림을 눌러 앱이 열리면 data.url 화면으로 (ready: 첫 화면이 준비된 뒤) */
export function usePushOpenRouting(ready: boolean): void {
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || !response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const id = response.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    const url = response.notification.request.content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) router.push(url as Href);
  }, [ready, response]);
}
