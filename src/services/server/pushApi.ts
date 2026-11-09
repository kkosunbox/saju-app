/** 푸시 받을 기기 등록·해제와 이벤트·혜택 알림 동의 (게스트도 가능). 스키마를 다시 만들기 전이라 requestData로 부른다. */
import { requestData } from '../../api/client';

export interface PushMarketing { agreed: boolean; agreedAt: string | null }

export const pushApi = {
  /** dailyFortuneMinute: 오늘의 운세 알림 시각 (자정부터 분). null이면 운세 알림은 끄고 이벤트 알림만 */
  register: (token: string, platform: 'ios' | 'android', dailyFortuneMinute: number | null) =>
    requestData('/v1/push/devices', { token, platform, dailyFortuneMinute }, 'PUT'),
  unregister: (token: string) => requestData(`/v1/push/devices/${encodeURIComponent(token)}`, undefined, 'DELETE'),
  getMarketing: () => requestData<PushMarketing>('/v1/push/marketing'),
  setMarketing: (agreed: boolean) => requestData<PushMarketing>('/v1/push/marketing', { agreed }, 'PUT'),
};
