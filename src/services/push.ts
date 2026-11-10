/** 웹은 앱 푸시가 없다 (push.native.ts가 앱). */
export type PushPermission = 'granted' | 'denied' | 'undetermined';

export const push = {
  permission: async (): Promise<PushPermission> => 'denied',
  enable: async (_dailyFortuneMinute: number | null): Promise<boolean> => false,
  sync: async (): Promise<void> => {},
  unregister: async (): Promise<void> => {},
  wasNotified: async (_contentKey: string): Promise<boolean> => false,
  devScheduleReadingDone: async (_contentKey: string, _seconds: number): Promise<boolean> => false,
};

export function usePushOpenRouting(_ready: boolean): void {}
