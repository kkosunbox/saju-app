/** 푸시 받을 기기 등록·해제 (게스트도 가능). 스키마를 다시 만들기 전이라 requestData로 부른다. */
import { requestData } from '../../api/client';

export const pushApi = {
  register: (token: string, platform: 'ios' | 'android') => requestData('/v1/push/devices', { token, platform }, 'PUT'),
  unregister: (token: string) => requestData(`/v1/push/devices/${encodeURIComponent(token)}`, undefined, 'DELETE'),
};
