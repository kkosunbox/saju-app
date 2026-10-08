/**
 * 아침 운세 알림 (MVP: Mock)
 * 실제 연결: `npx expo install expo-notifications` 후 schedule()의 TODO 부분을
 * Notifications.scheduleNotificationAsync({ trigger: { hour, minute, repeats: true } })로 교체.
 */
import { storage, NotificationSettings } from './storage/storageService';

const TEMPLATES = [
  (n: string) => `${n}님, 오늘의 운세가 도착했어요 🔮`,
  () => '오늘 당신에게 가장 강한 운은 무엇일까요?',
  (n: string) => `${n}님의 오늘 키워드, 확인해볼까요? ✨`,
];

export const notificationService = {
  buildMessage(nickname: string, date = new Date()) {
    return TEMPLATES[date.getDate() % TEMPLATES.length](nickname);
  },
  async schedule(settings: NotificationSettings, nickname: string) {
    await storage.saveNotificationSettings(settings);
    // TODO(expo-notifications): 권한 요청 + 매일 반복 알림 예약
    console.log('[notification:mock]', settings.enabled ? `매일 ${settings.hour}:${String(settings.minute).padStart(2, '0')}` : 'off', this.buildMessage(nickname));
  },
};
