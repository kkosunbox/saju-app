/**
 * 아침 운세 알림 — 서버가 앱 푸시로 보낸다 (push.native.ts). 앱은 켜고 끈 상태를 이 기기에 두고,
 * 켤 때 알림 권한을 받아 기기를 서버에 등록한다. 보낼 시간은 아직 서버로 가지 않는다 (아침 발송은 서버 작업).
 * 웹은 앱 푸시가 없어 상태만 저장한다.
 */
import { Platform } from 'react-native';
import { storage, NotificationSettings } from './storage/storageService';
import { push } from './push';

const TEMPLATES = [
  (n: string) => `${n}님, 오늘은 어떤 운을 PICK하시겠어요?`,
  () => '오늘의 운이 도착했어요. 하나만 PICK해 볼까요?',
  (n: string) => `${n}님의 오늘 키워드가 나왔어요.`,
];

export const notificationService = {
  buildMessage(nickname: string, date = new Date()) {
    return TEMPLATES[date.getDate() % TEMPLATES.length](nickname);
  },
  /** 화면에 보일 상태: 앱은 켜 두었어도 알림 권한이 없으면 꺼진 것으로 */
  async load(): Promise<NotificationSettings> {
    const settings = await storage.getNotificationSettings();
    if (Platform.OS === 'web' || !settings.enabled) return settings;
    return { ...settings, enabled: (await push.permission()) === 'granted' };
  },
  /** 켜면 권한을 받아 등록하고, 끄면 이 기기를 뗀다. blocked: 권한이 거절돼 설정 앱에서 켜야 한다 */
  async apply(next: NotificationSettings): Promise<{ settings: NotificationSettings; blocked: boolean }> {
    if (Platform.OS === 'web') {
      await storage.saveNotificationSettings(next);
      return { settings: next, blocked: false };
    }
    if (!next.enabled) {
      await storage.saveNotificationSettings(next);
      await push.unregister();
      return { settings: next, blocked: false };
    }
    const granted = await push.enable();
    const settings = { ...next, enabled: granted };
    await storage.saveNotificationSettings(settings);
    return { settings, blocked: !granted && (await push.permission()) === 'denied' };
  },
};
