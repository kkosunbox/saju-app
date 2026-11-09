/**
 * 알림 설정 — 오늘의 운세 알림과 이벤트·혜택 알림 두 가지.
 * - 오늘의 운세: 이 기기에 켜고 끈 상태와 시각을 두고, 기기를 등록할 때 시각을 서버에 보낸다. 서버가 그 시각에 보낸다.
 * - 이벤트·혜택: 광고성 정보라 계정 단위 동의를 서버에 남긴다 (PUT /push/marketing). 처음엔 꺼져 있다.
 * 하나라도 켜져 있으면 알림 권한을 받아 기기를 등록하고, 둘 다 끄면 기기를 뗀다.
 * 웹은 앱 푸시가 없어 마이 메뉴에서 켜지 않고 앱 안내만 보여 준다.
 */
import { Platform } from 'react-native';
import { storage, NotificationSettings, DEFAULT_FORTUNE_MINUTE } from './storage/storageService';
import { push } from './push';
import { pushApi } from './server/pushApi';

export type { NotificationSettings };
export { DEFAULT_FORTUNE_MINUTE };

/** 고를 수 있는 시각: 오전 6시~오후 10시, 30분 단위 (서버와 같은 범위) */
export const FORTUNE_MINUTES: number[] = Array.from({ length: (22 - 6) * 2 + 1 }, (_, i) => 6 * 60 + i * 30);

/** 480 → '오전 8:00', 750 → '오후 12:30' */
export function formatMinute(m: number): string {
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}:${mm}`;
}

/** 수신 동의·철회 처리 결과 안내 (정보통신망법) */
export function marketingNotice(agreed: boolean, at = new Date()): string {
  const date = `${at.getFullYear()}년 ${at.getMonth() + 1}월 ${at.getDate()}일`;
  return agreed ? `${date} 이벤트·혜택 알림 수신에 동의했어요` : `${date} 이벤트·혜택 알림 수신 동의를 철회했어요`;
}

const native = Platform.OS !== 'web';

export interface ApplyResult {
  settings: NotificationSettings;
  /** 이 기기가 지금 알림을 받을 수 있게 등록됐다 (켜진 알림이 없으면 false) */
  registered: boolean;
  /** 알림 권한이 거절돼 설정 앱에서 켜야 한다 */
  blocked: boolean;
  /** 이벤트·혜택 동의가 바뀌었으면 그 결과 안내 */
  notice?: string;
}

/**
 * 둘 중 하나라도 켜져 있으면 권한을 받아 등록, 둘 다 꺼지면 기기를 뗀다.
 * 권한이 없거나 등록이 실패해도 사용자가 고른 설정은 그대로 둔다 — 마이 메뉴가 권한 안내를 보여 주고,
 * 권한이 생기면 앱을 열 때(push.sync) 그 설정대로 등록된다
 */
async function syncDevice(next: NotificationSettings): Promise<{ registered: boolean; blocked: boolean }> {
  if (!native) return { registered: false, blocked: false };
  if (!next.fortune && !next.marketing) {
    await push.unregister();
    return { registered: false, blocked: false };
  }
  const registered = await push.enable(next.fortune ? next.minute : null);
  return { registered, blocked: !registered && (await push.permission()) === 'denied' };
}

export const notificationService = {
  /** 화면에 보일 상태: 운세 알림은 이 기기에 고른 그대로, 이벤트·혜택은 서버 동의 값으로 (OS 권한은 permission()으로 따로) */
  async load(): Promise<NotificationSettings> {
    const saved = await storage.getNotificationSettings();
    const marketing = (await pushApi.getMarketing().catch(() => null))?.agreed ?? saved.marketing;
    const settings = { ...saved, marketing };
    if (marketing !== saved.marketing) await storage.saveNotificationSettings(settings);
    return settings;
  },

  /** 앱으로 돌아왔을 때: 설정 앱에서 권한을 켜고 왔으면 지금 설정대로 등록한다 */
  resync: () => push.sync(),

  /** 운세 알림 켜기·끄기·시각 바꾸기, 이벤트·혜택 동의 바꾸기를 한 번에 */
  async apply(prev: NotificationSettings, next: NotificationSettings): Promise<ApplyResult> {
    let notice: string | undefined;
    let marketing = next.marketing;
    if (next.marketing !== prev.marketing) {
      try {
        const res = await pushApi.setMarketing(next.marketing);
        marketing = res.agreed;
        notice = marketingNotice(res.agreed, res.agreedAt ? new Date(res.agreedAt) : new Date());
      } catch {
        marketing = prev.marketing; // 서버에 남기지 못하면 바꾸지 않는다
      }
    }
    const settings = { ...next, marketing };
    await storage.saveNotificationSettings(settings);
    const { registered, blocked } = await syncDevice(settings);
    return { settings, registered, blocked, notice };
  },

  /** 지금 OS 알림 권한 (웹은 늘 denied) */
  permission: () => push.permission(),

  /**
   * 알림 권한만 다시 받는다 — 이벤트·혜택에 동의했는데 권한이 없을 때 (다른 기기·웹에서 동의하고 이 기기는 처음 등).
   * 허용되면 지금 설정대로 기기를 등록한다. blocked: 권한을 거절해 설정 앱에서 켜야 한다
   */
  async enablePermission(settings: NotificationSettings): Promise<{ granted: boolean; blocked: boolean }> {
    if (!native) return { granted: false, blocked: false };
    const granted = await push.enable(settings.fortune ? settings.minute : null);
    return { granted, blocked: !granted && (await push.permission()) === 'denied' };
  },

  /** 마이 메뉴에서 운세 알림 토글을 직접 만졌다 — 권유 시트는 스스로 정하지 않은 사람에게만 띄운다 */
  async markDecided(): Promise<void> {
    const record = await storage.getNotificationPrompt();
    if (!record.decided) await storage.saveNotificationPrompt({ ...record, decided: true });
  },

  /**
   * 오늘의 운세를 뽑은 뒤 알림 권유 시트를 띄울지. 앱에서만, 운세 알림이 꺼져 있고 권한을 영구 거절하지 않았을 때.
   * 마이 메뉴에서 운세 알림을 직접 켜거나 끈 적이 있으면 띄우지 않는다 (본인이 이미 정했다).
   * 처음 한 번, '나중에'를 고르면 3일 뒤 한 번 더 (최대 2번)
   */
  async shouldPrompt(now = Date.now()): Promise<boolean> {
    if (!native) return false;
    const [settings, record, permission] = await Promise.all([storage.getNotificationSettings(), storage.getNotificationPrompt(), push.permission()]);
    if (record.decided || permission === 'denied') return false;
    if (settings.fortune) return false; // 이미 켰다 (권한이 없으면 마이 메뉴가 안내한다)
    if (record.count >= 2) return false;
    return record.count === 0 || now - record.lastAt >= 3 * 24 * 3600_000;
  },
  async markPrompted(now = Date.now()): Promise<void> {
    const record = await storage.getNotificationPrompt();
    await storage.saveNotificationPrompt({ count: record.count + 1, lastAt: now });
  },
};
